"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, CheckCircle } from "lucide-react"
import { ProcurementForm } from "./procurement-form"

export function ProcurementAdmin() {
  const [orders, setOrders] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load suppliers first - try multiple approaches
      let suppliersData: any[] = []
      
      // Approach 1: Try loading from profiles table
      const { data: profileSuppliers, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name, role")
        .eq("role", "supplier")

      if (profileError) {
        console.warn("Error loading from profiles:", profileError)
        
        // Approach 2: Try loading all users and filter by metadata
        const { data: allProfiles } = await supabase
          .from("profiles")
          .select("id, email, full_name, role")
        
        suppliersData = (allProfiles || []).filter(p => p.role === "supplier")
      } else {
        suppliersData = profileSuppliers || []
      }

      // If still no suppliers, try getting from auth.users metadata
      if (suppliersData.length === 0) {
        const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
        
        if (!usersError && users) {
          suppliersData = users
            .filter(u => u.user_metadata?.role === "supplier")
            .map(u => ({
              id: u.id,
              email: u.email,
              full_name: u.user_metadata?.full_name || u.email,
              role: "supplier"
            }))
        }
      }

      setSuppliers(suppliersData)
      console.log("Loaded suppliers:", suppliersData)

      // Load procurement orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("procurement_orders")
        .select("*")
        .order("created_at", { ascending: false })

      if (ordersError) {
        console.error("Error loading orders:", ordersError)
      } else {
        // Enrich orders with supplier info
        const enrichedOrders = (ordersData || []).map(order => {
          const supplier = suppliersData.find(s => s.id === order.supplier_id)
          return {
            ...order,
            supplier_name: supplier?.full_name || supplier?.email || "Unknown"
          }
        })
        setOrders(enrichedOrders)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      alert("Error loading data. Check console for details.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReceived = async (orderId: string) => {
    if (!confirm("Confirm that you have received this delivery?")) return

    try {
      const { error } = await supabase
        .from("procurement_orders")
        .update({
          delivery_status: "received",
          received_at: new Date().toISOString(),
        })
        .eq("id", orderId)

      if (error) throw error

      alert("Order marked as received!")
      loadData()
    } catch (error) {
      console.error("Error updating order:", error)
      alert("Failed to update order status")
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    loadData()
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
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Procurement Order
        </Button>
      </div>

      {showForm && (
        <ProcurementForm
          suppliers={suppliers}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}

      {!showForm && (
        <>
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
                    ? "No procurement orders yet. Create your first order!"
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
                    <th className="text-left py-3 px-4">Supplier</th>
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
                      <td className="py-3 px-4">
                        {order.supplier_name || "N/A"}
                      </td>
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
                          {order.delivery_status === "delivered" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReceived(order.id)}
                              className="gap-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Mark Received
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
        </>
      )}
    </div>
  )
}
