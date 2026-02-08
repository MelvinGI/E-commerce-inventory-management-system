"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">Inventory & E-Commerce Platform</h1>
        <p className="text-xl text-muted-foreground mb-8">Manage your inventory, products, and orders seamlessly</p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth">
            <Button size="lg">Sign In</Button>
          </Link>
          <Link href="/auth/sign-up">
            <Button size="lg" variant="outline">
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
