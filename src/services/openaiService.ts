// Define local types for the enhance goal functionality
interface ParentGoalInfo {
  title: string;
  description: string;
  timeframe?: string;
}

interface EnhanceGoalOptions {
  generateMilestones?: boolean;
  generateMetrics?: boolean;
  parentGoal?: ParentGoalInfo;
  timeframe?: string;
  monthOfQuarter?: number;
  monthlyTarget?: number;
  monthPosition?: 'initial' | 'intermediate' | 'final';
  existingContent?: {
    title: string;
    description: string;
    milestones?: Array<{
      title: string;
      description: string;
      dueDate?: string;
    }>;
    metrics?: Array<{
      name: string;
      target?: number;
      unit?: string;
    }>;
  };
}

interface GoalSuggestion {
  enhancedTitle: string;
  enhancedDescription: string;
  milestones?: Array<{
    title: string;
    description: string;
    dueDate?: string;
  }>;
  metrics?: Array<{
    name: string;
    target?: number;
    unit?: string;
  }>;
}

export type MilestoneSuggestion = {
  title: string;
  description: string;
  dueDate?: string;
}

export type MetricSuggestion = {
  name: string;
  target?: number;
  unit?: string;
}

export async function enhanceGoal(
  title: string,
  description: string,
  timeframe: string,
  options?: EnhanceGoalOptions
): Promise<GoalSuggestion> {
  try {
    const response = await fetch('/api/ai/enhance-goal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        timeframe,
        parentGoal: options?.parentGoal,
        generateMilestones: options?.generateMilestones,
        generateMetrics: options?.generateMetrics,
        monthOfQuarter: options?.monthOfQuarter,
        monthlyTarget: options?.monthlyTarget,
        monthPosition: options?.monthPosition
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to enhance goal')
    }

    const data = await response.json()
    return data
  } catch (error: any) {
    console.error('Error enhancing goal:', error)
    throw new Error(error.message || 'Failed to enhance goal')
  }
} 