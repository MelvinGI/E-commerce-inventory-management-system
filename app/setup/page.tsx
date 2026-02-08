"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleCreateAdmin = async () => {
    setLoading(true)
    setMessage("")
    setError("")

    try {
      const response = await fetch("/api/setup/create-admin", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to create admin account")
      } else {
        setMessage(`✓ Admin account created successfully!\n\nEmail: ${data.email}\nYou can now log in.`)
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#777C6D] to-[#B7B89F] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <h1 className="text-2xl font-bold mb-2 text-[#777C6D]">System Setup</h1>
        <p className="text-gray-600 mb-6">Create the admin account to get started</p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Admin Credentials:</strong>
            <br />
            Email: nyanjomadmin1@gmail.com
            <br />
            Password: Nyanjom531723#
          </p>
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-800 whitespace-pre-line">{message}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Button
          onClick={handleCreateAdmin}
          disabled={loading}
          className="w-full bg-[#777C6D] hover:bg-[#6a6f65] text-white"
        >
          {loading ? "Creating Admin Account..." : "Create Admin Account"}
        </Button>
      </Card>
    </div>
  )
}
