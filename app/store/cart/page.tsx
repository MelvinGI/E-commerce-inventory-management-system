"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Trash2 } from "lucide-react"
import { CheckoutForm } from "@/components/store/checkout-form"

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadCart()
  }, [supabase])

  const loadCart = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: cart, error } = await supabase
        .from("shopping_cart")
        .select(
          `
          id,
          quantity,
          products:product_id(
            id,
            name,
            price,
            stock_quantity,
            supplier_id,
            image_url
          )
        `,
        )
        .eq("customer_id", user.id)

      if (error) throw error
      setCartItems(cart || [])
    } catch (error) {
      console.error("Error loading cart:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(cartItemId)
      return
    }

    try {
      const { error } = await supabase.from("shopping_cart").update({ quantity: newQuantity }).eq("id", cartItemId)

      if (error) throw error

      setCartItems(cartItems.map((item) => (item.id === cartItemId ? { ...item, quantity: newQuantity } : item)))
    } catch (error) {
      console.error("Error updating quantity:", error)
    }
  }

  const removeItem = async (cartItemId: string) => {
    try {
      const { error } = await supabase.from("shopping_cart").delete().eq("id", cartItemId)

      if (error) throw error

      setCartItems(cartItems.filter((item) => item.id !== cartItemId))
    } catch (error) {
      console.error("Error removing item:", error)
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + item.products.price * item.quantity
    }, 0)
  }

  const handleCheckout = () => {
    setIsProcessing(true)
  }

  const handleCheckoutSuccess = () => {
    router.push("/store/orders")
  }

  const handleCheckoutCancel = () => {
    setIsProcessing(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading cart...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">Your cart is empty</p>
            <Button asChild className="mt-6">
              <a href="/store/products">Continue Shopping</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="py-6">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-muted rounded flex items-center justify-center">
                      {item.products.image_url ? (
                        <img
                          src={item.products.image_url || "/placeholder.svg"}
                          alt={item.products.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-muted-foreground">No image</span>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold">{item.products.name}</h3>
                      <p className="text-sm text-muted-foreground">${item.products.price.toFixed(2)} each</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, Number.parseInt(e.target.value))}
                        className="w-16"
                      />
                      <Button variant="outline" size="icon" onClick={() => removeItem(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <p className="font-bold">${(item.products.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="border-t pt-4 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>

                <Button onClick={handleCheckout} disabled={isProcessing} className="w-full">
                  Proceed to Checkout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Checkout Form Modal */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="max-w-2xl w-full">
            <CheckoutForm
              cartItems={cartItems}
              totalAmount={calculateTotal()}
              onSuccess={handleCheckoutSuccess}
              onCancel={handleCheckoutCancel}
            />
          </div>
        </div>
      )}
    </div>
  )
}
