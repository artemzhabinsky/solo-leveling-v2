export default function Stage2() {
  return (
    <svg data-testid="goblin-stage-2" viewBox="0 0 200 200" role="img" aria-label="Гоблин-Мусорщик / Картонный Рыцарь">
      <ellipse cx="100" cy="180" rx="42" ry="8" fill="currentColor" opacity="0.15" />
      <path d="M68 152 Q58 100 90 78 Q100 58 120 78 Q142 100 132 152 Z" fill="#4a7c3f" />
      <circle cx="95" cy="88" r="6" fill="#0a0a0a" />
      <circle cx="115" cy="88" r="6" fill="#0a0a0a" />
      {/* cardboard box chest armor with tape strips */}
      <rect x="72" y="108" width="56" height="40" fill="#b98a4e" stroke="#8a6534" strokeWidth="2" />
      <line x1="72" y1="128" x2="128" y2="128" stroke="#d9c48a" strokeWidth="5" />
      <line x1="100" y1="108" x2="100" y2="148" stroke="#d9c48a" strokeWidth="5" />
      {/* cardboard shoulder pauldrons */}
      <rect x="62" y="100" width="18" height="14" fill="#b98a4e" stroke="#8a6534" strokeWidth="2" />
      <rect x="120" y="100" width="18" height="14" fill="#b98a4e" stroke="#8a6534" strokeWidth="2" />
      <circle cx="100" cy="68" r="18" fill="#6b6b6b" />
      {/* sharpened fork weapon */}
      <line x1="140" y1="120" x2="165" y2="95" stroke="#9a9a9a" strokeWidth="3" />
      <line x1="163" y1="93" x2="170" y2="86" stroke="#9a9a9a" strokeWidth="2" />
      <line x1="165" y1="95" x2="172" y2="88" stroke="#9a9a9a" strokeWidth="2" />
      <line x1="167" y1="97" x2="174" y2="90" stroke="#9a9a9a" strokeWidth="2" />
      {/* grayish smoke wisps */}
      <path d="M40 60 Q48 50 40 42 Q32 34 40 26" stroke="#aaa" strokeWidth="3" fill="none" opacity="0.5" />
      <path d="M155 130 Q163 120 155 112 Q147 104 155 96" stroke="#aaa" strokeWidth="3" fill="none" opacity="0.5" />
    </svg>
  )
}
