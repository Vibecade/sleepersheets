import * as React from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface LoadingTextProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

const LoadingText = React.forwardRef<HTMLDivElement, LoadingTextProps>(
  ({ className, size = "md" }, ref) => {
    const sizeClasses = {
      sm: "text-xs",
      md: "text-sm", 
      lg: "text-base"
    }

    return (
      <div ref={ref} className={cn("flex items-center gap-2 text-muted-foreground", sizeClasses[size], className)}>
        <LoadingSpinner size="sm" />
        <span>Loading...</span>
      </div>
    )
  }
)

LoadingText.displayName = "LoadingText"

interface LoadingCardProps {
  className?: string
  lines?: number
}

const LoadingCard = React.forwardRef<HTMLDivElement, LoadingCardProps>(
  ({ className, lines = 3 }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-3 p-4", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    )
  }
)

LoadingCard.displayName = "LoadingCard"

interface LoadingRowProps {
  className?: string
}

const LoadingRow = React.forwardRef<HTMLDivElement, LoadingRowProps>(
  ({ className }, ref) => {
    return (
      <div ref={ref} className={cn("flex items-center justify-between p-2", className)}>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    )
  }
)

LoadingRow.displayName = "LoadingRow"

export { LoadingText, LoadingCard, LoadingRow }