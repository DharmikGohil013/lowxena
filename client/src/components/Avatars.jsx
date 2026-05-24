import React, { useEffect, useMemo, useState } from 'react';

// Lightweight metadata — safe to eagerly import everywhere.
export const AVATAR_LIST = [
  { id: 'avatar-adventurer-Felix', name: 'Felix', color: '#e94560', price: 0 },
  { id: 'avatar-adventurer-Aneka', name: 'Aneka', color: '#533483', price: 0 },
  { id: 'avatar-adventurer-Jack', name: 'Jack', color: '#10b981', price: 0 },
  { id: 'avatar-adventurer-Aria', name: 'Aria', color: '#3b82f6', price: 500 },
  { id: 'avatar-adventurer-Max', name: 'Max', color: '#22c55e', price: 500 },
  { id: 'avatar-adventurer-Luna', name: 'Luna', color: '#fbbf24', price: 1000 },
  { id: 'avatar-adventurer-Kiki', name: 'Kiki', color: '#7c3aed', price: 1000 },
  { id: 'avatar-adventurer-Leo', name: 'Leo', color: '#10b981', price: 1500 },
  { id: 'avatar-adventurer-Buster', name: 'Buster', color: '#ef4444', price: 1500 },
  { id: 'avatar-adventurer-Finn', name: 'Finn', color: '#a78bfa', price: 1500 },
];

export function isAvatarSVG(avatarUrl) {
  return !!avatarUrl && (avatarUrl.startsWith('avatar-') || avatarUrl.startsWith('avatar-adventurer-'));
}

// Module-level cache for the dicebear loader so we only pay the dynamic-import cost once.
let dicebearPromise = null;
function loadDicebear() {
  if (!dicebearPromise) {
    // Import only the adventurer style — `@dicebear/collection` re-exports ~30
    // styles, which Rollup bundles whole-cloth if referenced.
    dicebearPromise = Promise.all([
      import('@dicebear/core'),
      import('@dicebear/adventurer'),
    ]).then(([core, adventurerMod]) => ({
      createAvatar: core.createAvatar,
      adventurer: adventurerMod.default || adventurerMod,
    }));
  }
  return dicebearPromise;
}

function fallbackDataUri(size) {
  const fallbackSvg = `<svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="58" fill="#374151" stroke="#6b7280" stroke-width="4"/>
      <circle cx="60" cy="45" r="20" fill="#9ca3af"/>
      <path d="M30 95 C30 75 42 65 60 65 C78 65 90 75 90 95" fill="#9ca3af"/>
    </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(fallbackSvg)))}`;
}

export function AvatarSVG({ avatarId, size = 80 }) {
  const seed = useMemo(() => {
    if (!avatarId) return 'Felix';
    if (avatarId.startsWith('avatar-adventurer-')) return avatarId.replace('avatar-adventurer-', '');
    if (avatarId.startsWith('avatar-')) return avatarId.replace('avatar-', '');
    return avatarId;
  }, [avatarId]);

  const [dataUri, setDataUri] = useState(() => fallbackDataUri(size));

  useEffect(() => {
    let cancelled = false;
    loadDicebear()
      .then(({ createAvatar, adventurer }) => {
        if (cancelled) return;
        try {
          const svgStr = createAvatar(adventurer, { seed, size }).toString();
          const base64 = btoa(unescape(encodeURIComponent(svgStr)));
          setDataUri(`data:image/svg+xml;base64,${base64}`);
        } catch (e) {
          console.error('Failed to generate Dicebear avatar:', e);
        }
      })
      .catch((err) => {
        console.error('Failed to load Dicebear:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [seed, size]);

  return (
    <img
      src={dataUri}
      alt={`Avatar - ${seed}`}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'block',
        objectFit: 'contain',
      }}
    />
  );
}

const avatarSVGs = {};
AVATAR_LIST.forEach((av) => {
  avatarSVGs[av.id] = (size = 80) => <AvatarSVG avatarId={av.id} size={size} />;
});
export default avatarSVGs;
