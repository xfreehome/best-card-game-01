// Duel Kartu: Arena — every tuning number, colour and card in one place.
// The table is a fixed 1280x720 logical area; the renderer scales it to the window,
// so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds (used for the rival's thinking pause). */
export const STEP = 1 / 60;

export const START_HP = 30;
export const HAND_SIZE = 5;
export const MAX_MANA = 10;

/** Four original elements. Api beats Daun, Daun beats Air, Air beats Petir, Petir beats Api. */
export const ELEMENTS = {
  api: { name: 'API', color: '#e5534b', dark: '#7e2a24', ink: '#ffd9d6' },
  air: { name: 'AIR', color: '#4fc3f7', dark: '#1d6f92', ink: '#d6f1ff' },
  daun: { name: 'DAUN', color: '#58b368', dark: '#2c6e3a', ink: '#dcf5e1' },
  petir: { name: 'PETIR', color: '#f2c94c', dark: '#8a6d1a', ink: '#fff3c4' },
};

export const ADVANTAGE = { api: 'daun', daun: 'air', air: 'petir', petir: 'api' };
export const ADVANTAGE_BONUS = 2;

export const KIND_LABEL = { dmg: 'SERANG', heal: 'PULIH', shield: 'PERISAI' };

/** Twelve original cards; a deck holds two copies of each (24 cards). */
export const CARDS = [
  { id: 'bara', name: 'Ember Bara', el: 'api', kind: 'dmg', cost: 1, val: 3 },
  { id: 'tombak', name: 'Tombak Api', el: 'api', kind: 'dmg', cost: 2, val: 5 },
  { id: 'magma', name: 'Letusan Magma', el: 'api', kind: 'dmg', cost: 4, val: 9 },
  { id: 'embun', name: 'Tetes Embun', el: 'air', kind: 'heal', cost: 1, val: 3 },
  { id: 'sembuh', name: 'Air Penyembuh', el: 'air', kind: 'heal', cost: 2, val: 6 },
  { id: 'gelombang', name: 'Gelombang Pasang', el: 'air', kind: 'dmg', cost: 3, val: 6 },
  { id: 'tunas', name: 'Tunas Harapan', el: 'daun', kind: 'heal', cost: 1, val: 3 },
  { id: 'akar', name: 'Pukulan Akar', el: 'daun', kind: 'dmg', cost: 2, val: 4 },
  { id: 'perisai', name: 'Perisai Daun', el: 'daun', kind: 'shield', cost: 2, val: 6 },
  { id: 'kilat', name: 'Kilatan Kilat', el: 'petir', kind: 'dmg', cost: 1, val: 2 },
  { id: 'sambar', name: 'Sambar Petir', el: 'petir', kind: 'dmg', cost: 3, val: 7 },
  { id: 'badai', name: 'Badai Listrik', el: 'petir', kind: 'dmg', cost: 4, val: 8 },
];

export const PALETTE = {
  backdrop: '#0d1b12',
  table: '#17603a',
  tableDark: '#0f4527',
  wood: '#6b4a2b',
  panel: '#1d2b22',
  panelEdge: '#3a5a44',
  text: '#f2f5ef',
  muted: '#a9bfae',
  gold: '#f2c94c',
  red: '#e5534b',
  green: '#58b368',
  blue: '#4fc3f7',
  cardBack: '#232c3d',
  cardFace: '#f7f3e8',
  cardInk: '#20242c',
  dim: '#8b93a3',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the win count is kept between visits (this browser only). */
export const BEST_KEY = 'duel-kartu-arena.wins';
