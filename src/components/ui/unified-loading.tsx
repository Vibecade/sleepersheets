import * as React from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Unified loading component for different scenarios
interface UnifiedLoadingProps {
  variant?: "text" | "card" | "table-row" | "page" | "form"
  size?: "sm" | "md" | "lg"
  lines?: number
  className?: string
}

const UnifiedLoading = React.forwardRef<HTMLDivElement, UnifiedLoadingProps>(
  ({ variant = "text", size = "md", lines = 3, className }, ref) => {
    const sizeClasses = {
      sm: "text-xs gap-1",
      md: "text-sm gap-2", 
      lg: "text-base gap-3"
    }

    switch (variant) {
      case "text":
        return (
          <div ref={ref} className={cn("flex items-center text-muted-foreground", sizeClasses[size], className)}>
            <LoadingSpinner size="sm" />
            <span>Loading...</span>
          </div>
        )

      case "card":
        return (
          <Card ref={ref} className={cn("animate-pulse", className)}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: lines }).map((_, i) => (
                <Skeleton key={i} className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")} />
              ))}
            </CardContent>
          </Card>
        )

      case "table-row":
        return (
          <div ref={ref} className={cn("flex items-center justify-between p-2", className)}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        )

      case "form":
        return (
          <div ref={ref} className={cn("space-y-4", className)}>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        )

      case "page":
        return (
          <div ref={ref} className={cn("space-y-6", className)}>
            <div className="space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3 p-4 border rounded">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return (
          <div ref={ref} className={cn("flex items-center text-muted-foreground", sizeClasses[size], className)}>
            <LoadingSpinner size="sm" />
            <span>Loading...</span>
          </div>
        )
    }
  }
)

UnifiedLoading.displayName = "UnifiedLoading"

export { UnifiedLoading }