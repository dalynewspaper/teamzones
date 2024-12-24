'use client';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { VideoCameraIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface VideoRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  onCancel: () => void;
}

export function VideoRecorder({ onRecordingComplete, onCancel }: VideoRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError('');
    } catch (err) {
      setError('Failed to access camera');
      console.error(err);
    }
  };

  const startRecording = () => {
    if (!stream) return;

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      onRecordingComplete(blob);
    };

    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
    setRecording(false);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-red-700">
          <div className="flex">
            <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            <div className="ml-3">{error}</div>
          </div>
        </div>
      )}

      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        
        {recording && (
          <div className="absolute top-4 right-4 px-3 py-1 bg-red-600 text-white rounded-full">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Recording
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        
        <div className="space-x-2">
          {!stream && (
            <Button onClick={startCamera}>
              <VideoCameraIcon className="h-5 w-5 mr-2" />
              Start Camera
            </Button>
          )}
          
          {stream && !recording && (
            <Button onClick={startRecording}>
              Start Recording
            </Button>
          )}
          
          {recording && (
            <Button variant="outline" onClick={stopRecording}>
              Stop Recording
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 