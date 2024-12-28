'use client';
import { ProfileMenu } from '@/components/layout/ProfileMenu';
import { Logo } from '@/components/ui/logo';

export function Header() {
  return (
    <header className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <Logo showLink={false} />
        <ProfileMenu />
      </div>
    </header>
  );
} 