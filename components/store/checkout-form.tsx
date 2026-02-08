"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

interface CheckoutFormProps {
  cartItems: any[]
  totalAmount: number
  onSuccess: () => void
  onCancel: () => void
}

export function CheckoutForm({ cartItems, totalAmount, onSuccess, onCancel }: CheckoutFormProps) {
  const [formData, setFormData] = useState({
    phone: "",
    email: "",
    address: "",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert("Please login to continue")
        return
      }

      // Try to get admin user, but don't fail if not found
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin")
        .limit(1)
        .maybeSingle()

      // Use admin if available, otherwise use current user, or null
      const supplierId = adminProfile?.id || user.id

      console.log("Using supplier ID:", supplierId)

      // Calculate total
      const allItems = cartItems
      const orderTotal = allItems.reduce((sum, item) => sum + item.products.price * item.quantity, 0)

      // Create single order
      const orderData = {
        order_number: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        customer_id: user.id,
        supplier_id: supplierId,
        total_amount: orderTotal,
        order_status: "pending",
        customer_phone: formData.phone,
        customer_email: formData.email,
        delivery_address: formData.address,
        notes: formData.notes || null,
      }

      console.log("Creating order with data:", orderData)

      const { data: createdOrder, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select("id")
        .single()

      if (orderError) {
        console.error("Order creation error:", orderError)
        console.error("Order data:", orderData)
        throw new Error(`Failed to create order: ${orderError.message}`)
      }

      console.log("Order created successfully:", createdOrder)

      // Add order items with validation
      const orderItems = allItems.map((item) => {
        const price = parseFloat(item.products.price) || 0
        const quantity = parseInt(item.quantity) || 1
        
        return {
          order_id: createdOrder.id,
          product_id: item.products.id,
          quantity: quantity,
          unit_price: price,
          subtotal: price * quantity,
        }
      })

      console.log("Creating order items:", orderItems)
      
      // Validate all items have valid prices
      const invalidItems = orderItems.filter(item => !item.unit_price || item.unit_price <= 0)
      if (invalidItems.length > 0) {
        console.error("Items with invalid prices:", invalidItems)
        throw new Error("Some products have invalid prices. Please contact support.")
      }

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) {
        console.error("Order items error:", itemsError)
        throw new Error(`Failed to add order items: ${itemsError.message}`)
      }

      console.log("Order items created successfully")

      // Clear cart
      await supabase.from("shopping_cart").delete().eq("customer_id", user.id)

      setShowSuccess(true)
    } catch (error: any) {
      console.error("Error processing checkout:", error)
      alert(`Failed to place order: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showSuccess) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="py-12 text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Order Received!</h2>
          <p className="text-muted-foreground">
            Thank you for your order. We have received your order details and will get back to you shortly to
            arrange delivery.
          </p>
          <p className="text-sm text-muted-foreground">
            You will be contacted at: <strong>{formData.phone}</strong> or <strong>{formData.email}</strong>
          </p>
          <div className="pt-4 space-y-2">
            <Button onClick={onSuccess} className="w-full">
              View My Orders
            </Button>
            <Button variant="outline" onClick={() => window.location.href = "/store/products"} className="w-full">
              Continue Shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checkout - Contact Details</CardTitle>
        <p className="text-sm text-muted-foreground">
          Please provide your contact information. We will reach out to arrange delivery and payment.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Delivery Address *</Label>
            <Textarea
              id="address"
              placeholder="Enter your full delivery address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions or preferences..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between mb-4">
              <span className="font-semibold">Total Amount:</span>
              <span className="text-2xl font-bold">${totalAmount.toFixed(2)}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Payment will be collected upon delivery
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="flex-1">
              Back to Cart
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Processing..." : "Place Order"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
