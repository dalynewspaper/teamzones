import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { CalendarIcon, InfoIcon, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Goal, GoalMetric, GoalType, GoalPriority, GoalTimeframe } from '@/types/goals'
import { createGoal } from '@/services/goalService'
import { format } from 'date-fns'

interface KeyResultWithMetrics {
  description: string
  targetDate: string
  metrics: {
    name: string
    target: number
    current: number
    unit: string
    frequency: 'monthly' | 'quarterly'
  }[]
}

export function AnnualGoalForm() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [metrics, setMetrics] = useState<Partial<GoalMetric>[]>([])
  const [keyResults, setKeyResults] = useState<KeyResultWithMetrics[]>([{
    description: '',
    targetDate: '',
    metrics: []
  }])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'company' as GoalType,
    priority: 'high' as GoalPriority,
    startDate: new Date(2025, 0, 1).toISOString().split('T')[0],
    endDate: new Date(2025, 11, 31).toISOString().split('T')[0],
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

      const newGoal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        timeframe: 'annual',
        priority: formData.priority,
        status: 'not_started',
        progress: 0,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        metrics: metrics.map((m, i) => ({ ...m, id: `new-metric-${i}` })) as GoalMetric[],
        milestones: [],
        assignees: [],
        organizationId: user.organizationId,
        ownerId: user.uid,
        createdBy: user.uid,
        tags: []
      }

      await createGoal(newGoal)
      toast({
        title: 'Goal created',
        description: 'Your new goal has been created successfully.'
      })
      router.push('/dashboard/goals')
    } catch (error) {
      console.error('Error creating goal:', error)
      toast({
        title: 'Error',
        description: 'Failed to create goal. Please try again.',
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

  return (
    <div className="space-y-8">
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
                <p className="max-w-xs">Annual goals should align with company strategy and provide clear direction for quarterly and monthly objectives.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
                <div className="space-y-4">
                  <Label>Success Metrics</Label>
                  {kr.metrics.map((metric, metricIndex) => (
                    <div key={metricIndex} className="flex gap-4 items-start">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={metric.name}
                          onChange={(e) => handleKeyResultMetricChange(krIndex, metricIndex, 'name', e.target.value)}
                          placeholder="e.g., ARR Growth Rate"
                        />
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={metric.target || ''}
                            onChange={(e) => handleKeyResultMetricChange(krIndex, metricIndex, 'target', e.target.value)}
                            placeholder="Target"
                            className="w-24"
                          />
                          <Input
                            type="text"
                            value={metric.unit}
                            onChange={(e) => handleKeyResultMetricChange(krIndex, metricIndex, 'unit', e.target.value)}
                            placeholder="Unit"
                            className="w-20"
                          />
                          <Select
                            value={metric.frequency}
                            onValueChange={(value) => handleKeyResultMetricChange(krIndex, metricIndex, 'frequency', value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Frequency" />
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
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddKeyResultMetric(krIndex)}
                  >
                    Add Metric
                  </Button>
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

      {/* Metrics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">Success Metrics</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <InfoIcon className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Define 1-3 key metrics that will be tracked to measure progress.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <Card key={index} className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Metric Name</Label>
                  <Input
                    placeholder="e.g., ARR Growth Rate"
                    value={metric.name}
                    onChange={(e) => handleMetricChange(index, 'name', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Unit</Label>
                  <Input
                    placeholder="e.g., %"
                    value={metric.unit}
                    onChange={(e) => handleMetricChange(index, 'unit', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Target Value</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 30"
                    value={metric.target}
                    onChange={(e) => handleMetricChange(index, 'target', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Current Value</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 0"
                    value={metric.current}
                    onChange={(e) => handleMetricChange(index, 'current', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Tracking Frequency</Label>
                  <Select
                    value={metric.frequency as string}
                    onValueChange={(value) => handleMetricChange(index, 'frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          ))}

          {metrics.length < 3 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleAddMetric}
              className="w-full"
            >
              Add Metric
            </Button>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/goals')}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.title}
        >
          {isSubmitting ? 'Creating...' : 'Create Goal'}
        </Button>
      </div>
    </div>
  )
} 