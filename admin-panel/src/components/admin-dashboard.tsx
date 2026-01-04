"use client"

import { useState } from "react"
import { Navbar } from "./navbar"
import { DashboardSection } from "./dashboard-section"
import { OrdersSection } from "./orders-section"
import { ProductsSection } from "./products-section"
import { KitchenSection } from "./kitchen-section"

import type { ActiveSection } from "@/types/admin"

interface AdminDashboardProps {
  user: { email: string; token: string }
  onExit: () => void
}

export function AdminDashboard({ user, onExit }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<ActiveSection>("dashboard")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Navbar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onExit={onExit}
      />
      
      <main className="transition-all duration-300 ease-in-out">
        {activeSection === "dashboard" && <DashboardSection />}
        {activeSection === "orders" && <OrdersSection />}
        {activeSection === "products" && <ProductsSection />}
        {activeSection === "kitchen" && <KitchenSection />}
      </main>
    </div>
  )
}

