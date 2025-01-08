'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Sparkles, ArrowRight, Target, BarChart3 } from 'lucide-react'

type ExperimentCategory = 'marketing' | 'sales' | 'product'

export interface ExperimentSuggestion {
  title: string
  description: string
  hypothesis: string
  metrics: Array<{
    name: string
    target: number
    unit: string
  }>
  category: ExperimentCategory
}

interface ExperimentSuggestionsProps {
  onApplySuggestion: (suggestion: ExperimentSuggestion) => void
}

const SAMPLE_SUGGESTIONS: ExperimentSuggestion[] = [
  // Marketing Templates
  {
    title: "A/B Test Email Subject Lines",
    description: "Test two different subject lines to improve open rates",
    hypothesis: "Using personalized subject lines will increase email open rates by 25%",
    metrics: [
      { name: "Open Rate", target: 25, unit: "%" },
      { name: "Click Rate", target: 10, unit: "%" }
    ],
    category: "marketing"
  },
  {
    title: "Social Media Post Timing",
    description: "Test optimal posting times for engagement",
    hypothesis: "Posting during peak hours (9-11am) will increase engagement by 40%",
    metrics: [
      { name: "Engagement Rate", target: 40, unit: "%" },
      { name: "Reach", target: 5000, unit: "views" }
    ],
    category: "marketing"
  },
  {
    title: "Content Format Optimization",
    description: "Compare video vs. image post performance",
    hypothesis: "Video content will drive 2x more engagement than static images",
    metrics: [
      { name: "Engagement Rate", target: 100, unit: "% increase" },
      { name: "Watch Time", target: 30, unit: "seconds" }
    ],
    category: "marketing"
  },

  // Sales Templates
  {
    title: "Sales Follow-up Optimization",
    description: "Reduce time between initial contact and follow-up",
    hypothesis: "Reducing follow-up time to under 4 hours will increase conversion rate",
    metrics: [
      { name: "Response Time", target: 4, unit: "hours" },
      { name: "Conversion Rate", target: 15, unit: "%" }
    ],
    category: "sales"
  },
  {
    title: "Sales Script Testing",
    description: "Test new value proposition messaging",
    hypothesis: "Leading with ROI metrics will increase meeting booking rate by 30%",
    metrics: [
      { name: "Meeting Rate", target: 30, unit: "%" },
      { name: "Deal Size", target: 25, unit: "% increase" }
    ],
    category: "sales"
  },
  {
    title: "Lead Qualification Process",
    description: "Implement new lead scoring system",
    hypothesis: "Better lead scoring will improve sales efficiency by 40%",
    metrics: [
      { name: "Conversion Rate", target: 40, unit: "%" },
      { name: "Sales Cycle", target: 30, unit: "% reduction" }
    ],
    category: "sales"
  },

  // Product Templates
  {
    title: "Onboarding Flow Simplification",
    description: "Reduce steps in user onboarding process",
    hypothesis: "A simplified 3-step onboarding will increase completion rate by 30%",
    metrics: [
      { name: "Completion Rate", target: 85, unit: "%" },
      { name: "Time to Complete", target: 5, unit: "min" }
    ],
    category: "product"
  },
  {
    title: "Feature Adoption Drive",
    description: "Increase usage of key features",
    hypothesis: "In-app tooltips will increase feature adoption by 50%",
    metrics: [
      { name: "Feature Usage", target: 50, unit: "% increase" },
      { name: "User Retention", target: 20, unit: "% increase" }
    ],
    category: "product"
  },
  {
    title: "UI Navigation Enhancement",
    description: "Optimize main navigation structure",
    hypothesis: "Simplified navigation will reduce time-to-task by 25%",
    metrics: [
      { name: "Task Completion", target: 25, unit: "% faster" },
      { name: "User Satisfaction", target: 30, unit: "% increase" }
    ],
    category: "product"
  }
]

const categoryColors: Record<ExperimentCategory, string> = {
  marketing: 'bg-purple-50 text-purple-700 border-purple-200',
  sales: 'bg-blue-50 text-blue-700 border-blue-200',
  product: 'bg-green-50 text-green-700 border-green-200'
}

export function ExperimentSuggestions({ onApplySuggestion }: ExperimentSuggestionsProps) {
  const [selectedCategory, setSelectedCategory] = useState<ExperimentCategory | null>(null)

  const filteredSuggestions = selectedCategory 
    ? SAMPLE_SUGGESTIONS.filter(s => s.category === selectedCategory)
    : SAMPLE_SUGGESTIONS

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-medium">AI Suggestions</h3>
        </div>
        <div className="flex gap-2">
          {(['marketing', 'sales', 'product'] as const).map(category => (
            <Badge
              key={category}
              variant="outline"
              className={`capitalize cursor-pointer ${
                selectedCategory === category ? categoryColors[category] : ''
              }`}
              onClick={() => setSelectedCategory(
                selectedCategory === category ? null : category
              )}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-400px)]">
        <div className="space-y-4">
          {filteredSuggestions.map((suggestion, index) => (
            <Card key={index} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium">{suggestion.title}</h4>
                  <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                </div>
                <Badge variant="outline" className={categoryColors[suggestion.category]}>
                  {suggestion.category}
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-muted-foreground mt-1" />
                  <p className="text-sm">{suggestion.hypothesis}</p>
                </div>
                <div className="flex items-start gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="text-sm">
                    {suggestion.metrics.map((metric, i) => (
                      <span key={i} className="text-muted-foreground">
                        {metric.name}: {metric.target}{metric.unit}
                        {i < suggestion.metrics.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => onApplySuggestion(suggestion)}
              >
                Apply Template
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </Card>
  )
} 