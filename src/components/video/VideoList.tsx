'use client';
import { useEffect, useState } from 'react';
import { VideoUpdate } from '@/types/firestore';
import { useWeek } from '@/contexts/WeekContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { PlayIcon, ClockIcon } from '@heroicons/react/24/solid';
import { VideoCameraIcon } from '@heroicons/react/24/outline';
import { VideoPlayer } from './VideoPlayer';
import { updateDoc } from 'firebase/firestore';
import { doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatTime } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function VideoList() {
  const { weekId, currentWeek } = useWeek();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<VideoUpdate[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoUpdate | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (currentWeek?.videos) {
      // Filter videos for current user and sort by date
      const userVideos = currentWeek.videos
        .filter(v => v.userId === user?.uid)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setVideos(userVideos);
    }
    setLoading(false);
  }, [currentWeek, user]);

  async function updateVideoThumbnail(videoId: string, thumbnailUrl: string) {
    if (!currentWeek) return;
    
    try {
      // Update the video within the videos array in the week document
      await updateDoc(doc(db, 'weeks', currentWeek.id), {
        videos: currentWeek.videos.map(v => 
          v.id === videoId 
            ? { ...v, thumbnailUrl, updatedAt: new Date().toISOString() }
            : v
        )
      });
    } catch (error) {
      console.error('Error updating video thumbnail:', error);
    }
  }

  // Add a function to check permissions
  const checkMediaPermissions = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      return true;
    } catch (error) {
      console.error('Error checking media permissions:', error);
      return false;
    }
  };

  // Add this before handleRecordClick
  const newVideo: Partial<VideoUpdate> = {
    id: crypto.randomUUID(),
    userId: user?.uid,
    createdAt: new Date().toISOString(),
    status: 'processing',
    weekId: weekId
  };

  // Update the record button click handler
  const handleRecordClick = async () => {
    const hasPermissions = await checkMediaPermissions();
    if (!hasPermissions) {
      // Show error message to user
      return;
    }
    setSelectedVideo(newVideo as VideoUpdate);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-video bg-gray-200 rounded-lg mb-2" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No videos yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by recording your first video update
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <div 
            key={video.id} 
            className="group relative cursor-pointer"
            onClick={() => router.push(`/dashboard/videos/${video.id}`)}
          >
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              {video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={video.url}
                  className="w-full h-full object-cover"
                  onLoadedData={(e) => {
                    const video = e.currentTarget;
                    video.currentTime = 1; // Seek to 1 second
                    // Create thumbnail from video frame
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    canvas.getContext('2d')?.drawImage(video, 0, 0);
                    const thumbnailUrl = canvas.toDataURL('image/jpeg');
                    // Update video document with thumbnail
                    updateVideoThumbnail(video.id, thumbnailUrl);
                  }}
                />
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                <PlayIcon className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
                </div>
                {video.duration && (
                  <div className="text-sm text-gray-500">
                    {formatTime(video.duration)}
                  </div>
                )}
              </div>
              <p className="text-sm font-medium text-gray-900 truncate">
                Weekly Update - Week {weekId.split('-W')[1]}
              </p>
            </div>
          </div>
        ))}
      </div>

      {selectedVideo && (
        <VideoPlayer
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          videoUrl={selectedVideo.url}
          title={`Weekly Update - Week ${weekId.split('-W')[1]}`}
        />
      )}
    </>
  );
} 