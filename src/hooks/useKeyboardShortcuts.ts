import { useEffect } from 'react'

interface ShortcutConfig {
  [key: string]: {
    action: () => void
    description: string
  }
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase()
      const shortcut = shortcuts[key]

      if (shortcut && !event.repeat) {
        event.preventDefault()
        shortcut.action()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
} 