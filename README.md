# Belanjawan 2027 — Cari Perbezaan

The game uses the original Belanjawan illustration. The source artwork in `game-original.html` remains byte-for-byte unchanged (Git blob `7963ea0935a6ee1b1008e20e882907b2989e633a`).

`index.html` loads the original game and `classic-upgrade.js` adds randomized differences. The replacement six-scene artwork has been removed.

- A pool of 60 candidate edits over the original illustration. A runtime pixel check excludes any edit that is not visibly different.
- Each round selects ten non-overlapping differences: three easy, four medium and three hard, covering at least five change categories. At most two colour swaps and three added decorations can appear.
- Categories include colour, additions, quantity, direction, size, pattern and details such as clock hands.
- Recent rounds are remembered locally to reduce recognizable repeats on the same device.
- Original-on-top and comparison-below layout, five-minute optional timer, synchronized pinch/zoom/pan and keyboard input.
- Numbered answers appear only after completion, time expiry or pressing “Tamatkan pusingan”.
- Existing Firebase play counter, menu link and copyright are preserved.

No build step or third-party browser dependencies are required. The original static game remains directly available at `game-original.html`.

Validation runs in GitHub Actions. For local validation, install `@napi-rs/canvas` and run:

```sh
node --check classic-upgrade.js
node tests/original.test.cjs
```

The checks verify the original asset hash, visible changed pixels, answer bounds, 10,000 randomized rounds, scoring, repeat handling, timer expiry, answer reveal and pinch gestures.

© 2026 IBJ. All rights reserved. Made by IBJ.
