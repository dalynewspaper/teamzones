export type GoalTimeframe = 'annual' | 'quarterly' | 'monthly' | 'weekly'
export type GoalType = 'company' | 'department' | 'team'
export type GoalStatus = 'not_started' | 'in_progress' | 'at_risk' | 'completed'
export type GoalPriority = 'high' | 'medium' | 'low'

export interface GoalMetric {
  id: string
  name: string
  target: number
  current: number
  unit: string
  frequency: GoalTimeframe
}

export interface GoalMilestone {
  id: string
  title: string
  dueDate: Date
  status: GoalStatus
  description?: string
}

export interface GoalAlignment {
  parentGoalId: string
  contribution: string // Description of how this goal contributes to parent
  weight: number // Percentage contribution to parent goal (0-100)
}

export interface Goal {
  id: string
  title: string
  description: string
  type: GoalType
  timeframe: GoalTimeframe
  priority: GoalPriority
  status: GoalStatus
  progress: number
  startDate: Date
  endDate: Date
  parentGoalId?: string
  metrics: GoalMetric[]
  milestones: GoalMilestone[]
  assignees: string[]
  organizationId: string
  ownerId: string
  teamId?: string
  departmentId?: string
  tags: string[]
  lastCheckin?: {
    date: Date
    status: string
    blockers?: string[]
    nextSteps?: string[]
  }
  createdAt: Date
  updatedAt: Date
  createdBy: string
} 