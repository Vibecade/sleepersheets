
import * as React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface SkeletonCardProps {
  className?: string
  showHeader?: boolean
  lines?: number
}

const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  ({ className, showHeader = true, lines = 3 }, ref) => {
    return (
      <Card ref={ref} className={cn("animate-pulse", className)}>
        {showHeader && (
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
        )}
        <CardContent className="space-y-3">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")} />
          ))}
        </CardContent>
      </Card>
    )
  }
)

SkeletonCard.displayName = "SkeletonCard"

export { SkeletonCard }
