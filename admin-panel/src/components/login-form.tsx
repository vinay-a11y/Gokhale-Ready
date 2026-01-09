"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, ArrowLeft, Key } from "lucide-react"

interface LoginFormProps {
  onLoginSuccess: (email: string, token: string) => void
  onBack: () => void
}

export function LoginForm({ onLoginSuccess, onBack }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showChangePassword, setShowChangePassword] = useState(false) 

  // Change password states
  const [changePasswordEmail, setChangePasswordEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [changePasswordLoading, setChangePasswordLoading] = useState(false)
  const [changePasswordMessage, setChangePasswordMessage] = useState("")

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  setError("")

  try {
    const response = await fetch(
      "http://localhost:8000/api/admins_ops/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ email, password }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || "Login failed")
    }

    // ✅ FIX: correct token key
    localStorage.setItem("adminToken", data.access_token)

    onLoginSuccess(data.email, data.access_token)
  } catch (err: any) {
    setError(err.message)
  } finally {
    setIsLoading(false)
  }
}


 const handleChangePassword = async (e: FormEvent) => {
  e.preventDefault()
  setChangePasswordLoading(true)
  setChangePasswordMessage("")
  setError("")

  if (newPassword !== confirmPassword) {
    setError("New passwords do not match")
    setChangePasswordLoading(false)
    return
  }

  if (newPassword.length < 6) {
    setError("New password must be at least 6 characters long")
    setChangePasswordLoading(false)
    return
  }

  try {
    const token = localStorage.getItem("adminToken")

    if (!token) {
      throw new Error("Admin not logged in")
    }

    const response = await fetch(
      "http://localhost:8000/api/admins_ops/change-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Bearer ${token}`, // 🔐 REQUIRED
        },
        body: new URLSearchParams({
          email: changePasswordEmail,
          current_password: currentPassword,
          new_password: newPassword,
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.detail || "Failed to change password")
    }

    setChangePasswordMessage(
      "Password changed successfully! You can now login with your new password."
    )

    setChangePasswordEmail("")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")

    setTimeout(() => {
      setShowChangePassword(false)
      setChangePasswordMessage("")
    }, 2000)
  } catch (err: any) {
    setError(err.message)
  } finally {
    setChangePasswordLoading(false)
  }
}

  if (showChangePassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="sm" onClick={() => setShowChangePassword(false)} className="p-2 h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm text-muted-foreground">Back to Login</div>
            </div>
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <Key className="h-6 w-6" />
              Change Password
            </CardTitle>
            <CardDescription className="text-center">Enter your current password and choose a new one</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {changePasswordMessage && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">{changePasswordMessage}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="changePasswordEmail">Email</Label>
                <Input
                  id="changePasswordEmail"
                  type="email"
                  placeholder="Enter your email"
                  value={changePasswordEmail}
                  onChange={(e) => setChangePasswordEmail(e.target.value)}
                  required
                  disabled={changePasswordLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter your current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={changePasswordLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    disabled={changePasswordLoading}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={changePasswordLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={changePasswordLoading}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={changePasswordLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={changePasswordLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={changePasswordLoading}
              >
                {changePasswordLoading ? "Changing Password..." : "Change Password"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => setShowChangePassword(false)}
                className="text-sm text-muted-foreground"
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="p-2 h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm text-muted-foreground">Back to Home</div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">Sign in to access your ERP dashboard</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => setShowChangePassword(true)}
              className="text-sm text-orange-600 hover:text-orange-700"
            >
              Need to change your password?
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

