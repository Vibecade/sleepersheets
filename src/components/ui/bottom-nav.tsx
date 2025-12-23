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

function triggerHaptic() {
  if ('vibrate' in navigator) {
    navigator.vibrate(10)
  }
}

export function BottomNav({ items = defaultItems, activeItem, className }: BottomNavProps) {
  const handleClick = (e: React.MouseEvent, item: BottomNavItem) => {
    triggerHaptic()
    item.onClick?.(e)
  }

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-card/98 backdrop-blur-xl border-t border-border/50",
        "pb-safe",
        "md:hidden",
        "shadow-[0_-4px_20px_rgba(0,0,0,0.3)]",
        className
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-14 px-1">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeItem === item.href

          return (
            <button
              key={item.href}
              onClick={(e) => handleClick(e, item)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center flex-1",
                "py-2 px-1 mx-0.5 rounded-xl",
                "transition-all duration-150 ease-out",
                "touch-manipulation min-h-[48px] min-w-[48px]",
                "active:scale-90 active:opacity-70",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-150",
                    isActive && "scale-110"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {item.badge && item.badge > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1.5 -right-2 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center animate-pulse"
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </Badge>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] mt-1 font-medium transition-all duration-150",
                  isActive ? "font-semibold" : "font-normal"
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
