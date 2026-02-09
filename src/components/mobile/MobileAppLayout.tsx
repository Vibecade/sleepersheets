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

  if (!isMobile) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-background">
      <main
        className={cn(
          "flex-1 overflow-x-hidden",
          showBottomNav && "pb-[72px]",
          className
        )}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </main>

      {showBottomNav && bottomNavItems && bottomNavItems.length > 0 && (
        <BottomNav items={bottomNavItems} activeItem={activeItem} />
      )}
    </div>
  )
}
