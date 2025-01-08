'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Goal, GoalStatus } from '@/types/goals'
import { getGoals, subscribeToGoalsByTimeframe } from '@/services/goalService'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { Plus, Target, Calendar, Users2, Filter, ShrinkIcon, ExpandIcon, FilterIcon, XIcon, PlusCircle } from 'lucide-react'
import { format, getISOWeek, startOfWeek, endOfWeek } from 'date-fns'
import { useWeek } from '@/contexts/WeekContext'
import { useAuth } from '@/contexts/AuthContext'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface TasksKanbanProps {
  onAddClick: () => void
}

const COLUMNS: { id: GoalStatus; name: string }[] = [
  { id: 'not_started', name: 'To Do' },
  { id: 'in_progress', name: 'In Progress' },
  { id: 'at_risk', name: 'At Risk' },
  { id: 'completed', name: 'Done' }
]

const priorityColors = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  low: 'bg-green-50 text-green-700 border-green-200'
}

const EmptyState = ({ status }: { status: GoalStatus }) => {
  const emptyStates = {
    not_started: {
      message: "Nothing here yet! Ready to start something new?",
      subtext: "Add a task to get started"
    },
    in_progress: {
      message: "No tasks in progress",
      subtext: "Move tasks here when you start working on them"
    },
    at_risk: {
      message: "No at-risk tasks",
      subtext: "Tasks that need attention will appear here"
    },
    completed: {
      message: "No completed tasks yet",
      subtext: "Your finished tasks will show up here"
    }
  }

  const { message, subtext } = emptyStates[status]

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-4">
      <p className="text-sm font-medium text-gray-600 mb-1">{message}</p>
      <p className="text-xs text-gray-500">{subtext}</p>
    </div>
  )
}

interface TaskCardProps {
  task: Goal
  provided: any
  isDragging?: boolean
}

const TaskCard = ({ task, provided, isDragging }: TaskCardProps) => {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/dashboard/tasks/${task.id}`)
  }

  const formatDate = (date: any) => {
    try {
      if (!date) return ''
      
      // Handle Firestore Timestamp
      if (date && typeof date === 'object' && 'seconds' in date) {
        return format(new Date(date.seconds * 1000), 'MMM d')
      }
      
      // Handle string dates
      if (typeof date === 'string') {
        return format(new Date(date), 'MMM d')
      }
      
      // Handle Date objects
      if (date instanceof Date) {
        return format(date, 'MMM d')
      }
      
      return ''
    } catch (error) {
      console.error('Error formatting date:', error)
      return ''
    }
  }

  return (
    <Card 
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
        isDragging ? 'rotate-[2deg] scale-105 shadow-lg' : ''
      }`}
      onClick={handleClick}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <h4 className="text-sm font-medium leading-none">{task.title}</h4>
          <Badge variant="outline" className={priorityColors[task.priority]}>
            {task.priority}
          </Badge>
        </div>

        {task.hypothesis && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.hypothesis}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(task.endDate)}</span>
          </div>
          {task.assignees?.length > 0 && (
            <div className="flex items-center gap-1">
              <Users2 className="h-3 w-3" />
              <span>{task.assignees.length}</span>
            </div>
          )}
          {task.progress > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-8 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gray-400 rounded-full"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
              <span>{task.progress}%</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export function TasksKanban({ onAddClick }: TasksKanbanProps) {
  const [tasks, setTasks] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [isCompact, setIsCompact] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()
  const { currentWeek } = useWeek()
  const { user } = useAuth()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        onAddClick?.()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [onAddClick])

  // Load tasks
  useEffect(() => {
    if (!user?.organizationId || !currentWeek) return

    try {
      setIsLoading(true)
      const weekStart = new Date(currentWeek.startDate)
      const weekEnd = new Date(currentWeek.endDate)
      const weekNumber = getISOWeek(weekStart)
      const year = weekStart.getFullYear()

      const unsubscribe = subscribeToGoalsByTimeframe(
        'weekly',
        user.organizationId,
        (updatedTasks) => {
          setTasks(updatedTasks)
          setIsLoading(false)
        },
        weekNumber,
        year,
        weekStart,
        weekEnd
      )

      return () => unsubscribe()
    } catch (error) {
      console.error('Error loading tasks:', error)
      toast({
        title: 'Error',
        description: 'Failed to load tasks.',
        variant: 'destructive'
      })
      setIsLoading(false)
    }
  }, [user?.organizationId, currentWeek, toast])

  const getFilteredTasks = useCallback(() => {
    return tasks.filter(task => {
      const matchesSearch = !searchQuery || 
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.hypothesis?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesPriority = !filterPriority || filterPriority === 'all' || 
        task.priority === filterPriority

      return matchesSearch && matchesPriority
    })
  }, [tasks, searchQuery, filterPriority])

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result
    
    if (source.droppableId !== destination.droppableId) {
      const task = tasks.find(t => t.id === draggableId)
      if (!task) return

      const updatedTask = {
        ...task,
        status: destination.droppableId as GoalStatus
      }

      setTasks(prev => 
        prev.map(t => t.id === draggableId ? updatedTask : t)
      )

      try {
        // TODO: Update task status in the database
      } catch (error) {
        console.error('Error updating task status:', error)
        toast({
          title: 'Error',
          description: 'Failed to update task status.',
          variant: 'destructive'
        })
      }
    }
  }

  const filteredTasks = getFilteredTasks()

  return (
    <div className="space-y-4">
      {/* Enhanced Header with Stats */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{filteredTasks.length} tasks</span>
            <span>•</span>
            <span>{filteredTasks.filter(t => t.status === 'completed').length} completed</span>
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

      {/* Filters */}
      {showFilters && (
        <div className="bg-muted/50 rounded-lg p-4 mb-4 space-y-4">
          <div className="flex items-center gap-4">
            <Input 
              ref={searchInputRef}
              placeholder="Search tasks... (⌘K)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
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
          {(searchQuery || filterPriority) && (
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

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map(column => (
            <div key={column.id} className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">{column.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {filteredTasks.filter(task => task.status === column.id).length}
                  </Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={onAddClick}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>

              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 space-y-3"
                  >
                    {filteredTasks.filter(task => task.status === column.id).length === 0 ? (
                      <EmptyState status={column.id} />
                    ) : (
                      filteredTasks
                        .filter(task => task.status === column.id)
                        .map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <TaskCard 
                                task={task} 
                                provided={provided}
                                isDragging={snapshot.isDragging}
                              />
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