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
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center space-x-2">
        <Button
          onClick={() => navigateWeek('prev')}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>

        <div className="flex flex-col">
          <h2 className="text-base font-medium">
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
          className="h-8 w-8 p-0"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
} 