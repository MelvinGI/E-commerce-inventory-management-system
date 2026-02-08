"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Truck, Package } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ProcurementSupplier() {
  const [orders, setOrders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [deliveryStatus, setDeliveryStatus] = useState("")
  const [notes, setNotes] = useState("")
  const supabase = createClient()

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from("procurement_orders")
        .select("*")
        .eq("supplier_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error("Error loading orders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !deliveryStatus) return

    try {
      const updateData: any = {
        delivery_status: deliveryStatus,
        notes: notes || selectedOrder.notes,
      }

      if (deliveryStatus === "delivered") {
        updateData.delivered_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from("procurement_orders")
        .update(updateData)
        .eq("id", selectedOrder.id)

      if (error) throw error

      alert("Delivery status updated successfully!")
      setShowStatusDialog(false)
      setSelectedOrder(null)
      setDeliveryStatus("")
      setNotes("")
      loadOrders()
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Failed to update delivery status")
    }
  }

  const openStatusDialog = (order: any) => {
    setSelectedOrder(order)
    setDeliveryStatus(order.delivery_status)
    setNotes(order.notes || "")
    setShowStatusDialog(true)
  }

  const filteredOrders = orders.filter(
    (order) =>
      order.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "in_transit":
        return "bg-blue-100 text-blue-800"
      case "delivered":
        return "bg-green-100 text-green-800"
      case "received":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: string) => {
    return status.replace("_", " ").toUpperCase()
  }

  if (isLoading) {
    return <p>Loading procurement orders...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Procurement Orders</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search by product name, SKU, or order number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {orders.length === 0
                ? "No procurement orders yet. Wait for admin to place orders."
                : "No orders match your search"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-3 px-4">Order #</th>
                <th className="text-left py-3 px-4">Product</th>
                <th className="text-left py-3 px-4">SKU</th>
                <th className="text-right py-3 px-4">Quantity</th>
                <th className="text-right py-3 px-4">Total</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Ordered</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-mono text-sm">{order.order_number}</td>
                  <td className="py-3 px-4">{order.product_name}</td>
                  <td className="py-3 px-4">{order.product_sku}</td>
                  <td className="text-right py-3 px-4">{order.quantity}</td>
                  <td className="text-right py-3 px-4">${order.total_amount.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <Badge className={getStatusColor(order.delivery_status)}>
                      {getStatusLabel(order.delivery_status)}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {new Date(order.ordered_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2 justify-end">
                      {order.delivery_status !== "received" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openStatusDialog(order)}
                          className="gap-1"
                        >
                          <Truck className="w-4 h-4" />
                          Update Status
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Delivery Status</DialogTitle>
            <DialogDescription>
              Update the delivery status for order {selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Delivery Status</Label>
              <Select value={deliveryStatus} onValueChange={setDeliveryStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about the delivery..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={!deliveryStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
