'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Goal } from '@/types/goals'
import { getGoal, deleteGoal } from '@/services/goalService'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Calendar, Flag, Target, Users2, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/use-toast'
import { Dashboard } from '@/components/dashboard/Dashboard'
import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface GoalPageProps {
  params: Promise<{ id: string }>
}

export default function AnnualGoalPage({ params }: GoalPageProps) {
  const resolvedParams = React.use(params)
  const goalId = resolvedParams.id
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    const loadGoal = async () => {
      if (!user?.organizationId || !goalId) return
      
      try {
        setIsLoading(true)
        const fetchedGoal = await getGoal(goalId)
        if (!fetchedGoal) {
          router.push('/dashboard/goals')
          return
        }
        if (fetchedGoal.timeframe !== 'annual') {
          router.push('/dashboard/goals')
          return
        }
        setGoal(fetchedGoal)
      } catch (error) {
        console.error('Error loading goal:', error)
        toast({
          title: 'Error',
          description: 'Failed to load goal details.',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadGoal()
  }, [goalId, user?.organizationId, toast, router])

  const handleDelete = async () => {
    if (!goal?.id) return

    try {
      await deleteGoal(goal.id)
      toast({
        title: 'Success',
        description: 'Goal deleted successfully.'
      })
      router.push('/dashboard/goals')
    } catch (error) {
      console.error('Error deleting goal:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete goal.',
        variant: 'destructive'
      })
    }
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="animate-pulse space-y-4 p-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      )
    }

    if (!goal) {
      return (
        <div className="p-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Goal not found</h2>
            <p className="text-muted-foreground mb-4">This goal may have been deleted or you don't have access to it.</p>
            <Link href="/dashboard/goals">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Goals
              </Button>
            </Link>
          </div>
        </div>
      )
    }

    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section with Background */}
        <div className="bg-white border-b">
          <div className="px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <Link href="/dashboard/goals" className="text-sm text-muted-foreground hover:text-primary">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Goals
                </Button>
              </Link>
              <div className="flex gap-2">
                <Link href={`/dashboard/goals/annual/${goal.id}/edit`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight">{goal.title}</h1>
              <p className="text-lg text-muted-foreground max-w-3xl">{goal.description}</p>
            </div>

            {/* Goal Metadata */}
            <div className="mt-8 inline-flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{new Date(goal.startDate).toLocaleDateString()} - {new Date(goal.endDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Flag className="h-4 w-4" />
                <span className="capitalize">{goal.priority} Priority</span>
              </div>
              {goal.assignees?.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users2 className="h-4 w-4" />
                  <span>{goal.assignees.length} Assignees</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 space-y-6">
          {/* Progress Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Overall Progress</h2>
                <p className="text-sm text-muted-foreground">Track the completion of this goal</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{goal.progress || 0}%</span>
                <p className="text-sm text-muted-foreground">Complete</p>
              </div>
            </div>
            <Progress value={goal.progress || 0} className="h-2" />
          </Card>

          {/* Key Results Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Key Results</h2>
                <p className="text-sm text-muted-foreground">Measurable outcomes that define success</p>
              </div>
              <Badge variant="secondary" className="h-6">{goal.keyResults?.length || 0} Total</Badge>
            </div>
            
            <div className="grid gap-4">
              {goal.keyResults?.map((kr, index) => (
                <Card key={kr.id || index} className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <Badge variant="outline" className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div className="space-y-1 flex-1">
                        <h3 className="font-medium">{kr.description}</h3>
                        <p className="text-sm text-muted-foreground">
                          Due by {new Date(kr.targetDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {kr.metrics?.length > 0 && (
                      <div className="mt-4 border-t pt-4">
                        <h4 className="text-sm font-medium mb-3">Success Metrics</h4>
                        <div className="grid gap-3">
                          {kr.metrics.map((metric, i) => (
                            <div key={metric.id || i} className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
                              <span className="text-muted-foreground">{metric.name}</span>
                              <div className="flex items-center gap-3">
                                <div className="flex items-baseline gap-1">
                                  <span className="font-medium">{metric.current || 0}</span>
                                  <span className="text-muted-foreground">/</span>
                                  <span className="font-medium">{metric.target || 0}</span>
                                  <span className="text-muted-foreground">{metric.unit}</span>
                                </div>
                                <Badge variant="secondary">
                                  {metric.frequency}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this goal
                and all of its key results and metrics.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  return (
    <Dashboard>
      <div className="flex-1 overflow-auto bg-background">
        {renderContent()}
      </div>
    </Dashboard>
  )
} 