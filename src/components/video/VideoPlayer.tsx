'use client';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

export function VideoPlayer({ src, poster, className = '' }: VideoPlayerProps) {
  return (
    <video
      className={`w-full rounded-lg ${className}`}
      controls
      poster={poster}
    >
      <source src={src} type="video/webm" />
      Your browser does not support the video tag.
    </video>
  );
} 