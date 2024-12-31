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
import { Goal, GoalMetric, GoalType, GoalPriority, GoalTimeframe } from '@/types/goals'
import { createGoal, updateGoal } from '@/services/goalService'
import { enhanceGoal } from '@/services/openaiService'
import { format } from 'date-fns'

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
    frequency: 'monthly' | 'quarterly'
  }[]
}

interface AnnualGoalFormProps {
  initialData?: Goal
  mode?: 'create' | 'edit'
}

export function AnnualGoalForm({ initialData, mode = 'create' }: AnnualGoalFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [metrics, setMetrics] = useState<Partial<GoalMetric>[]>(initialData?.metrics || [])
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
        frequency: m.frequency as 'monthly' | 'quarterly'
      }))
    })) || [{
      description: '',
      targetDate: '',
      metrics: []
    }]
  )
  const [isEnhancing, setIsEnhancing] = useState(false)

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: initialData?.type || 'company' as GoalType,
    priority: initialData?.priority || 'high' as GoalPriority,
    startDate: initialData?.startDate.toISOString().split('T')[0] || new Date(2025, 0, 1).toISOString().split('T')[0],
    endDate: initialData?.endDate.toISOString().split('T')[0] || new Date(2025, 11, 31).toISOString().split('T')[0],
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleKeyResultChange = (index: number, field: keyof KeyResultWithMetrics, value: any) => {
    const newKeyResults = [...keyResults]
    newKeyResults[index] = { ...newKeyResults[index], [field]: value }
    setKeyResults(newKeyResults)
  }

  const handleAddKeyResult = () => {
    setKeyResults([...keyResults, { description: '', targetDate: '', metrics: [] }])
  }

  const handleMetricChange = (index: number, field: keyof GoalMetric, value: any) => {
    const newMetrics = [...metrics]
    if (field === 'target' || field === 'current') {
      value = value === '' ? 0 : Number(value)
    }
    newMetrics[index] = { ...newMetrics[index], [field]: value }
    setMetrics(newMetrics)
  }

  const handleDeleteMetric = (index: number) => {
    setMetrics(metrics.filter((_, i) => i !== index))
  }

  const handleAddMetric = () => {
    setMetrics(prev => [...prev, {
      name: '',
      target: 0,
      current: 0,
      unit: '',
      frequency: 'quarterly'
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
          id: kr.id || `new-kr-${i}`,
          description: kr.description,
          targetDate: kr.targetDate,
          metrics: kr.metrics.map((m, j) => ({
            ...m,
            id: m.id || `new-kr-${i}-metric-${j}`
          }))
        })),
        milestones: initialData?.milestones || [],
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
          description: 'Your goal has been updated successfully.'
        })
      } else {
        await createGoal(goalData)
        toast({
          title: 'Goal created',
          description: 'Your new goal has been created successfully.'
        })
      }
      
      router.push('/dashboard/goals')
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

  const quarters = [
    { label: 'Q1', date: new Date(2025, 2, 31) },
    { label: 'Q2', date: new Date(2025, 5, 30) },
    { label: 'Q3', date: new Date(2025, 8, 30) },
    { label: 'Q4', date: new Date(2025, 11, 31) }
  ]

  const handleDeleteKeyResult = (index: number) => {
    setKeyResults(keyResults.filter((_, i) => i !== index))
  }

  const handleKeyResultMetricChange = (keyResultIndex: number, metricIndex: number, field: string, value: any) => {
    const newKeyResults = [...keyResults]
    if (field === 'target' || field === 'current') {
      value = value === '' ? 0 : Number(value)
    }
    newKeyResults[keyResultIndex].metrics[metricIndex] = {
      ...newKeyResults[keyResultIndex].metrics[metricIndex],
      [field]: value
    }
    setKeyResults(newKeyResults)
  }

  const handleAddKeyResultMetric = (keyResultIndex: number) => {
    const newKeyResults = [...keyResults]
    newKeyResults[keyResultIndex].metrics.push({
      name: '',
      target: 0,
      current: 0,
      unit: '',
      frequency: 'quarterly'
    })
    setKeyResults(newKeyResults)
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
        'Annual (2025)'
      )

      // Update form with enhanced content
      setFormData(prev => ({
        ...prev,
        title: suggestions.enhancedTitle,
        description: suggestions.enhancedDescription
      }))

      // Update key results with suggestions, adding current: 0 to each metric
      setKeyResults(suggestions.keyResults.map(kr => ({
        ...kr,
        metrics: kr.metrics.map(metric => ({
          ...metric,
          current: 0 // Initialize current value to 0
        }))
      })))

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
                    placeholder="e.g., Achieve $10M ARR by Q4"
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
                      <SelectValue placeholder="Select quarter" />
                    </SelectTrigger>
                    <SelectContent>
                      {quarters.map((q) => (
                        <SelectItem key={q.label} value={q.date.toISOString()}>
                          {q.label} (Due {format(q.date, 'MM/dd/yyyy')})
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
                                placeholder="e.g., ARR Growth Rate"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>Unit</Label>
                              <Input
                                type="text"
                                value={metric.unit}
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
                                type="text"
                                inputMode="numeric"
                                value={metric.target || ''}
                                onChange={(e) => handleKeyResultMetricChange(krIndex, metricIndex, 'target', e.target.value)}
                                placeholder="0"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>Current Value</Label>
                              <Input
                                type="text"
                                inputMode="numeric"
                                value={metric.current || ''}
                                onChange={(e) => handleKeyResultMetricChange(krIndex, metricIndex, 'current', e.target.value)}
                                placeholder="0"
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Tracking Frequency</Label>
                            <Select
                              value={metric.frequency}
                              onValueChange={(value) => handleKeyResultMetricChange(krIndex, metricIndex, 'frequency', value)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Quarterly" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteKeyResultMetric(krIndex, metricIndex)}
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

        {keyResults.length < 5 && (
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