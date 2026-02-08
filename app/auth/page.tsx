"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

export default function AuthPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Inventory System</h1>
            <p className="text-muted-foreground">Choose your account type</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Select Account Type</CardTitle>
              <CardDescription>Choose how you want to access the system</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Link href="/auth/login?role=supplier" className="w-full">
                <Button className="w-full h-12 text-base">Admin / Supplier</Button>
              </Link>
              <Link href="/auth/login?role=customer" className="w-full">
                <Button variant="outline" className="w-full h-12 text-base bg-transparent">
                  Customer
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-semibold mb-1">Supplier Account?</p>
                  <p>Supplier accounts are created by administrators. Contact your admin if you need access.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/auth/sign-up" className="underline underline-offset-4">
              Sign up as customer
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
