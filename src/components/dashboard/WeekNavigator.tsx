'use client'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useWeek } from '@/contexts/WeekContext'
import { Button } from '@/components/ui/button'

export function WeekNavigator() {
  const { weekId, setWeekId, weekNumber, weekYear, weekStart, weekEnd } = useWeek()

  const navigateWeek = (direction: 'prev' | 'next') => {
    const date = new Date(direction === 'next' ? weekEnd : weekStart)
    date.setDate(date.getDate() + (direction === 'next' ? 1 : -1))
    setWeekId(`${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div className="text-sm font-medium">
              {formatDate(weekStart)} - {formatDate(weekEnd)}
            </div>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            Weekly Report
          </Button>
          <Button size="sm">
            Set Goals
          </Button>
        </div>
      </div>
    </div>
  )
} 