interface StatusProps {
  isRecording: boolean
  isPaused: boolean
  error: string | null
}

export function VideoRecordingStatus({ isRecording, isPaused, error }: StatusProps) {
  return (
    <div className="sr-only" aria-live="polite">
      {error && <div role="alert">{error}</div>}
      {isRecording && !isPaused && <div>Recording in progress</div>}
      {isRecording && isPaused && <div>Recording paused</div>}
      {!isRecording && <div>Ready to record</div>}
    </div>
  )
} 