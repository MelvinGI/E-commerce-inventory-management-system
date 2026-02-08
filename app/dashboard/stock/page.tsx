"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProcurementAdmin } from "@/components/stock/procurement-admin"
import { ProcurementSupplier } from "@/components/stock/procurement-supplier"

export default function StockPage() {
  const [userRole, setUserRole] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        setUserRole(profile?.role || "supplier")
      } catch (error) {
        console.error("Error loading user role:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserRole()
  }, [router, supabase])

  if (isLoading) {
    return <p>Loading...</p>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Stock Management</h1>

      <Tabs defaultValue="procurement" className="w-full">
        <TabsList>
          <TabsTrigger value="procurement">Procurement</TabsTrigger>
        </TabsList>

        <TabsContent value="procurement" className="mt-6">
          {userRole === "admin" ? <ProcurementAdmin /> : <ProcurementSupplier />}
        </TabsContent>
      </Tabs>
    </div>
  )
}
