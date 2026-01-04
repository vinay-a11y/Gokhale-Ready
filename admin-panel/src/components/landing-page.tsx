"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  Zap,
  Globe,
  Star,
  CheckCircle,
  Package,
  ShoppingCart,
  TrendingUp,
  Sparkles,
  Crown,
  Code,
  Laptop,
} from "lucide-react"

interface LandingPageProps {
  onGetStarted: () => void
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Simulate splash screen loading
    const timer1 = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    const timer2 = setTimeout(() => {
      setShowContent(true)
    }, 2500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Splash Content */}
        <div className="text-center z-10 space-y-8">
          {/* Logo */}
          <div className="relative">
            <div className="w-32 h-32 mx-auto bg-gradient-to-r from-purple-400 to-blue-400 rounded-3xl flex items-center justify-center shadow-2xl animate-bounce">
              <Globe className="h-16 w-16 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-spin">
              <Crown className="h-4 w-4 text-yellow-800" />
            </div>
          </div>

          {/* Company Name */}
          <div className="space-y-4">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-200 via-blue-200 to-indigo-200 bg-clip-text text-transparent animate-pulse">
              OutranSystems
            </h1>
            <div className="space-y-2">
              <p className="text-xl text-purple-200 font-medium">Enterprise Resource Planning</p>
              <p className="text-lg text-blue-200">for Gokhale Bhandu Snacks</p>
            </div>
          </div>

          {/* Team Section */}
          <div className="space-y-6">
            {/* Cofounders */}
            <div className="space-y-3">
              <p className="text-purple-300 text-sm uppercase tracking-wider">Co-Founders</p>
              <div className="flex justify-center space-x-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-white font-semibold">Shubhankar Maurya</p>
                  <p className="text-purple-300 text-sm">Co-Founder</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-white font-semibold">Rishikesh Narala</p>
                  <p className="text-blue-300 text-sm">Co-Founder</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <Code className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-white font-semibold">Parth Mishra</p>
                  <p className="text-emerald-300 text-sm">Lead Developer</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <Laptop className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-white font-semibold">Vinay Mamidala</p>
                  <p className="text-orange-300 text-sm">Lead Developer</p>
                </div>
              </div>
            </div>

            {/* Lead Developers
            <div className="space-y-3">
              <p className="text-indigo-300 text-sm uppercase tracking-wider">Lead Developers</p>
              <div className="flex justify-center space-x-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <Code className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-white font-semibold">Parth Mishra</p>
                  <p className="text-emerald-300 text-sm">Lead Developer</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <Laptop className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-white font-semibold">Vinay Mamidala</p>
                  <p className="text-orange-300 text-sm">Lead Developer</p>
                </div>
              </div>
            </div> */}
          </div>

          {/* Loading Animation */}
          <div className="space-y-4">
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
            </div>
            <p className="text-purple-200 text-sm animate-pulse">Initializing System...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  OutranSystems
                </span>
                <p className="text-xs text-slate-500 -mt-1">ERP for Gokhale Bhandu Snacks</p>
              </div>
            </div>
            <Button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
            >
              Enter Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className={`py-24 px-8 transition-all duration-1000 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-8 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-200 shadow-sm text-sm px-4 py-2">
            <Star className="h-4 w-4 mr-2" />
            Enterprise Resource Planning System
          </Badge>

          <h1 className="text-7xl font-bold mb-8 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
            Gokhale Bhandu Snacks
            <br />
            <span className="text-5xl">Management System</span>
          </h1>

          <p className="text-xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            Comprehensive ERP solution designed specifically for Gokhale Bhandu Snacks operations. Streamline your
            inventory, orders, production, and business analytics all in one powerful platform.
          </p>

          <div className="flex items-center justify-center gap-6 mb-16">
            <Button
              size="lg"
              onClick={onGetStarted}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-xl text-lg px-12 py-6"
            >
              Access Dashboard
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>

          {/* Key Benefits */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 text-slate-600">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">Real-time Operations</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-slate-600">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">Automated Workflows</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-slate-600">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">Advanced Analytics</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-8 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Complete Business Management
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Everything you need to manage Gokhale Bhandu Snacks operations efficiently
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <ShoppingCart className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Order Management</h3>
                <p className="text-slate-600">Complete order lifecycle from placement to delivery tracking</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Inventory Control</h3>
                <p className="text-slate-600">Smart inventory management with automated alerts</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-emerald-50 to-emerald-100">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Analytics</h3>
                <p className="text-slate-600">Real-time insights and comprehensive reporting</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Kitchen Management</h3>
                <p className="text-slate-600">Production planning and kitchen operations</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="border-0 shadow-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
            <CardContent className="py-16 px-8 relative">
              <Sparkles className="h-16 w-16 mx-auto mb-6 text-white/80" />
              <h2 className="text-4xl font-bold mb-4">Ready to Streamline Operations?</h2>
              <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                Access your comprehensive business management dashboard and take control of Gokhale Bhandu Snacks
                operations.
              </p>
              <Button
                size="lg"
                onClick={onGetStarted}
                className="bg-white text-purple-600 hover:bg-slate-100 shadow-xl text-lg px-10 py-4"
              >
                Enter Dashboard
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <div className="flex items-center justify-center gap-8 mt-8 text-purple-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Real-time Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Secure Access</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">24/7 Monitoring</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-8">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <span className="text-2xl font-bold">OutranSystems</span>
            </div>
            <p className="text-slate-400 text-lg mb-8">ERP System for Gokhale Bhandu Snacks</p>
          </div>

          {/* Development Team */}
          <div className="border-t border-slate-800 pt-12">
            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-slate-300 mb-6">Developed by</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-white font-medium">Shubhankar Maurya</p>
                  <p className="text-purple-400 text-sm">Co-Founder</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-white font-medium">Rishikesh Narala</p>
                  <p className="text-blue-400 text-sm">Co-Founder</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Code className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-white font-medium">Parth Mishra</p>
                  <p className="text-emerald-400 text-sm">Lead Developer</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Laptop className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-white font-medium">Vinay Mamidala</p>
                  <p className="text-orange-400 text-sm">Lead Developer</p>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="text-center pt-8 border-t border-slate-800">
              <p className="text-slate-500 text-sm">© 2024 OutranSystems. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

