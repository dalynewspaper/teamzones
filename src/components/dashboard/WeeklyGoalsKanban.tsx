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
import { format, getISOWeek, startOfWeek, endOfWeek } from 'date-fns'
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

  // Parse the end date using the parseFirestoreDate helper
  const endDate = goal.endDate ? parseFirestoreDate(goal.endDate) : null

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className="bg-white rounded-lg shadow-sm p-4 mb-3 border border-gray-200 hover:shadow-md transition-shadow space-y-3"
    >
      {/* Header: Title and Priority */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium line-clamp-2 flex-1">{goal.title}</h3>
        <Badge 
          variant={getPriorityVariant(goal.priority)}
          className="shrink-0"
        >
          {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)}
        </Badge>
      </div>

      {/* Description */}
      {goal.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {goal.description}
        </p>
      )}

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{goal.progress || 0}%</span>
        </div>
        <Progress value={goal.progress || 0} className="h-1.5" />
      </div>

      {/* Footer: Team, Due Date, and Assignee */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Team Badge */}
          {team && (
            <Badge variant="outline" className="text-xs truncate max-w-[120px]">
              {getTeamName(team.teamId)}
            </Badge>
          )}
          {/* Due Date */}
          {endDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarIcon className="h-3 w-3" />
              <span>{format(endDate, 'MMM d')}</span>
            </div>
          )}
        </div>
        {/* Assignee Avatar */}
        {assignee && (
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {assignee.userId.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  )
}

const getPriorityVariant = (priority: string): "default" | "destructive" | "secondary" | "outline" => {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'destructive'
    case 'medium':
      return 'default'
    case 'low':
      return 'secondary'
    default:
      return 'outline'
  }
}

interface WeeklyGoalsKanbanProps {
  onAddClick?: () => void
}

export function WeeklyGoalsKanban({ onAddClick }: WeeklyGoalsKanbanProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { currentWeek } = useWeek()
  const [goals, setGoals] = useState<Goal[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAssignee, setFilterAssignee] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Function to trigger a refresh
  const refreshGoals = () => {
    setRefreshTrigger(prev => prev + 1);
  }

  useEffect(() => {
    const intervalId = setInterval(refreshGoals, 5000); // Refresh every 5 seconds
    return () => clearInterval(intervalId);
  }, []);

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
      const organizationId = user?.organizationId;
      if (!organizationId) {
        console.log('Missing required data:', { organizationId });
        return;
      }
      
      try {
        setLoading(true);
        const today = new Date();
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        const currentWeekNumber = getISOWeek(today);
        const currentYear = today.getFullYear();
        
        console.log('Fetching goals for:', {
          timeframe: 'weekly',
          organizationId,
          currentWeekNumber,
          currentYear,
          startDate: weekStart,
          endDate: weekEnd
        });
        
        const weeklyGoals = await getGoalsByTimeframe(
          'weekly', 
          organizationId,
          currentWeekNumber,
          currentYear,
          weekStart,
          weekEnd
        );
        
        console.log('Fetched weekly goals:', weeklyGoals);
        
        // Ensure each goal has a status
        const goalsWithStatus = weeklyGoals.map(goal => ({
          ...goal,
          status: goal.status || 'not_started'
        }));
        
        console.log('Goals with status:', goalsWithStatus);
        setGoals(goalsWithStatus);
      } catch (error) {
        console.error('Error loading goals:', error);
      } finally {
        setLoading(false);
      }
    }

    loadGoals();
  }, [user?.organizationId, refreshTrigger]);

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
      goal.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAssignee = !filterAssignee || filterAssignee === 'all' || 
      (Array.isArray(goal.assignees) && goal.assignees.some(a => a?.userId === filterAssignee));
    
    const matchesPriority = !filterPriority || filterPriority === 'all' || 
      goal.priority === filterPriority;

    return matchesSearch && matchesAssignee && matchesPriority;
  });

  const getColumnGoals = (status: GoalStatus) => {
    // Ensure unique goals by using a Map before filtering by status
    return Array.from(
      new Map(
        filteredGoals
          .filter(goal => goal.status === status)
          .map(goal => [goal.id, goal])
      ).values()
    )
  }

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