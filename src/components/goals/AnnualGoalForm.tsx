import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { CalendarIcon, InfoIcon, XCircle, Sparkles, Target, Lightbulb, AlertCircle, RotateCw, CheckIcon, PlusIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Goal, GoalMetric, GoalType, GoalPriority, GoalTimeframe, GoalStatus, GoalKeyResult } from '@/types/goals'
import { createGoal, updateGoal, deleteGoal } from '@/services/goalService'
import { enhanceGoal } from '@/services/openaiService'
import { format } from 'date-fns'
import { eventBus } from '@/lib/eventBus'

interface AnnualGoalFormProps {
  initialData?: Goal
  mode?: 'create' | 'edit'
  onSuccess?: () => void
}

interface AssigneeSelection {
  userId: string
  role: 'owner' | 'contributor' | 'reviewer'
}

interface TeamSelection {
  teamId: string
  role: 'primary' | 'supporting'
}

interface GoalTemplate {
  id: string
  title: string
  description: string
  type: GoalType
  metrics: Array<{
    name: string
    unit: string
    target: number
    current: number
  }>
}

const goalTemplates: GoalTemplate[] = [
  {
    id: 'revenue',
    title: 'Revenue Growth',
    description: 'Achieve significant revenue growth through market expansion and product innovation',
    type: 'company',
    metrics: [
      { name: 'Annual Recurring Revenue (ARR)', unit: '$', target: 0, current: 0 },
      { name: 'Customer Acquisition Rate', unit: '%', target: 0, current: 0 }
    ]
  },
  {
    id: 'product',
    title: 'Product Innovation',
    description: 'Launch new product features and improve user experience',
    type: 'department',
    metrics: [
      { name: 'Feature Adoption Rate', unit: '%', target: 0, current: 0 },
      { name: 'User Satisfaction Score', unit: '/10', target: 0, current: 0 }
    ]
  },
  {
    id: 'team',
    title: 'Team Growth & Development',
    description: 'Build and develop high-performing teams',
    type: 'team',
    metrics: [
      { name: 'Employee Satisfaction', unit: '%', target: 0, current: 0 },
      { name: 'Training Hours per Employee', unit: 'hours', target: 0, current: 0 }
    ]
  }
]

interface KeyResultExample {
  description: string
  metrics: Array<{
    name: string
    unit: string
    target: number
    current: number
  }>
}

type KeyResultExamples = {
  [K in 'revenue' | 'product' | 'team']: KeyResultExample[]
}

const keyResultExamples: KeyResultExamples = {
  revenue: [
    { description: "Increase Annual Recurring Revenue (ARR) from $X to $Y million", metrics: [{ name: "ARR", unit: "$", target: 0, current: 0 }] },
    { description: "Achieve a Net Revenue Retention (NRR) rate of X%", metrics: [{ name: "NRR", unit: "%", target: 0, current: 0 }] }
  ],
  product: [
    { description: "Achieve a Net Promoter Score (NPS) of X", metrics: [{ name: "NPS", unit: "points", target: 0, current: 0 }] },
    { description: "Increase feature adoption rate to X% across all users", metrics: [{ name: "Feature Adoption", unit: "%", target: 0, current: 0 }] }
  ],
  team: [
    { description: "Improve employee engagement score from X to Y", metrics: [{ name: "Engagement Score", unit: "/10", target: 0, current: 0 }] },
    { description: "Reduce team turnover rate to X%", metrics: [{ name: "Turnover Rate", unit: "%", target: 0, current: 0 }] }
  ]
}

export function AnnualGoalForm({ initialData, mode = 'create', onSuccess }: AnnualGoalFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(true)
  const [suggestedKeyResults, setSuggestedKeyResults] = useState<KeyResultExample[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set())
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: initialData?.type || 'team' as GoalType,
    priority: initialData?.priority || 'high' as GoalPriority,
    startDate: initialData?.startDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    endDate: initialData?.endDate?.toISOString().split('T')[0] || new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
  })

  const [metrics, setMetrics] = useState<Partial<GoalMetric>[]>(initialData?.metrics || [])
  const [keyResults, setKeyResults] = useState<Partial<GoalKeyResult>[]>(initialData?.keyResults || [])
  const [selectedAssignees, setSelectedAssignees] = useState<AssigneeSelection[]>(
    initialData?.assignees?.map(a => ({
      userId: a.userId,
      role: a.role
    })) || []
  )

  const [selectedTeams, setSelectedTeams] = useState<TeamSelection[]>(
    initialData?.teamRoles?.map(tr => ({
      teamId: tr.teamId,
      role: tr.role
    })) || []
  )

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleKeyResultChange = (index: number, field: keyof GoalKeyResult, value: string) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.organizationId) return

    try {
      const goalData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        timeframe: 'annual' as const,
        status: 'not_started' as const,
        progress: 0,
        startDate: new Date(),
        endDate: new Date(new Date().getFullYear(), 11, 31), // December 31st of current year
        metrics: [],
        milestones: [],
        keyResults: keyResults.map(kr => ({
          ...kr,
          id: kr.id || `new-kr-${Date.now()}`,
          metrics: kr.metrics?.map((m, i) => ({
            ...m,
            id: m.id || `new-metric-${i}`
          })) || []
        })) as GoalKeyResult[],
        organizationId: user.organizationId,
        ownerId: user.uid,
        createdBy: user.uid,
        tags: [],
        assignees: selectedAssignees.length > 0 ? [{
          userId: selectedAssignees[0].userId,
          role: 'owner' as const,
          assignedAt: new Date()
        }] : [],
        teamRoles: selectedTeams.length > 0 ? [{
          teamId: selectedTeams[0].teamId,
          role: 'primary' as const
        }] : []
      }

      const savedGoal = await createGoal(goalData)

      // Emit the event with the complete goal data
      eventBus.emit('goalCreated', savedGoal)

      // Call onSuccess if provided
      if (onSuccess) {
        onSuccess()
      }

      // Navigate after emitting event and handling success
      router.replace('/dashboard/goals')
    } catch (error) {
      console.error('Error creating goal:', error)
      toast({
        title: 'Error',
        description: 'Failed to create goal. Please try again.',
        variant: 'destructive',
      })
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
    const keyResult = newKeyResults[keyResultIndex]
    if (!keyResult?.metrics) return
    keyResult.metrics = keyResult.metrics.filter((_, i) => i !== metricIndex)
    setKeyResults(newKeyResults)
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = goalTemplates.find(t => t.id === templateId)
    if (template) {
      setFormData(prev => ({
        ...prev,
        title: template.title,
        description: template.description,
        type: template.type
      }))
      setMetrics(template.metrics.map(m => ({
        name: m.name,
        unit: m.unit,
        target: m.target,
        current: m.current,
        frequency: 'quarterly' as GoalTimeframe
      })))
      setSelectedTemplate(templateId)
    }
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

      setFormData(prev => ({
        ...prev,
        title: suggestions.enhancedTitle || prev.title,
        description: suggestions.enhancedDescription || prev.description
      }))

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
        description: "AI has helped improve your goal with industry best practices and suggested metrics."
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
      eventBus.emit('goalDeleted', initialData.id)
      toast({
        title: 'Goal deleted',
        description: 'Your annual goal has been deleted successfully.'
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

  const generateKeyResultSuggestions = async () => {
    if (!formData.title || !formData.description) {
      toast({
        title: "Missing information",
        description: "Please enter both a goal title and strategic impact description to get contextual suggestions.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsLoadingSuggestions(true)
      setSelectedSuggestions(new Set())

      const suggestions = await enhanceGoal(
        formData.title,
        formData.description,
        'Annual',
        {
          generateMetrics: true,
          timeframe: 'annual'
        }
      )

      if (suggestions.metrics && suggestions.metrics.length > 0) {
        // Filter out metrics that don't have all required properties and cast to correct type
        const validMetrics = suggestions.metrics.filter((metric): metric is GoalMetric => 
          typeof metric.name === 'string' && 
          typeof metric.unit === 'string' && 
          typeof metric.target === 'number'
        )

        // Transform the valid metrics into key result suggestions
        const formattedSuggestions: KeyResultExample[] = validMetrics.map(metric => ({
          description: `Achieve ${metric.name} of ${metric.target}${metric.unit} by end of year`,
          metrics: [{
            name: metric.name,
            unit: metric.unit,
            target: metric.target,
            current: 0
          }]
        }))

        setSuggestedKeyResults(formattedSuggestions)
      } else {
        toast({
          title: "No suggestions available",
          description: "Could not generate suggestions based on the current goal. Try adding more details to your goal description.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error generating key result suggestions:', error)
      toast({
        title: "Error",
        description: "Failed to generate suggestions. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const handleAddSelectedSuggestions = () => {
    const newKeyResults = Array.from(selectedSuggestions).map(index => {
      const suggestion = suggestedKeyResults[index]
      return {
        id: `kr-${keyResults.length + index}`,
        description: suggestion.description,
        targetDate: formData.endDate,
        metrics: suggestion.metrics.map((m, i) => ({
          id: `kr-${keyResults.length + index}-metric-${i}`,
          name: m.name,
          unit: m.unit,
          target: m.target,
          current: m.current,
          frequency: 'quarterly' as GoalTimeframe
        }))
      }
    })
    setKeyResults([...keyResults, ...newKeyResults])
    setSelectedSuggestions(new Set())
  }

  // Update the useEffect to trigger suggestions more quickly
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (formData.title) {
        generateKeyResultSuggestions()
      }
    }, 500) // Reduced debounce time to 500ms

    return () => clearTimeout(debounceTimer)
  }, [formData.title, formData.description])

  return (
    <div className="space-y-8">
      {/* Smart Assistant Section */}
      {showSmartSuggestions && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-blue-100">
              <Lightbulb className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900">Smart Goal Assistant</h3>
              <p className="text-sm text-blue-700 mt-1">
                Start with a template to create an effective annual goal.
              </p>
              <div className="mt-4">
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {goalTemplates.map(template => (
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

      {/* Main Form */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Label>Goal Title</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Make your goal specific and measurable. Good example: "Increase ARR by 30% by end of 2025"</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button
              variant="secondary"
              onClick={handleEnhanceWithAI}
              disabled={isEnhancing}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
            </Button>
          </div>
          <Input
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="e.g., Increase ARR by 30% by end of 2025"
            className="mt-1"
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label>Strategic Impact</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Explain how this goal aligns with company strategy and what impact it will have on the business.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
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
          <div className="space-y-1">
            <Label className="text-lg font-semibold">Key Results</Label>
            <p className="text-sm text-muted-foreground">Define 2-5 measurable outcomes that will indicate success</p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddKeyResult}
                  disabled={keyResults.length >= 5}
                >
                  Add Key Result
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p>Good key results are specific, measurable, and time-bound. Add up to 5 key results.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {keyResults.length === 0 && (
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center text-center mb-8">
              <Target className="h-8 w-8 text-muted-foreground mb-4" />
              <h4 className="font-medium mb-2">No Key Results Added</h4>
              <p className="text-sm text-muted-foreground max-w-md">
                Key Results help track progress towards your goal. They should be specific, measurable outcomes that indicate success.
              </p>
            </div>

            <div className="space-y-6">
              {/* Smart Suggestions Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-sm">AI-Generated Suggestions</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {isLoadingSuggestions ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                        Generating...
                      </div>
                    ) : formData.title ? (
                      <>
                        {selectedSuggestions.size > 0 && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleAddSelectedSuggestions}
                            className="gap-2"
                          >
                            Add Selected ({selectedSuggestions.size})
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={generateKeyResultSuggestions}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <RotateCw className="h-4 w-4 mr-1" />
                          Refresh
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>

                {!formData.title ? (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Enter your goal title above to get AI-generated suggestions</p>
                  </div>
                ) : suggestedKeyResults.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                    {suggestedKeyResults.map((suggestion, index) => (
                      <TooltipProvider key={index}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={selectedSuggestions.has(index) ? "secondary" : "outline"}
                              className={`group h-auto p-4 justify-start text-left relative hover:border-blue-200 hover:bg-blue-50/50 ${
                                selectedSuggestions.has(index) ? 'border-blue-200 bg-blue-50' : ''
                              }`}
                              onClick={() => {
                                setSelectedSuggestions(prev => {
                                  const next = new Set(prev)
                                  if (next.has(index)) {
                                    next.delete(index)
                                  } else {
                                    next.add(index)
                                  }
                                  return next
                                })
                              }}
                            >
                              <div className="w-full pr-8">
                                <div className="font-medium text-sm text-foreground mb-1.5 line-clamp-2">
                                  {suggestion.description}
                                </div>
                                {suggestion.metrics[0] && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500/15" />
                                    <div className="flex items-center gap-1 truncate">
                                      <span className="truncate">{suggestion.metrics[0].name}:</span>
                                      <span className="flex-shrink-0 tabular-nums">
                                        {suggestion.metrics[0].target}
                                        {suggestion.metrics[0].unit}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {selectedSuggestions.has(index) ? (
                                <div className="absolute top-3 right-3">
                                  <CheckIcon className="h-4 w-4 text-blue-600" />
                                </div>
                              ) : (
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <PlusIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-sm p-4">
                            <div className="space-y-3">
                              <div>
                                <div className="font-medium mb-1">Description</div>
                                <div className="text-sm">{suggestion.description}</div>
                              </div>
                              {suggestion.metrics.map((metric, i) => (
                                <div key={i}>
                                  <div className="font-medium mb-1">Metric {i + 1}</div>
                                  <div className="text-sm space-y-1">
                                    <div>Name: {metric.name}</div>
                                    <div>Target: {metric.target}{metric.unit}</div>
                                    <div>Measurement: {metric.unit}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                ) : !isLoadingSuggestions && (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">No suggestions available. Try updating your goal title or description.</p>
                  </div>
                )}
              </div>

              {/* Quick Templates Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                  <h4 className="font-medium text-sm">Quick Templates</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-3 px-4 justify-start text-left"
                    onClick={() => {
                      setKeyResults([...keyResults, {
                        id: `kr-${keyResults.length}`,
                        description: "Achieve quarterly revenue milestones",
                        targetDate: formData.endDate,
                        metrics: [{
                          id: `kr-${keyResults.length}-metric-0`,
                          name: "Quarterly Revenue",
                          unit: "€",
                          target: 50000,
                          current: 0,
                          frequency: 'quarterly' as GoalTimeframe
                        }]
                      }])
                    }}
                  >
                    <div>
                      <span className="text-sm font-medium">Quarterly Milestones</span>
                      <div className="text-xs text-muted-foreground mt-1">Track progress through quarterly targets</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-3 px-4 justify-start text-left"
                    onClick={() => {
                      setKeyResults([...keyResults, {
                        id: `kr-${keyResults.length}`,
                        description: "Maintain high customer satisfaction",
                        targetDate: formData.endDate,
                        metrics: [{
                          id: `kr-${keyResults.length}-metric-0`,
                          name: "Customer Satisfaction Score",
                          unit: "/10",
                          target: 9,
                          current: 0,
                          frequency: 'quarterly' as GoalTimeframe
                        }]
                      }])
                    }}
                  >
                    <div>
                      <span className="text-sm font-medium">Customer Success</span>
                      <div className="text-xs text-muted-foreground mt-1">Focus on customer satisfaction metrics</div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {keyResults.map((kr, krIndex) => (
          <Card key={krIndex} className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">Key Result {krIndex + 1}</h4>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Key Results should be specific, measurable outcomes that indicate success. Include both the current and target states.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteKeyResult(krIndex)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label>Description</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Format: "Increase/Decrease [Metric] from X to Y by [Date]" or "Achieve [Specific Outcome] by [Date]"</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea
                  value={kr.description || ''}
                  onChange={(e) => handleKeyResultChange(krIndex, 'description', e.target.value)}
                  placeholder="e.g., Increase customer satisfaction score from 7.5 to 9.0"
                  className="mt-1"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label>Target Date</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">When do you expect to achieve this key result? This should be within the annual goal timeframe.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  type="date"
                  value={kr.targetDate || ''}
                  onChange={(e) => handleKeyResultChange(krIndex, 'targetDate', e.target.value)}
                  min={formData.startDate}
                  max={formData.endDate}
                  className="mt-1"
                />
              </div>

              {/* Metrics for this Key Result */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Success Metrics</Label>
                    <p className="text-sm text-muted-foreground">Quantifiable measures to track progress</p>
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
                              placeholder="e.g., Customer Satisfaction Score"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Unit</Label>
                            <Input
                              type="text"
                              value={metric.unit || ''}
                              onChange={(e) => handleKeyResultMetricChange(krIndex, metricIndex, 'unit', e.target.value)}
                              placeholder="e.g., points, %, $"
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
                                    <p className="max-w-xs">The final value you aim to achieve by the target date</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Input
                              type="number"
                              value={metric.target || 0}
                              onChange={(e) => handleKeyResultMetricChange(krIndex, metricIndex, 'target', e.target.value)}
                              placeholder="e.g., 95"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Label>Current Value</Label>
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
                              value={metric.current || 0}
                              onChange={(e) => handleKeyResultMetricChange(krIndex, metricIndex, 'current', e.target.value)}
                              placeholder="e.g., 82"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteKeyResultMetric(krIndex, metricIndex)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
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