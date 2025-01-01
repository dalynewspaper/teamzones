'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { CalendarIcon, InfoIcon, XCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Goal, GoalMetric, GoalType, GoalPriority, GoalTimeframe, GoalStatus } from '@/types/goals'
import { createGoal, updateGoal, deleteGoal, getGoalsByTimeframe } from '@/services/goalService'
import { enhanceGoal } from '@/services/openaiService'
import { format, addMonths, startOfQuarter, endOfQuarter } from 'date-fns'
import { getFiscalYearInfo, getQuarterInfo, getQuarterRange, getAvailableQuarters } from '@/utils/dateUtils'

interface KeyResultWithMetrics {
  id?: string
  description: string
  targetDate: string
  metrics: {
    id?: string
    name: string
    target: number
    current: number
    unit: string
    frequency: 'monthly'
  }[]
}

interface QuarterlyGoalFormProps {
  initialData?: Goal
  mode?: 'create' | 'edit'
  parentGoalId?: string
  quarter?: number
  year?: number
  onSuccess?: () => void
}

export function QuarterlyGoalForm({ initialData, mode = 'create', parentGoalId, quarter, year, onSuccess }: QuarterlyGoalFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [metrics, setMetrics] = useState<Partial<GoalMetric>[]>(initialData?.metrics || [])
  const [annualGoals, setAnnualGoals] = useState<Goal[]>([])
  const [selectedAnnualGoal, setSelectedAnnualGoal] = useState<Goal | null>(null)
  const [isLoadingAnnualGoals, setIsLoadingAnnualGoals] = useState(true)
  const [availableQuarters] = useState(getAvailableQuarters())
  const [selectedQuarter, setSelectedQuarter] = useState(() => {
    if (quarter && year) {
      const existing = availableQuarters.find(q => q.quarter === quarter && q.year === year)
      return existing || availableQuarters[0]
    }
    return availableQuarters[0]
  })
  const [keyResults, setKeyResults] = useState<KeyResultWithMetrics[]>(
    initialData?.keyResults?.map(kr => ({
      id: kr.id,
      description: kr.description,
      targetDate: kr.targetDate,
      metrics: kr.metrics.map(m => ({
        id: m.id,
        name: m.name,
        target: m.target,
        current: m.current,
        unit: m.unit,
        frequency: 'monthly'
      }))
    })) || [{
      description: '',
      targetDate: '',
      metrics: []
    }]
  )
  const [isEnhancing, setIsEnhancing] = useState(false)

  // Get quarter dates using utility function
  const { startDate: quarterStart, endDate: quarterEnd, months } = getQuarterInfo(selectedQuarter.quarter, selectedQuarter.year)

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: initialData?.type || 'department' as GoalType,
    priority: initialData?.priority || 'high' as GoalPriority,
    startDate: initialData?.startDate?.toISOString().split('T')[0] || format(quarterStart, 'yyyy-MM-dd'),
    endDate: initialData?.endDate?.toISOString().split('T')[0] || format(quarterEnd, 'yyyy-MM-dd'),
  })

  // Load annual goals
  useEffect(() => {
    const loadAnnualGoals = async () => {
      if (!user?.organizationId) return

      try {
        setIsLoadingAnnualGoals(true)
        const goals = await getGoalsByTimeframe('annual', user.organizationId)
        setAnnualGoals(goals)
        
        // If parentGoalId is provided, select that goal
        if (parentGoalId) {
          const parentGoal = goals.find(g => g.id === parentGoalId)
          if (parentGoal) {
            setSelectedAnnualGoal(parentGoal)
          }
        }
      } catch (error) {
        console.error('Error loading annual goals:', error)
        toast({
          title: 'Error',
          description: 'Failed to load annual goals. Please try again.',
          variant: 'destructive'
        })
      } finally {
        setIsLoadingAnnualGoals(false)
      }
    }

    loadAnnualGoals()
  }, [user?.organizationId, parentGoalId])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleKeyResultChange = (index: number, field: keyof KeyResultWithMetrics, value: any) => {
    const newKeyResults = [...keyResults]
    newKeyResults[index] = { ...newKeyResults[index], [field]: value }
    setKeyResults(newKeyResults)
  }

  const handleKeyResultMetricChange = (krIndex: number, metricIndex: number, field: string, value: any) => {
    const newKeyResults = [...keyResults]
    newKeyResults[krIndex].metrics[metricIndex] = {
      ...newKeyResults[krIndex].metrics[metricIndex],
      [field]: value
    }
    setKeyResults(newKeyResults)
  }

  const handleAddKeyResult = () => {
    if (keyResults.length >= 3) {
      toast({
        title: "Maximum key results reached",
        description: "Quarterly goals should have at most 3 key results for better focus.",
        variant: "default"
      })
      return
    }
    setKeyResults([...keyResults, { 
      description: '', 
      targetDate: quarterEnd.toISOString(), // End of the selected quarter
      metrics: [] 
    }])
  }

  const handleDeleteKeyResult = (index: number) => {
    setKeyResults(keyResults.filter((_, i) => i !== index))
  }

  const handleAddKeyResultMetric = (krIndex: number) => {
    const newKeyResults = [...keyResults]
    newKeyResults[krIndex].metrics.push({
      name: '',
      target: 0,
      current: 0,
      unit: '',
      frequency: 'monthly'
    })
    setKeyResults(newKeyResults)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting || !user?.uid || !user?.organizationId) return

    try {
      setIsSubmitting(true)

      const goalData = {
        ...formData,
        timeframe: 'quarterly' as GoalTimeframe,
        organizationId: user.organizationId,
        status: 'not_started' as GoalStatus,
        progress: 0,
        metrics: metrics.map((m, i) => ({
          id: m.id || `new-metric-${i}`,
          name: m.name || '',
          target: m.target || 0,
          current: m.current || 0,
          unit: m.unit || '',
          frequency: m.frequency || 'monthly'
        })) as GoalMetric[],
        keyResults: keyResults.map((kr, i) => ({
          id: kr.id || `new-kr-${i}`,
          description: kr.description,
          targetDate: kr.targetDate,
          metrics: kr.metrics.map((m, j) => ({
            id: m.id || `new-kr-${i}-metric-${j}`,
            name: m.name,
            target: m.target,
            current: m.current || 0,
            unit: m.unit,
            frequency: m.frequency
          }))
        })),
        parentGoalId: selectedAnnualGoal?.id,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        milestones: initialData?.milestones || [],
        assignees: initialData?.assignees || [],
        ownerId: initialData?.ownerId || user.uid,
        tags: initialData?.tags || [],
        createdBy: initialData?.createdBy || user.uid
      }

      if (mode === 'edit' && initialData) {
        await updateGoal(initialData.id, goalData)
        toast({
          title: 'Goal updated',
          description: 'Your goal has been updated successfully.'
        })
      } else {
        await createGoal(goalData)
        toast({
          title: 'Goal created',
          description: 'Your new goal has been created successfully.'
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
    if (!selectedAnnualGoal) {
      toast({
        title: "Missing information",
        description: "Please select an annual goal first to get AI suggestions.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsEnhancing(true)
      const suggestions = await enhanceGoal(
        formData.title || "Quarterly goal suggestion",
        formData.description || "",
        selectedQuarter.label,
        {
          parentGoal: {
            title: selectedAnnualGoal.title,
            description: selectedAnnualGoal.description
          }
        }
      )

      // Update form with enhanced content
      setFormData(prev => ({
        ...prev,
        title: suggestions.enhancedTitle,
        description: suggestions.enhancedDescription
      }))

      // Update metrics with AI suggestions
      if (suggestions.metrics && suggestions.metrics.length > 0) {
        const enhancedMetrics = suggestions.metrics.map(metric => ({
          name: metric.name,
          target: metric.target || 0,
          current: 0,
          unit: metric.unit || '',
          frequency: 'monthly' as const
        }))
        setKeyResults([{
          description: 'Key Result 1',
          targetDate: quarterEnd.toISOString(),
          metrics: enhancedMetrics
        }])
      }

      toast({
        title: "Goal Enhanced",
        description: "Your goal has been enhanced with AI suggestions.",
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
        description: 'Your quarterly goal has been deleted successfully.'
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
                  <p className="max-w-xs">Quarterly goals should focus on specific deliverables that contribute to annual objectives.</p>
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
          <Label>Annual Goal</Label>
          <Select
            value={selectedAnnualGoal?.id}
            onValueChange={(value) => {
              const goal = annualGoals.find(g => g.id === value)
              setSelectedAnnualGoal(goal || null)
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select annual goal this contributes to" />
            </SelectTrigger>
            <SelectContent>
              {annualGoals.map((goal) => (
                <SelectItem key={goal.id} value={goal.id}>
                  {goal.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedAnnualGoal && (
            <p className="mt-2 text-sm text-gray-500">{selectedAnnualGoal.description}</p>
          )}
        </div>

        <div>
          <Label>Goal Title</Label>
          <Input
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="e.g., Launch beta version of new product"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Strategic Impact</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe how this goal contributes to annual objectives and its expected impact"
            className="mt-1"
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
                <SelectItem value="department">Department Goal</SelectItem>
                <SelectItem value="team">Team Goal</SelectItem>
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

        <div>
          <Label>Time Period</Label>
          <Select
            value={`${selectedQuarter.quarter}-${selectedQuarter.year}`}
            onValueChange={(value) => {
              const [quarter, year] = value.split('-').map(Number)
              const newQuarter = availableQuarters.find(q => q.quarter === quarter && q.year === year)
              if (newQuarter) {
                setSelectedQuarter(newQuarter)
                // Update form dates
                const { startDate, endDate } = getQuarterInfo(newQuarter.quarter, newQuarter.year)
                setFormData(prev => ({
                  ...prev,
                  startDate: format(startDate, 'yyyy-MM-dd'),
                  endDate: format(endDate, 'yyyy-MM-dd')
                }))
              }
            }}
          >
            <SelectTrigger className="mt-1 w-[240px]">
              <SelectValue placeholder="Select quarter" />
            </SelectTrigger>
            <SelectContent>
              {availableQuarters.map((q) => (
                <SelectItem key={`${q.quarter}-${q.year}`} value={`${q.quarter}-${q.year}`}>
                  <div className="flex flex-col text-left">
                    <div className="font-medium">{q.label}</div>
                    <div className="text-xs text-muted-foreground">{q.range}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Results */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Key Results (OKRs)</Label>
        {keyResults.map((kr, krIndex) => (
          <Card key={krIndex} className="p-4 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex-1 space-y-4">
                <div>
                  <Label>Key Result {krIndex + 1}</Label>
                  <Input
                    value={kr.description}
                    onChange={(e) => handleKeyResultChange(krIndex, 'description', e.target.value)}
                    placeholder="e.g., Complete feature development for beta release"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Target Date</Label>
                  <Select
                    value={kr.targetDate}
                    onValueChange={(value) => handleKeyResultChange(krIndex, 'targetDate', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m.label} value={m.date.toISOString()}>
                          {m.label} (Due {format(m.date, 'MM/dd/yyyy')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Metrics for this Key Result */}
                <div className="space-y-6">
                  <Label>Success Metrics</Label>
                  {kr.metrics.map((metric, metricIndex) => (
                    <div key={metricIndex} className="p-4 bg-gray-50 rounded-lg space-y-4">
                      <div className="flex gap-4 items-start">
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Metric Name</Label>
                              <Input
                                value={metric.name}
                                onChange={(e) => handleKeyResultMetricChange(krIndex, metricIndex, 'name', e.target.value)}
                                placeholder="e.g., Features Completed"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>Unit</Label>
                              <Input
                                type="text"
                                value={metric.unit}
                                onChange={(e) => handleKeyResultMetricChange(krIndex, metricIndex, 'unit', e.target.value)}
                                placeholder="e.g., count"
                                className="mt-1"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Target Value</Label>
                              <Input
                                type="number"
                                value={metric.target}
                                onChange={(e) => handleKeyResultMetricChange(krIndex, metricIndex, 'target', parseFloat(e.target.value))}
                                placeholder="e.g., 10"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>Current Value</Label>
                              <Input
                                type="number"
                                value={metric.current}
                                onChange={(e) => handleKeyResultMetricChange(krIndex, metricIndex, 'current', parseFloat(e.target.value))}
                                placeholder="e.g., 0"
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            const newKeyResults = [...keyResults]
                            newKeyResults[krIndex].metrics = newKeyResults[krIndex].metrics.filter((_, i) => i !== metricIndex)
                            setKeyResults(newKeyResults)
                          }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddKeyResultMetric(krIndex)}
                    >
                      Add Metric
                    </Button>
                  </div>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleDeleteKeyResult(krIndex)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}

        {keyResults.length < 3 && (
          <Button
            type="button"
            variant="outline"
            onClick={handleAddKeyResult}
            className="w-full"
          >
            Add Key Result
          </Button>
        )}
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