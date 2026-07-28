export default function Stage6() {
  return (
    <svg data-testid="goblin-stage-6" viewBox="0 0 200 200" role="img" aria-label="Охотник A-Ранга / Теневой Рыцарь">
      {/* two summoned shadow silhouettes behind */}
      <path d="M35 165 Q28 120 45 100 Q55 85 65 100 Q78 120 70 165 Z" fill="#1a1a24" opacity="0.6" />
      <path d="M135 165 Q128 120 145 100 Q155 85 165 100 Q178 120 170 165 Z" fill="#1a1a24" opacity="0.6" />
      <ellipse cx="100" cy="180" rx="46" ry="9" fill="#4c1d95" opacity="0.4" />
      <path d="M60 152 Q50 88 88 70 Q100 50 112 70 Q150 88 140 152 Z" fill="#356b2c" />
      <circle cx="93" cy="80" r="6" fill="#c4b5fd" />
      <circle cx="117" cy="80" r="6" fill="#c4b5fd" />
      {/* horns */}
      <path d="M80 56 L72 36 L86 50 Z" fill="#e8e0c8" />
      <path d="M120 56 L128 36 L114 50 Z" fill="#e8e0c8" />
      <circle cx="100" cy="60" r="16" fill="#356b2c" />
      {/* flowing shadow cloak */}
      <path d="M62 96 Q40 130 55 158 L72 148 Q64 120 70 96 Z" fill="#221833" />
      <path d="M138 96 Q160 130 145 158 L128 148 Q136 120 130 96 Z" fill="#221833" />
      {/* dual blades */}
      <line x1="62" y1="140" x2="35" y2="105" stroke="#1a1a24" strokeWidth="5" />
      <line x1="62" y1="140" x2="35" y2="105" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.7" />
      <line x1="138" y1="140" x2="165" y2="105" stroke="#1a1a24" strokeWidth="5" />
      <line x1="138" y1="140" x2="165" y2="105" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.7" />
    </svg>
  )
}
