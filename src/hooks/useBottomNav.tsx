import { useMemo } from "react"
import { useLocation } from "react-router-dom"
import { Settings, Calendar, BarChart3, Menu } from "lucide-react"
import { BottomNavItem } from "@/components/ui/bottom-nav"

interface UseBottomNavOptions {
  leagueId?: string
  onPageChange?: (page: string) => void
}

export function useBottomNav({ leagueId, onPageChange }: UseBottomNavOptions = {}) {
  const location = useLocation()

  const bottomNavItems: BottomNavItem[] = useMemo(() => {
    if (!leagueId) return []

    return [
      {
        label: "Matchups",
        href: "#matchups",
        icon: Calendar,
        onClick: (e) => {
          e?.preventDefault()
          onPageChange?.("matchups")
        },
      },
      {
        label: "Manager",
        href: "#manager",
        icon: Settings,
        onClick: (e) => {
          e?.preventDefault()
          onPageChange?.("manager")
        },
      },
      {
        label: "Stats",
        href: "#stats",
        icon: BarChart3,
        onClick: (e) => {
          e?.preventDefault()
          onPageChange?.("stats")
        },
      },
      {
        label: "More",
        href: "#more",
        icon: Menu,
        onClick: (e) => {
          e?.preventDefault()
          onPageChange?.("more")
        },
      },
    ]
  }, [leagueId, onPageChange])

  return {
    bottomNavItems,
    currentPath: location.pathname,
  }
}
