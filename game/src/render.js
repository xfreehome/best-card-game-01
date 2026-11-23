// Drawing only: the world's state and the current screen in, pixels out. The 1280x720
// table is scaled to fit the window and centred, the margin filled with the backdrop
// colour. Flat rectangles, canvas text for the HUD, the cards and the panels. The
// layout is computed once, in logical coordinates, and shared with hit-testing.
import { ELEMENTS, FIELD, FONT, KIND_LABEL, PALETTE } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';

const CARD = { w: 150, h: 190, gap: 16, y: 505 };
const BACK = { w: 120, h: 170, gap: 14, y: 78 };
const HP_BAR = { x: 140, w: 360, h: 30 };
const END_TURN = { x: 1070, y: 600, w: 186, h: 56 };
const START_BUTTON = { x: 520, y: 435, w: 300, h: 64 };

const KIND_COLOR = { dmg: '#b3261e', heal: '#2c6e3a', shield: '#1d6f92' };

function cardX(index, count, w, gap) {
  const total = count * w + (count - 1) * gap;
  return (FIELD.width - total) / 2 + index * (w + gap);
}

/** Logical-coordinate rects the loop hit-tests against (player cards, end-turn, start). */
export function layout(state) {
  const cards = [];
  for (let i = 0; i < state.player.hand.length; i += 1) {
    cards.push({ x: cardX(i, state.player.hand.length, CARD.w, CARD.gap), y: CARD.y, w: CARD.w, h: CARD.h });
  }
  return { cards, endTurn: { ...END_TURN }, start: { ...START_BUTTON } };
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  /** Client (CSS-pixel) pointer position to logical 1280x720 coordinates. */
  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const deviceX = (clientX - rect.left) * (canvas.width / rect.width);
    const deviceY = (clientY - rect.top) * (canvas.height / rect.height);
    return { x: (deviceX - view.x) / view.scale, y: (deviceY - view.y) / view.scale };
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align, bold) {
    const key = `${size}|${bold ? 1 : 0}`;
    if (!fonts.has(key)) fonts.set(key, `${bold ? 'bold ' : ''}${size}px ${FONT}`);
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }

  function roundRect(x, y, w, h, r) {
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);
    context.closePath();
  }

  function drawHpBar(x, y, side, label) {
    text(label, x - 12, y + 23, 24, PALETTE.text, 'right', true);
    context.fillStyle = '#0a0f0c';
    context.fillRect(x, y, HP_BAR.w, HP_BAR.h);
    const frac = Math.max(0, side.hp / side.maxHp);
    context.fillStyle = label === 'RIVAL' ? PALETTE.red : PALETTE.green;
    context.fillRect(x + 2, y + 2, (HP_BAR.w - 4) * frac, HP_BAR.h - 4);
    context.strokeStyle = PALETTE.panelEdge;
    context.lineWidth = 2;
    context.strokeRect(x, y, HP_BAR.w, HP_BAR.h);
    text(`${side.hp}/${side.maxHp}`, x + HP_BAR.w / 2, y + 24, 22, '#ffffff', 'center', true);
    if (side.shield > 0) {
      const pillX = x + HP_BAR.w + 14;
      context.fillStyle = PALETTE.gold;
      roundRect(pillX, y, 132, HP_BAR.h, 15);
      context.fill();
      text(`PERISAI ${side.shield}`, pillX + 66, y + 23, 18, '#20242c', 'center', true);
    }
  }

  function drawMana(side, manaMax) {
    const x0 = 1010;
    const y = 452;
    text(`MANA ${side.mana}/${manaMax}`, x0 - 12, y + 23, 20, PALETTE.text, 'right', true);
    for (let i = 0; i < manaMax; i += 1) {
      const cx = x0 + 14 + i * 23;
      const cy = y + 15;
      context.beginPath();
      context.moveTo(cx, cy - 11);
      context.lineTo(cx + 9, cy);
      context.lineTo(cx, cy + 11);
      context.lineTo(cx - 9, cy);
      context.closePath();
      if (i < side.mana) {
        context.fillStyle = PALETTE.blue;
        context.fill();
      } else {
        context.strokeStyle = PALETTE.dim;
        context.lineWidth = 2;
        context.stroke();
      }
    }
  }

  function drawCardBack(x, y, w, h) {
    context.fillStyle = PALETTE.cardBack;
    roundRect(x, y, w, h, 10);
    context.fill();
    context.strokeStyle = PALETTE.gold;
    context.lineWidth = 3;
    context.stroke();
    context.strokeStyle = '#4a5a6e';
    context.lineWidth = 2;
    roundRect(x + 10, y + 10, w - 20, h - 20, 6);
    context.stroke();
    const cx = x + w / 2;
    const cy = y + h / 2 - 8;
    context.beginPath();
    context.moveTo(cx, cy - 26);
    context.lineTo(cx + 22, cy);
    context.lineTo(cx, cy + 26);
    context.lineTo(cx - 22, cy);
    context.closePath();
    context.fillStyle = PALETTE.gold;
    context.fill();
    text('ARENA', cx, y + h - 24, 13, PALETTE.muted, 'center', true);
  }

  function drawCard(card, x, y, w, h, selected, affordable) {
    const el = ELEMENTS[card.el];
    const drawY = selected ? y - 16 : y;
    context.save();
    if (!affordable) context.globalAlpha = 0.45;
    context.fillStyle = PALETTE.cardFace;
    roundRect(x, drawY, w, h, 10);
    context.fill();
    context.strokeStyle = selected ? PALETTE.gold : el.color;
    context.lineWidth = selected ? 5 : 3;
    context.stroke();
    context.fillStyle = el.color;
    roundRect(x, drawY, w, 34, 10);
    context.fill();
    context.fillRect(x, drawY + 24, w, 10);
    text(el.name, x + w / 2, drawY + 24, 16, '#ffffff', 'center', true);
    // Mana cost gem, top-left.
    context.beginPath();
    context.arc(x + 20, drawY + 18, 17, 0, Math.PI * 2);
    context.fillStyle = PALETTE.blue;
    context.fill();
    context.strokeStyle = '#ffffff';
    context.lineWidth = 2;
    context.stroke();
    text(String(card.cost), x + 20, drawY + 25, 20, '#ffffff', 'center', true);
    // Big value, kind label, name.
    text(String(card.val), x + w / 2, drawY + 118, 64, KIND_COLOR[card.kind], 'center', true);
    text(KIND_LABEL[card.kind], x + w / 2, drawY + 148, 16, PALETTE.cardInk, 'center', true);
    text(card.name, x + w / 2, drawY + 176, 16, PALETTE.cardInk, 'center', true);
    context.restore();
  }

  function drawTable(state) {
    context.fillStyle = PALETTE.tableDark;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.table;
    roundRect(12, 12, FIELD.width - 24, FIELD.height - 24, 18);
    context.fill();
    context.strokeStyle = PALETTE.wood;
    context.lineWidth = 4;
    context.stroke();
    // Centre emblem.
    context.strokeStyle = 'rgba(242, 201, 76, 0.35)';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(FIELD.width / 2, 392, 46, 0, Math.PI * 2);
    context.stroke();
    text('ARENA', FIELD.width / 2, 400, 18, 'rgba(242, 201, 76, 0.55)', 'center', true);

    drawHpBar(HP_BAR.x, 18, state.rival, 'RIVAL');
    text(`GILIRAN ${state.round}`, FIELD.width - 24, 41, 24, PALETTE.text, 'right', true);
    drawHpBar(HP_BAR.x, 452, state.player, 'KAMU');
    drawMana(state.player, state.manaMax);
  }

  /** The hands, the log, the turn banner and the end-turn button (not on the title screen). */
  function drawHands(state) {
    for (let i = 0; i < state.rival.hand.length; i += 1) {
      drawCardBack(cardX(i, state.rival.hand.length, BACK.w, BACK.gap), BACK.y, BACK.w, BACK.h);
    }

    text(state.log, FIELD.width / 2, 292, 23, PALETTE.text, 'center', false);
    const banner = state.phase === 'play'
      ? (state.active === 'player' ? 'GILIRANMU — mainkan 1 kartu' : 'GILIRAN RIVAL')
      : '';
    if (banner) text(banner, FIELD.width / 2, 330, 28, state.active === 'player' ? PALETTE.gold : PALETTE.muted, 'center', true);

    const lay = layout(state);
    for (let i = 0; i < state.player.hand.length; i += 1) {
      const card = state.player.hand[i];
      const rect = lay.cards[i];
      drawCard(card, rect.x, rect.y, rect.w, rect.h, state.selected === i, card.cost <= state.player.mana);
    }
    if (state.phase === 'play' && state.active === 'player') {
      context.fillStyle = '#2c3e33';
      roundRect(END_TURN.x, END_TURN.y, END_TURN.w, END_TURN.h, 10);
      context.fill();
      context.strokeStyle = PALETTE.gold;
      context.lineWidth = 2;
      context.stroke();
      text('AKHIRI GILIRAN', END_TURN.x + END_TURN.w / 2, END_TURN.y + 35, 18, PALETTE.gold, 'center', true);
    }
  }

  function drawPanel(title, lines, prompt, titleColor) {
    const w = 780;
    const h = 220 + lines.length * 34;
    const x = (FIELD.width - w) / 2;
    const y = (FIELD.height - h) / 2;
    context.fillStyle = 'rgba(10, 15, 12, 0.72)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.panel;
    roundRect(x, y, w, h, 16);
    context.fill();
    context.strokeStyle = PALETTE.panelEdge;
    context.lineWidth = 3;
    context.stroke();
    text(title, FIELD.width / 2, y + 84, 56, titleColor, 'center', true);
    for (let i = 0; i < lines.length; i += 1) {
      text(lines[i], FIELD.width / 2, y + 138 + i * 34, 22, PALETTE.muted, 'center', false);
    }
    text(prompt, FIELD.width / 2, y + h - 34, 23, PALETTE.gold, 'center', true);
  }

  function draw(state, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawTable(state);
    if (screen === SCREEN_TITLE) {
      // No hands on the title screen: the empty table keeps the title and the button clear.
      text('DUEL KARTU', FIELD.width / 2, 175, 76, PALETTE.gold, 'center', true);
      text('A R E N A', FIELD.width / 2, 230, 40, PALETTE.text, 'center', true);
      text('Duel giliran melawan Rival. Masing-masing 30 HP.', FIELD.width / 2, 290, 23, PALETTE.text, 'center', false);
      text('Mainkan 1 kartu tiap giliran. Api > Daun > Air > Petir > Api (+2 damage).', FIELD.width / 2, 324, 23, PALETTE.text, 'center', false);
      text('Klik kartu untuk memainkannya, atau tekan 1-5. E = akhiri giliran.', FIELD.width / 2, 358, 23, PALETTE.text, 'center', false);
      text(`Kemenangan: ${best}`, FIELD.width / 2, 392, 22, PALETTE.muted, 'center', false);
      context.fillStyle = PALETTE.gold;
      roundRect(START_BUTTON.x, START_BUTTON.y, START_BUTTON.w, START_BUTTON.h, 12);
      context.fill();
      text('MULAI DUEL', FIELD.width / 2, START_BUTTON.y + 42, 28, '#20242c', 'center', true);
      text('Tekan Spasi atau klik tombol', FIELD.width / 2, START_BUTTON.y + 96, 20, PALETTE.muted, 'center', false);
      return;
    }
    drawHands(state);
    if (screen === SCREEN_PAUSED) {
      drawPanel('Jeda', ['Duel menunggu kamu.'], 'Tekan P untuk lanjut', PALETTE.text);
    } else if (screen === SCREEN_WIN) {
      drawPanel('MENANG!', [`Rival kalah dalam ${state.turns} kartu yang dimainkan.`, `Kemenangan: ${best}`], 'Tekan Spasi untuk main lagi', PALETTE.gold);
    } else if (screen === SCREEN_LOSS) {
      drawPanel('KALAH', ['HP kamu habis. Rival menang.', `Kemenangan: ${best}`], 'Tekan Spasi untuk coba lagi', PALETTE.red);
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, toLogical };
}
