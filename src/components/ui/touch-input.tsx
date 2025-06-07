
import * as React from "react"
import { Input } from "./input"
import { Button } from "./button"
import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

interface TouchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onIncrement?: () => void
  onDecrement?: () => void
  showControls?: boolean
  step?: number
}

const TouchInput = React.forwardRef<HTMLInputElement, TouchInputProps>(
  ({ className, onIncrement, onDecrement, showControls = false, step = 1, type = "number", ...props }, ref) => {
    const isMobile = useIsMobile()
    
    if (!isMobile || !showControls) {
      return (
        <Input
          ref={ref}
          type={type}
          className={cn(
            isMobile && "min-h-[44px] text-base", // Larger touch targets on mobile
            className
          )}
          {...props}
        />
      )
    }

    return (
      <div className="flex items-center space-x-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 w-10 p-0 touch-manipulation"
          onClick={onDecrement}
          disabled={props.disabled}
        >
          <Minus className="h-4 w-4" />
          <span className="sr-only">Decrease</span>
        </Button>
        <Input
          ref={ref}
          type={type}
          className={cn(
            "min-h-[44px] text-base text-center flex-1",
            className
          )}
          {...props}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 w-10 p-0 touch-manipulation"
          onClick={onIncrement}
          disabled={props.disabled}
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Increase</span>
        </Button>
      </div>
    )
  }
)

TouchInput.displayName = "TouchInput"

export { TouchInput }
