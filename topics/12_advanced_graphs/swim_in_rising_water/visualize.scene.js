/* Swim in Rising Water — animated minimax-Dijkstra scene.
 *
 * Water level t exposes every cell with elevation <= t. Moving to a neighbour
 * costs the higher of the current time and that cell's elevation, so Dijkstra
 * over cells with key max(time, grid[nr][nc]) finds the earliest arrival.
 * The right panel tracks the water gauge, the min-heap and the final path.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Swim in Rising Water",
    subtitle: "minimax Dijkstra · cost = max(time, elevation) · O(n² log n)",
    inputs: [
      {
        id: "grid",
        label: "grid",
        type: "text",
        default: "0 1 5; 3 4 6; 2 9 7",
        width: "wide",
      },
    ],
    legend: [
      { color: "#58C4DD", text: "current cell" },
      { color: "#F0AC5F", text: "frontier / water level" },
      { color: "#83C167", text: "settled cell" },
      { color: "#FC6255", text: "stale heap entry" },
    ],
  },

  code: [
    "def swim_in_water(grid: List[List[int]]) -> int:",
    "    n = len(grid)",
    "    best = [[inf] * n for _ in range(n)]",
    "    best[0][0] = grid[0][0]",
    "    heap = [(grid[0][0], 0, 0)]",
    "    while heap:",
    "        time, row, col = heapq.heappop(heap)",
    "        if time > best[row][col]:          # stale entry",
    "            continue",
    "        if row == n - 1 and col == n - 1:",
    "            return time",
    "        for d_row, d_col in ((1, 0), (-1, 0), (0, 1), (0, -1)):",
    "            n_row, n_col = row + d_row, col + d_col",
    "            if 0 <= n_row < n and 0 <= n_col < n:",
    "                n_time = max(time, grid[n_row][n_col])",
    "                if n_time < best[n_row][n_col]:",
    "                    best[n_row][n_col] = n_time",
    "                    heapq.heappush(heap, (n_time, n_row, n_col))",
    "    return best[n - 1][n - 1]",
  ],

  read(values) {
    const raw = String(values.grid || "").trim();
    if (!raw) return null;
    let grid;
    try {
      if (raw.startsWith("[")) {
        grid = JSON.parse(raw);
      } else {
        grid = raw
          .split(/[;\n]+/)
          .map(row => row.trim())
          .filter(Boolean)
          .map(row => row.split(/[\s,]+/).filter(Boolean).map(Number));
      }
    } catch (err) {
      return null;
    }
    if (!Array.isArray(grid) || grid.length < 1 || grid.length > 6) return null;
    if (!grid.every(row => Array.isArray(row) && row.length === grid.length)) return null;
    if (!grid.flat().every(v => Number.isInteger(v) && v >= 0 && v <= 99)) return null;
    const seen = new Set(grid.flat());
    if (seen.size !== grid.length * grid.length) return null;
    return { grid: grid.map(row => row.map(Number)) };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || !Array.isArray(args[0])) return null;
    const grid = args[0];
    if (!grid.length || grid.length > 6) return null;
    if (!grid.every(row => Array.isArray(row) && row.length === grid.length)) return null;
    if (!grid.flat().every(v => Number.isInteger(Number(v)))) return null;
    return { grid: grid.map(row => row.map(Number).join(" ")).join("; ") };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, STAGE_W } = ctx;
    const { grid } = params;
    const n = grid.length;
    const sim = simulateSwim(grid);
    const maxElev = Math.max(...grid.flat());

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-red", C.red);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const arcsL = ctx.layer("arcs");
    const resultL = ctx.layer("result");

    const scene = {
      grid, n, sim, maxElev, cells: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title ---------------------------------------------------------
    scene.title = txt("Swim in Rising Water", {
      x: 64, y: 64, "font-size": 42, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    scene.subtitle = txt(
      n + "×" + n + " elevation map   ·   start (0,0)   ·   reach (" + (n - 1) + "," + (n - 1) + ") as early as possible",
      { x: 64, y: 101, "font-size": 18, fill: C.grey },
      textL
    );
    setOpacity(scene.subtitle, 0);

    // ---- grid panel ----------------------------------------------------
    const pX = 40, pY = 132, pW = 690, pH = 480;
    scene.gridPanel = el("g", {}, chipsL);
    el("rect", {
      x: pX, y: pY, width: pW, height: pH, rx: 14,
      fill: "#0b1019", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.gridPanel);
    setOpacity(scene.gridPanel, 0);
    scene.gridTitle = txt("elevation map", {
      x: pX + 20, y: pY + 27, "font-size": 16, fill: C.blue,
    }, textL);
    setOpacity(scene.gridTitle, 0);

    const cell = clamp(400 / n, 55, 100);
    const gridW = n * cell;
    const gridH = n * cell;
    const gridX = pX + (pW - gridW) / 2;
    const gridTop = pY + 46 + (pH - 60 - gridH) / 2;

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const x = gridX + c * cell;
        const y = gridTop + r * cell;
        const value = grid[r][c];
        const g = el("g", {}, chipsL);
        const rect = el("rect", {
          x: x + 2, y: y + 2, width: cell - 4, height: cell - 4, rx: 8,
          fill: elevationColor(value, maxElev), stroke: "#33465a", "stroke-width": 1.5,
        }, g);
        const halo = el("rect", {
          x: x + 1, y: y + 1, width: cell - 2, height: cell - 2, rx: 9,
          fill: "none", stroke: C.gold, "stroke-width": 3,
          filter: "url(#glow-gold)",
        }, g);
        setOpacity(halo, 0);
        const pathMark = el("rect", {
          x: x + 5, y: y + 5, width: cell - 10, height: cell - 10, rx: 6,
          fill: "none", stroke: C.gold, "stroke-width": 3.5,
          filter: "url(#glow-gold)",
        }, g);
        setOpacity(pathMark, 0);
        const elev = txt(String(value), {
          x: x + cell / 2, y: y + cell / 2 + 1, "text-anchor": "middle",
          "dominant-baseline": "central", "font-size": clamp(cell * 0.3, 15, 29),
          fill: C.white,
        }, g);
        const best = txt("∞", {
          x: x + 8, y: y + 16, "font-size": clamp(cell * 0.13, 9, 12), fill: C.white,
        }, g);
        setOpacity(g, 0);
        scene.cells.push({ r, c, value, x, y, g, rect, halo, pathMark, elev, best });
      }
    }

    // ---- right panel ---------------------------------------------------
    const qX = 750, qY = 132, qW = 494, qH = 480;
    scene.sidePanel = el("g", {}, chipsL);
    el("rect", {
      x: qX, y: qY, width: qW, height: qH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.sidePanel);
    setOpacity(scene.sidePanel, 0);
    scene.sideTitle = txt("water level", {
      x: qX + 20, y: qY + 31, "font-size": 18, fill: C.gold,
    }, textL);
    setOpacity(scene.sideTitle, 0);

    // gauge
    const gaugeX = qX + 24, gaugeY = qY + 58, gaugeW = qW - 48, gaugeH = 14;
    const grad = el("linearGradient", { id: "water-grad", x1: "0%", x2: "100%" }, ctx.defs);
    el("stop", { offset: "0%", "stop-color": "#1f5f7a" }, grad);
    el("stop", { offset: "55%", "stop-color": C.blue }, grad);
    el("stop", { offset: "100%", "stop-color": C.gold }, grad);
    el("rect", {
      x: gaugeX, y: gaugeY, width: gaugeW, height: gaugeH, rx: 7,
      fill: "url(#water-grad)", opacity: 0.45,
    }, scene.sidePanel);
    scene.gaugeMarker = el("rect", {
      x: gaugeX, y: gaugeY - 4, width: 5, height: gaugeH + 8, rx: 2.5,
      fill: C.gold, filter: "url(#glow-gold)",
    }, scene.sidePanel);
    scene.gaugeValue = txt("t = 0", {
      x: gaugeX + gaugeW, y: gaugeY + 36, "text-anchor": "end",
      "font-size": 24, fill: C.gold,
    }, textL);
    setOpacity(scene.gaugeValue, 0);
    scene.gaugeRange = txt("0 … " + maxElev, {
      x: gaugeX, y: gaugeY + 36, "font-size": 13, fill: C.grey,
    }, textL);
    setOpacity(scene.gaugeRange, 0);

    scene.currentLabel = txt("current cell", {
      x: qX + 22, y: qY + 142, "font-size": 14, fill: C.grey,
    }, textL);
    setOpacity(scene.currentLabel, 0);
    scene.current = txt("—", {
      x: qX + 22, y: qY + 170, "font-size": 20, fill: C.white,
    }, textL);
    setOpacity(scene.current, 0);

    scene.heapLabel = txt("min-heap  (time, row, col)", {
      x: qX + 22, y: qY + 220, "font-size": 14, fill: C.gold,
    }, textL);
    setOpacity(scene.heapLabel, 0);
    scene.heapText = txt("", {
      x: qX + 22, y: qY + 246, "font-size": 13, fill: C.white,
    }, textL);
    setOpacity(scene.heapText, 0);

    scene.statsLabel = txt("settled cells", {
      x: qX + 22, y: qY + 292, "font-size": 14, fill: C.grey,
    }, textL);
    setOpacity(scene.statsLabel, 0);
    scene.stats = txt("0 / " + (n * n), {
      x: qX + 22, y: qY + 318, "font-size": 18, fill: C.green,
    }, textL);
    setOpacity(scene.stats, 0);

    scene.pathLabel = txt("best-time matrix", {
      x: qX + 22, y: qY + 366, "font-size": 14, fill: C.grey,
    }, textL);
    setOpacity(scene.pathLabel, 0);
    const matrixFont = n >= 5 ? 10 : 11.5;
    const matrixStep = n >= 5 ? 12 : 15;
    scene.pathRows = [];
    for (let r = 0; r < n; r++) {
      const row = txt("", {
        x: qX + 22, y: qY + 392 + r * matrixStep,
        "font-size": matrixFont, fill: C.blue,
      }, textL);
      setOpacity(row, 0);
      scene.pathRows.push(row);
    }

    // ---- status + result ----------------------------------------------
    scene.status = txt("", {
      x: 64, y: 628, "font-size": 19, fill: C.gold,
    }, textL);
    setOpacity(scene.status, 0);
    scene.resultBox = el("rect", {
      x: 300, y: 648, width: 680, height: 56, rx: 12,
      fill: "#111a16", stroke: C.green, "stroke-width": 2.2,
      filter: "url(#glow-green)",
    }, resultL);
    setOpacity(scene.resultBox, 0);
    scene.result = txt("", {
      x: STAGE_W / 2, y: 676, "text-anchor": "middle",
      "dominant-baseline": "central", "font-size": 28, fill: C.green,
    }, resultL);
    scene.note = txt("", {
      x: STAGE_W / 2, y: 714, "text-anchor": "middle",
      "font-size": 13, fill: C.grey,
    }, resultL);

    // ---- baseline ------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.gridPanel, scene.gridTitle,
                          scene.sidePanel, scene.sideTitle, scene.gaugeValue,
                          scene.gaugeRange, scene.currentLabel, scene.current,
                          scene.heapLabel, scene.heapText, scene.statsLabel,
                          scene.stats, scene.pathLabel,
                          scene.status, scene.resultBox, scene.note]) {
        setOpacity(node, 0);
      }
      scene.gaugeValue.textContent = "t = 0";
      scene.gaugeValue.setAttribute("fill", C.gold);
      scene.gaugeMarker.setAttribute("x", gaugeX);
      scene.current.textContent = "—";
      scene.heapText.textContent = "";
      scene.stats.textContent = "0 / " + (n * n);
      for (const row of scene.pathRows) {
        setOpacity(row, 0);
        row.textContent = "";
      }
      scene.status.textContent = "";
      scene.result.textContent = "";
      scene.note.textContent = "";
      for (const c of scene.cells) {
        setOpacity(c.g, 0);
        setOpacity(c.halo, 0);
        setOpacity(c.pathMark, 0);
        c.rect.setAttribute("stroke", "#33465a");
        c.rect.setAttribute("stroke-width", "1.5");
        c.elev.setAttribute("fill", C.white);
        c.best.textContent = "∞";
        c.best.setAttribute("fill", "#c8d3df");
      }
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity, STAGE_W } = ctx;
    const { sim, n, grid, maxElev } = scene;
    const easeOut = ease.outCubic;

    scene.reset();

    const status = (text, color, log) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || C.gold);
        setOpacity(scene.status, 1);
      });
      if (log) tl.log(text, color || C.gold);
    };

    const cellAt = (r, c) => scene.cells[r * n + c];

    const apply = (snap, active, relaxFrom, relaxTo) => {
      tl.add(0.35, u => {
        for (const c of scene.cells) {
          const t = snap.best[c.r][c.c];
          const isActive = active && c.r === active.r && c.c === active.c;
          const isFrom = relaxFrom && c.r === relaxFrom.r && c.c === relaxFrom.c;
          const isTo = relaxTo && c.r === relaxTo.r && c.c === relaxTo.c;
          const settled = snap.done[c.r][c.c];
          c.rect.setAttribute("stroke", isActive ? C.gold : (isTo ? C.blue : (settled ? C.green : "#33465a")));
          c.rect.setAttribute("stroke-width", isActive ? 3.5 : (isTo || isFrom ? 2.8 : 1.5));
          c.best.textContent = t === Infinity ? "∞" : String(t);
          c.best.setAttribute("fill", t === Infinity ? "#9fb0c1" : (settled ? C.green : C.white));
          c.elev.setAttribute("fill", settled ? C.green : C.white);
          setOpacity(c.halo, isActive ? u : 0);
        }
        const level = active ? (snap.best[active.r][active.c] === Infinity ? 0 : snap.best[active.r][active.c]) : 0;
        scene.gaugeValue.textContent = "t = " + level;
        const ratio = maxElev ? level / maxElev : 0;
        scene.gaugeMarker.setAttribute("x", (gaugeX(scene) + ratio * (gaugeW(scene))));
        scene.current.textContent = active
          ? "(" + active.r + "," + active.c + ")  elev " + grid[active.r][active.c]
          : "—";
        scene.heapText.textContent = snap.heap.length
          ? snap.heap.slice(0, 6).map(item => "(" + item.t + "," + item.r + "," + item.c + ")").join("  ")
          : "empty";
        scene.stats.textContent = snap.settledCount + " / " + (n * n);
        // best-time matrix readout, one line per row so wide grids stay readable
        scene.pathRows.forEach((row, r) => {
          row.textContent = snap.best[r]
            .map(v => (v === Infinity ? "∞" : String(v))).join("   ");
          setOpacity(row, 1);
        });
      }, easeOut);
    };

    // geometry helpers mirrored from buildScene (kept local for readability)
    function gaugeX(sc) { return sc.sim.gaugeX; }
    function gaugeW(sc) { return sc.sim.gaugeW; }

    // ---- intro ---------------------------------------------------------
    tl.line(1);
    tl.add(0.65, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    tl.line([2, 3, 4, 5]);
    tl.add(0.3, u => {
      setOpacity(scene.gridPanel, u);
      setOpacity(scene.gridTitle, u);
      setOpacity(scene.sidePanel, u);
      setOpacity(scene.sideTitle, u);
      setOpacity(scene.gaugeValue, u);
      setOpacity(scene.gaugeRange, u);
      setOpacity(scene.currentLabel, u);
      setOpacity(scene.heapLabel, u);
      setOpacity(scene.statsLabel, u);
      setOpacity(scene.pathLabel, u);
    }, easeOut);
    for (const c of scene.cells) {
      tl.add(0.1, u => setOpacity(c.g, u), easeOut);
      tl.wait(0.015);
    }
    status("start at (0,0): best[0][0] = " + grid[0][0] + " and the heap holds that one cell", C.blue, true);
    apply(sim.initial, { r: 0, c: 0 }, null, null);
    tl.wait(0.25);

    // ---- Dijkstra events ----------------------------------------------
    sim.events.forEach(ev => {
      if (ev.kind === "pop") {
        tl.line([6, 7]);
        if (ev.stale) {
          status("pop (" + ev.t + ", " + ev.r + ", " + ev.c + ")  ·  stale (best is " +
            (ev.current === Infinity ? "∞" : ev.current) + ")  →  skip", C.red);
          apply(ev.snapshot, { r: ev.r, c: ev.c }, null, null);
        } else if (ev.target) {
          tl.line([8, 9]);
          status("pop (" + ev.t + ", " + ev.r + ", " + ev.c + ")  ·  that is the destination  →  return " + ev.t, C.green, true);
          apply(ev.snapshot, { r: ev.r, c: ev.c }, null, null);
        } else {
          tl.line(8);
          status("pop (" + ev.t + ", " + ev.r + ", " + ev.c + ")  ·  settle this cell", C.gold, true);
          apply(ev.snapshot, { r: ev.r, c: ev.c }, null, null);
        }
      } else {
        tl.line([10, 11, 12, 13]);
        if (ev.accepted) {
          status("neighbour (" + ev.nr + "," + ev.nc + "): max(" + ev.t + ", " +
            grid[ev.nr][ev.nc] + ") = " + ev.newT +
            "  <  " + (ev.oldT === Infinity ? "∞" : ev.oldT) + "  →  update", C.green);
          tl.line([14, 15, 16]);
        } else {
          status("neighbour (" + ev.nr + "," + ev.nc + "): max(" + ev.t + ", " +
            grid[ev.nr][ev.nc] + ") = " + ev.newT + "  ≥  best  →  skip", C.grey);
        }
        apply(ev.snapshot, { r: ev.r, c: ev.c }, { r: ev.r, c: ev.c }, { r: ev.nr, c: ev.nc });
      }
      tl.wait(0.08);
    });

    // ---- path + answer -------------------------------------------------
    tl.line(10);
    status("shortest minimax path found at time " + sim.answer, C.green, true);
    for (const p of sim.path) {
      tl.add(0.22, u => {
        const c = cellAt(p[0], p[1]);
        setOpacity(c.pathMark, u);
        c.rect.setAttribute("stroke", C.gold);
      }, easeOut);
    }
    tl.add(0.4, u => setOpacity(scene.resultBox, u), easeOut);
    scene.result.textContent = "return " + sim.answer;
    tl.add(0.55, scene.writer(scene.result), ease.linear);
    scene.note.textContent = "path: " + sim.path.map(p => "(" + p[0] + "," + p[1] + ")").join(" → ");
    tl.add(0.4, scene.writer(scene.note), ease.linear);
    tl.wait(1.1);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Simulation: minimax Dijkstra over the grid.
 * ------------------------------------------------------------------ */
function simulateSwim(grid) {
  const n = grid.length;
  const best = Array.from({ length: n }, () => new Array(n).fill(Infinity));
  const parent = Array.from({ length: n }, () => new Array(n).fill(null));
  const done = Array.from({ length: n }, () => new Array(n).fill(false));
  best[0][0] = grid[0][0];

  let heap = [{ t: grid[0][0], r: 0, c: 0 }];
  const sortHeap = () => heap.sort((a, b) => (a.t - b.t) || (a.r - b.r) || (a.c - b.c));
  let settledCount = 0;
  let path = [];
  let answer = grid[n - 1][n - 1];

  const snapshot = () => ({
    best: best.map(row => row.slice()),
    parent: parent.map(row => row.map(p => (p ? [p[0], p[1]] : null))),
    done: done.map(row => row.slice()),
    heap: heap.map(item => ({ t: item.t, r: item.r, c: item.c })),
    settledCount,
  });

  const initial = snapshot();
  const events = [];

  while (heap.length) {
    sortHeap();
    const top = heap.shift();
    const stale = top.t > best[top.r][top.c];
    if (stale) {
      events.push({
        kind: "pop", ...top, stale, current: best[top.r][top.c],
        snapshot: snapshot(),
      });
      continue;
    }

    done[top.r][top.c] = true;
    settledCount++;
    const isTarget = top.r === n - 1 && top.c === n - 1;
    if (isTarget) {
      answer = top.t;
      const chain = [];
      let cur = [top.r, top.c];
      while (cur) {
        chain.push(cur);
        const p = parent[cur[0]][cur[1]];
        cur = p ? [p[0], p[1]] : null;
      }
      path = chain.reverse();
    }
    events.push({
      kind: "pop", ...top, stale: false, target: isTarget,
      current: best[top.r][top.c],
      snapshot: snapshot(),
    });
    if (isTarget) break;

    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = top.r + dr, nc = top.c + dc;
      if (nr < 0 || nr >= n || nc < 0 || nc >= n) continue;
      const newT = Math.max(top.t, grid[nr][nc]);
      const oldT = best[nr][nc];
      const accepted = newT < oldT;
      if (accepted) {
        best[nr][nc] = newT;
        parent[nr][nc] = [top.r, top.c];
        heap.push({ t: newT, r: nr, c: nc });
      }
      events.push({
        kind: "relax", r: top.r, c: top.c, nr, nc, t: top.t,
        newT, oldT, accepted, snapshot: snapshot(),
      });
    }
  }

  return {
    initial, events, best, parent, path, answer,
    gaugeX: 774,
    gaugeW: 446,
  };
}

function elevationColor(value, maxValue) {
  const t = maxValue > 0 ? value / maxValue : 0;
  const hue = 205 - 170 * t;
  const light = 22 + 24 * t;
  return "hsl(" + hue.toFixed(1) + ", 52%, " + light.toFixed(1) + "%)";
}
