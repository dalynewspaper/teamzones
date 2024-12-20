'use client'
import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export function WeekNavigator() {
  const [currentWeek, setCurrentWeek] = useState(new Date())

  const getWeekDates = (date: Date) => {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay() + 1) // Monday
    const end = new Date(start)
    end.setDate(start.getDate() + 6) // Sunday

    // Calculate the ISO week number
    const target = new Date(date.valueOf())
    const dayNumber = (date.getDay() + 6) % 7
    target.setDate(target.getDate() - dayNumber + 3)
    const firstThursday = target.valueOf()
    target.setMonth(0, 1)
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
    }
    const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)

    return {
      start,
      end,
      weekNumber
    }
  }

  const { start, end, weekNumber } = getWeekDates(currentWeek)

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek)
    newDate.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newDate)
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
              Week {weekNumber}, {currentWeek.getFullYear()}
            </h2>
            <p className="text-sm text-gray-500">
              {formatDate(start)} - {formatDate(end)}
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