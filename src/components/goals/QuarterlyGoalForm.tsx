'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { CalendarIcon, InfoIcon, XCircle, Sparkles, Target, Lightbulb, AlertCircle, PlusCircle } from 'lucide-react'
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
  ParentGoalInfo,
  MetricSuggestion,
  GoalSuggestion,
  GoalEnhancementOptions
} from '@/types/goals'
import { createGoal, updateGoal, deleteGoal, getGoalsByTimeframe } from '@/services/goalService'
import { enhanceGoal } from '@/services/openaiService'
import { format, addMonths, startOfQuarter, endOfQuarter, differenceInDays } from 'date-fns'
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
        formData.title || `${selectedQuarter.label} ${selectedQuarter.year} Strategic Initiatives`,
        formData.description || `Quarterly execution plan to progress toward: ${selectedAnnualGoal.description}`,
        selectedQuarter.label,
        {
          parentGoal: {
            title: selectedAnnualGoal.title,
            description: selectedAnnualGoal.description,
            metrics: selectedAnnualGoal.metrics,
            keyResults: selectedAnnualGoal.keyResults
          } as ParentGoalInfo,
          timeframe: 'quarterly',
          quarterInfo: {
            quarter: selectedQuarter.quarter,
            year: selectedQuarter.year,
            months: months.map(m => m.label)
          },
          generateKeyResults: true,
          generateMetrics: true,
          suggestMilestones: true
        } as GoalEnhancementOptions
      )

      // Update form with enhanced content
      setFormData(prev => ({
        ...prev,
        title: suggestions.enhancedTitle,
        description: suggestions.enhancedDescription
      }))

      // Update key results with AI suggestions
      const typedSuggestions = suggestions as GoalSuggestion & {
        keyResults?: Array<{
          description: string
          targetDate?: string
          metrics: MetricSuggestion[]
        }>
      }

      if (typedSuggestions.keyResults && typedSuggestions.keyResults.length > 0) {
        const enhancedKeyResults = typedSuggestions.keyResults.map((kr) => ({
          description: kr.description,
          targetDate: kr.targetDate || quarterEnd.toISOString(),
          metrics: kr.metrics.map((m) => ({
            name: m.name,
            target: m.target || 0,
            current: 0,
            unit: m.unit || '',
            frequency: 'monthly' as const
          }))
        }))
        setKeyResults(enhancedKeyResults)
      }

      toast({
        title: "Goal Enhanced",
        description: "Your quarterly goal has been enhanced with AI suggestions for key results and metrics.",
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
      {/* Progress Visualization */}
      <Card className="p-6 bg-gradient-to-b from-blue-50 to-white border-blue-100">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-blue-900">Quarterly Progress Path</h3>
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-dashed border-blue-100" />
            </div>
            <div className="relative flex justify-between">
              {months.map((month, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="bg-white px-3 py-2 rounded-lg border border-blue-100">
                    <div className="text-sm font-medium text-blue-900">{format(month.date, 'MMM')}</div>
                    <div className="text-xs text-blue-600 mt-1">{format(month.date, 'dd/MM')}</div>
                  </div>
                  {index < months.length - 1 && (
                    <div className="mt-2 text-xs text-blue-500">
                      {index === 0 ? 'Start' : index === 1 ? 'Midpoint' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {selectedAnnualGoal && (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-blue-50/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-blue-600 mt-1" />
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm text-blue-900">Annual Goal Progress</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        {selectedAnnualGoal.title}
                      </p>
                    </div>
                    {selectedAnnualGoal.metrics && selectedAnnualGoal.metrics.length > 0 && (
                      <div className="space-y-2">
                        {selectedAnnualGoal.metrics.map((metric, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-blue-900">{metric.name}</span>
                              <span className="text-blue-700">{metric.current} / {metric.target}{metric.unit}</span>
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
                  <div className="text-xs text-blue-600 mb-1">Key Milestones</div>
                  <div className="text-sm font-medium text-blue-900">
                    {months.map(m => format(m.date, 'MMM')).join(' → ')}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-blue-100">
                  <div className="text-xs text-blue-600 mb-1">Quarter Focus</div>
                  <div className="text-sm font-medium text-blue-900">
                    {selectedQuarter.label} {selectedQuarter.year}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-blue-100">
                  <div className="text-xs text-blue-600 mb-1">Days Remaining</div>
                  <div className="text-sm font-medium text-blue-900">
                    {differenceInDays(quarterEnd, new Date())} days
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Smart Suggestions Alert */}
      {!selectedAnnualGoal && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-900">Select an Annual Goal</h4>
            <p className="text-sm text-amber-700 mt-1">
              Choose an annual goal to get smart suggestions and ensure your quarterly objectives align with the bigger picture.
            </p>
          </div>
        </div>
      )}

      {/* Strategic Context */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">Strategic Context</Label>
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
        </div>

        {/* Goal Hierarchy Visualization */}
        <Card className="p-4 bg-gradient-to-b from-blue-50 to-white border-blue-100">
          <div className="space-y-6">
            {/* Annual Goal Level */}
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <div className="w-0.5 h-full bg-blue-100 mt-2" />
              </div>
              <div className="flex-1 pt-1">
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
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-gray-600">{selectedAnnualGoal.description}</p>
                    {selectedAnnualGoal.metrics && selectedAnnualGoal.metrics.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedAnnualGoal.metrics.map((metric, index) => (
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

            {/* Quarterly Goal Level */}
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <CalendarIcon className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2">
                  <Label>This Quarter's Focus</Label>
                  <Badge variant="outline" className="text-xs">
                    {selectedQuarter.label} {selectedQuarter.year}
                  </Badge>
                </div>
                <div className="mt-4 space-y-4">
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Launch beta version of new product"
                    className="mt-1"
                  />
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe how this goal contributes to annual objectives and its expected impact"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Key Results Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-lg font-semibold">Key Results</Label>
            <p className="text-sm text-muted-foreground">Define 2-3 measurable outcomes for this quarter</p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddKeyResult}
                  disabled={keyResults.length >= 3}
                >
                  Add Key Result
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p>Quarterly key results should be specific milestones that contribute to annual objectives.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {keyResults.length === 0 && selectedAnnualGoal && (
          <Card className="p-6">
            <div className="space-y-6">
              {/* Smart Suggestions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-sm">Quarterly Milestones</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {selectedAnnualGoal.keyResults?.map((annualKR, index) => {
                    const quarterlyTarget = Math.round((annualKR.metrics?.[0]?.target || 0) * 0.25)
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        className="h-auto p-4 justify-start text-left relative group"
                        onClick={() => {
                          setKeyResults([...keyResults, {
                            description: `Q${selectedQuarter.quarter} milestone: ${annualKR.description}`,
                            targetDate: format(quarterEnd, 'yyyy-MM-dd'),
                            metrics: annualKR.metrics?.map(m => ({
                              name: m.name,
                              target: quarterlyTarget,
                              current: 0,
                              unit: m.unit,
                              frequency: 'monthly'
                            })) || []
                          }])
                        }}
                      >
                        <div className="space-y-2">
                          <div className="font-medium text-sm">{annualKR.description}</div>
                          {annualKR.metrics?.[0] && (
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">
                                Suggested quarterly target: {quarterlyTarget}
                                {annualKR.metrics[0].unit}
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-blue-500 transition-all" 
                                  style={{ width: '0%' }} 
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <PlusCircle className="h-4 w-4 text-blue-600" />
                        </div>
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Quick Templates */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                  <h4 className="font-medium text-sm">Quick Templates</h4>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto p-4 justify-start text-left"
                    onClick={() => {
                      setKeyResults([...keyResults, {
                        description: `${selectedQuarter.label} Development Milestones`,
                        targetDate: format(quarterEnd, 'yyyy-MM-dd'),
                        metrics: [{
                          name: "Features Completed",
                          target: 3,
                          current: 0,
                          unit: "features",
                          frequency: 'monthly'
                        }]
                      }])
                    }}
                  >
                    <div>
                      <div className="font-medium text-sm mb-1">Development Sprint</div>
                      <div className="text-xs text-muted-foreground">Track feature completion</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 justify-start text-left"
                    onClick={() => {
                      setKeyResults([...keyResults, {
                        description: `${selectedQuarter.label} Revenue Target`,
                        targetDate: format(quarterEnd, 'yyyy-MM-dd'),
                        metrics: [{
                          name: "Quarterly Revenue",
                          target: 250000,
                          current: 0,
                          unit: "€",
                          frequency: 'monthly'
                        }]
                      }])
                    }}
                  >
                    <div>
                      <div className="font-medium text-sm mb-1">Revenue Goals</div>
                      <div className="text-xs text-muted-foreground">Track financial targets</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-4 justify-start text-left"
                    onClick={() => {
                      setKeyResults([...keyResults, {
                        description: `${selectedQuarter.label} Customer Success`,
                        targetDate: format(quarterEnd, 'yyyy-MM-dd'),
                        metrics: [{
                          name: "Customer Satisfaction",
                          target: 90,
                          current: 0,
                          unit: "%",
                          frequency: 'monthly'
                        }]
                      }])
                    }}
                  >
                    <div>
                      <div className="font-medium text-sm mb-1">Customer Success</div>
                      <div className="text-xs text-muted-foreground">Track satisfaction metrics</div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {keyResults.map((kr, krIndex) => (
          <Card key={krIndex} className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">Key Result {krIndex + 1}</h4>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Key Results should be specific, measurable outcomes that contribute to the quarterly goal.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteKeyResult(krIndex)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label>Description</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Format: "Achieve [Specific Outcome] by [Month]" or "Increase/Decrease [Metric] from X to Y"</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea
                  value={kr.description}
                  onChange={(e) => handleKeyResultChange(krIndex, 'description', e.target.value)}
                  placeholder="e.g., Complete feature development for beta release by end of Q2"
                  className="mt-1"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label>Target Month</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">When do you expect to achieve this key result? This should be within the quarter.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Success Metrics</Label>
                    <p className="text-sm text-muted-foreground">Define how you'll measure progress</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddKeyResultMetric(krIndex)}
                  >
                    Add Metric
                  </Button>
                </div>

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
                              placeholder="e.g., count, %, $"
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Label>Target Value</Label>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <InfoIcon className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">The value you aim to achieve by the target month</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Input
                              type="number"
                              value={metric.target}
                              onChange={(e) => handleKeyResultMetricChange(krIndex, metricIndex, 'target', parseFloat(e.target.value))}
                              placeholder="e.g., 100"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Label>Starting Value</Label>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <InfoIcon className="h-4 w-4 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">The current or starting value for this metric</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
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
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Goal Settings */}
      <div className="space-y-6 pt-6 border-t">
        <Label className="text-lg font-semibold">Goal Settings</Label>
        
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Goal Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange('type', value as GoalType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select goal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="department">Department Goal</SelectItem>
                <SelectItem value="personal">Personal Goal</SelectItem>
                <SelectItem value="team">Team Goal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Priority Level</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => handleInputChange('priority', value as GoalPriority)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
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
            disabled={mode === 'edit'}
          >
            <SelectTrigger>
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