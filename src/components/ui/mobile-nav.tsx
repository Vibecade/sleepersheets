
import * as React from "react"
import { Sheet, SheetContent, SheetTrigger } from "./sheet"
import { Button } from "./button"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  children: React.ReactNode
  trigger?: React.ReactNode
  className?: string
}

export function MobileNav({ children, trigger, className }: MobileNavProps) {
  const [open, setOpen] = React.useState(false)

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "h-9 w-9 p-0 md:hidden",
        "touch-manipulation", // Better touch response
        className
      )}
    >
      <Menu className="h-4 w-4" />
      <span className="sr-only">Toggle menu</span>
    </Button>
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <nav className="flex flex-col space-y-4 mt-4">
          {children}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
