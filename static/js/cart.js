// Enhanced Cart functionality with Address Management - GokhaleBandhu Version
let cart = []
let userDetails = {}
let selectedAddress = null
let savedAddresses = []

const pincodes = {
  available: [
    "411032",
    "411046",
    "411051",
    "411007",
    "411027",
    "411002",
    "411045",
    "411021",
    "411042",
    "411038",
    "411004",
    "411052",
    "411011",
    "413130",
    "411003",
    "411030",
    "411037",
    "411016",
    "411028",
    "411036",
    "411048",
    "411041",
    "411009",
    "412108",
    "410512",
    "412303",
    "411017",
    "411001",
    "411020",
    "411023",
    "411005",
    "411057",
    "411058",
    "411006",
    "412106",
    "411015",
    "400001",
    "400002",
    "400003",
    "400004",
    "400005",
    "400006",
    "400007",
    "400008",
    "400009",
    "400010",
    "400011",
    "400012",
    "400013",
    "400014",
    "400015",
    "400016",
    "400017",
    "400018",
    "400019",
    "400020",
    "110001",
    "110002",
    "110003",
    "110004",
    "110005",
    "110006",
    "110007",
    "560001",
    "560002",
    "560003",
    "560004",
    "560005",
    "560006",
    "560007",
  ],
}

document.addEventListener("DOMContentLoaded", async () => {
  // Load cart from localStorage immediately for instant display
  loadCartFromStorage()

  // Load user and render cart
  await loadUserDetails()

  // Then fetch updates in background
  fetchCartFromBackend()
})
// ✅ Universal authenticated fetch (User)
async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token") || localStorage.getItem("userToken")

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // optional, safe for cookies
  })

  // Optional auto logout on auth failure
  if (response.status === 401) {
    showToast("Session expired. Please login again.", "error")
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setTimeout(() => (window.location.href = "/login"), 1500)
    throw new Error("Unauthorized")
  }

  return response
}

function loadCartFromStorage() {
  try {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      cart = JSON.parse(savedCart)
    }
  } catch (error) {
    console.error("Error loading cart from storage:", error)
    cart = []
  }
}

async function loadUserDetails() {
  try {
    const user = JSON.parse(localStorage.getItem("user"))

    if (user) {
      userDetails = user
      await loadSavedAddresses()
    } else {
      userDetails = {
        id: 1,
      } // Default ID if no user
    }
  } catch (error) {
    console.error("Error loading user details:", error)
    userDetails = {
      id: 1,
    }
  }

  // Render cart after loading user details
  renderCart()
}

async function loadSavedAddresses() {
  try {
    const response = await authFetch(`/api/user/addresses?id=${userDetails.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (response.ok) {
      const data = await response.json()

      if (Array.isArray(data)) {
        savedAddresses = data
      } else if (data && Array.isArray(data.addresses)) {
        savedAddresses = data.addresses
      } else {
        savedAddresses = []
      }

      // Restore selected address from localStorage
      const storedAddressId = localStorage.getItem("selectedAddressId")
      if (storedAddressId && savedAddresses.length > 0) {
        const storedAddress = savedAddresses.find((addr) => addr.id == storedAddressId)
        if (storedAddress) {
          selectedAddress = storedAddress
        }
      }

      // Auto-select first address if none selected
      if (!selectedAddress && savedAddresses.length > 0) {
        selectedAddress = savedAddresses[0]
        localStorage.setItem("selectedAddressId", selectedAddress.id)
      }
    }
  } catch (error) {
    console.error("Error loading saved addresses:", error)
    savedAddresses = []
  }
}

async function fetchCartFromBackend() {
  try {
    const response = await authFetch("/cart")
    const contentType = response.headers.get("content-type")

    if (!contentType || !contentType.includes("application/json")) {
      console.warn("Cart endpoint returned non-JSON response, using localStorage")
      return
    }

    const data = await response.json()
    if (Array.isArray(data)) {
      cart = data
      localStorage.setItem("cart", JSON.stringify(cart))
      renderCart()
      updateMobileCartCount()
    }
  } catch (error) {
    console.error("Error fetching cart:", error)
  }
}

function renderCart() {
  const cartContent = document.getElementById("cartContent")
  updateMobileCartCount()

  if (cart.length === 0) {
    cartContent.innerHTML = `
      <div class="empty-cart">
        <div class="empty-cart-icon">
          <i class="fas fa-shopping-cart"></i>
        </div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added any items to your cart yet.</p>
        <a href="/products" class="browse-products-btn">
          <i class="fas fa-shopping-bag"></i> Browse Products
        </a>
      </div>
    `
    return
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  // const savings = cart.reduce(
  //   (sum, item) => sum + ((item.original_price || item.price + 20) - item.price) * item.quantity,
  //   0,
  // )
  const shipping = subtotal >= 1800 ? 0 : 90
  const total = subtotal + shipping
  const isReadyForCheckout = selectedAddress !== null

  cartContent.innerHTML = `
    <div class="cart-layout">
      <!-- Cart Items Section -->
      <div class="cart-main-section">
        <div class="cart-items-section">
          <div class="cart-header">
            <h2 class="cart-title">
              <i class="fas fa-shopping-cart"></i> Shopping Cart (${cart.reduce((sum, item) => sum + item.quantity, 0)} item${cart.reduce((sum, item) => sum + item.quantity, 0) !== 1 ? "s" : ""})
            </h2>
            <button class="remove-all-btn" onclick="clearCart()">
              <i class="fas fa-trash"></i> Remove all
            </button>
          </div>

          <div class="cart-items">
            ${cart
              .map(
                (item) => `
            <div class="cart-item">
              <div class="item-image">
                ${
                  item.image
                    ? `<img src="${item.image}" alt="${item.name || item.item_name}">`
                    : `<div class="placeholder">${item.icon || "🛍️"}</div>`
                }
              </div>

              <div class="item-details">
                <div class="item-name">${item.name || item.item_name}</div>
                <div class="item-variant">₹${item.price.toFixed(2)} each</div>
              </div>

              <div class="item-controls">
                <div class="item-pricing">
                  <div class="item-price">₹${(item.price * item.quantity).toFixed(2)}</div>
                  
                </div>

                <div class="quantity-controls">
                  <button class="quantity-btn decrease" onclick="updateQuantity(${item.id}, -1)">
                    ${item.quantity === 1 ? '<i class="fas fa-trash"></i>' : "-"}
                  </button>
                  <input type="number" class="quantity-display" value="${item.quantity}" readonly>
                  <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">
                    +
                  </button>
                </div>
              </div>
            </div>
          `,
              )
              .join("")}
          </div>
        </div>

        <!-- Address Section -->
        <div class="address-section">
          <div class="address-header">
            <h3 class="address-title">
              <i class="fas fa-map-marker-alt"></i> Delivery Address
            </h3>
            <button class="change-address-btn" onclick="openAddressModal()">
              <i class="fas fa-edit"></i> ${selectedAddress ? "Change" : "Add"} Address
            </button>
          </div>

          <div class="address-content">
            ${renderSelectedAddress()}
          </div>
        </div>
      </div>

      <!-- Price Summary Sidebar -->
      <aside class="price-summary">
        <h3 class="summary-title">Order Summary</h3>

        <div class="delivery-date-section">
          <h4><i class="fas fa-calendar-alt"></i> Expected Delivery</h4>
          <input type="date" id="deliveryDate" class="delivery-date-input" onchange="updateDeliveryDate()">
          <div class="delivery-date-info">
            <i class="fas fa-info-circle"></i> Optional: 2-20 days from today
          </div>
        </div>

        <div class="summary-row">
          <span>Subtotal</span>
          <span class="amount">₹${subtotal.toFixed(2)}</span>
        </div>

        <div class="summary-row">
          <span>Delivery Fee</span>
          <span class="amount ${shipping === 0 ? "free" : "extra"}">
            ${shipping === 0 ? "FREE" : "₹" + shipping.toFixed(2)}
          </span>
        </div>

       

        <div class="summary-row total">
          <span>Total</span>
          <span class="amount">₹${total.toFixed(2)}</span>
        </div>

        ${
          subtotal >= 1800
            ? `
        <div class="free-delivery-badge">
          <i class="fas fa-truck"></i> You got FREE delivery!
        </div>
      `
            : `
        <div class="delivery-progress">
          <div class="progress-text">Add ₹${(1800 - subtotal).toFixed(2)} more for FREE delivery</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.min((subtotal / 1800) * 100, 100)}%"></div>
          </div>
        </div>
      `
        }

        <button class="checkout-btn ${isReadyForCheckout ? "enabled" : "disabled"}" 
                onclick="proceedToCheckout()" 
                ${!isReadyForCheckout ? "disabled" : ""}>
          <i class="fas fa-${isReadyForCheckout ? "lock" : "map-marker-alt"}"></i>
          ${!isReadyForCheckout ? "Add Address to Continue" : "Proceed to Checkout"}
        </button>

        ${
          !isReadyForCheckout
            ? `
        <div class="checkout-help">
          <i class="fas fa-info-circle"></i> Please add a delivery address to continue
        </div>
      `
            : `
        <div class="checkout-ready">
          <i class="fas fa-check-circle"></i> Ready for checkout
        </div>
      `
        }
      </aside>
    </div>
  `

  initializeDeliveryDatePicker()
}

function renderSelectedAddress() {
  if (!selectedAddress) {
    return `
      <div class="no-address">
        <div class="no-address-icon">
          <i class="fas fa-map-marker-alt"></i>
        </div>
        <p>No delivery address selected</p>
        <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.5rem;">
          Please add or select a delivery address to continue
        </p>
      </div>
    `
  }

  return `
    <div class="selected-address">
      <div class="address-info">
        <div class="address-type-badge">
          <i class="fas fa-${selectedAddress.type === "home" ? "home" : selectedAddress.type === "office" ? "building" : "map-marker-alt"}"></i>
          ${(selectedAddress.type || "home").charAt(0).toUpperCase() + (selectedAddress.type || "home").slice(1)}
        </div>
        <div class="address-details">
          <p class="address-line">${selectedAddress.line1}</p>
          ${selectedAddress.line2 ? `<p class="address-line">${selectedAddress.line2}</p>` : ""}
          <p class="address-line">${selectedAddress.city}, ${selectedAddress.state} - ${selectedAddress.pincode}</p>
        </div>
      </div>
      
      <div class="address-selected-badge">
        <i class="fas fa-check-circle"></i> Selected
      </div>
    </div>
  `
}

function initializeDeliveryDatePicker() {
  const deliveryDateInput = document.getElementById("deliveryDate")
  if (!deliveryDateInput) return

  const today = new Date()
  const minDate = new Date(today)
  minDate.setDate(today.getDate() + 2)

  const maxDate = new Date(today)
  maxDate.setDate(today.getDate() + 20)

  deliveryDateInput.min = minDate.toISOString().split("T")[0]
  deliveryDateInput.max = maxDate.toISOString().split("T")[0]

  const defaultDate = new Date(today)
  defaultDate.setDate(today.getDate() + 3)
  deliveryDateInput.value = defaultDate.toISOString().split("T")[0]

  localStorage.setItem("selectedDeliveryDate", deliveryDateInput.value)
}

function updateDeliveryDate() {
  const deliveryDate = document.getElementById("deliveryDate")?.value
  if (deliveryDate) {
    localStorage.setItem("selectedDeliveryDate", deliveryDate)
    showToast("Delivery date updated", "success")
  }
}

// Add item to cart
async function addToCart(productId, productData) {
  try {
    const existingItem = cart.find((item) => item.id === productId)

    if (existingItem) {
      await updateQuantity(productId, 1)
      showToast(`${productData.name} quantity increased`, "success")
      return
    }

    const response = await authFetch("/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id: productId,
        quantity: 1,
        ...productData,
      }),
    })

    if (!response.ok) throw new Error("Failed to add item to cart")

    await fetchCartFromBackend()
    showToast(`${productData.name} added to cart`, "success")
  } catch (error) {
    console.error("Error adding to cart:", error)

    const existingItem = cart.find((item) => item.id === productId)
    if (existingItem) {
      existingItem.quantity += 1
      showToast(`${productData.name} quantity increased`, "success")
    } else {
      cart.push({
        id: productId,
        quantity: 1,
        ...productData,
      })
      showToast(`${productData.name} added to cart`, "success")
    }

    localStorage.setItem("cart", JSON.stringify(cart))
    renderCart()
    updateCartCount()
    updateMobileCartCount()
  }
}

async function updateQuantity(productId, change) {
  try {
    const itemIndex = cart.findIndex((item) => item.id === productId)

    if (itemIndex !== -1) {
      cart[itemIndex].quantity += change

      if (cart[itemIndex].quantity <= 0) {
        cart.splice(itemIndex, 1)
        showToast("Item removed from cart", "success")
      } else {
        showToast("Cart updated", "success")
      }

      localStorage.setItem("cart", JSON.stringify(cart))
      renderCart()
    }
  } catch (error) {
    console.error("Error updating quantity:", error)
  }
}

async function clearCart() {
  if (confirm("Are you sure you want to remove all items from your cart?")) {
    cart = []
    localStorage.setItem("cart", JSON.stringify(cart))
    showToast("Cart cleared", "success")
    renderCart()
  }
}

function openAddressModal() {
  const modal = document.getElementById("addressModal")
  modal.classList.add("active")
  document.body.style.overflow = "hidden"
  renderAddressModal()
}

function closeAddressModal() {
  const modal = document.getElementById("addressModal")
  modal.classList.remove("active")
  document.body.style.overflow = ""
}

function renderAddressModal() {
  const modalBody = document.querySelector(".address-modal-body")

  modalBody.innerHTML = `
    <div class="address-form-section">
      <h4>Add New Address</h4>
      <div class="form-grid">
        <div class="form-group full-width">
          <label for="addressLine1">Address Line 1 *</label>
          <input type="text" id="addressLine1" placeholder="House/Flat No, Building Name">
        </div>
        <div class="form-group full-width">
          <label for="addressLine2">Address Line 2</label>
          <input type="text" id="addressLine2" placeholder="Street, Area, Landmark">
        </div>
        <div class="form-group">
          <label for="city">City *</label>
          <input type="text" id="city" placeholder="Enter city">
        </div>
        <div class="form-group">
          <label for="state">State *</label>
          <input type="text" id="state" placeholder="Enter state">
        </div>
        <div class="form-group full-width">
          <label for="pincodeInput">Pincode *</label>
          <div class="pincode-input-wrapper">
            <input type="text" id="pincodeInput" placeholder="Enter 6-digit pincode" oninput="checkPincode()">
            <span id="pincodeStatus" class="pincode-status"></span>
          </div>
          <div id="pincodeError" class="pincode-error" style="display: none;">
            Delivery not available in your area
          </div>
        </div>
        <div class="form-group">
          <label for="addressType">Address Type</label>
          <select id="addressType">
            <option value="home">Home</option>
            <option value="office">Office</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <button class="add-address-btn" onclick="addNewAddress()">
        <i class="fas fa-plus"></i> Add Address
      </button>
    </div>

    <div class="saved-addresses-section">
      <h4>Saved Addresses (${savedAddresses.length})</h4>
      <div id="savedAddressesList">
        ${renderSavedAddresses()}
      </div>
    </div>
  `
}

function checkPincode() {
  const pincodeInput = document.getElementById("pincodeInput")
  const pincodeStatus = document.getElementById("pincodeStatus")
  const pincodeError = document.getElementById("pincodeError")
  const pincode = pincodeInput.value.trim()

  if (pincode.length === 6) {
    if (pincodes.available.includes(pincode)) {
      pincodeStatus.textContent = "✅"
      pincodeError.style.display = "none"
      pincodeInput.style.borderColor = "#10b981"
    } else {
      pincodeStatus.textContent = "❌"
      pincodeError.style.display = "block"
      pincodeInput.style.borderColor = "#ef4444"
    }
  } else {
    pincodeStatus.textContent = ""
    pincodeError.style.display = "none"
    pincodeInput.style.borderColor = "#e2e8f0"
  }
}

function renderSavedAddresses() {
  if (!savedAddresses || savedAddresses.length === 0) {
    return `
      <div class="no-saved-addresses">
        <i class="fas fa-home"></i>
        <p>No saved addresses yet</p>
      </div>
    `
  }

  return savedAddresses
    .map(
      (address, index) => `
      <div class="saved-address-item ${
        selectedAddress && selectedAddress.id === address.id ? "selected" : ""
      }" onclick="selectSavedAddress(${index})">
        <div class="address-item-content">
          <div class="address-type-badge">
            <i class="fas fa-${address.type === "home" ? "home" : address.type === "office" ? "building" : "map-marker-alt"}"></i>
            ${(address.type || "home").charAt(0).toUpperCase() + (address.type || "home").slice(1)}
          </div>
          <div class="address-details">
            <p class="address-line">${address.line1}</p>
            ${address.line2 ? `<p class="address-line">${address.line2}</p>` : ""}
            <p class="address-line">${address.city}, ${address.state} - ${address.pincode}</p>
          </div>
          ${
            selectedAddress && selectedAddress.id === address.id
              ? `
            <div class="selected-indicator">
              <i class="fas fa-check-circle"></i> Selected
            </div>
          `
              : `
            <div class="select-indicator">
              <i class="fas fa-circle"></i> Click to Select
            </div>
          `
          }
        </div>
        <div class="address-actions">
          <button class="delete-address-btn" onclick="deleteAddress(${index}); event.stopPropagation();">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `,
    )
    .join("")
}

async function addNewAddress() {
  const line1 = document.getElementById("addressLine1")?.value.trim()
  const line2 = document.getElementById("addressLine2")?.value.trim()
  const city = document.getElementById("city")?.value.trim()
  const state = document.getElementById("state")?.value.trim()
  const pincode = document.getElementById("pincodeInput")?.value.trim()
  const type = document.getElementById("addressType")?.value

  if (!line1 || !city || !state || !pincode) {
    showToast("Please fill all required fields", "error")
    return
  }

  if (!/^\d{6}$/.test(pincode)) {
    showToast("Please enter a valid 6-digit pincode", "error")
    return
  }

  if (!pincodes.available.includes(pincode)) {
    showToast("Delivery not available in your area", "error")
    return
  }

  const newAddress = {
    id: Date.now(),
    line1,
    line2,
    city,
    state,
    pincode,
    type,
  }

  try {
    const response = await fetch("/api/user/address", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: userDetails.id,
        address: newAddress,
      }),
    })

    if (response.ok) {
      savedAddresses.push(newAddress)
      selectedAddress = newAddress
      localStorage.setItem("selectedAddressId", selectedAddress.id)

      document.getElementById("addressLine1").value = ""
      document.getElementById("addressLine2").value = ""
      document.getElementById("city").value = ""
      document.getElementById("state").value = ""
      document.getElementById("pincodeInput").value = ""

      renderAddressModal()
      renderCart()
      showToast("Address added successfully", "success")
    } else {
      showToast("Failed to save address", "error")
    }
  } catch (error) {
    console.error("Error saving address:", error)
    showToast("Error saving address", "error")
  }
}

function selectSavedAddress(index) {
  if (index >= 0 && index < savedAddresses.length) {
    selectedAddress = savedAddresses[index]
    localStorage.setItem("selectedAddressId", selectedAddress.id)
    renderAddressModal()
    renderCart()
    showToast("Address selected successfully", "success")
    setTimeout(() => closeAddressModal(), 500)
  }
}

async function deleteAddress(index) {
  if (!confirm("Are you sure you want to delete this address?")) return

  try {
    const address = savedAddresses[index]
    if (!address) return

    const response = await authFetch(`/api/user/address/${address.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address_id: address.id,
        user_id: userDetails.id,
      }),
    })

    if (response.ok) {
      savedAddresses.splice(index, 1)

      if (selectedAddress && selectedAddress.id === address.id) {
        selectedAddress = savedAddresses.length > 0 ? savedAddresses[0] : null
        if (selectedAddress) {
          localStorage.setItem("selectedAddressId", selectedAddress.id)
        } else {
          localStorage.removeItem("selectedAddressId")
        }
      }

      renderAddressModal()
      renderCart()
      showToast("Address deleted successfully", "success")
    } else {
      showToast("Failed to delete address", "error")
    }
  } catch (error) {
    console.error("Error deleting address:", error)
    showToast("Error deleting address", "error")
  }
}

async function proceedToCheckout() {
  if (cart.length === 0) {
    showToast("Your cart is empty!", "error")
    return
  }

  if (!selectedAddress) {
    showToast("Please select a delivery address", "error")
    openAddressModal()
    return
  }

  const deliveryDate = document.getElementById("deliveryDate")?.value || localStorage.getItem("selectedDeliveryDate")
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal >= 1800 ? 0 : 90
  const finalAmount = subtotal + shipping

  try {
    const orderData = {
      amount: finalAmount,
      items: cart,
      userDetails: {
        id: userDetails.id,
        name: userDetails.first_name || "Customer",
        phone: userDetails.mobile_number,
        email: userDetails.email || "customer@example.com",
      },
      deliveryAddress: selectedAddress,
      deliveryDate: deliveryDate,
      orderDate: new Date().toISOString(),
    }

    const res = await authFetch("/create-order/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    })

    const data = await res.json()

    if (!res.ok || !data.order_id) {
      throw new Error(data.detail || "Failed to create order")
    }

    // Initialize Razorpay
    const options = {
      key: data.key,
      amount: finalAmount * 100,
      currency: "INR",
      name: "Gokhale Bandhu",
      description: "Purchase Items",
      order_id: data.order_id,
      handler: async (response) => {
        try {
          const verifyRes = await authFetch("/verify-payment/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              user_details: orderData.userDetails,
              delivery_address: selectedAddress,
              delivery_date: deliveryDate,
              items: cart,
              amount: finalAmount,
            }),
          })

          const result = await verifyRes.json()

          if (verifyRes.ok && result.status === "success") {
            showToast("Payment successful! Order placed.", "success")
            cart = []
            localStorage.setItem("cart", JSON.stringify(cart))
            localStorage.removeItem("selectedDeliveryDate")

            setTimeout(() => {
              window.location.href = `/orders.html?order_id=${userDetails.id}`
            }, 2000)
          } else {
            showToast("Payment verification failed", "error")
          }
        } catch (error) {
          console.error("Verification error:", error)
          showToast("Payment verification failed", "error")
        }
      },
      prefill: {
        name: userDetails.first_name || "Customer",
        email: userDetails.email || "customer@example.com",
        contact: userDetails.mobile_number,
      },
      theme: {
        color: "#8e44ad",
      },
    }

    if (typeof window.Razorpay !== "undefined") {
      const rzp = new window.Razorpay(options)
      rzp.open()
    } else {
      showToast("Payment gateway not loaded", "error")
    }
  } catch (error) {
    console.error("Checkout error:", error)
    showToast("Error during checkout: " + error.message, "error")
  }
}

function updateMobileCartCount() {
  const mobileCartCount = document.getElementById("mobileCartCount")
  if (mobileCartCount) {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0)
    mobileCartCount.textContent = total
    mobileCartCount.style.display = total > 0 ? "flex" : "none"
  }
}

// Update cart count (for desktop header)
function updateCartCount() {
  const cartCount = document.getElementById("cartCount")
  if (cartCount) {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0)
    cartCount.textContent = total
    cartCount.style.display = total > 0 ? "flex" : "none"
  }
}

function showToast(message, type = "success") {
  const existingToasts = document.querySelectorAll(".toast")
  existingToasts.forEach((toast) => toast.remove())

  const toast = document.createElement("div")
  toast.className = `toast ${type}`
  toast.innerHTML = `
    <i class="fas fa-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"}"></i>
    ${message}
  `

  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}

function goBack() {
  window.history.back()
}

// Export functions to global scope
window.addToCart = addToCart
window.updateQuantity = updateQuantity
window.clearCart = clearCart
window.proceedToCheckout = proceedToCheckout
window.openAddressModal = openAddressModal
window.closeAddressModal = closeAddressModal
window.addNewAddress = addNewAddress
window.selectSavedAddress = selectSavedAddress
window.deleteAddress = deleteAddress
window.checkPincode = checkPincode
window.updateDeliveryDate = updateDeliveryDate
window.goBack = goBack
window.renderNoAddress = () => renderSelectedAddress() // For compatibility
window.renderCart = renderCart
window.updateMobileCartCount = updateMobileCartCount
window.updateCartCount = updateCartCount
window.showToast = showToast
