"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, AlertTriangle } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [transactionData, setTransactionData] = useState({
    type: "adjustment",
    quantity: 0,
    notes: "",
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadInventoryData()
  }, [supabase])

  const loadInventoryData = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("supplier_id", user.id)

      if (productsError) throw productsError
      setProducts(productsData || [])

      // Load transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("inventory_transactions")
        .select("*, products(name, sku)")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })

      if (transactionsError) throw transactionsError
      setTransactions(transactionsData || [])
    } catch (error) {
      console.error("Error loading inventory data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTransaction = async () => {
    if (!selectedProduct || transactionData.quantity === 0) {
      alert("Please select a product and enter a quantity")
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      // Create transaction
      const { error: transactionError } = await supabase.from("inventory_transactions").insert({
        product_id: selectedProduct,
        transaction_type: transactionData.type,
        quantity:
          transactionData.type === "sale" || transactionData.type === "return"
            ? -Math.abs(transactionData.quantity)
            : transactionData.quantity,
        notes: transactionData.notes,
        created_by: user.id,
      })

      if (transactionError) throw transactionError

      // Update product stock
      const product = products.find((p) => p.id === selectedProduct)
      const newStock =
        product.stock_quantity +
        (transactionData.type === "sale" || transactionData.type === "return"
          ? -Math.abs(transactionData.quantity)
          : transactionData.quantity)

      const { error: updateError } = await supabase
        .from("products")
        .update({ stock_quantity: Math.max(0, newStock) })
        .eq("id", selectedProduct)

      if (updateError) throw updateError

      alert("Transaction recorded successfully!")
      loadInventoryData()
      setShowAddTransaction(false)
      setSelectedProduct("")
      setTransactionData({ type: "adjustment", quantity: 0, notes: "" })
    } catch (error) {
      console.error("Error adding transaction:", error)
      alert("Failed to record transaction")
    }
  }

  const getLowStockProducts = () => {
    return products.filter((p) => p.stock_quantity <= p.min_stock_level)
  }

  const getStockHealth = () => {
    const lowStockCount = getLowStockProducts().length
    const outOfStockCount = products.filter((p) => p.stock_quantity === 0).length

    return { lowStockCount, outOfStockCount }
  }

  const getChartData = () => {
    return products
      .sort((a, b) => b.stock_quantity - a.stock_quantity)
      .slice(0, 10)
      .map((p) => ({
        name: p.name.substring(0, 15),
        stock: p.stock_quantity,
      }))
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "purchase":
        return "bg-green-100 text-green-800"
      case "sale":
        return "bg-red-100 text-red-800"
      case "adjustment":
        return "bg-yellow-100 text-yellow-800"
      case "return":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return <p>Loading inventory...</p>
  }

  const { lowStockCount, outOfStockCount } = getStockHealth()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <Button onClick={() => setShowAddTransaction(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Log Transaction
        </Button>
      </div>

      {/* Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.reduce((sum, p) => sum + p.stock_quantity, 0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Low Stock
              {lowStockCount > 0 && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{lowStockCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Out of Stock
              {outOfStockCount > 0 && <AlertTriangle className="w-4 h-4 text-red-600" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Chart */}
      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Products by Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="stock" fill="#777C6D" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Add Transaction Form */}
      {showAddTransaction && (
        <Card>
          <CardHeader>
            <CardTitle>Log Inventory Transaction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="product">Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (Stock: {product.stock_quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type">Transaction Type</Label>
                <Select
                  value={transactionData.type}
                  onValueChange={(value) => setTransactionData({ ...transactionData, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="sale">Sale</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={transactionData.quantity}
                  onChange={(e) =>
                    setTransactionData({
                      ...transactionData,
                      quantity: Number.parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Optional notes..."
                value={transactionData.notes}
                onChange={(e) => setTransactionData({ ...transactionData, notes: e.target.value })}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddTransaction(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTransaction}>Record Transaction</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Products Alert */}
      {getLowStockProducts().length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="w-5 h-5" />
              Low Stock Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getLowStockProducts().map((product) => (
                <div key={product.id} className="flex justify-between items-center p-2 bg-white rounded">
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      Current: <span className="font-bold">{product.stock_quantity}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">Min: {product.min_stock_level}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 10).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex justify-between items-center p-3 border rounded hover:bg-muted/50"
                >
                  <div>
                    <p className="font-semibold">{transaction.products?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getTransactionColor(transaction.transaction_type)}>
                      {transaction.transaction_type}
                    </Badge>
                    <span className="font-bold text-lg">
                      {transaction.quantity > 0 ? "+" : ""}
                      {transaction.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
