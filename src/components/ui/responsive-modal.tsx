import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "./dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "./drawer"
import { cn } from "@/lib/utils"

interface ResponsiveModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const ResponsiveModal = ({ open, onOpenChange, children }: ResponsiveModalProps) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  )
}

interface ResponsiveModalTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  className?: string
}

const ResponsiveModalTrigger = ({ children, asChild, className }: ResponsiveModalTriggerProps) => {
  const isMobile = useIsMobile()
  const Trigger = isMobile ? DrawerTrigger : DialogTrigger

  return (
    <Trigger asChild={asChild} className={className}>
      {children}
    </Trigger>
  )
}

interface ResponsiveModalContentProps {
  children: React.ReactNode
  className?: string
}

const ResponsiveModalContent = ({ children, className }: ResponsiveModalContentProps) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DrawerContent className={cn("max-h-[90dvh]", className)}>
        <div className="overflow-y-auto px-4 pb-safe" style={{ WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      </DrawerContent>
    )
  }

  return (
    <DialogContent className={cn("max-h-[85vh] overflow-y-auto", className)}>
      {children}
    </DialogContent>
  )
}

interface ResponsiveModalHeaderProps {
  children: React.ReactNode
  className?: string
}

const ResponsiveModalHeader = ({ children, className }: ResponsiveModalHeaderProps) => {
  const isMobile = useIsMobile()
  const Header = isMobile ? DrawerHeader : DialogHeader

  return <Header className={className}>{children}</Header>
}

interface ResponsiveModalTitleProps {
  children: React.ReactNode
  className?: string
}

const ResponsiveModalTitle = ({ children, className }: ResponsiveModalTitleProps) => {
  const isMobile = useIsMobile()
  const Title = isMobile ? DrawerTitle : DialogTitle

  return <Title className={className}>{children}</Title>
}

interface ResponsiveModalDescriptionProps {
  children: React.ReactNode
  className?: string
}

const ResponsiveModalDescription = ({ children, className }: ResponsiveModalDescriptionProps) => {
  const isMobile = useIsMobile()
  const Description = isMobile ? DrawerDescription : DialogDescription

  return <Description className={className}>{children}</Description>
}

interface ResponsiveModalFooterProps {
  children: React.ReactNode
  className?: string
}

const ResponsiveModalFooter = ({ children, className }: ResponsiveModalFooterProps) => {
  const isMobile = useIsMobile()
  const Footer = isMobile ? DrawerFooter : DialogFooter

  return (
    <Footer className={cn(isMobile && "pb-safe", className)}>
      {children}
    </Footer>
  )
}

const ResponsiveModalClose = ({ children, className }: { children?: React.ReactNode; className?: string }) => {
  const isMobile = useIsMobile()
  const Close = isMobile ? DrawerClose : DialogClose

  return <Close className={className}>{children}</Close>
}

export {
  ResponsiveModal,
  ResponsiveModalTrigger,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalClose,
}
