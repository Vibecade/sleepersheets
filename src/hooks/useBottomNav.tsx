import { useMemo } from "react"
import { useLocation } from "react-router-dom"
import { Trophy, Settings, Calendar, Sparkles, Menu } from "lucide-react"
import { BottomNavItem } from "@/components/ui/bottom-nav"

interface UseBottomNavOptions {
  leagueId?: string
  onPageChange?: (page: string) => void
  badges?: {
    matchups?: number
    manager?: number
    pulse?: number
    gamify?: number
    more?: number
  }
}

export function useBottomNav({ leagueId, onPageChange, badges = {} }: UseBottomNavOptions = {}) {
  const location = useLocation()

  const bottomNavItems: BottomNavItem[] = useMemo(() => {
    if (!leagueId) return []

    return [
      {
        label: "Pulse",
        href: "#pulse",
        icon: Sparkles,
        badge: badges.pulse ?? badges.gamify,
        onClick: (e) => {
          e?.preventDefault()
          onPageChange?.("pulse")
        },
      },
      {
        label: "Overview",
        href: "#overview",
        icon: Trophy,
        onClick: (e) => {
          e?.preventDefault()
          onPageChange?.("overview")
        },
      },
      {
        label: "Matchups",
        href: "#matchups",
        icon: Calendar,
        badge: badges.matchups,
        onClick: (e) => {
          e?.preventDefault()
          onPageChange?.("matchups")
        },
      },
      {
        label: "Manager",
        href: "#manager",
        icon: Settings,
        badge: badges.manager,
        onClick: (e) => {
          e?.preventDefault()
          onPageChange?.("manager")
        },
      },
      {
        label: "More",
        href: "#more",
        icon: Menu,
        badge: badges.more,
        onClick: (e) => {
          e?.preventDefault()
          onPageChange?.("more")
        },
      },
    ]
  }, [leagueId, onPageChange, badges])

  return {
    bottomNavItems,
    currentPath: location.pathname,
  }
}
