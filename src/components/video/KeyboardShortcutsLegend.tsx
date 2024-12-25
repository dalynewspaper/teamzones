import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const shortcuts = [
  { key: 'R', description: 'Start recording' },
  { key: 'Space', description: 'Pause/Resume recording' },
  { key: 'Esc', description: 'Stop recording' },
  { key: 'S', description: 'Toggle screen sharing' },
  { key: 'B', description: 'Toggle background blur' },
  { key: 'L', description: 'Change layout' }
]

export function KeyboardShortcutsLegend() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="text-white hover:text-white hover:bg-white/20"
        >
          <Info className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Keyboard Shortcuts</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <div className="space-y-4">
            {shortcuts.map(({ key, description }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{description}</span>
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 