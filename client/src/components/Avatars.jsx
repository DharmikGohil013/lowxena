import React, { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';

// 10 awesome predefined Adventurer presets
export const AVATAR_LIST = [
  { id: 'avatar-adventurer-Felix', name: 'Felix', color: '#e94560' },
  { id: 'avatar-adventurer-Aneka', name: 'Aneka', color: '#533483' },
  { id: 'avatar-adventurer-Jack', name: 'Jack', color: '#10b981' },
  { id: 'avatar-adventurer-Aria', name: 'Aria', color: '#3b82f6' },
  { id: 'avatar-adventurer-Max', name: 'Max', color: '#22c55e' },
  { id: 'avatar-adventurer-Luna', name: 'Luna', color: '#fbbf24' },
  { id: 'avatar-adventurer-Kiki', name: 'Kiki', color: '#7c3aed' },
  { id: 'avatar-adventurer-Leo', name: 'Leo', color: '#10b981' },
  { id: 'avatar-adventurer-Buster', name: 'Buster', color: '#ef4444' },
  { id: 'avatar-adventurer-Finn', name: 'Finn', color: '#a78bfa' },
];

export function AvatarSVG({ avatarId, size = 80 }) {
  // Extract the seed from the avatarId (e.g. "avatar-adventurer-Felix" -> "Felix")
  const seed = useMemo(() => {
    if (!avatarId) return 'Felix';
    if (avatarId.startsWith('avatar-adventurer-')) {
      return avatarId.replace('avatar-adventurer-', '');
    }
    if (avatarId.startsWith('avatar-')) {
      return avatarId.replace('avatar-', '');
    }
    return avatarId;
  }, [avatarId]);

  // Generate the Dicebear Adventurer avatar
  const dataUri = useMemo(() => {
    try {
      const avatar = createAvatar(adventurer, {
        seed: seed,
        size: size,
      });
      // Convert to a robust, fast data URI
      return `data:image/svg+xml;utf8,${encodeURIComponent(avatar.toString())}`;
    } catch (e) {
      console.error('Failed to generate Dicebear avatar:', e);
      // Fallback simple avatar
      return `data:image/svg+xml;utf8,${encodeURIComponent(
        `<svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="60" cy="60" r="58" fill="#374151" stroke="#6b7280" strokeWidth="4"/>
          <circle cx="60" cy="45" r="20" fill="#9ca3af"/>
          <path d="M30 95 C30 75 42 65 60 65 C78 65 90 75 90 95" fill="#9ca3af"/>
        </svg>`
      )}`;
    }
  }, [seed, size]);

  return (
    <img 
      src={dataUri} 
      alt={`Avatar - ${seed}`} 
      width={size} 
      height={size}
      style={{ 
        width: size, 
        height: size, 
        borderRadius: '50%',
        display: 'block',
        objectFit: 'contain'
      }}
    />
  );
}

export function isAvatarSVG(avatarUrl) {
  // Matches any avatar identifier starting with 'avatar-' or a dynamic adventurer seed
  return avatarUrl && (avatarUrl.startsWith('avatar-') || avatarUrl.startsWith('avatar-adventurer-'));
}

// Support legacy exports for safety
const avatarSVGs = {};
AVATAR_LIST.forEach(av => {
  avatarSVGs[av.id] = (size = 80) => <AvatarSVG avatarId={av.id} size={size} />;
});
export default avatarSVGs;
