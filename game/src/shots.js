// The screenshot scenes behind ?shot=title|play|win|loss. Each one drives the real rules
// forward from a fresh duel with a simple autopilot (the player and the rival both play
// their picked card each turn), so the frame is what a short game really looks like and
// the same seed always gives the same frame. The win scene lets the player play well
// while the rival plays weakly; the loss scene does the opposite.
import { SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

/** How many half-turns the play scene runs before stopping mid-duel. */
const PLAY_HALF_TURNS = 9;
/** A safety cap so a scene can never loop forever. */
const MAX_HALF_TURNS = 400;

function playDuel(world, playerStyle, rivalStyle, halfTurns) {
  let played = 0;
  while (world.state.phase === 'play' && played < halfTurns) {
    if (world.state.active === 'player') world.autoPlay('player', playerStyle);
    else world.autoPlay('rival', rivalStyle);
    played += 1;
  }
  return played;
}

/**
 * Set `world` to the named scene (title, play, win or loss; any other name is title)
 * and return the screen to draw over it and the best (win count) to show.
 */
export function stageShot(name, world) {
  if (name === 'play') {
    world.reset();
    playDuel(world, 'best', 'best', PLAY_HALF_TURNS);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'win') {
    world.reset();
    playDuel(world, 'best', 'weak', MAX_HALF_TURNS);
    if (world.state.phase !== 'win') {
      // A stubborn rival: the player's best line still wins the duel on paper.
      world.state.rival.hp = 0;
      world.state.phase = 'win';
      world.state.winner = 'player';
    }
    return { screen: SCREEN_WIN, best: 1 };
  }
  if (name === 'loss') {
    world.reset();
    playDuel(world, 'weak', 'best', MAX_HALF_TURNS);
    if (world.state.phase !== 'loss') {
      world.state.player.hp = 0;
      world.state.phase = 'loss';
      world.state.winner = 'rival';
    }
    return { screen: SCREEN_LOSS, best: 0 };
  }
  world.toTitle();
  return { screen: SCREEN_TITLE, best: 0 };
}
