# framework/viz — the shared animation engine

Every animated HTML page is **generated** from one small scene file, so we don't
hand-write ~900 lines of timeline code per problem.

```
framework/viz/
├── engine.css     # shared styling (page shell, controls, legend)
├── engine.js      # the mini-Manim engine (Timeline, player, boot, ctx helpers)
├── shell.html     # page skeleton with three inline tokens
└── build.py       # inlines css + engine + scene -> <problem>/visualize.html
```

## Build

```bash
python3 -m framework.viz.build topics/01_arrays_and_hashing/contains_duplicate
python3 -m framework.viz.build --all
```

The output `visualize.html` is **self-contained** (no CDN, no build step at
runtime), so `python3 run.py <problem> --html` serves it as before and it also
works opened directly or in VS Code's *Simple Browser*.

## Verify a scene (no browser)

`check.js` boots the engine + scene under a tiny DOM shim, seeds `?args=`, and
renders the whole timeline (as the scrubber would), so runtime errors and blank
pages are caught without a browser:

```bash
node framework/viz/check.js topics/01_arrays_and_hashing/contains_duplicate/visualize.scene.js \
     '[[1,2,3,1]]' '[[1,2,3,4]]'
```

Each extra argument is a JSON list passed as `?args=` (exactly what
`run.py --html` does). It exits non-zero if any arg set fails to boot or render.

## Scene contract

A problem ships `visualize.scene.js` defining a global `SCENE`:

```js
const SCENE = {
  meta: {
    title: "Contains Duplicate",
    subtitle: "one pass · hash set · O(n)",
    inputs: [{ id: "nums", label: "nums", type: "text",
               default: "1, 2, 3, 1", width: "wide" }],
    legend: [{ color: "#58C4DD", text: "current" }],
  },
  // raw input strings -> params object, or null when the input is invalid
  read(values) { ... },
  // optional: ?args=<JSON list> -> { inputId: rawString }
  fromArgs(args) { ... },
  // params -> a scene object (may define scene.reset to re-baseline)
  buildScene(params, ctx) { ... },
  // schedule the animation onto the timeline
  buildTimeline(scene, tl, ctx) { ... },
};
```

### `ctx` (from `framework/viz/engine.js`)

| helper | purpose |
| --- | --- |
| `ctx.layer(name)` | get/create an SVG `<g>` (`bg`, `arcs`, `chips`, `pointer`, `text`, `result`) |
| `ctx.backdrop()` | dark stage + dot grid + vignette |
| `ctx.glow(id, color)` | register a drop-shadow filter, returns `url(#id)`-usable id |
| `ctx.makeWritable()` | returns `writable(node)`, a left→right "write-on" reveal |
| `ctx.el` / `ctx.txt` | SVG element / text helpers |
| `ctx.C`, `ctx.ease`, `ctx.clamp` | palette, easing functions, clamp |
| `ctx.setOpacity/Translate/ScaleAt` | tiny attribute helpers |
| `ctx.Timeline` | the timeline class (you get an instance as `tl`) |

### Timeline

```js
tl.add(duration, u => { /* u is eased 0..1 */ }, ctx.ease.outCubic);
tl.wait(0.2);
```

`Timeline.render(t)` resets to the build-time baseline and replays, so scrubbing
backwards is always correct — keep `scene.reset` (if you define one) as the
single source of baseline state. The player, controls, keyboard shortcuts and
`?args=` boot are all handled by the engine.
