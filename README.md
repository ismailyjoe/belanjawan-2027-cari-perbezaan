# Belanjawan 2027 — Cari Perbezaan

Spot-the-difference game using the original Belanjawan illustration. `game-original.html` remains byte-for-byte unchanged (Git blob `7963ea0935a6ee1b1008e20e882907b2989e633a`).

`index.html` loads the original game, `crisp-differences.js` prepares clear differences and `classic-upgrade.js` supplies randomized rounds and the answer guide.

- 132 prepared candidate variants: 72 added-item variants across 36 locations, 48 colour/fabric variants on 12 existing surfaces, ten detail changes and two clock-face replacements. A pixel check excludes variants without sufficient visible contrast (131 pass with the tested renderer).
- Added items include balloons, kites, butterflies, birds, boats, fish, life rings, balls, presents, cones, baskets, umbrellas, lanterns and watering cans.
- Garment/object colours change in place while retaining original shading. Stripes, polka dots and checks follow explicit surface polygons and hue masks. Face regions are excluded.
- No mirrored, rotated, enlarged or feathered image patches; no legacy colour-patch tiles. Actual source pixels never move or rescale during colour/fabric changes.
- Each round selects ten non-overlapping changes, including at least three added items, two colour changes, two fabric changes and one clear detail. Alternate changes to the same object are mutually exclusive.
- Recent rounds are remembered locally to reduce repeated answer locations on the same device.
- The original-on-top and comparison-below layout, three-minute timer enabled by default (can be disabled), synchronized pinch/zoom/pan, keyboard input, Firebase play counter, menu link and copyright are retained.
- Numbered answers become available after completion, expiry or pressing “Tamatkan pusingan”.

No build step or third-party browser dependencies are required. The original fixed-set game remains directly available at `game-original.html`.

Install `@napi-rs/canvas` in your development environment to run the checks locally:

```sh
node --check classic-upgrade.js
node --check crisp-differences.js
node tests/original.test.cjs
```

GitHub Actions runs the same checks. They verify the original asset hash, visible differences and answer bounds, sharp surface masks, unchanged shading positions, face exclusions, 10,000 randomized rounds, scoring, timer expiry, answers and pinch gestures.

© 2026 IBJ. All rights reserved. Made by IBJ.
