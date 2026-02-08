"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ProductCard } from "@/components/store/product-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProducts()
  }, [supabase])

  const loadProducts = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      console.log("Loading products for customer...")

      // Get products added by admin only (not suppliers)
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(`
          *,
          profiles!products_supplier_id_fkey(role)
        `)
        .eq("status", "active")
        .eq("profiles.role", "admin")

      console.log("Products query result:", { productsData, productsError })

      if (productsError) {
        console.error("Products error:", productsError)
        throw productsError
      }

      setProducts(productsData || [])

      const uniqueCategories = [...new Set(productsData?.map((p: any) => p.category) || [])] as string[]
      setCategories(uniqueCategories)
    } catch (error) {
      console.error("Error loading products:", error)
      alert(`Error loading products: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = async (productId: string) => {
    setAddingToCart(productId)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      console.log("Adding to cart:", { customer_id: user.id, product_id: productId })

      // First check if item already exists in cart
      const { data: existingItem } = await supabase
        .from("shopping_cart")
        .select("*")
        .eq("customer_id", user.id)
        .eq("product_id", productId)
        .single()

      if (existingItem) {
        // Update quantity
        const { error: updateError } = await supabase
          .from("shopping_cart")
          .update({ quantity: existingItem.quantity + 1 })
          .eq("id", existingItem.id)

        if (updateError) {
          console.error("Update error:", updateError)
          throw updateError
        }
        
        alert("Product quantity updated in cart!")
      } else {
        // Insert new item
        const { data, error: insertError } = await supabase
          .from("shopping_cart")
          .insert({
            customer_id: user.id,
            product_id: productId,
            quantity: 1,
          })
          .select()

        console.log("Insert result:", { data, insertError })

        if (insertError) {
          console.error("Insert error:", insertError)
          throw insertError
        }

        alert("Product added to cart!")
      }
    } catch (error: any) {
      console.error("Error adding to cart:", error)
      const errorMessage = error?.message || JSON.stringify(error)
      alert(`Failed to add product to cart: ${errorMessage}`)
    } finally {
      setAddingToCart(null)
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading products...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Products</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
          >
            All Categories
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              image_url={product.image_url}
              supplier_name="Supplier"
              stock_quantity={product.stock_quantity}
              onAddToCart={handleAddToCart}
              isLoading={addingToCart === product.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
