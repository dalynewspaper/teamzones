'use client';
import { useWeek } from '@/contexts/WeekContext'
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid'
import { ProfileMenu } from '@/components/layout/ProfileMenu'

export function Header() {
  const { currentWeek, setWeekId } = useWeek()

  const handleWeekChange = (direction: 'prev' | 'next') => {
    if (!currentWeek) return

    const currentDate = new Date(currentWeek.startDate)
    const newDate = direction === 'next' 
      ? addWeeks(currentDate, 1)
      : subWeeks(currentDate, 1)

    const weekNumber = format(newDate, 'I')
    const year = format(newDate, 'yyyy')
    const newWeekId = `${year}-W${weekNumber.padStart(2, '0')}`
    
    setWeekId(newWeekId)
  }

  if (!currentWeek) return null

  const start = format(new Date(currentWeek.startDate), 'MMM d')
  const end = format(new Date(currentWeek.endDate), 'MMM d, yyyy')

  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-semibold text-gray-900">
            TeamZones
          </h1>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleWeekChange('prev')}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
              </button>

              <div className="text-sm text-gray-600">
                {start} - {end}
              </div>

              <button
                onClick={() => handleWeekChange('next')}
                className="p-1 rounded-full hover:bg-gray-100"
                disabled={isCurrentWeek(currentWeek.endDate)}
              >
                <ChevronRightIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <ProfileMenu />
          </div>
        </div>
      </div>
    </header>
  )
}

function isCurrentWeek(endDate: string): boolean {
  const today = new Date()
  const weekEnd = new Date(endDate)
  return weekEnd > today
} 