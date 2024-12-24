export function getWeekDates(weekId: string) {
  const [year, week] = weekId.split('-W').map(Number);
  const firstDayOfYear = new Date(year, 0, 1);
  const firstWeekday = firstDayOfYear.getDay();
  
  // Calculate the first day of the week
  const firstDayOfWeek = new Date(year, 0, 1 + (week - 1) * 7 - firstWeekday);
  
  // Calculate the last day of the week
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
  
  return {
    start: firstDayOfWeek,
    end: lastDayOfWeek
  };
}

export function getCurrentWeekId() {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - start.getDay());
  
  const weekNumber = getWeekNumber(now);
  return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}

function getWeekNumber(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
} 