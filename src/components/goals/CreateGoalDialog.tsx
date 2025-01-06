'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { AnnualGoalForm } from './AnnualGoalForm'
import { QuarterlyGoalForm } from './QuarterlyGoalForm'
import { MonthlyGoalForm } from './MonthlyGoalForm'
import { WeeklyGoalForm } from './WeeklyGoalForm'
import { AllGoalTimeframes, Goal } from '@/types/goals'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CreateGoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGoalCreated: (goalId: string) => void
  timeframe: AllGoalTimeframes
  selectedWeek?: Date
}

export function CreateGoalDialog({
  open,
  onOpenChange,
  onGoalCreated,
  timeframe,
  selectedWeek
}: CreateGoalDialogProps) {
  const titles: Record<AllGoalTimeframes, string> = {
    annual: 'Create Annual Goal',
    quarterly: 'Create Quarterly Goal',
    monthly: 'Create Monthly Goal',
    weekly: 'Create Weekly Goal'
  }

  const descriptions: Record<AllGoalTimeframes, string> = {
    annual: 'Set a high-level strategic goal for the year',
    quarterly: 'Define key objectives for the quarter that align with annual goals',
    monthly: 'Plan specific deliverables and milestones for the month',
    weekly: 'Break down tasks into actionable weekly sprints'
  }

  const handleSuccess = () => {
    onOpenChange(false)
  }

  const renderForm = () => {
    switch (timeframe) {
      case 'annual':
        return (
          <AnnualGoalForm 
            mode="create"
            onSuccess={handleSuccess}
          />
        )
      case 'quarterly':
        return (
          <QuarterlyGoalForm 
            mode="create"
            onSuccess={handleSuccess}
          />
        )
      case 'monthly':
        return (
          <MonthlyGoalForm 
            mode="create"
            onSuccess={handleSuccess}
          />
        )
      case 'weekly':
        return (
          <WeeklyGoalForm 
            mode="create"
            initialData={selectedWeek ? {
              id: '',
              title: '',
              description: '',
              type: 'team',
              priority: 'medium',
              status: 'not_started',
              timeframe: 'weekly',
              progress: 0,
              startDate: selectedWeek,
              endDate: new Date(selectedWeek.getTime() + 6 * 24 * 60 * 60 * 1000),
              organizationId: '',
              ownerId: '',
              createdBy: '',
              metrics: [],
              keyResults: [],
              milestones: [],
              assignees: [],
              tags: [],
              teamRoles: [],
              createdAt: new Date(),
              updatedAt: new Date()
            } : undefined}
            onComplete={handleSuccess}
          />
        )
      default:
        return null
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full min-w-[50vw] sm:w-[60vw] lg:w-[55vw] xl:w-[50vw]">
        <SheetHeader className="space-y-1">
          <SheetTitle>{titles[timeframe]}</SheetTitle>
          <p className="text-muted-foreground">{descriptions[timeframe]}</p>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-6 pr-4">
          {renderForm()}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
} 