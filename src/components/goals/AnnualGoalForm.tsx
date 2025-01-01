import { useState } from 'react'
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
import { Goal, GoalMetric, GoalType, GoalPriority, GoalTimeframe, GoalStatus, KeyResult } from '@/types/goals'
import { createGoal, updateGoal } from '@/services/goalService'
import { enhanceGoal } from '@/services/openaiService'
import { format } from 'date-fns'

interface AnnualGoalFormProps {
  initialData?: Goal
  mode?: 'create' | 'edit'
  onSuccess?: () => void
}

export function AnnualGoalForm({ initialData, mode = 'create', onSuccess }: AnnualGoalFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: initialData?.type || 'team' as GoalType,
    priority: initialData?.priority || 'high' as GoalPriority,
    startDate: initialData?.startDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    endDate: initialData?.endDate?.toISOString().split('T')[0] || new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
  })

  const [metrics, setMetrics] = useState<Partial<GoalMetric>[]>(initialData?.metrics || [])
  const [keyResults, setKeyResults] = useState<Partial<KeyResult>[]>(initialData?.keyResults || [])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleKeyResultChange = (index: number, field: keyof KeyResult, value: string) => {
    setKeyResults(prev => {
      const newKeyResults = [...prev]
      newKeyResults[index] = { 
        ...newKeyResults[index], 
        [field]: value,
        id: newKeyResults[index]?.id || `kr-${index}`
      }
      return newKeyResults
    })
  }

  const handleAddKeyResult = () => {
    setKeyResults(prev => [...prev, {
      id: `kr-${prev.length}`,
      description: '',
      targetDate: formData.endDate,
      metrics: []
    }])
  }

  const handleMetricChange = (index: number, field: keyof GoalMetric, value: string | number) => {
    setMetrics(prev => {
      const newMetrics = [...prev]
      if (field === 'target' || field === 'current') {
        value = value === '' ? 0 : Number(value)
      }
      newMetrics[index] = { 
        ...newMetrics[index], 
        [field]: value,
        id: newMetrics[index]?.id || `metric-${index}`
      }
      return newMetrics
    })
  }

  const handleDeleteMetric = (index: number) => {
    setMetrics(metrics.filter((_, i) => i !== index))
  }

  const handleAddMetric = () => {
    setMetrics(prev => [...prev, {
      id: `metric-${prev.length}`,
      name: '',
      target: 0,
      current: 0,
      unit: '',
      frequency: 'quarterly'
    }])
  }

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create or edit goals.",
        variant: "destructive"
      })
      return
    }

    if (!user.organizationId) {
      toast({
        title: "Organization required",
        description: "You need to be part of an organization to manage goals.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)

      const goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        timeframe: 'annual',
        priority: formData.priority,
        status: initialData?.status || 'not_started',
        progress: initialData?.progress || 0,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        metrics: metrics.map((m, i) => ({ 
          ...m, 
          id: m.id || `new-metric-${i}` 
        })) as GoalMetric[],
        keyResults: keyResults.map((kr, i) => ({
          ...kr,
          id: kr.id || `new-kr-${i}`,
          metrics: kr.metrics?.map((m, j) => ({
            ...m,
            id: m.id || `new-kr-${i}-metric-${j}`
          })) || []
        })) as KeyResult[],
        milestones: [],
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
          description: 'Your annual goal has been updated successfully.'
        })
      } else {
        await createGoal(goalData)
        toast({
          title: 'Goal created',
          description: 'Your new annual goal has been created successfully.'
        })
      }
      
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/dashboard/goals')
      }
    } catch (error) {
      console.error('Error saving goal:', error)
      let errorMessage = 'An unexpected error occurred. Please try again.'
      
      if (error instanceof Error) {
        if (error.message.includes('PERMISSION_DENIED')) {
          errorMessage = 'You do not have permission to perform this action. Please check your organization membership.'
        } else if (error.message.includes('organizationId')) {
          errorMessage = 'Organization information is missing. Please ensure you are part of an organization.'
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const quarters = [
    { label: 'Q1', date: new Date(2025, 2, 31) },
    { label: 'Q2', date: new Date(2025, 5, 30) },
    { label: 'Q3', date: new Date(2025, 8, 30) },
    { label: 'Q4', date: new Date(2025, 11, 31) }
  ]

  const handleDeleteKeyResult = (index: number) => {
    setKeyResults(keyResults.filter((_, i) => i !== index))
  }

  const handleKeyResultMetricChange = (krIndex: number, metricIndex: number, field: keyof GoalMetric, value: string | number) => {
    setKeyResults(prev => {
      const newKeyResults = [...prev]
      const keyResult = newKeyResults[krIndex]
      
      if (!keyResult) return prev
      
      const defaultMetric: GoalMetric = {
        id: `kr-${krIndex}-metric-${metricIndex}`,
        name: '',
        target: 0,
        current: 0,
        unit: '',
        frequency: 'quarterly'
      }

      // Initialize metrics array if it doesn't exist
      if (!Array.isArray(keyResult.metrics)) {
        keyResult.metrics = []
      }

      // Get existing metric or use default
      const existingMetric = keyResult.metrics[metricIndex] || defaultMetric
      
      // Convert value based on field type
      const processedValue = field === 'target' || field === 'current'
        ? (value === '' ? 0 : Number(value))
        : String(value)
      
      // Create updated metric with the new value
      const updatedMetric: GoalMetric = {
        id: existingMetric.id,
        name: field === 'name' ? processedValue as string : existingMetric.name,
        target: field === 'target' ? processedValue as number : existingMetric.target,
        current: field === 'current' ? processedValue as number : existingMetric.current,
        unit: field === 'unit' ? processedValue as string : existingMetric.unit,
        frequency: 'quarterly'
      }
      
      // Update the metrics array
      const metrics = keyResult.metrics || []
      metrics[metricIndex] = updatedMetric
      keyResult.metrics = metrics
      
      return newKeyResults
    })
  }

  const handleAddKeyResultMetric = (krIndex: number) => {
    setKeyResults(prev => {
      const newKeyResults = [...prev]
      const keyResult = newKeyResults[krIndex]
      
      if (!keyResult) return prev
      if (!keyResult.metrics) {
        keyResult.metrics = []
      }

      const newMetric: GoalMetric = {
        id: `kr-${krIndex}-metric-${keyResult.metrics.length}`,
        name: '',
        target: 0,
        current: 0,
        unit: '',
        frequency: 'quarterly'
      }

      keyResult.metrics = [...keyResult.metrics, newMetric]
      return newKeyResults
    })
  }

  const handleDeleteKeyResultMetric = (keyResultIndex: number, metricIndex: number) => {
    const newKeyResults = [...keyResults]
    newKeyResults[keyResultIndex].metrics = newKeyResults[keyResultIndex].metrics.filter((_, i) => i !== metricIndex)
    setKeyResults(newKeyResults)
  }

  const handleEnhanceWithAI = async () => {
    if (!formData.title) {
      toast({
        title: "Missing information",
        description: "Please enter a goal title first.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsEnhancing(true)
      const suggestions = await enhanceGoal(
        formData.title,
        formData.description,
        'Annual',
        {
          generateMetrics: true,
          timeframe: 'annual'
        }
      )

      // Update form data with AI suggestions
      setFormData(prev => ({
        ...prev,
        title: suggestions.enhancedTitle || prev.title,
        description: suggestions.enhancedDescription || prev.description
      }))

      // Update metrics with AI suggestions
      if (suggestions.metrics && suggestions.metrics.length > 0) {
        setMetrics(suggestions.metrics.map((m, index) => ({
          id: `new-metric-${index}`,
          name: m.name || '',
          target: m.target || 0,
          current: 0,
          unit: m.unit || '',
          frequency: 'quarterly' as GoalTimeframe
        })))
      }

      toast({
        title: "Goal enhanced",
        description: "AI has helped improve your goal description and added suggested metrics."
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
                  <p className="max-w-xs">Annual goals should align with company strategy and provide clear direction for quarterly and monthly objectives.</p>
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
          <Label>Goal Title</Label>
          <Input
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="e.g., Increase ARR by 30% by end of 2025"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Strategic Impact</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe how this goal aligns with company strategy and its expected impact"
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
                <SelectItem value="company">Company Goal</SelectItem>
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
          <div className="mt-1 p-4 bg-gray-50 rounded-md">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gray-500" />
              <span>Fiscal Year 2025</span>
            </div>
            <div className="mt-2 flex gap-2">
              {quarters.map((q) => (
                <Badge key={q.label} variant="outline">
                  {q.label}: Due {q.date.toLocaleDateString()}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Key Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">Key Results</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddKeyResult}
          >
            Add Key Result
          </Button>
        </div>

        {keyResults.map((kr, krIndex) => (
          <Card key={krIndex} className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Key Result {krIndex + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setKeyResults(prev => prev.filter((_, i) => i !== krIndex))
                  }}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={kr.description || ''}
                  onChange={(e) => handleKeyResultChange(krIndex, 'description', e.target.value)}
                  placeholder="Describe what needs to be achieved"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Target Date</Label>
                <Input
                  type="date"
                  value={kr.targetDate || ''}
                  onChange={(e) => handleKeyResultChange(krIndex, 'targetDate', e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Metrics for this Key Result */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Success Metrics</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddKeyResultMetric(krIndex)}
                  >
                    Add Metric
                  </Button>
                </div>

                {kr.metrics?.map((metric, metricIndex) => (
                  <div key={metricIndex} className="p-4 bg-gray-50 rounded-lg space-y-4">
                    <div className="flex gap-4 items-start">
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Metric Name</Label>
                            <Input
                              value={metric.name || ''}
                              onChange={(e) => handleKeyResultMetricChange(krIndex, metricIndex, 'name', e.target.value)}
                              placeholder="e.g., ARR Growth Rate"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Unit</Label>
                            <Input
                              type="text"
                              value={metric.unit || ''}
                              onChange={(e) => handleKeyResultMetricChange(krIndex, metricIndex, 'unit', e.target.value)}
                              placeholder="e.g., %"
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Target Value</Label>
                            <Input
                              type="number"
                              value={metric.target || 0}
                              onChange={(e) => handleKeyResultMetricChange(krIndex, metricIndex, 'target', e.target.value)}
                              placeholder="e.g., 100"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Current Value</Label>
                            <Input
                              type="number"
                              value={metric.current || 0}
                              onChange={(e) => handleKeyResultMetricChange(krIndex, metricIndex, 'current', e.target.value)}
                              placeholder="e.g., 0"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setKeyResults(prev => {
                            const newKeyResults = [...prev]
                            const keyResult = newKeyResults[krIndex]
                            if (!keyResult?.metrics) return prev
                            keyResult.metrics = keyResult.metrics.filter((_, i) => i !== metricIndex)
                            return newKeyResults
                          })
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

      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => router.push(mode === 'edit' ? `/dashboard/goals/${initialData?.id}` : '/dashboard/goals')}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.title}
        >
          {isSubmitting ? (mode === 'edit' ? 'Updating...' : 'Creating...') : (mode === 'edit' ? 'Update Goal' : 'Create Goal')}
        </Button>
      </div>
    </div>
  )
} 