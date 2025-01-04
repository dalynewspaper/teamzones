'use client'

import React, { useState, useEffect, ChangeEvent, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useWeek } from '@/contexts/WeekContext'
import { getGoalsByTimeframe, updateGoal } from '@/services/goalService'
import { getTeams } from '@/services/teamService'
import { eventBus } from '@/lib/eventBus'
import { 
  Goal, 
  GoalStatus, 
  GoalAssignee, 
  GoalType, 
  AllGoalTimeframes, 
  GoalMetric, 
  GoalMilestone,
  GoalPriority,
  GoalTeamRole,
  GoalKeyResult
} from '@/types/goals'
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
import { PlusCircle, Filter, Calendar, AlertCircle, Coffee, Battery, Rocket, Trophy, PartyPopper, PencilIcon, PercentIcon, ExpandIcon, ShrinkIcon, FilterIcon, XIcon, MoreHorizontalIcon, MessageSquareIcon } from 'lucide-react'
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

interface SearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  className?: string
  placeholder?: string
}

// Create a Search component using Input
const Search = React.forwardRef<HTMLInputElement, SearchProps>((props, ref) => {
  return (
    <div className={props.className}>
      <Input
        ref={ref}
        type="search"
        {...props}
      />
    </div>
  )
})

Search.displayName = 'Search'

interface WeeklyGoalData {
  id: string
  title: string
  description?: string
  status: GoalStatus
  priority: GoalPriority
  progress?: number
  assignees?: GoalAssignee[]
  teamRoles?: GoalTeamRole[]
  startDate?: Date
  endDate?: Date
  organizationId: string
  ownerId?: string
  createdBy?: string
  type?: GoalType
  timeframe?: AllGoalTimeframes
  metrics?: GoalMetric[]
  keyResults?: GoalKeyResult[]
  milestones?: GoalMilestone[]
  tags?: string[]
  recentActivity?: boolean
  lastViewed?: Date
  comments?: number
  reactions?: { [key: string]: string[] }
}

interface GoalCardProps {
  goal: WeeklyGoalData
  provided: DraggableProvided
  isSelected?: boolean
  onSelect?: (selected: boolean) => void
}

const GoalCard = ({ goal, provided, isSelected, onSelect }: GoalCardProps) => {
  const { user } = useAuth()
  const router = useRouter()
  const assignee = goal.assignees?.[0]
  const team = goal.teamRoles?.[0]
  const endDate = goal.endDate ? parseFirestoreDate(goal.endDate) : null
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    if (e.defaultPrevented) return
    router.push(`/dashboard/goals/weekly/${goal.id}`)
  }

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative bg-white hover:bg-gray-50/80 rounded-md p-3
        transition-all duration-150 cursor-pointer border border-transparent
        ${isHovered ? 'border-gray-200' : ''}
      `}
    >
      {/* Title Row */}
      <div className="flex items-start gap-2 mb-1.5">
        {/* Priority Dot */}
        <div className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0
          ${goal.priority === 'high' ? 'bg-red-500' : 
            goal.priority === 'medium' ? 'bg-yellow-500' : 
            'bg-green-500'}
        `} />
        
        {/* Title */}
        <h3 className="text-sm flex-1 text-gray-900">
          {goal.title}
        </h3>

        {/* Hover Actions */}
        {isHovered && (
          <div className="flex items-center gap-0.5">
            <button className="p-1 rounded hover:bg-gray-100/80 text-gray-400 hover:text-gray-600">
              <PencilIcon className="h-3 w-3" />
            </button>
            <button className="p-1 rounded hover:bg-gray-100/80 text-gray-400 hover:text-gray-600">
              <MoreHorizontalIcon className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {goal.description && (
        <div className="pl-3.5 mb-2">
          <p className="text-xs text-gray-500 line-clamp-2">
            {goal.description}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="pl-3.5 flex items-center gap-2 text-xs text-gray-500">
        {/* Progress */}
        {typeof goal.progress === 'number' && goal.progress > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full bg-gray-400"
                style={{ width: `${goal.progress}%` }}
              />
            </div>
            <span>{goal.progress}%</span>
          </div>
        )}

        {/* Due Date */}
        {endDate && (
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-3 w-3" />
            <span>{format(endDate, 'MMM d')}</span>
          </div>
        )}

        {/* Assignee */}
        {assignee && (
          <div className="ml-auto">
            <Avatar className="h-4 w-4">
              <AvatarFallback className="text-[8px] bg-gray-200 text-gray-600">
                {assignee.userId.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>

      {/* Comments Indicator */}
      {goal.comments && goal.comments > 0 && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-gray-400">
          <MessageSquareIcon className="h-3 w-3" />
          <span>{goal.comments}</span>
        </div>
      )}
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

const COLUMNS: { id: GoalStatus; title: string }[] = [
  { id: 'not_started', title: 'Not Started' },
  { id: 'in_progress', title: 'In Progress' },
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

interface Column {
  id: GoalStatus
  title: string
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

export function WeeklyGoalsKanban({ onAddClick }: WeeklyGoalsKanbanProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { currentWeek } = useWeek()
  const [goals, setGoals] = useState<WeeklyGoalData[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterAssignee, setFilterAssignee] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [selectedCards, setSelectedCards] = useState<string[]>([])
  const [isCompact, setIsCompact] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [columns, setColumns] = useState<Column[]>(COLUMNS)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    Object.fromEntries(COLUMNS.map((col: Column) => [col.id, 100 / COLUMNS.length]))
  )

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Command/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      // Command/Ctrl + N to create new goal
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        onAddClick?.()
      }
      // Escape to clear selection
      if (e.key === 'Escape') {
        setSelectedCards([])
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [onAddClick])

  const handleColumnResize = (columnId: string, newWidth: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [columnId]: newWidth
    }))
  }

  // Enhanced filtering
  const getFilteredGoals = useCallback(() => {
    return goals.filter(goal => {
      const matchesSearch = !searchQuery || 
        goal.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goal.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goal.id.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesAssignee = !filterAssignee || filterAssignee === 'all' || 
        (Array.isArray(goal.assignees) && goal.assignees.some(a => a?.userId === filterAssignee))
      
      const matchesPriority = !filterPriority || filterPriority === 'all' || 
        goal.priority === filterPriority

      return matchesSearch && matchesAssignee && matchesPriority
    })
  }, [goals, searchQuery, filterAssignee, filterPriority])

  const filteredGoals = getFilteredGoals()

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !user?.organizationId) return

    const { source, destination, draggableId } = result
    
    // If dropped in a different column, update the goal status
    if (source.droppableId !== destination.droppableId) {
      const goal = goals.find(g => g.id === draggableId)
      if (!goal) return

      try {
        const updatedGoal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'> = {
          title: goal.title,
          description: goal.description || '',
          type: goal.type || 'team',
          timeframe: goal.timeframe || 'weekly',
          priority: goal.priority,
          status: destination.droppableId as GoalStatus,
          progress: goal.progress || 0,
          startDate: goal.startDate || new Date(),
          endDate: goal.endDate || new Date(),
          metrics: goal.metrics || [],
          keyResults: goal.keyResults || [],
          milestones: goal.milestones || [],
          assignees: goal.assignees || [],
          organizationId: user.organizationId,
          ownerId: user.organizationId,
          createdBy: user.organizationId,
          tags: goal.tags || [],
          teamRoles: goal.teamRoles || []
        }

        // Update goal status in the database
        await updateGoal(goal.id, updatedGoal)

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

  const getColumnGoals = (status: GoalStatus): WeeklyGoalData[] => {
    return Array.from(
      new Map(
        filteredGoals
          .filter(goal => goal.status === status)
          .map(goal => [goal.id, goal])
      ).values()
    )
  }

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

  // Load goals
  useEffect(() => {
    const loadGoals = async () => {
      if (!user?.organizationId) {
        console.log('Missing required data:', { organizationId: user?.organizationId })
        return
      }

      try {
        setLoading(true)
        const today = new Date()
        const weekStart = startOfWeek(today, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
        const currentWeekNumber = getISOWeek(today)
        const currentYear = today.getFullYear()

        const weeklyGoals = await getGoalsByTimeframe(
          'weekly',
          user.organizationId,
          currentWeekNumber,
          currentYear,
          weekStart,
          weekEnd
        )

        // Ensure each goal has required properties
        const goalsWithDefaults = weeklyGoals.map(goal => ({
          ...goal,
          status: goal.status || 'not_started',
          progress: goal.progress || 0,
          priority: goal.priority || 'medium',
          type: goal.type || 'team',
          timeframe: 'weekly' as const
        }))

        setGoals(goalsWithDefaults)
      } catch (error) {
        console.error('Error loading goals:', error)
      } finally {
        setLoading(false)
      }
    }

    loadGoals()
  }, [user?.organizationId])

  // Listen for goal updates
  useEffect(() => {
    const handleGoalCreated = (newGoal: WeeklyGoalData) => {
      setGoals(prevGoals => [...prevGoals, newGoal])
      // Redirect back to weekly goals view
      router.push('/dashboard/goals/weekly')
    }

    const handleGoalUpdated = (updatedGoal: WeeklyGoalData) => {
      setGoals(prevGoals => 
        prevGoals.map(goal => 
          goal.id === updatedGoal.id ? updatedGoal : goal
        )
      )
      // Redirect back to weekly goals view
      router.push('/dashboard/goals/weekly')
    }

    // Subscribe to events
    eventBus.on('goalCreated', handleGoalCreated)
    eventBus.on('goalUpdated', handleGoalUpdated)

    // Cleanup
    return () => {
      eventBus.off('goalCreated', handleGoalCreated)
      eventBus.off('goalUpdated', handleGoalUpdated)
    }
  }, [router])

  const handleAddClick = (status: GoalStatus) => {
    onAddClick?.()
    router.push(`/dashboard/goals/weekly?sheet=new&status=${status}`)
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Header with Stats */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Weekly Goals</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{filteredGoals.length} goals</span>
            <span>•</span>
            <span>{filteredGoals.filter(g => g.status === 'completed').length} completed</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCompact(!isCompact)}
          >
            {isCompact ? <ExpandIcon className="h-4 w-4" /> : <ShrinkIcon className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FilterIcon className="h-4 w-4 mr-1" />
            Filters
          </Button>
        </div>
      </div>

      {/* Enhanced Filters */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-4">
          <div className="flex items-center gap-4">
            <Search 
              ref={searchInputRef}
              placeholder="Search goals... (⌘K)" 
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

          {/* Active Filters */}
          {(searchQuery || filterAssignee || filterPriority) && (
            <div className="flex items-center gap-2">
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <XIcon 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setSearchQuery('')}
                  />
                </Badge>
              )}
              {filterAssignee && filterAssignee !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Assignee: {filterAssignee}
                  <XIcon 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilterAssignee('')}
                  />
                </Badge>
              )}
              {filterPriority && filterPriority !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  Priority: {filterPriority}
                  <XIcon 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilterPriority('')}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bulk Actions */}
      {selectedCards.length > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 flex items-center gap-2 z-50">
          <span className="text-sm font-medium px-2">{selectedCards.length} selected</span>
          <Button variant="outline" size="sm" onClick={() => setSelectedCards([])}>
            Clear
          </Button>
          <Button variant="outline" size="sm">
            Move to...
          </Button>
          <Button variant="outline" size="sm">
            Assign to...
          </Button>
          <Button variant="destructive" size="sm">
            Delete
          </Button>
        </div>
      )}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-3 gap-6" style={{ minHeight: '70vh' }}>
          {columns.map(column => (
            <div 
              key={column.id} 
              className="flex flex-col rounded-lg p-4 bg-gray-50/80"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2.5 w-2.5 rounded-full
                      ${column.id === 'not_started' ? 'bg-gray-400' : 
                        column.id === 'in_progress' ? 'bg-yellow-500' : 
                        'bg-green-500'}
                    `} />
                    <h3 className="font-medium text-sm">
                      {column.title}
                    </h3>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-1.5 py-0 h-5 bg-white/50 text-gray-600"
                  >
                    {getColumnGoals(column.id).length}
                  </Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-white/50"
                  onClick={() => handleAddClick(column.id)}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 rounded-lg transition-colors duration-200 min-h-[calc(100vh-300px)] overflow-y-auto
                      ${snapshot.isDraggingOver ? 'bg-white/50' : ''}
                      ${isCompact ? 'space-y-2' : 'space-y-3'}
                    `}
                  >
                    {getColumnGoals(column.id).length === 0 ? (
                      <EmptyState status={column.id} />
                    ) : (
                      getColumnGoals(column.id).map((goal, index) => (
                        <Draggable key={goal.id} draggableId={goal.id} index={index}>
                          {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                            <div
                              className={`transition-transform duration-200
                                ${snapshot.isDragging ? 'rotate-[2deg] scale-105 shadow-lg' : ''}
                                ${isCompact ? 'transform scale-98' : ''}
                              `}
                            >
                              <GoalCard 
                                goal={goal} 
                                provided={provided}
                                isSelected={selectedCards.includes(goal.id)}
                                onSelect={(selected) => {
                                  setSelectedCards(prev => 
                                    selected 
                                      ? [...prev, goal.id]
                                      : prev.filter(id => id !== goal.id)
                                  )
                                }}
                              />
                            </div>
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