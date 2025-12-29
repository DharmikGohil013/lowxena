// Random room name generator
const adjectives = [
  'Swift', 'Mystic', 'Golden', 'Silent', 'Brave', 'Noble', 'Ancient', 'Crystal', 'Thunder', 'Shadow',
  'Blazing', 'Cosmic', 'Diamond', 'Electric', 'Frozen', 'Mighty', 'Phoenix', 'Royal', 'Silver', 'Titan',
  'Valor', 'Wild', 'Zen', 'Alpha', 'Beta', 'Crimson', 'Dark', 'Echo', 'Fierce', 'Glacial',
  'Heroic', 'Iron', 'Jade', 'Knight', 'Lunar', 'Neon', 'Omega', 'Prime', 'Quantum', 'Radiant',
  'Storm', 'Turbo', 'Ultra', 'Vortex', 'Warp', 'Xenon', 'Yonder', 'Zenith', 'Astral', 'Blaze'
];

const nouns = [
  'Dragon', 'Phoenix', 'Tiger', 'Wolf', 'Eagle', 'Hawk', 'Lion', 'Bear', 'Falcon', 'Panther',
  'Serpent', 'Raven', 'Warrior', 'Knight', 'Champion', 'Legend', 'Master', 'Guardian', 'Hunter', 'Ranger',
  'Wizard', 'Samurai', 'Ninja', 'Ronin', 'Shogun', 'Emperor', 'King', 'Queen', 'Prince', 'Lord',
  'Warrior', 'Gladiator', 'Crusader', 'Paladin', 'Templar', 'Sentinel', 'Warden', 'Defender', 'Protector', 'Avenger',
  'Slayer', 'Striker', 'Blade', 'Storm', 'Thunder', 'Lightning', 'Flame', 'Frost', 'Shadow', 'Light'
];

const suffixes = [
  'Arena', 'Realm', 'Zone', 'Haven', 'Fortress', 'Citadel', 'Castle', 'Tower', 'Palace', 'Temple',
  'Sanctum', 'Hall', 'Court', 'Chamber', 'Den', 'Lair', 'Nest', 'Peak', 'Summit', 'Ridge',
  'Valley', 'Grove', 'Glade', 'Field', 'Plains', 'Wastes', 'Badlands', 'Outpost', 'Station', 'Base'
];

export function generateRoomName() {
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${randomAdj} ${randomNoun} ${randomSuffix}`;
}

export function generateUniqueRoomName(existingNames) {
  let roomName;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    roomName = generateRoomName();
    attempts++;
  } while (existingNames.includes(roomName) && attempts < maxAttempts);
  
  // If we couldn't find a unique name after maxAttempts, append a number
  if (existingNames.includes(roomName)) {
    const baseRoomName = roomName;
    let counter = 1;
    while (existingNames.includes(`${baseRoomName} ${counter}`)) {
      counter++;
    }
    roomName = `${baseRoomName} ${counter}`;
  }
  
  return roomName;
}
