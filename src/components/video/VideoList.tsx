'use client';
import { useEffect, useState } from 'react';
import { VideoUpdate } from '@/types/firestore';
import { useWeek } from '@/contexts/WeekContext';
import { useAuth } from '@/contexts/AuthContext';

export function VideoList() {
  const { weekId, currentWeek } = useWeek();
  const { user } = useAuth();
  const videos = currentWeek?.videos?.filter(v => v.userId === user?.uid) || [];

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No videos</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by recording your first video update.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {videos.map((video: VideoUpdate) => (
        <div key={video.id} className="bg-white shadow rounded-lg overflow-hidden">
          <video 
            src={video.url} 
            controls 
            className="w-full"
          />
          <div className="p-4">
            <p className="text-sm text-gray-500">
              Recorded on {new Date(video.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
} 