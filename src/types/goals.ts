export type GoalTimeframe = 'annual' | 'quarterly' | 'monthly'
export type WeeklyGoalTimeframe = 'weekly'
export type AllGoalTimeframes = GoalTimeframe | WeeklyGoalTimeframe
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

export interface KeyResult {
  id: string
  description: string
  targetDate: string
  metrics: GoalMetric[]
}

export interface GoalMilestone {
  id: string
  title: string
  dueDate: Date
  status: GoalStatus
  description?: string
}

export interface GoalAssignee {
  userId: string
  role: 'owner' | 'contributor' | 'reviewer'
  assignedAt: Date
}

export interface GoalTeamRole {
  teamId: string
  role: 'primary' | 'supporting'
}

export interface Goal {
  id: string
  title: string
  description: string
  type: GoalType
  timeframe: AllGoalTimeframes
  priority: GoalPriority
  status: GoalStatus
  progress: number
  startDate: Date
  endDate: Date
  calendarWeek?: number
  year?: number
  parentGoalId?: string
  metrics: GoalMetric[]
  keyResults: KeyResult[]
  milestones: GoalMilestone[]
  assignees: GoalAssignee[]
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
  teamRoles?: GoalTeamRole[]
  recentActivity?: boolean
  lastViewed?: Date
  comments?: number
  reactions?: { [key: string]: string[] }
}

export interface ExistingGoalContent {
  title: string
  description: string
  milestones?: {
    title: string
    description: string
    dueDate: string
  }[]
  metrics?: {
    name: string
    target: number
    unit: string
  }[]
}

export interface ParentGoalInfo {
  parentGoal: {
    title: string
    description: string
  }
  generateMilestones?: boolean
  generateMetrics?: boolean
  timeframe?: GoalTimeframe
  existingContent?: ExistingGoalContent
}

export interface MilestoneSuggestion {
  title: string
  description: string
  dueDate: string
}

export interface MetricSuggestion {
  name: string
  target: number
  unit: string
}

export interface GoalSuggestions {
  enhancedTitle: string
  enhancedDescription: string
  milestones?: MilestoneSuggestion[]
  metrics?: MetricSuggestion[]
} 