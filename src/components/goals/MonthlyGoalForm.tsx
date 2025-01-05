'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { 
  CalendarIcon, 
  InfoIcon, 
  XCircle, 
  Sparkles, 
  Target, 
  Lightbulb, 
  AlertCircle, 
  CheckIcon,
  PlusIcon,
  RotateCw,
  Users,
  Clock,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { 
  Goal, 
  GoalMetric, 
  GoalType, 
  GoalPriority, 
  GoalTimeframe, 
  GoalStatus, 
  GoalMilestone, 
  MilestoneSuggestion, 
  MetricSuggestion 
} from '@/types/goals'
import { createGoal, updateGoal, deleteGoal, getGoalsByTimeframe } from '@/services/goalService'
import { enhanceGoal } from '@/services/openaiService'
import { format, startOfMonth, endOfMonth, addDays, differenceInDays, eachWeekOfInterval, eachDayOfInterval, getWeek } from 'date-fns'

interface MonthlyGoalFormProps {
  initialData?: Goal
  mode?: 'create' | 'edit'
  parentGoalId?: string
  onSuccess?: () => void
}

const monthlyTemplates = [
  {
    id: 'development',
    title: 'Development Sprint',
    description: 'Complete key development milestones and feature implementations',
    metrics: [
      { name: 'Features Completed', unit: 'features', target: 3 },
      { name: 'Code Coverage', unit: '%', target: 85 }
    ],
    milestones: [
      { title: 'Sprint Planning', dueDate: 1 },
      { title: 'Mid-Sprint Review', dueDate: 15 },
      { title: 'Sprint Retrospective', dueDate: 30 }
    ]
  },
  {
    id: 'marketing',
    title: 'Marketing Campaign',
    description: 'Execute marketing initiatives and track campaign performance',
    metrics: [
      { name: 'Lead Generation', unit: 'leads', target: 100 },
      { name: 'Conversion Rate', unit: '%', target: 5 }
    ],
    milestones: [
      { title: 'Campaign Launch', dueDate: 1 },
      { title: 'Performance Review', dueDate: 15 },
      { title: 'Campaign Analysis', dueDate: 30 }
    ]
  }
]

export function MonthlyGoalForm({ initialData, mode = 'create', parentGoalId, onSuccess }: MonthlyGoalFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [quarterlyGoals, setQuarterlyGoals] = useState<Goal[]>([])
  const [selectedQuarterlyGoal, setSelectedQuarterlyGoal] = useState<Goal | null>(null)
  const [isLoadingQuarterlyGoals, setIsLoadingQuarterlyGoals] = useState(true)
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [suggestedMilestones, setSuggestedMilestones] = useState<MilestoneSuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set())

  const defaultStartDate = startOfMonth(new Date())
  const defaultEndDate = endOfMonth(new Date())

  const [formData, setFormData] = useState<Goal>({
    id: initialData?.id || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: (initialData?.type || 'company') as GoalType,
    priority: (initialData?.priority || 'high') as GoalPriority,
    status: initialData?.status || 'not_started',
    timeframe: 'monthly',
    startDate: initialData?.startDate || defaultStartDate,
    endDate: initialData?.endDate || defaultEndDate,
    parentGoalId: parentGoalId || initialData?.parentGoalId || '',
    organizationId: user?.organizationId || '',
    ownerId: user?.email || '',
    createdBy: user?.email || '',
    progress: initialData?.progress || 0,
    metrics: initialData?.metrics || [],
    keyResults: initialData?.keyResults || [],
    milestones: initialData?.milestones || [],
    assignees: initialData?.assignees || [],
    tags: initialData?.tags || [],
    teamRoles: initialData?.teamRoles || [],
    createdAt: initialData?.createdAt || new Date(),
    updatedAt: initialData?.updatedAt || new Date()
  })

  const [selectedMonth, setSelectedMonth] = useState<Date>(formData.startDate)

  const [metrics, setMetrics] = useState<Partial<GoalMetric>[]>(initialData?.metrics || [])
  const [milestones, setMilestones] = useState<Partial<GoalMilestone>[]>(
    initialData?.milestones || [
      {
        title: '',
        description: '',
        dueDate: new Date(formData.endDate),
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
      frequency: 'monthly' as GoalTimeframe
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
        description: "Please select a quarterly goal first to get contextual suggestions.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsEnhancing(true)
      const suggestions = await enhanceGoal(
        formData.title || `${format(monthStart, 'MMMM yyyy')} Execution Plan`,
        formData.description || `Monthly execution plan to progress toward: ${selectedQuarterlyGoal.description}`,
        format(monthStart, 'MMMM'),
        {
          parentGoal: {
            title: selectedQuarterlyGoal.title,
            description: selectedQuarterlyGoal.description,
            timeframe: 'quarterly'
          },
          timeframe: 'monthly',
          generateMilestones: true,
          generateMetrics: true
        }
      )

      setFormData(prev => ({
        ...prev,
        title: suggestions.enhancedTitle || prev.title,
        description: suggestions.enhancedDescription || prev.description
      }))

      if (suggestions.metrics) {
        setMetrics(suggestions.metrics.map((m, index) => ({
          id: `new-metric-${index}`,
          name: m.name || '',
          target: m.target || 0,
          current: 0,
          unit: m.unit || '',
          frequency: 'monthly' as GoalTimeframe
        })))
      }

      if (suggestions.milestones) {
        setMilestones(suggestions.milestones.map((m, index) => ({
          id: `new-milestone-${index}`,
          title: m.title || '',
          description: m.description || '',
          dueDate: new Date(m.dueDate || formData.endDate),
          status: 'not_started' as GoalStatus
        })))
      }

      toast({
        title: "Goal enhanced",
        description: "Your monthly goal has been enhanced with AI suggestions."
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

  // Get months of the quarter
  const getQuarterMonths = (date: Date) => {
    const quarterStart = new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1)
    return [
      quarterStart,
      new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 1, 1),
      new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 2, 1)
    ]
  }

  const quarterMonths = getQuarterMonths(selectedMonth)

  // Update form data when month changes
  const handleMonthChange = (date: Date) => {
    setSelectedMonth(date)
    const newStartDate = startOfMonth(date)
    const newEndDate = endOfMonth(date)
    setFormData(prev => ({
      ...prev,
      startDate: newStartDate,
      endDate: newEndDate
    }))
  }

  // Calculate month progress and timeline
  const monthStart = startOfMonth(selectedMonth)
  const monthEnd = endOfMonth(selectedMonth)
  
  // Get all weeks that overlap with the month
  const allWeeks = eachWeekOfInterval(
    { start: monthStart, end: monthEnd },
    { weekStartsOn: 1 }
  )

  // Filter and format weeks to show only days within the month
  const weeks = allWeeks.map((weekStart) => {
    const weekEnd = addDays(weekStart, 6)
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
      .filter(date => date.getMonth() === monthStart.getMonth())

    const firstDay = weekDays[0]
    const lastDay = weekDays[weekDays.length - 1]
    
    // Calculate the actual calendar week number
    const calendarWeek = getWeek(weekStart, { weekStartsOn: 1, firstWeekContainsDate: 4 })

    return {
      weekNumber: calendarWeek,
      startDate: firstDay,
      endDate: lastDay,
      isFirstWeek: calendarWeek === getWeek(monthStart, { weekStartsOn: 1, firstWeekContainsDate: 4 }),
      isMidMonth: weekDays.some(date => date.getDate() >= 15 && date.getDate() <= 21),
      days: weekDays
    }
  }).slice(0, 4)  // Take only first 4 weeks but after calculating proper ranges

  // Calculate progress based on current date
  const today = new Date()
  const targetDate = new Date(formData.startDate)
  const isCurrentMonth = today.getMonth() === targetDate.getMonth() && 
                        today.getFullYear() === targetDate.getFullYear()
  
  const totalDays = differenceInDays(monthEnd, monthStart) + 1
  const daysElapsed = isCurrentMonth ? 
    Math.max(0, differenceInDays(today, monthStart)) : 
    0

  const daysRemaining = isCurrentMonth ? 
    Math.max(0, differenceInDays(monthEnd, today)) :
    totalDays
  
  const progressPercentage = isCurrentMonth ?
    Math.min(100, (daysElapsed / totalDays) * 100) :
    0

  const handleTemplateSelect = (templateId: string) => {
    const template = monthlyTemplates.find(t => t.id === templateId)
    if (template) {
      setFormData(prev => ({
        ...prev,
        title: template.title,
        description: template.description
      }))
      
      setMetrics(template.metrics.map(m => ({
        name: m.name,
        unit: m.unit,
        target: m.target,
        current: 0,
        frequency: 'monthly' as GoalTimeframe
      })))

      setMilestones(template.milestones.map(m => ({
        title: m.title,
        description: '',
        dueDate: addDays(monthStart, m.dueDate),
        status: 'not_started' as GoalStatus
      })))

      setSelectedTemplate(templateId)
    }
  }

  return (
    <div className="space-y-8">
      <Card className="p-6 bg-gradient-to-b from-blue-50 to-white border-blue-100">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-blue-900">Monthly Progress Path</h3>
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

          {/* Month Selector */}
          <div className="flex justify-center space-x-4">
            {quarterMonths.map((month) => (
              <Button
                key={month.getTime()}
                variant={month.getTime() === selectedMonth.getTime() ? "default" : "outline"}
                onClick={() => handleMonthChange(month)}
                className="min-w-[140px]"
              >
                {format(month, 'MMMM yyyy')}
              </Button>
            ))}
          </div>

          {/* Month Timeline */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-dashed border-blue-100" />
            </div>
            <div className="relative flex justify-between">
              {weeks.map((week) => (
                <div key={week.weekNumber} className="flex flex-col items-center">
                  <div className="bg-white px-3 py-2 rounded-lg border border-blue-100">
                    <div className="text-sm font-medium text-blue-900">Week {week.weekNumber}</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {format(week.startDate, 'dd')} - {format(week.endDate, 'dd')}
                    </div>
                  </div>
                  {(week.isFirstWeek || week.isMidMonth) && (
                    <div className="mt-2 text-xs text-blue-500">
                      {week.isFirstWeek ? 'Start' : 'Mid-Month'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {selectedQuarterlyGoal && (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-blue-50/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-blue-600 mt-1" />
                  <div className="space-y-3 flex-1">
                    <div>
                      <h4 className="font-medium text-sm text-blue-900">Quarterly Goal Progress</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        {selectedQuarterlyGoal.title}
                      </p>
                    </div>
                    {selectedQuarterlyGoal.metrics && selectedQuarterlyGoal.metrics.length > 0 && (
                      <div className="space-y-2">
                        {selectedQuarterlyGoal.metrics.map((metric, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-blue-900">{metric.name}</span>
                              <span className="text-blue-700">
                                {metric.current} / {metric.target} {metric.unit}
                              </span>
                            </div>
                            <div className="h-1.5 bg-blue-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 transition-all" 
                                style={{ width: `${Math.min(100, (metric.current / metric.target) * 100)}%` }} 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-white rounded-lg border border-blue-100">
                  <div className="text-xs text-blue-600 mb-1">Month Progress</div>
                  <div className="text-sm font-medium text-blue-900">
                    {isCurrentMonth ? `${Math.round(progressPercentage)}% Complete` : 'Not Started'}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-blue-100">
                  <div className="text-xs text-blue-600 mb-1">Current Focus</div>
                  <div className="text-sm font-medium text-blue-900">
                    {format(monthStart, 'MMMM yyyy')}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-blue-100">
                  <div className="text-xs text-blue-600 mb-1">Days Remaining</div>
                  <div className="text-sm font-medium text-blue-900">
                    {daysRemaining} days
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Smart Assistant */}
      {showSmartSuggestions && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-blue-100">
              <Lightbulb className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900">Smart Goal Assistant</h3>
              <p className="text-sm text-blue-700 mt-1">
                Start with a template or get AI assistance to create an effective monthly goal.
              </p>
              <div className="mt-4 flex gap-4">
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthlyTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSmartSuggestions(false)}
              className="text-blue-600"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Goal Hierarchy */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">Strategic Context</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Monthly goals should focus on specific operational tasks that contribute to quarterly objectives.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Card className="p-4">
          <div className="space-y-6">
            {/* Quarterly Goal Level */}
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <div className="w-0.5 h-full bg-blue-100 mt-2" />
              </div>
              <div className="flex-1 pt-1">
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
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-gray-600">{selectedQuarterlyGoal.description}</p>
                    {selectedQuarterlyGoal.metrics && selectedQuarterlyGoal.metrics.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedQuarterlyGoal.metrics.map((metric, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {metric.name}: {metric.target}{metric.unit}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Goal Level */}
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <CalendarIcon className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2">
                  <Label>This Month's Focus</Label>
                  <Badge variant="outline" className="text-xs">
                    {format(monthStart, 'MMMM yyyy')}
                  </Badge>
                </div>
                <div className="mt-4 space-y-4">
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Implement core features for beta release"
                    className="mt-1"
                  />
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the specific deliverables and success criteria for this month"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

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
    </div>
  )
} 