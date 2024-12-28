'use client'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useWeek } from '@/contexts/WeekContext'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'

export function WeekNavigator() {
  const { currentWeek, navigateWeek } = useWeek()

  if (!currentWeek) return null

  const formatDate = (date: Date) => {
    return format(date, 'MMM d, yyyy')
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigateWeek('prev')}
            variant="ghost"
            size="sm"
            className="hover:bg-gray-100 rounded-full p-2 h-auto"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold">
              CW {currentWeek.weekNumber}, {currentWeek.year}
            </h2>
            <p className="text-sm text-gray-500">
              {formatDate(currentWeek.startDate)} - {formatDate(currentWeek.endDate)}
            </p>
          </div>
          <Button
            onClick={() => navigateWeek('next')}
            variant="ghost"
            size="sm"
            className="hover:bg-gray-100 rounded-full p-2 h-auto"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            Weekly Report
          </Button>
          <Button size="sm" className="bg-notion-blue hover:bg-notion-blue-dark text-white">
            Set Weekly Goals
          </Button>
        </div>
      </div>
    </div>
  )
} 