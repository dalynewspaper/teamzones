import { useState, useCallback } from 'react'

interface ToastOptions {
  title: string
  description: string
  duration?: number
  variant?: 'default' | 'destructive'
}

interface Toast extends ToastOptions {
  id: string
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (options: ToastOptions) => void
  dismiss: (id: string) => void
}

export function useToast(): Pick<ToastContextValue, 'toast'> {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = {
      id,
      ...options
    }

    setToasts((prev) => [...prev, newToast])

    if (options.duration !== Infinity) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, options.duration || 3000)
    }
  }, [])

  return { toast }
} 