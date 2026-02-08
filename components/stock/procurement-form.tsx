"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ProcurementFormProps {
  suppliers: any[]
  onSuccess: () => void
  onCancel: () => void
}

export function ProcurementForm({ suppliers, onSuccess, onCancel }: ProcurementFormProps) {
  const [formData, setFormData] = useState({
    supplier_id: "",
    product_name: "",
    product_sku: "",
    category: "",
    quantity: "",
    unit_price: "",
    description: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert("You must be logged in")
        return
      }

      const quantity = parseInt(formData.quantity)
      const unitPrice = parseFloat(formData.unit_price)
      const totalAmount = quantity * unitPrice

      const { error } = await supabase.from("procurement_orders").insert({
        admin_id: user.id,
        supplier_id: formData.supplier_id,
        product_name: formData.product_name,
        product_sku: formData.product_sku,
        category: formData.category || null,
        quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        description: formData.description || null,
        delivery_status: "pending",
      })

      if (error) throw error

      alert("Procurement order created successfully!")
      onSuccess()
    } catch (error) {
      console.error("Error creating procurement order:", error)
      alert("Failed to create procurement order")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Procurement Order</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) => handleChange("supplier_id", value)}
                required
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.full_name || supplier.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_name">Product Name *</Label>
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e) => handleChange("product_name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_sku">Product SKU *</Label>
              <Input
                id="product_sku"
                value={formData.product_sku}
                onChange={(e) => handleChange("product_sku", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_price">Unit Price ($) *</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price}
                onChange={(e) => handleChange("unit_price", e.target.value)}
                required
              />
            </div>
          </div>

          {formData.quantity && formData.unit_price && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Total Amount: ${(parseFloat(formData.quantity) * parseFloat(formData.unit_price)).toFixed(2)}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              placeholder="Add any additional details about the order..."
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Order"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
