// Component to render profile avatars
const AVATAR_SVGS: Record<string, JSX.Element> = {
  scholar: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="grad-scholar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#grad-scholar)" />
      <circle cx="50" cy="40" r="18" fill="#fcd34d" />
      <rect x="25" y="60" width="50" height="30" rx="5" fill="#1e1b4b" />
      <rect x="35" y="65" width="30" height="3" rx="1" fill="#a5b4fc" />
      <rect x="35" y="72" width="25" height="3" rx="1" fill="#a5b4fc" />
      <rect x="35" y="79" width="20" height="3" rx="1" fill="#a5b4fc" />
      <circle cx="42" cy="38" r="3" fill="#1e1b4b" />
      <circle cx="58" cy="38" r="3" fill="#1e1b4b" />
      <path d="M 44 48 Q 50 54 56 48" stroke="#1e1b4b" strokeWidth="2" fill="none" />
    </svg>
  ),
  ninja: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="grad-ninja" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#grad-ninja)" />
      <circle cx="50" cy="45" r="20" fill="#1f2937" />
      <rect x="30" y="35" width="40" height="8" rx="2" fill="#dc2626" />
      <circle cx="42" cy="43" r="4" fill="white" />
      <circle cx="58" cy="43" r="4" fill="white" />
      <circle cx="42" cy="43" r="2" fill="#1f2937" />
      <circle cx="58" cy="43" r="2" fill="#1f2937" />
      <path d="M 30 60 Q 50 80 70 60" fill="#1f2937" />
      <rect x="45" y="70" width="10" height="15" rx="2" fill="#374151" />
    </svg>
  ),
  wizard: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="grad-wizard" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#grad-wizard)" />
      <polygon points="50,5 30,40 70,40" fill="#1e1b4b" />
      <circle cx="50" cy="20" r="4" fill="#fcd34d" />
      <circle cx="50" cy="50" r="18" fill="#fcd34d" />
      <circle cx="43" cy="47" r="3" fill="#1e1b4b" />
      <circle cx="57" cy="47" r="3" fill="#1e1b4b" />
      <path d="M 45 56 Q 50 60 55 56" stroke="#1e1b4b" strokeWidth="2" fill="none" />
      <rect x="35" y="70" width="30" height="20" rx="3" fill="#4c1d95" />
      <circle cx="50" cy="75" r="3" fill="#fcd34d" />
    </svg>
  ),
  robot: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="grad-robot" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#grad-robot)" />
      <rect x="25" y="30" width="50" height="40" rx="8" fill="#1e3a5f" />
      <rect x="30" y="20" width="40" height="15" rx="4" fill="#0ea5e9" />
      <circle cx="40" cy="45" r="6" fill="#22d3ee" />
      <circle cx="60" cy="45" r="6" fill="#22d3ee" />
      <circle cx="40" cy="45" r="3" fill="#0c4a6e" />
      <circle cx="60" cy="45" r="3" fill="#0c4a6e" />
      <rect x="35" y="58" width="30" height="6" rx="2" fill="#22d3ee" />
      <rect x="40" y="75" width="20" height="15" rx="3" fill="#1e3a5f" />
      <circle cx="35" cy="85" r="5" fill="#0ea5e9" />
      <circle cx="65" cy="85" r="5" fill="#0ea5e9" />
    </svg>
  ),
  cat: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="grad-cat" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#grad-cat)" />
      <polygon points="25,35 35,10 45,35" fill="#f97316" />
      <polygon points="55,35 65,10 75,35" fill="#f97316" />
      <polygon points="28,32 35,15 42,32" fill="#fcd34d" />
      <polygon points="58,32 65,15 72,32" fill="#fcd34d" />
      <ellipse cx="50" cy="55" rx="25" ry="22" fill="#f97316" />
      <ellipse cx="40" cy="50" rx="6" ry="8" fill="#fef3c7" />
      <ellipse cx="60" cy="50" rx="6" ry="8" fill="#fef3c7" />
      <ellipse cx="40" cy="52" rx="3" ry="5" fill="#1f2937" />
      <ellipse cx="60" cy="52" rx="3" ry="5" fill="#1f2937" />
      <ellipse cx="50" cy="62" rx="4" ry="3" fill="#fca5a5" />
      <path d="M 46 68 Q 50 72 54 68" stroke="#1f2937" strokeWidth="2" fill="none" />
      <line x1="25" y1="55" x2="38" y2="58" stroke="#1f2937" strokeWidth="1.5" />
      <line x1="25" y1="62" x2="38" y2="62" stroke="#1f2937" strokeWidth="1.5" />
      <line x1="62" y1="58" x2="75" y2="55" stroke="#1f2937" strokeWidth="1.5" />
      <line x1="62" y1="62" x2="75" y2="62" stroke="#1f2937" strokeWidth="1.5" />
    </svg>
  ),
  astronaut: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="grad-astro" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#grad-astro)" />
      <circle cx="50" cy="45" r="25" fill="#e2e8f0" />
      <ellipse cx="50" cy="45" rx="18" ry="16" fill="#0f172a" />
      <ellipse cx="50" cy="42" rx="12" ry="8" fill="#38bdf8" opacity="0.3" />
      <rect x="30" y="70" width="40" height="20" rx="5" fill="#e2e8f0" />
      <rect x="35" y="75" width="10" height="10" rx="2" fill="#0ea5e9" />
      <rect x="55" y="75" width="10" height="10" rx="2" fill="#0ea5e9" />
      <circle cx="50" cy="15" r="5" fill="#fbbf24" />
      <rect x="48" y="15" width="4" height="8" fill="#e2e8f0" />
    </svg>
  ),
  fox: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="grad-fox" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#grad-fox)" />
      <polygon points="20,40 35,10 45,45" fill="#ea580c" />
      <polygon points="80,40 65,10 55,45" fill="#ea580c" />
      <polygon points="25,38 35,18 42,42" fill="#fef3c7" />
      <polygon points="75,38 65,18 58,42" fill="#fef3c7" />
      <ellipse cx="50" cy="55" rx="28" ry="25" fill="#ea580c" />
      <ellipse cx="50" cy="65" rx="15" ry="12" fill="#fef3c7" />
      <ellipse cx="40" cy="50" rx="5" ry="6" fill="white" />
      <ellipse cx="60" cy="50" rx="5" ry="6" fill="white" />
      <ellipse cx="40" cy="51" rx="2.5" ry="4" fill="#1f2937" />
      <ellipse cx="60" cy="51" rx="2.5" ry="4" fill="#1f2937" />
      <ellipse cx="50" cy="60" rx="4" ry="3" fill="#1f2937" />
      <path d="M 46 66 Q 50 70 54 66" stroke="#1f2937" strokeWidth="2" fill="none" />
    </svg>
  ),
  panda: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <linearGradient id="grad-panda" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#grad-panda)" />
      <circle cx="30" cy="30" r="15" fill="#1f2937" />
      <circle cx="70" cy="30" r="15" fill="#1f2937" />
      <circle cx="50" cy="55" r="30" fill="white" />
      <ellipse cx="38" cy="48" rx="10" ry="12" fill="#1f2937" />
      <ellipse cx="62" cy="48" rx="10" ry="12" fill="#1f2937" />
      <ellipse cx="38" cy="48" rx="5" ry="6" fill="white" />
      <ellipse cx="62" cy="48" rx="5" ry="6" fill="white" />
      <circle cx="38" cy="49" r="3" fill="#1f2937" />
      <circle cx="62" cy="49" r="3" fill="#1f2937" />
      <ellipse cx="50" cy="62" rx="6" ry="4" fill="#1f2937" />
      <path d="M 44 70 Q 50 76 56 70" stroke="#1f2937" strokeWidth="2" fill="none" />
    </svg>
  ),
};

interface AvatarSvgProps {
  avatarId: string | undefined;
  className?: string;
}

export function AvatarSvg({ avatarId, className = '' }: AvatarSvgProps) {
  const svg = AVATAR_SVGS[avatarId || 'scholar'] || AVATAR_SVGS.scholar;
  return <div className={className}>{svg}</div>;
}
