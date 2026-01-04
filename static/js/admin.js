/**
 * Enhanced Admin Dashboard with New Order Progression and Kitchen Prep Calculator
 * Updated progression: placed → confirmed → in process → dispatched → delivered
 */

// Configuration
const CONFIG = {
  ORDERS_PER_PAGE: 20,
  PRODUCTS_PER_PAGE: 20,
  RECENT_DAYS_FILTER: 10,
  TOAST_DURATION: 3000,
  SEARCH_DEBOUNCE_DELAY: 300,
  API_BASE_URL: "/api/admin/orders",
  PRODUCTS_API_URL: "/api/products",
  AUTO_REFRESH_INTERVAL: 30000,
}

// Application State
const state = {
  currentSection: "orders",
  lastScrollY: 0,
  selectedOrders: new Set(),
  dateFilter: "all",
  categoryFilter: "all",
  autoRefreshEnabled: true,
  autoRefreshTimer: null,
  // Orders state
  allOrders: [],
  filteredOrders: [],
  currentTab: "recent",
  currentPage: 1,
  searchQuery: "",
  sortBy: "created_at",
  sortOrder: "desc",
  isLoading: false,
  // Products state
  allProducts: [],
  filteredProducts: [],
  productsCurrentPage: 1,
  productsSearchQuery: "",
  productsSortBy: "item_name",
  productsSortOrder: "asc",
  productsIsLoading: false,
  editingProduct: null,
  // Kitchen state
  kitchenData: [],
  kitchenStatusFilter: "confirmed,inprocess",
  kitchenIsLoading: false,
}

// DOM Elements
const elements = {
  // Navigation
  navbar: document.getElementById("navbar"),
  navLinks: document.querySelectorAll(".nav-link"),

  // Sections
  ordersSection: document.getElementById("ordersSection"),
  productsSection: document.getElementById("productsSection"),
  kitchenSection: document.getElementById("kitchenSection"),

  // Orders elements
  totalOrders: document.getElementById("totalOrders"),
  recentOrders: document.getElementById("recentOrders"),
  pendingOrders: document.getElementById("pendingOrders"),
  tabButtons: document.querySelectorAll(".tab-btn"),
  tabCounts: {
    recent: document.getElementById("recentCount"),
    placed: document.getElementById("placedCount"),
    confirmed: document.getElementById("confirmedCount"),
    inprocess: document.getElementById("inprocessCount"),
    dispatched: document.getElementById("dispatchedCount"),
    delivered: document.getElementById("deliveredCount"),
    completed: document.getElementById("completedCount"),
    rejected: document.getElementById("rejectedCount"),
    all: document.getElementById("allCount"),
  },
  searchInput: document.getElementById("searchInput"),
  clearSearch: document.getElementById("clearSearch"),
  dateFilter: document.getElementById("dateFilter"),
  startDate: document.getElementById("startDate"),
  endDate: document.getElementById("endDate"),
  sortContainer: document.getElementById("sortContainer"),
  sortSelect: document.getElementById("sortSelect"),
  bulkActionsBtn: document.getElementById("bulkActionsBtn"),
  bulkActionsPanel: document.getElementById("bulkActionsPanel"),
  bulkSelectedCount: document.getElementById("bulkSelectedCount"),
  selectAllOrders: document.getElementById("selectAllOrders"),
  exportBtn: document.getElementById("exportBtn"),
  refreshBtn: document.getElementById("refreshBtn"),
  ordersTable: document.getElementById("ordersTable"),
  ordersTableBody: document.getElementById("ordersTableBody"),
  tableWrapper: document.querySelector(".table-wrapper"),
  loadingState: document.getElementById("loadingState"),
  emptyState: document.getElementById("emptyState"),
  paginationContainer: document.getElementById("paginationContainer"),
  paginationInfo: document.getElementById("paginationInfo"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  pageNumbers: document.getElementById("pageNumbers"),
  orderModal: document.getElementById("orderModal"),
  modalClose: document.getElementById("modalClose"),
  modalBody: document.getElementById("modalBody"),

  // Kitchen elements
  activeOrders: document.getElementById("activeOrders"),
  totalWeight: document.getElementById("totalWeight"),
  uniqueItems: document.getElementById("uniqueItems"),
  kitchenStatusFilter: document.getElementById("kitchenStatusFilter"),
  refreshKitchenBtn: document.getElementById("refreshKitchenBtn"),
  exportKitchenBtn: document.getElementById("exportKitchenBtn"),
  kitchenTable: document.getElementById("kitchenTable"),
  kitchenTableBody: document.getElementById("kitchenTableBody"),
  kitchenLoadingState: document.getElementById("kitchenLoadingState"),
  kitchenEmptyState: document.getElementById("kitchenEmptyState"),

  // Products elements
  totalProducts: document.getElementById("totalProducts"),
  totalCategories: document.getElementById("totalCategories"),
  lowStockProducts: document.getElementById("lowStockProducts"),
  productSearchInput: document.getElementById("productSearchInput"),
  clearProductSearch: document.getElementById("clearProductSearch"),
  categoryFilter: document.getElementById("categoryFilter"),
  productSortSelect: document.getElementById("productSortSelect"),
  refreshProductsBtn: document.getElementById("refreshProductsBtn"),
  productsTable: document.getElementById("productsTable"),
  productsTableBody: document.getElementById("productsTableBody"),
  productsLoadingState: document.getElementById("productsLoadingState"),
  productsEmptyState: document.getElementById("productsEmptyState"),
  productsPaginationContainer: document.getElementById("productsPaginationContainer"),
  productsPaginationInfo: document.getElementById("productsPaginationInfo"),
  productsPrevBtn: document.getElementById("productsPrevBtn"),
  productsNextBtn: document.getElementById("productsNextBtn"),
  productsPageNumbers: document.getElementById("productsPageNumbers"),
  productModal: document.getElementById("productModal"),
  productModalClose: document.getElementById("productModalClose"),
  productModalBody: document.getElementById("productModalBody"),

  // Product Edit Modal
  productEditModal: document.getElementById("productEditModal"),
  productEditModalClose: document.getElementById("productEditModalClose"),
  productEditTitle: document.getElementById("productEditTitle"),
  productEditForm: document.getElementById("productEditForm"),

  // Toast
  toastContainer: document.getElementById("toastContainer"),
}

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  console.log("Enhanced Dashboard initializing...")
  setupEventListeners()
  setupScrollHandler()
  setupAutoRefresh()
  switchSection("orders") // Start with orders section
})

// Setup Auto Refresh
function setupAutoRefresh() {
  if (state.autoRefreshEnabled) {
    state.autoRefreshTimer = setInterval(() => {
      if (state.currentSection === "orders") {
        loadOrders(true) // Silent refresh
      } else if (state.currentSection === "products") {
        loadProducts(true) // Silent refresh
      } else if (state.currentSection === "kitchen") {
        loadKitchenData(true) // Silent refresh
      }
    }, CONFIG.AUTO_REFRESH_INTERVAL)
  }
}

// Setup Scroll Handler for Auto-hiding Navbar
function setupScrollHandler() {
  let ticking = false

  function updateNavbar() {
    const currentScrollY = window.scrollY

    if (currentScrollY > state.lastScrollY && currentScrollY > 100) {
      // Scrolling down & past threshold - hide navbar
      elements.navbar.classList.add("navbar-hidden")
    } else {
      // Scrolling up or at top - show navbar
      elements.navbar.classList.remove("navbar-hidden")
    }

    state.lastScrollY = currentScrollY
    ticking = false
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(updateNavbar)
      ticking = true
    }
  })
}

// Section Management
function switchSection(section) {
  console.log(`Switching to section: ${section}`)
  state.currentSection = section

  // Update navigation active state
  elements.navLinks.forEach((link) => {
    link.classList.remove("active")
    if (link.dataset.section === section) {
      link.classList.add("active")
    }
  })

  // Hide all sections
  elements.ordersSection.style.display = "none"
  elements.productsSection.style.display = "none"
  if (elements.kitchenSection) elements.kitchenSection.style.display = "none"

  // Show selected section and load data
  if (section === "orders") {
    elements.ordersSection.style.display = "block"
    console.log("Loading orders...")
    loadOrders()
  } else if (section === "products") {
    elements.productsSection.style.display = "block"
    console.log("Loading products...")
    loadProducts()
  } else if (section === "kitchen") {
    if (elements.kitchenSection) {
      elements.kitchenSection.style.display = "block"
      console.log("Loading kitchen data...")
      loadKitchenData()
    }
  } else {
    // For other sections, show a placeholder
    console.log(`Section ${section} not implemented yet`)
    showToast(`${section.charAt(0).toUpperCase() + section.slice(1)} section coming soon!`, "info")
  }

  // Show navbar when switching sections
  elements.navbar.classList.remove("navbar-hidden")
}

// Setup Event Listeners
function setupEventListeners() {
  console.log("Setting up event listeners...")

  // Orders event listeners
  if (elements.tabButtons) {
    elements.tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab))
    })
  }

  let searchTimeout
  if (elements.searchInput) {
    elements.searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        handleSearch(e.target.value)
      }, CONFIG.SEARCH_DEBOUNCE_DELAY)
    })
  }

  if (elements.clearSearch) {
    elements.clearSearch.addEventListener("click", () => {
      elements.searchInput.value = ""
      handleSearch("")
    })
  }

  // Date filter
  if (elements.dateFilter) {
    elements.dateFilter.addEventListener("change", (e) => {
      handleDateFilter(e.target.value)
    })
  }

  if (elements.startDate) {
    elements.startDate.addEventListener("change", applyFiltersAndRender)
  }
  if (elements.endDate) {
    elements.endDate.addEventListener("change", applyFiltersAndRender)
  }

  // Bulk actions
  if (elements.selectAllOrders) {
    elements.selectAllOrders.addEventListener("change", (e) => {
      toggleSelectAllOrders(e.target.checked)
    })
  }

  if (elements.bulkActionsBtn) {
    elements.bulkActionsBtn.addEventListener("click", () => {
      const panel = elements.bulkActionsPanel
      panel.style.display = panel.style.display === "none" ? "block" : "none"
    })
  }

  if (elements.exportBtn) {
    elements.exportBtn.addEventListener("click", exportOrders)
  }

  if (elements.sortSelect) {
    elements.sortSelect.addEventListener("change", (e) => {
      const [sortBy, sortOrder] = e.target.value.split("-")
      handleSort(sortBy, sortOrder)
    })
  }

  // Sortable headers
  document.querySelectorAll(".sortable").forEach((th) => {
    th.addEventListener("click", () => {
      const sortBy = th.dataset.sort
      const currentOrder = state.sortBy === sortBy && state.sortOrder === "asc" ? "desc" : "asc"
      handleSort(sortBy, currentOrder)
    })
  })

  if (elements.refreshBtn) {
    elements.refreshBtn.addEventListener("click", () => {
      showToast("Refreshing orders...", "info")
      loadOrders()
    })
  }

  if (elements.prevBtn) {
    elements.prevBtn.addEventListener("click", () => changePage(state.currentPage - 1))
  }
  if (elements.nextBtn) {
    elements.nextBtn.addEventListener("click", () => changePage(state.currentPage + 1))
  }

  if (elements.modalClose) {
    elements.modalClose.addEventListener("click", closeModal)
  }
  if (elements.orderModal) {
    elements.orderModal.addEventListener("click", (e) => {
      if (e.target === elements.orderModal) closeModal()
    })
  }

  // Kitchen event listeners
  if (elements.kitchenStatusFilter) {
    elements.kitchenStatusFilter.addEventListener("change", (e) => {
      state.kitchenStatusFilter = e.target.value
      loadKitchenData()
    })
  }

  if (elements.refreshKitchenBtn) {
    elements.refreshKitchenBtn.addEventListener("click", () => {
      showToast("Refreshing kitchen data...", "info")
      loadKitchenData()
    })
  }

  if (elements.exportKitchenBtn) {
    elements.exportKitchenBtn.addEventListener("click", exportKitchenData)
  }

  // Products event listeners
  let productSearchTimeout
  if (elements.productSearchInput) {
    elements.productSearchInput.addEventListener("input", (e) => {
      clearTimeout(productSearchTimeout)
      productSearchTimeout = setTimeout(() => {
        handleProductSearch(e.target.value)
      }, CONFIG.SEARCH_DEBOUNCE_DELAY)
    })
  }

  if (elements.clearProductSearch) {
    elements.clearProductSearch.addEventListener("click", () => {
      elements.productSearchInput.value = ""
      handleProductSearch("")
    })
  }

  if (elements.categoryFilter) {
    elements.categoryFilter.addEventListener("change", (e) => {
      state.categoryFilter = e.target.value
      state.productsCurrentPage = 1
      applyProductFiltersAndRender()
    })
  }

  if (elements.productSortSelect) {
    elements.productSortSelect.addEventListener("change", (e) => {
      const [sortBy, sortOrder] = e.target.value.split("-")
      handleProductSort(sortBy, sortOrder)
    })
  }

  if (elements.refreshProductsBtn) {
    elements.refreshProductsBtn.addEventListener("click", () => {
      showToast("Refreshing products...", "info")
      loadProducts()
    })
  }

  if (elements.productsPrevBtn) {
    elements.productsPrevBtn.addEventListener("click", () => changeProductPage(state.productsCurrentPage - 1))
  }
  if (elements.productsNextBtn) {
    elements.productsNextBtn.addEventListener("click", () => changeProductPage(state.productsCurrentPage + 1))
  }

  if (elements.productModalClose) {
    elements.productModalClose.addEventListener("click", closeProductModal)
  }
  if (elements.productModal) {
    elements.productModal.addEventListener("click", (e) => {
      if (e.target === elements.productModal) closeProductModal()
    })
  }

  // Product Edit Modal
  if (elements.productEditModalClose) {
    elements.productEditModalClose.addEventListener("click", closeProductEditModal)
  }
  if (elements.productEditModal) {
    elements.productEditModal.addEventListener("click", (e) => {
      if (e.target === elements.productEditModal) closeProductEditModal()
    })
  }

  if (elements.productEditForm) {
    elements.productEditForm.addEventListener("submit", handleProductSave)
  }

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault()
      if (state.currentSection === "orders") {
        elements.searchInput?.focus()
      } else if (state.currentSection === "products") {
        elements.productSearchInput?.focus()
      }
    }
    if (e.key === "Escape") {
      closeModal()
      closeProductModal()
      closeProductEditModal()
    }
  })
}

// Orders Functions
async function loadOrders(silent = false) {
  try {
    console.log("Fetching orders from:", CONFIG.API_BASE_URL)
    if (!silent) setLoadingState(true)

    const response = await fetch(CONFIG.API_BASE_URL)
    console.log("Orders response status:", response.status)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const orders = await response.json()
    console.log("Orders loaded:", orders.length)

    // Sort with recent orders first (by date, newest first)
    state.allOrders = orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    applyFiltersAndRender()
    updateStats()
    updateTabCounts()
    if (!silent) showToast("Orders loaded successfully", "success")
  } catch (error) {
    console.error("Error loading orders:", error)
    if (!silent) {
      showToast("Failed to load orders. Using demo data.", "error")
      // Load demo data for testing
      loadDemoOrders()
    }
    showEmptyState()
  } finally {
    if (!silent) setLoadingState(false)
  }
}

// Enhanced Demo data with new progression
function loadDemoOrders() {
  const demoOrders = [
    {
      id: 1001,
      razorpay_order_id: "order_demo_001",
      customer_name: "John Doe",
      phone_number: "+91 9876543210",
      created_at: new Date().toISOString(),
      total_amount: 1250,
      order_status: "placed",
      items: [
        { name: "Organic Almonds", variant: "500g", quantity: 2, price: 450, originalPrice: 500, weight: 500 },
        { name: "Honey", variant: "250g", quantity: 1, price: 350, originalPrice: 400, weight: 250 },
      ],
      address: {
        line1: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
      },
    },
    {
      id: 1002,
      razorpay_order_id: "order_demo_002",
      customer_name: "Jane Smith",
      phone_number: "+91 9876543211",
      created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      total_amount: 850,
      order_status: "confirmed",
      items: [{ name: "Organic Rice", variant: "1kg", quantity: 1, price: 850, originalPrice: 900, weight: 1000 }],
      address: {
        line1: "456 Park Avenue",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
      },
    },
    {
      id: 1003,
      razorpay_order_id: "order_demo_003",
      customer_name: "Bob Johnson",
      phone_number: "+91 9876543212",
      created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      total_amount: 2100,
      order_status: "inprocess",
      items: [{ name: "Mixed Nuts", variant: "500g", quantity: 3, price: 700, originalPrice: 750, weight: 500 }],
      address: {
        line1: "789 Oak Street",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
      },
    },
    {
      id: 1004,
      razorpay_order_id: "order_demo_004",
      customer_name: "Alice Brown",
      phone_number: "+91 9876543213",
      created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      total_amount: 1800,
      order_status: "dispatched",
      items: [
        { name: "Cashews", variant: "250g", quantity: 2, price: 600, originalPrice: 650, weight: 250 },
        { name: "Dates", variant: "500g", quantity: 1, price: 600, originalPrice: 700, weight: 500 },
      ],
      address: {
        line1: "321 Pine Street",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600001",
      },
    },
    {
      id: 1005,
      razorpay_order_id: "order_demo_005",
      customer_name: "Charlie Wilson",
      phone_number: "+91 9876543214",
      created_at: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
      total_amount: 950,
      order_status: "delivered",
      items: [{ name: "Walnuts", variant: "300g", quantity: 1, price: 950, originalPrice: 1000, weight: 300 }],
      address: {
        line1: "654 Elm Street",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411001",
      },
    },
  ]

  state.allOrders = demoOrders
  applyFiltersAndRender()
  updateStats()
  updateTabCounts()
  showToast("Demo orders loaded", "info")
}

// Updated order status progression: placed → confirmed → in process → dispatched → delivered
async function updateOrderStatus(orderId, newStatus) {
  try {
    console.log(`Updating order ${orderId} to status: ${newStatus}`)

    const response = await fetch(`${CONFIG.API_BASE_URL}/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_status: newStatus }),
    })

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

    const updatedOrder = await response.json()

    // Update local state
    const orderIndex = state.allOrders.findIndex((order) => order.id === orderId)
    if (orderIndex !== -1) {
      state.allOrders[orderIndex].order_status = updatedOrder.order_status || newStatus
    }

    // Re-render everything
    applyFiltersAndRender()
    updateStats()
    updateTabCounts()

    showToast(`Order #${orderId} status updated to ${newStatus}`, "success")
  } catch (error) {
    console.error("Error updating order status:", error)
    // For demo purposes, update locally
    const orderIndex = state.allOrders.findIndex((order) => order.id === orderId)
    if (orderIndex !== -1) {
      state.allOrders[orderIndex].order_status = newStatus
      applyFiltersAndRender()
      updateStats()
      updateTabCounts()
      showToast(`Order #${orderId} status updated to ${newStatus} (demo mode)`, "success")
    } else {
      showToast("Failed to update order status", "error")
    }
  }
}

async function bulkUpdateStatus(newStatus) {
  if (state.selectedOrders.size === 0) {
    showToast("No orders selected", "error")
    return
  }

  try {
    const orderIds = Array.from(state.selectedOrders)
    console.log(`Bulk updating ${orderIds.length} orders to status: ${newStatus}`)

    // For demo purposes, update locally
    orderIds.forEach((orderId) => {
      const orderIndex = state.allOrders.findIndex((order) => order.id === orderId)
      if (orderIndex !== -1) {
        state.allOrders[orderIndex].order_status = newStatus
      }
    })

    clearBulkSelection()
    applyFiltersAndRender()
    updateStats()
    updateTabCounts()

    showToast(`${orderIds.length} orders updated to ${newStatus}`, "success")
  } catch (error) {
    console.error("Error bulk updating orders:", error)
    showToast("Failed to update orders", "error")
  }
}

function toggleSelectAllOrders(checked) {
  const checkboxes = document.querySelectorAll(".order-checkbox")
  checkboxes.forEach((checkbox) => {
    checkbox.checked = checked
    const orderId = Number.parseInt(checkbox.dataset.orderId)
    if (checked) {
      state.selectedOrders.add(orderId)
    } else {
      state.selectedOrders.delete(orderId)
    }
  })
  updateBulkActionsUI()
}

function toggleOrderSelection(orderId, checked) {
  if (checked) {
    state.selectedOrders.add(orderId)
  } else {
    state.selectedOrders.delete(orderId)
  }
  updateBulkActionsUI()
}

function clearBulkSelection() {
  state.selectedOrders.clear()
  if (elements.selectAllOrders) elements.selectAllOrders.checked = false
  const checkboxes = document.querySelectorAll(".order-checkbox")
  checkboxes.forEach((checkbox) => (checkbox.checked = false))
  updateBulkActionsUI()
}

function updateBulkActionsUI() {
  const count = state.selectedOrders.size
  if (elements.bulkSelectedCount) {
    elements.bulkSelectedCount.textContent = `${count} order${count !== 1 ? "s" : ""} selected`
  }
  if (elements.bulkActionsBtn) {
    elements.bulkActionsBtn.style.display = count > 0 ? "flex" : "none"
  }

  if (count === 0 && elements.bulkActionsPanel) {
    elements.bulkActionsPanel.style.display = "none"
  }
}

function exportOrders() {
  const ordersToExport = state.filteredOrders

  if (ordersToExport.length === 0) {
    showToast("No orders to export", "error")
    return
  }

  const csvContent = generateCSV(ordersToExport)
  downloadCSV(csvContent, `orders_${state.currentTab}_${new Date().toISOString().split("T")[0]}.csv`)
  showToast(`Exported ${ordersToExport.length} orders`, "success")
}

function generateCSV(orders) {
  const headers = ["Order ID", "Razorpay ID", "Customer Name", "Phone", "Date", "Amount", "Status", "Items", "Address"]

  const rows = orders.map((order) => [
    order.id,
    order.razorpay_order_id,
    order.customer_name || "",
    order.phone_number || "",
    formatDate(order.created_at),
    order.total_amount,
    order.order_status,
    order.items.map((item) => `${item.name} (${item.quantity}x${item.variant})`).join("; "),
    `${order.address.line1}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`,
  ])

  const csvContent = [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

  return csvContent
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function handleDateFilter(filterValue) {
  state.dateFilter = filterValue
  state.currentPage = 1

  if (filterValue === "custom") {
    if (elements.startDate) elements.startDate.style.display = "inline-block"
    if (elements.endDate) elements.endDate.style.display = "inline-block"
  } else {
    if (elements.startDate) elements.startDate.style.display = "none"
    if (elements.endDate) elements.endDate.style.display = "none"
  }

  applyFiltersAndRender()
}

function switchTab(tabName) {
  console.log(`Switching to tab: ${tabName}`)
  elements.tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName)
  })
  state.currentTab = tabName
  state.currentPage = 1
  if (elements.sortContainer) {
    elements.sortContainer.style.display = tabName === "all" ? "flex" : "none"
  }
  clearBulkSelection()
  applyFiltersAndRender()
}

function handleSearch(query) {
  state.searchQuery = query.toLowerCase().trim()
  state.currentPage = 1
  if (elements.clearSearch) {
    elements.clearSearch.style.display = query ? "block" : "none"
  }
  applyFiltersAndRender()
}

function handleSort(sortBy, sortOrder) {
  state.sortBy = sortBy
  state.sortOrder = sortOrder
  if (elements.sortSelect) {
    elements.sortSelect.value = `${sortBy}-${sortOrder}`
  }

  document.querySelectorAll(".sortable").forEach((th) => {
    th.classList.remove("sorted")
    const icon = th.querySelector(".sort-icon")
    if (icon) icon.className = "fas fa-sort sort-icon"
  })

  const activeHeader = document.querySelector(`[data-sort="${sortBy}"]`)
  if (activeHeader) {
    activeHeader.classList.add("sorted")
    const icon = activeHeader.querySelector(".sort-icon")
    if (icon) {
      icon.className = `fas fa-sort-${sortOrder === "asc" ? "up" : "down"} sort-icon`
    }
  }

  applyFiltersAndRender()
}

function applyFiltersAndRender() {
  let filtered = [...state.allOrders]

  // Apply tab filter
  filtered = applyTabFilter(filtered)

  // Apply date filter
  filtered = applyDateFilter(filtered)

  // Apply search filter
  if (state.searchQuery) {
    filtered = filtered.filter(
      (order) =>
        order.id.toString().toLowerCase().includes(state.searchQuery) ||
        order.razorpay_order_id.toLowerCase().includes(state.searchQuery) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(state.searchQuery)) ||
        (order.phone_number && order.phone_number.toLowerCase().includes(state.searchQuery)),
    )
  }

  // Apply sorting with recent orders prioritized
  filtered = applySorting(filtered)

  state.filteredOrders = filtered
  renderTable()
  renderPagination()
}

function applyTabFilter(orders) {
  const now = new Date()
  const recentCutoff = new Date(now)
  recentCutoff.setDate(recentCutoff.getDate() - CONFIG.RECENT_DAYS_FILTER)

  switch (state.currentTab) {
    case "recent":
      // Show all orders from last 10 days regardless of status
      return orders.filter((order) => {
        const orderDate = new Date(order.created_at)
        return orderDate >= recentCutoff
      })
    case "placed":
      return orders.filter((order) => order.order_status === "placed")
    case "confirmed":
      return orders.filter((order) => order.order_status === "confirmed")
    case "inprocess":
      return orders.filter((order) => order.order_status === "inprocess")
    case "dispatched":
      return orders.filter((order) => order.order_status === "dispatched")
    case "delivered":
      return orders.filter((order) => order.order_status === "delivered")
    case "completed":
      return orders.filter((order) => order.order_status === "completed")
    case "rejected":
      return orders.filter((order) => order.order_status === "rejected")
    case "all":
    default:
      return orders
  }
}

function applyDateFilter(orders) {
  if (state.dateFilter === "all") return orders

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (state.dateFilter) {
    case "today":
      return orders.filter((order) => {
        const orderDate = new Date(order.created_at)
        return orderDate >= today
      })
    case "yesterday":
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return orders.filter((order) => {
        const orderDate = new Date(order.created_at)
        return orderDate >= yesterday && orderDate < today
      })
    case "week":
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      return orders.filter((order) => {
        const orderDate = new Date(order.created_at)
        return orderDate >= weekAgo
      })
    case "month":
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return orders.filter((order) => {
        const orderDate = new Date(order.created_at)
        return orderDate >= monthAgo
      })
    case "custom":
      const startDate = elements.startDate?.value ? new Date(elements.startDate.value) : null
      const endDate = elements.endDate?.value ? new Date(elements.endDate.value + "T23:59:59") : null

      return orders.filter((order) => {
        const orderDate = new Date(order.created_at)
        if (startDate && orderDate < startDate) return false
        if (endDate && orderDate > endDate) return false
        return true
      })
    default:
      return orders
  }
}

function applySorting(orders) {
  return orders.sort((a, b) => {
    // Always prioritize recent orders first, then apply secondary sorting
    const aDate = new Date(a.created_at)
    const bDate = new Date(b.created_at)
    const now = new Date()
    const recentCutoff = new Date(now)
    recentCutoff.setDate(recentCutoff.getDate() - CONFIG.RECENT_DAYS_FILTER)

    const aIsRecent = aDate >= recentCutoff
    const bIsRecent = bDate >= recentCutoff

    // If one is recent and other is not, recent comes first
    if (aIsRecent && !bIsRecent) return -1
    if (!aIsRecent && bIsRecent) return 1

    // Both are recent or both are old, apply normal sorting
    let aValue = a[state.sortBy]
    let bValue = b[state.sortBy]

    if (state.sortBy === "created_at") {
      aValue = new Date(aValue)
      bValue = new Date(bValue)
    } else if (state.sortBy === "total_amount") {
      aValue = Number(aValue)
      bValue = Number(bValue)
    } else if (typeof aValue === "string") {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (aValue < bValue) return state.sortOrder === "asc" ? -1 : 1
    if (aValue > bValue) return state.sortOrder === "asc" ? 1 : -1
    return 0
  })
}

// Enhanced table rendering with new items format [Item, Qty, Variant]
function renderTable() {
  const tbody = elements.ordersTableBody

  if (!tbody) {
    console.error("Orders table body not found")
    return
  }

  if (state.filteredOrders.length === 0) {
    showEmptyState()
    return
  }

  hideEmptyState()

  const startIndex = (state.currentPage - 1) * CONFIG.ORDERS_PER_PAGE
  const endIndex = startIndex + CONFIG.ORDERS_PER_PAGE
  const paginatedOrders = state.filteredOrders.slice(startIndex, endIndex)

  tbody.innerHTML = paginatedOrders
    .map(
      (order) => `
          <tr class="fade-in">
              <td>
                  <input type="checkbox" class="bulk-checkbox order-checkbox" 
                         data-order-id="${order.id}"
                         onchange="toggleOrderSelection(${order.id}, this.checked)">
              </td>
              <td>
                  <div class="order-id">#${escapeHtml(order.id)}</div>
                  <div class="razorpay-id">${escapeHtml(order.razorpay_order_id)}</div>
              </td>
              <td>
                  <div class="customer-name">${escapeHtml(order.customer_name || "N/A")}</div>
                  <div class="customer-phone">${escapeHtml(order.phone_number || "N/A")}</div>
              </td>
              <td>
                  <span class="order-date">${formatDate(order.created_at)}</span>
              </td>
              <td>
                  <span class="order-amount">₹${order.total_amount.toLocaleString()}</span>
              </td>
              <td>
                  <span class="status-badge status-${order.order_status}">
                      ${escapeHtml(order.order_status)}
                  </span>
              </td>
              <td>
                  <div class="items-summary">
                      ${order.items
                        .slice(0, 3)
                        .map(
                          (item) => `
                         <div class="item-entry">
  [${escapeHtml(item.name)} - ${item.quantity} - ${escapeHtml(item.variant)}]
</div>

                      `,
                        )
                        .join("")}
                      ${order.items.length > 3 ? `<div style="font-size: 0.75rem; color: #666; margin-top: 0.25rem;">+${order.items.length - 3} more items</div>` : ""}
                  </div>
              </td>
              <td>
                  <div class="address-summary">
                      ${escapeHtml(order.address.line1)}<br>
                      ${escapeHtml(order.address.city)}, ${escapeHtml(order.address.state)} - ${escapeHtml(order.address.pincode)}
                  </div>
              </td>
              <td>
                  <div class="actions-cell">
                      ${renderActionButtons(order)}
                  </div>
              </td>
          </tr>
      `,
    )
    .join("")
}

// Updated action buttons for new progression: placed → confirmed → in process → dispatched → delivered
function renderActionButtons(order) {
  const buttons = []

  switch (order.order_status) {
    case "placed":
      buttons.push(`
                  <button class="btn btn-confirm" onclick="updateOrderStatus(${order.id}, 'confirmed')">
                      <i class="fas fa-check"></i> Confirm
                  </button>
                  <button class="btn btn-reject" onclick="updateOrderStatus(${order.id}, 'rejected')">
                      <i class="fas fa-times"></i> Reject
                  </button>
              `)
      break
    case "confirmed":
      buttons.push(`
                  <button class="btn btn-process" onclick="updateOrderStatus(${order.id}, 'inprocess')">
                      <i class="fas fa-cog"></i> Start Process
                  </button>
              `)
      break
    case "inprocess":
      buttons.push(`
                  <button class="btn btn-dispatch" onclick="updateOrderStatus(${order.id}, 'dispatched')">
                      <i class="fas fa-truck"></i> Dispatch
                  </button>
              `)
      break
    case "dispatched":
      buttons.push(`
                  <button class="btn btn-deliver" onclick="updateOrderStatus(${order.id}, 'delivered')">
                      <i class="fas fa-box"></i> Mark Delivered
                  </button>
              `)
      break
    case "delivered":
      buttons.push(`
                  <button class="btn btn-complete" onclick="updateOrderStatus(${order.id}, 'completed')">
                      <i class="fas fa-flag-checkered"></i> Complete
                  </button>
              `)
      break
    case "completed":
    case "rejected":
      buttons.push(`
                  <span style="color: var(--text-secondary); font-size: 0.875rem;">No actions</span>
              `)
      break
  }

  buttons.push(`
          <button class="btn btn-details" onclick="showOrderDetails(${order.id})">
              <i class="fas fa-eye"></i> Details
          </button>
      `)

  return buttons.join("")
}

function showOrderDetails(orderId) {
  const order = state.allOrders.find((o) => o.id === orderId)
  if (!order) return

  if (elements.modalBody) {
    elements.modalBody.innerHTML = `
          <div class="order-details">
              <div class="detail-section">
                  <h3>Order Information</h3>
                  <div class="detail-grid">
                      <div class="detail-item">
                          <strong>Order ID:</strong> #${order.id}
                      </div>
                      <div class="detail-item">
                          <strong>Razorpay ID:</strong> ${order.razorpay_order_id}
                      </div>
                      <div class="detail-item">
                          <strong>Customer:</strong> ${order.customer_name || "N/A"}
                      </div>
                      <div class="detail-item">
                          <strong>Phone:</strong> ${order.phone_number || "N/A"}
                      </div>
                      <div class="detail-item">
                          <strong>Status:</strong> 
                          <span class="status-badge status-${order.order_status}">${order.order_status}</span>
                      </div>
                      <div class="detail-item">
                          <strong>Date:</strong> ${formatDate(order.created_at)}
                      </div>
                      <div class="detail-item">
                          <strong>Total Amount:</strong> ₹${order.total_amount.toLocaleString()}
                      </div>
                  </div>
              </div>
              
              <div class="detail-section">
                  <h3>Delivery Address</h3>
                  <div class="address-details">
                      <p><strong>${order.address.line1}</strong></p>
                      <p>${order.address.city}, ${order.address.state} - ${order.address.pincode}</p>
                  </div>
              </div>
              
              <div class="detail-section">
                  <h3>Order Items</h3>
                  <table class="items-detail-table">
                      <thead>
                          <tr>
                              <th>Item Name</th>
                              <th>Variant</th>
                              <th>Quantity</th>
                              <th>Price</th>
                              <th>Original Price</th>
                              <th>Total</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${order.items
                            .map(
                              (item) => `
                              <tr>
                                  <td>${escapeHtml(item.name)}</td>
                                  <td>${escapeHtml(item.variant)}</td>
                                  <td>${item.quantity}</td>
                                  <td>₹${item.price}</td>
                                  <td>₹${item.originalPrice}</td>
                                  <td>₹${(item.price * item.quantity).toLocaleString()}</td>
                              </tr>
                          `,
                            )
                            .join("")}
                      </tbody>
                  </table>
              </div>
          </div>
      `
  }

  if (elements.orderModal) {
    elements.orderModal.classList.add("show")
  }
}

function closeModal() {
  if (elements.orderModal) {
    elements.orderModal.classList.remove("show")
  }
}

function renderPagination() {
  const totalOrders = state.filteredOrders.length
  const totalPages = Math.ceil(totalOrders / CONFIG.ORDERS_PER_PAGE)

  if (totalOrders === 0) {
    if (elements.paginationContainer) {
      elements.paginationContainer.style.display = "none"
    }
    return
  }

  if (elements.paginationContainer) {
    elements.paginationContainer.style.display = "flex"
  }

  const startIndex = (state.currentPage - 1) * CONFIG.ORDERS_PER_PAGE + 1
  const endIndex = Math.min(state.currentPage * CONFIG.ORDERS_PER_PAGE, totalOrders)

  if (elements.paginationInfo) {
    elements.paginationInfo.textContent = `Showing ${startIndex}-${endIndex} of ${totalOrders} orders`
  }

  if (elements.prevBtn) {
    elements.prevBtn.disabled = state.currentPage === 1
  }
  if (elements.nextBtn) {
    elements.nextBtn.disabled = state.currentPage === totalPages
  }

  renderPageNumbers(totalPages)
}

function renderPageNumbers(totalPages) {
  const maxVisiblePages = 5
  let startPage = Math.max(1, state.currentPage - Math.floor(maxVisiblePages / 2))
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }

  let pagesHTML = ""

  for (let i = startPage; i <= endPage; i++) {
    pagesHTML += `
              <button class="page-number ${i === state.currentPage ? "active" : ""}" 
                      onclick="changePage(${i})">
                  ${i}
              </button>
          `
  }

  if (elements.pageNumbers) {
    elements.pageNumbers.innerHTML = pagesHTML
  }
}

function changePage(page) {
  const totalPages = Math.ceil(state.filteredOrders.length / CONFIG.ORDERS_PER_PAGE)

  if (page < 1 || page > totalPages) return

  state.currentPage = page
  renderTable()
  renderPagination()

  if (elements.tableWrapper) {
    elements.tableWrapper.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }
}

function updateStats() {
  const totalOrders = state.allOrders.length

  const recentCutoff = new Date()
  recentCutoff.setDate(recentCutoff.getDate() - CONFIG.RECENT_DAYS_FILTER)
  const recentOrders = state.allOrders.filter((order) => new Date(order.created_at) >= recentCutoff).length

  const pendingOrders = state.allOrders.filter(
    (order) => !["completed", "rejected"].includes(order.order_status),
  ).length

  if (elements.totalOrders) {
    elements.totalOrders.textContent = totalOrders.toLocaleString()
  }
  if (elements.recentOrders) {
    elements.recentOrders.textContent = recentOrders.toLocaleString()
  }
  if (elements.pendingOrders) {
    elements.pendingOrders.textContent = pendingOrders.toLocaleString()
  }
}

// Updated tab counts for new progression
function updateTabCounts() {
  const now = new Date()
  const recentCutoff = new Date(now)
  recentCutoff.setDate(recentCutoff.getDate() - CONFIG.RECENT_DAYS_FILTER)

  const counts = {
    recent: state.allOrders.filter((order) => {
      const orderDate = new Date(order.created_at)
      return orderDate >= recentCutoff // All orders from last 10 days
    }).length,
    placed: state.allOrders.filter((order) => order.order_status === "placed").length,
    confirmed: state.allOrders.filter((order) => order.order_status === "confirmed").length,
    inprocess: state.allOrders.filter((order) => order.order_status === "inprocess").length,
    dispatched: state.allOrders.filter((order) => order.order_status === "dispatched").length,
    delivered: state.allOrders.filter((order) => order.order_status === "delivered").length,
    completed: state.allOrders.filter((order) => order.order_status === "completed").length,
    rejected: state.allOrders.filter((order) => order.order_status === "rejected").length,
    all: state.allOrders.length,
  }

  Object.keys(counts).forEach((tab) => {
    if (elements.tabCounts[tab]) {
      elements.tabCounts[tab].textContent = counts[tab]
    }
  })
}

function setLoadingState(isLoading) {
  state.isLoading = isLoading

  if (isLoading) {
    if (elements.loadingState) elements.loadingState.style.display = "flex"
    if (elements.tableWrapper) elements.tableWrapper.style.display = "none"
    if (elements.emptyState) elements.emptyState.style.display = "none"
    if (elements.paginationContainer) elements.paginationContainer.style.display = "none"
  } else {
    if (elements.loadingState) elements.loadingState.style.display = "none"
    if (elements.tableWrapper) elements.tableWrapper.style.display = ""
  }
}

function showEmptyState() {
  if (elements.tableWrapper) elements.tableWrapper.style.display = "none"
  if (elements.emptyState) elements.emptyState.style.display = "block"
  if (elements.paginationContainer) elements.paginationContainer.style.display = "none"
}

function hideEmptyState() {
  if (elements.emptyState) elements.emptyState.style.display = "none"
  if (elements.tableWrapper) elements.tableWrapper.style.display = ""
}

// Kitchen Preparation Calculator Functions
async function loadKitchenData(silent = false) {
  try {
    console.log("Calculating kitchen preparation data...")
    if (!silent) setKitchenLoadingState(true)

    // Filter orders based on kitchen status filter
    const statusFilters = state.kitchenStatusFilter.split(",")
    const activeOrders = state.allOrders.filter((order) => statusFilters.includes(order.order_status))

    // Calculate preparation requirements
    const prepData = calculateKitchenPrep(activeOrders)
    state.kitchenData = prepData

    renderKitchenTable()
    updateKitchenStats(activeOrders, prepData)
    if (!silent) showToast("Kitchen data calculated successfully", "success")
  } catch (error) {
    console.error("Error calculating kitchen data:", error)
    if (!silent) showToast("Failed to calculate kitchen data", "error")
    showKitchenEmptyState()
  } finally {
    if (!silent) setKitchenLoadingState(false)
  }
}

function calculateKitchenPrep(orders) {
  const itemMap = new Map()

  // Aggregate items from all active orders
  orders.forEach((order) => {
    order.items.forEach((item) => {
      const key = item.name
      if (!itemMap.has(key)) {
        itemMap.set(key, {
          name: item.name,
          totalQuantity: 0,
          totalWeight: 0,
          orderCount: 0,
          variants: new Map(),
          orders: new Set(),
        })
      }

      const itemData = itemMap.get(key)
      itemData.totalQuantity += item.quantity
      itemData.totalWeight += (item.weight || 0) * item.quantity
      itemData.orders.add(order.id)
      itemData.orderCount = itemData.orders.size

      // Track variants
      const variantKey = item.variant
      if (!itemData.variants.has(variantKey)) {
        itemData.variants.set(variantKey, 0)
      }
      itemData.variants.set(variantKey, itemData.variants.get(variantKey) + item.quantity)
    })
  })

  // Convert to array and add priority and prep time
  return Array.from(itemMap.values()).map((item) => ({
    ...item,
    priority: calculatePriority(item.orderCount, item.totalWeight),
    estimatedPrepTime: calculatePrepTime(item.totalWeight),
    variantsBreakdown: Array.from(item.variants.entries()).map(([variant, qty]) => ({
      variant,
      quantity: qty,
    })),
  }))
}

function calculatePriority(orderCount, totalWeight) {
  // Priority based on number of orders and total weight
  if (orderCount >= 3 || totalWeight >= 2000) return "high"
  if (orderCount >= 2 || totalWeight >= 1000) return "medium"
  return "low"
}

function calculatePrepTime(totalWeight) {
  // Estimated prep time in minutes based on weight
  // Assuming 1 minute per 100g as base calculation
  const baseTime = Math.ceil(totalWeight / 100)
  return Math.max(baseTime, 5) // Minimum 5 minutes
}

function renderKitchenTable() {
  const tbody = elements.kitchenTableBody

  if (!tbody) {
    console.error("Kitchen table body not found")
    return
  }

  if (state.kitchenData.length === 0) {
    showKitchenEmptyState()
    return
  }

  hideKitchenEmptyState()

  // Sort by priority (high first) then by total weight
  const sortedData = [...state.kitchenData].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    return b.totalWeight - a.totalWeight
  })

  tbody.innerHTML = sortedData
    .map(
      (item) => `
          <tr class="fade-in">
              <td>
                  <div class="product-name">${escapeHtml(item.name)}</div>
              </td>
              <td>
                  <span class="total-weight">${item.totalWeight.toLocaleString()}g</span>
              </td>
              <td>
                  <span class="order-count">${item.orderCount}</span>
              </td>
              <td>
                  <div class="variants-breakdown">
                      ${item.variantsBreakdown
                        .map(
                          (variant) => `
                          <span class="variant-item">${escapeHtml(variant.variant)}: ${variant.quantity}x</span>
                      `,
                        )
                        .join("")}
                  </div>
              </td>
              <td>
                  <span class="priority-badge priority-${item.priority}">${item.priority}</span>
              </td>
              <td>
                  <span class="prep-time">${item.estimatedPrepTime} min</span>
              </td>
          </tr>
      `,
    )
    .join("")
}

function updateKitchenStats(activeOrders, prepData) {
  const totalActiveOrders = activeOrders.length
  const totalWeight = prepData.reduce((sum, item) => sum + item.totalWeight, 0)
  const uniqueItems = prepData.length

  if (elements.activeOrders) {
    elements.activeOrders.textContent = totalActiveOrders.toLocaleString()
  }
  if (elements.totalWeight) {
    elements.totalWeight.textContent = `${totalWeight.toLocaleString()}g`
  }
  if (elements.uniqueItems) {
    elements.uniqueItems.textContent = uniqueItems.toLocaleString()
  }
}

function exportKitchenData() {
  if (state.kitchenData.length === 0) {
    showToast("No kitchen data to export", "error")
    return
  }

  const headers = ["Product Name", "Total Weight (g)", "Order Count", "Variants", "Priority", "Prep Time (min)"]

  const rows = state.kitchenData.map((item) => [
    item.name,
    item.totalWeight,
    item.orderCount,
    item.variantsBreakdown.map((v) => `${v.variant}: ${v.quantity}x`).join("; "),
    item.priority,
    item.estimatedPrepTime,
  ])

  const csvContent = [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

  downloadCSV(csvContent, `kitchen_prep_${new Date().toISOString().split("T")[0]}.csv`)
  showToast(`Exported ${state.kitchenData.length} preparation items`, "success")
}

function setKitchenLoadingState(isLoading) {
  state.kitchenIsLoading = isLoading

  if (isLoading) {
    if (elements.kitchenLoadingState) elements.kitchenLoadingState.style.display = "flex"
    if (elements.kitchenTable) elements.kitchenTable.style.display = "none"
    if (elements.kitchenEmptyState) elements.kitchenEmptyState.style.display = "none"
  } else {
    if (elements.kitchenLoadingState) elements.kitchenLoadingState.style.display = "none"
    if (elements.kitchenTable) elements.kitchenTable.style.display = ""
  }
}

function showKitchenEmptyState() {
  if (elements.kitchenTable) elements.kitchenTable.style.display = "none"
  if (elements.kitchenEmptyState) elements.kitchenEmptyState.style.display = "block"
}

function hideKitchenEmptyState() {
  if (elements.kitchenEmptyState) elements.kitchenEmptyState.style.display = "none"
  if (elements.kitchenTable) elements.kitchenTable.style.display = ""
}

// Products Functions (keeping existing functionality)
async function loadProducts(silent = false) {
  try {
    console.log("Fetching products from:", CONFIG.PRODUCTS_API_URL)
    if (!silent) setProductsLoadingState(true)

    const response = await fetch(CONFIG.PRODUCTS_API_URL)
    console.log("Products response status:", response.status)

    if (!response.ok) {
      throw new Error("Failed to fetch products")
    }

    const products = await response.json()
    console.log("Products loaded:", products.length)

    state.allProducts = products.sort((a, b) => a.item_name.localeCompare(b.item_name))

    // Update category filter options
    updateCategoryFilter()

    applyProductFiltersAndRender()
    updateProductStats()
    if (!silent) showToast("Products loaded successfully", "success")
  } catch (error) {
    console.error("Error loading products:", error)
    if (!silent) {
      showToast("Failed to load products. Using demo data.", "error")
      // Load demo data for testing
      loadDemoProducts()
    }
    showProductsEmptyState()
  } finally {
    if (!silent) setProductsLoadingState(false)
  }
}

// Demo data for products when API is not available
function loadDemoProducts() {
  const demoProducts = [
    {
      id: 1,
      item_name: "Organic Almonds",
      category: "Nuts",
      image_url: "/placeholder.svg?height=50&width=50",
      shelf_life_days: 365,
      lead_time_days: 2,
      description: "Premium quality organic almonds",
      packing_01: 250,
      price_01: 450,
      packing_02: 500,
      price_02: 850,
      packing_03: 1000,
      price_03: 1600,
    },
    {
      id: 2,
      item_name: "Honey",
      category: "Sweeteners",
      image_url: "/placeholder.svg?height=50&width=50",
      shelf_life_days: 730,
      lead_time_days: 1,
      description: "Pure natural honey",
      packing_01: 250,
      price_01: 350,
      packing_02: 500,
      price_02: 650,
    },
    {
      id: 3,
      item_name: "Organic Rice",
      category: "Grains",
      image_url: "/placeholder.svg?height=50&width=50",
      shelf_life_days: 180,
      lead_time_days: 3,
      description: "Organic basmati rice",
      packing_01: 1000,
      price_01: 850,
      packing_02: 5000,
      price_02: 4000,
    },
  ]

  state.allProducts = demoProducts
  updateCategoryFilter()
  applyProductFiltersAndRender()
  updateProductStats()
  showToast("Demo products loaded", "info")
}

function updateCategoryFilter() {
  const categories = [...new Set(state.allProducts.map((p) => p.category))].sort()
  const categoryFilter = elements.categoryFilter

  if (!categoryFilter) return

  // Clear existing options except "All Categories"
  categoryFilter.innerHTML = '<option value="all">All Categories</option>'

  // Add category options
  categories.forEach((category) => {
    const option = document.createElement("option")
    option.value = category
    option.textContent = category
    categoryFilter.appendChild(option)
  })
}

async function saveProduct(productData) {
  try {
    const url = state.editingProduct ? `${CONFIG.PRODUCTS_API_URL}/${state.editingProduct.id}` : CONFIG.PRODUCTS_API_URL

    const method = state.editingProduct ? "PUT" : "POST"

    const response = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData),
    })

    if (!response.ok) throw new Error("Failed to save product")

    const savedProduct = await response.json()

    if (state.editingProduct) {
      // Update existing product
      const index = state.allProducts.findIndex((p) => p.id === state.editingProduct.id)
      if (index !== -1) {
        state.allProducts[index] = savedProduct
      }
      showToast("Product updated successfully", "success")
    } else {
      // Add new product
      state.allProducts.push(savedProduct)
      showToast("Product added successfully", "success")
    }

    updateCategoryFilter()
    applyProductFiltersAndRender()
    updateProductStats()
    closeProductEditModal()
  } catch (error) {
    console.error("Error saving product:", error)
    // For demo purposes, save locally
    if (state.editingProduct) {
      const index = state.allProducts.findIndex((p) => p.id === state.editingProduct.id)
      if (index !== -1) {
        state.allProducts[index] = { ...state.editingProduct, ...productData }
        showToast("Product updated successfully (demo mode)", "success")
      }
    } else {
      const newProduct = { id: Date.now(), ...productData }
      state.allProducts.push(newProduct)
      showToast("Product added successfully (demo mode)", "success")
    }
    updateCategoryFilter()
    applyProductFiltersAndRender()
    updateProductStats()
    closeProductEditModal()
  }
}

async function deleteProduct(productId) {
  if (!confirm("Are you sure you want to delete this product?")) return

  try {
    const response = await fetch(`${CONFIG.PRODUCTS_API_URL}/${productId}`, {
      method: "DELETE",
    })

    if (!response.ok) throw new Error("Failed to delete product")

    // Remove from local state
    state.allProducts = state.allProducts.filter((p) => p.id !== productId)

    updateCategoryFilter()
    applyProductFiltersAndRender()
    updateProductStats()
    showToast("Product deleted successfully", "success")
  } catch (error) {
    console.error("Error deleting product:", error)
    // For demo purposes, delete locally
    state.allProducts = state.allProducts.filter((p) => p.id !== productId)
    updateCategoryFilter()
    applyProductFiltersAndRender()
    updateProductStats()
    showToast("Product deleted successfully (demo mode)", "success")
  }
}

function showEditProductModal(productId = null) {
  state.editingProduct = productId ? state.allProducts.find((p) => p.id === productId) : null

  if (state.editingProduct) {
    if (elements.productEditTitle) {
      elements.productEditTitle.textContent = "Edit Product"
    }
    populateProductForm(state.editingProduct)
  } else {
    if (elements.productEditTitle) {
      elements.productEditTitle.textContent = "Add New Product"
    }
    if (elements.productEditForm) {
      elements.productEditForm.reset()
    }
  }

  if (elements.productEditModal) {
    elements.productEditModal.classList.add("show")
  }
}

function showAddProductModal() {
  showEditProductModal()
}

function populateProductForm(product) {
  const fields = [
    { id: "editItemName", value: product.item_name || "" },
    { id: "editCategory", value: product.category || "" },
    { id: "editImageSrc", value: product.image_url || "" },
    { id: "editShelfLife", value: product.shelf_life_days || "" },
    { id: "editLeadTime", value: product.lead_time_days || "" },
    { id: "editDescription", value: product.description || "" },
    { id: "editPacking01", value: product.packing_01 || "" },
    { id: "editPrice01", value: product.price_01 || "" },
    { id: "editPacking02", value: product.packing_02 || "" },
    { id: "editPrice02", value: product.price_02 || "" },
    { id: "editPacking03", value: product.packing_03 || "" },
    { id: "editPrice03", value: product.price_03 || "" },
    { id: "editPacking04", value: product.packing_04 || "" },
    { id: "editPrice04", value: product.price_04 || "" },
  ]

  fields.forEach(({ id, value }) => {
    const element = document.getElementById(id)
    if (element) {
      element.value = value
    }
  })
}

function handleProductSave(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const productData = {}

  // Convert FormData to object
  for (const [key, value] of formData.entries()) {
    if (value.trim() === "") {
      productData[key] = null
    } else if (
      key.includes("price_") ||
      key.includes("packing_") ||
      key.includes("shelf_life") ||
      key.includes("lead_time")
    ) {
      productData[key] = Number(value) || null
    } else {
      productData[key] = value
    }
  }

  saveProduct(productData)
}

function closeProductEditModal() {
  if (elements.productEditModal) {
    elements.productEditModal.classList.remove("show")
  }
  state.editingProduct = null
}

function handleProductSearch(query) {
  state.productsSearchQuery = query.toLowerCase().trim()
  state.productsCurrentPage = 1
  if (elements.clearProductSearch) {
    elements.clearProductSearch.style.display = query ? "block" : "none"
  }
  applyProductFiltersAndRender()
}

function handleProductSort(sortBy, sortOrder) {
  state.productsSortBy = sortBy
  state.productsSortOrder = sortOrder
  if (elements.productSortSelect) {
    elements.productSortSelect.value = `${sortBy}-${sortOrder}`
  }
  applyProductFiltersAndRender()
}

function applyProductFiltersAndRender() {
  let filtered = [...state.allProducts]

  // Apply category filter
  if (state.categoryFilter !== "all") {
    filtered = filtered.filter((product) => product.category === state.categoryFilter)
  }

  // Apply search filter
  if (state.productsSearchQuery) {
    filtered = filtered.filter(
      (product) =>
        product.item_name.toLowerCase().includes(state.productsSearchQuery) ||
        product.category.toLowerCase().includes(state.productsSearchQuery) ||
        (product.description && product.description.toLowerCase().includes(state.productsSearchQuery)),
    )
  }

  filtered = applyProductSorting(filtered)
  state.filteredProducts = filtered
  renderProductsTable()
  renderProductsPagination()
}

function applyProductSorting(products) {
  return products.sort((a, b) => {
    let aValue = a[state.productsSortBy]
    let bValue = b[state.productsSortBy]

    if (state.productsSortBy === "price_01") {
      aValue = Number(aValue) || 0
      bValue = Number(bValue) || 0
    } else if (state.productsSortBy === "shelf_life_days" || state.productsSortBy === "lead_time_days") {
      aValue = Number(aValue) || 0
      bValue = Number(bValue) || 0
    } else if (typeof aValue === "string") {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }

    if (aValue < bValue) return state.productsSortOrder === "asc" ? -1 : 1
    if (aValue > bValue) return state.productsSortOrder === "asc" ? 1 : -1
    return 0
  })
}

function renderProductsTable() {
  const tbody = elements.productsTableBody

  if (!tbody) {
    console.error("Products table body not found")
    return
  }

  if (state.filteredProducts.length === 0) {
    showProductsEmptyState()
    return
  }

  hideProductsEmptyState()

  const startIndex = (state.productsCurrentPage - 1) * CONFIG.PRODUCTS_PER_PAGE
  const endIndex = startIndex + CONFIG.PRODUCTS_PER_PAGE
  const paginatedProducts = state.filteredProducts.slice(startIndex, endIndex)

  tbody.innerHTML = paginatedProducts
    .map(
      (product) => `
          <tr class="fade-in">
              <td>
                  <img src="${product.image_url || "/placeholder.svg?height=50&width=50"}" 
                       alt="${escapeHtml(product.item_name)}" 
                       class="product-image"
              </td>
              <td>
                  <div class="product-name">${escapeHtml(product.item_name)}</div>
              </td>
              <td>
                  <span class="product-category">${escapeHtml(product.category)}</span>
              </td>
              <td>
                  <div class="pricing-info">
                      ${product.packing_01 ? `<div class="price-item">${product.packing_01}g: <strong>₹${product.price_01}</strong></div>` : ""}
                      ${product.packing_02 ? `<div class="price-item">${product.packing_02}g: <strong>₹${product.price_02}</strong></div>` : ""}
                      ${product.packing_03 ? `<div class="price-item">${product.packing_03}g: <strong>₹${product.price_03}</strong></div>` : ""}
                      ${product.packing_04 ? `<div class="price-item">${product.packing_04}g: <strong>₹${product.price_04}</strong></div>` : ""}
                  </div>
              </td>
              <td>
                  <span class="shelf-life">${product.shelf_life_days} days</span>
              </td>
              <td>
                  <span class="lead-time">${product.lead_time_days} days</span>
              </td>
              <td>
                  <div class="description-text">${escapeHtml(product.description || "No description available")}</div>
              </td>
              <td>
                  <div class="actions-cell">
                      <button class="btn btn-details" onclick="showProductDetails(${product.id})">
                          <i class="fas fa-eye"></i> View
                      </button>
                      <button class="btn btn-edit" onclick="showEditProductModal(${product.id})">
                          <i class="fas fa-edit"></i> Edit
                      </button>
                      <button class="btn btn-delete" onclick="deleteProduct(${product.id})">
                          <i class="fas fa-trash"></i> Delete
                      </button>
                  </div>
              </td>
          </tr>
      `,
    )
    .join("")
}

function showProductDetails(productId) {
  const product = state.allProducts.find((p) => p.id === productId)
  if (!product) return

  if (elements.productModalBody) {
    elements.productModalBody.innerHTML = `
          <div class="product-details">
              <div class="detail-section">
                  <h3>Product Information</h3>
                  <div class="detail-grid">
                      <div class="detail-item">
                          <strong>Product ID:</strong> ${product.id}
                      </div>
                      <div class="detail-item">
                          <strong>Name:</strong> ${escapeHtml(product.item_name)}
                      </div>
                      <div class="detail-item">
                          <strong>Category:</strong> ${escapeHtml(product.category)}
                      </div>
                      <div class="detail-item">
                          <strong>Shelf Life:</strong> ${product.shelf_life_days} days
                      </div>
                      <div class="detail-item">
                          <strong>Lead Time:</strong> ${product.lead_time_days} days
                      </div>
                  </div>
              </div>
              
              <div class="detail-section">
                  <h3>Product Image URL</h3>
                  <div class="url-display">
                      ${escapeHtml(product.image_url || "No image URL provided")}
                  </div>
              </div>
              
              <div class="detail-section">
                  <h3>Pricing & Packaging</h3>
                  <table class="items-detail-table">
                      <thead>
                          <tr>
                              <th>Package Size</th>
                              <th>Price</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${product.packing_01 ? `<tr><td>${product.packing_01}g</td><td>₹${product.price_01}</td></tr>` : ""}
                          ${product.packing_02 ? `<tr><td>${product.packing_02}g</td><td>₹${product.price_02}</td></tr>` : ""}
                          ${product.packing_03 ? `<tr><td>${product.packing_03}g</td><td>₹${product.price_03}</td></tr>` : ""}
                          ${product.packing_04 ? `<tr><td>${product.packing_04}g</td><td>₹${product.price_04}</td></tr>` : ""}
                      </tbody>
                  </table>
              </div>
              
              <div class="detail-section">
                  <h3>Description</h3>
                  <p>${escapeHtml(product.description || "No description available")}</p>
              </div>
          </div>
      `
  }

  if (elements.productModal) {
    elements.productModal.classList.add("show")
  }
}

function closeProductModal() {
  if (elements.productModal) {
    elements.productModal.classList.remove("show")
  }
}

function renderProductsPagination() {
  const totalProducts = state.filteredProducts.length
  const totalPages = Math.ceil(totalProducts / CONFIG.PRODUCTS_PER_PAGE)

  if (totalProducts === 0) {
    if (elements.productsPaginationContainer) {
      elements.productsPaginationContainer.style.display = "none"
    }
    return
  }

  if (elements.productsPaginationContainer) {
    elements.productsPaginationContainer.style.display = "flex"
  }

  const startIndex = (state.productsCurrentPage - 1) * CONFIG.PRODUCTS_PER_PAGE + 1
  const endIndex = Math.min(state.productsCurrentPage * CONFIG.PRODUCTS_PER_PAGE, totalProducts)

  if (elements.productsPaginationInfo) {
    elements.productsPaginationInfo.textContent = `Showing ${startIndex}-${endIndex} of ${totalProducts} products`
  }

  if (elements.productsPrevBtn) {
    elements.productsPrevBtn.disabled = state.productsCurrentPage === 1
  }
  if (elements.productsNextBtn) {
    elements.productsNextBtn.disabled = state.productsCurrentPage === totalPages
  }

  renderProductsPageNumbers(totalPages)
}

function renderProductsPageNumbers(totalPages) {
  const maxVisiblePages = 5
  let startPage = Math.max(1, state.productsCurrentPage - Math.floor(maxVisiblePages / 2))
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }

  let pagesHTML = ""

  for (let i = startPage; i <= endPage; i++) {
    pagesHTML += `
              <button class="page-number ${i === state.productsCurrentPage ? "active" : ""}" 
                      onclick="changeProductPage(${i})">
                  ${i}
              </button>
          `
  }

  if (elements.productsPageNumbers) {
    elements.productsPageNumbers.innerHTML = pagesHTML
  }
}

function changeProductPage(page) {
  const totalPages = Math.ceil(state.filteredProducts.length / CONFIG.PRODUCTS_PER_PAGE)

  if (page < 1 || page > totalPages) return

  state.productsCurrentPage = page
  renderProductsTable()
  renderProductsPagination()

  if (elements.productsTable) {
    elements.productsTable.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }
}

function updateProductStats() {
  const totalProducts = state.allProducts.length
  const categories = [...new Set(state.allProducts.map((p) => p.category))].length
  const lowStock = state.allProducts.filter((p) => p.shelf_life_days < 30).length

  if (elements.totalProducts) {
    elements.totalProducts.textContent = totalProducts.toLocaleString()
  }
  if (elements.totalCategories) {
    elements.totalCategories.textContent = categories.toLocaleString()
  }
  if (elements.lowStockProducts) {
    elements.lowStockProducts.textContent = lowStock.toLocaleString()
  }
}

function setProductsLoadingState(isLoading) {
  state.productsIsLoading = isLoading

  if (isLoading) {
    if (elements.productsLoadingState) elements.productsLoadingState.style.display = "flex"
    if (elements.productsTable) elements.productsTable.style.display = "none"
    if (elements.productsEmptyState) elements.productsEmptyState.style.display = "none"
    if (elements.productsPaginationContainer) elements.productsPaginationContainer.style.display = "none"
  } else {
    if (elements.productsLoadingState) elements.productsLoadingState.style.display = "none"
    if (elements.productsTable) elements.productsTable.style.display = ""
  }
}

function showProductsEmptyState() {
  if (elements.productsTable) elements.productsTable.style.display = "none"
  if (elements.productsEmptyState) elements.productsEmptyState.style.display = "block"
  if (elements.productsPaginationContainer) elements.productsPaginationContainer.style.display = "none"
}

function hideProductsEmptyState() {
  if (elements.productsEmptyState) elements.productsEmptyState.style.display = "none"
  if (elements.productsTable) elements.productsTable.style.display = ""
}

// Utility Functions
function showToast(message, type = "info") {
  const toast = document.createElement("div")
  toast.className = `toast ${type}`

  const icons = {
    success: "fas fa-check-circle",
    error: "fas fa-exclamation-circle",
    info: "fas fa-info-circle",
  }

  toast.innerHTML = `
          <i class="toast-icon ${icons[type]}"></i>
          <div class="toast-content">
              <div class="toast-message">${escapeHtml(message)}</div>
          </div>
      `

  if (elements.toastContainer) {
    elements.toastContainer.appendChild(toast)
  }

  setTimeout(() => toast.classList.add("show"), 100)

  setTimeout(() => {
    toast.classList.remove("show")
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast)
      }
    }, 300)
  }, CONFIG.TOAST_DURATION)
}

function formatDate(dateInput) {
  const date = new Date(dateInput)
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function escapeHtml(text) {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}

// Make functions available globally for onclick handlers
window.switchSection = switchSection
window.updateOrderStatus = updateOrderStatus
window.bulkUpdateStatus = bulkUpdateStatus
window.toggleOrderSelection = toggleOrderSelection
window.clearBulkSelection = clearBulkSelection
window.changePage = changePage
window.showOrderDetails = showOrderDetails
window.changeProductPage = changeProductPage
window.showProductDetails = showProductDetails
window.showEditProductModal = showEditProductModal
window.showAddProductModal = showAddProductModal
window.deleteProduct = deleteProduct

