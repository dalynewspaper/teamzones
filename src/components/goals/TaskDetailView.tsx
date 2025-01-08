'use client'

import { useState, useEffect } from 'react'
import { Goal, GoalStatus, GoalPriority } from '@/types/goals'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { format } from 'date-fns'
import { 
  Calendar, 
  ChevronRight, 
  ChevronDown,
  Target,
  Activity,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  Circle,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { RadialProgress } from '@/components/ui/radial-progress'
import { ExperimentSuggestions } from './ExperimentSuggestions'
import type { ExperimentSuggestion } from './ExperimentSuggestions'
import { getGoal } from '@/services/goalService'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface TaskDetailViewProps {
  goalId: string
  onEdit?: () => void
}

const priorityColors = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  low: 'bg-green-50 text-green-700 border-green-200'
}

const statusIcons = {
  not_started: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
  at_risk: AlertCircle
}

const statusColors = {
  not_started: 'text-gray-500',
  in_progress: 'text-blue-500',
  completed: 'text-green-500',
  at_risk: 'text-red-500'
}

export function TaskDetailView({ goalId, onEdit }: TaskDetailViewProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [goal, setGoal] = useState<Goal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const loadGoal = async () => {
      try {
        setIsLoading(true)
        const fetchedGoal = await getGoal(goalId)
        if (!fetchedGoal) {
          router.push('/dashboard/tasks')
          return
        }
        setGoal(fetchedGoal)
      } catch (error) {
        console.error('Error loading task:', error)
        toast({
          title: 'Error',
          description: 'Failed to load task details.',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadGoal()
  }, [goalId, toast, router])

  if (isLoading || !goal) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const StatusIcon = statusIcons[goal.status]

  const handleApplySuggestion = (suggestion: ExperimentSuggestion) => {
    // TODO: Implement applying suggestion
    console.log('Applying suggestion:', suggestion)
  }

  return (
    <div className="flex h-full gap-6">
      <div className="flex-1">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold">{goal.title}</h1>
              <Badge variant="outline">Team</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push('/dashboard/tasks')}>
                Back
              </Button>
              <Button onClick={onEdit}>
                Edit
              </Button>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {/* Status Card */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusIcon className={`h-4 w-4 ${statusColors[goal.status]}`} />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium capitalize">{goal.status.replace('_', ' ')}</span>
              </div>
            </Card>

            {/* Priority Card */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Priority</span>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <Badge className={priorityColors[goal.priority]} variant="outline">
                  {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)}
                </Badge>
              </div>
            </Card>

            {/* Timeline Card */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Timeline</span>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">
                  {format(new Date(goal.startDate), 'MMM d')} - {format(new Date(goal.endDate), 'MMM d, yyyy')}
                </span>
              </div>
            </Card>

            {/* Progress Card */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Progress</span>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col items-center">
                <RadialProgress 
                  value={goal.progress} 
                  size="sm" 
                  label="Completion"
                  className="mb-2"
                />
                <span className="text-sm text-muted-foreground">Target: 100%</span>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="flex-1">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex-1">
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="space-y-6 p-4">
                  {/* Experiment Details */}
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Experiment Details</h3>
                    
                    <div className="space-y-6">
                      {/* Hypothesis */}
                      <Collapsible defaultOpen>
                        <CollapsibleTrigger className="flex items-center gap-2 w-full">
                          <ChevronRight className="h-4 w-4" />
                          <h4 className="font-medium">Hypothesis</h4>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2 pl-6">
                          <p className="text-muted-foreground">{goal.hypothesis}</p>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Expected Outcome */}
                      <Collapsible defaultOpen>
                        <CollapsibleTrigger className="flex items-center gap-2 w-full">
                          <ChevronRight className="h-4 w-4" />
                          <h4 className="font-medium">Expected Outcome</h4>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2 pl-6">
                          <p className="text-muted-foreground">{goal.expectedOutcome}</p>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Metrics */}
                      <Collapsible defaultOpen>
                        <div className="flex items-center justify-between mb-2">
                          <CollapsibleTrigger className="flex items-center gap-2">
                            <ChevronRight className="h-4 w-4" />
                            <h4 className="font-medium">Metrics</h4>
                          </CollapsibleTrigger>
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Metric
                          </Button>
                        </div>
                        <CollapsibleContent className="pt-2 pl-6">
                          <div className="grid grid-cols-2 gap-4">
                            {goal.metrics?.map((metric, index) => (
                              <Card key={index} className="p-4 relative group">
                                <div className="flex items-center justify-between mb-4">
                                  <div>
                                    <span className="font-medium">{metric.name}</span>
                                    <p className="text-sm text-muted-foreground">
                                      {metric.current || 0} / {metric.target} {metric.unit}
                                    </p>
                                  </div>
                                  <RadialProgress 
                                    value={((metric.current || 0) / metric.target) * 100}
                                    size="sm"
                                    className="text-primary"
                                  />
                                </div>
                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Button variant="outline" size="sm">
                                    Update Progress
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </Card>

                  {/* Implementation Notes */}
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Implementation Notes</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{goal.description}</p>
                  </Card>

                  {/* Team & Assignees */}
                  <Card className="p-6">
                    <h3 className="text-lg font-medium mb-4">Team & Assignees</h3>
                    <div className="space-y-4">
                      {goal.assignees.map((assignee) => (
                        <div key={assignee.userId} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              {assignee.name ? assignee.name.charAt(0) : assignee.userId.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{assignee.name || assignee.userId}</p>
                              <p className="text-sm text-muted-foreground capitalize">{assignee.role}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {assignee.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="updates">
              <div className="p-4">
                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-4">Updates</h3>
                  {/* Add updates content here */}
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activity">
              <div className="p-4">
                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-4">Activity</h3>
                  {/* Add activity content here */}
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* AI Suggestions Sidebar */}
      <div className="w-80 shrink-0">
        <ExperimentSuggestions onApplySuggestion={handleApplySuggestion} />
      </div>
    </div>
  )
} 