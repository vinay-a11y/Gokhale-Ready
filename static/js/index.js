// ==========================================
// GLOBAL VARIABLES AND CONFIGURATION
// ==========================================

// Authentication state
let isLoggedIn = false

// Selected pincode for delivery
let selectedPincode = null

// Available pincodes - will be fetched from backend
let availablePincodes = []

// Slider functionality
let currentSlideIndex = 0
const totalSlides = 3

// ==========================================
// INITIALIZATION AND SETUP
// ==========================================

/**
 * Main initialization function called when DOM is loaded
 * Sets up all website functionality and fetches initial data
 */
document.addEventListener("DOMContentLoaded", () => {
  checkAuthState() // Check auth state immediately
  initializeWebsite()
  checkFirstVisit()
  fetchAndDisplayProducts() // Your original product fetching code
  initializeSlider() // Initialize hero slider
})

/**
 * Initialize all website components
 * Sets up cart, scroll functionality, pincode search, and fetches pincodes
 */
function initializeWebsite() {
  initializeCart()
  initializeScrollToTop()
  updateCartDisplay()
  setupPincodeSearch()
  fetchAvailablePincodes() // Fetch pincodes from backend
  checkAuthState() // Check if user is logged in
}

/**
 * Check authentication state and update UI accordingly
 */
function checkAuthState() {
  try {
    const user = JSON.parse(localStorage.getItem("user"))
    const authText = document.getElementById("authText")

    if (!authText) {
      console.error("Auth text element not found")
      return
    }

    if (user && typeof user.first_name === "string" && user.first_name.length > 0) {
      console.log("Setting auth text to:", `Hi ${user.first_name}`)
      authText.textContent = `Hi ${user.first_name}`
      isLoggedIn = true
    } else {
      console.log("Setting auth text to: Sign In")
      authText.textContent = "Sign In"
      isLoggedIn = false
    }
  } catch (err) {
    console.error("Error checking auth state:", err)
    const authText = document.getElementById("authText")
    if (authText) {
      authText.textContent = "Sign In"
    }
    isLoggedIn = false
  }
}

// ==========================================
// SLIDER FUNCTIONALITY
// ==========================================

/**
 * Initialize hero slider
 */
function initializeSlider() {
  // Auto-slide every 5 seconds
  setInterval(() => {
    changeSlide(1)
  }, 5000)
}

/**
 * Change slide by direction
 * @param {number} direction - 1 for next, -1 for previous
 */
function changeSlide(direction) {
  const slides = document.querySelectorAll(".slide")
  const dots = document.querySelectorAll(".dot")

  // Remove active class from current slide and dot
  slides[currentSlideIndex].classList.remove("active")
  dots[currentSlideIndex].classList.remove("active")

  // Update slide index
  currentSlideIndex += direction
  if (currentSlideIndex >= totalSlides) {
    currentSlideIndex = 0
  } else if (currentSlideIndex < 0) {
    currentSlideIndex = totalSlides - 1
  }

  // Add active class to new slide and dot
  slides[currentSlideIndex].classList.add("active")
  dots[currentSlideIndex].classList.add("active")
}

/**
 * Go to specific slide
 * @param {number} slideNumber - Slide number (1-based)
 */
function currentSlide(slideNumber) {
  const slides = document.querySelectorAll(".slide")
  const dots = document.querySelectorAll(".dot")

  // Remove active class from current slide and dot
  slides[currentSlideIndex].classList.remove("active")
  dots[currentSlideIndex].classList.remove("active")

  // Update to new slide
  currentSlideIndex = slideNumber - 1

  // Add active class to new slide and dot
  slides[currentSlideIndex].classList.add("active")
  dots[currentSlideIndex].classList.add("active")
}

// ==========================================
// CART UTILITY FUNCTIONS (SHARED)
// ==========================================

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
function updateCartCount() {
  const cart = getCartFromStorage()
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartCountElement = document.getElementById("cartCount")

  if (cartCountElement) {
    cartCountElement.textContent = totalCount
  }
}

// Initialize cart count on page load
document.addEventListener("DOMContentLoaded", () => {
  const cart = getCartFromStorage()
  updateCartCount()
})

 function toggleLocationRow() {
    const row = document.getElementById("mobileLocationRow");
    row.classList.toggle("expanded");
  }

// ==========================================
// PINCODE MANAGEMENT (BACKEND INTEGRATION)
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
    const user = JSON.parse(localStorage.getItem("user"))
    console.log("User data:", user)

    if (user && typeof user.first_name === "string" && user.first_name.length > 0) {
      const dropdown = document.getElementById("logoutDropdown")
      const authText = document.getElementById("authText")

      // Show dropdown
      if (dropdown) dropdown.classList.toggle("active")

      // Update name display
      if (authText) {
        authText.textContent = `Hi ${user.first_name}`
      }
    } else {
      // Not logged in, redirect to login
      window.location.href = "/login"
    }
  } catch (err) {
    console.error("Error in toggleAuth:", err)
    window.location.href = "/login"
  }
}

/**
 * Confirm logout and update UI
 */
function confirmLogout() {
  // Clear user data from localStorage
  localStorage.removeItem("user")

  // Update UI
  const authButton = document.getElementById("authButton")
  const authText = document.getElementById("authText")
  if (authText) {
    authText.textContent = "Sign In"
  }

  // Hide logout dropdown
  const dropdown = document.getElementById("logoutDropdown")
  if (dropdown) {
    dropdown.classList.remove("active")
  }

  // Redirect to home page
  window.location.href = "/"

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

// ==========================================
// PRODUCT MANAGEMENT (YOUR ORIGINAL CODE)
// ==========================================

/**
 * Fetch and display products from backend API
 * Your original function - preserved as requested
 */
async function fetchAndDisplayProducts() {
  const container = document.getElementById("featuredProductsContainer")
  if (!container) return

  try {
    const response = await fetch("/api/products")
    if (!response.ok) throw new Error("Failed to fetch products")

    const products = await response.json()
    if (!products || !Array.isArray(products)) {
      throw new Error("Invalid products data received")
    }

    // ✅ Limit to only first 12 products
    const limitedProducts = products.slice(0, 12)

    renderProducts(limitedProducts)
  } catch (error) {
    console.error("Error fetching products:", error)
    container.innerHTML = `
      <div class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          <p>Failed to load products. Please try again later.</p>
      </div>
    `
  }
}

/**
 * Render products in the container with enhanced design and dropdown variants
 */
function renderProducts(products) {
  const container = document.getElementById("featuredProductsContainer");
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML = `
      <div class="no-products-message">
        <i class="fas fa-box-open"></i>
        <p>No products available at the moment.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = products
    .map((product) => {
      // Use provided variants or fallback
      let variants =
        product.variants && product.variants.length > 0
          ? product.variants
          : [
              { packing: "250g", price: product.price_2 || product.max_price || 0 },
              { packing: "500g", price: product.price_3 || product.price_2 || product.max_price || 0 }
            ];

      // Get the highest price (without sorting the variants)
      const maxPrice = Math.max(...variants.map((v) => v.price));
      return `
      <div class="product-card" data-product-id="${product.id}">
        <div class="product-row">
          <div class="product-image" onclick="goToProductDetails(${product.id})">
            <img src="${product.image_url || 'images/placeholder.png'}"
                 alt="${product.item_name}" />
          </div>
    
          <div class="product-details">
            <h3 class="product-name" onclick="goToProductDetails(${product.id})">${product.item_name}</h3>
    
            <div class="price-info-line">
              <span class="price-label">Gokhale's MRP</span>
            </div>
    
            <div class="price-values-line">
              <span class="discounted-price">₹${(product.price_2 || product.max_price || 0).toFixed(2)}</span>
                          
              </div>
            
    
            <div class="tax-note">(Inclusive of all taxes)</div>
          </div>
        </div>
                    <p class="product-description" onclick="goToProductDetails(${product.id})">${product.description || "Delicious snack made with premium ingredients"}</p>
    
        <div class="product-bottom">
          <div class="variant-left">
            <select class="variants-dropdown" id="variant-${product.id}"
                    onclick="event.stopPropagation();"
                    onchange="updateProductPrice(${product.id}, this.value, this.options[this.selectedIndex].text)">
              ${variants
                      .map(
                        (v) => `
                          <option value="${v.price}">
                            ${v.packing} - ₹${v.price.toFixed(2)}
                          </option>
                        `
                      )
                      .join("")}
            </select>
          </div>
          <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(${product.id})">
            <i class="fas fa-shopping-cart"></i> 
          </button>
        </div>
      </div>
    `;
    })
    .join("");

  // Navigate to product details page
  window.goToProductDetails = (productId) => {
    window.location.href = `/product-details.html?id=${productId}`;
  };

  // Update displayed price and variant info
  window.updateProductPrice = (productId, price, variantText) => {
    const priceElement = document.getElementById(`price-${productId}`);
    if (priceElement) {
      priceElement.textContent = `₹${Number.parseFloat(price).toFixed(2)}`;
    }

    const productCard = document.querySelector(`[data-product-id="${productId}"]`);
    if (productCard) {
      productCard.setAttribute("data-selected-price", price);
      productCard.setAttribute("data-selected-variant", variantText.split(" - ")[0]);
    }

    event.preventDefault();
    return false;
  };
}

/**
 * Add product to cart with localStorage persistence and enhanced functionality
 */
async function addToCart(productId, quantity = 1) {
  console.log("Adding product to cart, ID:", productId, "Quantity:", quantity)

  // Disable button and show loading state
  const button = document.querySelector(`button[onclick*="addToCart(${productId})"]`)
  if (button) {
    button.disabled = true
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'
  }

  try {
    // Get current cart from localStorage
    const cart = getCartFromStorage()
    console.log("Current cart:", cart)

    // Get selected variant data from dropdown
    const variantDropdown = document.getElementById(`variant-${productId}`)
    const selectedPrice = variantDropdown ? Number.parseFloat(variantDropdown.value) : null
    const selectedVariant = variantDropdown
      ? variantDropdown.options[variantDropdown.selectedIndex].text.split(" - ")[0]
      : null

    // Fetch product details from API
    const response = await fetch(`/api/products/${productId}`)
    if (!response.ok) throw new Error("Failed to fetch product details")
    const product = await response.json()

    // Use selected price or fallback to default
    const finalPrice = selectedPrice || product.price_01 || 100
    const finalVariant = selectedVariant || "250g"

    // Check if product already exists in cart with same variant
    const existingItemIndex = cart.findIndex((item) => item.id === productId && item.variant === finalVariant)

    if (existingItemIndex !== -1) {
      // Update quantity if product exists with same variant
      cart[existingItemIndex].quantity += quantity
    } else {
      // Add new item if product doesn't exist or different variant
      cart.push({
        id: productId,
        name: product.item_name,
        price: finalPrice,
        quantity: quantity,
        image: product.image_url || null,
        description: product.description,
        variant: finalVariant,
        originalPrice: finalPrice + 20,
         // Mock original price for savings calculation
      })
    }

    // Save to localStorage and update displays
    saveCartToStorage(cart)
    updateCartDisplay()
    updateCartCount() // Update cart count badge

    // Show cart popup
    const cartPopup = document.getElementById("cartPopup")
    if (cartPopup) {
      cartPopup.classList.add("active")
      document.body.style.overflow = "hidden"
      renderCartItems() // Refresh cart items
    }

    // Show success message
    const toast = document.createElement("div")
    toast.className = "toast success"
    toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            ${product.item_name} (${finalVariant}) added to cart!
        `
    document.body.appendChild(toast)

    // Add floating animation
    const cartIcon = document.querySelector(".cart-icon, #cartIcon")
    if (cartIcon && button) {
      // Add pulse animation to cart icon
      cartIcon.classList.add("pulse")
      setTimeout(() => cartIcon.classList.remove("pulse"), 300)
    }

    // Remove success message after delay
    setTimeout(() => toast.remove(), 3000)

    // Try to sync with server if available
    try {
      const response = await fetch("/api/cart/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cart }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.data && result.data.cart) {
          // Update local cart if server made any changes
          saveCartToStorage(result.data.cart)
          updateCartDisplay()
        }
      }
    } catch (syncError) {
      console.warn("Failed to sync cart with server:", syncError)
      // Don't show error to user as the item was still added locally
    }
  } catch (error) {
    console.error("Error adding to cart:", error)
    const toast = document.createElement("div")
    toast.className = "toast error"
    toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            Failed to add item to cart. Please try again.
        `
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
  } finally {
    // Reset button state
    if (button) {
      button.disabled = false
      button.innerHTML = '<i class="fas fa-plus"></i>'
    }
  }
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

/**
 * Update cart display in header and popup
 */
function updateCartDisplay() {
  const cartTotals = calculateCartTotals()

  // Update desktop and mobile cart counts
  const desktopCartCountElement = document.getElementById("desktopCartCount")
  const mobileCartCountElement = document.getElementById("mobileCartCount")

  if (desktopCartCountElement) {
    desktopCartCountElement.textContent = cartTotals.count
  }
  if (mobileCartCountElement) {
    mobileCartCountElement.textContent = cartTotals.count
  }

  // Update cart popup totals
  const cartItemCountElement = document.getElementById("cartItemCount")
  const cartTotalElement = document.getElementById("cartTotal")
  const cartSavingsElement = document.getElementById("cartSavings")

  if (cartItemCountElement) {
    cartItemCountElement.textContent = cartTotals.count
  }
  if (cartTotalElement) {
    cartTotalElement.textContent = `₹${cartTotals.totalPrice.toFixed(2)}`
  }
  if (cartSavingsElement) {
    cartSavingsElement.textContent = `₹${cartTotals.totalSavings.toFixed(2)}`
  }
}


/**
 * Render cart items in the cart popup
 * Creates HTML template for each cart item
 */
function renderCartItems() {
  const cartItemsContainer = document.getElementById("cartItems");
  if (!cartItemsContainer) return;

  const cart = getCartFromStorage();
  cartItemsContainer.innerHTML = "";

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem;">
        <i class="fas fa-shopping-cart" style="font-size: 4rem; color: #ddd; margin-bottom: 1rem;"></i>
        <p style="color: #666; font-size: 1.1rem;">Your cart is empty</p>
      </div>
    `;
    return;
  }

  cart.forEach((item) => {
    const quantity = item.quantity || 1;
    const variantLabel = item.variant?.includes("gm") ? item.variant : `${item.variant || "250"}gm`;
    const totalPrice = (item.price * quantity).toFixed(2);
    const originalTotal = ((item.originalPrice || item.price + 20) * quantity).toFixed(2);
    const youSave = (originalTotal - totalPrice).toFixed(2);

    const cartItemElement = document.createElement("div");
    cartItemElement.className = "cart-item";

    cartItemElement.innerHTML = `
       <div class="cart-item-image">
        <img src="${item.image || 'fallback.jpg'}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;" />
      </div>
      <div class="cart-item-details">
        <div class="cart-item-title">${item.name}</div>
        <div class="cart-item-variant">Variant: ${variantLabel}</div>
        <div class="cart-item-price">
          <div class="cart-item-pay">You Pay ₹${totalPrice}</div>
          <div class="cart-item-save">You Save ₹${youSave}</div>
        </div>
        <div class="cart-item-actions">
          <div class="quantity-control">
            <button class="quantity-btn remove" onclick="event.stopPropagation(); updateItemQuantity(${item.id}, ${quantity - 1})">
              ${quantity === 1 ? '<i class="fas fa-trash"></i>' : "-"}
            </button>
            <input type="text" class="quantity-input" value="${quantity}" readonly>
            <button class="quantity-btn" onclick="event.stopPropagation(); updateItemQuantity(${item.id}, ${quantity + 1})">+</button>
          </div>
          <button class="remove-item" onclick="event.stopPropagation(); removeFromCart(${item.id})">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `;

    cartItemsContainer.appendChild(cartItemElement);
  });
}


// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Filter products by category
 * @param {string} category - Category to filter by
 */
function filterProducts(category) {
  console.log(`Filtering products by category: ${category}`)
  // TODO: Implement actual filtering logic
}

/**
 * Initialize scroll to top functionality
 */
function initializeScrollToTop() {
  const scrollTopBtn = document.getElementById("scrollTop")
  if (!scrollTopBtn) return

  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 300) {
      scrollTopBtn.classList.add("visible")
    } else {
      scrollTopBtn.classList.remove("visible")
    }
  })
}

/**
 * Scroll to top of page smoothly
 */
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  })
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
window.addToCart = addToCart
window.updateItemQuantity = updateItemQuantity
window.removeFromCart = removeFromCart
window.updateCartCount = updateCartCount
window.toggleAuth = toggleAuth
window.confirmLogout = confirmLogout
window.cancelLogout = cancelLogout
window.openPincodeModal = openPincodeModal
window.closePincodeModal = closePincodeModal
window.selectPincode = selectPincode
window.scrollToTop = scrollToTop
window.filterProducts = filterProducts
window.changeSlide = changeSlide
window.currentSlide = currentSlide