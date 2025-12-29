// Random room name generator with 1000+ unique combinations

const adjectives = [
  'Swift', 'Brave', 'Clever', 'Mighty', 'Silent', 'Golden', 'Silver', 'Royal', 'Wild', 'Noble',
  'Ancient', 'Mystic', 'Sacred', 'Hidden', 'Frozen', 'Blazing', 'Thunder', 'Shadow', 'Crystal', 'Diamond',
  'Epic', 'Legendary', 'Cosmic', 'Divine', 'Eternal', 'Infinite', 'Supreme', 'Ultimate', 'Prime', 'Elite',
  'Crimson', 'Azure', 'Emerald', 'Ruby', 'Sapphire', 'Onyx', 'Pearl', 'Jade', 'Amber', 'Violet',
  'Fierce', 'Valiant', 'Daring', 'Bold', 'Fearless', 'Proud', 'Glorious', 'Majestic', 'Radiant', 'Brilliant'
];

const nouns = [
  'Dragon', 'Phoenix', 'Tiger', 'Lion', 'Eagle', 'Wolf', 'Bear', 'Falcon', 'Hawk', 'Panther',
  'Knight', 'Warrior', 'Champion', 'Hero', 'Legend', 'Master', 'Guardian', 'Sentinel', 'Defender', 'Protector',
  'Storm', 'Thunder', 'Lightning', 'Tempest', 'Cyclone', 'Hurricane', 'Blizzard', 'Inferno', 'Volcano', 'Avalanche',
  'Crown', 'Throne', 'Castle', 'Kingdom', 'Empire', 'Dynasty', 'Realm', 'Domain', 'Palace', 'Fortress',
  'Star', 'Moon', 'Sun', 'Comet', 'Galaxy', 'Nebula', 'Cosmos', 'Universe', 'Meteor', 'Asteroid'
];

const suffixes = [
  'Arena', 'Hall', 'Chamber', 'Sanctuary', 'Haven', 'Citadel', 'Tower', 'Den', 'Lair', 'Nest',
  'Court', 'Plaza', 'Square', 'Circle', 'Zone', 'District', 'Quarter', 'Sector', 'Region', 'Territory',
  'League', 'Guild', 'Clan', 'Tribe', 'Order', 'Brotherhood', 'Alliance', 'Coalition', 'Union', 'Federation'
];

export const generateRoomName = () => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${adjective} ${noun} ${suffix}`;
};

export const generateUniqueRoomName = (existingNames = []) => {
  let roomName = generateRoomName();
  let attempts = 0;
  const maxAttempts = 100;
  
  while (existingNames.includes(roomName) && attempts < maxAttempts) {
    roomName = generateRoomName();
    attempts++;
  }
  
  // If still not unique after maxAttempts, add a number
  if (existingNames.includes(roomName)) {
    const randomNum = Math.floor(Math.random() * 10000);
    roomName = `${roomName} ${randomNum}`;
  }
  
  return roomName;
};

export const getTotalPossibleNames = () => {
  return adjectives.length * nouns.length * suffixes.length;
};

// Export total possible combinations (should be 50 * 50 * 30 = 75,000)
console.log(`Total possible room names: ${getTotalPossibleNames()}`);
