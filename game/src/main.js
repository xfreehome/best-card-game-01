// Boot and the one loop: input is read every frame, the rival's thinking pause ticks in
// the world, and the renderer paints what is there. The game moves between five screens:
// title, play, paused, win and loss. Click a card (or press 1-5) to play it; E ends the
// turn; Space starts or rematches; P pauses.
//
// ?seed=N fixes the shuffle. ?shot=title|play|win|loss (with &seed=N) stages that scene
// instead of running the loop, paints it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_OVER } from './world.js';
import { ACTION_CONFIRM, ACTION_END_TURN, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, layout, SCREEN_LOSS, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the win count then lasts this visit only.
  }
}

function inside(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    screen = SCREEN_PLAY;
    announce('Duel dimulai. Giliranmu, mainkan 1 kartu.');
  }

  function endGame() {
    screen = world.state.phase === 'win' ? SCREEN_WIN : SCREEN_LOSS;
    if (world.state.phase === 'win') {
      best += 1;
      saveBest(best);
      announce(`Menang! Kemenangan: ${best}.`);
    } else {
      announce('Kalah. Rival menang.');
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    const cardKey = input.takeCardKey();
    if (screen === SCREEN_TITLE) {
      if (actions & ACTION_CONFIRM) startGame();
    } else if (screen === SCREEN_WIN || screen === SCREEN_LOSS) {
      if (actions & ACTION_CONFIRM) startGame();
    } else if (screen === SCREEN_PLAY) {
      if (actions & ACTION_PAUSE) {
        screen = SCREEN_PAUSED;
        announce('Jeda.');
      } else if (world.state.active === 'player') {
        if (cardKey >= 0) {
          if (world.playCard('player', cardKey)) return;
        }
        if (actions & ACTION_END_TURN) world.endTurn();
      }
    } else if (screen === SCREEN_PAUSED) {
      if (actions & (ACTION_PAUSE | ACTION_CONFIRM)) {
        screen = SCREEN_PLAY;
        announce('Lanjut.');
      }
    }
  }

  function handleClicks() {
    if (screen !== SCREEN_TITLE && screen !== SCREEN_PLAY && screen !== SCREEN_WIN && screen !== SCREEN_LOSS) return;
    const lay = layout(world.state);
    for (const click of input.takeClicks()) {
      const point = renderer.toLogical(click.x, click.y);
      if (screen === SCREEN_TITLE) {
        if (inside(point, lay.start)) startGame();
      } else if (screen === SCREEN_WIN || screen === SCREEN_LOSS) {
        startGame();
      } else if (screen === SCREEN_PLAY && world.state.active === 'player') {
        for (let i = 0; i < lay.cards.length; i += 1) {
          if (inside(point, lay.cards[i])) {
            world.playCard('player', i);
            break;
          }
        }
        if (inside(point, lay.endTurn)) world.endTurn();
      }
    }
  }

  function handleHover() {
    const pos = input.pointerPos();
    if (pos === null || screen !== SCREEN_PLAY) {
      world.state.selected = -1;
      return;
    }
    const point = renderer.toLogical(pos.x, pos.y);
    const lay = layout(world.state);
    world.state.selected = -1;
    for (let i = 0; i < lay.cards.length; i += 1) {
      if (inside(point, lay.cards[i])) {
        world.state.selected = i;
        break;
      }
    }
  }

  function frame() {
    requestAnimationFrame(frame);
    handleActions();
    handleClicks();
    handleHover();
    if (screen === SCREEN_PLAY) {
      const events = world.step(STEP);
      if (events & EVENT_OVER) endGame();
    }
    renderer.draw(world.state, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Jeda.');
    }
  });

  announce('Duel Kartu: Arena. Tekan Spasi atau klik untuk mulai.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
