# Belanjawan 2027 — Cari Perbezaan

Malay-language spot-the-difference game, published with GitHub Pages.

- Six editable community scenes: market, school, clinic, farm, transport hub and construction site.
- Each scene has 30 possible change locations. A round selects ten: three easy, four medium and three hard, with at least five change types and at most two colour changes.
- Objects, baseline colours, quantities, orientations and change operations vary between rounds. Recent locations are checked to avoid recognisable repeats.
- Random selection cycles through all six scenes before repeating. Local history survives page reloads where browser storage is available.
- Turn mode always chooses another scene for the next player. A specific scene can be selected in normal mode.
- Optional five-minute timer, synchronized 1–4× zoom/pinch/pan, mouse/touch/keyboard input and numbered answers available only after the round ends.
- Existing Firebase play counter and menu link are retained. The original game remains available at `game-original.html`.

`index.html`, `style.css`, `scenes.js` and `game.js` run directly with no build step or third-party browser dependencies. Artwork is drawn from editable Canvas objects, and each object's bounds also define its clickable answer region.

For development, serve the repository with any static HTTP server. To run validation, install `@napi-rs/canvas` in your development environment and run from the repository root:

```sh
node --check scenes.js
node --check game.js
node tests/game.test.cjs
node tests/scenes.test.cjs
```

The scene test generates 6,000 rounds and compares the pixels of 2,160 candidate changes, checking visibility, occlusion and answer bounds. The game test covers scoring, round rotation, timer expiry, gesture suppression, counter requests and storage failures.

© 2026 IBJ. All rights reserved. Made by IBJ.
