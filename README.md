# DUEL KARTU: ARENA — turn-based card duel vs the Rival

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/xfreehome/best-card-game-01/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/xfreehome/best-card-game-01/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

A turn-based card duel in a desktop browser, from static files with no network
request. You and the Rival each have 30 HP; every turn you play 1 card from a
5-card hand — attack, heal, or shield — spending mana that grows one per round.
Four original elements (Api, Air, Daun, Petir) form a cycle: Api beats Daun,
Daun beats Air, Air beats Petir, Petir beats Api, for +2 damage. First to 0 HP
loses.

## How to play

- Click a card (or press 1-5) to play it. Dimmed cards cost more mana than you have.
- **E** ends your turn without playing. **Space** starts / rematches. **P** pauses.
- The Rival answers after a short pause, then your mana refills and grows.

## Screenshots

- `screenshots/1-title.jpg` — title screen with the MULAI DUEL button
- `screenshots/2-play.jpg` — the table mid-duel, both hands and both HP bars
- `screenshots/3-win.jpg` — the MENANG! screen (Rival at 0 HP)
- `screenshots/4-loss.jpg` — the KALAH screen (your HP at 0)

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

`?shot=title|play|win|loss&seed=1` stages a screenshot scene from the real rules.
`main.ts` (Node 22) copies `game/` and `screenshots/` to `/output` and writes
`dossier.json` via `vendor/makefun-game.ts`.
