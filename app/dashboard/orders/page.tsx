"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, Eye, Phone, Mail, MapPin } from "lucide-react"
import { OrderTracker } from "@/components/orders/order-tracker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
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

      // Check if user is admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      const isAdmin = profile?.role === "admin"

      // Build query based on role
      let query = supabase
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
          profiles:customer_id(email, full_name),
          order_items(
            product_id,
            quantity,
            unit_price,
            products:product_id(name, image_url)
          )
        `,
        )
        .order("created_at", { ascending: false })

      // If not admin, filter by supplier
      if (!isAdmin) {
        query = query.eq("supplier_id", user.id)
      }

      const { data, error } = await query

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error("Error loading orders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ order_status: newStatus })
        .eq("id", orderId)

      if (error) throw error

      alert("Order status updated!")
      loadOrders()
      
      // Update selected order if it's the one being updated
      if (selectedOrder?.id === orderId) {
        const updatedOrder = orders.find(o => o.id === orderId)
        if (updatedOrder) {
          setSelectedOrder({ ...updatedOrder, order_status: newStatus })
        }
      }
    } catch (error: any) {
      console.error("Error updating order status:", error)
      alert(`Failed to update order status: ${error.message}`)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const currentStatus = order.order_status || order.status
    const matchesStatus = filterStatus === "all" || currentStatus === filterStatus
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesStatus && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "in_transit":
        return "bg-purple-100 text-purple-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "received":
        return "bg-gray-100 text-gray-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return <p>Loading orders...</p>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Orders</h1>

      <div className="flex gap-4 flex-col md:flex-row">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by order number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              Order placed on {selectedOrder && new Date(selectedOrder.created_at).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Tracker */}
              <div className="border rounded-lg p-4">
                <OrderTracker
                  currentStatus={selectedOrder.order_status || selectedOrder.status}
                  confirmedAt={selectedOrder.confirmed_at}
                  shippedAt={selectedOrder.shipped_at}
                  deliveredAt={selectedOrder.delivered_at}
                  receivedAt={selectedOrder.received_at}
                />
              </div>

              {/* Update Status */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Update Order Status</h4>
                <Select
                  value={selectedOrder.order_status || selectedOrder.status}
                  onValueChange={(newStatus) => updateOrderStatus(selectedOrder.id, newStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: Customer will mark as "Received" when they get the order
                </p>
              </div>

              {/* Customer Contact Details */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Customer Contact Information</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm">{selectedOrder.customer_phone || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm">{selectedOrder.customer_email || selectedOrder.profiles?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Delivery Address</p>
                      <p className="text-sm">{selectedOrder.delivery_address || "Not provided"}</p>
                    </div>
                  </div>
                  {selectedOrder.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium">Customer Notes</p>
                      <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.order_items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 pb-3 border-b last:border-0">
                      <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                        {item.products.image_url ? (
                          <img
                            src={item.products.image_url}
                            alt={item.products.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs">No img</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.products.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ${item.unit_price.toFixed(2)} x {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">${(item.unit_price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                  <div className="flex justify-between pt-3 border-t font-bold text-lg">
                    <span>Total</span>
                    <span>${selectedOrder.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {orders.length === 0 ? "No orders yet" : "No orders match your search"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted">
              <tr>
                <th className="text-left py-3 px-4">Order #</th>
                <th className="text-left py-3 px-4">Customer</th>
                <th className="text-right py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Items</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-center py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-semibold">{order.order_number}</td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{order.profiles?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{order.profiles?.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-bold">${order.total_amount.toFixed(2)}</td>
                  <td className="py-3 px-4">{order.order_items?.length} item(s)</td>
                  <td className="py-3 px-4">
                    <Badge className={getStatusColor(order.order_status || order.status)}>
                      {(order.order_status || order.status).replace("_", " ").toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-center">
                    <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
