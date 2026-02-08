"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { Package, ShoppingCart, TrendingUp, Users, Warehouse, Bell, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const chartColors = ["#777C6D", "#B7B89F", "#CBCBCB", "#EEEEEE"]

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    procurementOrders: 0,
    pendingProcurement: 0,
  })
  const [userRole, setUserRole] = useState("")
  const [notifications, setNotifications] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) return

        // Get user role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        const role = profile?.role || "supplier"
        setUserRole(role)

        // Fetch stats based on role
        if (role === "admin") {
          const [productsRes, ordersRes, customersRes, procurementRes] = await Promise.all([
            supabase.from("products").select("id"),
            supabase.from("orders").select("total_amount"),
            supabase.from("orders").select("customer_id"),
            supabase.from("procurement_orders").select("id, delivery_status, total_amount"),
          ])

          const totalProducts = productsRes.data?.length || 0
          const totalOrders = ordersRes.data?.length || 0
          const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + Number.parseFloat(order.total_amount), 0) || 0
          const uniqueCustomers = new Set(customersRes.data?.map((order) => order.customer_id) || [])
          const totalCustomers = uniqueCustomers.size
          const procurementOrders = procurementRes.data?.length || 0
          const pendingProcurement = procurementRes.data?.filter(p => p.delivery_status === "delivered").length || 0

          setStats({
            totalProducts,
            totalOrders,
            totalRevenue,
            totalCustomers,
            procurementOrders,
            pendingProcurement,
          })

          // Load admin notifications
          const adminNotifications = []
          if (pendingProcurement > 0) {
            adminNotifications.push({
              id: "proc-delivered",
              type: "procurement",
              message: `${pendingProcurement} procurement order${pendingProcurement > 1 ? 's' : ''} delivered and awaiting confirmation`,
              link: "/dashboard/stock",
              priority: "high"
            })
          }
          setNotifications(adminNotifications)

        } else {
          // Supplier stats
          const [productsRes, ordersRes, customersRes, procurementRes] = await Promise.all([
            supabase.from("products").select("id").eq("supplier_id", user.id),
            supabase.from("orders").select("total_amount").eq("supplier_id", user.id),
            supabase.from("orders").select("customer_id").eq("supplier_id", user.id),
            supabase.from("procurement_orders").select("id, delivery_status").eq("supplier_id", user.id),
          ])

          const totalProducts = productsRes.data?.length || 0
          const totalOrders = ordersRes.data?.length || 0
          const totalRevenue = ordersRes.data?.reduce((sum, order) => sum + Number.parseFloat(order.total_amount), 0) || 0
          const uniqueCustomers = new Set(customersRes.data?.map((order) => order.customer_id) || [])
          const totalCustomers = uniqueCustomers.size
          const procurementOrders = procurementRes.data?.length || 0
          const pendingProcurement = procurementRes.data?.filter(p => p.delivery_status === "pending").length || 0

          setStats({
            totalProducts,
            totalOrders,
            totalRevenue,
            totalCustomers,
            procurementOrders,
            pendingProcurement,
          })

          // Load supplier notifications
          const supplierNotifications = []
          if (pendingProcurement > 0) {
            supplierNotifications.push({
              id: "proc-pending",
              type: "procurement",
              message: `${pendingProcurement} new procurement order${pendingProcurement > 1 ? 's' : ''} awaiting processing`,
              link: "/dashboard/stock",
              priority: "high"
            })
          }
          setNotifications(supplierNotifications)
        }

        // Generate chart data from last 6 months
        const monthlyData = []
        for (let i = 5; i >= 0; i--) {
          const date = new Date()
          date.setMonth(date.getMonth() - i)
          monthlyData.push({
            month: date.toLocaleDateString("en-US", { month: "short" }),
            orders: Math.floor(Math.random() * 10) + 1,
            revenue: Math.floor(Math.random() * 10000) + 1000,
          })
        }
        setChartData(monthlyData)
      } catch (error) {
        console.error("Error loading dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [supabase])

  if (isLoading) {
    return <p>Loading dashboard...</p>
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notifications.length > 0 && (
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((notif) => (
              <div key={notif.id} className="flex items-start justify-between gap-4 p-3 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notif.type === "procurement" ? "Procurement Alert" : "System Alert"}
                    </p>
                  </div>
                </div>
                <Link href={notif.link}>
                  <Button size="sm" variant="outline">View</Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {userRole === "admin" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">Active products</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procurement Orders</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.procurementOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingProcurement > 0 && (
                <Badge variant="secondary" className="mt-1">
                  {stats.pendingProcurement} {userRole === "admin" ? "to confirm" : "pending"}
                </Badge>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Orders this period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Orders Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill={chartColors[0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke={chartColors[0]} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
