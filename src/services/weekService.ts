import { getDocuments, createDocument, updateDocument } from './firestoreService';
import type { Week } from '@/types/firestore';

export async function getCurrentWeek(): Promise<Week | null> {
  const weeks = await getDocuments<Week>('weeks', {
    filters: [{
      field: 'status',
      operator: '==',
      value: 'active'
    }],
    orderByField: 'startDate',
    orderDirection: 'desc'
  });

  return weeks[0] || null;
}

export async function createWeek(startDate: string, endDate: string): Promise<string> {
  const week: Omit<Week, 'id'> = {
    startDate,
    endDate,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return createDocument('weeks', week);
}

export async function archiveWeek(weekId: string): Promise<void> {
  await updateDocument<Week>('weeks', weekId, { status: 'archived' });
} 