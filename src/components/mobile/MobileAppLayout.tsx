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
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(234,179,8,0.08),transparent_45%),radial-gradient(circle_at_bottom,rgba(220,38,38,0.06),transparent_45%)]" />
      <main
        className={cn(
          "flex-1 overflow-x-hidden relative",
          showBottomNav && "pb-[84px]",
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
