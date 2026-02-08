"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function StorePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sidebar to-sidebar-accent">
      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold mb-4 text-foreground">Welcome to InventoryHub Store</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Discover thousands of quality products from trusted suppliers
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="bg-card p-8 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-3">Wide Selection</h3>
            <p className="text-muted-foreground mb-6">Browse products from multiple suppliers all in one place</p>
          </div>

          <div className="bg-card p-8 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-3">Best Prices</h3>
            <p className="text-muted-foreground mb-6">Compare prices and get the best deals on quality products</p>
          </div>

          <div className="bg-card p-8 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-3">Easy Checkout</h3>
            <p className="text-muted-foreground mb-6">Fast and secure checkout process with real-time inventory</p>
          </div>
        </div>

        <Link href="/store/products">
          <Button size="lg" className="mt-12">
            Start Shopping
          </Button>
        </Link>
      </div>
    </div>
  )
}
