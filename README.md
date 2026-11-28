# Belanjawan 2027 — Cari Perbezaan

Spot-the-difference game using the original Belanjawan illustration. `game-original.html` remains byte-for-byte unchanged (Git blob `7963ea0935a6ee1b1008e20e882907b2989e633a`).

The ten comparison sets each contain ten randomly drawn edits from a pool of 40 variants across 21 locations. Any two sets differ in at least four locations. The artwork changes include object replacements, added details, accessories, signs, and colours. The game shuffles the ten sets and plays all of them before repeating on the same device.

The original appears above the comparison image. The three-minute timer starts by default and can be switched off. Pinch zoom, the answer guide and the play counter remain available.

Each file in `sets/` contains the ten answer areas and a lossless atlas of replacement tiles. The game assembles the selected image from the original at native resolution so it matches the corresponding comparison without downloading another full image.

No build step or third-party browser dependencies are required. The original fixed-set game remains directly available at `game-original.html`.

Install `@napi-rs/canvas` in your development environment to run the checks locally:

```sh
node --check classic-upgrade.js
node --check crisp-differences.js
node tests/original.test.cjs
```

GitHub Actions runs the same checks. They verify the original asset hash, the visible edits and bounds of all 100 answer tiles, all 100 tap targets, set rotation, timer expiry, answers and pinch gestures.

© 2026 IBJ. All rights reserved. Made by IBJ.
