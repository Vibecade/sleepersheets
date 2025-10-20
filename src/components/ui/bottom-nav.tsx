import * as React from "react"
import { Trophy, Settings, Calendar, BarChart3, Menu, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "./badge"

export interface BottomNavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: number
  onClick?: (e?: React.MouseEvent) => void
}

interface BottomNavProps {
  items?: BottomNavItem[]
  activeItem?: string
  className?: string
}

const defaultItems: BottomNavItem[] = [
  { label: "Overview", href: "/overview", icon: Trophy },
  { label: "Manager", href: "/manager", icon: Settings },
  { label: "Matchups", href: "/matchups", icon: Calendar },
  { label: "Stats", href: "/stats", icon: BarChart3 },
  { label: "More", href: "/more", icon: Menu },
]

export function BottomNav({ items = defaultItems, activeItem, className }: BottomNavProps) {
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-card/95 backdrop-blur-lg border-t border-border",
        "pb-safe", // Safe area padding for iPhone home indicator
        "md:hidden", // Only show on mobile
        className
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeItem === item.href
          
          return (
            <button
              key={item.href}
              onClick={(e) => item.onClick?.(e)}
              className={cn(
                "flex flex-col items-center justify-center flex-1",
                "py-1 px-2 rounded-lg",
                "transition-all duration-200",
                "touch-manipulation min-h-[44px]", // iOS touch target size
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isActive && "scale-110"
                  )}
                />
                {item.badge && item.badge > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </Badge>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] mt-0.5 font-medium transition-all duration-200",
                  isActive && "scale-105"
                )}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
