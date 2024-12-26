'use client';

import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface GoogleButtonProps {
  onClick: () => void;
  loading?: boolean;
  className?: string;
}

export function GoogleButton({ onClick, loading, className }: GoogleButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative group"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4285F4] to-[#34A853] rounded-lg opacity-0 group-hover:opacity-10 transition duration-500 blur" />
      <Button
        onClick={onClick}
        disabled={loading}
        variant="outline"
        className={`
          relative w-full bg-white hover:bg-gray-50 text-gray-700 font-medium 
          border border-gray-200 shadow-sm hover:shadow-md
          transition-all duration-200
          ${className}
        `}
      >
        <div className="flex items-center justify-center gap-3 w-full">
          <div className="relative flex-shrink-0">
            <Image
              src="/google.svg"
              alt="Google"
              width={24}
              height={24}
              className="w-6 h-6 transition-transform group-hover:scale-110"
            />
          </div>
          <span className="text-sm">Continue with Google</span>
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-gray-200 border-t-[#4285F4] rounded-full animate-spin" />
            </div>
          )}
        </div>
      </Button>
    </motion.div>
  );
} 