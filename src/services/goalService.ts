import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc, orderBy, onSnapshot, QueryConstraint } from 'firebase/firestore';
import { Goal, GoalTimeframe, GoalType, AllGoalTimeframes } from '@/types/goals';
import { eventBus } from '@/lib/eventBus';

export async function createGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const goalsCollection = collection(db, 'goals');
  const now = new Date();
  
  const docRef = await addDoc(goalsCollection, {
    ...goal,
    createdAt: now,
    updatedAt: now
  });
  
  // Get the created goal data to emit with the event
  const goalSnap = await getDoc(docRef);
  const goalData = goalSnap.data();
  const createdGoal = {
    id: docRef.id,
    ...goalData,
    startDate: goalData?.startDate?.toDate() || new Date(),
    endDate: goalData?.endDate?.toDate() || new Date(),
    createdAt: goalData?.createdAt?.toDate() || new Date(),
    updatedAt: goalData?.updatedAt?.toDate() || new Date(),
  } as Goal;
  
  // Emit the goalCreated event
  eventBus.emit('goalCreated', createdGoal);
  
  return docRef.id;
}

export async function updateGoal(goalId: string, goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
  const goalRef = doc(db, 'goals', goalId);
  await updateDoc(goalRef, {
    ...goalData,
    updatedAt: new Date()
  });

  // Get the updated goal data to emit with the event
  const goalSnap = await getDoc(goalRef);
  const updatedGoalData = goalSnap.data();
  const updatedGoal = {
    id: goalId,
    ...updatedGoalData,
    startDate: updatedGoalData?.startDate?.toDate() || new Date(),
    endDate: updatedGoalData?.endDate?.toDate() || new Date(),
    createdAt: updatedGoalData?.createdAt?.toDate() || new Date(),
    updatedAt: updatedGoalData?.updatedAt?.toDate() || new Date(),
  } as Goal;

  // Emit the goalUpdated event
  eventBus.emit('goalUpdated', updatedGoal);
}

export async function deleteGoal(goalId: string): Promise<void> {
  const goalRef = doc(db, 'goals', goalId);
  await deleteDoc(goalRef);
  
  // Emit the goalDeleted event
  eventBus.emit('goalDeleted', goalId);
}

export async function getGoal(goalId: string): Promise<Goal | null> {
  return getGoalById(goalId)
}

export async function getGoalsByTimeframe(
  timeframe: AllGoalTimeframes,
  organizationId: string,
  calendarWeek?: number,
  year?: number,
  startDate?: Date,
  endDate?: Date
): Promise<Goal[]> {
  const goalsCollection = collection(db, 'goals');
  let goals: Goal[] = [];

  if (timeframe === 'weekly') {
    const weeklyQuery = query(
      goalsCollection,
      where('timeframe', '==', timeframe),
      where('organizationId', '==', organizationId)
    );
    
    const weeklySnapshot = await getDocs(weeklyQuery);
    goals = weeklySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));

    // If calendar week and year are provided, filter by them
    if (calendarWeek && year) {
      goals = goals.filter(goal => goal.calendarWeek === calendarWeek && goal.year === year);
    }
    // If date range is provided, filter by it
    else if (startDate && endDate) {
      goals = goals.filter(goal => {
        const goalStart = goal.startDate instanceof Date ? goal.startDate : new Date(goal.startDate);
        const goalEnd = goal.endDate instanceof Date ? goal.endDate : new Date(goal.endDate);
        return (
          (goalStart <= endDate && goalStart >= startDate) || // Goal starts in range
          (goalEnd >= startDate && goalEnd <= endDate) || // Goal ends in range
          (goalStart <= startDate && goalEnd >= endDate) // Goal spans range
        );
      });
    }
  } else {
    // Handle other timeframes (annual, quarterly, monthly)
    const timeframeQuery = query(
      goalsCollection,
      where('timeframe', '==', timeframe),
      where('organizationId', '==', organizationId)
    );
    
    const snapshot = await getDocs(timeframeQuery);
    goals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
  }
  
  // Sort by createdAt client-side
  return goals.sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
    const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });
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
      updatedAt: goalData.updatedAt?.toDate() || new Date(),
      metrics: goalData.metrics || [],
      keyResults: goalData.keyResults || [],
      milestones: goalData.milestones || [],
      assignees: goalData.assignees || [],
      tags: goalData.tags || [],
      teamRoles: goalData.teamRoles || []
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

export async function assignTeamToGoal(
  goalId: string,
  teamId: string,
  role: 'primary' | 'supporting' = 'primary'
): Promise<void> {
  const goalRef = doc(db, 'goals', goalId);
  const goalDoc = await getDoc(goalRef);
  
  if (!goalDoc.exists()) {
    throw new Error('Goal not found');
  }

  const goal = goalDoc.data() as Goal;
  const teamRoles = goal.teamRoles || [];
  
  // Remove any existing role for this team
  const filteredRoles = teamRoles.filter(tr => tr.teamId !== teamId);
  
  // Add the new role
  filteredRoles.push({ teamId, role });

  await updateDoc(goalRef, {
    teamRoles: filteredRoles,
    updatedAt: new Date()
  });
}

export async function assignMemberToGoal(
  goalId: string,
  userId: string,
  role: 'owner' | 'contributor' | 'reviewer'
): Promise<void> {
  const goalRef = doc(db, 'goals', goalId);
  const goalDoc = await getDoc(goalRef);
  
  if (!goalDoc.exists()) {
    throw new Error('Goal not found');
  }

  const goal = goalDoc.data() as Goal;
  const assignees = goal.assignees || [];
  
  // Remove any existing assignment for this user
  const filteredAssignees = assignees.filter(a => a.userId !== userId);
  
  // Add the new assignment
  filteredAssignees.push({
    userId,
    role,
    name: '',
    assignedAt: new Date()
  });

  await updateDoc(goalRef, {
    assignees: filteredAssignees,
    updatedAt: new Date()
  });
}

export async function removeTeamFromGoal(goalId: string, teamId: string): Promise<void> {
  const goalRef = doc(db, 'goals', goalId);
  const goalDoc = await getDoc(goalRef);
  
  if (!goalDoc.exists()) {
    throw new Error('Goal not found');
  }

  const goal = goalDoc.data() as Goal;
  const teamRoles = goal.teamRoles || [];
  
  await updateDoc(goalRef, {
    teamRoles: teamRoles.filter(tr => tr.teamId !== teamId),
    updatedAt: new Date()
  });
}

export async function removeMemberFromGoal(goalId: string, userId: string): Promise<void> {
  const goalRef = doc(db, 'goals', goalId);
  const goalDoc = await getDoc(goalRef);
  
  if (!goalDoc.exists()) {
    throw new Error('Goal not found');
  }

  const goal = goalDoc.data() as Goal;
  const assignees = goal.assignees || [];
  
  await updateDoc(goalRef, {
    assignees: assignees.filter(a => a.userId !== userId),
    updatedAt: new Date()
  });
}

// Real-time subscription methods
export function subscribeToGoal(goalId: string, callback: (goal: Goal | null) => void) {
  const goalRef = doc(db, 'goals', goalId);
  
  return onSnapshot(goalRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    const goalData = snapshot.data();
    callback({
      id: snapshot.id,
      ...goalData,
      startDate: goalData.startDate?.toDate() || new Date(),
      endDate: goalData.endDate?.toDate() || new Date(),
      createdAt: goalData.createdAt?.toDate() || new Date(),
      updatedAt: goalData.updatedAt?.toDate() || new Date(),
      metrics: goalData.metrics || [],
      keyResults: goalData.keyResults || [],
      milestones: goalData.milestones || [],
      assignees: goalData.assignees || [],
      tags: goalData.tags || [],
      teamRoles: goalData.teamRoles || []
    } as Goal);
  });
}

export function subscribeToGoalsByTimeframe(
  timeframe: AllGoalTimeframes,
  organizationId: string,
  callback: (goals: Goal[]) => void,
  calendarWeek?: number,
  year?: number,
  startDate?: Date,
  endDate?: Date
) {
  const goalsCollection = collection(db, 'goals');
  const constraints: QueryConstraint[] = [
    where('timeframe', '==', timeframe),
    where('organizationId', '==', organizationId)
  ];

  const q = query(goalsCollection, ...constraints);
  
  return onSnapshot(q, (snapshot) => {
    let goals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));

    // Apply client-side filters for weekly goals
    if (timeframe === 'weekly') {
      if (calendarWeek && year) {
        goals = goals.filter(goal => goal.calendarWeek === calendarWeek && goal.year === year);
      } else if (startDate && endDate) {
        goals = goals.filter(goal => {
          const goalStart = goal.startDate instanceof Date ? goal.startDate : new Date(goal.startDate);
          const goalEnd = goal.endDate instanceof Date ? goal.endDate : new Date(goal.endDate);
          return (
            (goalStart <= endDate && goalStart >= startDate) ||
            (goalEnd >= startDate && goalEnd <= endDate) ||
            (goalStart <= startDate && goalEnd >= endDate)
          );
        });
      }
    }

    // Sort by createdAt
    goals.sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    callback(goals);
  });
}

export function subscribeToGoalsByType(
  type: GoalType,
  organizationId: string,
  callback: (goals: Goal[]) => void
) {
  const goalsCollection = collection(db, 'goals');
  const q = query(
    goalsCollection,
    where('type', '==', type),
    where('organizationId', '==', organizationId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const goals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
    callback(goals);
  });
}

export function subscribeToChildGoals(
  parentGoalId: string,
  callback: (goals: Goal[]) => void
) {
  const goalsCollection = collection(db, 'goals');
  const q = query(
    goalsCollection,
    where('parentGoalId', '==', parentGoalId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const goals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
    callback(goals);
  });
} 