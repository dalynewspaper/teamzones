interface GoalSuggestions {
  enhancedTitle: string
  enhancedDescription: string
  keyResults: Array<{
    description: string
    targetDate: string
    metrics: Array<{
      name: string
      target: number
      unit: string
      frequency: 'monthly' | 'quarterly'
    }>
  }>
}

export async function enhanceGoal(
  title: string,
  description: string,
  timeframe: string
): Promise<GoalSuggestions> {
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
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const errorMessage = data.details || data.error || 'Failed to enhance goal'
      throw new Error(errorMessage)
    }

    return data as GoalSuggestions
  } catch (error: any) {
    console.error('Error enhancing goal:', error)
    throw new Error(error.message || 'Failed to enhance goal')
  }
} 