'use client'
import React, { useState } from 'react'
import { Button } from '../ui/button';
import { VideoIcon } from '../ui/icons';
import { RecordingModal } from './RecordingModal';

interface VideoRecordingButtonProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
  weekId: string;
}

export function VideoRecordingButton({ 
  children = 'Record Video',
  className,
  variant = 'primary',
  weekId 
}: VideoRecordingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button 
        variant={variant}
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <VideoIcon className="mr-2 h-5 w-5" />
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