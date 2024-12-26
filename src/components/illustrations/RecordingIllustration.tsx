export function RecordingIllustration() {
  return (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center">
      <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full max-w-[500px]"
      >
        {/* Background circles */}
        <circle cx="200" cy="150" r="120" fill="#F3F4F6" />
        <circle cx="200" cy="150" r="90" fill="#E5E7EB" />
        
        {/* Recording interface */}
        <rect x="100" y="80" width="200" height="140" rx="10" fill="white" stroke="#6366F1" strokeWidth="2"/>
        
        {/* Video preview area */}
        <rect x="120" y="100" width="160" height="80" rx="4" fill="#EEF2FF"/>
        
        {/* Recording controls */}
        <circle cx="200" cy="200" r="12" fill="#EF4444"/> {/* Record button */}
        <rect x="170" y="195" width="20" height="10" rx="2" fill="#6366F1"/> {/* Pause */}
        <path d="M230 195 L240 200 L230 205" fill="#6366F1"/> {/* Next */}
        
        {/* Decorative elements */}
        <circle cx="140" cy="200" r="4" fill="#6366F1" opacity="0.5"/>
        <circle cx="260" cy="200" r="4" fill="#6366F1" opacity="0.5"/>
        
        {/* Animated wave form */}
        <path
          d="M120 160 Q 140 140, 160 160 T 200 160 T 240 160 T 280 160"
          stroke="#6366F1"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Timer */}
        <text x="180" y="130" fill="#4B5563" fontSize="12">00:00</text>
      </svg>
    </div>
  )
} 