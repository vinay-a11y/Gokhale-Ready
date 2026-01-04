// Enhanced Orders Management System with Updated Tracking Process
class OrdersManager {
  constructor() {
    this.orders = []
    this.currentOrders = []
    this.recentOrders = []
    this.maxRecentOrders = 15
    this.userDetails = {}
    this.selectedOrderForCancel = null
    this.currentFilter = "all"
    this.init()
  }

  async init() {
    this.showLoading(true)
    await this.loadUserDetails()
    await this.fetchOrdersFromBackend()
    this.categorizeOrders()
    this.renderOrders()
    this.setupEventListeners()
    this.showLoading(false)
  }

  loadUserDetails() {
    const user = JSON.parse(localStorage.getItem("user"))
    console.log("User from localStorage:", user)
    if (user && user.id) {
      this.userDetails = user
      // Update auth button and dropdown
      const authButton = document.getElementById("authButton")
      const authText = document.getElementById("authText")
      const dropdownUserName = document.getElementById("dropdownUserName")
      const dropdownUserEmail = document.getElementById("dropdownUserEmail")

      if (authButton && authText) {
        authText.textContent = `Hello ${user.first_name}`
        authButton.onclick = () => this.toggleUserMenu()
      }

      if (dropdownUserName) {
        dropdownUserName.textContent = user.first_name || "Guest User"
      }

      if (dropdownUserEmail) {
        dropdownUserEmail.textContent = user.email || "guest@example.com"
      }
    } else {
      console.log("No user found in localStorage")
      // Redirect to login if no user
      this.showNotification("Please login to view orders", "error")
      setTimeout(() => {
        window.location.href = "/login"
      }, 2000)
    }
  }

  async fetchOrdersFromBackend() {
    try {
      console.log("Fetching orders from backend...")
      const response = await fetch(`/api/orders?user_id=${this.userDetails.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        console.log("Loaded orders from API:", result)
        this.orders = Array.isArray(result.data) ? result.data : []
        // Transform backend data to match frontend structure
        this.orders = this.orders.map((order) => this.transformBackendOrder(order))
      } else {
        throw new Error(`API failed with status: ${response.status}`)
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      this.showNotification("Failed to load orders. Please try again later.", "error")
      this.orders = []
    }

    // Sort orders by date (newest first)
    this.orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }

  transformBackendOrder(backendOrder) {
    return {
      id: backendOrder.id,
      razorpay_order_id: backendOrder.razorpay_order_id || `ORD${backendOrder.id}`,
      user_id: backendOrder.user_id,
      total_amount: Number.parseFloat(backendOrder.total_amount),
      payment_status: backendOrder.payment_status,
      order_status: backendOrder.order_status,
      created_at: backendOrder.created_at,
      updated_at: backendOrder.updated_at,
      address: backendOrder.address || {
        line1: "Address not available",
        city: "N/A",
        state: "N/A",
        pincode: "000000",
        type: "home",
      },
      items: backendOrder.items || [],
      notes: backendOrder.notes || "",
      estimatedTime: this.getEstimatedTime(backendOrder.order_status),
      progress: this.getProgressPercentage(backendOrder.order_status),
    }
  }

  categorizeOrders() {
    // Current orders: not delivered, completed, cancelled, or rejected
    this.currentOrders = this.orders.filter(
      (order) => !["delivered", "completed", "cancelled", "rejected"].includes(order.order_status),
    )

    // Recent orders: delivered, completed, cancelled, and rejected orders, limited to maxRecentOrders
    this.recentOrders = this.orders
      .filter((order) => ["delivered", "completed", "cancelled", "rejected"].includes(order.order_status))
      .slice(0, this.maxRecentOrders)
  }

  getEstimatedTime(status) {
    // Updated for new progression: placed → confirmed → in process → dispatched → delivered
    const times = {
      placed: "Processing order...",
      confirmed: "Preparing your order",
      inprocess: "Being prepared",
      dispatched: "Out for delivery",
      delivered: "Delivered",
      completed: "Completed",
      cancelled: "Cancelled",
      rejected: "Rejected",
    }
    return times[status] || ""
  }

  getProgressPercentage(status) {
    // Updated progression: placed → confirmed → in process → dispatched → delivered
    const progress = {
      placed: 20,
      confirmed: 40,
      inprocess: 60,
      dispatched: 80,
      delivered: 100,
      completed: 100,
      cancelled: 0,
      rejected: 0,
    }
    return progress[status] || 0
  }

  renderOrders() {
    this.renderCurrentOrders()
    this.renderRecentOrders()
    this.updateOrderCounts()
  }

  renderCurrentOrders() {
    const container = document.getElementById("currentOrdersList")
    if (this.currentOrders.length === 0) {
      container.innerHTML = this.renderEmptyState("No current orders", "All caught up! No active orders at the moment.")
      return
    }
    container.innerHTML = this.currentOrders.map((order) => this.renderOrderCard(order, true)).join("")
  }

  renderRecentOrders() {
    const container = document.getElementById("recentOrdersList")
    if (this.recentOrders.length === 0) {
      container.innerHTML = this.renderEmptyState("No recent orders", "Your recent orders will appear here.")
      return
    }
    container.innerHTML = this.recentOrders.map((order) => this.renderOrderCard(order, false, true)).join("")
  }

  renderOrderCard(order, showProgress = false, isRecent = false) {
    const formattedDate = this.formatDate(new Date(order.created_at))
    const itemsPreview = order.items.slice(0, 4)
    const remainingItems = order.items.length - 4

    const canCancel = !isRecent && ["placed", "confirmed"].includes(order.order_status)

    return `
      <div class="order-card" onclick="openOrderModal('${order.id}')">
        <div class="order-header">
          <div class="order-info">
            <h3>Order #${order.razorpay_order_id}</h3>
            <div class="order-meta">
              <div class="order-date">${formattedDate}</div>
              <div class="order-total">₹${order.total_amount.toFixed(2)}</div>
            </div>
          </div>
          <div class="order-status">
            <div class="status-badge ${order.order_status.replace(" ", "-")}" id="status-${order.id}">
              <i class="fas fa-${this.getStatusIcon(order.order_status)}"></i>
              ${order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1).replace("-", " ")}
            </div>
            ${order.estimatedTime ? `<div class="estimated-time">${order.estimatedTime}</div>` : ""}
          </div>
        </div>
        
        ${showProgress && ["confirmed", "inprocess", "dispatched", "delivered"].includes(order.order_status) ? this.renderProgressIndicator(order) : ""}
        
        <div class="order-items">
          <div class="order-items-preview">
            ${itemsPreview
              .map(
                (item) => `
                <div class="item-image" title="${item.name}">
                  ${
                    item.image
                      ? `<img src="${item.image}" alt="${item.name}">`
                      : `<div class="placeholder">${item.icon || "🍪"}</div>`
                  }
                </div>
              `,
              )
              .join("")}
            ${remainingItems > 0 ? `<div class="item-image">+${remainingItems}</div>` : ""}
          </div>
          <div class="items-summary">
            ${order.items.length} item${order.items.length > 1 ? "s" : ""} •
            ${order.items.reduce((sum, item) => sum + item.quantity, 0)} quantity
          </div>
        </div>
        
        <div class="order-actions" onclick="event.stopPropagation()">
          <button class="action-btn primary" onclick="openOrderModal('${order.id}')">
            <i class="fas fa-eye"></i>
            View Details
          </button>
          ${
            canCancel
              ? `
                <button class="action-btn danger" onclick="openCancelModal('${order.id}')" title="Cancel this order">
                  <i class="fas fa-times"></i>
                  Cancel Order
                </button>
              `
              : ""
          }
          ${
            order.order_status === "delivered"
              ? `
                <button class="action-btn secondary" onclick="reorderItems('${order.id}')">
                  <i class="fas fa-redo"></i>
                  Reorder
                </button>
              `
              : ""
          }
        </div>
      </div>
    `
  }

  renderProgressIndicator(order) {
    // Updated progression: placed → confirmed → in process → dispatched → delivered
    const steps = ["placed", "confirmed", "inprocess", "dispatched", "delivered"]
    const currentStepIndex = steps.indexOf(order.order_status)

    return `
      <div class="progress-indicator">
        <div class="progress-steps">
          <div class="progress-line">
            <div class="progress-line-fill" style="width: ${order.progress}%"></div>
          </div>
          ${steps
            .map(
              (step, index) => `
                <div class="progress-step ${index <= currentStepIndex ? "completed" : ""} ${
                  index === currentStepIndex ? "active" : ""
                }">
                  ${index <= currentStepIndex ? '<i class="fas fa-check"></i>' : index + 1}
                </div>
              `,
            )
            .join("")}
        </div>
        <div class="progress-labels">
          <span>Placed</span>
          <span>Confirmed</span>
          <span>In Process</span>
          <span>Dispatched</span>
          <span>Delivered</span>
        </div>
      </div>
    `
  }

  renderEmptyState(title, message) {
    return `
      <div class="empty-state">
        <i class="fas fa-box-open"></i>
        <h3>${title}</h3>
        <p>${message}</p>
      </div>
    `
  }

  getStatusIcon(status) {
    const icons = {
      placed: "clock",
      confirmed: "check",
      inprocess: "cog",
      dispatched: "truck",
      delivered: "box",
      completed: "check-double",
      cancelled: "times-circle",
      rejected: "ban",
    }
    return icons[status] || "circle"
  }

  formatDate(date) {
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return (
        "Today, " +
        date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      )
    } else if (diffDays === 2) {
      return (
        "Yesterday, " +
        date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      )
    } else if (diffDays <= 7) {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
      })
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }

  updateOrderCounts() {
    document.getElementById("currentOrderCount").textContent = this.currentOrders.length
    document.getElementById("recentOrderCount").textContent = this.recentOrders.length
  }

  setupEventListeners() {
    // Close modal when clicking outside
    document.getElementById("orderModal").addEventListener("click", (e) => {
      if (e.target.id === "orderModal") {
        closeOrderModal()
      }
    })

    const cancelModal = document.getElementById("cancelModal")
    if (cancelModal) {
      cancelModal.addEventListener("click", (e) => {
        if (e.target.id === "cancelModal") {
          closeCancelModal()
        }
      })
    }

    // Search functionality
    const searchInput = document.getElementById("searchInput")
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchOrders(e.target.value)
      })
    }

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      const dropdown = document.getElementById("userDropdown")
      const authButton = document.getElementById("authButton")
      if (dropdown && !dropdown.contains(e.target) && !authButton.contains(e.target)) {
        dropdown.classList.remove("active")
      }
    })
  }

  searchOrders(query) {
    if (!query.trim()) {
      this.renderOrders()
      return
    }

    const filteredCurrent = this.currentOrders.filter(
      (order) =>
        order.razorpay_order_id.toLowerCase().includes(query.toLowerCase()) ||
        order.items.some((item) => item.name.toLowerCase().includes(query.toLowerCase())),
    )

    const filteredRecent = this.recentOrders.filter(
      (order) =>
        order.razorpay_order_id.toLowerCase().includes(query.toLowerCase()) ||
        order.items.some((item) => item.name.toLowerCase().includes(query.toLowerCase())),
    )

    document.getElementById("currentOrdersList").innerHTML =
      filteredCurrent.length > 0
        ? filteredCurrent.map((order) => this.renderOrderCard(order, true)).join("")
        : this.renderEmptyState("No matching orders", "Try searching with different keywords.")

    document.getElementById("recentOrdersList").innerHTML =
      filteredRecent.length > 0
        ? filteredRecent.map((order) => this.renderOrderCard(order, false, true)).join("")
        : this.renderEmptyState("No matching orders", "Try searching with different keywords.")
  }

  showLoading(show) {
    const loadingOverlay = document.getElementById("loadingOverlay")
    if (loadingOverlay) {
      if (show) {
        loadingOverlay.classList.add("active")
      } else {
        loadingOverlay.classList.remove("active")
      }
    }
  }

  showNotification(message, type = "info") {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll(".toast")
    existingToasts.forEach((toast) => toast.remove())

    const toast = document.createElement("div")
    toast.className = `toast ${type}`
    toast.innerHTML = `
      <i class="fas fa-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"}"></i>
      ${message}
    `

    const container = document.getElementById("toastContainer")
    if (container) {
      container.appendChild(toast)
    } else {
      document.body.appendChild(toast)
    }

    setTimeout(() => toast.remove(), 5000)
  }

  getOrderById(orderId) {
    return this.orders.find((order) => order.id == orderId)
  }

  toggleUserMenu() {
    const dropdown = document.getElementById("userDropdown")
    if (dropdown) {
      dropdown.classList.toggle("active")
    }
  }

  setOrderFilter(filter) {
    this.currentFilter = filter
    // Update active category button
    const categoryItems = document.querySelectorAll(".category-item")
    categoryItems.forEach((item) => item.classList.remove("active"))
    const activeButton = document.querySelector(`[onclick="setOrderFilter('${filter}')"]`)
    if (activeButton) {
      activeButton.classList.add("active")
    }

    // Filter and render orders based on selection
    this.filterAndRenderOrders(filter)
  }

  filterAndRenderOrders(filter) {
    let filteredCurrent = this.currentOrders
    let filteredRecent = this.recentOrders

    switch (filter) {
      case "current":
        filteredRecent = []
        break
      case "delivered":
        filteredCurrent = []
        filteredRecent = this.recentOrders.filter((order) => order.order_status === "delivered")
        break
      case "cancelled":
        filteredCurrent = this.currentOrders.filter((order) => order.order_status === "cancelled")
        filteredRecent = this.recentOrders.filter((order) => order.order_status === "cancelled")
        break
      case "all":
      default:
        // Show all orders
        break
    }

    // Render filtered orders
    const currentContainer = document.getElementById("currentOrdersList")
    const recentContainer = document.getElementById("recentOrdersList")

    currentContainer.innerHTML =
      filteredCurrent.length > 0
        ? filteredCurrent.map((order) => this.renderOrderCard(order, true)).join("")
        : this.renderEmptyState("No orders found", "No orders match the selected filter.")

    recentContainer.innerHTML =
      filteredRecent.length > 0
        ? filteredRecent.map((order) => this.renderOrderCard(order, false, true)).join("")
        : this.renderEmptyState("No orders found", "No orders match the selected filter.")

    // Update counts
    document.getElementById("currentOrderCount").textContent = filteredCurrent.length
    document.getElementById("recentOrderCount").textContent = filteredRecent.length
  }
}

// Global functions
let ordersManager

function openOrderModal(orderId) {
  const order = ordersManager.getOrderById(orderId)
  if (!order) return

  const modal = document.getElementById("orderModal")
  const modalBody = document.getElementById("orderModalBody")

  const orderDate = new Date(order.created_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const updatedDate = new Date(order.updated_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal >= 500 ? 0 : 50
  const tax = subtotal * 0.18 // 18% GST

  const canCancelInModal = ["placed", "confirmed"].includes(order.order_status)

  modalBody.innerHTML = `
    <div class="order-details">
      <!-- Order Information -->
      <div class="detail-section">
        <h4><i class="fas fa-info-circle"></i> Order Information</h4>
        <div class="detail-row">
          <span class="detail-label">Order ID:</span>
          <span class="detail-value">${order.razorpay_order_id}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Order Date:</span>
          <span class="detail-value">${orderDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Expected Delivery:</span>
          <span class="detail-value">${order.delivery_date ? formatDate(order.delivery_date) : "N/A"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value">
            <span class="status-badge ${order.order_status.replace(" ", "-")}">
              <i class="fas fa-${ordersManager.getStatusIcon(order.order_status)}"></i>
              ${order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1).replace("-", " ")}
            </span>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment Status:</span>
          <span class="detail-value" style="text-transform: capitalize;">${order.payment_status}</span>
        </div>
      </div>
      
      ${
        ["confirmed", "inprocess", "dispatched", "delivered"].includes(order.order_status)
          ? `
            <!-- Order Progress -->
            <div class="detail-section">
              <h4><i class="fas fa-route"></i> Order Progress</h4>
              ${ordersManager.renderProgressIndicator(order)}
            </div>
          `
          : ""
      }
      
      <!-- Delivery Address -->
      <div class="detail-section">
        <h4><i class="fas fa-map-marker-alt"></i> Delivery Address</h4>
        <div class="address-details">
          <div class="address-type-badge">
            <i class="fas fa-${order.address.type === "home" ? "home" : order.address.type === "office" ? "building" : "map-marker-alt"}"></i>
            ${(order.address.type || "home").charAt(0).toUpperCase() + (order.address.type || "home").slice(1)}
          </div>
          <p>${order.address.line1}</p>
          ${order.address.line2 ? `<p>${order.address.line2}</p>` : ""}
          <p>${order.address.city}, ${order.address.state} - ${order.address.pincode}</p>
        </div>
      </div>
      
      <!-- Order Items -->
      <div class="detail-section">
        <h4><i class="fas fa-shopping-bag"></i> Order Items (${order.items.length})</h4>
        <div class="order-items-detail">
          ${order.items
            .map(
              (item) => `
                <div class="order-item-detail">
                  <div class="item-detail-image">
                    ${
                      item.image
                        ? `<img src="${item.image}" alt="${item.name}">`
                        : `<div class="placeholder">${item.icon || "🍪"}</div>`
                    }
                  </div>
                  <div class="item-detail-info">
                    <div class="item-detail-name">${item.name}</div>
                    <div class="item-detail-variant">${item.variant}</div>
                    <div class="item-detail-quantity">Quantity: ${item.quantity}</div>
                  </div>
                  <div class="item-detail-price">₹${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              `,
            )
            .join("")}
        </div>
      </div>
      
      <!-- Price Breakdown -->
      <div class="detail-section">
        <h4><i class="fas fa-calculator"></i> Bill Summary</h4>
        <div class="detail-row">
          <span class="detail-label">Subtotal:</span>
          <span class="detail-value">₹${subtotal.toFixed(2)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Delivery Charges:</span>
          <span class="detail-value">${shipping === 0 ? "Free" : "₹" + shipping.toFixed(2)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">GST (18%):</span>
          <span class="detail-value">₹${tax.toFixed(2)}</span>
        </div>
        <div class="detail-row" style="border-top: 2px solid #e9ecef; padding-top: 0.8rem; margin-top: 0.8rem; font-weight: 700;">
          <span class="detail-label">Total Amount:</span>
          <span class="detail-value" style="color: #28a745; font-size: 1.1rem;">₹${order.total_amount.toFixed(2)}</span>
        </div>
      </div>
      
      <!-- Order Actions -->
      <div class="detail-section">
        <h4><i class="fas fa-cogs"></i> Quick Actions</h4>
        <div class="order-actions">
          ${
            canCancelInModal
              ? `
                <button class="action-btn danger" onclick="openCancelModal('${order.id}'); closeOrderModal();" title="Cancel this order">
                  <i class="fas fa-times"></i>
                  Cancel Order
                </button>
              `
              : ""
          }
          
          ${
            order.order_status === "delivered"
              ? `
                <button class="action-btn primary" onclick="reorderItems('${order.id}')">
                  <i class="fas fa-redo"></i>
                  Reorder Items
                </button>
              `
              : ""
          }
          
          <a href="/support?order=${order.razorpay_order_id}" class="action-btn secondary">
            <i class="fas fa-headset"></i>
            Contact Support
          </a>
          
          <button class="action-btn secondary" onclick="downloadBill('${order.id}')">
            <i class="fas fa-download"></i>
            Download Invoice
          </button>
        </div>
      </div>
      
      ${
        order.notes
          ? `
            <div class="detail-section">
              <h4><i class="fas fa-sticky-note"></i> Order Notes</h4>
              <p style="margin: 0; color: #666; font-size: 0.95rem; line-height: 1.6;">${order.notes}</p>
            </div>
          `
          : ""
      }
    </div>
  `

  modal.classList.add("active")
}

function closeOrderModal() {
  document.getElementById("orderModal").classList.remove("active")
}

function openCancelModal(orderId) {
  const order = ordersManager.getOrderById(orderId)
  if (!order) {
    ordersManager.showNotification("Order not found", "error")
    return
  }

  if (!["placed", "confirmed"].includes(order.order_status)) {
    ordersManager.showNotification(
      `Cannot cancel an order that is ${order.order_status}. Only orders with 'placed' or 'confirmed' status can be cancelled.`,
      "error",
    )
    return
  }

  ordersManager.selectedOrderForCancel = orderId
  const modal = document.getElementById("cancelModal")

  // Reset form and populate order details
  const cancelReason = document.getElementById("cancelReason")
  if (cancelReason) {
    cancelReason.value = ""
  }

  // Update modal content with order details
  const orderInfo = document.getElementById("cancelOrderInfo")
  if (orderInfo) {
    orderInfo.innerHTML = `
      <div class="cancel-order-details">
        <h4>Order #${order.razorpay_order_id}</h4>
        <p>Status: <span class="status-badge ${order.order_status}">${order.order_status.toUpperCase()}</span></p>
        <p>Total: ₹${order.total_amount.toFixed(2)}</p>
        <p class="warning-text">
          <i class="fas fa-exclamation-triangle"></i>
          Are you sure you want to cancel this order? This action cannot be undone.
        </p>
      </div>
    `
  }

  modal.classList.add("active")
}

function closeCancelModal() {
  const modal = document.getElementById("cancelModal")
  modal.classList.remove("active")
  ordersManager.selectedOrderForCancel = null
}

async function confirmCancelOrder() {
  const orderId = ordersManager.selectedOrderForCancel
  if (!orderId) {
    ordersManager.showNotification("No order selected for cancellation", "error")
    return
  }

  const order = ordersManager.getOrderById(orderId)
  if (!order) {
    ordersManager.showNotification("Order not found", "error")
    return
  }

  const confirmBtn = document.querySelector(".cancel-confirm-btn")
  const originalText = confirmBtn.innerHTML

  try {
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cancelling...'
    confirmBtn.disabled = true

    // ✅ Directly call backend PATCH endpoint
    const response = await fetch(`/cancel-order/${orderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to cancel order")
    }

    const result = await response.json()
    console.log("Order cancelled successfully:", result)

    // ✅ Update local order state after backend confirms
    order.order_status = "cancelled"
    order.updated_at = new Date().toISOString()
    order.estimatedTime = "Cancelled"
    order.progress = 0

    ordersManager.showNotification(result.message || "Order cancelled successfully!", "success")
  } catch (error) {
    console.error("Error cancelling order:", error)
    ordersManager.showNotification(
      error.message || "Failed to cancel order. Please try again later.",
      "error"
    )
  } finally {
    confirmBtn.innerHTML = originalText
    confirmBtn.disabled = false
    closeCancelModal()
    ordersManager.categorizeOrders()
    ordersManager.renderOrders()
  }
}

function reorderItems(orderId) {
  const order = ordersManager.getOrderById(orderId)
  if (!order) {
    ordersManager.showNotification("Order not found", "error")
    return
  }

  // Add items to cart and redirect to products page
  const cartItems = order.items.map((item) => ({
    id: item.id,
    name: item.name,
    variant: item.variant,
    price: item.price,
    quantity: item.quantity,
    image: item.image,
  }))

  // Store in localStorage for cart
  localStorage.setItem("reorderItems", JSON.stringify(cartItems))
  ordersManager.showNotification("Items added to cart! Redirecting to products page...", "success")

  setTimeout(() => {
    window.location.href = "/products"
  }, 1500)
}

function downloadBill(orderId) {
  const order = ordersManager.getOrderById(orderId)
  if (!order) {
    ordersManager.showNotification("Order not found", "error")
    return
  }

  // Create a complete HTML bill
  const billContent = generateBillHTML(order)

  // Create and download the file
  const blob = new Blob([billContent], { type: "text/html" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `SnackMart_Invoice_${order.razorpay_order_id}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)

  ordersManager.showNotification("Invoice downloaded successfully", "success")
}

function generateBillHTML(order) {
  const orderDate = new Date(order.created_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal >= 500 ? 0 : 50
  const tax = subtotal * 0.18 // 18% GST

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ${order.razorpay_order_id}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .invoice-container {
            border: 2px solid #6a4c93;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        
        .invoice-header {
            background: linear-gradient(135deg, #6a4c93, #9b59b6);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .logo {
            font-size: 2.5rem;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .company-info {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .invoice-content {
            padding: 30px;
        }
        
        .invoice-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
        }
        
        .info-section h3 {
            color: #6a4c93;
            margin-bottom: 15px;
            font-size: 1.2rem;
            border-bottom: 2px solid #6a4c93;
            padding-bottom: 5px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
        }
        
        .info-label {
            font-weight: 600;
            color: #666;
        }
        
        .info-value {
            font-weight: 700;
            color: #333;
        }
        
        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .status-${order.order_status.replace(" ", "-")} {
            background: ${order.order_status === "delivered" ? "#d4edda" : order.order_status === "completed" ? "#d1ecf1" : order.order_status === "cancelled" ? "#f8d7da" : order.order_status === "rejected" ? "#f8d7da" : "#fff3cd"};
            color: ${order.order_status === "delivered" ? "#155724" : order.order_status === "completed" ? "#0c5460" : order.order_status === "cancelled" ? "#721c24" : order.order_status === "rejected" ? "#721c24" : "#856404"};
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .items-table th {
            background: linear-gradient(135deg, #6a4c93, #9b59b6);
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
        }
        
        .items-table td {
            padding: 15px;
            border-bottom: 1px solid #eee;
        }
        
        .items-table tr:last-child td {
            border-bottom: none;
        }
        
        .items-table tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .item-name {
            font-weight: 600;
            color: #333;
        }
        
        .item-variant {
            font-size: 0.9rem;
            color: #666;
            margin-top: 3px;
        }
        
        .price-breakdown {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            margin: 30px 0;
        }
        
        .price-breakdown h3 {
            color: #6a4c93;
            margin-bottom: 20px;
            font-size: 1.3rem;
            text-align: center;
        }
        
        .price-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            padding: 8px 0;
            border-bottom: 1px solid #dee2e6;
        }
        
        .price-row:last-child {
            border-bottom: none;
            border-top: 3px solid #6a4c93;
            padding-top: 15px;
            margin-top: 15px;
            font-size: 1.2rem;
            font-weight: 700;
        }
        
        .price-label {
            font-weight: 500;
            color: #666;
        }
        
        .price-value {
            font-weight: 600;
            color: #333;
        }
        
        .total-amount {
            color: #28a745 !important;
            font-size: 1.3rem !important;
        }
        
        .address-section {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
        }
        
        .address-section h3 {
            color: #1976d2;
            margin-bottom: 15px;
        }
        
        .address-type {
            display: inline-block;
            background: #1976d2;
            color: white;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: 600;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        
        .invoice-footer {
            text-align: center;
            padding: 30px;
            background: #f8f9fa;
            border-top: 3px solid #6a4c93;
        }
        
        .thank-you {
            font-size: 1.3rem;
            font-weight: 600;
            color: #6a4c93;
            margin-bottom: 15px;
        }
        
        .contact-info {
            color: #666;
            font-size: 0.95rem;
            line-height: 1.8;
        }
        
        .contact-info strong {
            color: #333;
        }
        
        @media print {
            body {
                padding: 0;
            }
            .invoice-container {
                border: none;
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="invoice-header">
            <div class="logo">🍪 SnackMart</div>
            <div class="company-info">
                Premium Snacks & Treats Delivery<br>
                GST: 27ABCDE1234F1Z5 | FSSAI: 12345678901234
            </div>
        </div>
        
        <!-- Content -->
        <div class="invoice-content">
            <!-- Invoice Information -->
            <div class="invoice-info">
                <div class="info-section">
                    <h3>📋 Order Details</h3>
                    <div class="info-row">
                        <span class="info-label">Order ID:</span>
                        <span class="info-value">${order.razorpay_order_id}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Order Date:</span>
                        <span class="info-value">${orderDate}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Status:</span>
                        <span class="info-value">
                            <span class="status-badge status-${order.order_status.replace(" ", "-")}">
                                ${order.order_status.toUpperCase().replace("-", " ")}
                            </span>
                        </span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Payment:</span>
                        <span class="info-value">${order.payment_status.toUpperCase()}</span>
                    </div>
                </div>
                
                <div class="info-section">
                    <h3>👤 Customer Details</h3>
                    <div class="info-row">
                        <span class="info-label">Name:</span>
                        <span class="info-value">${ordersManager.userDetails.name || ordersManager.userDetails.first_name || "N/A"}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${ordersManager.userDetails.email}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Phone:</span>
                        <span class="info-value">${ordersManager.userDetails.phone || "N/A"}</span>
                    </div>
                </div>
            </div>
            
            <!-- Delivery Address -->
            <div class="address-section">
                <h3>📍 Delivery Address</h3>
                <div class="address-type">${order.address.type || "home"}</div>
                <div>
                    ${order.address.line1}<br>
                    ${order.address.line2 ? order.address.line2 + "<br>" : ""}
                    ${order.address.city}, ${order.address.state} - ${order.address.pincode}
                </div>
            </div>
            
            <!-- Items Table -->
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item Details</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items
                      .map(
                        (item) => `
                        <tr>
                            <td>
                                <div class="item-name">${item.name}</div>
                                <div class="item-variant">Variant: ${item.variant}</div>
                            </td>
                            <td>${item.quantity}</td>
                            <td>₹${item.price.toFixed(2)}</td>
                            <td>₹${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
            
            <!-- Price Breakdown -->
            <div class="price-breakdown">
                <h3>💰 Price Breakdown</h3>
                <div class="price-row">
                    <span class="price-label">Subtotal (${order.items.length} items):</span>
                    <span class="price-value">₹${subtotal.toFixed(2)}</span>
                </div>
                <div class="price-row">
                    <span class="price-label">Delivery Charges:</span>
                    <span class="price-value">${shipping === 0 ? "FREE" : "₹" + shipping.toFixed(2)}</span>
                </div>
                <div class="price-row">
                    <span class="price-label">GST (18%):</span>
                    <span class="price-value">₹${tax.toFixed(2)}</span>
                </div>
                <div class="price-row">
                    <span class="price-label">Total Amount:</span>
                    <span class="price-value total-amount">₹${order.total_amount.toFixed(2)}</span>
                </div>
            </div>
            
            ${
              order.notes
                ? `
                <div class="address-section">
                    <h3>📝 Order Notes</h3>
                    <p>${order.notes}</p>
                </div>
            `
                : ""
            }
        </div>
        
        <!-- Footer -->
        <div class="invoice-footer">
            <div class="thank-you">Thank you for choosing SnackMart! 🙏</div>
            <div class="contact-info">
                <strong>Customer Support:</strong> support@snackmart.com | +91 9999-999-999<br>
                <strong>Website:</strong> www.snackmart.com<br>
                <strong>Address:</strong> 123 Food Street, Snack City, Mumbai - 400001<br><br>
                <em>This is a computer-generated invoice. No signature required.</em>
            </div>
        </div>
    </div>
</body>
</html>
  `
}

// Search functionality
function performSearch() {
  const searchInput = document.getElementById("searchInput")
  if (searchInput && ordersManager) {
    ordersManager.searchOrders(searchInput.value)
  }
}

// Order filter functions for mobile
function setOrderFilter(filter) {
  if (ordersManager) {
    ordersManager.setOrderFilter(filter)
  }
}

// Auth functions
function toggleAuth() {
  if (ordersManager) {
    ordersManager.toggleUserMenu()
  }
}

function confirmLogout() {
  localStorage.clear()
  ordersManager.showNotification("Logged out successfully", "success")
  setTimeout(() => {
    window.location.href = "/"
  }, 1500)
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  ordersManager = new OrdersManager()
})
