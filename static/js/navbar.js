// ==========================================
// NAVBAR FUNCTIONALITY
// ==========================================

// Global variables for navbar
let isLoggedIn = false
let selectedPincode = null
let availablePincodes = []

document.addEventListener("DOMContentLoaded", () => {
    initializeNavbar()
    checkAuthState()
})
/**
 * Initialize navbar functionality
 * Sets up cart, pincode search, and fetches pincodes
 */
function initializeNavbar() {
  initializeCart()
  updateCartDisplay()
  setupPincodeSearch()
  fetchAvailablePincodes() // Fetch pincodes from backend
  checkFirstVisit()
  checkAuthState()
}

function checkAuthState() {
  try {
    const user = JSON.parse(localStorage.getItem('user'))
    console.log(user)
    const authText = document.getElementById('authText')
    
    if (!authText) {
      console.error('Auth text element not found')
      return
    }
    
    if (user && typeof user.first_name === 'string' && user.first_name.length > 0) {
      console.log('Setting auth text to:', `Hi ${user.first_name}`)
      authText.textContent = `Hi ${user.first_name}`
      isLoggedIn = true
    } else {
      console.log('Setting auth text to: Sign In / Register')
      authText.textContent = 'Sign In / Register'
      isLoggedIn = false
    }
  } catch (err) {
    console.error('Error checking auth state:', err)
    const authText = document.getElementById('authText')
    if (authText) {
      authText.textContent = 'Sign In / Register'
    }
    isLoggedIn = false
  }
}
// ==========================================
// PINCODE MANAGEMENT
// ==========================================

/**
 * Fetch available pincodes from backend API
 * Currently using mock data, replace with actual API call
 */
async function fetchAvailablePincodes() {
  try {
    // TODO: Replace with actual backend API call
    // const response = await fetch('/api/pincodes');
    // if (!response.ok) throw new Error('Failed to fetch pincodes');
    // availablePincodes = await response.json();

    // Mock data for now - replace with actual backend call
    availablePincodes = [
      { code: "421302", area: "Amane, Maharashtra, India", deliveryAvailable: true },
      { code: "400001", area: "Fort, Mumbai, Maharashtra", deliveryAvailable: true },
    ]

    console.log("Pincodes fetched successfully:", availablePincodes)
    renderPincodeOptions()
  } catch (error) {
    console.error("Error fetching pincodes:", error)
    // Show error in pincode modal
    const pincodesList = document.getElementById("pincodesList")
    if (pincodesList) {
      pincodesList.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load available pincodes. Please try again later.</p>
                </div>
            `
    }
  }
}

/**
 * Render pincode options in the modal
 * Displays fetched pincodes from backend
 */
function renderPincodeOptions() {
  const pincodesList = document.getElementById("pincodesList")
  if (!pincodesList) return

  if (availablePincodes.length === 0) {
    pincodesList.innerHTML = `
            <div class="no-products-message">
                <i class="fas fa-map-marker-alt"></i>
                <p>No pincodes available for delivery at the moment.</p>
            </div>
        `
    return
  }

  pincodesList.innerHTML = availablePincodes
    .map(
      (pincode) => `
        <div class="pincode-option" onclick="selectPincode('${pincode.code}', '${pincode.area}')">
            <i class="fas fa-map-marker-alt"></i>
            <div class="pincode-details">
                <h5>${pincode.code}</h5>
                <p>${pincode.area}</p>
            </div>
        </div>
    `,
    )
    .join("")
}

/**
 * Check if this is user's first visit
 * Shows pincode modal if no pincode is selected
 */
function checkFirstVisit() {
  const hasVisited = localStorage.getItem("hasVisited")
  const savedPincode = localStorage.getItem("selectedPincode")

  if (!hasVisited || !savedPincode) {
    setTimeout(() => {
      openPincodeModal()
    }, 1000)
  } else {
    const savedLocation = localStorage.getItem("selectedLocation")
    updateLocationDisplay(savedPincode, savedLocation)
  }
}

/**
 * Open pincode selection modal
 */
function openPincodeModal() {
  document.getElementById("pincodeModal").classList.add("active")
  document.body.style.overflow = "hidden"
}

/**
 * Close pincode selection modal
 */
function closePincodeModal() {
  document.getElementById("pincodeModal").classList.remove("active")
  document.body.style.overflow = ""
}

/**
 * Select a pincode and save to localStorage
 * @param {string} pincode - Selected pincode
 * @param {string} location - Location name for the pincode
 */
function selectPincode(pincode, location) {
  selectedPincode = pincode
  updateLocationDisplay(pincode, location)

  // Save to localStorage for persistence
  localStorage.setItem("hasVisited", "true")
  localStorage.setItem("selectedPincode", pincode)
  localStorage.setItem("selectedLocation", location)

  closePincodeModal()
}

/**
 * Update location display in header
 * @param {string} pincode - Pincode to display
 * @param {string} location - Location name to display
 */
function updateLocationDisplay(pincode, location) {
  const pincodeElement = document.getElementById("selectedPincode")
  const locationElement = document.getElementById("selectedLocation")

  if (pincodeElement) pincodeElement.textContent = pincode
  if (locationElement) locationElement.textContent = location.split(",")[0]
}

/**
 * Setup pincode search functionality
 * Handles search input and validation
 */
function setupPincodeSearch() {
  const pincodeInput = document.getElementById("pincodeInput")
  if (!pincodeInput) return

  // Handle search input
  pincodeInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase()
    // TODO: Implement real-time search filtering
    console.log("Searching for:", searchTerm)
  })

  // Handle Enter key press for pincode validation
  pincodeInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const enteredPincode = e.target.value.trim()
      if (enteredPincode.length === 6) {
        // Check if pincode exists in available pincodes
        const foundPincode = availablePincodes.find((p) => p.code === enteredPincode)
        if (foundPincode) {
          selectPincode(foundPincode.code, foundPincode.area)
        } else {
          alert("Sorry, we do not deliver to this pincode yet.")
        }
      }
    }
  })
}

// ==========================================
// AUTHENTICATION FUNCTIONALITY
// ==========================================

/**
 * Toggle authentication dropdown or redirect to login
 */
function toggleAuth() {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    console.log('User data:', user);

    if (user && typeof user.first_name === 'string' && user.first_name.length > 0) {
      const dropdown = document.getElementById("logoutDropdown");
      const authText = document.getElementById("authText");

      // Show dropdown
      if (dropdown) dropdown.classList.toggle("active");

      // Update name display
      if (authText) {
        authText.textContent = `Hi ${user.first_name}`;
      }
    } else {
      // Not logged in, redirect to login
      window.location.href = "/login";
    }
  } catch (err) {
    console.error('Error in toggleAuth:', err);
    window.location.href = "/login";
  }
}

/**
 * Confirm logout and update UI
 */
function confirmLogout() {
  // Clear user data from localStorage
  localStorage.removeItem('user')
  
  // Update UI
  const authButton = document.getElementById('authButton')
  const authText = document.getElementById('authText')
  if (authText) {
    authText.textContent = 'Sign In / Register'
  }
  
  // Hide logout dropdown
  const dropdown = document.getElementById('logoutDropdown')
  if (dropdown) {
    dropdown.classList.remove('active')
  }
  
  // Redirect to home page
  window.location.href = '/'
  if (dropdown) dropdown.classList.remove("active")

  alert("You have been logged out successfully!")
}

/**
 * Cancel logout action
 */
function cancelLogout() {
  const dropdown = document.getElementById("logoutDropdown")
  if (dropdown) {
    dropdown.classList.remove("active")
  }
}


// ==========================================
// CART FUNCTIONALITY
// ==========================================

/**
 * Initialize cart functionality
 * Sets up event listeners for cart interactions
 */
function initializeCart() {
  const cartIcon = document.getElementById("cartIcon")
  const cartPopup = document.getElementById("cartPopup")
  const closeCart = document.getElementById("closeCart")
  const viewFullCart = document.getElementById("viewFullCart")

  // Open cart popup when clicking cart icon
  if (cartIcon && cartPopup) {
    cartIcon.addEventListener("click", () => {
      cartPopup.classList.add("active")
      document.body.style.overflow = "hidden"
      renderCartItems() // Refresh cart items when opening
    })
  }

  // Close cart popup
  if (closeCart && cartPopup) {
    closeCart.addEventListener("click", () => {
      cartPopup.classList.remove("active")
      document.body.style.overflow = ""
    })
  }

  // Close cart when clicking outside
  document.addEventListener("click", (e) => {
    if (
      cartPopup &&
      cartPopup.classList.contains("active") &&
      !cartPopup.contains(e.target) &&
      cartIcon &&
      !cartIcon.contains(e.target)
    ) {
      cartPopup.classList.remove("active")
      document.body.style.overflow = ""
    }
  })

  // Navigate to full cart page
  if (viewFullCart) {
    viewFullCart.addEventListener("click", () => {
      window.location.href = "/cart"
    })
  }

  // Initial cart display update
  updateCartDisplay()
}

/**
 * Get cart from localStorage
 * @returns {Array} Cart items array
 */
function getCartFromStorage() {
  try {
    return JSON.parse(localStorage.getItem("cart")) || []
  } catch (error) {
    console.error("Error reading cart from localStorage:", error)
    return []
  }
}

/**
 * Save cart to localStorage
 * @param {Array} cart - Cart items array
 */
function saveCartToStorage(cart) {
  try {
    localStorage.setItem("cart", JSON.stringify(cart))
  } catch (error) {
    console.error("Error saving cart to localStorage:", error)
  }
}

/**
 * Calculate cart totals from localStorage
 * @returns {Object} Cart totals object
 */
function calculateCartTotals() {
  const cart = getCartFromStorage()
  let totalPrice = 0
  let totalSavings = 0
  let count = 0

  cart.forEach((item) => {
    const itemPrice = item.price || 0
    const itemOriginalPrice = item.originalPrice || itemPrice + 20 // Mock original price
    totalPrice += itemPrice * item.quantity
    totalSavings += (itemOriginalPrice - itemPrice) * item.quantity
    count += item.quantity
  })

  return {
    totalPrice: totalPrice,
    totalSavings: totalSavings,
    count: count,
    items: cart,
  }
}

/**
 * Update cart count display
 */
updateCartCount()

/**
 * Update cart display in header and popup
 */
function updateCartDisplay() {
  const cartTotals = calculateCartTotals()

  // Update cart count
  const cartCountElement = document.getElementById("cartCount")
  if (cartCountElement) {
    cartCountElement.textContent = cartTotals.count
  }

  // Update cart popup totals
  const cartItemCountElement = document.getElementById("cartItemCount")
  const cartTotalElement = document.getElementById("cartTotal")
  const cartSavingsElement = document.getElementById("cartSavings")

  if (cartItemCountElement) cartItemCountElement.textContent = cartTotals.count
  if (cartTotalElement) cartTotalElement.textContent = `₹${cartTotals.totalPrice.toFixed(2)}`
  if (cartSavingsElement) cartSavingsElement.textContent = `₹${cartTotals.totalSavings.toFixed(2)}`
}

/**
 * Render cart items in the cart popup
 * Creates HTML template for each cart item
 */
function renderCartItems() {
  const cartItemsContainer = document.getElementById("cartItems")
  if (!cartItemsContainer) return

  const cart = getCartFromStorage()
  cartItemsContainer.innerHTML = ""

  if (cart.length === 0) {
    // Show empty cart message
    cartItemsContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <i class="fas fa-shopping-cart" style="font-size: 4rem; color: #ddd; margin-bottom: 1rem;"></i>
                <p style="color: #666; font-size: 1.1rem;">Your cart is empty</p>
            </div>
        `
    return
  }

  // Render each cart item using template
  cart.forEach((item) => {
    const cartItemElement = document.createElement("div")
    cartItemElement.className = "cart-item"
    cartItemElement.innerHTML = `
            <div class="cart-item-image">${item.icon}</div>
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-variant">Variant: 250g</div>
                <div class="cart-item-price">
                    <div class="cart-item-pay">You Pay ₹${item.price.toFixed(2)}</div>
                    <div class="cart-item-save">You Save ₹${((item.originalPrice || item.price + 20) - item.price).toFixed(2)}</div>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-control">
                        <button class="quantity-btn remove" onclick="updateItemQuantity(${item.id}, ${item.quantity - 1})">
                            ${item.quantity === 1 ? '<i class="fas fa-trash"></i>' : "-"}
                        </button>
                        <input type="text" class="quantity-input" value="${item.quantity}" readonly>
                        <button class="quantity-btn" onclick="updateItemQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    </div>
                    <button class="remove-item" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `

    cartItemsContainer.appendChild(cartItemElement)
  })
}

/**
 * Update item quantity in cart
 * @param {number} productId - Product ID to update
 * @param {number} newQuantity - New quantity value
 */
function updateItemQuantity(productId, newQuantity) {
  const cart = getCartFromStorage()
  const itemIndex = cart.findIndex((item) => item.id === Number.parseInt(productId))

  if (itemIndex === -1) return

  if (newQuantity <= 0) {
    // Remove item if quantity is 0 or less
    cart.splice(itemIndex, 1)
  } else {
    // Update quantity
    cart[itemIndex].quantity = newQuantity
  }

  saveCartToStorage(cart)
  updateCartDisplay()
  renderCartItems()
}

/**
 * Remove item from cart completely
 * @param {number} productId - Product ID to remove
 */
function removeFromCart(productId) {
  const cart = getCartFromStorage()
  const itemIndex = cart.findIndex((item) => item.id === Number.parseInt(productId))

  if (itemIndex === -1) return

  cart.splice(itemIndex, 1)
  saveCartToStorage(cart)
  updateCartDisplay()
  renderCartItems()
}

// ==========================================
// EVENT LISTENERS AND CLEANUP
// ==========================================

/**
 * Close dropdowns when clicking outside
 */
document.addEventListener("click", (e) => {
  // Close auth dropdown
  if (!e.target.closest(".auth-container")) {
    const dropdown = document.getElementById("logoutDropdown")
    if (dropdown) {
      dropdown.classList.remove("active")
    }
  }

  // Close pincode modal (only if user has visited before)
  if (!e.target.closest(".pincode-modal-content") && !e.target.closest(".location-selector")) {
    const pincodeModal = document.getElementById("pincodeModal")
    if (pincodeModal && pincodeModal.classList.contains("active")) {
      const hasVisited = localStorage.getItem("hasVisited")
      if (hasVisited) {
        closePincodeModal()
      }
    }
  }
})

// Make functions globally accessible for onclick handlers
window.openPincodeModal = openPincodeModal
window.closePincodeModal = closePincodeModal
window.selectPincode = selectPincode
window.toggleAuth = toggleAuth
window.confirmLogout = confirmLogout
window.cancelLogout = cancelLogout
window.updateItemQuantity = updateItemQuantity
window.removeFromCart = removeFromCart
window.updateCartCount = updateCartCount