/**
 * Card Image Utility
 * Maps card objects {value, suit} to SVG file paths in /cards/
 */

const VALUE_MAP = {
  'A': 'ace',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  'J': 'jack',
  'Q': 'queen',
  'K': 'king',
}

const SUIT_MAP = {
  'hearts': 'hearts',
  'diamonds': 'diamonds',
  'clubs': 'clubs',
  'spades': 'spades',
  'H': 'hearts',
  'D': 'diamonds',
  'C': 'clubs',
  'S': 'spades',
}

/**
 * Get the SVG image path for a card
 * @param {string} value - Card value (A, 2-10, J, Q, K)
 * @param {string} suit - Card suit (hearts, diamonds, clubs, spades, or H, D, C, S)
 * @returns {string} Path to the SVG file
 */
export function getCardImagePath(value, suit) {
  const v = VALUE_MAP[value] || value?.toLowerCase()
  const s = SUIT_MAP[suit] || suit?.toLowerCase()
  if (!v || !s) return '/cards/ace_of_spades.svg'
  return `/cards/${v}_of_${s}.svg`
}

/**
 * Get card image path from a card object
 * @param {Object} card - Card object with value and suit properties
 * @returns {string} Path to the SVG file
 */
export function getCardImage(card) {
  if (!card) return '/cards/ace_of_spades.svg'
  return getCardImagePath(card.value, card.suit)
}

/**
 * Get the card back image (logo)
 * @returns {string} Path to the card back image
 */
export function getCardBack() {
  return '/card_back.png'
}
