'use client'

import { QuarterlyGoalForm } from '@/components/goals/QuarterlyGoalForm'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ChevronLeft } from 'lucide-react'

interface QuarterlyGoalSheetProps {
  isOpen: boolean
  onClose: () => void
  parentGoalId?: string
}

export function QuarterlyGoalSheet({ isOpen, onClose, parentGoalId }: QuarterlyGoalSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto">
        <SheetHeader className="space-y-4 pb-4 border-b">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={onClose} className="mr-2">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <SheetTitle>Create Quarterly Goal</SheetTitle>
          </div>
        </SheetHeader>
        <div className="py-6">
          <QuarterlyGoalForm mode="create" onSuccess={onClose} parentGoalId={parentGoalId} />
        </div>
      </SheetContent>
    </Sheet>
  )
} 