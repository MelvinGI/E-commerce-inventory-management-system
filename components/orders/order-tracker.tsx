"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle, Circle, Clock, Package, Truck } from "lucide-react"

interface OrderTrackerProps {
  currentStatus: string
  confirmedAt?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
  receivedAt?: string | null
}

export function OrderTracker({
  currentStatus,
  confirmedAt,
  shippedAt,
  deliveredAt,
  receivedAt,
}: OrderTrackerProps) {
  const statuses = [
    { key: "pending", label: "Pending", icon: Clock, timestamp: null },
    { key: "processing", label: "Processing", icon: Package, timestamp: confirmedAt },
    { key: "in_transit", label: "In Transit", icon: Truck, timestamp: shippedAt },
    { key: "delivered", label: "Delivered", icon: CheckCircle, timestamp: deliveredAt },
    { key: "received", label: "Received", icon: CheckCircle, timestamp: receivedAt },
  ]

  const currentIndex = statuses.findIndex((s) => s.key === currentStatus)

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

  if (currentStatus === "cancelled") {
    return (
      <div className="text-center py-4">
        <Badge className="bg-red-100 text-red-800 text-lg px-4 py-2">Order Cancelled</Badge>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Order Status</h3>
        <Badge className={getStatusColor(currentStatus)}>
          {statuses.find((s) => s.key === currentStatus)?.label || currentStatus}
        </Badge>
      </div>

      <div className="relative">
        {statuses.map((status, index) => {
          const Icon = status.icon
          const isCompleted = index <= currentIndex
          const isCurrent = index === currentIndex

          return (
            <div key={status.key} className="flex items-start gap-4 relative">
              {/* Connector Line */}
              {index < statuses.length - 1 && (
                <div
                  className={`absolute left-4 top-8 w-0.5 h-12 ${
                    isCompleted ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              )}

              {/* Icon */}
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted ? "bg-green-500 text-white" : "bg-gray-300 text-gray-600"
                } ${isCurrent ? "ring-4 ring-green-200" : ""}`}
              >
                {isCompleted ? <Icon className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              </div>

              {/* Content */}
              <div className="flex-1 pb-8">
                <p className={`font-medium ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                  {status.label}
                </p>
                {status.timestamp && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(status.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
