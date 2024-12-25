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

interface RecordingShortcutsConfig {
  isRecording: boolean
  startRecording: () => void
  stopRecording: () => void
  togglePause: () => void
  toggleScreenShare: () => void
  toggleBackgroundBlur: () => void
  cycleLayout: () => void
}

export const useRecordingShortcuts = ({
  isRecording,
  startRecording,
  stopRecording,
  togglePause,
  toggleScreenShare,
  toggleBackgroundBlur,
  cycleLayout
}: RecordingShortcutsConfig) => {
  useKeyboardShortcuts({
    'r': {
      action: () => !isRecording && startRecording(),
      description: 'Start recording'
    },
    'space': {
      action: () => isRecording && togglePause(),
      description: 'Pause/Resume recording'
    },
    'esc': {
      action: () => isRecording && stopRecording(),
      description: 'Stop recording'
    },
    's': {
      action: () => !isRecording && toggleScreenShare(),
      description: 'Toggle screen sharing'
    },
    'b': {
      action: () => toggleBackgroundBlur(),
      description: 'Toggle background blur'
    },
    'l': {
      action: () => cycleLayout(),
      description: 'Change layout'
    }
  })
} 