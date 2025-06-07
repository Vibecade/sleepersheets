
import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table"
import { ScrollArea, ScrollBar } from "./scroll-area"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

interface ResponsiveTableProps {
  children: React.ReactNode
  className?: string
  minWidth?: string
}

const ResponsiveTable = React.forwardRef<
  HTMLDivElement,
  ResponsiveTableProps
>(({ children, className, minWidth = "600px", ...props }, ref) => {
  const isMobile = useIsMobile()

  if (!isMobile) {
    return (
      <div ref={ref} className={className} {...props}>
        <Table>{children}</Table>
      </div>
    )
  }

  return (
    <div ref={ref} className={cn("w-full", className)} {...props}>
      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <div style={{ minWidth }}>
          <Table>{children}</Table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
})

ResponsiveTable.displayName = "ResponsiveTable"

export { ResponsiveTable, TableBody, TableCell, TableHead, TableHeader, TableRow }
