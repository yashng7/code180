/* Search a 2D Matrix — animated walkthrough scene (3Blue1Brown style).
 *
 * The row-sorted matrix is flattened row by row into one sorted array. The
 * animation runs binary search over that flat index range: lo (blue), mid
 * (gold) and hi (purple) ticks slide along an index ruler, the mid cell glows,
 * and the half that cannot contain the target fades away. A green cell and
 * banner mark a hit; an empty range ends in a red False banner.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Search a 2D Matrix",
    subtitle: "row-major flatten · binary search · O(log(m·n))",
    inputs: [
      {
        id: "matrix",
        label: "matrix",
        type: "text",
        default: "1 3 5 7; 10 11 16 20; 23 30 34 60",
        width: "wide",
      },
      { id: "target", label: "target", type: "text", default: "3" },
    ],
    legend: [
      { color: "#58C4DD", text: "lo" },
      { color: "#F0AC5F", text: "mid" },
      { color: "#B58CD6", text: "hi" },
      { color: "#83C167", text: "found" },
    ],
  },

  code: [
    "def search_matrix(matrix: List[List[int]], target: int) -> bool:",
    '    """Binary search the matrix treated as one flat sorted array."""',
    "    if not matrix or not matrix[0]:",
    "        return False",
    "    rows, cols = len(matrix), len(matrix[0])",
    "    lo, hi = 0, rows * cols - 1",
    "    while lo <= hi:",
    "        mid = (lo + hi) // 2",
    "        value = matrix[mid // cols][mid % cols]",
    "        if value == target:",
    "            return True",
    "        if value < target:",
    "            lo = mid + 1",
    "        else:",
    "            hi = mid - 1",
    "    return False",
  ],

  read(values) {
    const raw = (values.matrix || "").trim();
    const targetRaw = (values.target || "").trim();
    if (!raw || !/^-?\d+$/.test(targetRaw)) return null;

    let matrix;
    try {
      if (raw.startsWith("[")) {
        matrix = JSON.parse(raw);
      } else {
        matrix = raw
          .split(/[;\n]+/)
          .map(row => row.trim())
          .filter(Boolean)
          .map(row => row.split(/[\s,]+/).filter(Boolean).map(Number));
      }
    } catch (err) {
      return null;
    }

    if (!Array.isArray(matrix) || matrix.length < 1 || matrix.length > 6) return null;
    if (!matrix.every(row => Array.isArray(row) && row.length >= 1 && row.length <= 6)) return null;
    const cols = matrix[0].length;
    if (!matrix.every(row => row.length === cols)) return null;
    if (!matrix.flat().every(Number.isInteger)) return null;

    return { matrix, target: Number(targetRaw) };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || !Array.isArray(args[0])) return null;
    const matrix = args[0].map(row => (Array.isArray(row) ? row.map(Number) : null));
    const target = Number(args[1]);
    if (!matrix.length || matrix.length > 6) return null;
    if (!matrix.every(row => row && row.length >= 1 && row.length <= 6)) return null;
    const cols = matrix[0].length;
    if (!matrix.every(row => row.length === cols)) return null;
    if (!matrix.flat().every(Number.isInteger) || !Number.isInteger(target)) return null;
    return {
      matrix: matrix.map(row => row.join(" ")).join("; "),
      target: String(target),
    };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, setScaleAt, STAGE_W } = ctx;
    const { matrix, target } = params;
    const rows = matrix.length;
    const cols = matrix[0].length;
    const flat = matrix.flat();
    const n = flat.length;
    const sim = simulate(flat, cols, target);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-purple", C.purple);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-red", C.red);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = {
      matrix, target, rows, cols, flat, n, sim, ctx,
      cells: [], strip: [], panelNodes: [], _writers: [],
      cellDim: new Array(n).fill(1),
      stripDim: new Array(n).fill(1),
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title + subtitle ------------------------------------------------
    scene.title = txt("Search a 2D Matrix", {
      x: 64, y: 64, "font-size": 42, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    scene.subtitle = txt(
      "target = " + target + "   ·   flatten row by row   ·   " + rows + "×" + cols + " = " + n + " values",
      { x: 64, y: 100, "font-size": 19, fill: C.grey },
      textL
    );
    setOpacity(scene.subtitle, 0);

    // ---- grid geometry ---------------------------------------------------
    const bandTop = 138;
    const bandH = 222;
    const cellW = clamp(660 / cols, 48, 128);
    const cellH = clamp(bandH / rows, 36, 72);
    const gridW = cols * cellW;
    const gridH = rows * cellH;
    const gridX = STAGE_W / 2 - gridW / 2 + 14;
    const gridTop = bandTop + (bandH - gridH) / 2;
    scene.cellW = cellW;
    scene.cellH = cellH;

    // row / column labels
    const labelsL = el("g", {}, textL);
    setOpacity(labelsL, 0);
    scene.gridLabels = labelsL;
    for (let r = 0; r < rows; r++) {
      txt("r" + r, {
        x: gridX - 14, y: gridTop + r * cellH + cellH / 2,
        "text-anchor": "end", "dominant-baseline": "central",
        "font-size": 13, fill: C.grey,
      }, labelsL);
    }
    for (let c = 0; c < cols; c++) {
      txt("c" + c, {
        x: gridX + c * cellW + cellW / 2, y: gridTop - 10,
        "text-anchor": "middle", "font-size": 13, fill: C.grey,
      }, labelsL);
    }

    // ---- matrix cells ----------------------------------------------------
    const valueFont = clamp(Math.min(cellW * 0.34, cellH * 0.48), 12, 30);
    const indexFont = clamp(cellW * 0.12, 9, 12);
    const showIndex = cellW >= 76 && cellH >= 52;

    flat.forEach((value, idx) => {
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      const x = gridX + c * cellW;
      const y = gridTop + r * cellH;
      const pos = el("g", { transform: "translate(" + x + " " + y + ")" }, chipsL);
      const fade = el("g", {}, pos);
      const dim = el("g", {}, fade);
      const scale = el("g", {}, dim);
      const inset = 2.5;
      const rx = Math.min(9, cellW * 0.12);
      el("rect", {
        x: inset, y: inset, width: cellW - 2 * inset, height: cellH - 2 * inset,
        rx, fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.8,
      }, scale);
      const mk = fill => txt(String(value), {
        x: cellW / 2, y: cellH / 2 + 2, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": valueFont, fill,
      }, scale);
      const valIdle = mk(C.white);
      const valGold = mk(C.gold);
      const valGreen = mk(C.green);
      setOpacity(valGold, 0);
      setOpacity(valGreen, 0);
      const ring = (color, glowId, width) => {
        const rect = el("rect", {
          x: inset, y: inset, width: cellW - 2 * inset, height: cellH - 2 * inset,
          rx, fill: "none", stroke: color, "stroke-width": width,
          filter: "url(#" + glowId + ")",
        }, scale);
        setOpacity(rect, 0);
        return rect;
      };
      const midBox = ring(C.gold, "glow-gold", 3);
      const foundBox = ring(C.green, "glow-green", 3.4);
      if (showIndex) {
        txt(String(idx), {
          x: 8, y: 14, "font-size": indexFont, fill: C.grey,
        }, scale);
      }
      setOpacity(fade, 0);
      scene.cells.push({
        idx, r, c, value, pos, fade, dim, scale,
        cx: cellW / 2, cy: cellH / 2,
        valIdle, valGold, valGreen, midBox, foundBox,
      });
    });

    // ---- flattened index ruler ------------------------------------------
    const stripTop = 402;
    const stripH = 30;
    const sGap = 3;
    const sW = clamp((900 - sGap * (n - 1)) / n, 16, 44);
    const stripW = n * sW + (n - 1) * sGap;
    const stripX = STAGE_W / 2 - stripW / 2;
    const stripFont = clamp(sW * 0.42, 9, 14);
    scene.stripTop = stripTop;
    scene.stripH = stripH;
    scene.sW = sW;
    scene.sGap = sGap;
    scene.stripX = stripX;

    for (let i = 0; i < n; i++) {
      const x = stripX + i * (sW + sGap);
      const g = el("g", { transform: "translate(" + x + " " + stripTop + ")" }, chipsL);
      const rect = el("rect", {
        x: 0, y: 0, width: sW, height: stripH, rx: 5,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.2,
      }, g);
      const label = txt(String(i), {
        x: sW / 2, y: stripH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": stripFont, fill: C.grey,
      }, g);
      setOpacity(g, 0);
      scene.strip.push({ g, rect, label, idx: i });
    }

    // ---- lo / mid / hi ticks --------------------------------------------
    const mkTick = (color, glowId) => {
      const g = el("g", {}, ptrL);
      el("path", {
        d: "M -5 -10 L 5 -10 L 0 0 Z",
        fill: color, filter: "url(#" + glowId + ")",
      }, g);
      setOpacity(g, 0);
      return g;
    };
    scene.tickLo = mkTick(C.blue, "glow-blue");
    scene.tickMid = mkTick(C.gold, "glow-gold");
    scene.tickHi = mkTick(C.purple, "glow-purple");

    // ---- marker read-out panel ------------------------------------------
    const panelY = 458;
    const panelH = 54;
    const boxW = 300;
    const boxGap = 18;
    const panelStart = STAGE_W / 2 - (3 * boxW + 2 * boxGap) / 2;
    const panelRoles = [
      { id: "lo", color: C.blue, label: "lo" },
      { id: "mid", color: C.gold, label: "mid" },
      { id: "hi", color: C.purple, label: "hi" },
    ];
    scene.panel = {};
    panelRoles.forEach((role, k) => {
      const x = panelStart + k * (boxW + boxGap);
      const g = el("g", {}, textL);
      el("rect", {
        x, y: panelY, width: boxW, height: panelH, rx: 10,
        fill: "#111722", stroke: role.color, "stroke-width": 1.6,
      }, g);
      txt(role.label, {
        x: x + 18, y: panelY + 20, "font-size": 14, fill: role.color,
      }, g);
      const value = txt("—", {
        x: x + 18, y: panelY + 43, "font-size": 21, fill: C.white,
      }, g);
      const coord = txt("", {
        x: x + 92, y: panelY + 43, "font-size": 14, fill: C.grey,
      }, g);
      setOpacity(g, 0);
      scene.panelNodes.push(g);
      scene.panel[role.id] = { g, value, coord };
    });

    // ---- status line -----------------------------------------------------
    scene.status = txt("", {
      x: STAGE_W / 2, y: 548, "text-anchor": "middle",
      "font-size": 21, fill: C.gold,
    }, textL);
    setOpacity(scene.status, 0);

    // ---- result banner ---------------------------------------------------
    const found = sim.found;
    scene.resultBox = el("rect", {
      x: STAGE_W / 2 - 300, y: 596, width: 600, height: 62, rx: 12,
      fill: found ? "#111a16" : "#1d1416",
      stroke: found ? C.green : C.red,
      "stroke-width": 2.4,
      filter: found ? "url(#glow-green)" : "url(#glow-red)",
    }, resultL);
    setOpacity(scene.resultBox, 0);
    scene.result = txt(found ? "return True" : "return False", {
      x: STAGE_W / 2, y: 627, "text-anchor": "middle",
      "dominant-baseline": "central", "font-size": 32,
      fill: found ? C.green : C.red,
    }, resultL);
    scene.complexity = txt("O(log(m·n)) time   ·   O(1) extra space", {
      x: STAGE_W / 2, y: 690, "text-anchor": "middle",
      "font-size": 18, fill: C.grey,
    }, resultL);

    // ---- baseline --------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.gridLabels, 0);
      for (const cell of scene.cells) {
        setOpacity(cell.fade, 0);
        setOpacity(cell.dim, 1);
        cell.fade.setAttribute("transform", "translate(0 0)");
        setScaleAt(cell.scale, cell.cx, cell.cy, 1);
        setOpacity(cell.valIdle, 1);
        setOpacity(cell.valGold, 0);
        setOpacity(cell.valGreen, 0);
        setOpacity(cell.midBox, 0);
        setOpacity(cell.foundBox, 0);
      }
      for (const s of scene.strip) {
        setOpacity(s.g, 0);
        s.rect.setAttribute("fill", C.chipFill);
        s.rect.setAttribute("stroke", C.greyDark);
        s.label.setAttribute("fill", C.grey);
      }
      setOpacity(scene.tickLo, 0);
      setOpacity(scene.tickMid, 0);
      setOpacity(scene.tickHi, 0);
      for (const g of scene.panelNodes) setOpacity(g, 0);
      scene.status.textContent = "";
      setOpacity(scene.status, 0);
      setOpacity(scene.resultBox, 0);

      const tickX = i => scene.stripX + i * (scene.sW + scene.sGap) + scene.sW / 2;
      setTranslate(scene.tickLo, tickX(0) - 6, stripTop - 2);
      setTranslate(scene.tickMid, tickX(0), stripTop - 2);
      setTranslate(scene.tickHi, tickX(n - 1) + 6, stripTop - 2);

      scene.panel.lo.value.textContent = "0";
      scene.panel.lo.coord.textContent = "→ (r0, c0)";
      scene.panel.mid.value.textContent = "—";
      scene.panel.mid.coord.textContent = "";
      scene.panel.hi.value.textContent = String(n - 1);
      scene.panel.hi.coord.textContent =
        "→ (r" + Math.floor((n - 1) / cols) + ", c" + ((n - 1) % cols) + ")";

      scene.cellDim = new Array(n).fill(1);
      scene.stripDim = new Array(n).fill(1);
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt, C } = ctx;
    const { sim, n, cols, rows, target } = scene;
    const tickY = scene.stripTop - 2;
    const cellX = i => scene.stripX + i * (scene.sW + scene.sGap) + scene.sW / 2;

    const statusNow = (text, fill) => {
      scene.status.textContent = text;
      scene.status.setAttribute("fill", fill);
    };
    const announce = (text, fill) => {
      tl.add(0.01, () => statusNow(text, fill));
    };
    const setPanel = (role, idx) => {
      const p = scene.panel[role];
      p.value.textContent = String(idx);
      if (idx < 0) p.coord.textContent = "← before start";
      else if (idx >= n) p.coord.textContent = "→ past end";
      else {
        p.coord.textContent = "→ (r" + Math.floor(idx / cols) + ", c" + (idx % cols) + ")";
      }
    };
    const styleRange = (lo, hi) => {
      tl.add(0.01, () => {
        for (let i = 0; i < n; i++) {
          const inside = i >= lo && i <= hi;
          const s = scene.strip[i];
          s.rect.setAttribute("fill", inside ? "#142636" : C.chipFill);
          s.rect.setAttribute("stroke", inside ? "#315a68" : C.greyDark);
          s.label.setAttribute("fill", inside ? C.white : C.grey);
        }
      });
    };
    const styleMid = mid => {
      tl.add(0.01, () => {
        const s = scene.strip[mid];
        s.rect.setAttribute("fill", "#2a2214");
        s.rect.setAttribute("stroke", C.gold);
        s.label.setAttribute("fill", C.gold);
      });
    };
    const dimRange = (newLo, newHi) => {
      const prevCell = scene.cellDim.slice();
      const prevStrip = scene.stripDim.slice();
      const nextCell = scene.cellDim.map((v, i) => (i >= newLo && i <= newHi ? 1 : 0.18));
      const nextStrip = scene.stripDim.map((v, i) => (i >= newLo && i <= newHi ? 1 : 0.18));
      scene.cellDim = nextCell;
      scene.stripDim = nextStrip;
      tl.add(0.5, u => {
        for (let i = 0; i < n; i++) {
          setOpacity(scene.cells[i].dim, prevCell[i] + (nextCell[i] - prevCell[i]) * u);
          setOpacity(scene.strip[i].g, prevStrip[i] + (nextStrip[i] - prevStrip[i]) * u);
        }
      }, ease.outCubic);
    };

    scene.reset();

    // ---- intro -----------------------------------------------------------
    tl.line(1);
    tl.add(0.7, scene.writer(scene.title), ease.outCubic);
    tl.add(0.4, u => setOpacity(scene.subtitle, u), ease.outCubic);

    tl.line(5);
    tl.add(0.45, u => setOpacity(scene.gridLabels, u), ease.outCubic);
    for (const cell of scene.cells) {
      tl.add(0.24, u => {
        setOpacity(cell.fade, u);
        cell.fade.setAttribute("transform", "translate(0 " + (1 - u) * 14 + ")");
      }, ease.outCubic);
      tl.wait(0.02);
    }

    tl.line(6);
    tl.add(0.5, u => {
      for (const s of scene.strip) setOpacity(s.g, u);
      for (const g of scene.panelNodes) setOpacity(g, u);
      setOpacity(scene.tickLo, u);
      setOpacity(scene.tickHi, u);
    }, ease.outCubic);
    announce(
      "flatten row by row  ·  flat[i] = matrix[i // " + cols + "][i % " + cols + "]",
      C.grey
    );
    tl.add(0.3, u => setOpacity(scene.status, u), ease.outCubic);
    tl.log("flatten the " + rows + "×" + cols + " matrix into " + n + " sorted values", C.gold);

    // ---- binary search ---------------------------------------------------
    sim.steps.forEach((step, si) => {
      const cell = scene.cells[step.mid];
      const prev = si > 0 ? sim.steps[si - 1] : null;

      tl.line(7);
      styleRange(step.lo, step.hi);
      announce("while " + step.lo + " <= " + step.hi + "  ✓", C.gold);
      tl.wait(0.12);

      tl.line(8);
      if (si === 0) {
        tl.add(0.4, u => {
          setOpacity(scene.tickMid, u);
          setTranslate(scene.tickMid, cellX(step.mid), tickY);
        }, ease.outCubic);
      } else {
        const from = cellX(prev.mid);
        const to = cellX(step.mid);
        tl.add(0.45, u => setTranslate(scene.tickMid, from + (to - from) * u, tickY), ease.inOutSine);
      }
      tl.add(0.01, () => setPanel("mid", step.mid));
      announce("mid = (" + step.lo + " + " + step.hi + ") // 2 = " + step.mid, C.gold);
      styleMid(step.mid);
      tl.add(0.35, u => {
        setOpacity(cell.valIdle, 1 - u);
        setOpacity(cell.valGold, u);
        setOpacity(cell.midBox, u);
      }, ease.outCubic);
      tl.add(0.4, u => setScaleAt(cell.scale, cell.cx, cell.cy, 1 + 0.05 * Math.sin(Math.PI * u)), ease.linear);

      tl.line(9);
      announce(
        "value = matrix[" + step.mid + " // " + cols + "][" + step.mid + " % " + cols + "] = matrix[" +
        step.r + "][" + step.c + "] = " + step.value,
        C.white
      );
      tl.add(0.35, u => setScaleAt(cell.scale, cell.cx, cell.cy, 1 + 0.035 * Math.sin(Math.PI * u)), ease.linear);

      tl.line(10);
      if (step.kind === "found") {
        announce(step.value + " == " + target + "  ✓", C.green);
        tl.add(0.3, u => {
          setOpacity(cell.midBox, 1 - u);
          setOpacity(cell.foundBox, u);
          setOpacity(cell.valGold, 1 - u);
          setOpacity(cell.valGreen, u);
        }, ease.outCubic);
        tl.add(0.45, u => setScaleAt(cell.scale, cell.cx, cell.cy, 1 + 0.08 * Math.sin(Math.PI * u)), ease.linear);
        tl.log(
          "mid " + step.mid + ": " + step.value + " == " + target +
          "  →  found at (" + step.r + ", " + step.c + ")",
          C.green
        );

        tl.line(11);
        announce("return True", C.green);
        tl.add(0.35, u => setOpacity(scene.resultBox, u), ease.outCubic);
        tl.add(0.6, scene.writer(scene.result), ease.linear);
        tl.add(0.5, scene.writer(scene.complexity), ease.linear);
        tl.wait(1.2);
        return;
      }

      announce(step.value + " == " + target + "  ✗", C.grey);
      tl.line(12);
      if (step.kind === "right") {
        const newLo = step.mid + 1;
        announce(step.value + " < " + target + "  →  search the right half", C.blue);
        tl.line(13);
        if (newLo < n) {
          const from = cellX(step.lo);
          const to = cellX(newLo);
          tl.add(0.45, u => setTranslate(scene.tickLo, from + (to - from) * u - 6, tickY), ease.inOutSine);
        } else {
          tl.add(0.35, u => setOpacity(scene.tickLo, 1 - u), ease.outCubic);
        }
        tl.add(0.01, () => setPanel("lo", newLo));
        dimRange(newLo, step.hi);
        tl.add(0.3, u => {
          setOpacity(cell.valGold, 1 - u);
          setOpacity(cell.midBox, 1 - u);
          setOpacity(cell.valIdle, u);
        }, ease.outCubic);
        tl.log("mid " + step.mid + ": " + step.value + " < " + target + "  →  lo = " + newLo, C.blue);
      } else {
        const newHi = step.mid - 1;
        announce(step.value + " > " + target + "  →  search the left half", C.purple);
        tl.line([14, 15]);
        if (newHi >= 0) {
          const from = cellX(step.hi);
          const to = cellX(newHi);
          tl.add(0.45, u => setTranslate(scene.tickHi, from + (to - from) * u + 6, tickY), ease.inOutSine);
        } else {
          tl.add(0.35, u => setOpacity(scene.tickHi, 1 - u), ease.outCubic);
        }
        tl.add(0.01, () => setPanel("hi", newHi));
        dimRange(step.lo, newHi);
        tl.add(0.3, u => {
          setOpacity(cell.valGold, 1 - u);
          setOpacity(cell.midBox, 1 - u);
          setOpacity(cell.valIdle, u);
        }, ease.outCubic);
        tl.log("mid " + step.mid + ": " + step.value + " > " + target + "  →  hi = " + newHi, C.purple);
      }
      tl.wait(0.25);
    });

    // ---- target absent ---------------------------------------------------
    if (!sim.found) {
      tl.line(7);
      styleRange(sim.lo, sim.hi);
      announce("while " + sim.lo + " <= " + sim.hi + "  ✗  →  range is empty", C.red);
      tl.wait(0.25);
      tl.line(16);
      announce("return False", C.red);
      tl.log("target " + target + " is not in the matrix", C.red);
      tl.add(0.35, u => setOpacity(scene.resultBox, u), ease.outCubic);
      tl.add(0.6, scene.writer(scene.result), ease.linear);
      tl.add(0.5, scene.writer(scene.complexity), ease.linear);
      tl.wait(1.2);
    }
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model: one frame per binary-search iteration.
 * ------------------------------------------------------------------ */
function simulate(flat, cols, target) {
  const n = flat.length;
  const steps = [];
  let lo = 0;
  let hi = n - 1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const value = flat[mid];
    const r = Math.floor(mid / cols);
    const c = mid % cols;

    if (value === target) {
      steps.push({ lo, hi, mid, value, r, c, kind: "found" });
      return { steps, found: true, lo, hi };
    }
    if (value < target) {
      steps.push({ lo, hi, mid, value, r, c, kind: "right" });
      lo = mid + 1;
    } else {
      steps.push({ lo, hi, mid, value, r, c, kind: "left" });
      hi = mid - 1;
    }
  }

  return { steps, found: false, lo, hi };
}
