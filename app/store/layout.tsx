"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/store/navbar"

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [cartCount, setCartCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) {
          // If there's no authenticated user here, just stop loading.
          // The auth middleware already handles redirecting unauthenticated users.
          setUser(null)
          return
        }

        setUser(authUser)

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single()

        if (profileError) {
          console.warn("Error loading profile:", profileError)

          // If no profile row exists yet, fall back to auth user data instead of failing hard.
          const code = (profileError as any).code
          const details = (profileError as any).details as string | undefined
          const isNoRow =
            code === "PGRST116" ||
            (details && details.toLowerCase().includes("results contain 0 rows"))

          if (!isNoRow) {
            throw profileError
          }

          setProfile({
            id: authUser.id,
            email: authUser.email,
            full_name: (authUser.user_metadata as any)?.full_name ?? authUser.email ?? "",
          })
        } else {
          setProfile(profileData)
        }

        // Load cart count (non-fatal if it fails)
        const { data: cartData, error: cartError } = await supabase
          .from("shopping_cart")
          .select("id")
          .eq("customer_id", authUser.id)

        if (cartError) {
          console.warn("Error loading cart:", cartError)
        } else {
          setCartCount(cartData?.length || 0)
        }
      } catch (error) {
        console.warn("Error loading user data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  const userName =
    profile?.full_name || profile?.email || (user as any)?.email || "Account"

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar cartCount={cartCount} userName={userName} />
      <main className="flex-1 bg-background">{children}</main>
    </div>
  )
}
