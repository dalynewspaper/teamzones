import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { ExistingGoalContent } from '@/types/goals'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is not configured')
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    const { title, description, timeframe, parentGoal, generateMilestones, generateMetrics, existingContent } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    let prompt = ''
    let responseFormat = ''

    if (timeframe.toLowerCase().includes('month')) {
      prompt = `As an expert in OKRs and goal setting, help ${existingContent ? 'refine and enhance' : 'create'} this monthly goal:

Current Goal:
Title: ${title}
Description: ${description || ''}
Timeframe: ${timeframe}
${parentGoal ? `
Parent Quarterly Goal:
Title: ${parentGoal.title}
Description: ${parentGoal.description}
` : ''}${existingContent?.milestones?.length ? `

Current Milestones:
${existingContent.milestones.map((m: { title: string; description: string; dueDate: string }, i: number) => `
${i + 1}. ${m.title}
   Description: ${m.description}
   Due Date: ${m.dueDate}`).join('\n')}` : ''}${existingContent?.metrics?.length ? `

Current Metrics:
${existingContent.metrics.map((m: { name: string; target: number; unit: string }, i: number) => `
${i + 1}. ${m.name}
   Target: ${m.target} ${m.unit}`).join('\n')}` : ''}

Please provide:
1. An ${existingContent ? 'refined' : 'enhanced'}, clearer, and more actionable version of the goal title
2. A comprehensive description that explains:
   - The specific deliverables and success criteria
   - How this goal contributes to the quarterly objective
   - What needs to be accomplished this month
${generateMilestones ? `3. ${existingContent?.milestones?.length ? 'Refined versions of the existing milestones' : '3-4 key milestones that break down the goal into actionable steps'}
   - Each milestone should have a clear title and description
   - Milestones should be spread across the month` : ''}
${generateMetrics ? `4. ${existingContent?.metrics?.length ? 'Refined versions of the existing metrics' : '2-3 progress metrics that help track goal achievement'}
   - Each metric should have a specific target number and unit
   - Metrics should be measurable on a weekly basis` : ''}`

      responseFormat = `Format the response in JSON with this structure:
{
  "enhancedTitle": "string",
  "enhancedDescription": "string"${generateMilestones ? `,
  "milestones": [
    {
      "title": "string",
      "description": "string",
      "dueDate": "YYYY-MM-DD"
    }
  ]` : ''}${generateMetrics ? `,
  "metrics": [
    {
      "name": "string",
      "target": number,
      "unit": "string"
    }
  ]` : ''}
}`
    } else if (timeframe.toLowerCase().includes('q')) {
      prompt = `As an expert in OKRs and goal setting, help create a tactical quarterly goal that contributes to this annual objective:

Parent Goal (Annual):
Title: ${parentGoal.title}
Description: ${parentGoal.description}

Current Draft (Optional):
${title !== "Quarterly goal suggestion" ? `Title: ${title}
Description: ${description}` : "No draft provided - please suggest a quarterly goal"}

Timeframe: ${timeframe}

Please provide:
1. A specific, tactical quarterly goal title that directly contributes to achieving the annual goal
2. A clear description that explains:
   - How this quarterly goal aligns with and supports the annual goal
   - The specific impact and outcomes expected
   - Why this is the right focus for this quarter
3. 2-3 key results that would help achieve this goal, each with 1-2 specific metrics
4. Each metric should include a specific target number and unit of measurement`

      responseFormat = `Format the response in JSON with this structure:
{
  "enhancedTitle": "string",
  "enhancedDescription": "string",
  "keyResults": [
    {
      "description": "string",
      "targetDate": "string",
      "metrics": [
        {
          "name": "string",
          "target": number,
          "unit": "string",
          "frequency": "monthly"
        }
      ]
    }
  ]
}`
    } else {
      prompt = `As an expert in OKRs and goal setting, help enhance and structure this annual goal:

Current Goal:
Title: ${title}
Description: ${description || ''}
Timeframe: ${timeframe}

Please provide:
1. An enhanced, clearer, and more data-driven version of the goal title that reflects its strategic importance
2. A comprehensive description that explains:
   - The strategic impact and long-term value
   - Why this goal matters for the organization
   - What success looks like at the end of the year
3. 2-3 key results that would help achieve this goal, each with 1-2 specific metrics
4. Each metric should include a specific target number and unit of measurement`

      responseFormat = `Format the response in JSON with this structure:
{
  "enhancedTitle": "string",
  "enhancedDescription": "string",
  "keyResults": [
    {
      "description": "string",
      "targetDate": "string",
      "metrics": [
        {
          "name": "string",
          "target": number,
          "unit": "string",
          "frequency": "quarterly"
        }
      ]
    }
  ]
}`
    }

    prompt += `\n\n${responseFormat}\n\nIMPORTANT: Respond ONLY with the JSON object, no additional text or explanation.`

    console.log('Sending request to OpenAI...')
    const completion = await openai.chat.completions.create({
      messages: [{ 
        role: "user", 
        content: prompt
      }],
      model: "gpt-4",
      temperature: 0.7
    })

    const response = completion.choices[0].message.content
    if (!response) {
      console.error('No content in OpenAI response')
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      )
    }

    console.log('Received response from OpenAI:', response)
    try {
      const parsedResponse = JSON.parse(response.trim())
      return NextResponse.json(parsedResponse)
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError)
      return NextResponse.json(
        { 
          error: 'Failed to parse OpenAI response',
          details: 'The response was not valid JSON'
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in enhance-goal API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to enhance goal',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
} 