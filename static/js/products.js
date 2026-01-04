// Global variables
window.allProducts = []
window.filteredProducts = []
window.currentPage = 1
window.productsPerPage = 12
window.currentCategory = "all"
window.currentSearchQuery = ""
window.lastScrollY = 0

// Cart and user variables
let cart = []
let userDetails = {}
let selectedAddress = null
let savedAddresses = []

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeWebsite()
  checkAuthState()
  loadUserDetails()
  updateCartCount()
  fetchAndRenderProducts()
  setupScrollHandler()
  loadCartFromStorage()
})

// Load user details and addresses
async function loadUserDetails() {
  const user = JSON.parse(localStorage.getItem("user"))
  console.log("User from localStorage:", user)

  if (user) {
    userDetails = user
    await loadSavedAddresses()
  } else {
    console.log("No user found in localStorage")
    userDetails = {
      id: null,
      first_name: "Guest User",
      mobile_number: null,
    }
  }
}

// Load saved addresses from backend API
async function loadSavedAddresses() {
  try {
    if (!userDetails.id) {
      console.log("No user ID available")
      savedAddresses = []
      return
    }

    console.log("Loading addresses for user ID:", userDetails.id)

    const response = await fetch(`/api/addresses?user_id=${userDetails.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      savedAddresses = data.addresses || []
      console.log("Loaded addresses:", savedAddresses)
    } else {
      console.warn("Failed to load addresses:", response.status)
      savedAddresses = []
    }

    const storedAddressId = localStorage.getItem("selectedAddressId")
    if (storedAddressId && savedAddresses.length > 0) {
      const storedAddress = savedAddresses.find((addr) => addr.id == storedAddressId)
      if (storedAddress) {
        selectedAddress = storedAddress
      }
    }

    if (!selectedAddress && savedAddresses.length > 0) {
      selectedAddress = savedAddresses[0]
      localStorage.setItem("selectedAddressId", selectedAddress.id)
    }
  } catch (error) {
    console.error("Error loading saved addresses:", error)
    savedAddresses = []
  }
}

// Load cart from storage
function loadCartFromStorage() {
  try {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      cart = JSON.parse(savedCart)
    }
  } catch (error) {
    console.error("Error loading cart:", error)
    cart = []
  }
}

// Initialize website functionality
function initializeWebsite() {
  const searchBox = document.getElementById("searchBox")
  const mobileSearchBox = document.getElementById("mobileSearchBox")

  if (searchBox) {
    searchBox.addEventListener("input", debounce(handleSearchInput, 300))
    searchBox.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        performSearch()
      }
    })
    searchBox.addEventListener("focus", showAutocomplete)
  }

  if (mobileSearchBox) {
    mobileSearchBox.addEventListener("input", debounce(handleMobileSearchInput, 300))
    mobileSearchBox.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        performMobileSearch()
      }
    })
    mobileSearchBox.addEventListener("focus", showMobileAutocomplete)
  }

  updateWelcomeMessage()
  setupClickOutsideHandlers()
  syncCartCounts()
}

// Setup scroll handler for mobile navbar hide/show
function setupScrollHandler() {
  if (window.innerWidth <= 768) {
    let ticking = false

    function updateNavbar() {
      const header = document.getElementById("header")
      const currentScrollY = window.scrollY

      if (currentScrollY > window.lastScrollY && currentScrollY > 100) {
        header.classList.add("hidden")
      } else {
        header.classList.remove("hidden")
      }

      window.lastScrollY = currentScrollY
      ticking = false
    }

    window.addEventListener("scroll", () => {
      if (!ticking) {
        requestAnimationFrame(updateNavbar)
        ticking = true
      }
    })
  }
}

// Sync cart counts between mobile and desktop
function syncCartCounts() {
  const cart = JSON.parse(localStorage.getItem("cart")) || []
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const cartCountElement = document.getElementById("cartCount")
  const mobileCartCountElement = document.getElementById("mobileCartCount")

  if (cartCountElement) {
    cartCountElement.textContent = totalCount
  }
  if (mobileCartCountElement) {
    mobileCartCountElement.textContent = totalCount
  }
}

// Check authentication state and update UI
function checkAuthState() {
  try {
    const user = JSON.parse(localStorage.getItem("user"))
    const authText = document.getElementById("authText")
    const dropdownUserName = document.getElementById("dropdownUserName")
    const dropdownUserEmail = document.getElementById("dropdownUserEmail")
    const mobileDropdownUserName = document.getElementById("mobileDropdownUserName")
    const mobileDropdownUserEmail = document.getElementById("mobileDropdownUserEmail")

    if (user && user.first_name) {
      if (authText) {
        authText.textContent = `Hi ${user.first_name}`
      }
      if (dropdownUserName) {
        dropdownUserName.textContent = `${user.first_name} ${user.last_name || ""}`
      }
      if (dropdownUserEmail) {
        dropdownUserEmail.textContent = user.email || "user@example.com"
      }
      if (mobileDropdownUserName) {
        mobileDropdownUserName.textContent = `${user.first_name} ${user.last_name || ""}`
      }
      if (mobileDropdownUserEmail) {
        mobileDropdownUserEmail.textContent = user.email || "user@example.com"
      }
    } else {
      if (authText) {
        authText.textContent = "Sign In"
      }
    }
  } catch (error) {
    console.error("Error checking auth state:", error)
  }
}

// Update welcome message
function updateWelcomeMessage() {
  // Welcome message now only shows "Welcome to Gokhale Bandu" without username
}

async function fetchAndRenderProducts() {
  try {
    console.log("Fetching products from API...")
    showLoadingState()

    const response = await fetch("/api/products-state", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()
    const products = data.products || data || []

    if (!Array.isArray(products) || products.length === 0) {
      throw new Error("No products found")
    }

    const processedProducts = products
      .map((product) => {
        if (!product.id || !product.item_name || !product.variants || product.variants.length === 0) {
          console.warn("Invalid product structure:", product)
          return null
        }

        const processedProduct = {
          id: product.id,
          item_name: product.item_name || product.name,
          description: product.description || "Delicious traditional snack",
          category: product.category || "snacks",
          image_url: product.image_url || product.image || "/placeholder.svg?height=200&width=300",
          variants: product.variants || [],
          is_enabled: product.is_enabled || false, // Include is_enabled status
        }

        // Sort variants by price (highest first)
        processedProduct.variants.sort((a, b) => {
          const priceA = a.price || 0
          const priceB = b.price || 0
          return priceB - priceA
        })

        return processedProduct
      })
      .filter((product) => product !== null)

    if (processedProducts.length === 0) {
      throw new Error("No valid products found")
    }

    const enabledProducts = processedProducts.filter((product) => product.is_enabled)

    if (enabledProducts.length === 0) {
      showOutOfStockMessage()
      return
    }

    window.allProducts = processedProducts
    window.filteredProducts = processedProducts

    console.log("Processed products:", processedProducts)
    renderProducts(processedProducts)
    updateProductCount()
  } catch (error) {
    console.error("Error fetching products:", error)
    showError("Out of stock – please check back in a few days")
  }
}

function showOutOfStockMessage() {
  const productsContainer = document.getElementById("productsContainer")
  if (productsContainer) {
    productsContainer.innerHTML = `
      <div class="out-of-stock-message" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 2rem;
        text-align: center;
        min-height: 400px;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        border-radius: 20px;
        margin: 2rem 0;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      ">
        <div style="
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: bounce 2s infinite;
        ">😔</div>
        <h2 style="
          color: #333;
          font-size: 2rem;
          margin-bottom: 1rem;
          font-weight: 600;
        ">We are out of stock</h2>
        <p style="
          color: #666;
          font-size: 1.1rem;
          max-width: 400px;
          line-height: 1.6;
        ">All our delicious products are currently unavailable. Please check back soon for fresh stock!</p>
        <button onclick="fetchAndRenderProducts()" style="
          margin-top: 2rem;
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
          transition: transform 0.2s ease;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          <i class="fas fa-redo"></i> Refresh
        </button>
      </div>
      <style>
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
      </style>
    `
  }
}

// Render products with enhanced design
function renderProducts(products) {
  const productsContainer = document.getElementById("productsContainer")
  if (!productsContainer) return

  productsContainer.innerHTML = ""

  if (!products.length) {
    showNoResults("No products available at the moment.")
    return
  }

  const isMobile = window.innerWidth <= 768

  if (isMobile) {
    renderMobileProducts(products)
  } else {
    renderDesktopProducts(products)
  }
}

function renderMobileProducts(products) {
  const productsContainer = document.getElementById("productsContainer")

  products.forEach((product, index) => {
    const card = document.createElement("div")
    card.className = `product-card ${!product.is_enabled ? "disabled-product" : ""}`
    card.setAttribute("data-category", product.category || "uncategorized")
    card.setAttribute("data-product-id", product.id)
    card.style.animationDelay = `${index * 0.1}s`

    const maxVariant = product.variants[0]
    const minVariant = product.variants[product.variants.length - 1]

    const originalPrice = maxVariant.price + Math.round(maxVariant.price * 0.2)
    const discountPercent = Math.round(((originalPrice - maxVariant.price) / originalPrice) * 100)

    const disabledStyle = !product.is_enabled
      ? `
      opacity: 0.6;
      filter: grayscale(50%);
      position: relative;
    `
      : ""

    const disabledOverlay = !product.is_enabled
      ? `
      <div class="disabled-overlay" style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255,255,255,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        z-index: 2;
      ">
        <span style="
          background: #ff4757;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
        ">Out of Stock</span>
      </div>
    `
      : ""

    card.innerHTML = `
      <div class="product-row" style="${disabledStyle}">
        ${disabledOverlay}
        <div class="product-image" onclick="${product.is_enabled ? `goToProductDetails(${product.id})` : "return false;"}">
          <img src="${product.image_url}"
               alt="${product.item_name}"
               loading="lazy"
               onerror="this.src='/placeholder.svg?height=110&width=130';" />
        </div>
        <div class="product-details">
          <h3 class="product-name" onclick="${product.is_enabled ? `goToProductDetails(${product.id})` : "return false;"}">${product.item_name}</h3>
          
          <div class="price-info-line">
            <span>Gokhale's MRP</span>
          </div>
          
          <div class="price-values-line">
            <span class="mrp">₹${originalPrice.toFixed(2)} </span>
            <span class="discounted-price" id="price-${product.id}">₹${maxVariant.price.toFixed(2)}</span>
          </div>
          
          <div class="tax-note">Inclusive of all taxes</div>
          
          <div class="discount-box">${discountPercent}% OFF</div>
          
        </div>
      </div>
      
      <div class="product-bottom">
        <div class="variant-left">
          <select class="variants-dropdown" id="variant-${product.id}" 
                  ${!product.is_enabled ? "disabled" : ""} 
                  onchange="updateProductPrice(${product.id}, this.value, this.options[this.selectedIndex].text)">
            ${product.variants
              .map(
                (variant, i) => `
                <option value="${variant.price}" ${i === 0 ? "selected" : ""}>
                  ${variant.packing} - ₹${variant.price.toFixed(2)}
                </option>
              `,
              )
              .join("")}
          </select>
        </div>
        <button class="add-to-cart" 
                ${!product.is_enabled ? "disabled" : ""} 
                onclick="${product.is_enabled ? `addToCart(${product.id})` : 'showToast("This product is currently out of stock", "error")'}"
                style="${!product.is_enabled ? "background: #ccc; cursor: not-allowed;" : ""}">
          <i class="fas fa-shopping-cart"></i>
          ${product.is_enabled ? "Add" : "Unavailable"}
        </button>
      </div>
    `

    productsContainer.appendChild(card)
  })
}

function renderDesktopProducts(products) {
  const productsContainer = document.getElementById("productsContainer")

  const totalPages = Math.ceil(products.length / window.productsPerPage)
  const startIndex = (window.currentPage - 1) * window.productsPerPage
  const endIndex = startIndex + window.productsPerPage
  const currentProducts = products.slice(startIndex, endIndex)

  currentProducts.forEach((product, index) => {
    const card = document.createElement("div")
    card.className = `product-card ${!product.is_enabled ? "disabled-product" : ""}`
    card.setAttribute("data-category", product.category || "uncategorized")
    card.setAttribute("data-product-id", product.id)
    card.style.animationDelay = `${index * 0.1}s`

    const maxVariant = product.variants[0]
    const minVariant = product.variants[product.variants.length - 1]

    const originalPrice = maxVariant.price + Math.round(maxVariant.price * 0.2)
    const discountPercent = Math.round(((originalPrice - maxVariant.price) / originalPrice) * 100)

    const disabledStyle = !product.is_enabled
      ? `
      opacity: 0.6;
      filter: grayscale(50%);
      position: relative;
    `
      : ""

    const disabledOverlay = !product.is_enabled
      ? `
      <div class="disabled-overlay" style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255,255,255,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        z-index: 2;
      ">
        <span style="
          background: #ff4757;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
        ">Out of Stock</span>
      </div>
    `
      : ""

    card.innerHTML = `
      <div style="${disabledStyle}">
        ${disabledOverlay}
        <div class="product-image" onclick="${product.is_enabled ? `goToProductDetails(${product.id})` : "return false;"}">
          <img src="${product.image_url}"
               alt="${product.item_name}"
               loading="lazy"
               onerror="this.src='/placeholder.svg?height=220&width=320';" />
        </div>
        <div class="product-info">
          <h3 onclick="${product.is_enabled ? `goToProductDetails(${product.id})` : "return false;"}">${product.item_name}</h3>
          
          <p class="product-description" onclick="${product.is_enabled ? `goToProductDetails(${product.id})` : "return false;"}">${product.description}</p>
          
          <div class="product-price-container">
            <div class="product-pricing">
              <div class="product-price" id="price-${product.id}">₹${maxVariant.price.toFixed(2)}</div>
              <div class="original-price">₹${originalPrice.toFixed(2)}</div>
              <div class="discount-badge">${discountPercent}% OFF</div>
            </div>
            <div class="price-info">Starting from ₹${minVariant.price.toFixed(2)} </div>
          </div>
          
          <div class="product-actions">
            <select class="variants-dropdown" id="variant-${product.id}" 
                    ${!product.is_enabled ? "disabled" : ""} 
                    onchange="updateProductPrice(${product.id}, this.value, this.options[this.selectedIndex].text)">
              ${product.variants
                .map(
                  (variant, i) => `
                  <option value="${variant.price}" ${i === 0 ? "selected" : ""}>
                    ${variant.packing} - ₹${variant.price.toFixed(2)}
                  </option>
                `,
                )
                .join("")}
            </select>
            <button class="add-to-cart" 
                    ${!product.is_enabled ? "disabled" : ""} 
                    onclick="${product.is_enabled ? `addToCart(${product.id})` : 'showToast("This product is currently out of stock", "error")'}" 
                    title="${product.is_enabled ? "Add to Cart" : "Out of Stock"}"
                    style="${!product.is_enabled ? "background: #ccc; cursor: not-allowed;" : ""}">
              <i class="fas fa-shopping-cart"></i>
            </button>
          </div>
        </div>
      </div>
    `

    productsContainer.appendChild(card)
  })

  updatePagination(totalPages)
}

// Show loading state
function showLoadingState() {
  const productsContainer = document.getElementById("productsContainer")
  if (productsContainer) {
    productsContainer.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <div class="loading-text">Loading delicious products...</div>
      </div>
    `
  }
}

// Handle search input with autocomplete
function handleSearchInput() {
  const searchBox = document.getElementById("searchBox")
  if (searchBox) {
    window.currentSearchQuery = searchBox.value.toLowerCase().trim()
    updateAutocomplete()

    if (window.currentSearchQuery === "") {
      hideAutocomplete()
      applyFilters()
    }
  }
}

// Handle mobile search input
function handleMobileSearchInput() {
  const mobileSearchBox = document.getElementById("mobileSearchBox")
  if (mobileSearchBox) {
    window.currentSearchQuery = mobileSearchBox.value.toLowerCase().trim()
    updateMobileAutocomplete()

    if (window.currentSearchQuery === "") {
      hideMobileAutocomplete()
      applyFilters()
    }
  }
}

// Show autocomplete dropdown
function showAutocomplete() {
  const autocompleteDropdown = document.getElementById("autocompleteDropdown")
  if (autocompleteDropdown && window.allProducts.length > 0) {
    updateAutocomplete()
  }
}

// Show mobile autocomplete dropdown
function showMobileAutocomplete() {
  const mobileAutocompleteDropdown = document.getElementById("mobileAutocompleteDropdown")
  if (mobileAutocompleteDropdown && window.allProducts.length > 0) {
    updateMobileAutocomplete()
  }
}

// Update autocomplete suggestions
function updateAutocomplete() {
  const autocompleteDropdown = document.getElementById("autocompleteDropdown")
  const searchBox = document.getElementById("searchBox")

  if (!autocompleteDropdown || !searchBox) return

  const query = searchBox.value.toLowerCase().trim()

  if (query === "") {
    hideAutocomplete()
    return
  }

  const matches = window.allProducts
    .filter(
      (product) =>
        (product.item_name && product.item_name.toLowerCase().includes(query)) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        (product.category && product.category.toLowerCase().includes(query)),
    )
    .slice(0, 5)

  if (matches.length === 0) {
    hideAutocomplete()
    return
  }

  autocompleteDropdown.innerHTML = matches
    .map(
      (product) => `
    <div class="autocomplete-item" onclick="selectProduct('${product.item_name}')">
      <i class="fas fa-search"></i>
      <span>${product.item_name}</span>
    </div>
  `,
    )
    .join("")

  autocompleteDropdown.classList.add("active")
}

// Update mobile autocomplete suggestions
function updateMobileAutocomplete() {
  const mobileAutocompleteDropdown = document.getElementById("mobileAutocompleteDropdown")
  const mobileSearchBox = document.getElementById("mobileSearchBox")

  if (!mobileAutocompleteDropdown || !mobileSearchBox) return

  const query = mobileSearchBox.value.toLowerCase().trim()

  if (query === "") {
    hideMobileAutocomplete()
    return
  }

  const matches = window.allProducts
    .filter(
      (product) =>
        (product.item_name && product.item_name.toLowerCase().includes(query)) ||
        (product.description && product.description.toLowerCase().includes(query)) ||
        (product.category && product.category.toLowerCase().includes(query)),
    )
    .slice(0, 5)

  if (matches.length === 0) {
    hideMobileAutocomplete()
    return
  }

  mobileAutocompleteDropdown.innerHTML = matches
    .map(
      (product) => `
    <div class="autocomplete-item" onclick="selectMobileProduct('${product.item_name}')">
      <i class="fas fa-search"></i>
      <span>${product.item_name}</span>
    </div>
  `,
    )
    .join("")

  mobileAutocompleteDropdown.classList.add("active")
}

// Hide autocomplete dropdown
function hideAutocomplete() {
  const autocompleteDropdown = document.getElementById("autocompleteDropdown")
  if (autocompleteDropdown) {
    autocompleteDropdown.classList.remove("active")
  }
}

// Hide mobile autocomplete dropdown
function hideMobileAutocomplete() {
  const mobileAutocompleteDropdown = document.getElementById("mobileAutocompleteDropdown")
  if (mobileAutocompleteDropdown) {
    mobileAutocompleteDropdown.classList.remove("active")
  }
}

// Select product from autocomplete
function selectProduct(productName) {
  const searchBox = document.getElementById("searchBox")
  const mobileSearchBox = document.getElementById("mobileSearchBox")

  if (searchBox) {
    searchBox.value = productName
  }
  if (mobileSearchBox) {
    mobileSearchBox.value = productName
  }

  window.currentSearchQuery = productName.toLowerCase()
  hideAutocomplete()
  hideMobileAutocomplete()
  performSearch()
}

// Select product from mobile autocomplete
function selectMobileProduct(productName) {
  const mobileSearchBox = document.getElementById("mobileSearchBox")
  const searchBox = document.getElementById("searchBox")

  if (mobileSearchBox) {
    mobileSearchBox.value = productName
  }
  if (searchBox) {
    searchBox.value = productName
  }

  window.currentSearchQuery = productName.toLowerCase()
  hideMobileAutocomplete()
  hideAutocomplete()
  performSearch()
}

// Perform search - prioritize matching products
function performSearch() {
  const searchBox = document.getElementById("searchBox")
  if (!searchBox) return

  window.currentSearchQuery = searchBox.value.toLowerCase().trim()
  hideAutocomplete()
  hideMobileAutocomplete()

  if (window.currentSearchQuery === "") {
    applyFilters()
    return
  }

  const exactMatches = []
  const partialMatches = []
  const otherProducts = []

  window.allProducts.forEach((product) => {
    const name = (product.item_name || "").toLowerCase()
    const description = (product.description || "").toLowerCase()
    const category = (product.category || "").toLowerCase()

    if (name === window.currentSearchQuery) {
      exactMatches.push(product)
    } else if (
      name.includes(window.currentSearchQuery) ||
      description.includes(window.currentSearchQuery) ||
      category.includes(window.currentSearchQuery)
    ) {
      partialMatches.push(product)
    } else {
      otherProducts.push(product)
    }
  })

  const searchResults = [...exactMatches, ...partialMatches, ...otherProducts]

  window.currentCategory = "all"
  updateActiveFilterButton("all")

  window.filteredProducts = searchResults
  window.currentPage = 1
  renderProducts(searchResults)
  updateProductCount()

  if (exactMatches.length === 0 && partialMatches.length === 0) {
    showToast(`No direct matches found for "${window.currentSearchQuery}", showing all products`, "info")
  } else {
    showToast(
      `Found ${exactMatches.length + partialMatches.length} matches for "${window.currentSearchQuery}"`,
      "success",
    )
  }
}

// Perform mobile search
function performMobileSearch() {
  const mobileSearchBox = document.getElementById("mobileSearchBox")
  if (!mobileSearchBox) return

  window.currentSearchQuery = mobileSearchBox.value.toLowerCase().trim()
  hideAutocomplete()
  hideMobileAutocomplete()

  const searchBox = document.getElementById("searchBox")
  if (searchBox) {
    searchBox.value = mobileSearchBox.value
  }

  performSearch()
}

// Update product price when variant changes
function updateProductPrice(productId, price, variantText) {
  const priceElement = document.getElementById(`price-${productId}`)
  if (priceElement) {
    priceElement.textContent = `₹${Number.parseFloat(price).toFixed(2)}`
  }

  const productCard = document.querySelector(`[data-product-id="${productId}"]`)
  if (productCard) {
    productCard.setAttribute("data-selected-price", price)
    productCard.setAttribute("data-selected-variant", variantText.split(" - ")[0])
  }
}

// Apply filters
function applyFilters() {
  let filtered = [...window.allProducts]

  if (window.currentCategory && window.currentCategory !== "all") {
    filtered = filtered.filter(
      (product) => product.category && product.category.toLowerCase() === window.currentCategory.toLowerCase(),
    )
  }

  if (window.currentSearchQuery) {
    const exactMatches = []
    const partialMatches = []
    const otherProducts = []

    filtered.forEach((product) => {
      const name = (product.item_name || "").toLowerCase()
      const description = (product.description || "").toLowerCase()
      const category = (product.category || "").toLowerCase()

      if (name === window.currentSearchQuery) {
        exactMatches.push(product)
      } else if (
        name.includes(window.currentSearchQuery) ||
        description.includes(window.currentSearchQuery) ||
        category.includes(window.currentSearchQuery)
      ) {
        partialMatches.push(product)
      } else {
        otherProducts.push(product)
      }
    })

    filtered = [...exactMatches, ...partialMatches, ...otherProducts]
  }

  window.filteredProducts = filtered
  window.currentPage = 1
  renderProducts(filtered)
  updateProductCount()
}

// Set quick filter
function setQuickFilter(category) {
  window.currentCategory = category
  window.currentSearchQuery = ""

  const searchBox = document.getElementById("searchBox")
  const mobileSearchBox = document.getElementById("mobileSearchBox")
  if (searchBox) {
    searchBox.value = ""
  }
  if (mobileSearchBox) {
    mobileSearchBox.value = ""
  }

  hideAutocomplete()
  hideMobileAutocomplete()
  updateActiveFilterButton(category)
  applyFilters()
}

// Update active filter button
function updateActiveFilterButton(category) {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active")
  })

  document.querySelectorAll(".category-item").forEach((btn) => {
    btn.classList.remove("active")
  })

  const buttons = document.querySelectorAll(".filter-btn, .category-item")
  buttons.forEach((btn) => {
    const btnText = btn.textContent.toLowerCase()
    if ((category === "all" && btnText.includes("all")) || (category !== "all" && btnText.includes(category))) {
      btn.classList.add("active")
    }
  })
}

async function addToCart(productId) {
  const button = document.querySelector(`button[onclick*="addToCart(${productId})"]`)
  if (button) {
    button.disabled = true
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'
  }

  try {
    const cart = JSON.parse(localStorage.getItem("cart")) || []

    const product = window.allProducts.find((p) => p.id === Number.parseInt(productId))
    if (!product) {
      throw new Error("Product not found")
    }

    if (!product.is_enabled) {
      showToast("This product is currently out of stock", "error")
      return
    }

    const variantDropdown = document.getElementById(`variant-${productId}`)
    const selectedPrice = variantDropdown ? Number.parseFloat(variantDropdown.value) : null
    const selectedVariant = variantDropdown
      ? variantDropdown.options[variantDropdown.selectedIndex].text.split(" - ")[0]
      : null

    const finalPrice = selectedPrice || product.variants[0].price
    const finalVariant = selectedVariant || product.variants[0].packing

    const existingItemIndex = cart.findIndex(
      (item) => item.id === Number.parseInt(productId) && item.variant === finalVariant,
    )

    if (existingItemIndex !== -1) {
      cart[existingItemIndex].quantity += 1
    } else {
      const cartItem = {
        id: Number.parseInt(productId),
        name: product.item_name,
        price: finalPrice,
        description: product.description,
        image: product.image_url,
        category: product.category,
        quantity: 1,
        variant: finalVariant,
      }
      cart.push(cartItem)
    }

    localStorage.setItem("cart", JSON.stringify(cart))

    updateCartCount()
    syncCartCounts()
    updateCartDisplay()

    showToast(`${product.item_name} (${finalVariant}) added to cart!`, "success")

    const cartIcon = document.querySelector(".cart-icon")
    const mobileCartIcon = document.querySelector(".mobile-cart-icon")
    if (cartIcon) {
      cartIcon.style.animation = "pulse 0.6s ease"
      setTimeout(() => {
        cartIcon.style.animation = ""
      }, 600)
    }
    if (mobileCartIcon) {
      mobileCartIcon.style.animation = "pulse 0.6s ease"
      setTimeout(() => {
        mobileCartIcon.style.animation = ""
      }, 600)
    }
  } catch (error) {
    console.error("Error adding to cart:", error)
    showToast("Failed to add item to cart. Please try again.", "error")
  } finally {
    if (button) {
      button.disabled = false
      const isMobile = window.innerWidth <= 768
      button.innerHTML = isMobile ? '<i class="fas fa-shopping-cart"></i> Add' : '<i class="fas fa-shopping-cart"></i>'
    }
  }
}

// Show toast notification
function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toastContainer")
  if (!toastContainer) return

  const toast = document.createElement("div")
  toast.className = `toast ${type}`
  toast.innerHTML = `
    <i class="fas fa-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"}"></i>
    ${message}
  `

  toastContainer.appendChild(toast)

  setTimeout(() => {
    toast.style.transform = "translateX(100%)"
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 400)
  }, 3000)
}

// Show error message
function showError(message) {
  const productsContainer = document.getElementById("productsContainer")
  if (productsContainer) {
    productsContainer.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-circle"></i>
        <p>${message}</p>
        <button onclick="fetchAndRenderProducts()" class="retry-btn" style="margin-top: 1rem; padding: 0.8rem 1.5rem; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
          <i class="fas fa-redo"></i> Try Again
        </button>
      </div>
    `
  }
}

// Show no results message
function showNoResults(message) {
  const productsContainer = document.getElementById("productsContainer")
  if (productsContainer) {
    productsContainer.innerHTML = `
      <div class="no-products-message">
        <i class="fas fa-search"></i>
        <p>${message}</p>
        ${
          window.currentSearchQuery
            ? `
          <button onclick="clearSearch()" class="clear-search-btn" style="margin-top: 1rem; padding: 0.8rem 1.5rem; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
            <i class="fas fa-times"></i> Clear Search
          </button>
        `
            : ""
        }
      </div>
    `
  }
}

// Clear search
function clearSearch() {
  const searchBox = document.getElementById("searchBox")
  const mobileSearchBox = document.getElementById("mobileSearchBox")
  if (searchBox) {
    searchBox.value = ""
  }
  if (mobileSearchBox) {
    mobileSearchBox.value = ""
  }
  window.currentSearchQuery = ""
  hideAutocomplete()
  hideMobileAutocomplete()
  applyFilters()
}

// Update product count display
function updateProductCount() {
  const currentPageCountElement = document.getElementById("currentPageCount")

  if (currentPageCountElement) {
    const isMobile = window.innerWidth <= 768

    if (isMobile) {
      return
    }

    const totalPages = Math.ceil(window.filteredProducts.length / window.productsPerPage)
    const startIndex = (window.currentPage - 1) * window.productsPerPage
    const endIndex = Math.min(startIndex + window.productsPerPage, window.filteredProducts.length)
    const currentPageCount = endIndex - startIndex

    currentPageCountElement.textContent = currentPageCount
  }
}

// Update pagination
function updatePagination(totalPages) {
  const pagination = document.getElementById("pagination")
  const pageNumbers = document.getElementById("pageNumbers")
  const prevBtn = document.getElementById("prevBtn")
  const nextBtn = document.getElementById("nextBtn")

  const isMobile = window.innerWidth <= 768

  if (isMobile || totalPages <= 1) {
    if (pagination) pagination.style.display = "none"
    return
  }

  if (pagination) pagination.style.display = "flex"

  if (pageNumbers) {
    pageNumbers.textContent = `Page ${window.currentPage} of ${totalPages}`
  }

  if (prevBtn) {
    prevBtn.disabled = window.currentPage === 1
  }

  if (nextBtn) {
    nextBtn.disabled = window.currentPage === totalPages
  }
}

// Change page
function changePage(delta) {
  const totalPages = Math.ceil(window.filteredProducts.length / window.productsPerPage)
  const newPage = window.currentPage + delta

  if (newPage >= 1 && newPage <= totalPages) {
    window.currentPage = newPage
    renderProducts(window.filteredProducts)
    updateProductCount()

    const productsSection = document.querySelector(".products-section")
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth" })
    }
  }
}

// Set grid view
function setGridView(columns) {
  const productGrid = document.getElementById("productsContainer")
  const viewBtns = document.querySelectorAll(".view-btn")

  viewBtns.forEach((btn) => btn.classList.remove("active"))
  event.target.closest(".view-btn").classList.add("active")

  switch (columns) {
    case 3:
      productGrid.style.gridTemplateColumns = "repeat(auto-fit, minmax(320px, 1fr))"
      break
    case 4:
      productGrid.style.gridTemplateColumns = "repeat(auto-fit, minmax(280px, 1fr))"
      break
    default:
      productGrid.style.gridTemplateColumns = "repeat(auto-fit, minmax(320px, 1fr))"
  }
}

// Update cart count
function updateCartCount() {
  try {
    const cart = JSON.parse(localStorage.getItem("cart")) || []
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0)
    const cartCountElement = document.getElementById("cartCount")
    const mobileCartCountElement = document.getElementById("mobileCartCount")
    const cartItemCountElement = document.getElementById("cartItemCount")

    if (cartCountElement) {
      cartCountElement.textContent = totalCount
    }
    if (mobileCartCountElement) {
      mobileCartCountElement.textContent = totalCount
    }
    if (cartItemCountElement) {
      cartItemCountElement.textContent = `${totalCount} items`
    }
  } catch (error) {
    console.error("Error updating cart count:", error)
  }
}

// Update cart display
function updateCartDisplay() {
  const cartItems = document.getElementById("cartItems")
  const cartTotal = document.getElementById("cartTotal")
  const checkoutBtn = document.getElementById("checkoutBtn")

  if (!cartItems) return

  try {
    const cart = JSON.parse(localStorage.getItem("cart")) || []

    if (cart.length === 0) {
      cartItems.innerHTML = `
        <div class="empty-cart">
          <div class="empty-cart-icon">
            <i class="fas fa-shopping-cart"></i>
          </div>
          <h4>Your cart is empty</h4>
          <p>Add some delicious snacks to get started!</p>
          <button class="browse-products-btn" onclick="toggleCart()">
            <i class="fas fa-plus"></i> Browse Products
          </button>
        </div>
      `
      if (cartTotal) cartTotal.textContent = "₹0"
      if (checkoutBtn) checkoutBtn.disabled = true
      return
    }

    let totalAmount = 0

    cartItems.innerHTML = cart
      .map((item) => {
        const itemTotal = item.price * item.quantity
        totalAmount += itemTotal

        return `
          <div class="cart-item">
            <div class="cart-item-image">
              <img src="${item.image || "/placeholder.svg?height=60&width=60"}" alt="${item.name}" />
            </div>
            <div class="cart-item-details">
              <div class="cart-item-name">${item.name}</div>
              <div class="cart-item-variant">${item.variant}</div>
              <div class="cart-item-price">
                <span class="cart-item-current-price">₹${itemTotal.toFixed(2)}</span>
              </div>
              <div class="cart-item-actions">
                <div class="quantity-control">
                  <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, '${item.variant}', -1)">-</button>
                  <input type="number" class="quantity-input" value="${item.quantity}" readonly>
                  <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, '${item.variant}', 1)">+</button>
                </div>
                <button class="remove-item-btn" onclick="removeFromCart(${item.id}, '${item.variant}')" title="Remove item">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        `
      })
      .join("")

    if (cartTotal) cartTotal.textContent = `₹${totalAmount.toFixed(2)}`
    if (checkoutBtn) checkoutBtn.disabled = totalAmount === 0
  } catch (error) {
    console.error("Error updating cart display:", error)
  }
}

// Update cart quantity
function updateCartQuantity(productId, variant, change) {
  try {
    const cart = JSON.parse(localStorage.getItem("cart")) || []
    const itemIndex = cart.findIndex((item) => item.id === productId && item.variant === variant)

    if (itemIndex !== -1) {
      cart[itemIndex].quantity += change

      if (cart[itemIndex].quantity <= 0) {
        cart.splice(itemIndex, 1)
      }

      localStorage.setItem("cart", JSON.stringify(cart))
      updateCartCount()
      syncCartCounts()
      updateCartDisplay()
    }
  } catch (error) {
    console.error("Error updating cart quantity:", error)
  }
}

// Remove from cart
function removeFromCart(productId, variant) {
  try {
    const cart = JSON.parse(localStorage.getItem("cart")) || []
    const filteredCart = cart.filter((item) => !(item.id === productId && item.variant === variant))

    localStorage.setItem("cart", JSON.stringify(filteredCart))
    updateCartCount()
    syncCartCounts()
    updateCartDisplay()

    showToast("Item removed from cart", "success")
  } catch (error) {
    console.error("Error removing from cart:", error)
  }
}

// Toggle cart popup
function toggleCart() {
  const cartPopup = document.getElementById("cartPopup")
  if (cartPopup) {
    cartPopup.classList.toggle("active")
    if (cartPopup.classList.contains("active")) {
      updateCartDisplay()
    }
  }
}

// Enhanced address modal for checkout flow
// ✅ Fetch data & render modal
async function showAddressSelectionModal() {
  try {
    const response = await fetch(`/api/user/addresses?id=${userDetails.id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      savedAddresses = data.addresses || []

      const storedId = Number.parseInt(localStorage.getItem("selectedAddressId"))
      if (storedId) {
        selectedAddress = savedAddresses.find((addr) => addr.id === storedId) || null
      }

      renderAddressSelectionModal() // ✅ use separate renderer
    } else {
      throw new Error("Failed to fetch saved addresses")
    }
  } catch (err) {
    console.error("Error fetching addresses:", err)
    showToast("Unable to fetch saved addresses", "error")
  }
}

function renderAddressSelectionModal() {
  const modal = document.createElement("div")
  modal.id = "addressSelectionModal"
  modal.className = "address-selection-modal"

  const hasAddresses = savedAddresses.length > 0
  const showFullForm = !hasAddresses

  modal.innerHTML = `
    <div class="address-modal-content">
      <div class="address-modal-header">
        <h3>Select Delivery Address</h3>
        <button class="address-modal-close" onclick="closeAddressSelectionModal()">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="address-modal-body">
        ${
          hasAddresses
            ? `
          <div class="saved-addresses-section">
            <h4>Saved Addresses</h4>
            <div class="saved-addresses-list">
              ${savedAddresses
                .map(
                  (address, index) => `
                <div class="address-option ${selectedAddress && selectedAddress.id === address.id ? "selected" : ""}"
                     onclick="selectAddressAndContinue(${index})">
                  <div class="address-content">
                    <div class="address-type">
                      <i class="fas fa-${address.type === "home" ? "home" : address.type === "office" ? "building" : "map-marker-alt"}"></i>
                      <span>${(address.type || "home").charAt(0).toUpperCase() + (address.type || "home").slice(1)}</span>
                    </div>
                    <div class="address-details">
                      <p>${address.line1}</p>
                      ${address.line2 ? `<p>${address.line2}</p>` : ""}
                      <p>${address.city}, ${address.state} - ${address.pincode}</p>
                    </div>
                    ${
                      selectedAddress && selectedAddress.id === address.id
                        ? `
                      <div class="selected-badge">
                        <i class="fas fa-check-circle"></i>
                        <span>Selected</span>
                      </div>
                    `
                        : ""
                    }
                  </div>
                  <div class="address-actions">
                    <button class="delete-address-btn" onclick="event.stopPropagation(); deleteAddress(${index});">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
          <div class="address-divider"><span>OR</span></div>
        `
            : ""
        }

         Add Address Section 
        <div class="add-address-section">
          <h4>Add New Address</h4>

          ${
            hasAddresses
              ? `
            <button class="toggle-add-address-btn" onclick="toggleAddAddressForm()">
              <i class="fas fa-plus"></i> Add Address
            </button>
          `
              : ""
          }

          <div class="address-form" id="addressForm" style="display: ${showFullForm ? "block" : "none"};">
            <div class="form-group">
              <label for="newAddressLine1">Address Line 1 *</label>
              <input type="text" id="newAddressLine1" placeholder="House/Flat No, Building Name" required>
            </div>
            <div class="form-group">
              <label for="newAddressLine2">Address Line 2</label>
              <input type="text" id="newAddressLine2" placeholder="Street, Area, Landmark">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="newCity">City *</label>
                <input type="text" id="newCity" placeholder="Enter city" required>
              </div>
              <div class="form-group">
                <label for="newState">State *</label>
                <input type="text" id="newState" placeholder="Enter state" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="newPincode">Pincode *</label>
                <input type="text" id="newPincode" placeholder="Enter pincode" pattern="[0-9]{6}" required>
              </div>
              <div class="form-group">
                <label for="newAddressType">Type</label>
                <select id="newAddressType">
                  <option value="home">Home</option>
                  <option value="office">Office</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <button class="add-address-btn" onclick="addAddressAndContinue()">
              <i class="fas fa-plus"></i> Add Address & Continue
            </button>
          </div>
        </div>
      </div>

      ${
        selectedAddress
          ? `
        <div class="address-modal-footer">
          <button class="continue-checkout-btn" onclick="continueToPayment()">
            <i class="fas fa-credit-card"></i> Continue to Payment
          </button>
        </div>
      `
          : ""
      }
    </div>
  `

  document.body.appendChild(modal)
  document.body.classList.add("modal-open")
}

// Toggle form show/hide
function toggleAddAddressForm() {
  const form = document.getElementById("addressForm")
  form.style.display = form.style.display === "none" ? "block" : "none"
}
async function deleteAddress(index) {
  const addressToDelete = savedAddresses[index]
  if (!addressToDelete) return

  const confirmDelete = confirm("Are you sure you want to delete this address?")
  if (!confirmDelete) return

  try {
    const response = await fetch(`/api/user/address?address_id=${addressToDelete.id}&user_id=${userDetails.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    })

    if (response.ok) {
      showToast("Address deleted successfully", "success")

      // Remove from frontend list
      savedAddresses.splice(index, 1)
      if (selectedAddress && selectedAddress.id === addressToDelete.id) {
        selectedAddress = null
        localStorage.removeItem("selectedAddressId")
      }

      // Re-render modal
      closeAddressSelectionModal()
      renderAddressSelectionModal()
    } else {
      const data = await response.json()
      console.error("Failed to delete address:", data)
      showToast(data.detail || "Failed to delete address", "error")
    }
  } catch (err) {
    console.error("Error deleting address:", err)
    showToast("Error deleting address", "error")
  }
}

// Close address selection modal
function closeAddressSelectionModal() {
  const modal = document.getElementById("addressSelectionModal")
  if (modal) {
    modal.remove()
    document.body.classList.remove("modal-open")
  }
}

// Select address and continue
function selectAddressAndContinue(index) {
  if (index >= 0 && index < savedAddresses.length) {
    selectedAddress = savedAddresses[index]
    localStorage.setItem("selectedAddressId", selectedAddress.id)

    // Update modal to show continue button
    const modal = document.getElementById("addressSelectionModal")
    if (modal) {
      const footer = modal.querySelector(".address-modal-footer")
      if (!footer) {
        const modalContent = modal.querySelector(".address-modal-content")
        modalContent.innerHTML += `
          <div class="address-modal-footer">
            <button class="continue-checkout-btn" onclick="continueToPayment()">
              <i class="fas fa-credit-card"></i>
              Continue to Payment
            </button>
          </div>
        `
      }

      // Update selected state
      modal.querySelectorAll(".address-option").forEach((option, i) => {
        if (i === index) {
          option.classList.add("selected")
          if (!option.querySelector(".selected-badge")) {
            option.querySelector(".address-content").innerHTML += `
              <div class="selected-badge">
                <i class="fas fa-check-circle"></i>
                <span>Selected</span>
              </div>
            `
          }
        } else {
          option.classList.remove("selected")
          const badge = option.querySelector(".selected-badge")
          if (badge) {
            badge.remove()
          }
        }
      })
    }

    showToast("Address selected successfully", "success")
  }
}
async function addAddressAndContinue() {
  const line1 = document.getElementById("newAddressLine1").value.trim()
  const line2 = document.getElementById("newAddressLine2").value.trim()
  const city = document.getElementById("newCity").value.trim()
  const state = document.getElementById("newState").value.trim()
  const pincode = document.getElementById("newPincode").value.trim()
  const type = document.getElementById("newAddressType").value

  if (!line1 || !city || !state || !pincode) {
    showToast("Please fill all required fields", "error")
    return
  }

  const pincodeRegex = /^\d{6}$/
  if (!pincodeRegex.test(pincode)) {
    showToast("Please enter a valid 6-digit pincode", "error")
    return
  }

  if (!userDetails.id) {
    showToast("Please login to add address", "error")
    return
  }

  const newAddress = {
    id: userDetails.id,
    address: {
      id: Date.now(), // or use a better unique generator if needed
      line1,
      line2,
      city,
      state,
      pincode,
      type,
    },
  }

  try {
    const response = await fetch("/api/user/address", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      body: JSON.stringify(newAddress),
    })

    if (response.ok) {
      const data = await response.json()
      const savedAddress = data.addresses?.slice(-1)[0] // get the last added address
      savedAddresses.push(savedAddress)
      selectedAddress = savedAddress
      localStorage.setItem("selectedAddressId", selectedAddress.id)

      showToast("Address added successfully", "success")

      // Close modal and continue to payment
      closeAddressSelectionModal()
      setTimeout(() => {
        continueToPayment()
      }, 1000)
    } else {
      const errorData = await response.json()
      console.error("Failed to save address:", errorData)
      showToast("Failed to save address", "error")
    }
  } catch (error) {
    console.error("Error saving address:", error)
    showToast("Error saving address", "error")
  }
}

// Continue to payment
function continueToPayment() {
  closeAddressSelectionModal()
  setTimeout(() => {
    initiatePayment()
  }, 500)
}

// Proceed to checkout - Show address selection modal from cart
async function proceedToCheckout() {
  console.log("Checkout initiated from cart")

  const cart = JSON.parse(localStorage.getItem("cart")) || []

  if (cart.length === 0) {
    showToast("Your cart is empty!", "error")
    return
  }

  if (!userDetails.id) {
    showToast("Please login to proceed with checkout", "error")
    setTimeout(() => {
      window.location.href = "/login"
    }, 2000)
    return
  }

  // Always show address selection modal when checkout is clicked from cart
  showAddressSelectionModal()
}

// Initiate Razorpay payment process
async function initiatePayment() {
  const cart = JSON.parse(localStorage.getItem("cart")) || []

  if (!selectedAddress) {
    showToast("Please select a delivery address first", "error")
    showAddressSelectionModal()
    return
  }

  if (!userDetails.id) {
    showToast("Please login to proceed with payment", "error")
    setTimeout(() => {
      window.location.href = "/login"
    }, 2000)
    return
  }

  // Show loading state
  const checkoutBtn = document.querySelector(".continue-checkout-btn") || document.querySelector(".checkout-btn")
  const originalText = checkoutBtn.innerHTML
  checkoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...'
  checkoutBtn.disabled = true

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = totalAmount >= 500 ? 0 : 50
  const finalAmount = totalAmount + shipping

  try {
    // ✅ Create order on backend
    const orderResponse = await fetch("/create-order/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      body: JSON.stringify({
        amount: finalAmount,
      }),
    })

    if (!orderResponse.ok) {
      throw new Error("Failed to create order")
    }

    const orderData = await orderResponse.json()
    const { order_id, key: razorpay_key } = orderData

    // Initialize Razorpay
    const options = {
      key: razorpay_key,
      amount: finalAmount * 100, // convert to paise
      currency: "INR",
      name: "Gokhale Bandu",
      description: "Order Payment",
      order_id: order_id,
      handler: async (response) => {
        try {
          // ✅ Verify payment on backend
          const verifyResponse = await fetch("/verify-payment/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
            },
            body: JSON.stringify({
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              user_details: userDetails,
              delivery_address: selectedAddress,
              items: cart,
              amount: finalAmount,
            }),
          })

          if (verifyResponse.ok) {
            showToast("Payment successful! Order placed.", "success")

            // Clear cart
            localStorage.setItem("cart", JSON.stringify([]))

            // Update UI
            updateCartCount()
            syncCartCounts()
            updateCartDisplay()

            const result = await verifyResponse.json()

            setTimeout(() => {
              showToast("Redirecting to orders page...", "info")
              window.location.href = `/orders.html?order_id=${result.order_id}`
            }, 2000)
          } else {
            throw new Error("Payment verification failed")
          }
        } catch (error) {
          console.error("Payment verification error:", error)
          showToast("Payment verification failed. Please contact support.", "error")
        }
      },
      prefill: {
        name: `${userDetails.first_name} ${userDetails.last_name || ""}`,
        email: userDetails.email || "",
        contact: userDetails.mobile_number || "",
      },
      notes: {
        address_id: selectedAddress.id,
        user_id: userDetails.id,
      },
      theme: {
        color: "#667eea",
      },
      modal: {
        ondismiss: () => {
          showToast("Payment cancelled", "info")
          checkoutBtn.innerHTML = originalText
          checkoutBtn.disabled = false
        },
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  } catch (error) {
    console.error("Payment initiation error:", error)
    showToast("Error initiating payment: " + error.message, "error")
  } finally {
    if (checkoutBtn) {
      checkoutBtn.innerHTML = originalText
      checkoutBtn.disabled = false
    }
  }
}

// Authentication functions
function toggleAuth() {
  try {
    const user = JSON.parse(localStorage.getItem("user"))
    if (user && user.first_name) {
      const dropdown = document.getElementById("userDropdown")
      if (dropdown) {
        dropdown.classList.toggle("active")
      }
    } else {
      window.location.href = "/login"
    }
  } catch (err) {
    console.error("Error in toggleAuth:", err)
    window.location.href = "/login"
  }
}

// Mobile authentication toggle - Fixed function
function toggleMobileAuth() {
  try {
    const user = JSON.parse(localStorage.getItem("user"))
    if (user && user.first_name) {
      const dropdown = document.getElementById("mobileUserDropdown")
      if (dropdown) {
        dropdown.classList.toggle("active")
      }
    } else {
      window.location.href = "/login"
    }
  } catch (err) {
    console.error("Error in toggleMobileAuth:", err)
    window.location.href = "/login"
  }
}

function confirmLogout() {
  localStorage.removeItem("user")
  const authText = document.getElementById("authText")

  if (authText) authText.textContent = "Sign In"

  const dropdown = document.getElementById("userDropdown")
  if (dropdown) dropdown.classList.remove("active")

  const mobileDropdown = document.getElementById("mobileUserDropdown")
  if (mobileDropdown) mobileDropdown.classList.remove("active")

  showToast("Logged out successfully!", "success")
  setTimeout(() => {
    window.location.href = "/"
  }, 1000)
}

// Navigate to product details
function goToProductDetails(productId) {
  window.location.href = `/product-details.html?id=${productId}`
}

// Setup click outside handlers
function setupClickOutsideHandlers() {
  document.addEventListener("click", (e) => {
    const authContainer = document.querySelector(".auth-container")
    const mobileAuthContainer = document.querySelector(".mobile-auth-container")
    const userDropdown = document.getElementById("userDropdown")
    const mobileUserDropdown = document.getElementById("mobileUserDropdown")

    if (
      authContainer &&
      !authContainer.contains(e.target) &&
      mobileAuthContainer &&
      !mobileAuthContainer.contains(e.target)
    ) {
      if (userDropdown) {
        userDropdown.classList.remove("active")
      }
      if (mobileUserDropdown) {
        mobileUserDropdown.classList.remove("active")
      }
    }

    const searchContainer = document.querySelector(".search-container")
    const mobileSearchContainer = document.querySelector(".mobile-search-container")
    const autocompleteDropdown = document.getElementById("autocompleteDropdown")
    const mobileAutocompleteDropdown = document.getElementById("mobileAutocompleteDropdown")

    if (searchContainer && !searchContainer.contains(e.target)) {
      if (autocompleteDropdown) {
        hideAutocomplete()
      }
    }

    if (mobileSearchContainer && !mobileSearchContainer.contains(e.target)) {
      if (mobileAutocompleteDropdown) {
        hideMobileAutocomplete()
      }
    }
  })

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const cartPopup = document.getElementById("cartPopup")
      if (cartPopup && cartPopup.classList.contains("active")) {
        toggleCart()
      }

      const userDropdown = document.getElementById("userDropdown")
      if (userDropdown && userDropdown.classList.contains("active")) {
        userDropdown.classList.remove("active")
      }

      const mobileUserDropdown = document.getElementById("mobileUserDropdown")
      if (mobileUserDropdown && mobileUserDropdown.classList.contains("active")) {
        mobileUserDropdown.classList.remove("active")
      }

      hideAutocomplete()
      hideMobileAutocomplete()

      // Close address selection modal
      closeAddressSelectionModal()
    }
  })
}

// Handle window resize for responsive behavior
window.addEventListener("resize", () => {
  renderProducts(window.filteredProducts)
  updateProductCount()
  syncCartCounts()

  if (window.innerWidth <= 768) {
    setupScrollHandler()
  } else {
    const header = document.getElementById("header")
    if (header) {
      header.classList.remove("hidden")
    }
  }
})

// Utility function for debouncing
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Initialize cart display on page load
document.addEventListener("DOMContentLoaded", () => {
  updateCartDisplay()
  syncCartCounts()
})

// Export functions for global access
window.showAddressSelectionModal = showAddressSelectionModal
window.closeAddressSelectionModal = closeAddressSelectionModal
window.selectAddressAndContinue = selectAddressAndContinue
window.addAddressAndContinue = addAddressAndContinue
window.continueToPayment = continueToPayment
window.proceedToCheckout = proceedToCheckout
window.toggleMobileAuth = toggleMobileAuth
