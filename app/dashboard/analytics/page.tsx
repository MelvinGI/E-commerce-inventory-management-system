"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, DollarSign, ShoppingCart } from "lucide-react"

const chartColors = ["#777C6D", "#B7B89F", "#CBCBCB", "#EEEEEE"]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("30")
  const [analytics, setAnalytics] = useState({
    revenue: 0,
    orders: 0,
    avgOrderValue: 0,
    conversionRate: 0,
    topProducts: [] as any[],
    revenueByCategory: [] as any[],
    salesTrend: [] as any[],
    statusBreakdown: [] as any[],
    procurementStats: {
      total: 0,
      pending: 0,
      inTransit: 0,
      delivered: 0,
      received: 0,
      totalValue: 0,
    },
    procurementTrend: [] as any[],
  })
  const [userRole, setUserRole] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadAnalytics()
  }, [timeRange, supabase])

  const loadAnalytics = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Get user role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      const role = profile?.role || "supplier"
      setUserRole(role)

      const daysAgo = new Date()
      daysAgo.setDate(daysAgo.getDate() - Number.parseInt(timeRange))

      // Fetch orders based on role
      const ordersQuery = supabase
        .from("orders")
        .select(
          `
          id,
          total_amount,
          status,
          created_at,
          order_items(
            product_id,
            quantity,
            unit_price,
            products(name, category)
          )
        `,
        )
        .gte("created_at", daysAgo.toISOString())

      if (role !== "admin") {
        ordersQuery.eq("supplier_id", user.id)
      }

      const { data: ordersData } = await ordersQuery

      // Fetch procurement orders
      const procurementQuery = supabase
        .from("procurement_orders")
        .select("*")
        .gte("created_at", daysAgo.toISOString())

      if (role !== "admin") {
        procurementQuery.eq("supplier_id", user.id)
      }

      const { data: procurementData } = await procurementQuery

      // Calculate metrics
      const totalRevenue = ordersData?.reduce((sum, order) => sum + Number.parseFloat(order.total_amount), 0) || 0

      const totalOrders = ordersData?.length || 0
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Top products
      const productMap = new Map<string, { name: string; quantity: number; revenue: number }>()
      ordersData?.forEach((order) => {
        order.order_items?.forEach((item: any) => {
          const existing = productMap.get(item.product_id) || {
            name: item.products.name,
            quantity: 0,
            revenue: 0,
          }
          existing.quantity += item.quantity
          existing.revenue += item.unit_price * item.quantity
          productMap.set(item.product_id, existing)
        })
      })

      const topProducts = Array.from(productMap.entries())
        .map(([_, value]) => value)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map((p) => ({
          name: p.name.substring(0, 20),
          revenue: p.revenue,
          quantity: p.quantity,
        }))

      // Revenue by category
      const categoryMap = new Map<string, number>()
      ordersData?.forEach((order) => {
        order.order_items?.forEach((item: any) => {
          const category = item.products.category
          categoryMap.set(category, (categoryMap.get(category) || 0) + item.unit_price * item.quantity)
        })
      })

      const revenueByCategory = Array.from(categoryMap.entries()).map(([name, value]) => ({
        name,
        value: Number.parseFloat(value.toFixed(2)),
      }))

      // Status breakdown
      const statusCount =
        ordersData?.reduce((acc: Record<string, number>, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1
          return acc
        }, {}) || {}

      const statusBreakdown = Object.entries(statusCount).map(([status, count]) => ({
        name: status,
        value: count,
      }))

      // Sales trend (last 7 days)
      const salesByDay = new Map<string, number>()
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dayStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        salesByDay.set(dayStr, 0)
      }

      ordersData?.forEach((order) => {
        const date = new Date(order.created_at)
        const dayStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        if (salesByDay.has(dayStr)) {
          salesByDay.set(dayStr, salesByDay.get(dayStr)! + Number.parseFloat(order.total_amount))
        }
      })

      const salesTrend = Array.from(salesByDay.entries()).map(([day, amount]) => ({
        day,
        amount: Number.parseFloat(amount.toFixed(2)),
      }))

      // Procurement analytics
      const procurementStats = {
        total: procurementData?.length || 0,
        pending: procurementData?.filter(p => p.delivery_status === "pending").length || 0,
        inTransit: procurementData?.filter(p => p.delivery_status === "in_transit").length || 0,
        delivered: procurementData?.filter(p => p.delivery_status === "delivered").length || 0,
        received: procurementData?.filter(p => p.delivery_status === "received").length || 0,
        totalValue: procurementData?.reduce((sum, p) => sum + Number.parseFloat(p.total_amount), 0) || 0,
      }

      // Procurement trend by day
      const procurementByDay = new Map<string, number>()
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dayStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        procurementByDay.set(dayStr, 0)
      }

      procurementData?.forEach((order) => {
        const date = new Date(order.created_at)
        const dayStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        if (procurementByDay.has(dayStr)) {
          procurementByDay.set(dayStr, procurementByDay.get(dayStr)! + Number.parseFloat(order.total_amount))
        }
      })

      const procurementTrend = Array.from(procurementByDay.entries()).map(([day, amount]) => ({
        day,
        amount: Number.parseFloat(amount.toFixed(2)),
      }))

      setAnalytics({
        revenue: totalRevenue,
        orders: totalOrders,
        avgOrderValue,
        conversionRate: 65, // Mock data
        topProducts,
        revenueByCategory,
        salesTrend,
        statusBreakdown,
        procurementStats,
        procurementTrend,
      })
    } catch (error) {
      console.error("Error loading analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <p>Loading analytics...</p>
  }

  const revenueChange = 12.5 // Mock data
  const ordersChange = 8.3 // Mock data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics & Reports</h1>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-600" />
              {revenueChange}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.orders}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-600" />
              {ordersChange}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{analytics.orders > 0 ? "Active period" : "No orders"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Estimated</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke={chartColors[0]} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Category */}
        {analytics.revenueByCategory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.revenueByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {analytics.revenueByCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Products */}
        {analytics.topProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Products</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill={chartColors[0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Order Status Breakdown */}
        {analytics.statusBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Orders by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.statusBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {analytics.statusBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Procurement Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Procurement Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{analytics.procurementStats.total}</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-yellow-700">{analytics.procurementStats.pending}</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground">In Transit</p>
              <p className="text-2xl font-bold text-blue-700">{analytics.procurementStats.inTransit}</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Delivered</p>
              <p className="text-2xl font-bold text-green-700">{analytics.procurementStats.delivered}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Received</p>
              <p className="text-2xl font-bold text-gray-700">{analytics.procurementStats.received}</p>
            </div>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">Total Procurement Value</p>
            <p className="text-3xl font-bold">${analytics.procurementStats.totalValue.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Procurement Trend */}
      {analytics.procurementTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Procurement Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.procurementTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#777C6D" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Avg Revenue Per Day</p>
              <p className="text-2xl font-bold">
                ${(analytics.revenue / (Number.parseInt(timeRange) || 1)).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Categories</p>
              <p className="text-2xl font-bold">{analytics.revenueByCategory.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Procurement Completion Rate</p>
              <p className="text-2xl font-bold">
                {analytics.procurementStats.total > 0 
                  ? `${((analytics.procurementStats.received / analytics.procurementStats.total) * 100).toFixed(0)}%`
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Procurement Value</p>
              <p className="text-2xl font-bold">
                ${analytics.procurementStats.total > 0 
                  ? (analytics.procurementStats.totalValue / analytics.procurementStats.total).toFixed(2)
                  : "0.00"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
