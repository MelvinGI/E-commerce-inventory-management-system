"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Package, ShoppingCart, BarChart3, LogOut, Settings, Users, Warehouse } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  userRole: string
  onLogout: () => void
}

export function Sidebar({ userRole, onLogout }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ]

  // Add role-specific navigation items
  if (userRole === "admin") {
    navItems.push(
      { href: "/dashboard/products", label: "Products", icon: Package },
      { href: "/dashboard/stock", label: "Stock", icon: Warehouse },
      { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
      { href: "/dashboard/users", label: "Users", icon: Users },
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/dashboard/settings", label: "Settings", icon: Settings }
    )
  } else {
    // Supplier navigation - no Products, only Stock
    navItems.push(
      { href: "/dashboard/stock", label: "Stock", icon: Warehouse },
      { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/dashboard/settings", label: "Settings", icon: Settings }
    )
  }

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold text-sidebar-foreground">InventoryHub</h1>
        <p className="text-sm text-sidebar-foreground/60 capitalize mt-1">{userRole}</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button variant={isActive ? "default" : "ghost"} className="w-full justify-start gap-2">
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Button variant="outline" className="w-full justify-start gap-2 bg-transparent" onClick={onLogout}>
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
