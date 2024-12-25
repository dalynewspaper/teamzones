'use client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { useState, useRef, useEffect } from 'react'
import { 
  PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon,
  ArrowsPointingOutIcon, ArrowsPointingInIcon,
  ForwardIcon, BackwardIcon
} from '@heroicons/react/24/solid'
import { formatTime } from '@/lib/utils'

interface Chapter {
  time: number
  title: string
}

interface VideoPlayerProps {
  isOpen: boolean
  onClose: () => void
  videoUrl: string
  title: string
  subtitles?: string // WebVTT URL
  chapters?: Chapter[]
}

export function VideoPlayer({ isOpen, onClose, videoUrl, title, subtitles, chapters }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()
  const [showSubtitles, setShowSubtitles] = useState(true)
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!videoRef.current) return
      
      switch(e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlay()
          break
        case 'm':
          toggleMute()
          break
        case 'f':
          toggleFullscreen()
          break
        case 'arrowleft':
          videoRef.current.currentTime -= 10
          break
        case 'arrowright':
          videoRef.current.currentTime += 10
          break
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          videoRef.current.currentTime = (duration * parseInt(e.key)) / 10
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [duration])

  // Auto-hide controls
  useEffect(() => {
    const hideControls = () => {
      if (isPlaying) {
        setShowControls(false)
      }
    }

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }

    controlsTimeoutRef.current = setTimeout(hideControls, 2000)

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isPlaying, showControls])

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => setDuration(video.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    
    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('loadedmetadata', updateDuration)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    
    return () => {
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('loadedmetadata', updateDuration)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [])

  // Handle chapters
  useEffect(() => {
    if (!chapters?.length) return
    
    const updateChapter = () => {
      const currentTime = videoRef.current?.currentTime || 0
      const activeChapter = chapters
        .slice()
        .reverse()
        .find(chapter => currentTime >= chapter.time)
      
      if (activeChapter && activeChapter !== currentChapter) {
        setCurrentChapter(activeChapter)
      }
    }

    videoRef.current?.addEventListener('timeupdate', updateChapter)
    return () => videoRef.current?.removeEventListener('timeupdate', updateChapter)
  }, [chapters, currentChapter])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const seek = (direction: 'forward' | 'backward') => {
    if (videoRef.current) {
      videoRef.current.currentTime += direction === 'forward' ? 10 : -10
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.parentElement?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true  // Enable audio recording
      });

      setMediaStream(stream);
      videoRef.current!.srcObject = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'  // Include opus audio codec
      });

      // ... rest of the recording logic
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl p-0 bg-black">
        <DialogTitle asChild>
          <VisuallyHidden>{title}</VisuallyHidden>
        </DialogTitle>
        
        <div 
          className="relative group"
          onMouseMove={() => {
            setShowControls(true)
            if (controlsTimeoutRef.current) {
              clearTimeout(controlsTimeoutRef.current)
            }
          }}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full aspect-video"
            onClick={togglePlay}
            autoPlay
            onLoadedData={() => {
              if (videoRef.current) {
                videoRef.current.playbackRate = playbackSpeed;
              }
            }}
          >
            {subtitles && (
              <track
                kind="subtitles"
                src={subtitles}
                label="English"
                default={showSubtitles}
              />
            )}
          </video>
          
          {/* Video Controls Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            {/* Top controls */}
            <div className="absolute top-0 left-0 right-0 p-4">
              <h2 className="text-white text-lg font-medium">{title}</h2>
            </div>

            {/* Center controls */}
            <div className="absolute inset-0 flex items-center justify-center space-x-8">
              <button onClick={() => seek('backward')} className="text-white/80 hover:text-white">
                <BackwardIcon className="w-12 h-12" />
              </button>
              <button onClick={togglePlay} className="text-white/80 hover:text-white">
                {isPlaying ? (
                  <PauseIcon className="w-16 h-16" />
                ) : (
                  <PlayIcon className="w-16 h-16" />
                )}
              </button>
              <button onClick={() => seek('forward')} className="text-white/80 hover:text-white">
                <ForwardIcon className="w-12 h-12" />
              </button>
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
              {/* Progress bar */}
              <div className="relative w-full">
                <input
                  type="range"
                  min={0}
                  max={duration}
                  value={currentTime}
                  onChange={handleTimeChange}
                  className="w-full"
                />
                
                {chapters && (
                  <div className="absolute top-0 left-0 right-0 h-1 pointer-events-none">
                    {chapters.map((chapter) => (
                      <div
                        key={chapter.time}
                        className="absolute w-1 h-full bg-white/50"
                        style={{
                          left: `${(chapter.time / duration) * 100}%`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Play/Pause */}
                  <button onClick={togglePlay} className="text-white hover:text-blue-400">
                    {isPlaying ? (
                      <PauseIcon className="w-6 h-6" />
                    ) : (
                      <PlayIcon className="w-6 h-6" />
                    )}
                  </button>

                  {/* Volume */}
                  <div className="flex items-center space-x-2">
                    <button onClick={toggleMute} className="text-white hover:text-blue-400">
                      {isMuted ? (
                        <SpeakerXMarkIcon className="w-6 h-6" />
                      ) : (
                        <SpeakerWaveIcon className="w-6 h-6" />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        const newVolume = parseFloat(e.target.value)
                        if (videoRef.current) {
                          videoRef.current.volume = newVolume
                          setVolume(newVolume)
                          setIsMuted(newVolume === 0)
                        }
                      }}
                      className="w-20"
                    />
                  </div>

                  {/* Time */}
                  <div className="text-white text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Playback Speed */}
                  <select
                    value={playbackSpeed}
                    onChange={(e) => {
                      const speed = parseFloat(e.target.value)
                      if (videoRef.current) {
                        videoRef.current.playbackRate = speed
                        setPlaybackSpeed(speed)
                      }
                    }}
                    className="bg-transparent text-white text-sm border border-white/20 rounded px-2 py-1"
                  >
                    <option value={0.5} className="text-black">0.5x</option>
                    <option value={1} className="text-black">1x</option>
                    <option value={1.5} className="text-black">1.5x</option>
                    <option value={2} className="text-black">2x</option>
                  </select>

                  {/* Fullscreen */}
                  <button onClick={toggleFullscreen} className="text-white hover:text-blue-400">
                    {isFullscreen ? (
                      <ArrowsPointingInIcon className="w-6 h-6" />
                    ) : (
                      <ArrowsPointingOutIcon className="w-6 h-6" />
                    )}
                  </button>

                  {subtitles && (
                    <button
                      onClick={() => setShowSubtitles(!showSubtitles)}
                      className="text-white hover:text-blue-400"
                    >
                      CC
                    </button>
                  )}

                  {chapters && chapters.length > 0 && (
                    <div className="relative group">
                      <button className="text-white hover:text-blue-400">
                        Chapters {currentChapter && `(${currentChapter.title})`}
                      </button>
                      
                      {/* Chapters dropdown */}
                      <div className="absolute bottom-full mb-2 left-0 bg-black/90 rounded-lg p-2 w-48 hidden group-hover:block">
                        {chapters.map((chapter) => (
                          <button
                            key={chapter.time}
                            onClick={() => {
                              if (videoRef.current) {
                                videoRef.current.currentTime = chapter.time;
                              }
                            }}
                            className={`w-full text-left px-3 py-1 rounded hover:bg-white/10 ${
                              currentChapter === chapter ? 'text-blue-400' : 'text-white'
                            }`}
                          >
                            {chapter.title} ({formatTime(chapter.time)})
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 