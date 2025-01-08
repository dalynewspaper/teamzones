'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { CalendarIcon, Plus, Target } from 'lucide-react'
import { Goal, GoalPriority, GoalStatus, GoalType, AllGoalTimeframes, GoalTimeframe } from '@/types/goals'
import { createGoal, getGoalsByTimeframe } from '@/services/goalService'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { useOrganization } from '@/hooks/useOrganization'
import { Badge } from '@/components/ui/badge'

interface TaskSheetProps {
  isOpen: boolean
  onClose: () => void
  initialData?: Goal
}

export function TaskSheet({ isOpen, onClose, initialData }: TaskSheetProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [priority, setPriority] = useState<GoalPriority>(initialData?.priority || 'medium')
  const [status, setStatus] = useState<GoalStatus>(initialData?.status || 'not_started')
  const [startDate, setStartDate] = useState<Date>(
    initialData?.startDate ? new Date(initialData.startDate) : new Date()
  )
  const [endDate, setEndDate] = useState<Date>(
    initialData?.endDate ? new Date(initialData.endDate) : new Date()
  )
  const [hypothesis, setHypothesis] = useState(initialData?.hypothesis || '')
  const [expectedOutcome, setExpectedOutcome] = useState(initialData?.expectedOutcome || '')
  const [metrics, setMetrics] = useState(initialData?.metrics || [])
  const [isLoading, setIsLoading] = useState(false)
  const [monthlyGoals, setMonthlyGoals] = useState<Goal[]>([])
  const [selectedMonthlyGoal, setSelectedMonthlyGoal] = useState<Goal | null>(null)
  const [isLoadingMonthlyGoals, setIsLoadingMonthlyGoals] = useState(true)

  const { toast } = useToast()
  const router = useRouter()
  const { organization } = useOrganization()

  // Load monthly goals
  useEffect(() => {
    const loadMonthlyGoals = async () => {
      if (!organization?.id) return

      try {
        setIsLoadingMonthlyGoals(true)
        const goals = await getGoalsByTimeframe('monthly', organization.id)
        setMonthlyGoals(goals)
        
        // If initialData has a parentGoalId, select that goal
        if (initialData?.parentGoalId) {
          const parentGoal = goals.find(g => g.id === initialData.parentGoalId)
          if (parentGoal) {
            setSelectedMonthlyGoal(parentGoal)
          }
        }
      } catch (error) {
        console.error('Error loading monthly goals:', error)
        toast({
          title: 'Error',
          description: 'Failed to load monthly goals. Please try again.',
          variant: 'destructive'
        })
      } finally {
        setIsLoadingMonthlyGoals(false)
      }
    }

    loadMonthlyGoals()
  }, [organization?.id, initialData?.parentGoalId])

  const handleSubmit = async () => {
    try {
      setIsLoading(true)

      const goalData = {
        title,
        description,
        priority,
        status,
        startDate,
        endDate,
        hypothesis,
        expectedOutcome,
        metrics,
        type: 'team' as GoalType,
        timeframe: 'weekly' as AllGoalTimeframes,
        progress: 0,
        assignees: [],
        organizationId: organization?.id || '',
        teamId: '', // TODO: Get from context
        keyResults: [],
        milestones: [],
        ownerId: '', // TODO: Get from context
        tags: [],
        createdBy: '', // TODO: Get from context
        parentGoalId: selectedMonthlyGoal?.id // Add parent goal reference
      }

      if (initialData?.id) {
        // TODO: Implement update
      } else {
        const goalId = await createGoal(goalData)
        router.push(`/dashboard/tasks/${goalId}`)
      }

      toast({
        title: 'Success',
        description: initialData?.id ? 'Task updated successfully' : 'Task created successfully'
      })

      onClose()
    } catch (error) {
      console.error('Error saving task:', error)
      toast({
        title: 'Error',
        description: 'Failed to save task. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addMetric = () => {
    setMetrics([
      ...metrics,
      {
        id: Math.random().toString(36).substring(7),
        name: '',
        target: 0,
        unit: '',
        current: 0,
        frequency: 'monthly' as GoalTimeframe
      }
    ])
  }

  const updateMetric = (index: number, field: string, value: string | number) => {
    const updatedMetrics = [...metrics]
    updatedMetrics[index] = {
      ...updatedMetrics[index],
      [field]: value
    }
    setMetrics(updatedMetrics)
  }

  const removeMetric = (index: number) => {
    setMetrics(metrics.filter((_, i) => i !== index))
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[600px]">
        <SheetHeader>
          <SheetTitle>{initialData?.id ? 'Edit Task' : 'Create Task'}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Monthly Goal Selection */}
          <div className="space-y-2">
            <Label>Monthly Goal</Label>
            <Select
              value={selectedMonthlyGoal?.id}
              onValueChange={(value) => {
                const goal = monthlyGoals.find(g => g.id === value)
                setSelectedMonthlyGoal(goal || null)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select monthly goal this contributes to" />
              </SelectTrigger>
              <SelectContent>
                {monthlyGoals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMonthlyGoal && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-blue-50/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-blue-600 mt-1" />
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm text-blue-900">Monthly Goal Progress</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          {selectedMonthlyGoal.description}
                        </p>
                      </div>
                      {selectedMonthlyGoal.metrics && selectedMonthlyGoal.metrics.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedMonthlyGoal.metrics.map((metric, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {metric.name}: {metric.target}{metric.unit}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: GoalPriority) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value: GoalStatus) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="at_risk">At Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hypothesis">Hypothesis</Label>
            <Textarea
              id="hypothesis"
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              placeholder="What do you want to test?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedOutcome">Expected Outcome</Label>
            <Textarea
              id="expectedOutcome"
              value={expectedOutcome}
              onChange={(e) => setExpectedOutcome(e.target.value)}
              placeholder="What results do you expect?"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Metrics</Label>
              <Button variant="outline" size="sm" onClick={addMetric}>
                <Plus className="h-4 w-4 mr-1" />
                Add Metric
              </Button>
            </div>

            <div className="space-y-4">
              {metrics.map((metric, index) => (
                <div key={metric.id} className="grid grid-cols-3 gap-2 items-end">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={metric.name}
                      onChange={(e) => updateMetric(index, 'name', e.target.value)}
                      placeholder="Metric name"
                    />
                  </div>
                  <div>
                    <Label>Target</Label>
                    <Input
                      type="number"
                      value={metric.target}
                      onChange={(e) => updateMetric(index, 'target', parseFloat(e.target.value))}
                      placeholder="Target value"
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <Input
                      value={metric.unit}
                      onChange={(e) => updateMetric(index, 'unit', e.target.value)}
                      placeholder="Unit (e.g. %)"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Saving...' : initialData?.id ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 