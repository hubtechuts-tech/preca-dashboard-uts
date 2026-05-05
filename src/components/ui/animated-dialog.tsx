"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

// Context to store the origin point of the dialog trigger
interface OriginPoint {
  x: number
  y: number
  width: number
  height: number
}

const OriginContext = React.createContext<{
  origin: OriginPoint | null
  setOrigin: (origin: OriginPoint | null) => void
}>({
  origin: null,
  setOrigin: () => {},
})

// Root component that provides origin context
const AnimatedDialog = ({ children, ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) => {
  const [origin, setOrigin] = React.useState<OriginPoint | null>(null)

  return (
    <OriginContext.Provider value={{ origin, setOrigin }}>
      <DialogPrimitive.Root {...props}>{children}</DialogPrimitive.Root>
    </OriginContext.Provider>
  )
}

const AnimatedDialogTrigger = DialogPrimitive.Trigger

const AnimatedDialogPortal = DialogPrimitive.Portal

const AnimatedDialogClose = DialogPrimitive.Close

const AnimatedDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50", className)}
    asChild
  >
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="bg-black/80 w-full h-full"
    />
  </DialogPrimitive.Overlay>
))
AnimatedDialogOverlay.displayName = "AnimatedDialogOverlay"

const AnimatedDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const { origin } = React.useContext(OriginContext)

  // Calculate initial position and scale based on button origin
  const getInitialState = () => {
    if (!origin) {
      // Fallback animation when no origin is set
      return {
        scale: 0.85,
        opacity: 0,
        y: 20,
        x: 0,
      }
    }

    // Calculate the center of the screen
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2

    // Calculate offset from origin to center
    const deltaX = origin.x - centerX
    const deltaY = origin.y - centerY

    // Start with button size scale (small)
    const initialScale = Math.min(origin.width / 500, origin.height / 300, 0.05)

    return {
      scale: initialScale,
      opacity: 0,
      x: deltaX,
      y: deltaY,
    }
  }

  return (
    <AnimatedDialogPortal>
      <AnimatedDialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg sm:rounded-lg",
          className
        )}
        asChild
      >
        <motion.div
          initial={getInitialState()}
          animate={{
            scale: 1,
            opacity: 1,
            x: 0,
            y: 0,
          }}
          exit={{
            scale: 0.95,
            opacity: 0,
            y: 10,
          }}
          transition={{
            type: "spring",
            damping: 28,
            stiffness: 380,
            mass: 0.9,
          }}
        >
          {children}
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </motion.div>
      </DialogPrimitive.Content>
    </AnimatedDialogPortal>
  )
})
AnimatedDialogContent.displayName = "AnimatedDialogContent"

const AnimatedDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AnimatedDialogHeader.displayName = "AnimatedDialogHeader"

const AnimatedDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AnimatedDialogFooter.displayName = "AnimatedDialogFooter"

const AnimatedDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
AnimatedDialogTitle.displayName = "AnimatedDialogTitle"

const AnimatedDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AnimatedDialogDescription.displayName = "AnimatedDialogDescription"

// Hook to capture button click position for expand animation
export function useDialogOrigin() {
  const { setOrigin } = React.useContext(OriginContext)

  const captureOrigin = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const element = event.currentTarget
      const rect = element.getBoundingClientRect()

      setOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height,
      })
    },
    [setOrigin]
  )

  return captureOrigin
}

export {
  AnimatedDialog,
  AnimatedDialogPortal,
  AnimatedDialogOverlay,
  AnimatedDialogClose,
  AnimatedDialogTrigger,
  AnimatedDialogContent,
  AnimatedDialogHeader,
  AnimatedDialogFooter,
  AnimatedDialogTitle,
  AnimatedDialogDescription,
}
