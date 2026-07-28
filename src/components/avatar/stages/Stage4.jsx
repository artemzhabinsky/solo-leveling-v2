export default function Stage4() {
  return (
    <svg data-testid="goblin-stage-4" viewBox="0 0 200 200" role="img" aria-label="Охотник D-Ранга / Гоблин-Воин">
      {/* neon aura under feet */}
      <ellipse cx="100" cy="180" rx="50" ry="10" fill="#38bdf8" opacity="0.35" />
      <ellipse cx="100" cy="180" rx="30" ry="6" fill="#38bdf8" opacity="0.5" />
      <path d="M60 155 Q50 92 88 74 Q100 54 112 74 Q150 92 140 155 Z" fill="#3f7a35" />
      <circle cx="93" cy="84" r="6" fill="#0a0a0a" />
      <circle cx="117" cy="84" r="6" fill="#0a0a0a" />
      {/* perfect abs */}
      <line x1="88" y1="112" x2="112" y2="112" stroke="#2a4a20" strokeWidth="2" />
      <line x1="88" y1="122" x2="112" y2="122" stroke="#2a4a20" strokeWidth="2" />
      <line x1="88" y1="132" x2="112" y2="132" stroke="#2a4a20" strokeWidth="2" />
      <line x1="100" y1="108" x2="100" y2="140" stroke="#2a4a20" strokeWidth="2" />
      {/* short cape */}
      <path d="M65 100 Q60 130 70 150 L80 145 Q76 120 78 100 Z" fill="#7a1f2b" />
      <path d="M135 100 Q140 130 130 150 L120 145 Q124 120 122 100 Z" fill="#7a1f2b" />
      <circle cx="100" cy="64" r="17" fill="#3f7a35" />
      {/* steel sword */}
      <line x1="140" y1="145" x2="172" y2="70" stroke="#c9ced6" strokeWidth="5" />
      <line x1="150" y1="120" x2="164" y2="112" stroke="#8a8f96" strokeWidth="4" />
      <rect x="136" y="140" width="10" height="10" fill="#5a4a30" />
    </svg>
  )
}
