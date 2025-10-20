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
  const [isScrollingDown, setIsScrollingDown] = React.useState(false)
  const lastScrollY = React.useRef(0)

  // Auto-hide bottom nav on scroll down for more content space
  React.useEffect(() => {
    if (!isMobile) return

    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsScrollingDown(true)
      } else {
        setIsScrollingDown(false)
      }
      
      lastScrollY.current = currentScrollY
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isMobile])

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

      {/* Bottom navigation */}
      {showBottomNav && bottomNavItems && (
        <div
          className={cn(
            "transition-transform duration-300",
            isScrollingDown && "translate-y-full"
          )}
        >
          <BottomNav items={bottomNavItems} activeItem={activeItem} />
        </div>
      )}
    </div>
  )
}
