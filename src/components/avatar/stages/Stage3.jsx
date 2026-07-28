export default function Stage3() {
  return (
    <svg data-testid="goblin-stage-3" viewBox="0 0 200 200" role="img" aria-label="Охотник E-Ранга / Гоблин-Боец">
      <ellipse cx="100" cy="180" rx="46" ry="8" fill="currentColor" opacity="0.15" />
      {/* wider, muscular torso */}
      <path d="M62 155 Q52 95 88 76 Q100 56 112 76 Q148 95 138 155 Z" fill="#3f7a35" />
      {/* neon-blue eyes */}
      <circle cx="93" cy="86" r="6" fill="#22d3ee" />
      <circle cx="117" cy="86" r="6" fill="#22d3ee" />
      {/* leather vest */}
      <path d="M70 105 L100 118 L130 105 L134 148 L66 148 Z" fill="#5a3a20" stroke="#3a2410" strokeWidth="2" />
      <line x1="100" y1="118" x2="100" y2="148" stroke="#3a2410" strokeWidth="2" />
      {/* bicep/muscle definition lines */}
      <path d="M65 110 Q60 125 66 140" stroke="#2f5a28" strokeWidth="3" fill="none" />
      <path d="M135 110 Q140 125 134 140" stroke="#2f5a28" strokeWidth="3" fill="none" />
      <circle cx="100" cy="66" r="17" fill="#3f7a35" />
      <path d="M90 62 Q100 56 110 62" stroke="#2a4a20" strokeWidth="2" fill="none" />
      {/* bone dagger */}
      <line x1="138" y1="130" x2="165" y2="105" stroke="#e8e0c8" strokeWidth="5" />
      <circle cx="140" cy="128" r="4" fill="#c9bfa0" />
      <path d="M163 103 L170 96 L167 102 Z" fill="#e8e0c8" />
    </svg>
  )
}
