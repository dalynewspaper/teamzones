import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AnnualGoalForm } from './AnnualGoalForm'
import { QuarterlyGoalForm } from './QuarterlyGoalForm'

interface NewGoalModalProps {
  isOpen: boolean
  onClose: () => void
  timeframe: 'annual' | 'quarterly'
  parentGoalId?: string
  onGoalCreated?: (goalId: string) => void
  quarter?: 1 | 2 | 3 | 4
  year?: number
}

export function NewGoalModal({
  isOpen,
  onClose,
  timeframe,
  parentGoalId,
  onGoalCreated,
  quarter,
  year
}: NewGoalModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New {timeframe === 'annual' ? 'Annual' : 'Quarterly'} Goal</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {timeframe === 'annual' ? (
            <AnnualGoalForm />
          ) : (
            <QuarterlyGoalForm
              quarter={quarter}
              year={year}
              parentGoalId={parentGoalId}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 