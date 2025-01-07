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
import { Goal, GoalMetric, GoalType, GoalPriority, GoalTimeframe, GoalStatus, GoalMilestone, GoalAssignee } from '@/types/goals'
import { createGoal, updateGoal, getGoalsByTimeframe, deleteGoal, subscribeToGoalsByTimeframe } from '@/services/goalService'
import { enhanceGoal } from '@/services/openaiService'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, getISOWeek, parseISO, addDays } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { TeamMember, UserProfile } from '@/types/firestore'
import { getTeams } from '@/services/teamService'
import { getUserProfile } from '@/services/userService'
import { Team } from '@/types/teams'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { MultiSelect } from "@/components/ui/multi-select"
import { MultiCombobox } from "@/components/ui/multi-combobox"
import { eventBus } from '@/lib/eventBus'

interface WeeklyGoalFormProps {
  mode: 'create' | 'edit'
  initialData?: Goal
  onComplete?: () => void
}

interface TeamMemberWithProfile extends TeamMember {
  profile?: UserProfile;
}

interface FormData {
  title: string
  description: string
  teams: { teamId: string; role: 'primary' | 'supporting' }[]
  priority: GoalPriority
  startDate: string
  endDate: string
  status: GoalStatus
  progress: number
  assignees: GoalAssignee[]
  teamId?: string
  departmentId?: string
  lastCheckin?: {
    date: Date
    status: string
    blockers?: string[]
    nextSteps?: string[]
  }
}

export function WeeklyGoalForm({ mode, initialData, onComplete }: WeeklyGoalFormProps) {
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
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date())
  
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
        const teams = await getTeams(user.organizationId);
        
        // Get unique member IDs across all teams
        const uniqueMemberIds = Array.from(new Set(
          teams.flatMap(team => team.members.map(member => member.userId))
        )).filter(Boolean);
        
        // Fetch user profiles for each unique member
        const membersWithProfiles = await Promise.all(
          uniqueMemberIds.map(async (member) => {
            const profile = await getUserProfile(member);
            return {
              userId: member,
              role: 'member' as const,
              joinedAt: new Date().toISOString(),
              profile: profile || undefined
            };
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

  const [formData, setFormData] = useState<FormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    teams: initialData?.teamRoles ? [initialData.teamRoles[0]] : [],
    priority: initialData?.priority || 'medium',
    startDate: initialData?.startDate ? format(new Date(initialData.startDate), 'yyyy-MM-dd') : format(selectedWeek, 'yyyy-MM-dd'),
    endDate: initialData?.endDate ? format(new Date(initialData.endDate), 'yyyy-MM-dd') : format(addDays(selectedWeek, 6), 'yyyy-MM-dd'),
    status: initialData?.status || 'not_started',
    progress: initialData?.progress || 0,
    assignees: initialData?.assignees || []
  })

  const [teams, setTeams] = useState<Team[]>([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)

  // Load teams
  useEffect(() => {
    const loadTeams = async () => {
      if (!user?.organizationId) return

      try {
        setIsLoadingTeams(true)
        const teamsData = await getTeams(user.organizationId)
        setTeams(teamsData)
      } catch (error) {
        console.error('Error loading teams:', error)
        toast({
          title: 'Error',
          description: 'Failed to load teams. Please try again.',
          variant: 'destructive'
        })
      } finally {
        setIsLoadingTeams(false)
      }
    }

    loadTeams()
  }, [user?.organizationId])

  // Load monthly goals with real-time updates
  useEffect(() => {
    if (!user?.organizationId) return

    setIsLoadingMonthlyGoals(true)
    
    const unsubscribe = subscribeToGoalsByTimeframe(
      'monthly',
      user.organizationId,
      (goals) => {
        setMonthlyGoals(goals)
        setIsLoadingMonthlyGoals(false)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [user?.organizationId])

  const handleInputChange = (field: keyof FormData, value: any) => {
    console.log(`Updating ${field}:`, value) // Debug log
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle assignee selection
  const handleAssigneeChange = (selectedUserIds: string[]) => {
    const newAssignees = selectedUserIds.map(userId => ({
      userId,
      role: 'contributor' as const,
      assignedAt: new Date()
    }))
    handleInputChange('assignees', newAssignees)
  }

  const handleSubmit = async (data: FormData) => {
    if (!user?.organizationId) {
      toast({
        title: 'Error',
        description: 'Organization ID is required. Please ensure you are part of an organization.',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSubmitting(true)

      const goalData = {
        title: data.title,
        description: data.description,
        type: 'team' as GoalType,
        timeframe: 'weekly' as GoalTimeframe,
        priority: data.priority,
        status: data.status,
        progress: data.progress,
        startDate: parseISO(data.startDate),
        endDate: parseISO(data.endDate),
        calendarWeek,
        year,
        metrics: [],
        keyResults: [],
        milestones: [],
        assignees: data.assignees,
        organizationId: user.organizationId,
        ownerId: user.uid,
        teamRoles: data.teams,
        tags: [],
        createdBy: user.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (mode === 'create') {
        const newGoal = await createGoal(goalData)
        // Emit event for new goal
        eventBus.emit('goalCreated', newGoal)
        toast({
          title: 'Success',
          description: 'Weekly goal created successfully.'
        })
      } else if (initialData?.id) {
        const updatedGoal = await updateGoal(initialData.id, goalData)
        // Emit event for updated goal
        eventBus.emit('goalUpdated', updatedGoal)
        toast({
          title: 'Success',
          description: 'Weekly goal updated successfully.'
        })
      }

      // Close the form and redirect
      onComplete?.()
      router.push('/dashboard/goals/weekly')

      // Show success toast
      toast({
        title: mode === 'create' ? 'Task Created' : 'Task Updated',
        description: mode === 'create' 
          ? 'Task created successfully.'
          : 'Task updated successfully.',
        duration: 5000,
      })
    } catch (error) {
      console.error('Error saving goal:', error)
      toast({
        title: 'Error',
        description: 'Failed to save goal. Please try again.',
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

      toast({
        title: "Goal enhanced",
        description: "AI has helped improve your goal description."
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
      if (onComplete) {
        onComplete()
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

  const [isAssigneesOpen, setIsAssigneesOpen] = useState(false)

  // Render assignee selection
  const renderAssigneeSelection = () => {
    return (
      <div className="space-y-2">
        <Label>Assignee(s)</Label>
        <Select
          value={formData.assignees[0]?.userId || ''}
          onValueChange={(value) => {
            const newAssignees = [{
              userId: value,
              role: 'contributor' as const,
              assignedAt: new Date()
            }]
            handleInputChange('assignees', newAssignees)
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select assignee" />
          </SelectTrigger>
          <SelectContent>
            {teamMembers
              .filter(member => member.profile)
              .map((member) => (
                <SelectItem 
                  key={member.userId} 
                  value={member.userId}
                >
                  {member.profile?.displayName || member.userId}
                </SelectItem>
              ))
            }
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Context Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">Weekly Task</Label>
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Weekly tasks should be specific, actionable items that can be completed within the week.</p>
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
          <Label>Task</Label>
          <div className="flex gap-2">
            <Input
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Complete user research interviews for new feature"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Add any relevant notes, success criteria, or additional context"
            className="mt-1 min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Team</Label>
            <Select
              value={formData.teams[0]?.teamId}
              onValueChange={(value) => {
                const newTeams = [{
                  teamId: value,
                  role: 'primary' as const
                }]
                handleInputChange('teams', newTeams)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {renderAssigneeSelection()}
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

        <div>
          <Label>Progress</Label>
          <div className="flex items-center gap-4 mt-1">
            <Input
              type="number"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => handleInputChange('progress', parseInt(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-500">%</span>
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
          onClick={() => handleSubmit(formData)}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </div>
  )
} 