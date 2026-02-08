"use client"

import { useEffect, useState } from "react"
import { Bell, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface HeaderProps {
  userName: string
}

export function Header({ userName }: HeaderProps) {
  const [notificationCount, setNotificationCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadNotifications()
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      const role = profile?.role || "supplier"
      const notifs: any[] = []

      if (role === "admin") {
        // Check for delivered procurement orders
        const { data: delivered } = await supabase
          .from("procurement_orders")
          .select("id, order_number, product_name")
          .eq("delivery_status", "delivered")
          .limit(5)

        if (delivered && delivered.length > 0) {
          delivered.forEach(order => {
            notifs.push({
              id: order.id,
              type: "procurement",
              title: "Delivery Confirmation Needed",
              message: `Order ${order.order_number} - ${order.product_name}`,
              link: "/dashboard/stock",
            })
          })
        }
      } else {
        // Check for pending procurement orders
        const { data: pending } = await supabase
          .from("procurement_orders")
          .select("id, order_number, product_name")
          .eq("supplier_id", user.id)
          .eq("delivery_status", "pending")
          .limit(5)

        if (pending && pending.length > 0) {
          pending.forEach(order => {
            notifs.push({
              id: order.id,
              type: "procurement",
              title: "New Procurement Order",
              message: `Order ${order.order_number} - ${order.product_name}`,
              link: "/dashboard/stock",
            })
          })
        }
      }

      setNotifications(notifs)
      setNotificationCount(notifs.length)
    } catch (error) {
      console.error("Error loading notifications:", error)
    }
  }

  return (
    <header className="border-b border-border bg-card h-16 flex items-center justify-between px-6">
      <div>
        <h2 className="text-xl font-semibold">Dashboard</h2>
      </div>
      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {notificationCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No new notifications
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <Link key={notif.id} href={notif.link}>
                      <div className="p-3 hover:bg-muted rounded-lg cursor-pointer border">
                        <p className="text-sm font-medium">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <Button variant="ghost" size="icon">
          <User className="w-5 h-5" />
        </Button>
        <span className="text-sm font-medium">{userName}</span>
      </div>
    </header>
  )
}
