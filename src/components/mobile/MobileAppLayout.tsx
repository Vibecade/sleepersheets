import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { BottomNav, BottomNavItem } from "@/components/ui/bottom-nav"
import { cn } from "@/lib/utils"

interface MobileAppLayoutProps {
  children: React.ReactNode
  bottomNavItems?: BottomNavItem[]
  activeItem?: string
  showBottomNav?: boolean
  className?: string
}

export function MobileAppLayout({
  children,
  bottomNavItems,
  activeItem,
  showBottomNav = true,
  className,
}: MobileAppLayoutProps) {
  const isMobile = useIsMobile()

  // If not mobile, just render children without mobile layout
  if (!isMobile) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content area with bottom padding for nav */}
      <main
        className={cn(
          "flex-1",
          showBottomNav && "pb-20", // Space for bottom nav
          className
        )}
      >
        {children}
      </main>

      {/* Bottom navigation - Always visible */}
      {showBottomNav && bottomNavItems && (
        <BottomNav items={bottomNavItems} activeItem={activeItem} />
      )}
    </div>
  )
}
