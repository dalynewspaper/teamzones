'use client';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { getWeekDates } from '@/lib/date';
import { formatDate } from '@/lib/utils';

interface WeekSelectorProps {
  weekId: string;
  onWeekChange: (weekId: string) => void;
}

export function WeekSelector({ weekId, onWeekChange }: WeekSelectorProps) {
  const { start, end } = getWeekDates(weekId);
  
  const changeWeek = (offset: number) => {
    const date = new Date(start);
    date.setDate(date.getDate() + offset * 7);
    const weekNumber = getWeekNumber(date);
    const newWeekId = `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
    onWeekChange(newWeekId);
  };

  return (
    <div className="flex items-center space-x-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => changeWeek(-1)}
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      
      <div className="text-sm">
        <span className="font-medium">
          {formatDate(start.toISOString())}
        </span>
        <span className="mx-2">-</span>
        <span className="font-medium">
          {formatDate(end.toISOString())}
        </span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => changeWeek(1)}
      >
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

function getWeekNumber(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
} 