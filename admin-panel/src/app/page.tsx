"use client"

import { useState } from "react"
import { LandingPage } from "@/components/landing-page"
import { LoginForm } from "@/components/login-form"
import { AdminDashboard } from "@/components/admin-dashboard"

type AuthState = "landing" | "login" | "dashboard"

export default function Home() {
  const [authState, setAuthState] = useState<AuthState>("landing")
  const [user, setUser] = useState<{ email: string; token: string } | null>(null)

  const handleGetStarted = () => setAuthState("login")

  const handleLoginSuccess = (email: string, token: string) => {
    setUser({ email, token })
    setAuthState("dashboard")
    localStorage.setItem("adminToken", token) // optional: persist token
  }

  const handleLogout = () => {
    setUser(null)
    setAuthState("landing")
    localStorage.removeItem("adminToken")
  }

  if (authState === "login") {
    return <LoginForm onLoginSuccess={handleLoginSuccess} onBack={handleGetStarted} />
  }

  if (authState === "dashboard" && user) {
    return <AdminDashboard user={user} onExit={handleLogout} />
  }

  return <LandingPage onGetStarted={handleGetStarted} />
}


