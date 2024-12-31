import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { Goal, GoalTimeframe, GoalType } from '@/types/goals';

export async function createGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const goalsCollection = collection(db, 'goals');
  const now = new Date();
  
  const docRef = await addDoc(goalsCollection, {
    ...goal,
    createdAt: now,
    updatedAt: now
  });
  
  return docRef.id;
}

export async function updateGoal(goalId: string, goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  const goalRef = doc(db, 'goals', goalId)
  await updateDoc(goalRef, {
    ...goalData,
    updatedAt: new Date()
  })
}

export async function deleteGoal(goalId: string): Promise<void> {
  const goalRef = doc(db, 'goals', goalId);
  await deleteDoc(goalRef);
}

export async function getGoal(goalId: string): Promise<Goal | null> {
  const goalRef = doc(db, 'goals', goalId);
  const goalSnap = await getDoc(goalRef);
  
  if (!goalSnap.exists()) {
    return null;
  }
  
  return { id: goalSnap.id, ...goalSnap.data() } as Goal;
}

export async function getGoalsByTimeframe(
  timeframe: GoalTimeframe,
  organizationId: string
): Promise<Goal[]> {
  const goalsCollection = collection(db, 'goals');
  const q = query(
    goalsCollection,
    where('timeframe', '==', timeframe),
    where('organizationId', '==', organizationId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
}

export async function getGoalsByType(
  type: GoalType,
  organizationId: string
): Promise<Goal[]> {
  const goalsCollection = collection(db, 'goals');
  const q = query(
    goalsCollection,
    where('type', '==', type),
    where('organizationId', '==', organizationId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
}

export async function getChildGoals(parentGoalId: string): Promise<Goal[]> {
  const goalsCollection = collection(db, 'goals');
  const q = query(
    goalsCollection,
    where('parentGoalId', '==', parentGoalId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
}

export async function getTeamGoals(teamId: string): Promise<Goal[]> {
  const goalsCollection = collection(db, 'goals');
  const q = query(
    goalsCollection,
    where('teamId', '==', teamId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
}

export async function getDepartmentGoals(departmentId: string): Promise<Goal[]> {
  const goalsCollection = collection(db, 'goals');
  const q = query(
    goalsCollection,
    where('departmentId', '==', departmentId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
}

export async function getGoalById(goalId: string): Promise<Goal | null> {
  try {
    const goalRef = doc(db, 'goals', goalId)
    const goalSnap = await getDoc(goalRef)
    
    if (!goalSnap.exists()) {
      return null
    }

    const goalData = goalSnap.data()
    return {
      id: goalSnap.id,
      ...goalData,
      startDate: goalData.startDate?.toDate() || new Date(),
      endDate: goalData.endDate?.toDate() || new Date(),
      createdAt: goalData.createdAt?.toDate() || new Date(),
      updatedAt: goalData.updatedAt?.toDate() || null,
    } as Goal
  } catch (error) {
    console.error('Error fetching goal:', error)
    throw error
  }
}

export async function updateGoalProgress(goalId: string, progress: number): Promise<void> {
  const goalRef = doc(db, 'goals', goalId)
  await updateDoc(goalRef, {
    progress,
    updatedAt: new Date()
  })
}

export async function updateGoalMetrics(goalId: string, metricId: string, updates: Partial<Goal['metrics'][0]>): Promise<void> {
  const goalRef = doc(db, 'goals', goalId)
  const goalDoc = await getDoc(goalRef)
  const goal = goalDoc.data() as Goal

  const updatedMetrics = goal.metrics.map(metric => 
    metric.id === metricId ? { ...metric, ...updates } : metric
  )

  await updateDoc(goalRef, {
    metrics: updatedMetrics,
    updatedAt: new Date()
  })
}

export async function updateKeyResultMetric(
  goalId: string, 
  keyResultId: string, 
  metricId: string, 
  updates: Partial<Goal['metrics'][0]>
): Promise<void> {
  const goalRef = doc(db, 'goals', goalId)
  const goalDoc = await getDoc(goalRef)
  const goal = goalDoc.data() as Goal

  const updatedKeyResults = goal.keyResults.map(kr => {
    if (kr.id === keyResultId) {
      const updatedMetrics = kr.metrics.map(metric =>
        metric.id === metricId ? { ...metric, ...updates } : metric
      )
      return { ...kr, metrics: updatedMetrics }
    }
    return kr
  })

  await updateDoc(goalRef, {
    keyResults: updatedKeyResults,
    updatedAt: new Date()
  })
} 