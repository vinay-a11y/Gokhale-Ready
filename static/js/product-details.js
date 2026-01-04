// Global variables
let currentProduct = null
window.allProducts = []
window.filteredProducts = []
window.currentSearchQuery = ""
window.lastScrollY = 0
let selectedVariant = null

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  initializeWebsite()
  checkAuthState()
  updateCartCount()
  syncCartCounts()
  await loadProductDetails()
  await loadRelatedProducts()
  initializeScrollToTop()
  setupScrollHandler()
  await loadAllProducts()
})

// Initialize website functionality
function initializeWebsite() {
  // Set up search functionality for both desktop and mobile
  const searchBox = document.getElementById("searchInput")
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

  // Set up click outside handlers
  setupClickOutsideHandlers()
}

// Setup scroll handler for mobile navbar hide/show
function setupScrollHandler() {
  if (window.innerWidth <= 768) {
    let ticking = false

    function updateNavbar() {
      const header = document.getElementById("header")
      const currentScrollY = window.scrollY

      if (currentScrollY > window.lastScrollY && currentScrollY > 100) {
        // Scrolling down
        header.classList.add("hidden")
      } else {
        // Scrolling up
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

// Load product details from backend
async function loadProductDetails() {
  const params = new URLSearchParams(window.location.search)
  const productId = params.get("id")

  if (!productId) {
    showError("Product Not Found", "The product you are looking for does not exist.")
    return
  }

  try {
    const response = await fetch(`/api/products/${productId}`)
    if (!response.ok) {
      throw new Error(`Failed to load product details: ${response.status}`)
    }

    const product = await response.json()
    console.log("Product data:", product)

    currentProduct = product
    renderProductDetails(product)
    updateBreadcrumb(product.item_name)
  } catch (error) {
    console.error("Error loading product:", error)
    showError("Loading Error", "Failed to load product details. Please try again later.")
  }
}

// Render product details with slab-style variants
function renderProductDetails(product) {
  const container = document.getElementById("productContainer")

  // Create variants array
  const variants = []
  for (let i = 1; i <= 4; i++) {
    const packing = product[`packing_0${i}`]
    const price = product[`price_0${i}`]
    if (packing && price) {
      variants.push({ packing, price })
    }
  }

  // Set default selected variant
  selectedVariant = variants[0] || { packing: "250gm", price: product.price_01 || 100 }

  // Calculate discount
  let discountPercentage = 0
  if (product.original_price && selectedVariant.price) {
    discountPercentage = Math.round(((product.original_price - selectedVariant.price) / product.original_price) * 100)
  }

  container.innerHTML = `
        <div class="product-layout">
            <div class="product-gallery">
                <div class="product-image">
                    <img src="${product.image_url || "/placeholder.svg?height=400&width=400"}"
                         alt="${product.item_name}"
                         loading="lazy"
                         onload="this.parentElement.classList.add('loaded')"
                         onerror="this.src='/placeholder.svg?height=400&width=400'; this.classList.add('image-error');" />
                </div>
                
                <!-- Description and Specifications below image -->
                <div class="product-details-section">
                    <div class="product-tabs">
                        <div class="tabs-header">
                            <button class="tab-btn active" onclick="switchTab(this, 'description')">Description</button>
                            <button class="tab-btn" onclick="switchTab(this, 'specifications')">Specifications</button>
                        </div>
                        
                        <div class="tab-content active" id="description">
                            <p>${product.description || "Delicious snack made with premium ingredients and traditional recipes. Perfect for sharing with family and friends or enjoying as a personal treat."}</p>
                            <p>Our products are made with the finest ingredients, ensuring a delightful experience with every bite. Perfect for snacking at home, gifting to loved ones, or enjoying during special occasions.</p>
                        </div>
                        
                        <div class="tab-content" id="specifications">
                            <ul>
                                <li><strong>Category:</strong> ${product.category || "N/A"}</li>
                                <li><strong>Weight:</strong> ${selectedVariant.packing || "N/A"}</li>
                                <li><strong>Shelf Life:</strong> ${product.shelf_life_days || "N/A"} days</li>
                                <li><strong>Delivery Time:</strong> ${product.lead_time_days || "N/A"} days</li>
                                <li><strong>Storage:</strong> Store in a cool, dry place</li>
                                <li><strong>Ingredients:</strong> Premium quality ingredients (see packaging for details)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="product-info">
                <div class="product-header">
                    <div class="product-category">${product.category || "Snack"}</div>
                    <h1 class="product-title">${product.item_name}</h1>
                    
                    <div class="product-rating">
                        <div class="stars">
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star"></i>
                            <i class="fas fa-star-half-alt"></i>
                        </div>
                        <span class="rating-count">(${Math.floor(Math.random() * 100) + 50} reviews)</span>
                    </div>
                    
                    <div class="product-price-container">
                        <div class="product-price" id="currentPrice">₹${selectedVariant.price?.toFixed(2) || "N/A"}</div>
                        ${
                          product.original_price
                            ? `
                                    <div class="product-original-price">₹${product.original_price.toFixed(2)}</div>
                                    <div class="product-discount">${discountPercentage}% OFF</div>
                                `
                            : ""
                        }
                    </div>
                </div>
                
                ${
                  variants.length > 0
                    ? `
                            <div class="product-variants">
                                <h3 class="variants-title">Select Variant</h3>
                                <div class="variants-list">
                                    ${variants
                                      .map(
                                        (v, i) => `
                                                <div class="variant-item ${i === 0 ? "active" : ""}" 
                                                    onclick="selectVariant(this, ${v.price}, '${v.packing}')">
                                                    <div class="variant-name">${v.packing}</div>
                                                    <div class="variant-price">₹${v.price.toFixed(2)}</div>
                                                </div>
                                            `,
                                      )
                                      .join("")}
                                </div>
                            </div>
                        `
                    : ""
                }
                
                <div class="product-actions">
                    <div class="quantity-selector">
                        <button class="quantity-btn" onclick="updateQuantity(-1)">-</button>
                        <input type="number" class="quantity-input" value="1" min="1" max="10" id="quantity" readonly>
                        <button class="quantity-btn" onclick="updateQuantity(1)">+</button>
                    </div>
                    
                    <button class="add-to-cart-btn" onclick="addToCartFromDetails(${product.id})">
                        <i class="fas fa-plus"></i>
                        Add to Cart
                    </button>
                    
                    <button class="wishlist-btn" onclick="toggleWishlist(this)">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
            </div>
        </div>
    `

  // Set default selected variant and ensure first variant is active
  selectedVariant = variants[0] || { packing: "250gm", price: product.price_01 || 100 }

  // Ensure the first variant is marked as active
  setTimeout(() => {
    const firstVariantElement = document.querySelector(".variant-item")
    if (firstVariantElement && !firstVariantElement.classList.contains("active")) {
      firstVariantElement.classList.add("active")
    }
  }, 100)
}

// Load related products from backend (filtered by category)
async function loadRelatedProducts() {
  try {
    console.log("Fetching related products...")
    const response = await fetch("/api/products", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to load related products: ${response.status}`)
    }

    const data = await response.json()
    const products = data.products || data || []

    // Process and validate product structure
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

    if (!currentProduct) {
      throw new Error("No current product defined")
    }

    // Filter by category excluding current product
    let relatedProducts = processedProducts.filter(
      (p) => p.id !== currentProduct.id && p.category === currentProduct.category
    )

    // Fallback: If no same category products found
    if (relatedProducts.length === 0) {
      relatedProducts = processedProducts.filter((p) => p.id !== currentProduct.id)
    }

    // Limit to 8
    relatedProducts = relatedProducts.slice(0, 8)

    renderRelatedProducts(relatedProducts)
  } catch (error) {
    console.error("Error loading related products:", error)
    const container = document.getElementById("relatedGrid")
    container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Failed to load related products.</p>'
  }
}


// Render related products with variant dropdowns
function renderRelatedProducts(products) {
  const container = document.getElementById("relatedGrid")

  if (!products || products.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No related products found.</p>'
    return
  }

  container.innerHTML = products
    .map((product) => {
      const variants = []

      // Try extracting variants using flexible pattern
      for (let i = 1; i <= 4; i++) {
        const packing = product[`packing_0${i}`] || (product.variants?.[i - 1]?.packing ?? null)
        const price = product[`price_0${i}`] || (product.variants?.[i - 1]?.price ?? null)

        if (packing && price) {
          variants.push({ packing, price })
        }
      }

      // Ensure at least one default variant
      const defaultVariant =
        variants[0] ||
        product.variants?.[0] || {
          price: product.price_01 || 100,
          packing: product.packing_01 || "250gm",
        }

      return `
        <div class="product-card" onclick="goToProduct(${product.id})">
          <div class="product-image">
            <img src="${product.image_url || "/placeholder.svg?height=180&width=280"}"
                 alt="${product.item_name}"
                 loading="lazy"
                 onerror="this.src='/placeholder.svg?height=180&width=280'; this.classList.add('image-error');" />
          </div>
          <div class="product-info">
            <h3>${product.item_name}</h3>
            <p class="product-description">${(product.description || "").substring(0, 80)}...</p>
            <div class="product-price" id="relatedPrice-${product.id}">₹${defaultVariant.price?.toFixed(2)}</div>

            ${
              variants.length > 0
                ? `
                <select class="variants-dropdown" id="relatedVariant-${product.id}" 
                        onclick="event.stopPropagation();" 
                        onchange="updateRelatedProductPrice(${product.id}, this.value)">
                  ${variants
                    .map(
                      (v, i) => `
                      <option value="${v.price}" ${i === 0 ? "selected" : ""}>
                        ${v.packing} - ₹${v.price.toFixed(2)}
                      </option>
                    `
                    )
                    .join("")}
                </select>
              `
                : ""
            }

            <button class="add-to-cart" onclick="event.stopPropagation(); addToCartFromRelated(${product.id})">
              <i class="fas fa-plus"></i> Add to Cart
            </button>
          </div>
        </div>
      `
    })
    .join("")
}
async function addToCartFromRelated(productId) {
  const button = document.querySelector(`#relatedGrid button[onclick*="addToCartFromRelated(${productId})"]`);
  if (button) {
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }

  try {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    const variantDropdown = document.getElementById(`relatedVariant-${productId}`);
    const selectedPrice = variantDropdown ? parseFloat(variantDropdown.value) : null;
    const selectedVariant = variantDropdown
      ? variantDropdown.options[variantDropdown.selectedIndex].text.split(" - ")[0]
      : null;

    const product =
      (window.allProducts || []).find((p) => p.id === Number(productId)) ||
      (window.filteredProducts || []).find((p) => p.id === Number(productId));

    if (!product) {
      showToast("Product not found", "error");
      return;
    }

    const defaultVariant = product.variants?.[0] || {
      price: product.price_01 || 100,
      packing: product.packing_01 || "250gm",
    };

    const finalPrice = selectedPrice || defaultVariant.price;
    const finalVariant = selectedVariant || defaultVariant.packing;

    const existingItemIndex = cart.findIndex(
      (item) => item.id === Number(productId) && item.variant === finalVariant
    );

    if (existingItemIndex !== -1) {
      cart[existingItemIndex].quantity += 1;
    } else {
      const cartItem = {
        id: Number(productId),
        name: product.item_name,
        price: finalPrice,
        description: product.description,
        image: product.image_url,
        category: product.category,
        quantity: 1,
        variant: finalVariant,
      };
      cart.push(cartItem);
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    // Safe calls with error handling
    try { updateCartCount?.(); } catch (err) {}
    try { syncCartCounts?.(); } catch (err) {}
    try { updateCartDisplay?.(); } catch (err) {}

    // Show success toast
    showToast(`${product.item_name} (${finalVariant}) added to cart!`, "success");

    // Animate cart icons
    const cartIcon = document.querySelector(".cart-icon");
    const mobileCartIcon = document.querySelector(".mobile-cart-icon");

    if (cartIcon) {
      cartIcon.style.animation = "pulse 0.6s ease";
      setTimeout(() => (cartIcon.style.animation = ""), 600);
    }

    if (mobileCartIcon) {
      mobileCartIcon.style.animation = "pulse 0.6s ease";
      setTimeout(() => (mobileCartIcon.style.animation = ""), 600);
    }

  } catch (error) {
    console.error("Error adding related product to cart:", error);
    // Don't show error toast unless cart item truly failed
    if (!localStorage.getItem("cart")) {
      showToast("Failed to add item to cart. Please try again.", "error");
    }
  } finally {
    if (button) {
      button.disabled = false;
      const isMobile = window.innerWidth <= 768;
      button.innerHTML = isMobile
        ? '<i class="fas fa-shopping-cart"></i> Add'
        : '<i class="fas fa-shopping-cart"></i>';
    }
  }
}


// Update related product price when variant changes
function updateRelatedProductPrice(productId, price, optionText) {
  const priceElement = document.getElementById(`relatedPrice-${productId}`)
  if (priceElement) {
    priceElement.textContent = `₹${Number.parseFloat(price).toFixed(2)}`
  }
}



// Fixed variant selection function
function selectVariant(element, price, packing) {
  // Remove active class from all variants
  document.querySelectorAll(".variant-item").forEach((item) => {
    item.classList.remove("active")
  })

  // Add active class to selected variant
  element.classList.add("active")

  // Update selected variant with proper data types
  selectedVariant = {
    price: Number.parseFloat(price),
    packing: packing.toString(),
  }

  // Update price display
  document.getElementById("currentPrice").textContent = `₹${selectedVariant.price.toFixed(2)}`

  // Update specifications tab if visible
  const specificationsTab = document.getElementById("specifications")
  if (specificationsTab) {
    const weightLi = specificationsTab.querySelector("li")
    if (weightLi) {
      weightLi.innerHTML = `<strong>Weight:</strong> ${selectedVariant.packing}`
    }
  }

  // Log for debugging
  console.log("Selected variant:", selectedVariant)
}

function updateQuantity(change) {
  const input = document.getElementById("quantity")
  const currentValue = Number.parseInt(input.value)
  const newValue = Math.max(1, Math.min(10, currentValue + change))
  input.value = newValue
}

function toggleWishlist(button) {
  button.classList.toggle("active")
  if (button.classList.contains("active")) {
    button.innerHTML = '<i class="fas fa-heart"></i>'
    showToast("Added to wishlist!", "success")
  } else {
    button.innerHTML = '<i class="far fa-heart"></i>'
    showToast("Removed from wishlist", "info")
  }
}

function switchTab(button, tabId) {
  // Update active button
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active")
  })
  button.classList.add("active")

  // Update active content
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active")
  })
  document.getElementById(tabId).classList.add("active")
}

// Cart functions
function addToCartFromDetails(productId) {
  const quantity = Number.parseInt(document.getElementById("quantity").value)

  // Ensure we have a selected variant
  if (!selectedVariant) {
    // Get the first variant as fallback
    const firstVariant = document.querySelector(".variant-item.active")
    if (firstVariant) {
      const price = firstVariant.querySelector(".variant-price").textContent.replace("₹", "")
      const packing = firstVariant.querySelector(".variant-name").textContent
      selectedVariant = { price: Number.parseFloat(price), packing: packing }
    }
  }

  console.log("Adding to cart with variant:", selectedVariant)
  addToCart(productId, quantity, selectedVariant)
}

async function addToCart(productId, quantity = 1, variantInfo = null) {
  const button = document.querySelector(".add-to-cart-btn") || event.target

  // Disable button temporarily
  if (button) {
    button.disabled = true
    const originalText = button.innerHTML
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...'

    setTimeout(() => {
      button.disabled = false
      button.innerHTML = originalText
    }, 1000)
  }

  try {
    let product = currentProduct

    // If we don't have the current product, fetch it from the backend
    if (!product) {
      const response = await fetch(`/api/products/${productId}`)
      if (response.ok) {
        product = await response.json()
      } else {
        throw new Error("Product not found")
      }
    }

    if (!product) {
      showToast("Product not found", "error")
      return
    }

    const cart = JSON.parse(localStorage.getItem("cart")) || []

    // Use the variant info passed or fall back to selected variant
    const currentVariant = variantInfo || selectedVariant

    // Create unique identifier for cart item (including variant)
    const cartItemId = `${Number.parseInt(productId)}_${currentVariant?.packing || "default"}`

    // Check if product with same variant already in cart
    const existingItemIndex = cart.findIndex((item) => `${item.id}_${item.variant || "default"}` === cartItemId)

    if (existingItemIndex !== -1) {
      cart[existingItemIndex].quantity += quantity
    } else {
      // Add new item to cart
      const cartItem = {
        id: Number.parseInt(productId),
        name: product.item_name,
        price: currentVariant ? currentVariant.price : product.price_01,
        description: product.description,
        image: product.image_url,
        category: product.category,
        quantity: quantity,
        variant: currentVariant ? currentVariant.packing : null,
      }

      console.log("Adding cart item:", cartItem)
      cart.push(cartItem)
    }

    // Save to localStorage
    localStorage.setItem("cart", JSON.stringify(cart))

    // Update cart count
    updateCartCount()
    syncCartCounts()
    updateCartDisplay()

    // Show success message
    const variantText = currentVariant?.packing || ""
    const productName = variantText ? `${product.item_name} (${variantText})` : product.item_name
    showToast(`${productName} added to cart!`, "success")

    // Add animation effect
    animateAddToCart(button)

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
          localStorage.setItem("cart", JSON.stringify(result.data.cart))
        }
      }
    } catch (syncError) {
      console.warn("Failed to sync cart with server:", syncError)
    }
  } catch (error) {
    console.error("Error adding to cart:", error)
    showToast("Failed to add item to cart", "error")
  }
}

function animateAddToCart(button) {
  const cartIcon = document.querySelector(".cart-icon")
  const mobileCartIcon = document.querySelector(".mobile-cart-icon")

  if (cartIcon) {
    cartIcon.classList.add("pulse")
    setTimeout(() => cartIcon.classList.remove("pulse"), 300)
  }

  if (mobileCartIcon) {
    mobileCartIcon.classList.add("pulse")
    setTimeout(() => mobileCartIcon.classList.remove("pulse"), 300)
  }
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || []
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartCountElements = document.querySelectorAll("#cartCount, #cartBadge, #cartItemCount, #mobileCartCount")

  cartCountElements.forEach((element) => {
    if (element) {
      element.textContent = totalItems
    }
  })
}

function toggleCart() {
  const popup = document.getElementById("cartPopup")
  const isActive = popup.classList.contains("active")

  if (isActive) {
    popup.classList.remove("active")
  } else {
    popup.classList.add("active")
    updateCartDisplay()
  }
}

function updateCartDisplay() {
  const container = document.getElementById("cartItems")
  const cart = JSON.parse(localStorage.getItem("cart")) || []

  if (cart.length === 0) {
    container.innerHTML = `
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

    document.getElementById("cartTotal").textContent = "₹0"
    document.getElementById("cartSubtotal").textContent = "₹0"
    return
  }

  let totalAmount = 0
  const cartHTML = cart
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
                            ${item.variant ? `<div class="cart-item-variant">${item.variant}</div>` : ""}
                            <div class="cart-item-price">
                                <span class="cart-item-current-price">₹${itemTotal.toFixed(2)}</span>
                            </div>
                            <div class="cart-item-actions">
                                <div class="quantity-control">
                                    <button class="quantity-btn" onclick="updateCartItemQuantity(${item.id}, '${item.variant || ""}', -1)">-</button>
                                    <input type="number" class="quantity-input" value="${item.quantity}" readonly>
                                    <button class="quantity-btn" onclick="updateCartItemQuantity(${item.id}, '${item.variant || ""}', 1)">+</button>
                                </div>
                                <button class="remove-item-btn" onclick="removeFromCart(${item.id}, '${item.variant || ""}')" title="Remove item">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `
    })
    .join("")

  container.innerHTML = cartHTML

  // Update totals
  document.getElementById("cartTotal").textContent = `₹${totalAmount.toFixed(2)}`
  document.getElementById("cartSubtotal").textContent = `₹${totalAmount.toFixed(2)}`
}

function updateCartItemQuantity(productId, variant, change) {
  const cart = JSON.parse(localStorage.getItem("cart")) || []
  const itemIndex = cart.findIndex(
    (item) => item.id === Number.parseInt(productId) && ((!item.variant && !variant) || item.variant === variant),
  )

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
}

function removeFromCart(productId, variant) {
  const cart = JSON.parse(localStorage.getItem("cart")) || []
  const itemIndex = cart.findIndex(
    (item) => item.id === Number.parseInt(productId) && ((!item.variant && !variant) || item.variant === variant),
  )

  if (itemIndex !== -1) {
    const removedItem = cart[itemIndex]
    cart.splice(itemIndex, 1)

    localStorage.setItem("cart", JSON.stringify(cart))
    updateCartCount()
    syncCartCounts()
    updateCartDisplay()

    showToast(`${removedItem.name} removed from cart`, "info")
  }
}

// Search functionality
function handleSearchInput() {
  const searchBox = document.getElementById("searchInput")
  if (searchBox) {
    window.currentSearchQuery = searchBox.value.toLowerCase().trim()
    updateAutocomplete()
    if (window.currentSearchQuery === "") {
      hideAutocomplete()
    }
  }
}

function handleMobileSearchInput() {
  const mobileSearchBox = document.getElementById("mobileSearchBox")
  if (mobileSearchBox) {
    window.currentSearchQuery = mobileSearchBox.value.toLowerCase().trim()
    updateMobileAutocomplete()
    if (window.currentSearchQuery === "") {
      hideMobileAutocomplete()
    }
  }
}

function showAutocomplete() {
  const autocompleteDropdown = document.getElementById("autocompleteDropdown")
  if (autocompleteDropdown && window.allProducts.length > 0) {
    updateAutocomplete()
  }
}

function showMobileAutocomplete() {
  const mobileAutocompleteDropdown = document.getElementById("mobileAutocompleteDropdown")
  if (mobileAutocompleteDropdown && window.allProducts.length > 0) {
    updateMobileAutocomplete()
  }
}

function updateAutocomplete() {
  const autocompleteDropdown = document.getElementById("autocompleteDropdown")
  const searchBox = document.getElementById("searchInput")
  if (!autocompleteDropdown || !searchBox) return

  const query = searchBox.value.toLowerCase().trim()
  if (query === "") {
    hideAutocomplete()
    return
  }

  // Get matching products
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

function updateMobileAutocomplete() {
  const mobileAutocompleteDropdown = document.getElementById("mobileAutocompleteDropdown")
  const mobileSearchBox = document.getElementById("mobileSearchBox")
  if (!mobileAutocompleteDropdown || !mobileSearchBox) return

  const query = mobileSearchBox.value.toLowerCase().trim()
  if (query === "") {
    hideMobileAutocomplete()
    return
  }

  // Get matching products
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

function hideAutocomplete() {
  const autocompleteDropdown = document.getElementById("autocompleteDropdown")
  if (autocompleteDropdown) {
    autocompleteDropdown.classList.remove("active")
  }
}

function hideMobileAutocomplete() {
  const mobileAutocompleteDropdown = document.getElementById("mobileAutocompleteDropdown")
  if (mobileAutocompleteDropdown) {
    mobileAutocompleteDropdown.classList.remove("active")
  }
}

function selectProduct(productName) {
  const searchBox = document.getElementById("searchInput")
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

function selectMobileProduct(productName) {
  const mobileSearchBox = document.getElementById("mobileSearchBox")
  const searchBox = document.getElementById("searchInput")

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

function performSearch() {
  const searchBox = document.getElementById("searchInput")
  if (!searchBox) return

  const query = searchBox.value.trim()
  if (query) {
    // Redirect to product page with search query
    window.location.href = `/product.html?search=${encodeURIComponent(query)}`
  }
}

function performMobileSearch() {
  const mobileSearchBox = document.getElementById("mobileSearchBox")
  if (!mobileSearchBox) return

  const query = mobileSearchBox.value.trim()
  if (query) {
    // Redirect to product page with search query
    window.location.href = `/product.html?search=${encodeURIComponent(query)}`
  }
}

// Navigation functions
function goToProduct(productId) {
  window.location.href = `product-details.html?id=${productId}`
}

// Auth functions
function toggleAuth() {
  try {
    const user = JSON.parse(localStorage.getItem("user"))
    if (user && user.first_name) {
      const dropdown = document.getElementById("userDropdown")
      if (dropdown) {
        dropdown.classList.toggle("active")
      }
    } else {
      window.location.href = "/login.html"
    }
  } catch (err) {
    console.error("Error in toggleAuth:", err)
    window.location.href = "/login.html"
  }
}

function confirmLogout() {
  localStorage.removeItem("user")
  const authText = document.getElementById("authText")
  if (authText) authText.textContent = "Sign In"

  const dropdown = document.getElementById("userDropdown")
  if (dropdown) dropdown.classList.remove("active")

  showToast("Logged out successfully!", "success")
  setTimeout(() => {
    window.location.href = "/"
  }, 1000)
}

function checkAuthState() {
  try {
    const user = JSON.parse(localStorage.getItem("user"))
    const authText = document.getElementById("authText")
    const dropdownUserName = document.getElementById("dropdownUserName")
    const dropdownUserEmail = document.getElementById("dropdownUserEmail")

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
    } else {
      if (authText) {
        authText.textContent = "Sign In"
      }
    }
  } catch (error) {
    console.error("Error checking auth state:", error)
  }
}

// Utility functions
function updateBreadcrumb(productName) {
  document.getElementById("breadcrumbProduct").textContent = productName
  document.title = `${productName} - Gokhale Bandu`
}

function showError(title, message) {
  const container = document.getElementById("productContainer")
  container.innerHTML = `
        <div class="error-container">
            <div class="error-icon">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <h2 class="error-title">${title}</h2>
            <p class="error-message">${message}</p>
            <a href="/product.html" class="back-to-products">
                <i class="fas fa-arrow-left"></i>
                Back to Products
            </a>
        </div>
    `
}

function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toast")
  if (!toastContainer) return

  const toast = document.createElement("div")
  toast.className = `toast ${type}`
  toast.innerHTML = `
        <i class="fas fa-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"}"></i>
        ${message}
    `

  toastContainer.appendChild(toast)

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.transform = "translateX(100%)"
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 400)
  }, 3000)
}

function hideToast() {
  const toasts = document.querySelectorAll(".toast")
  toasts.forEach((toast) => {
    toast.style.transform = "translateX(100%)"
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 400)
  })
}

// Scroll to top functionality
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

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  })
}

// Setup click outside handlers
function setupClickOutsideHandlers() {
  document.addEventListener("click", (e) => {
    // Handle auth dropdown
    const authContainer = document.querySelector(".auth-container")
    const mobileAuthContainer = document.querySelector(".mobile-auth-container")
    const userDropdown = document.getElementById("userDropdown")

    if (
      authContainer &&
      !authContainer.contains(e.target) &&
      mobileAuthContainer &&
      !mobileAuthContainer.contains(e.target)
    ) {
      if (userDropdown) {
        userDropdown.classList.remove("active")
      }
    }

    // Handle autocomplete dropdown
    const searchContainer = document.querySelector(".search-container")
    const mobileSearchContainer = document.querySelector(".mobile-search-container")
    if (searchContainer && !searchContainer.contains(e.target)) {
      hideAutocomplete()
    }
    if (mobileSearchContainer && !mobileSearchContainer.contains(e.target)) {
      hideMobileAutocomplete()
    }

    // Cart popup only closes with X button
  })

  // Handle escape key
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

      hideAutocomplete()
      hideMobileAutocomplete()
    }
  })
}

// Handle window resize for responsive behavior
window.addEventListener("resize", () => {
  syncCartCounts()

  // Re-setup scroll handler for mobile
  if (window.innerWidth <= 768) {
    setupScrollHandler()
  } else {
    // Remove hidden class for desktop
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

// Handle URL changes for navigation
window.addEventListener("popstate", () => {
  loadProductDetails()
})

// Error handling for network requests
window.addEventListener("online", () => {
  showToast("Connection restored", "success")
})

window.addEventListener("offline", () => {
  showToast("No internet connection", "error")
})

// Load all products for search functionality
async function loadAllProducts() {
  try {
    const response = await fetch("/api/products")
    if (response.ok) {
      window.allProducts = await response.json()
    }
  } catch (error) {
    console.error("Error loading products for search:", error)
  }
}