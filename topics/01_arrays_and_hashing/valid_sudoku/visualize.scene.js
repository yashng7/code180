/* Valid Sudoku — animated walkthrough scene (3Blue1Brown style).
 *
 * Draw the 9x9 board (with its 3x3 box rules), glide a scan cursor cell by
 * cell, and for every filled cell flash its row, column and 3x3 box while
 * dropping a key chip ("r0:5", "c0:5", "b0:5") into three growing hash sets.
 * A collision glows the offending cell together with the earlier same digit
 * and returns False; a clean scan returns True.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

/* Layout constants (shared by buildScene and the baseline reset). */
const S = 40;                          // one board cell, in px
const GRID_X = 60;
const GRID_Y = 180;
const GRID_PX = 9 * S;
const PANEL_TOP = 200;
const PANEL_GAP = 20;
const PANEL_X0 = 470;
const PANEL_W = 246;
const CHIP_W = 44;
const CHIP_H = 20;
const CHIP_GX = 4;
const CHIP_GY = 5;
const CHIPS_PER_ROW = 5;

const SCENE = {
  meta: {
    title: "Valid Sudoku",
    subtitle: "one pass · three hash sets · O(81)",
    inputs: [
      {
        id: "board",
        label: "board (9 rows joined by /)",
        type: "text",
        default:
          "53..7..../6..195.../.98....6./8...6...3/" +
          "4..8.3..1/7...2...6/.6....28./...419..5/....8..79",
        width: "wide",
      },
    ],
    legend: [
      { color: "#58C4DD", text: "row / cursor" },
      { color: "#5CD0B3", text: "column" },
      { color: "#F0AC5F", text: "3×3 box" },
      { color: "#FC6255", text: "duplicate" },
    ],
  },

  code: [
    "def is_valid_sudoku(board: List[List[str]]) -> bool:",
    "    rows = [set() for _ in range(9)]",
    "    cols = [set() for _ in range(9)]",
    "    boxes = [set() for _ in range(9)]",
    "    for r in range(9):",
    "        for c in range(9):",
    "            value = board[r][c]",
    "            if value == \".\":",
    "                continue",
    "            box = (r // 3) * 3 + (c // 3)",
    "            if value in rows[r] or value in cols[c] or value in boxes[box]:",
    "                return False",
    "            rows[r].add(value)",
    "            cols[c].add(value)",
    "            boxes[box].add(value)",
    "    return True",
  ],

  read(values) {
    const raw = (values.board || "").trim();
    if (!raw) return null;
    const rows = raw
      .split(/[\/\n]+/)
      .map(line => line.replace(/\s+/g, ""))
      .filter(line => line.length > 0);
    if (rows.length !== 9) return null;
    if (!rows.every(row => /^[0-9.]{9}$/.test(row))) return null;
    return { grid: rows.map(row => row.split("")) };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const g = args[0];
      const ok =
        g.length === 9 &&
        g.every(
          row =>
            Array.isArray(row) &&
            row.length === 9 &&
            row.every(v => typeof v === "string" && v.length === 1)
        );
      if (ok) return { board: g.map(row => row.join("")).join("/") };
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, setScaleAt, STAGE_W } = ctx;
    const grid = params.grid;
    const sim = simulate(grid);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-teal", C.teal);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-red", C.red);

    const writable = ctx.makeWritable();
    const chipsL = ctx.layer("chips");
    const textL = ctx.layer("text");
    const resultL = ctx.layer("result");

    const scene = {
      grid, sim, ctx,
      cells: [],
      rowHL: [], colHL: [], boxHL: [],
      chips: { rows: [], cols: [], boxes: [] },
      panelCounts: {},
      _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // --- title + subtitle ------------------------------------------------
    scene.title = txt("Valid Sudoku", {
      x: 64, y: 78, "font-size": 44, fill: C.white, "letter-spacing": 1,
    }, textL);
    const sub = el("text", { x: 64, y: 112, "font-size": 22, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "scan every cell · ";
    el("tspan", { fill: C.blue }, sub).textContent = "rows";
    el("tspan", {}, sub).textContent = " · ";
    el("tspan", { fill: C.teal }, sub).textContent = "cols";
    el("tspan", {}, sub).textContent = " · ";
    el("tspan", { fill: C.gold }, sub).textContent = "boxes";
    scene.subtitle = sub;

    // --- board cells + 3x3 box rules ------------------------------------
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const x = GRID_X + c * S, y = GRID_Y + r * S;
        el("rect", {
          x, y, width: S, height: S, fill: C.chipFill,
          stroke: C.greyDark, "stroke-width": 1,
        }, chipsL);
        const value = grid[r][c];
        const baseFill = value === "." ? "#2a3342" : C.white;
        const node = txt(value === "." ? "" : value, {
          x: x + S / 2, y: y + S / 2 + 1, "text-anchor": "middle",
          "dominant-baseline": "central", "font-size": 21, fill: baseFill,
        }, chipsL);
        scene.cells.push({ r, c, node, baseFill });
      }
    }
    for (let i = 1; i <= 2; i++) {
      el("line", {
        x1: GRID_X + i * 3 * S, y1: GRID_Y, x2: GRID_X + i * 3 * S, y2: GRID_Y + GRID_PX,
        stroke: C.grey, "stroke-width": 2.5,
      }, chipsL);
      el("line", {
        x1: GRID_X, y1: GRID_Y + i * 3 * S, x2: GRID_X + GRID_PX, y2: GRID_Y + i * 3 * S,
        stroke: C.grey, "stroke-width": 2.5,
      }, chipsL);
    }

    // --- dim row / column / box highlighters ----------------------------
    for (let r = 0; r < 9; r++) {
      scene.rowHL.push(el("rect", {
        x: GRID_X, y: GRID_Y + r * S, width: GRID_PX, height: S, fill: C.blue,
      }, chipsL));
    }
    for (let c = 0; c < 9; c++) {
      scene.colHL.push(el("rect", {
        x: GRID_X + c * S, y: GRID_Y, width: S, height: GRID_PX, fill: C.teal,
      }, chipsL));
    }
    for (let b = 0; b < 9; b++) {
      scene.boxHL.push(el("rect", {
        x: GRID_X + (b % 3) * 3 * S, y: GRID_Y + Math.floor(b / 3) * 3 * S,
        width: 3 * S, height: 3 * S, fill: C.gold,
      }, chipsL));
    }
    for (const node of scene.rowHL) setOpacity(node, 0);
    for (const node of scene.colHL) setOpacity(node, 0);
    for (const node of scene.boxHL) setOpacity(node, 0);

    // --- scan cursor (outline that glides cell to cell) -----------------
    // Two nested groups: the outer translates (position), the inner scales
    // (pulse) so the two transforms never clobber each other.
    scene.cursor = el("g", {}, chipsL);
    scene.cursorScale = el("g", {}, scene.cursor);
    el("rect", {
      x: 0, y: 0, width: S, height: S, rx: 7, fill: "none",
      stroke: C.blue, "stroke-width": 3, filter: "url(#glow-blue)",
    }, scene.cursorScale);
    setOpacity(scene.cursor, 0);
    setTranslate(scene.cursor, GRID_X, GRID_Y);
    setScaleAt(scene.cursorScale, S / 2, S / 2, 1);

    // --- three growing key sets -----------------------------------------
    const panels = [
      { key: "rows", title: "rows", color: C.blue, glow: "blue", x: PANEL_X0 },
      { key: "cols", title: "cols", color: C.teal, glow: "teal", x: PANEL_X0 + PANEL_W + PANEL_GAP },
      { key: "boxes", title: "boxes", color: C.gold, glow: "gold", x: PANEL_X0 + 2 * (PANEL_W + PANEL_GAP) },
    ];
    const counters = { rows: 0, cols: 0, boxes: 0 };

    for (const panel of panels) {
      txt(panel.title, {
        x: panel.x, y: PANEL_TOP, "font-size": 20, fill: panel.color, "font-weight": "bold",
      }, textL);
      const count = txt("0", {
        x: panel.x + panel.title.length * 12 + 16, y: PANEL_TOP,
        "font-size": 17, fill: C.grey,
      }, textL);
      scene.panelCounts[panel.key] = count;
      el("line", {
        x1: panel.x, y1: PANEL_TOP + 10, x2: panel.x + PANEL_W - 10, y2: PANEL_TOP + 10,
        stroke: C.greyDark, "stroke-width": 1.5,
      }, chipsL);
    }

    for (const step of sim.steps) {
      if (!step.add) continue;
      const keys = {
        rows: "r" + step.r + ":" + step.v,
        cols: "c" + step.c + ":" + step.v,
        boxes: "b" + step.box + ":" + step.v,
      };
      step.chips = {};
      for (const panel of panels) {
        const slot = counters[panel.key]++;
        const col = slot % CHIPS_PER_ROW;
        const row = Math.floor(slot / CHIPS_PER_ROW);
        const px = panel.x + col * (CHIP_W + CHIP_GX);
        const py = PANEL_TOP + 26 + row * (CHIP_H + CHIP_GY);
        const pos = el("g", { transform: "translate(" + px + " " + py + ")" }, chipsL);
        const enter = el("g", {}, pos);
        const scale = el("g", {}, enter);
        const cx = CHIP_W / 2, cy = CHIP_H / 2;
        el("rect", {
          x: 0, y: 0, width: CHIP_W, height: CHIP_H, rx: 6,
          fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.5,
        }, scale);
        txt(keys[panel.key], {
          x: cx, y: cy + 1, "text-anchor": "middle", "dominant-baseline": "central",
          "font-size": 12, fill: panel.color,
        }, scale);
        const flash = el("rect", {
          x: 0, y: 0, width: CHIP_W, height: CHIP_H, rx: 6, fill: "none",
          stroke: panel.color, "stroke-width": 2, filter: "url(#glow-" + panel.glow + ")",
        }, scale);
        setOpacity(flash, 0);
        setOpacity(enter, 0);
        const chip = { panel: panel.key, step, pos, enter, scale, flash, cx, cy, px, py };
        scene.chips[panel.key].push(chip);
        step.chips[panel.key] = chip;
      }
    }

    // --- status + result -------------------------------------------------
    scene.status = txt("", {
      x: GRID_X + GRID_PX / 2, y: GRID_Y + GRID_PX + 26, "text-anchor": "middle",
      "font-size": 18, fill: C.grey,
    }, textL);
    setOpacity(scene.status, 0);

    scene.result = txt(sim.result ? "return True" : "return False", {
      x: GRID_X + GRID_PX / 2, y: GRID_Y + GRID_PX + 68, "text-anchor": "middle",
      "font-size": 36, fill: sim.result ? C.green : C.red,
    }, resultL);
    setOpacity(scene.result, 0);

    scene.statusTexts = sim.steps.map(step => {
      if (step.empty) return "(" + step.r + "," + step.c + ") is empty — skip";
      if (step.clash) return step.v + " repeats in " + step.kind + " → invalid";
      return "(" + step.r + "," + step.c + ") = " + step.v + " · add to row " +
        step.r + ", col " + step.c + ", box " + step.box;
    });

    // --- baseline: the timeline replays from here on every render --------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.cursor, 0);
      setTranslate(scene.cursor, GRID_X, GRID_Y);
      setScaleAt(scene.cursorScale, S / 2, S / 2, 1);
      for (const node of scene.rowHL) setOpacity(node, 0);
      for (const node of scene.colHL) setOpacity(node, 0);
      for (const node of scene.boxHL) setOpacity(node, 0);
      for (const cell of scene.cells) {
        cell.node.setAttribute("fill", cell.baseFill);
        cell.node.setAttribute("filter", "none");
      }
      for (const key in scene.chips) {
        for (const chip of scene.chips[key]) {
          setOpacity(chip.enter, 0);
          setScaleAt(chip.scale, chip.cx, chip.cy, 1);
          setOpacity(chip.flash, 0);
        }
        scene.panelCounts[key].textContent = "0";
      }
      setOpacity(scene.status, 0);
      setOpacity(scene.result, 0);
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt } = ctx;
    const { sim, cells, ctx: c } = scene;
    const cellAt = (r, col) => cells[r * 9 + col];

    const flash = (nodes, peak) =>
      tl.add(0.08, u => {
        for (const node of nodes) setOpacity(node, peak * Math.sin(Math.PI * u));
      }, ease.linear);

    // --- intro ----------------------------------------------------------
    tl.line(1);
    tl.add(0.6, scene.writer(scene.title), ease.outCubic);
    tl.add(0.4, u => setOpacity(scene.subtitle, u), ease.outCubic);
    tl.line([2, 3, 4]);
    tl.wait(0.15);

    // --- walk every cell ------------------------------------------------
    let prevX = GRID_X, prevY = GRID_Y;
    sim.steps.forEach((step, si) => {
      const x = GRID_X + step.c * S;
      const y = GRID_Y + step.r * S;
      const filled = !step.empty;
      const fromX = prevX, fromY = prevY;

      if (step.c === 0) tl.line(5);
      tl.line(6);
      // glide the cursor onto this cell
      if (si === 0) {
        tl.add(0.2, u => {
          setOpacity(scene.cursor, u);
          setTranslate(scene.cursor, fromX + (x - fromX) * u, fromY + (y - fromY) * u);
        }, ease.outCubic);
      } else {
        tl.add(0.05 + (filled ? 0.02 : 0), u =>
          setTranslate(scene.cursor, fromX + (x - fromX) * u, fromY + (y - fromY) * u),
          ease.inOutSine);
      }
      prevX = x; prevY = y;

      tl.line(7);
      // status caption
      const message = scene.statusTexts[si];
      tl.add(0.02, () => {
        scene.status.textContent = message;
        scene.status.setAttribute("fill", step.clash ? c.C.red : c.C.grey);
        setOpacity(scene.status, 1);
      }, ease.linear);
      // Keep every cell's caption in the transcript. Only the clash gets a
      // reading pause; 81 pauses would make the grid scan drag.
      tl.log(message, step.clash ? c.C.red : (step.empty ? c.C.grey : c.C.white), { hold: !!step.clash });

      if (step.empty) {
        tl.line([8, 9]);
        tl.add(0.05, u => setScaleAt(scene.cursorScale, S / 2, S / 2, 1 + 0.04 * Math.sin(Math.PI * u)), ease.linear);
        return;
      }

      // flash the row, column and 3x3 box this cell belongs to
      tl.line(10);
      tl.line(11);
      flash([scene.rowHL[step.r]], 0.18);
      flash([scene.colHL[step.c]], 0.18);
      flash([scene.boxHL[step.box]], 0.18);

      if (step.clash) {
        const dupe = cellAt(step.dupe[0], step.dupe[1]);
        const bad = cellAt(step.r, step.c);
        tl.line(12);
        tl.add(0.35, u => {
          dupe.node.setAttribute("fill", c.C.red);
          dupe.node.setAttribute("filter", "url(#glow-red)");
          bad.node.setAttribute("fill", c.C.red);
          bad.node.setAttribute("filter", "url(#glow-red)");
          setOpacity(scene.cursor, 1);
        }, ease.outCubic);
        tl.add(0.4, u => setScaleAt(scene.cursorScale, S / 2, S / 2, 1 + 0.08 * Math.sin(Math.PI * u)), ease.linear);
        tl.add(0.5, scene.writer(scene.result), ease.linear);
        tl.wait(1.2);
        return;
      }

      // pop the three new key chips and flash their borders
      tl.line([13, 14, 15]);
      const chips = [step.chips.rows, step.chips.cols, step.chips.boxes];
      tl.add(0.3, u => {
        for (const chip of chips) {
          setOpacity(chip.enter, Math.min(1, u * 1.6));
          setScaleAt(chip.scale, chip.cx, chip.cy, u);
        }
      }, ease.outBack);
      tl.add(0.2, u => {
        for (const chip of chips) setOpacity(chip.flash, Math.sin(Math.PI * u));
      }, ease.linear);
      tl.add(0.02, () => {
        const done = sim.steps.slice(0, si + 1).filter(s => s.add).length;
        scene.panelCounts.rows.textContent = String(done);
        scene.panelCounts.cols.textContent = String(done);
        scene.panelCounts.boxes.textContent = String(done);
      }, ease.linear);
    });

    // --- finale ---------------------------------------------------------
    tl.line(16);
    if (sim.result) {
      tl.add(0.3, u => setOpacity(scene.cursor, 1 - u), ease.outCubic);
      for (const node of scene.rowHL) flash([node], 0.12);
      tl.add(0.6, scene.writer(scene.result), ease.linear);
      tl.wait(1.2);
    } else {
      tl.add(0.2, u => setOpacity(scene.cursor, 1 - 0.4 * u), ease.outCubic);
    }

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model: the frames the animation narrates.
 * ------------------------------------------------------------------ */

function simulate(grid) {
  const rows = Array.from({ length: 9 }, () => new Map());
  const cols = Array.from({ length: 9 }, () => new Map());
  const boxes = Array.from({ length: 9 }, () => new Map());
  const steps = [];

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = grid[r][c];
      const box = Math.floor(r / 3) * 3 + Math.floor(c / 3);
      if (v === ".") {
        steps.push({ r, c, v, box, empty: true });
        continue;
      }
      let dupe = null, kind = null;
      if (rows[r].has(v)) { dupe = rows[r].get(v); kind = "row " + r; }
      else if (cols[c].has(v)) { dupe = cols[c].get(v); kind = "column " + c; }
      else if (boxes[box].has(v)) { dupe = boxes[box].get(v); kind = "box " + box; }

      if (dupe) {
        steps.push({ r, c, v, box, clash: true, dupe, kind });
        return { steps, result: false };
      }
      rows[r].set(v, [r, c]);
      cols[c].set(v, [r, c]);
      boxes[box].set(v, [r, c]);
      steps.push({ r, c, v, box, add: true });
    }
  }
  return { steps, result: true };
}
