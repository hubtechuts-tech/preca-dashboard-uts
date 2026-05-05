import { useState } from 'react'

/**
 * Hook to add expand animation to buttons that open dialogs
 * Returns a prop object to spread on the button element
 */
export function useDialogAnimation() {
  const [isAnimating, setIsAnimating] = useState(false)

  const triggerProps = {
    onClick: (e: React.MouseEvent) => {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 300)
    },
    className: isAnimating
      ? 'scale-105 transition-transform duration-150 ease-out'
      : 'transition-transform duration-150 ease-in',
  }

  return triggerProps
}
