'use client'
import React from 'react'
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils'
import { VariantProps, cva } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200'
      }
    },
    defaultVariants: {
      variant: 'primary'
    }
  }
)

interface ButtonProps 
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, className }))}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button' 