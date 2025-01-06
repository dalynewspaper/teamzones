import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Keyboard } from 'lucide-react'

const shortcuts = [
  { key: 'Alt + R', action: 'Start/Stop Recording' },
  { key: 'Alt + P', action: 'Pause/Resume Recording' },
  { key: 'Alt + S', action: 'Open Settings' }
]

export function KeyboardShortcutsLegend() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Keyboard className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {shortcuts.map(({ key, action }) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-sm text-gray-500">{action}</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
} 