import { NextResponse } from 'next/server'
import OpenAI from 'openai'

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

    const { title, description, timeframe } = await request.json()

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const prompt = `As an expert in OKRs and goal setting, help enhance and structure this goal:

Title: ${title}
Description: ${description || ''}
Timeframe: ${timeframe}

Please provide:
1. An enhanced, clearer, and more data-driven version of the goal title
2. An enhanced description that better explains the strategic impact
3. 2-3 key results that would help achieve this goal, each with 1-2 specific metrics
4. Each metric should include a specific target number and unit of measurement

Format the response in JSON with this structure:
{
  "enhancedTitle": "string",
  "enhancedDescription": "string",
  "keyResults": [
    {
      "description": "string",
      "targetDate": "Q1/Q2/Q3/Q4",
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
}

Make sure all metrics are specific, measurable, and aligned with the goal.`

    console.log('Sending request to OpenAI...')
    const completion = await openai.chat.completions.create({
      messages: [{ 
        role: "user", 
        content: prompt + "\n\nIMPORTANT: Respond ONLY with the JSON object, no additional text or explanation." 
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