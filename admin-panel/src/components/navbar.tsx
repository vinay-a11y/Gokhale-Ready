"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, ShoppingCart, Package, ChefHat, Globe, Menu, X, LogOut } from "lucide-react"
import type { ActiveSection } from "@/types/admin" // adjust path

interface NavbarProps {
  activeSection: ActiveSection
  onSectionChange: (section: ActiveSection) => void
  onExit: () => void  // <- new prop
}

export function Navbar({ activeSection, onSectionChange, onExit }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { id: "dashboard" as ActiveSection, label: "Dashboard", icon: BarChart3, description: "Business Overview" },
    { id: "orders" as ActiveSection, label: "Orders", icon: ShoppingCart, description: "Order Management" },
    { id: "products" as ActiveSection, label: "Products", icon: Package, description: "Product Catalog" },
    { id: "kitchen" as ActiveSection, label: "Kitchen", icon: ChefHat, description: "Production Planning" },
  ]

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                OutranSystems
              </h1>
              <p className="text-xs text-slate-500 -mt-1">Gokhale Bhandu Snacks ERP</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => onSectionChange(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg transform scale-105"
                      : "text-slate-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:text-purple-600"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                      Active
                    </Badge>
                  )}
                </Button>
              )
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={onExit} // <- use the callback
              className="hidden md:flex border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Exit
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => {
                    onSectionChange(item.id)
                    setIsMobileMenuOpen(false)
                  }}
                  className={`w-full justify-start gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                      : "text-slate-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 hover:text-purple-600"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs opacity-75">{item.description}</div>
                  </div>
                  {isActive && (
                    <Badge variant="secondary" className="bg-white/20 text-white text-xs ml-auto">
                      Active
                    </Badge>
                  )}
                </Button>
              )
            })}

            <div className="pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => {
                  onExit() // <- mobile exit also calls callback
                  setIsMobileMenuOpen(false)
                }}
                className="w-full justify-start gap-3 border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="h-5 w-5" />
                Exit to Landing
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

