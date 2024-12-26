'use client';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useWeek } from '@/contexts/WeekContext';
import { formatDate } from '@/lib/utils';
import { getWeekDates, getCurrentWeekId } from '@/lib/date';

export function WeekSelector() {
  const { currentWeek } = useWeek();
  const weekId = currentWeek?.id || getCurrentWeekId();
  
  const { start, end } = getWeekDates(weekId);

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <button
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        
        <div>
          <h2 className="text-lg font-semibold">
            Week {weekId.split('-')[1]}, {weekId.split('-')[0]}
          </h2>
          <p className="text-sm text-gray-500">
            {formatDate(start.toString())} - {formatDate(end.toString())}
          </p>
        </div>

        <button
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <button className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
          View Report
        </button>
        <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Set Goals
        </button>
      </div>
    </div>
  );
} 