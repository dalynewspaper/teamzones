'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'
import { CalendarIcon, InfoIcon, XCircle, Sparkles, ListTodo, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Goal, GoalMetric, GoalType, GoalPriority, GoalTimeframe, GoalStatus, GoalMilestone } from '@/types/goals'
import { createGoal, updateGoal, getGoalsByTimeframe, deleteGoal } from '@/services/goalService'
import { enhanceGoal } from '@/services/openaiService'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, getISOWeek, parseISO } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { TeamMember, UserProfile } from '@/types/firestore'
import { getUserTeams } from '@/services/teamService'
import { getUserProfile } from '@/services/userService'

interface WeeklyGoalFormProps {
  initialData?: Goal
  mode?: 'create' | 'edit'
  onSuccess?: () => void
  parentGoalId?: string
  selectedWeek?: Date
}

interface TeamMemberWithProfile extends TeamMember {
  profile?: UserProfile;
}

export function WeeklyGoalForm({ initialData, mode = 'create', onSuccess, parentGoalId, selectedWeek: propSelectedWeek }: WeeklyGoalFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [monthlyGoals, setMonthlyGoals] = useState<Goal[]>([])
  const [selectedMonthlyGoal, setSelectedMonthlyGoal] = useState<Goal | null>(null)
  const [isLoadingMonthlyGoals, setIsLoadingMonthlyGoals] = useState(true)
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithProfile[]>([])
  const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(true)
  
  // State for selected week
  const [selectedWeek, setSelectedWeek] = useState<Date>(propSelectedWeek || new Date())
  
  // Calculate the start and end dates based on the calendar week
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }) // Start week on Monday
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 }) // End week on Sunday
  const calendarWeek = getISOWeek(selectedWeek)
  const year = selectedWeek.getFullYear()

  // Load team members
  useEffect(() => {
    async function loadTeamMembers() {
      if (!user?.organizationId) return;
      
      try {
        setIsLoadingTeamMembers(true);
        const teams = await getUserTeams(user.uid, user.organizationId);
        const members = teams.flatMap(team => team.members);
        
        // Fetch user profiles for each member
        const membersWithProfiles = await Promise.all(
          members.map(async (member) => {
            const profile = await getUserProfile(member.userId);
            return { ...member, profile: profile || undefined };
          })
        );
        
        setTeamMembers(membersWithProfiles);
      } catch (error) {
        console.error('Error loading team members:', error);
        toast({
          title: 'Error',
          description: 'Failed to load team members. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoadingTeamMembers(false);
      }
    }
    
    loadTeamMembers();
  }, [user?.organizationId, user?.uid, toast]);

  // Update form dates when selected week changes
  useEffect(() => {
    const newStartDate = format(weekStart, 'yyyy-MM-dd')
    const newEndDate = format(weekEnd, 'yyyy-MM-dd')
    
    setFormData(prev => ({
      ...prev,
      startDate: newStartDate,
      endDate: newEndDate
    }))
  }, [selectedWeek])

  const handlePreviousWeek = () => {
    setSelectedWeek(prev => subWeeks(prev, 1))
  }

  const handleNextWeek = () => {
    setSelectedWeek(prev => addWeeks(prev, 1))
  }

  const defaultStartDate = format(weekStart, 'yyyy-MM-dd')
  const defaultEndDate = format(weekEnd, 'yyyy-MM-dd')

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: initialData?.type || 'team' as GoalType,
    priority: initialData?.priority || 'high' as GoalPriority,
    startDate: initialData?.startDate?.toISOString().split('T')[0] || defaultStartDate,
    endDate: initialData?.endDate?.toISOString().split('T')[0] || defaultEndDate,
    assignee: initialData?.assignees?.[0]?.userId || user?.uid || '',
    status: initialData?.status || 'not_started' as GoalStatus
  })

  const [tasks, setTasks] = useState<Partial<GoalMilestone>[]>(
    initialData?.milestones || [
      {
        title: '',
        description: '',
        dueDate: new Date(defaultEndDate),
        status: 'not_started' as GoalStatus
      }
    ]
  )

  const [metrics, setMetrics] = useState<Partial<GoalMetric>[]>(initialData?.metrics || [])

  // Load monthly goals
  useEffect(() => {
    const loadMonthlyGoals = async () => {
      if (!user?.organizationId) return

      try {
        setIsLoadingMonthlyGoals(true)
        const goals = await getGoalsByTimeframe('monthly', user.organizationId)
        setMonthlyGoals(goals)
        
        if (parentGoalId) {
          const parentGoal = goals.find(g => g.id === parentGoalId)
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
  }, [user?.organizationId, parentGoalId])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleTaskChange = (index: number, field: keyof GoalMilestone, value: any) => {
    const newTasks = [...tasks]
    newTasks[index] = { ...newTasks[index], [field]: value }
    setTasks(newTasks)
  }

  const handleDeleteTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index))
  }

  const handleAddTask = () => {
    setTasks(prev => [...prev, {
      title: '',
      description: '',
      dueDate: new Date(formData.endDate),
      status: 'not_started' as GoalStatus
    }])
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
      frequency: 'weekly'
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
        timeframe: 'weekly',
        priority: formData.priority,
        status: formData.status,
        progress: initialData?.progress || 0,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        parentGoalId: selectedMonthlyGoal?.id || initialData?.parentGoalId,
        metrics: metrics.map((m, i) => ({ 
          ...m, 
          id: m.id || `new-metric-${i}` 
        })) as GoalMetric[],
        keyResults: [],
        milestones: tasks.map((t, i) => ({
          ...t,
          id: t.id || `new-task-${i}`
        })) as GoalMilestone[],
        assignees: [{
          userId: formData.assignee,
          role: 'owner',
          assignedAt: new Date()
        }],
        organizationId: user.organizationId,
        ownerId: initialData?.ownerId || user.uid,
        createdBy: initialData?.createdBy || user.uid,
        tags: initialData?.tags || []
      }

      if (mode === 'edit' && initialData) {
        await updateGoal(initialData.id, goalData)
        toast({
          title: 'Goal updated',
          description: 'Your weekly goal has been updated successfully.'
        })
      } else {
        await createGoal(goalData)
        toast({
          title: 'Goal created',
          description: 'Your new weekly goal has been created successfully.'
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
    if (!formData.title && !selectedMonthlyGoal) {
      toast({
        title: "Missing information",
        description: "Please enter a goal title or select a monthly goal first.",
        variant: "destructive"
      })
      return
    }

    try {
      setIsEnhancing(true)
      const suggestions = await enhanceGoal(
        formData.title,
        formData.description,
        `Weekly (${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')})`,
        {
          generateMilestones: true,
          generateMetrics: true,
          parentGoal: selectedMonthlyGoal ? {
            title: selectedMonthlyGoal.title,
            description: selectedMonthlyGoal.description,
            timeframe: 'monthly'
          } : undefined
        }
      )

      // Update form data with AI suggestions
      setFormData(prev => ({
        ...prev,
        title: suggestions.enhancedTitle || prev.title,
        description: suggestions.enhancedDescription || prev.description
      }))

      // Update tasks with AI suggestions
      if (suggestions.milestones && suggestions.milestones.length > 0) {
        setTasks(suggestions.milestones.map(m => ({
          title: m.title,
          description: m.description,
          dueDate: new Date(m.dueDate || formData.endDate),
          status: 'not_started' as GoalStatus
        })))
      }

      // Update metrics with AI suggestions
      if (suggestions.metrics && suggestions.metrics.length > 0) {
        setMetrics(suggestions.metrics.map(m => ({
          name: m.name,
          target: m.target || 0,
          current: 0,
          unit: m.unit || '',
          frequency: 'weekly'
        })))
      }

      toast({
        title: "Goal enhanced",
        description: "AI has helped improve your goal description and added suggested tasks and metrics."
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

  const handleSelectWeek = (date: Date | undefined) => {
    if (date) {
      setSelectedWeek(date)
      const newWeekStart = startOfWeek(date, { weekStartsOn: 1 })
      const newWeekEnd = endOfWeek(date, { weekStartsOn: 1 })
      setFormData(prev => ({
        ...prev,
        startDate: format(newWeekStart, 'yyyy-MM-dd'),
        endDate: format(newWeekEnd, 'yyyy-MM-dd')
      }))
    }
  }

  // Calculate current week dates
  const currentWeekStart = selectedWeek ? startOfWeek(selectedWeek, { weekStartsOn: 1 }) : new Date()
  const currentWeekEnd = selectedWeek ? endOfWeek(selectedWeek, { weekStartsOn: 1 }) : new Date()

  const handleDelete = async () => {
    if (!initialData?.id || !user?.organizationId) return

    try {
      setIsSubmitting(true)
      await deleteGoal(initialData.id)
      toast({
        title: 'Goal deleted',
        description: 'Your goal has been deleted successfully.'
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
      {/* Context Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">Weekly Goal Details</Label>
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Weekly goals should be specific, actionable tasks that contribute to monthly objectives.</p>
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

        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousWeek}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'justify-start text-left font-normal w-[280px]',
                  !selectedWeek && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedWeek ? (
                  <>CW {getISOWeek(selectedWeek)}, {format(selectedWeek, 'yyyy')}</>
                ) : (
                  <span>Pick a week</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedWeek}
                onSelect={handleSelectWeek}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextWeek}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {selectedWeek && (
          <div className="text-sm text-muted-foreground">
            Week starts on Monday {format(currentWeekStart, 'MMM d')} and ends on Sunday {format(currentWeekEnd, 'MMM d, yyyy')}
          </div>
        )}

        <div>
          <Label>Monthly Goal</Label>
          <Select
            value={selectedMonthlyGoal?.id}
            onValueChange={(value) => {
              const goal = monthlyGoals.find(g => g.id === value)
              setSelectedMonthlyGoal(goal || null)
            }}
          >
            <SelectTrigger className="mt-1">
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
            <p className="mt-2 text-sm text-gray-500">{selectedMonthlyGoal.description}</p>
          )}
        </div>

        <div>
          <Label>Goal Title</Label>
          <div className="flex gap-2">
            <Input
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Complete draft proposal for sales presentation"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label>Description & Success Criteria</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe what needs to be accomplished and what success looks like"
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

        <div>
          <Label>Assignee</Label>
          <Select
            value={formData.assignee}
            onValueChange={(value) => handleInputChange('assignee', value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select assignee" />
            </SelectTrigger>
            <SelectContent>
              {user && (
                <SelectItem key={`user-${user.uid}`} value={user.uid}>
                  {user.displayName || user.email} (Me)
                </SelectItem>
              )}
              {teamMembers
                .filter(member => member.userId !== user?.uid) // Filter out current user
                .map((member) => (
                  <SelectItem 
                    key={`member-${member.userId}`} 
                    value={member.userId}
                  >
                    {member.profile?.displayName || member.profile?.email || member.userId}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className="mt-1"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Week starts on Monday</p>
          </div>
          <div>
            <Label>End Date</Label>
            <Input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className="mt-1"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Week ends on Sunday</p>
          </div>
        </div>

        <div>
          <Label>Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value: GoalStatus) => handleInputChange('status', value)}
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

      {/* Tasks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">Tasks</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddTask}
          >
            Add Task
          </Button>
        </div>
        
        {tasks.map((task, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Task {index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTask(index)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={task.title}
                    onChange={(e) => handleTaskChange(index, 'title', e.target.value)}
                    placeholder="e.g., Create presentation outline"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={task.description}
                    onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
                    placeholder="Describe what needs to be done"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={task.dueDate instanceof Date ? task.dueDate.toISOString().split('T')[0] : ''}
                      onChange={(e) => handleTaskChange(index, 'dueDate', new Date(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={task.status}
                      onValueChange={(value: GoalStatus) => handleTaskChange(index, 'status', value)}
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

      {/* Progress Metrics Section */}
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