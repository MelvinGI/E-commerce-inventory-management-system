"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"

interface ProductCardProps {
  id: string
  name: string
  price: number
  image_url?: string
  supplier_name?: string
  stock_quantity: number
  onAddToCart: (productId: string) => void
  isLoading?: boolean
}

export function ProductCard({
  id,
  name,
  price,
  image_url,
  supplier_name,
  stock_quantity,
  onAddToCart,
  isLoading = false,
}: ProductCardProps) {
  const inStock = stock_quantity > 0

  return (
    <Card className="overflow-hidden hover:shadow-lg transition">
      <div className="bg-muted h-48 flex items-center justify-center">
        {image_url ? (
          <img src={image_url || "/placeholder.svg"} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-muted-foreground">No image</div>
        )}
      </div>

      <CardHeader>
        <CardTitle className="text-lg line-clamp-2">{name}</CardTitle>
        {supplier_name && <p className="text-sm text-muted-foreground">by {supplier_name}</p>}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">${price.toFixed(2)}</span>
          <span className={`text-sm ${inStock ? "text-green-600" : "text-destructive"}`}>
            {inStock ? `${stock_quantity} in stock` : "Out of stock"}
          </span>
        </div>

        <Button onClick={() => onAddToCart(id)} disabled={!inStock || isLoading} className="w-full">
          <ShoppingCart className="w-4 h-4 mr-2" />
          {isLoading ? "Adding..." : "Add to Cart"}
        </Button>
      </CardContent>
    </Card>
  )
}
