// The duel's rules and state, with no drawing and no browser in it: two 30-HP duelists,
// a 24-card deck each, a 5-card hand, mana that grows one per round, and four original
// elements with a rock-paper-scissors advantage (+2 damage). step() only advances the
// rival's thinking pause; turns are driven by playCard / endTurn / aiTurn, so the caller
// (the live loop or the screenshot stager) decides the pace. Nothing here allocates
// after createWorld returns, except the small draw reshuffle.
import {
  ADVANTAGE,
  ADVANTAGE_BONUS,
  CARDS,
  HAND_SIZE,
  MAX_MANA,
  START_HP,
} from './config.js';

export const EVENT_PLAY = 1;
export const EVENT_OVER = 2;

const RIVAL_WAIT = 0.8;

function makeSide() {
  return { hp: START_HP, maxHp: START_HP, shield: 0, mana: 1, hand: [], deck: [], discard: [], lastEl: null };
}

export function createWorld(random) {
  const state = {
    phase: 'title', // 'title' | 'play' | 'win' | 'loss'
    active: 'player', // whose turn it is while playing
    round: 1,
    manaMax: 1,
    player: makeSide(),
    rival: makeSide(),
    log: 'Selamat datang di Arena.',
    winner: null,
    turns: 0,
    aiWait: 0,
    selected: -1,
  };

  function shuffledDeck() {
    const deck = [];
    for (const card of CARDS) {
      deck.push(card, card);
    }
    for (let i = deck.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      const tmp = deck[i];
      deck[i] = deck[j];
      deck[j] = tmp;
    }
    return deck;
  }

  function draw(side) {
    if (side.hand.length >= HAND_SIZE) return;
    if (side.deck.length === 0) {
      if (side.discard.length === 0) return;
      side.deck = side.discard;
      side.discard = [];
      for (let i = side.deck.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        const tmp = side.deck[i];
        side.deck[i] = side.deck[j];
        side.deck[j] = tmp;
      }
    }
    side.hand.push(side.deck.pop());
  }

  function reset() {
    state.phase = 'play';
    state.active = 'player';
    state.round = 1;
    state.manaMax = 1;
    state.winner = null;
    state.turns = 0;
    state.aiWait = 0;
    for (const side of [state.player, state.rival]) {
      side.hp = START_HP;
      side.maxHp = START_HP;
      side.shield = 0;
      side.mana = 1;
      side.hand = [];
      side.discard = [];
      side.lastEl = null;
      side.deck = shuffledDeck();
      for (let i = 0; i < HAND_SIZE; i += 1) draw(side);
    }
    state.log = 'Giliranmu. Mainkan 1 kartu.';
  }

  function toTitle() {
    reset();
    state.phase = 'title';
    state.log = 'Duel kartu giliran melawan Rival.';
  }

  function advantage(attackerEl, defenderLastEl) {
    return defenderLastEl !== null && ADVANTAGE[attackerEl] === defenderLastEl;
  }

  function applyCard(actor, target, card) {
    const who = actor === state.player ? 'Kamu' : 'Rival';
    if (card.kind === 'dmg') {
      let dmg = card.val;
      let extra = '';
      if (advantage(card.el, target.lastEl)) {
        dmg += ADVANTAGE_BONUS;
        extra = ' EFEKTIF +2!';
      }
      const blocked = Math.min(target.shield, dmg);
      target.shield -= blocked;
      target.hp = Math.max(0, target.hp - (dmg - blocked));
      state.log = `${who} memainkan ${card.name}: ${dmg} damage${blocked > 0 ? ` (${blocked} ditahan perisai)` : ''}.${extra}`;
    } else if (card.kind === 'heal') {
      const healed = Math.min(target.maxHp - actor.hp, card.val);
      actor.hp += healed;
      state.log = `${who} memainkan ${card.name}: pulih ${healed} HP.`;
    } else {
      actor.shield += card.val;
      state.log = `${who} memainkan ${card.name}: perisai +${card.val}.`;
    }
    actor.lastEl = card.el;
  }

  function checkEnd() {
    if (state.rival.hp <= 0) {
      state.phase = 'win';
      state.winner = 'player';
      state.log = 'Rival kalah! Kamu menang!';
      return EVENT_OVER;
    }
    if (state.player.hp <= 0) {
      state.phase = 'loss';
      state.winner = 'rival';
      state.log = 'HP kamu habis. Rival menang.';
      return EVENT_OVER;
    }
    return 0;
  }

  function canPlay(side, index) {
    const card = side.hand[index];
    return card !== undefined && card.cost <= side.mana;
  }

  /** Play hand[index] for `side` ('player' | 'rival'). Returns true when a card was played. */
  function playCard(side, index) {
    if (state.phase !== 'play') return false;
    const actor = side === 'player' ? state.player : state.rival;
    const target = side === 'player' ? state.rival : state.player;
    if (!canPlay(actor, index)) return false;
    const card = actor.hand[index];
    actor.mana -= card.cost;
    actor.hand.splice(index, 1);
    actor.discard.push(card);
    applyCard(actor, target, card);
    state.turns += 1;
    draw(actor);
    const over = checkEnd();
    if (over) return true;
    if (side === 'player') {
      state.active = 'rival';
      state.aiWait = RIVAL_WAIT;
      state.log += ' Rival berpikir...';
    } else {
      state.active = 'player';
      state.round += 1;
      state.manaMax = Math.min(MAX_MANA, state.round);
      state.player.mana = state.manaMax;
      state.rival.mana = state.manaMax;
      state.log = `Giliran ${state.round}. Giliranmu. Mainkan 1 kartu.`;
    }
    return true;
  }

  /** The player ends the turn without playing a card. */
  function endTurn() {
    if (state.phase !== 'play' || state.active !== 'player') return false;
    state.turns += 1;
    state.active = 'rival';
    state.aiWait = RIVAL_WAIT;
    state.log = 'Kamu mengakhiri giliran. Rival berpikir...';
    return true;
  }

  /** Pick a card index for `side`: 'best' plays to win, 'weak' plays the cheapest it can. */
  function pickCard(side, style) {
    const actor = side === 'player' ? state.player : state.rival;
    const target = side === 'player' ? state.rival : state.player;
    let bestIndex = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < actor.hand.length; i += 1) {
      const card = actor.hand[i];
      if (card.cost > actor.mana) continue;
      let score = 0;
      if (style === 'weak') {
        score = -card.cost * 10 - card.val;
      } else if (card.kind === 'dmg') {
        score = card.val + (advantage(card.el, target.lastEl) ? ADVANTAGE_BONUS : 0);
        if (target.hp - score <= 0) score += 100;
        if (target.hp <= 8) score += 5;
      } else if (card.kind === 'heal') {
        score = actor.hp <= 12 ? 20 + card.val : -5;
      } else {
        score = actor.hp <= 15 ? 12 + card.val : -5;
      }
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    return bestIndex;
  }

  /** The side plays its picked card (or passes when nothing is affordable). */
  function autoPlay(side, style) {
    if (state.phase !== 'play') return false;
    const index = pickCard(side, style);
    if (index === -1) {
      if (side === 'player') return endTurn();
      state.active = 'player';
      state.round += 1;
      state.manaMax = Math.min(MAX_MANA, state.round);
      state.player.mana = state.manaMax;
      state.rival.mana = state.manaMax;
      state.log = `Giliran ${state.round}. Rival melewatkan giliran. Giliranmu.`;
      return true;
    }
    return playCard(side, index);
  }

  /** The rival's whole turn, at once (used by the live loop when its pause expires). */
  function aiTurn() {
    return autoPlay('rival', 'best');
  }

  /** One fixed step: only the rival's thinking pause ticks here. */
  function step(dt) {
    let events = 0;
    if (state.phase === 'play' && state.active === 'rival' && state.aiWait > 0) {
      state.aiWait -= dt;
      if (state.aiWait <= 0) {
        aiTurn();
        events |= EVENT_PLAY;
        if (state.phase !== 'play') events |= EVENT_OVER;
      }
    }
    return events;
  }

  reset();
  state.phase = 'title';
  return { state, reset, toTitle, step, playCard, endTurn, autoPlay, aiTurn, canPlay };
}
