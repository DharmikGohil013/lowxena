// 5 SVG Avatar options for user selection
const avatarSVGs = {
  'avatar-warrior': (size = 80) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="58" fill="#1a1a2e" stroke="#e94560" strokeWidth="4"/>
      <circle cx="60" cy="45" r="22" fill="#e94560"/>
      <path d="M60 23 C60 23 48 28 48 45 C48 52 53 58 60 58 C67 58 72 52 72 45 C72 28 60 23 60 23Z" fill="#16213e"/>
      <rect x="54" y="18" width="12" height="8" rx="2" fill="#e94560"/>
      <path d="M44 70 C44 70 30 75 28 95 L92 95 C90 75 76 70 76 70" fill="#e94560"/>
      <path d="M44 70 L60 62 L76 70 L60 80 Z" fill="#16213e"/>
      <circle cx="52" cy="42" r="3" fill="white"/>
      <circle cx="68" cy="42" r="3" fill="white"/>
      <circle cx="52" cy="42" r="1.5" fill="#1a1a2e"/>
      <circle cx="68" cy="42" r="1.5" fill="#1a1a2e"/>
      <path d="M55 52 Q60 56 65 52" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M38 30 L32 18 L44 26 Z" fill="#ffd700"/>
      <path d="M82 30 L88 18 L76 26 Z" fill="#ffd700"/>
    </svg>
  ),

  'avatar-mage': (size = 80) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="58" fill="#0f3460" stroke="#533483" strokeWidth="4"/>
      <circle cx="60" cy="48" r="22" fill="#e0c3fc"/>
      <path d="M60 12 L50 38 L60 34 L70 38 Z" fill="#533483"/>
      <path d="M48 32 L38 20 L44 34 Z" fill="#533483" opacity="0.7"/>
      <path d="M72 32 L82 20 L76 34 Z" fill="#533483" opacity="0.7"/>
      <circle cx="60" cy="18" r="4" fill="#ffd700"/>
      <circle cx="52" cy="44" r="4" fill="white"/>
      <circle cx="68" cy="44" r="4" fill="white"/>
      <circle cx="52" cy="44" r="2" fill="#533483"/>
      <circle cx="68" cy="44" r="2" fill="#533483"/>
      <path d="M56 55 Q60 58 64 55" stroke="#533483" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M36 72 C36 72 28 80 28 98 L92 98 C92 80 84 72 84 72" fill="#533483"/>
      <path d="M48 72 L60 65 L72 72 L60 82 Z" fill="#0f3460"/>
      <circle cx="60" cy="85" r="5" fill="#ffd700" opacity="0.8"/>
      <path d="M42 88 L38 98" stroke="#ffd700" strokeWidth="1.5" opacity="0.5"/>
      <path d="M78 88 L82 98" stroke="#ffd700" strokeWidth="1.5" opacity="0.5"/>
      <path d="M55 88 L53 98" stroke="#ffd700" strokeWidth="1.5" opacity="0.5"/>
      <path d="M65 88 L67 98" stroke="#ffd700" strokeWidth="1.5" opacity="0.5"/>
    </svg>
  ),

  'avatar-rogue': (size = 80) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="58" fill="#1a1a2e" stroke="#10b981" strokeWidth="4"/>
      <circle cx="60" cy="48" r="22" fill="#d4a574"/>
      <path d="M38 40 L82 40 L80 36 C80 36 72 28 60 28 C48 28 40 36 40 36 L38 40Z" fill="#2d2d44"/>
      <rect x="36" y="38" width="48" height="6" rx="2" fill="#10b981"/>
      <circle cx="52" cy="46" r="3.5" fill="white"/>
      <circle cx="68" cy="46" r="3.5" fill="white"/>
      <circle cx="53" cy="46" r="2" fill="#1a1a2e"/>
      <circle cx="69" cy="46" r="2" fill="#1a1a2e"/>
      <rect x="42" y="54" width="36" height="6" rx="3" fill="#2d2d44"/>
      <path d="M36 72 C36 72 26 80 26 98 L94 98 C94 80 84 72 84 72" fill="#2d2d44"/>
      <path d="M48 72 L60 65 L72 72" stroke="#10b981" strokeWidth="2" fill="none"/>
      <path d="M40 85 L36 98" stroke="#10b981" strokeWidth="1.5"/>
      <path d="M80 85 L84 98" stroke="#10b981" strokeWidth="1.5"/>
      <path d="M60 75 L60 95" stroke="#10b981" strokeWidth="1.5" opacity="0.5"/>
      <path d="M92 50 L102 42 L100 52 L105 48 L100 56 Z" fill="#c0c0c0" opacity="0.7"/>
    </svg>
  ),

  'avatar-knight': (size = 80) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="58" fill="#1f2937" stroke="#3b82f6" strokeWidth="4"/>
      <path d="M36 50 C36 32 46 20 60 20 C74 20 84 32 84 50 L84 56 L36 56 Z" fill="#6b7280"/>
      <rect x="40" y="56" width="40" height="4" fill="#3b82f6"/>
      <rect x="56" y="20" width="8" height="4" rx="2" fill="#3b82f6"/>
      <path d="M60 14 L56 24 L64 24 Z" fill="#ef4444"/>
      <rect x="44" y="42" width="14" height="10" rx="2" fill="#1f2937"/>
      <rect x="62" y="42" width="14" height="10" rx="2" fill="#1f2937"/>
      <circle cx="51" cy="47" r="3" fill="#60a5fa"/>
      <circle cx="69" cy="47" r="3" fill="#60a5fa"/>
      <path d="M36 65 C36 65 24 72 22 98 L98 98 C96 72 84 65 84 65" fill="#6b7280"/>
      <path d="M45 65 L60 58 L75 65 L60 76 Z" fill="#3b82f6"/>
      <circle cx="60" cy="68" r="4" fill="#ffd700"/>
      <path d="M40 80 L36 98" stroke="#3b82f6" strokeWidth="2"/>
      <path d="M80 80 L84 98" stroke="#3b82f6" strokeWidth="2"/>
      <path d="M52 80 L48 98" stroke="#3b82f6" strokeWidth="1.5" opacity="0.6"/>
      <path d="M68 80 L72 98" stroke="#3b82f6" strokeWidth="1.5" opacity="0.6"/>
    </svg>
  ),

  'avatar-ranger': (size = 80) => (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="58" fill="#1a2e1a" stroke="#22c55e" strokeWidth="4"/>
      <circle cx="60" cy="48" r="22" fill="#d4a574"/>
      <path d="M38 38 C38 38 42 22 60 22 C78 22 82 38 82 38 L78 42 L42 42 Z" fill="#15803d"/>
      <path d="M42 42 L38 38 L82 38 L78 42 Z" fill="#166534"/>
      <circle cx="48" cy="22" r="3" fill="#22c55e" opacity="0.6"/>
      <circle cx="72" cy="24" r="2" fill="#22c55e" opacity="0.6"/>
      <circle cx="60" cy="20" r="2.5" fill="#22c55e" opacity="0.6"/>
      <circle cx="52" cy="46" r="3.5" fill="white"/>
      <circle cx="68" cy="46" r="3.5" fill="white"/>
      <circle cx="52" cy="46" r="2" fill="#15803d"/>
      <circle cx="68" cy="46" r="2" fill="#15803d"/>
      <path d="M56 55 Q60 58 64 55" stroke="#8B4513" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <path d="M36 72 C36 72 26 80 26 98 L94 98 C94 80 84 72 84 72" fill="#15803d"/>
      <path d="M48 72 L60 65 L72 72 L60 82 Z" fill="#166534"/>
      <path d="M20 55 L38 48 L38 52 L20 58 Z" fill="#8B4513"/>
      <path d="M100 55 L82 48 L82 52 L100 58 Z" fill="#8B4513"/>
      <path d="M16 50 L20 55 L20 58 L16 53 Z" fill="#c0c0c0"/>
      <circle cx="60" cy="80" r="3" fill="#22c55e" opacity="0.6"/>
    </svg>
  ),
};

export const AVATAR_LIST = [
  { id: 'avatar-warrior', name: 'Warrior', color: '#e94560' },
  { id: 'avatar-mage', name: 'Mage', color: '#533483' },
  { id: 'avatar-rogue', name: 'Rogue', color: '#10b981' },
  { id: 'avatar-knight', name: 'Knight', color: '#3b82f6' },
  { id: 'avatar-ranger', name: 'Ranger', color: '#22c55e' },
];

export function AvatarSVG({ avatarId, size = 80 }) {
  const renderer = avatarSVGs[avatarId];
  if (renderer) return renderer(size);
  
  // Default fallback
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="58" fill="#374151" stroke="#6b7280" strokeWidth="4"/>
      <circle cx="60" cy="45" r="20" fill="#9ca3af"/>
      <path d="M30 95 C30 75 42 65 60 65 C78 65 90 75 90 95" fill="#9ca3af"/>
    </svg>
  );
}

export function isAvatarSVG(avatarUrl) {
  return avatarUrl && avatarUrl.startsWith('avatar-');
}

export default avatarSVGs;
