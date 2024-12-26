export function AsyncCommunicationIllustration() {
  return (
    <div className="w-full h-full min-h-[300px] flex items-center justify-center">
      <svg
        viewBox="0 0 400 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full max-w-[500px]"
      >
        {/* Background shape */}
        <path
          d="M50 150 C50 80 350 80 350 150 C350 220 50 220 50 150"
          fill="#F3F4F6"
          opacity="0.5"
        />
        
        {/* Time zones */}
        <g transform="translate(80, 100)">
          {/* SF */}
          <rect x="0" y="0" width="80" height="100" rx="8" fill="white" stroke="#6366F1" strokeWidth="2"/>
          <text x="30" y="30" fill="#4B5563" fontSize="12" fontWeight="500">SF</text>
          <text x="25" y="50" fill="#6366F1" fontSize="14" fontWeight="bold">9:00</text>
          <circle cx="40" cy="75" r="15" fill="#EEF2FF"/>
          <path d="M32 75 L48 75" stroke="#6366F1" strokeWidth="2"/>
        </g>
        
        {/* London */}
        <g transform="translate(160, 100)">
          <rect x="0" y="0" width="80" height="100" rx="8" fill="white" stroke="#8B5CF6" strokeWidth="2"/>
          <text x="20" y="30" fill="#4B5563" fontSize="12" fontWeight="500">London</text>
          <text x="25" y="50" fill="#8B5CF6" fontSize="14" fontWeight="bold">17:00</text>
          <circle cx="40" cy="75" r="15" fill="#F3E8FF"/>
          <path d="M32 75 L48 75 M40 67 L40 83" stroke="#8B5CF6" strokeWidth="2"/>
        </g>
        
        {/* Tokyo */}
        <g transform="translate(240, 100)">
          <rect x="0" y="0" width="80" height="100" rx="8" fill="white" stroke="#EC4899" strokeWidth="2"/>
          <text x="25" y="30" fill="#4B5563" fontSize="12" fontWeight="500">Tokyo</text>
          <text x="25" y="50" fill="#EC4899" fontSize="14" fontWeight="bold">1:00</text>
          <circle cx="40" cy="75" r="15" fill="#FCE7F3"/>
          <path d="M32 75 L48 75 M40 67 L40 83 M32 67 L48 83" stroke="#EC4899" strokeWidth="2"/>
        </g>
        
        {/* Connecting lines */}
        <path
          d="M120 150 C140 150 140 150 160 150"
          stroke="#6366F1"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <path
          d="M240 150 C260 150 260 150 280 150"
          stroke="#8B5CF6"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      </svg>
    </div>
  )
} 