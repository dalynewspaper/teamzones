'use client'

import { AnnualGoalForm } from '@/components/goals/AnnualGoalForm'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ChevronLeft } from 'lucide-react'

interface AnnualGoalSheetProps {
  isOpen: boolean
  onClose: () => void
}

export function AnnualGoalSheet({ isOpen, onClose }: AnnualGoalSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto">
        <SheetHeader className="space-y-4 pb-4 border-b">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={onClose} className="mr-2">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <SheetTitle>Create Annual Goal</SheetTitle>
          </div>
        </SheetHeader>
        <div className="py-6">
          <AnnualGoalForm mode="create" onSuccess={onClose} />
        </div>
      </SheetContent>
    </Sheet>
  )
} 