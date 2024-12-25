'use client';

import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface GoogleButtonProps {
  onClick: () => void;
  loading?: boolean;
  className?: string;
}

export function GoogleButton({ onClick, loading, className }: GoogleButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={loading}
      variant="outline"
      className={`relative flex items-center justify-center gap-3 w-full bg-white hover:bg-gray-50 text-black font-medium border-gray-200 ${className}`}
    >
      <Image
        src="/google.svg"
        alt="Google"
        width={24}
        height={24}
        className="w-6 h-6"
      />
      <span>Continue with Google</span>
      {loading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}
    </Button>
  );
} 