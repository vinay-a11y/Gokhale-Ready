// Common cart functionality
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || []
  const total = cart.reduce((sum, item) => sum + item.quantity, 0)
  
  // Update all cart count elements
  const cartCountElements = document.querySelectorAll(".cart-count, #cartCount")
  cartCountElements.forEach(element => {
    if (element) {
      element.textContent = total
      element.style.display = total > 0 ? "flex" : "none"
    }
  })
}

// Update cart count when page loads
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount()
})

// Make updateCartCount available globally
window.updateCartCount = updateCartCount

// Add to cart function for product pages
function addToCart(product) {
  // Get existing cart or initialize empty array
  const cart = JSON.parse(localStorage.getItem("cart")) || []

  // Check if product already exists in cart
  const existingItemIndex = cart.findIndex((item) => item.id === product.id)

  if (existingItemIndex > -1) {
    // Increase quantity if product already in cart
    cart[existingItemIndex].quantity += 1
  } else {
    // Add new product to cart with image
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description,
      quantity: 1,
      icon: product.icon || "🍪",
      image: product.image || null,
    })
  }

  // Save updated cart to localStorage
  localStorage.setItem("cart", JSON.stringify(cart))

  // Update cart count in header
  updateCartCount()

  // Show success message
  const toast = document.createElement("div")
  toast.className = "toast success"
  toast.innerHTML = `
        <i class="fas fa-check-circle"></i>
        ${product.name} added to cart
    `
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 2000)
}
