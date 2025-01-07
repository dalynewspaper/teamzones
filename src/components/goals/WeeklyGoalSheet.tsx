'use client'

import { WeeklyGoalForm } from '@/components/goals/WeeklyGoalForm'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ChevronLeft } from 'lucide-react'

interface WeeklyGoalSheetProps {
  isOpen: boolean
  onClose: () => void
}

export function WeeklyGoalSheet({ isOpen, onClose }: WeeklyGoalSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto">
        <SheetHeader className="space-y-4 pb-4 border-b">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={onClose} className="mr-2">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <SheetTitle>Create Task</SheetTitle>
          </div>
        </SheetHeader>
        <div className="py-6">
          <WeeklyGoalForm mode="create" onComplete={onClose} />
        </div>
      </SheetContent>
    </Sheet>
  )
} 