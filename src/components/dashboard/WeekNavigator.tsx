'use client'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useWeek } from '@/contexts/WeekContext'

export function WeekNavigator() {
  const { weekId, setWeekId, weekNumber, weekYear, weekStart, weekEnd } = useWeek()

  const navigateWeek = (direction: 'prev' | 'next') => {
    const date = new Date(direction === 'next' ? weekEnd : weekStart)
    date.setDate(date.getDate() + (direction === 'next' ? 1 : -1))
    setWeekId(`${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-lg font-semibold">
              Week {weekNumber}, {weekYear}
            </h2>
            <p className="text-sm text-gray-500">
              {formatDate(weekStart)} - {formatDate(weekEnd)}
            </p>
          </div>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50">
            Weekly Report
          </button>
          <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Set Weekly Goals
          </button>
        </div>
      </div>
    </div>
  )
} 