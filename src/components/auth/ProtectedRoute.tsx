'use client'
import { useAuth } from '@/contexts/AuthContext';
import { redirect } from 'next/navigation';
import { Loading } from '@/components/ui/loading';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    redirect('/signin');
  }

  return <>{children}</>;
} 