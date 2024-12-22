import { useState, useCallback } from 'react'

interface Size {
  width: number
  height: number
}

interface ResizeOptions {
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  aspectRatio?: number
}

export function useResizable(
  initialSize: Size,
  onSizeChange: (size: Size) => void,
  options: ResizeOptions = {}
) {
  const [size, setSize] = useState(initialSize)
  const [isResizing, setIsResizing] = useState(false)

  const onResize = useCallback((newSize: Size) => {
    setSize(newSize)
    onSizeChange(newSize)
  }, [onSizeChange])

  const startResize = useCallback((
    e: React.MouseEvent,
    direction: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'
  ) => {
    e.stopPropagation() // Prevent dragging while resizing
    setIsResizing(true)

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = size.width
    const startHeight = size.height

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX
      const dy = e.clientY - startY

      let newWidth = startWidth
      let newHeight = startHeight

      switch (direction) {
        case 'se':
          newWidth = startWidth + dx
          newHeight = options.aspectRatio ? newWidth / options.aspectRatio : startHeight + dy
          break
        case 'sw':
          newWidth = startWidth - dx
          newHeight = options.aspectRatio ? newWidth / options.aspectRatio : startHeight + dy
          break
        case 'ne':
          newWidth = startWidth + dx
          newHeight = options.aspectRatio ? newWidth / options.aspectRatio : startHeight - dy
          break
        case 'nw':
          newWidth = startWidth - dx
          newHeight = options.aspectRatio ? newWidth / options.aspectRatio : startHeight - dy
          break
        case 'n':
          newHeight = startHeight - dy
          if (options.aspectRatio) newWidth = newHeight * options.aspectRatio
          break
        case 's':
          newHeight = startHeight + dy
          if (options.aspectRatio) newWidth = newHeight * options.aspectRatio
          break
        case 'e':
          newWidth = startWidth + dx
          if (options.aspectRatio) newHeight = newWidth / options.aspectRatio
          break
        case 'w':
          newWidth = startWidth - dx
          if (options.aspectRatio) newHeight = newWidth / options.aspectRatio
          break
      }

      // Apply constraints
      newWidth = Math.max(options.minWidth || 0, Math.min(options.maxWidth || Infinity, newWidth))
      newHeight = Math.max(options.minHeight || 0, Math.min(options.maxHeight || Infinity, newHeight))

      const newSize = { width: newWidth, height: newHeight }
      onResize(newSize)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [size, options, onResize])

  return {
    size,
    isResizing,
    startResize,
    onResize
  }
} 