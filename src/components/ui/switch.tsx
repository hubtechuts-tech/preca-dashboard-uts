'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked = false, onCheckedChange, id, disabled, className }: SwitchProps) {
  const [isOn, setIsOn] = React.useState(checked);

  // Sync internal state with prop
  React.useEffect(() => {
    setIsOn(checked);
  }, [checked]);

  const toggle = () => {
    if (disabled) return;
    const newState = !isOn;
    setIsOn(newState);
    onCheckedChange?.(newState);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      id={id}
      disabled={disabled}
      onClick={toggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        isOn ? "bg-primary" : "bg-input",
        className
      )}
    >
      <motion.span
        layout
        transition={{
          type: "spring",
          stiffness: 700,
          damping: 30
        }}
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0"
        )}
        animate={{
          x: isOn ? 20 : 0
        }}
      />
    </button>
  );
}
