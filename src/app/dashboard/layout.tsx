'use client';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingPage } from '@/components/ui/loading-page';
import { Header } from '@/components/dashboard/layout/Header';
import { Sidebar } from '@/components/dashboard/layout/Sidebar';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingPage />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <OnboardingModal />
    </div>
  );
} 