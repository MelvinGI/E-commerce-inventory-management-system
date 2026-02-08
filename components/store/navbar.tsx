"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingCart, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"

interface NavbarProps {
  cartCount: number
  userName: string
}

export function Navbar({ cartCount, userName }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <nav className="border-b border-border bg-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/store" className="text-2xl font-bold">
          InventoryHub Store
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/store/products" className="hover:text-primary transition">
            Products
          </Link>
          <Link href="/store/orders" className="hover:text-primary transition">
            My Orders
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/store/cart">
            <Button variant="outline" size="sm" className="relative bg-transparent">
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>

          <Button variant="ghost" size="sm" asChild>
            <Link href="/store/profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {userName}
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isLoading}
            className="flex items-center gap-2 bg-transparent"
          >
            <LogOut className="w-4 h-4" />
            {isLoading ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </nav>
  )
}
