"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface RadialProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  size?: "sm" | "md" | "lg"
  showValue?: boolean
  label?: string
}

const sizeClasses = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32"
}

const textSizeClasses = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl"
}

export function RadialProgress({
  value,
  size = "md",
  showValue = true,
  label,
  className,
  ...props
}: RadialProgressProps) {
  const radius = size === "sm" ? 28 : size === "md" ? 44 : 60
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className={cn("relative inline-flex items-center justify-center", sizeClasses[size], className)} {...props}>
      <svg className="w-full h-full -rotate-90">
        {/* Background circle */}
        <circle
          className="text-muted-foreground/20"
          fill="none"
          strokeWidth="4"
          stroke="currentColor"
          r={radius}
          cx="50%"
          cy="50%"
        />
        {/* Progress circle */}
        <circle
          className="text-primary transition-all duration-300 ease-in-out"
          fill="none"
          strokeWidth="4"
          stroke="currentColor"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx="50%"
          cy="50%"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-semibold", textSizeClasses[size])}>{value}%</span>
          {label && <span className="text-xs text-muted-foreground mt-1">{label}</span>}
        </div>
      )}
    </div>
  )
} 