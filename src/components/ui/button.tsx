'use client'
import React from 'react'
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { VariantProps, cva } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-700'
      },
      size: {
        default: 'px-4 py-2',
        sm: 'px-3 py-1.5 text-sm',
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default'
    }
  }
)

interface ButtonProps 
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'default' | 'sm'
}

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