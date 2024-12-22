import { useRef, useEffect, useState } from 'react'

interface Position {
  x: number
  y: number
}

interface Bounds {
  left: number
  top: number
  right: number
  bottom: number
}

export function useDraggable(containerRef: React.RefObject<HTMLElement>, initialPosition?: Position) {
  const [position, setPosition] = useState<Position>(initialPosition || { x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartPos = useRef<Position>({ x: 0, y: 0 })
  const elementPos = useRef<Position>({ x: 0, y: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return // Only left click
      setIsDragging(true)
      dragStartPos.current = { x: e.clientX, y: e.clientY }
      elementPos.current = { ...position }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const dx = e.clientX - dragStartPos.current.x
      const dy = e.clientY - dragStartPos.current.y

      const containerBounds = container.getBoundingClientRect()
      const elementBounds = (e.target as HTMLElement).getBoundingClientRect()

      const bounds: Bounds = {
        left: 0,
        top: 0,
        right: containerBounds.width - elementBounds.width,
        bottom: containerBounds.height - elementBounds.height
      }

      const newX = Math.max(bounds.left, Math.min(bounds.right, elementPos.current.x + dx))
      const newY = Math.max(bounds.top, Math.min(bounds.bottom, elementPos.current.y + dy))

      setPosition({ x: newX, y: newY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    container.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      container.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [containerRef, isDragging, position])

  return { position, isDragging }
} 