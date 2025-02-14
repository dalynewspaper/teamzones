'use client';

import Image from 'next/image'

interface GoogleButtonProps {
  onClick: () => void;
  loading?: boolean;
  className?: string;
}

export function GoogleButton({ onClick, loading, className }: GoogleButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      type="button"
      className={`
        w-full h-[40px] 
        bg-white hover:bg-gray-50
        text-gray-900
        px-3
        rounded
        flex items-center
        transition-colors
        disabled:opacity-70
        border border-gray-300
        ${className}
      `}
    >
      <div className="p-2">
        <Image
          src="/google.svg"
          alt="Google"
          width={18}
          height={18}
        />
      </div>
      <span className="flex-1 text-center text-[14px] font-medium pr-3">
        Sign in with Google
      </span>
      {loading && (
        <div className="mr-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}
    </button>
  );
} 