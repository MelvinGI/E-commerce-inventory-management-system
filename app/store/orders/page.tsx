"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { OrderTracker } from "@/components/orders/order-tracker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Eye, CheckCircle } from "lucide-react"

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadOrders()
  }, [supabase])

  const loadOrders = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: ordersData, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          order_number,
          status,
          order_status,
          total_amount,
          customer_phone,
          customer_email,
          delivery_address,
          notes,
          created_at,
          confirmed_at,
          shipped_at,
          delivered_at,
          received_at,
          order_items(
            product_id,
            quantity,
            unit_price,
            products:product_id(name, image_url)
          )
        `,
        )
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setOrders(ordersData || [])
    } catch (error) {
      console.error("Error loading orders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkReceived = async (orderId: string) => {
    if (!confirm("Confirm that you have received this order?")) return

    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from("orders")
        .update({ order_status: "received" })
        .eq("id", orderId)

      if (error) throw error

      alert("Order marked as received!")
      loadOrders()
      setSelectedOrder(null)
    } catch (error: any) {
      console.error("Error updating order:", error)
      alert(`Failed to update order: ${error.message}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading orders...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">No orders yet</p>
            <Button asChild className="mt-4">
              <a href="/store/products">Start Shopping</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const currentStatus = order.order_status || order.status
            return (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{order.order_number}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge className={getStatusColor(currentStatus)}>
                        {currentStatus.replace("_", " ").toUpperCase()}
                      </Badge>
                      <p className="text-2xl font-bold">${order.total_amount.toFixed(2)}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {order.order_items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center overflow-hidden">
                          {item.products.image_url ? (
                            <img
                              src={item.products.image_url}
                              alt={item.products.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs">No img</span>
                          )}
                        </div>
                        <div className="flex-1 flex justify-between text-sm">
                          <span>
                            {item.products.name} x {item.quantity}
                          </span>
                          <span className="font-medium">${(item.unit_price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Track Order
                    </Button>
                    {currentStatus === "delivered" && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkReceived(order.id)}
                        disabled={isUpdating}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Received
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>{selectedOrder?.order_number}</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Tracker */}
              <OrderTracker
                currentStatus={selectedOrder.order_status || selectedOrder.status}
                confirmedAt={selectedOrder.confirmed_at}
                shippedAt={selectedOrder.shipped_at}
                deliveredAt={selectedOrder.delivered_at}
                receivedAt={selectedOrder.received_at}
              />

              {/* Contact Details */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Contact Information</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Phone:</span> {selectedOrder.customer_phone}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Email:</span> {selectedOrder.customer_email}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Delivery Address:</span>{" "}
                    {selectedOrder.delivery_address}
                  </p>
                  {selectedOrder.notes && (
                    <p>
                      <span className="text-muted-foreground">Notes:</span> {selectedOrder.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.order_items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>
                        {item.products.name} x {item.quantity}
                      </span>
                      <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span>${selectedOrder.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {(selectedOrder.order_status || selectedOrder.status) === "delivered" && (
                <Button
                  onClick={() => handleMarkReceived(selectedOrder.id)}
                  disabled={isUpdating}
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isUpdating ? "Updating..." : "Confirm Receipt"}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
