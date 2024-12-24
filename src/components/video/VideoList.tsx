'use client';
import { useEffect, useState } from 'react';
import { getWeekVideos } from '@/services/videoService';
import { VideoPlayer } from './VideoPlayer';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loading } from '@/components/ui/loading';
import type { Video } from '@/types/firestore';

interface VideoListProps {
  weekId: string;
  onError?: (message: string) => void;
}

export function VideoList({ weekId, onError }: VideoListProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVideos() {
      try {
        setLoading(true);
        const weekVideos = await getWeekVideos(weekId);
        setVideos(weekVideos);
      } catch (error) {
        console.error('Failed to load videos:', error);
        onError?.('Failed to load videos. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadVideos();
  }, [weekId, onError]);

  if (loading) return <Loading />;
  if (!videos.length) return <EmptyState weekId={weekId} />;

  return (
    <div className="space-y-6">
      {videos.map((video) => (
        <div key={video.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{video.title}</h3>
            <span className="text-sm text-gray-500">
              {new Date(video.createdAt).toLocaleDateString()}
            </span>
          </div>
          <VideoPlayer 
            src={video.url} 
            poster={video.thumbnailUrl} 
          />
        </div>
      ))}
    </div>
  );
} 