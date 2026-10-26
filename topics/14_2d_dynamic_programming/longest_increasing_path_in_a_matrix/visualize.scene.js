/* Longest Increasing Path in a Matrix — process cells from small to large.
 *
 * Values only increase along a path, so sorting the cells topologically orders
 * all possible predecessors.  Every cell starts at dp = 1; a smaller neighbour
 * pushes dp + 1 into each larger neighbour.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Longest Increasing Path in a Matrix",
    subtitle: "process values small → large · push dp + 1 into larger neighbours",
    inputs: [
      { id: "matrix", label: "matrix (rows with ;)", type: "text", default: "9 9 4; 6 6 8; 2 1 1", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "larger neighbour" },
      { color: "#F0AC5F", text: "current cell" },
      { color: "#5CD0B3", text: "updated dp" },
      { color: "#83C167", text: "best path" },
    ],
  },

  code: [
    "def longest_increasing_path(matrix: List[List[int]]) -> int:",
    "    \"\"\"Return the longest strictly increasing path length in ``matrix``.\"\"\"",
    "    if not matrix or not matrix[0]:",
    "        return 0",
    "    rows, cols = len(matrix), len(matrix[0])",
    "    dp = [[1] * cols for _ in range(rows)]",
    "    cells = sorted(",
    "        (matrix[r][c], r, c) for r in range(rows) for c in range(cols)",
    "    )",
    "    best = 1",
    "    for value, r, c in cells:",
    "        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):",
    "            nr, nc = r + dr, c + dc",
    "            if 0 <= nr < rows and 0 <= nc < cols and matrix[nr][nc] > value:",
    "                if dp[r][c] + 1 > dp[nr][nc]:",
    "                    dp[nr][nc] = dp[r][c] + 1",
    "        best = max(best, dp[r][c])",
    "    return best",
  ],

  read(values) {
    const raw = String(values.matrix || "").trim();
    if (!raw) return null;
    let matrix;
    try {
      if (raw.startsWith("[")) matrix = JSON.parse(raw);
      else matrix = raw.split(/[;\n]+/).map(row => row.trim()).filter(Boolean)
        .map(row => row.split(/[\s,]+/).filter(Boolean).map(Number));
    } catch (err) { return null; }
    if (!Array.isArray(matrix) || matrix.length < 1 || matrix.length > 4) return null;
    if (!matrix.every(row => Array.isArray(row) && row.length >= 1 && row.length <= 4)) return null;
    const cols = matrix[0].length;
    if (!matrix.every(row => row.length === cols)) return null;
    if (!matrix.flat().every(v => Number.isInteger(v) && v >= 0 && v <= 99)) return null;
    return { matrix };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || args.length !== 1 || !Array.isArray(args[0])) return null;
    const matrix = args[0].map(row => Array.isArray(row) ? row.map(Number) : null);
    if (matrix.length < 1 || matrix.length > 4) return null;
    if (!matrix.every(row => row && row.length >= 1 && row.length <= 4)) return null;
    const cols = matrix[0].length;
    if (!matrix.every(row => row.length === cols)) return null;
    if (!matrix.flat().every(v => Number.isInteger(v) && v >= 0 && v <= 99)) return null;
    return { matrix: matrix.map(row => row.join(" ")).join("; ") };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, STAGE_W } = ctx;
    const matrix = params.matrix;
    const rows = matrix.length, cols = matrix[0].length;
    const sim = simulateLip(matrix);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-teal", C.teal);
    ctx.glow("glow-green", C.green);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const resultL = ctx.layer("result");

    const scene = { matrix, rows, cols, sim, ctx, cells: [], orderChips: [], _writers: [] };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    scene.title = txt("Longest Increasing Path", {
      x: 64, y: 64, "font-size": 40, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    scene.subtitle = txt("strictly larger orthogonal steps · " + rows + "×" + cols +
      " matrix · process values in increasing order", {
      x: 64, y: 101, "font-size": 18, fill: C.grey,
    }, textL);
    setOpacity(scene.subtitle, 0);

    // ---- matrix panel --------------------------------------------------
    const pX = 40, pY = 132, pW = 712, pH = 470;
    scene.panel = el("g", {}, chipsL);
    el("rect", {
      x: pX, y: pY, width: pW, height: pH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.panel);
    setOpacity(scene.panel, 0);
    scene.panelTitle = txt("matrix values · green badge = dp path length", {
      x: pX + 20, y: pY + 28, "font-size": 16, fill: C.blue,
    }, textL);
    setOpacity(scene.panelTitle, 0);

    const cellW = clamp(520 / cols, 62, 120);
    const cellH = clamp(330 / rows, 52, 100);
    const gridW = cols * cellW, gridH = rows * cellH;
    const gridX = pX + (pW - gridW) / 2;
    const gridTop = pY + 62 + (pH - 92 - gridH) / 2;
    scene.grid = { cellW, cellH, gridX, gridTop };

    scene.labels = el("g", {}, textL);
    setOpacity(scene.labels, 0);
    for (let c = 0; c < cols; c++) {
      txt(String(c), {
        x: gridX + c * cellW + cellW / 2, y: gridTop - 10,
        "text-anchor": "middle", "font-size": 11, fill: C.grey,
      }, scene.labels);
    }
    for (let r = 0; r < rows; r++) {
      txt(String(r), {
        x: gridX - 14, y: gridTop + r * cellH + cellH / 2,
        "text-anchor": "end", "dominant-baseline": "central",
        "font-size": 11, fill: C.grey,
      }, scene.labels);
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = gridX + c * cellW, y = gridTop + r * cellH;
        const g = el("g", {}, chipsL);
        const rect = el("rect", {
          x: x + 2, y: y + 2, width: cellW - 4, height: cellH - 4, rx: 9,
          fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.8,
        }, g);
        const value = txt(String(matrix[r][c]), {
          x: x + cellW / 2, y: y + cellH * 0.42,
          "text-anchor": "middle", "dominant-baseline": "central",
          "font-size": clamp(Math.min(cellW, cellH) * 0.34, 20, 34), fill: C.white,
        }, g);
        const dpText = txt("dp = 1", {
          x: x + cellW / 2, y: y + cellH * 0.72,
          "text-anchor": "middle", "dominant-baseline": "central",
          "font-size": 11, fill: C.teal,
        }, g);
        setOpacity(g, 0);
        scene.cells.push({ r, c, x, y, g, rect, value, dpText });
      }
    }

    // ---- right panel ---------------------------------------------------
    const rX = 776, rY = 132, rW = 440, rH = 470;
    scene.side = el("g", {}, chipsL);
    el("rect", {
      x: rX, y: rY, width: rW, height: rH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.side);
    setOpacity(scene.side, 0);
    scene.sideTitle = txt("processing order · value ↑", {
      x: rX + 20, y: rY + 28, "font-size": 16, fill: C.gold,
    }, textL);
    setOpacity(scene.sideTitle, 0);

    const chipW = 92, chipH = 28;
    for (let i = 0; i < sim.order.length; i++) {
      const order = sim.order[i];
      const col = i % 4, row = Math.floor(i / 4);
      const x = rX + 20 + col * (chipW + 8), y = rY + 50 + row * (chipH + 8);
      const g = el("g", {}, chipsL);
      const rect = el("rect", {
        x, y, width: chipW, height: chipH, rx: 6,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.5,
      }, g);
      const label = txt(matrix[order.r][order.c] + " (" + order.r + "," + order.c + ")", {
        x: x + chipW / 2, y: y + chipH / 2 + 1,
        "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": 10, fill: C.grey,
      }, g);
      setOpacity(g, 0);
      scene.orderChips.push({ g, rect, label, order, i });
    }

    scene.currentLabel = txt("waiting to process", {
      x: rX + 20, y: rY + 226, "font-size": 13, fill: C.grey,
    }, textL);
    scene.currentText = txt("—", {
      x: rX + 20, y: rY + 260, "font-size": 24, fill: C.gold,
    }, textL);
    scene.updateText = txt("", {
      x: rX + 20, y: rY + 292, "font-size": 12, fill: C.teal,
    }, textL);
    scene.recurrence = txt("dp[neighbour] = max(dp[neighbour], dp[cell] + 1)", {
      x: rX + 20, y: rY + 330, "font-size": 12, fill: C.white,
    }, textL);
    scene.bestLabel = txt("best path length", {
      x: rX + 20, y: rY + 372, "font-size": 12, fill: C.grey,
    }, textL);
    scene.bestText = txt("1", {
      x: rX + 20, y: rY + 414, "font-size": 42, fill: C.green,
    }, textL);
    for (const node of [scene.currentLabel, scene.currentText, scene.updateText,
                        scene.recurrence, scene.bestLabel, scene.bestText]) {
      setOpacity(node, 0);
    }

    scene.status = txt("", { x: 64, y: 624, "font-size": 19, fill: C.gold }, textL);
    scene.detail = txt("", { x: 64, y: 650, "font-size": 14, fill: C.grey }, textL);
    scene.resultBox = el("rect", {
      x: 340, y: 666, width: 600, height: 42, rx: 10,
      fill: "#111a16", stroke: C.green, "stroke-width": 2.2,
      filter: "url(#glow-green)",
    }, resultL);
    scene.result = txt("", {
      x: STAGE_W / 2, y: 688, "text-anchor": "middle",
      "dominant-baseline": "central", "font-size": 25, fill: C.green,
    }, resultL);
    scene.note = txt("", {
      x: STAGE_W / 2, y: 715, "text-anchor": "middle", "font-size": 11, fill: C.grey,
    }, resultL);
    for (const node of [scene.resultBox, scene.result, scene.note]) setOpacity(node, 0);
    for (const node of [scene.status, scene.detail]) setOpacity(node, 0);

    // ---- state ---------------------------------------------------------
    scene.showStep = (stepIndex, u) => {
      const step = stepIndex >= 0 ? sim.steps[stepIndex] : null;
      const targetKeys = new Set();
      if (step) {
        for (const up of step.updates) targetKeys.add(up.r + "," + up.c);
        targetKeys.add(step.r + "," + step.c);
        for (const nb of step.neighbours) targetKeys.add(nb.r + "," + nb.c);
      }
      for (const cell of scene.cells) {
        const key = cell.r + "," + cell.c;
        const isCurrent = step && cell.r === step.r && cell.c === step.c;
        const isNeighbour = step && step.neighbours.some(nb => nb.r === cell.r && nb.c === cell.c);
        const isUpdated = step && step.updates.some(up => up.r === cell.r && up.c === cell.c);
        const dpValue = step ? step.dp[cell.r][cell.c] : 1;
        cell.dpText.textContent = "dp = " + dpValue;
        let fill = C.chipFill, stroke = C.greyDark, width = 1.8, color = C.white;
        if (isNeighbour) { stroke = C.blue; fill = "#101b26"; }
        if (isUpdated) { stroke = C.teal; fill = "#10211e"; color = C.white; }
        if (isCurrent) {
          fill = "#2a2214"; stroke = C.gold; width = 2.8; color = C.gold;
        }
        cell.rect.setAttribute("fill", fill);
        cell.rect.setAttribute("stroke", stroke);
        cell.rect.setAttribute("stroke-width", String(width));
        cell.value.setAttribute("fill", color);
        cell.dpText.setAttribute("fill", isCurrent ? C.gold : isUpdated ? C.teal : C.green);
        setOpacity(cell.g, isCurrent ? u : 1);
      }
      for (const chip of scene.orderChips) {
        const processed = step ? chip.i < stepIndex : false;
        const current = step ? chip.i === stepIndex : false;
        chip.rect.setAttribute("fill", current ? "#2a2214" : processed ? "#10211e" : C.chipFill);
        chip.rect.setAttribute("stroke", current ? C.gold : processed ? C.green : C.greyDark);
        chip.label.setAttribute("fill", current ? C.gold : processed ? C.green : C.grey);
      }
      if (step) {
        scene.currentText.textContent = "value " + matrix[step.r][step.c] +
          "  ·  cell (" + step.r + "," + step.c + ")";
        scene.updateText.textContent = step.updates.length
          ? "updated " + step.updates.map(up => "(" + up.r + "," + up.c + ") → " + up.newValue).join("  ")
          : "no larger neighbour improves";
      }
    };

    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.panel, scene.panelTitle,
                          scene.labels, scene.side, scene.sideTitle,
                          scene.currentLabel, scene.currentText, scene.updateText,
                          scene.recurrence, scene.bestLabel, scene.bestText,
                          scene.status, scene.detail, scene.resultBox,
                          scene.result, scene.note]) {
        if (node) setOpacity(node, 0);
      }
      for (const cell of scene.cells) {
        setOpacity(cell.g, 0);
        cell.rect.setAttribute("fill", C.chipFill);
        cell.rect.setAttribute("stroke", C.greyDark);
        cell.rect.setAttribute("stroke-width", "1.8");
        cell.value.setAttribute("fill", C.white);
        cell.dpText.textContent = "dp = 1";
        cell.dpText.setAttribute("fill", C.green);
      }
      for (const chip of scene.orderChips) {
        setOpacity(chip.g, 0);
        chip.rect.setAttribute("fill", C.chipFill);
        chip.rect.setAttribute("stroke", C.greyDark);
        chip.label.setAttribute("fill", C.grey);
      }
      scene.currentLabel.textContent = "waiting to process";
      scene.currentText.textContent = "—";
      scene.updateText.textContent = "";
      scene.bestText.textContent = "1";
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.result.textContent = "";
      scene.note.textContent = "";
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity } = ctx;
    const { sim, matrix, rows, cols } = scene;
    const easeOut = ease.outCubic;

    scene.reset();
    const status = (text, color, detail, log) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || C.gold);
        setOpacity(scene.status, 1);
        if (detail !== undefined) {
          scene.detail.textContent = detail || "";
          if (detail) setOpacity(scene.detail, 1);
        }
      });
      if (log) tl.log(text, color || C.gold, { hold: false });
    };

    // intro
    tl.line([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    tl.add(0.55, scene.writer(scene.title), easeOut);
    tl.add(0.32, u => setOpacity(scene.subtitle, u), easeOut);
    tl.add(0.26, u => {
      setOpacity(scene.panel, u); setOpacity(scene.panelTitle, u);
      setOpacity(scene.labels, u); setOpacity(scene.side, u);
      setOpacity(scene.sideTitle, u); setOpacity(scene.currentLabel, u);
      setOpacity(scene.currentText, u); setOpacity(scene.updateText, u);
      setOpacity(scene.recurrence, u); setOpacity(scene.bestLabel, u);
      setOpacity(scene.bestText, u);
    }, easeOut);
    for (const cell of scene.cells) tl.add(0.04, u => setOpacity(cell.g, u), easeOut);
    for (const chip of scene.orderChips) tl.add(0.025, u => setOpacity(chip.g, u), easeOut);
    status("every cell starts with dp = 1", C.blue,
      "sorting by value guarantees every smaller predecessor is processed first", true);
    tl.wait(0.15);

    // process cells
    for (let k = 0; k < sim.steps.length; k++) {
      const step = sim.steps[k];
      tl.line(step.updates.length ? [11, 12, 13, 14, 15, 16, 17] : [11, 12, 13, 14, 17]);
      status("cell (" + step.r + "," + step.c + ") = " + matrix[step.r][step.c] +
        " · dp " + step.dp[step.r][step.c], C.gold,
        step.updates.length
          ? "push dp + 1 = " + (step.dp[step.r][step.c] + 1) + " into " +
            step.updates.map(up => "(" + up.r + "," + up.c + ")").join(", ")
          : "no strictly larger neighbour can be improved", true);
      tl.add(0.01, () => {
        scene.currentText.textContent = "value " + matrix[step.r][step.c] +
          "  ·  cell (" + step.r + "," + step.c + ")";
        scene.updateText.textContent = step.updates.length
          ? "updated " + step.updates.map(up => "(" + up.r + "," + up.c + ") → " + up.newValue).join("  ")
          : "no larger neighbour improves";
        scene.bestText.textContent = String(step.best);
      });
      tl.add(0.25, u => scene.showStep(k, u), easeOut);
      tl.wait(0.03);
    }

    // final path
    tl.line([18]);
    const path = sim.path;
    tl.add(0.01, () => {
      scene.showStep(-1, 1);
      for (const p of path) {
        const cell = scene.cells.find(cell => cell.r === p.r && cell.c === p.c);
        if (cell) {
          cell.rect.setAttribute("fill", "#10211e");
          cell.rect.setAttribute("stroke", C.green);
          cell.rect.setAttribute("stroke-width", "3");
          cell.value.setAttribute("fill", C.green);
          cell.dpText.setAttribute("fill", C.green);
        }
        const chip = scene.orderChips.find(chip =>
          chip.order.r === p.r && chip.order.c === p.c);
        if (chip) {
          chip.rect.setAttribute("fill", "#10211e");
          chip.rect.setAttribute("stroke", C.green);
          chip.label.setAttribute("fill", C.green);
        }
      }
    });
    status("best path length = " + sim.answer, C.green,
      "path: " + path.map(p => matrix[p.r][p.c] + " (" + p.r + "," + p.c + ")").join(" → "), true);
    tl.add(0.01, () => {
      scene.result.textContent = "return " + sim.answer;
      scene.note.textContent = "strictly increasing · " + rows + "×" + cols +
        " matrix · longest path has " + sim.answer + " cells";
    });
    tl.add(0.35, u => {
      setOpacity(scene.resultBox, u);
      setOpacity(scene.result, u);
      setOpacity(scene.note, u);
    }, easeOut);
    tl.wait(0.8);
    return tl.finish();
  },
};

function simulateLip(matrix) {
  const rows = matrix.length, cols = matrix[0].length;
  const dp = Array.from({ length: rows }, () => new Array(cols).fill(1));
  const order = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) order.push({ r, c, value: matrix[r][c] });
  }
  order.sort((a, b) => a.value - b.value || a.r - b.r || a.c - b.c);
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const steps = [];
  let best = 1;

  for (let idx = 0; idx < order.length; idx++) {
    const { r, c, value } = order[idx];
    const neighbours = [];
    const updates = [];
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (matrix[nr][nc] <= value) continue;
      neighbours.push({ r: nr, c: nc });
      if (dp[r][c] + 1 > dp[nr][nc]) {
        const oldValue = dp[nr][nc];
        dp[nr][nc] = dp[r][c] + 1;
        updates.push({ r: nr, c: nc, oldValue, newValue: dp[nr][nc] });
      }
    }
    best = Math.max(best, dp[r][c]);
    steps.push({
      r, c, neighbours, updates, best,
      dp: dp.map(row => row.slice()),
    });
  }

  let end = null;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (dp[r][c] === best) { end = { r, c }; break; }
    }
    if (end) break;
  }
  const path = [];
  let cur = end;
  while (cur) {
    path.push(cur);
    if (dp[cur.r][cur.c] === 1) break;
    let next = null;
    for (const [dr, dc] of dirs) {
      const nr = cur.r + dr, nc = cur.c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (matrix[nr][nc] < matrix[cur.r][cur.c] && dp[nr][nc] === dp[cur.r][cur.c] - 1) {
        next = { r: nr, c: nc };
        break;
      }
    }
    cur = next;
  }
  path.reverse();
  return { steps, order, answer: best, path };
}
