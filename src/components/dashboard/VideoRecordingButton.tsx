'use client'
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VideoRecordIcon } from '@/components/ui/icons';
import { RecordingModal } from './RecordingModal';

interface VideoRecordingButtonProps {
  weekId: string;
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline';
}

export function VideoRecordingButton({ 
  weekId,
  children = 'Record Video',
  className,
  variant = 'default'
}: VideoRecordingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        variant={variant}
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <VideoRecordIcon className="mr-2 h-5 w-5" />
        {children}
      </Button>

      <RecordingModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        weekId={weekId}
      />
    </>
  );
} 