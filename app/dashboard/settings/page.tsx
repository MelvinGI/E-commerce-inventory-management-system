"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [supabase])

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setProfile(null)
        setFormData({})
        return
      }

      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) {
        console.warn("Error loading profile:", error)

        const code = (error as any).code
        const details = (error as any).details as string | undefined
        const isNoRow =
          code === "PGRST116" || (details && details.toLowerCase().includes("results contain 0 rows"))

        if (!isNoRow) {
          throw error
        }

        const fallback = {
          id: user.id,
          email: user.email,
          role: (user.user_metadata as any)?.role ?? "admin",
          full_name: (user.user_metadata as any)?.full_name ?? user.email ?? "",
          company_name: (user.user_metadata as any)?.company_name ?? "",
          phone: (user.user_metadata as any)?.phone ?? "",
          address: (user.user_metadata as any)?.address ?? "",
          city: (user.user_metadata as any)?.city ?? "",
          state: (user.user_metadata as any)?.state ?? "",
          zip_code: (user.user_metadata as any)?.zip_code ?? "",
          country: (user.user_metadata as any)?.country ?? "",
        }

        setProfile(fallback)
        setFormData(fallback)
        return
      }

      setProfile(data)
      setFormData(data)
    } catch (error) {
      console.warn("Error loading profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile?.id) {
      alert("Profile not loaded yet. Please refresh and try again.")
      return
    }

    setIsSaving(true)
    try {
      // Use upsert to handle both insert and update cases
      const updateData = {
        id: profile.id,
        email: profile.email,
        role: profile.role || 'admin',
        full_name: formData.full_name,
        company_name: formData.company_name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code,
        country: formData.country,
      }
      
      console.log("Attempting to upsert profile:", updateData)
      
      const { data, error } = await supabase
        .from("profiles")
        .upsert(updateData, {
          onConflict: 'id'
        })
        .select()

      console.log("Upsert result:", { data, error })

      if (error) throw error

      alert("Settings updated successfully!")
      await loadProfile() // Reload to get the latest data
    } catch (error) {
      console.error("Error saving settings:", error)
      console.error("Error details:", JSON.stringify(error, null, 2))
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as any)?.message || JSON.stringify(error)
      alert(`Failed to update settings: ${errorMessage}`)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading settings...</p>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={formData.email} disabled />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fullname">Full Name</Label>
              <Input
                id="fullname"
                value={formData.full_name || ""}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                value={formData.company_name || ""}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address || ""}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city || ""}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state || ""}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="zip">Zip Code</Label>
              <Input
                id="zip"
                value={formData.zip_code || ""}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country || ""}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setFormData(profile)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">These actions cannot be undone. Please be careful.</p>
          <Button variant="destructive">Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  )
}
