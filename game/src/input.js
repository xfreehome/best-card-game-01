// Keyboard and pointer input. One-shot presses (start, end turn, pause) are queued as
// bit flags and taken once by the loop, so a press between two frames is never lost and
// never counted twice. Pointer clicks are queued with their client position; the loop
// converts them to logical coordinates. Keys 1-5 play the matching hand card.
import { HAND_SIZE } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_END_TURN = 4;

const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const END_TURN = new Set(['KeyE']);

export function createInput(target) {
  let actions = 0;
  let cardKey = -1;
  let pointer = null;
  const clicks = [];

  window.addEventListener('keydown', (event) => {
    if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (END_TURN.has(event.code)) {
      if (!event.repeat) actions |= ACTION_END_TURN;
    } else if (event.code.startsWith('Digit')) {
      const n = Number(event.code.slice(5));
      if (!event.repeat && n >= 1 && n <= HAND_SIZE) cardKey = n - 1;
    } else {
      return;
    }
    event.preventDefault();
  });
  target.addEventListener('pointerdown', (event) => {
    clicks.push({ x: event.clientX, y: event.clientY });
  });
  target.addEventListener('pointermove', (event) => {
    pointer = { x: event.clientX, y: event.clientY };
  });

  return {
    /** The last pointer position over the game, in client coordinates, or null. */
    pointerPos() {
      return pointer;
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The hand-card index pressed with keys 1-5 since the last call, or -1. */
    takeCardKey() {
      const taken = cardKey;
      cardKey = -1;
      return taken;
    },
    /** The pointer clicks since the last call, in client coordinates. */
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
  };
}
