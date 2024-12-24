'use client';
import { ProfileMenu } from '@/components/layout/ProfileMenu';

export function Header() {
  return (
    <header className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <ProfileMenu />
      </div>
    </header>
  );
} 