# DUEL KARTU: ARENA — turn-based card duel vs the Rival

[![make.fun competition](https://img.shields.io/badge/make.fun-best--card--game--20261122--1826-orange)](https://make.fun/competitions/best-card-game-20261122-1826)
[![make.fun rank](https://img.shields.io/badge/make.fun-rank-top--10-blue)](https://make.fun/competitions/best-card-game-20261122-1826)
[![make.fun reward](https://img.shields.io/badge/make.fun-reward-%2450-green)](https://make.fun/competitions/best-card-game-20261122-1826)

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
