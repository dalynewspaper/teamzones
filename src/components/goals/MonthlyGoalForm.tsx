'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { CalendarIcon, InfoIcon, XCircle, Sparkles, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Goal, GoalMetric, GoalType, GoalPriority, GoalTimeframe, GoalStatus, GoalMilestone, MilestoneSuggestion, MetricSuggestion } from '@/types/goals'
import { createGoal, updateGoal, deleteGoal, getGoalsByTimeframe } from '@/services/goalService'
import { enhanceGoal } from '@/services/openaiService'
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns'

interface MonthlyGoalFormProps {
  initialData?: Goal
  mode?: 'create' | 'edit'
  parentGoalId?: string
  onSuccess?: () => void
}

export function MonthlyGoalForm({ initialData, mode = 'create', parentGoalId, onSuccess }: MonthlyGoalFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [quarterlyGoals, setQuarterlyGoals] = useState<Goal[]>([])
  const [selectedQuarterlyGoal, setSelectedQuarterlyGoal] = useState<Goal | null>(null)
  const [isLoadingQuarterlyGoals, setIsLoadingQuarterlyGoals] = useState(true)
  
  // Default to current month if creating new
  const defaultStartDate = startOfMonth(new Date()).toISOString().split('T')[0]
  const defaultEndDate = endOfMonth(new Date()).toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: initialData?.type || 'team' as GoalType,
    priority: initialData?.priority || 'high' as GoalPriority,
    startDate: initialData?.startDate?.toISOString().split('T')[0] || defaultStartDate,
    endDate: initialData?.endDate?.toISOString().split('T')[0] || defaultEndDate,
  })

  const [metrics, setMetrics] = useState<Partial<GoalMetric>[]>(initialData?.metrics || [])
  const [milestones, setMilestones] = useState<Partial<GoalMilestone>[]>(
    initialData?.milestones || [
      {
        title: '',
        description: '',
        dueDate: new Date(defaultEndDate),
        status: 'not_started' as GoalStatus
      }
    ]
  )

  // Load quarterly goals
  useEffect(() => {
    const loadQuarterlyGoals = async () => {
      if (!user?.organizationId) return

      try {
        setIsLoadingQuarterlyGoals(true)
        const goals = await getGoalsByTimeframe('quarterly', user.organizationId)
        setQuarterlyGoals(goals)
        
        // If parentGoalId is provided, select that goal
        if (parentGoalId) {
          const parentGoal = goals.find(g => g.id === parentGoalId)
          if (parentGoal) {
            setSelectedQuarterlyGoal(parentGoal)
          }
        }
      } catch (error) {
        console.error('Error loading quarterly goals:', error)
        toast({
          title: 'Error',
          description: 'Failed to load quarterly goals. Please try again.',
          variant: 'destructive'
        })
      } finally {
        setIsLoadingQuarterlyGoals(false)
      }
    }

    loadQuarterlyGoals()
  }, [user?.organizationId, parentGoalId])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleMetricChange = (index: number, field: keyof GoalMetric, value: any) => {
    const newMetrics = [...metrics]
    if (field === 'target' || field === 'current') {
      value = value === '' ? 0 : Number(value)
    }
    newMetrics[index] = { ...newMetrics[index], [field]: value }
    setMetrics(newMetrics)
  }

  const handleMilestoneChange = (index: number, field: keyof GoalMilestone, value: any) => {
    const newMilestones = [...milestones]
    newMilestones[index] = { ...newMilestones[index], [field]: value }
    setMilestones(newMilestones)
  }

  const handleDeleteMetric = (index: number) => {
    setMetrics(metrics.filter((_, i) => i !== index))
  }

  const handleDeleteMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index))
  }

  const handleAddMetric = () => {
    setMetrics(prev => [...prev, {
      name: '',
      target: 0,
      current: 0,
      unit: '',
      frequency: 'weekly'
    }])
  }

  const handleAddMilestone = () => {
    setMilestones(prev => [...prev, {
      title: '',
      description: '',
      dueDate: new Date(formData.endDate),
      status: 'not_started' as GoalStatus
    }])
  }

  const handleSubmit = async () => {
    if (!user?.organizationId) return

    try {
      setIsSubmitting(true)

      const goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        timeframe: 'monthly',
        priority: formData.priority,
        status: initialData?.status || 'not_started',
        progress: initialData?.progress || 0,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        parentGoalId: selectedQuarterlyGoal?.id || initialData?.parentGoalId,
        metrics: metrics.map((m, i) => ({ 
          ...m, 
          id: m.id || `new-metric-${i}` 
        })) as GoalMetric[],
        keyResults: [],
        milestones: milestones.map((m, i) => ({
          ...m,
          id: m.id || `new-milestone-${i}`
        })) as GoalMilestone[],
        assignees: initialData?.assignees || [],
        organizationId: user.organizationId,
        ownerId: initialData?.ownerId || user.uid,
        createdBy: initialData?.createdBy || user.uid,
        tags: initialData?.tags || []
      }

      if (mode === 'edit' && initialData) {
        await updateGoal(initialData.id, goalData)
        toast({
          title: 'Goal updated',
          description: 'Your monthly goal has been updated successfully.'
        })
      } else {
        await createGoal(goalData)
        toast({
          title: 'Goal created',
          description: 'Your new monthly goal has been created successfully.'
        })
      }
      
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/dashboard/goals')
      }
    } catch (error) {
      console.error('Error saving goal:', error)
      toast({
        title: 'Error',
        description: `Failed to ${mode === 'edit' ? 'update' : 'create'} goal. Please try again.`,
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEnhanceWithAI = async () => {
    if (!selectedQuarterlyGoal) {
      toast({
        title: "Missing information",
        description: "Please select a quarterly goal first to get AI suggestions.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsEnhancing(true)

      // Determine which month of the quarter this is
      const startDate = new Date(formData.startDate)
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December']
      const monthName = monthNames[startDate.getMonth()]
      
      // Calculate which month of the quarter this is (1st, 2nd, or 3rd)
      const quarterStartMonth = Math.floor(startDate.getMonth() / 3) * 3
      const monthOfQuarter = startDate.getMonth() - quarterStartMonth + 1
      const monthPosition = monthOfQuarter === 1 ? 'initial' : monthOfQuarter === 2 ? 'intermediate' : 'final'

      const suggestions = await enhanceGoal(
        formData.title || `${monthName}'s Operational Plan (${monthOfQuarter}/3)`,
        formData.description || `This ${monthPosition} month's operational plan and deliverables to progress toward our quarterly goal: ${selectedQuarterlyGoal.description}`,
        format(startDate, 'MMMM yyyy'),
        {
          parentGoal: {
            title: selectedQuarterlyGoal.title,
            description: selectedQuarterlyGoal.description,
            timeframe: 'quarterly'
          },
          generateMilestones: true,
          generateMetrics: true,
          timeframe: 'monthly',
          monthOfQuarter: monthOfQuarter,
          monthPosition: monthPosition
        }
      )

      // Update form data
      setFormData(prev => ({
        ...prev,
        title: suggestions.enhancedTitle,
        description: suggestions.enhancedDescription
      }))

      // Always update milestones with AI suggestions
      if (suggestions.milestones && suggestions.milestones.length > 0) {
        const enhancedMilestones = suggestions.milestones.map(m => ({
          title: m.title,
          description: m.description,
          dueDate: m.dueDate ? new Date(m.dueDate) : new Date(formData.endDate),
          status: 'not_started' as GoalStatus
        }))
        setMilestones(enhancedMilestones)
      } else {
        // Ensure at least one empty milestone if none provided
        setMilestones([{
          title: '',
          description: '',
          dueDate: new Date(formData.endDate),
          status: 'not_started' as GoalStatus
        }])
      }

      // Always update metrics with AI suggestions
      if (suggestions.metrics && suggestions.metrics.length > 0) {
        const enhancedMetrics = suggestions.metrics.map(m => ({
          name: m.name,
          target: m.target ?? 0,
          current: 0,
          unit: m.unit ?? '',
          frequency: 'weekly' as GoalTimeframe
        }))
        setMetrics(enhancedMetrics)
      }

      toast({
        title: "Goal enhanced",
        description: "Your goal has been enhanced with AI suggestions, including milestones and metrics."
      })
    } catch (error) {
      console.error('Error enhancing goal:', error)
      toast({
        title: "Enhancement failed",
        description: "Failed to enhance goal with AI. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleDelete = async () => {
    if (!initialData?.id || !user?.organizationId) return

    try {
      setIsSubmitting(true)
      await deleteGoal(initialData.id)
      toast({
        title: 'Goal deleted',
        description: 'Your monthly goal has been deleted successfully.'
      })
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/dashboard/goals')
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete goal. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Strategic Context */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">Strategic Context</Label>
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Monthly goals should focus on specific operational tasks and deliverables that contribute to quarterly objectives.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnhanceWithAI}
              disabled={isEnhancing}
              className="flex items-center space-x-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isEnhancing ? 'Enhancing...' : 'Enhance with AI'}</span>
            </Button>
          </div>
        </div>

        <div>
          <Label>Quarterly Goal</Label>
          <Select
            value={selectedQuarterlyGoal?.id}
            onValueChange={(value) => {
              const goal = quarterlyGoals.find(g => g.id === value)
              setSelectedQuarterlyGoal(goal || null)
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select quarterly goal this contributes to" />
            </SelectTrigger>
            <SelectContent>
              {quarterlyGoals.map((goal) => (
                <SelectItem key={goal.id} value={goal.id}>
                  {goal.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedQuarterlyGoal && (
            <p className="mt-2 text-sm text-gray-500">{selectedQuarterlyGoal.description}</p>
          )}
        </div>

        <div>
          <Label>Goal Title</Label>
          <Input
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="e.g., Complete first draft of Q2 marketing campaign"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Description & Deliverables</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe the specific deliverables and success criteria for this month"
            className="mt-1 min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Goal Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: GoalType) => handleInputChange('type', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select goal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team">Team Goal</SelectItem>
                <SelectItem value="department">Department Goal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Priority Level</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: GoalPriority) => handleInputChange('priority', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>End Date</Label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Milestones Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">Milestones</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddMilestone}
          >
            Add Milestone
          </Button>
        </div>
        
        {milestones.map((milestone, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Milestone {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteMilestone(index)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={milestone.title}
                    onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                    placeholder="e.g., Complete content creation"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={milestone.description}
                    onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                    placeholder="Describe what needs to be accomplished"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={milestone.dueDate instanceof Date ? milestone.dueDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => handleMilestoneChange(index, 'dueDate', new Date(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={milestone.status}
                      onValueChange={(value: GoalStatus) => handleMilestoneChange(index, 'status', value)}
                    >
                      <SelectTrigger className="mt-1">
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
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Metrics Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">Progress Metrics</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddMetric}
          >
            Add Metric
          </Button>
        </div>

        {metrics.map((metric, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Metric {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteMetric(index)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={metric.name || ''}
                    onChange={(e) => handleMetricChange(index, 'name', e.target.value)}
                    placeholder="e.g., Tasks Completed"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Unit</Label>
                  <Input
                    value={metric.unit || ''}
                    onChange={(e) => handleMetricChange(index, 'unit', e.target.value)}
                    placeholder="e.g., count, %, hours"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Target</Label>
                  <Input
                    type="number"
                    value={metric.target || 0}
                    onChange={(e) => handleMetricChange(index, 'target', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Current</Label>
                  <Input
                    type="number"
                    value={metric.current || 0}
                    onChange={(e) => handleMetricChange(index, 'current', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-end space-x-4">
        {mode === 'edit' && (
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            Delete Goal
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Goal' : 'Create Goal'}
        </Button>
      </div>
    </div>
  )
} 