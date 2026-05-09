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
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0_80px,hsl(var(--border)/0.4)_80px_81px)]" />
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
