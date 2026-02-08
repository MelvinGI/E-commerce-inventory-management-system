"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
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
            role: (authUser.user_metadata as any)?.role ?? "admin",
          })
        } else {
          setProfile(profileData)
        }
      } catch (error) {
        console.warn("Error loading user data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  const userRole = profile?.role || (user as any)?.user_metadata?.role || "admin"
  const userName = profile?.full_name || profile?.email || (user as any)?.email || "Account"

  return (
    <div className="flex h-screen">
      <Sidebar userRole={userRole} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col">
        <Header userName={userName} />
        <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
      </div>
    </div>
  )
}
