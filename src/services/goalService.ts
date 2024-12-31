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

export async function updateGoal(goalId: string, updates: Partial<Goal>): Promise<void> {
  const goalRef = doc(db, 'goals', goalId);
  await updateDoc(goalRef, {
    ...updates,
    updatedAt: new Date()
  });
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