import { useState } from 'react'
import { Goal, GoalTimeframe, GoalType, GoalMetric } from '@/types/goals'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Plus, Target, AlertCircle, CheckCircle2 } from 'lucide-react'

interface GoalsListProps {
  goals: Goal[]
  timeframe: GoalTimeframe
  onAddGoal?: (parentId?: string) => void
  isLoading?: boolean
}

interface GoalItemProps {
  goal: Goal
  level: number
  timeframe: GoalTimeframe
  onAddSubgoal?: (parentId: string) => void
  childGoals?: Goal[]
}

function MetricDisplay({ metric }: { metric: GoalMetric }) {
  const progress = (metric.current / metric.target) * 100
  const color = progress >= 100 ? 'text-green-600' : progress >= 70 ? 'text-blue-600' : 'text-yellow-600'

  return (
    <div className="text-sm">
      <span className="text-gray-500">{metric.name}: </span>
      <span className={`font-medium ${color}`}>
        {metric.current}/{metric.target} {metric.unit}
      </span>
    </div>
  )
}

function GoalItem({ goal, level, timeframe, onAddSubgoal, childGoals = [] }: GoalItemProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const paddingLeft = `${level * 2}rem`

  const getStatusIcon = () => {
    switch (goal.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'at_risk':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Target className="h-5 w-5 text-blue-600" />
    }
  }

  return (
    <div>
      <Card className="mb-2">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2" style={{ paddingLeft }}>
              {childGoals.length > 0 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
              {getStatusIcon()}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{goal.title}</h3>
                  {goal.priority === 'high' && (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
                      High Priority
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{goal.description}</p>
                {timeframe !== 'weekly' && (
                  <div className="text-xs text-gray-400 mt-1">
                    {goal.type.charAt(0).toUpperCase() + goal.type.slice(1)} Goal
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Progress: {goal.progress}%
              </div>
              {onAddSubgoal && timeframe !== 'weekly' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddSubgoal(goal.id)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                goal.status === 'at_risk' ? 'bg-red-500' : 'bg-blue-600'
              }`}
              style={{ width: `${goal.progress}%` }}
            />
          </div>

          {/* Metrics */}
          {goal.metrics.length > 0 && (
            <div className="mt-4 flex gap-4">
              {goal.metrics
                .filter(m => m.frequency === timeframe)
                .map((metric) => (
                  <MetricDisplay key={metric.id} metric={metric} />
                ))}
            </div>
          )}

          {/* Additional details based on timeframe */}
          {timeframe !== 'weekly' && goal.milestones.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Key Milestones</h4>
              <div className="space-y-2">
                {goal.milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      milestone.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <span>{milestone.description}</span>
                    <span className="text-gray-400">
                      ({new Date(milestone.dueDate).toLocaleDateString()})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly specific details */}
          {timeframe === 'weekly' && goal.lastCheckin && (
            <div className="mt-4 border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Last Check-in</h4>
              <div className="text-sm text-gray-600">
                <p>Status: {goal.lastCheckin.status}</p>
                {goal.lastCheckin.blockers && goal.lastCheckin.blockers.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium">Blockers:</p>
                    <ul className="list-disc list-inside">
                      {goal.lastCheckin.blockers.map((blocker, i) => (
                        <li key={i}>{blocker}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Child goals */}
      {isExpanded && childGoals.length > 0 && (
        <div className="ml-4">
          {childGoals.map((childGoal) => (
            <GoalItem
              key={childGoal.id}
              goal={childGoal}
              level={level + 1}
              timeframe={timeframe}
              onAddSubgoal={onAddSubgoal}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function GoalsList({ goals, timeframe, onAddGoal, isLoading }: GoalsListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (goals.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-sm font-semibold text-gray-900">No goals yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new {timeframe} goal.
        </p>
        {onAddGoal && (
          <div className="mt-6">
            <Button
              onClick={() => onAddGoal()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" /> New Goal
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Organize goals into a hierarchy
  const topLevelGoals = goals.filter((goal) => !goal.parentGoalId)
  const childGoalsMap = goals.reduce((acc, goal) => {
    if (goal.parentGoalId) {
      if (!acc[goal.parentGoalId]) {
        acc[goal.parentGoalId] = []
      }
      acc[goal.parentGoalId].push(goal)
    }
    return acc
  }, {} as Record<string, Goal[]>)

  return (
    <div className="space-y-4">
      {topLevelGoals.map((goal) => (
        <GoalItem
          key={goal.id}
          goal={goal}
          level={0}
          timeframe={timeframe}
          onAddSubgoal={onAddGoal}
          childGoals={childGoalsMap[goal.id] || []}
        />
      ))}
    </div>
  )
} 