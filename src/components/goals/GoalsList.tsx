import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const paddingLeft = `${level * 2}rem`

  const handleGoalClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent expansion toggle
    router.push(`/dashboard/goals/${goal.id}`)
  }

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
    <div style={{ paddingLeft }}>
      <Card 
        className="mb-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleGoalClick}
      >
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                {childGoals.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsExpanded(!isExpanded)
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <div className="flex items-center space-x-2">
                  {getStatusIcon()}
                  <h3 className="font-medium text-gray-900">{goal.title}</h3>
                </div>
              </div>
              {goal.description && (
                <p className="mt-1 text-sm text-gray-500">{goal.description}</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {isExpanded && childGoals.length > 0 && (
        <div className="space-y-4">
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