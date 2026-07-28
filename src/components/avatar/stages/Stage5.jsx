export default function Stage5() {
  return (
    <svg data-testid="goblin-stage-5" viewBox="0 0 200 200" role="img" aria-label="Охотник C-Ранга / Теневой Кадет">
      {/* dark-purple aura */}
      <ellipse cx="100" cy="180" rx="52" ry="10" fill="#6d28d9" opacity="0.4" />
      <path d="M58 155 Q48 90 88 72 Q100 52 112 72 Q152 90 142 155 Z" fill="#356b2c" />
      <circle cx="93" cy="82" r="6" fill="#c4b5fd" />
      <circle cx="117" cy="82" r="6" fill="#c4b5fd" />
      {/* horn plates on head */}
      <path d="M78 58 L70 40 L84 52 Z" fill="#e8e0c8" />
      <path d="M122 58 L130 40 L116 52 Z" fill="#e8e0c8" />
      <circle cx="100" cy="62" r="17" fill="#356b2c" />
      {/* purple cuirass */}
      <path d="M68 100 L100 92 L132 100 L136 150 Q100 160 64 150 Z" fill="#5b21b6" stroke="#3b0f7a" strokeWidth="2" />
      <path d="M100 92 L100 150" stroke="#3b0f7a" strokeWidth="2" />
      <path d="M80 108 L120 108" stroke="#7c3aed" strokeWidth="2" opacity="0.6" />
      {/* shadow blade */}
      <line x1="136" y1="130" x2="168" y2="98" stroke="#1a1a24" strokeWidth="6" />
      <line x1="136" y1="130" x2="168" y2="98" stroke="#8b5cf6" strokeWidth="2" opacity="0.7" />
      <rect x="132" y="128" width="10" height="10" fill="#2a1a4a" />
    </svg>
  )
}
