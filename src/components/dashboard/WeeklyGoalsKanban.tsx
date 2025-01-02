'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useWeek } from '@/contexts/WeekContext'
import { getGoalsByTimeframe, updateGoal } from '@/services/goalService'
import { getTeams } from '@/services/teamService'
import { Goal, GoalStatus, GoalAssignee } from '@/types/goals'
import { Team } from '@/types/teams'
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DroppableStateSnapshot,
  DraggableStateSnapshot
} from '@hello-pangea/dnd'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlusCircle, Filter, Calendar, AlertCircle, Coffee, Battery, Rocket, Trophy, PartyPopper } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'

interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

function parseFirestoreDate(date: any): Date {
  if (!date) return new Date();
  
  // Handle Firestore Timestamp
  if (typeof date === 'object' && 'seconds' in date && 'nanoseconds' in date) {
    return new Date(date.seconds * 1000);
  }
  
  // Handle Date object
  if (date instanceof Date) {
    return date;
  }
  
  // Handle ISO string
  if (typeof date === 'string') {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  // Return current date as fallback
  return new Date();
}

// Create a Search component using Input
function Search({ value, onChange, className, placeholder }: { 
  value: string; 
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <div className={className}>
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  )
}

const COLUMNS: { id: GoalStatus; title: string }[] = [
  { id: 'not_started', title: 'Not Started' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'at_risk', title: 'At Risk' },
  { id: 'completed', title: 'Complete' }
]

const EmptyState = ({ status }: { status: GoalStatus }) => {
  const emptyStates = {
    not_started: {
      icon: Coffee,
      message: "Nothing here yet! Time for coffee and goal planning? ☕️",
      subtext: "Your goals are like coffee beans - they need to be brewed to perfection!"
    },
    in_progress: {
      icon: Battery,
      message: "No goals in progress! Battery at 0% 🔋",
      subtext: "Time to charge up with some exciting challenges!"
    },
    at_risk: {
      icon: Rocket,
      message: "Houston, we have no problems! 🚀",
      subtext: "Everything's smooth sailing... or are we missing something?"
    },
    completed: {
      icon: PartyPopper,
      message: "No victories to celebrate... yet! 🎉",
      subtext: "The confetti cannon is loaded and waiting!"
    }
  }

  const { icon: Icon, message, subtext } = emptyStates[status]

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-4">
      <Icon className="h-12 w-12 text-gray-400 mb-3" />
      <p className="text-sm font-medium text-gray-600 mb-1">{message}</p>
      <p className="text-xs text-gray-500">{subtext}</p>
    </div>
  )
}

const getTeamName = (teamId: string): string => {
  const teams: Record<string, string> = {
    general: 'General',
    engineering: 'Engineering Leadership',
    video: 'Team Video Recording',
    product: 'Product Design',
    test: 'Test Team',
    gtm: 'Go to Market'
  }
  return teams[teamId] || teamId
}

const GoalCard = ({ goal, provided }: { goal: Goal; provided: DraggableProvided }) => {
  const { user } = useAuth()
  const assignee = goal.assignees?.[0]
  const team = goal.teamRoles?.[0]

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="space-y-4">
        {/* Title and Priority */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium flex-1">{goal.title}</h3>
          <Badge variant={getPriorityVariant(goal.priority)}>
            {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)}
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Progress</span>
            <span>{goal.progress || 0}%</span>
          </div>
          <Progress value={goal.progress || 0} className="h-1" />
        </div>

        {/* Team and Assignee */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {team && (
              <Badge variant="outline" className="text-xs">
                {getTeamName(team.teamId)}
              </Badge>
            )}
          </div>
          {assignee && (
            <Avatar className="h-6 w-6">
              <AvatarFallback>
                {assignee.userId ? assignee.userId.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Due Date */}
        {goal.endDate && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CalendarIcon className="h-3 w-3" />
            <span>Due {format(goal.endDate, 'MMM d')}</span>
          </div>
        )}
      </div>
    </div>
  )
}

const getPriorityVariant = (priority: string): 'default' | 'destructive' | 'secondary' => {
  switch (priority) {
    case 'high':
      return 'destructive'
    case 'medium':
      return 'default'
    default:
      return 'secondary'
  }
}

export function WeeklyGoalsKanban() {
  const router = useRouter()
  const { user } = useAuth()
  const { currentWeek } = useWeek()
  const [goals, setGoals] = useState<Goal[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAssignee, setFilterAssignee] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('')

  // Load teams
  useEffect(() => {
    const loadTeams = async () => {
      if (!user?.organizationId) return

      try {
        const teamsData = await getTeams(user.organizationId)
        setTeams(teamsData)
      } catch (error) {
        console.error('Error loading teams:', error)
      }
    }

    loadTeams()
  }, [user?.organizationId])

  const getTeamName = (teamId: string): string => {
    const team = teams.find(t => t.id === teamId)
    return team?.name || teamId
  }

  useEffect(() => {
    async function loadGoals() {
      if (!user?.organizationId || !currentWeek) return
      
      try {
        setLoading(true)
        const weeklyGoals = await getGoalsByTimeframe('weekly', user.organizationId)
        
        // Deduplicate goals using a Map
        const uniqueGoals = Array.from(
          new Map(weeklyGoals.map(goal => [goal.id, goal])).values()
        )
        
        // Filter goals for current week
        const currentWeekGoals = uniqueGoals.filter(goal => {
          try {
            // Rest of the filtering logic remains the same
            const goalStartDate = parseFirestoreDate(goal.startDate)
            const goalEndDate = parseFirestoreDate(goal.endDate)
            const weekStart = parseFirestoreDate(currentWeek.startDate)
            const weekEnd = parseFirestoreDate(currentWeek.endDate)
            
            // Set times to midnight for consistent comparison
            goalStartDate.setHours(0, 0, 0, 0)
            goalEndDate.setHours(0, 0, 0, 0)
            weekStart.setHours(0, 0, 0, 0)
            weekEnd.setHours(0, 0, 0, 0)
            
            return (
              goalStartDate.getTime() >= weekStart.getTime() && 
              goalStartDate.getTime() <= weekEnd.getTime()
            )
          } catch (error) {
            console.error('Error processing dates for goal:', goal.id, error)
            return false
          }
        })
        
        setGoals(currentWeekGoals)
      } catch (error) {
        console.error('Error loading goals:', error)
      } finally {
        setLoading(false)
      }
    }

    loadGoals()
  }, [user?.organizationId, currentWeek])

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result
    
    // If dropped in a different column, update the goal status
    if (source.droppableId !== destination.droppableId) {
      const goal = goals.find(g => g.id === draggableId)
      if (!goal) return

      try {
        // Update goal status in the database
        await updateGoal(goal.id, {
          ...goal,
          status: destination.droppableId as GoalStatus
        })

        // Update local state
        setGoals(prevGoals => 
          prevGoals.map(g => 
            g.id === draggableId 
              ? { ...g, status: destination.droppableId as GoalStatus }
              : g
          )
        )
      } catch (error) {
        console.error('Error updating goal status:', error)
      }
    }
  }

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = !searchQuery || 
      (goal.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesAssignee = filterAssignee === 'all' || 
      (Array.isArray(goal.assignees) && goal.assignees.some(a => a?.userId === filterAssignee));
    
    const matchesPriority = filterPriority === 'all' || 
      goal.priority === filterPriority;

    return matchesSearch && matchesAssignee && matchesPriority;
  });

  const getColumnGoals = (status: GoalStatus) => 
    // Ensure unique goals by using a Map before filtering by status
    Array.from(
      new Map(
        filteredGoals
          .filter(goal => goal.status === status)
          .map(goal => [goal.id, goal])
      ).values()
    )

  if (loading) {
    return <div>Loading goals...</div>
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-4 flex-1">
          <Search 
            placeholder="Search goals..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assignees</SelectItem>
              {/* Add assignee options */}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map(column => (
            <div key={column.id} className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium flex items-center gap-2">
                  {column.title}
                  <Badge variant="secondary" className="ml-2">
                    {getColumnGoals(column.id).length}
                  </Badge>
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push(`/goals/new?status=${column.id}`)}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 bg-gray-50 rounded-lg p-3 min-h-[500px]"
                  >
                    {getColumnGoals(column.id).length === 0 ? (
                      <EmptyState status={column.id} />
                    ) : (
                      getColumnGoals(column.id).map((goal, index) => (
                        <Draggable key={goal.id} draggableId={goal.id} index={index}>
                          {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                            <GoalCard goal={goal} provided={provided} />
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
} 