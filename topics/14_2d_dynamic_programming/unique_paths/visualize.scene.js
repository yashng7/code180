/* Unique Paths — animated 2-D DP table scene.
 *
 * Every cell counts the right/down paths that can reach it. The first row and
 * first column each have exactly one straight path; every other cell is the
 * sum of the cell above and the cell to its left. The code rolls one row, while
 * the stage shows the full table so both parents stay visible.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Unique Paths",
    subtitle: "dp[i][j] = above + left · first row/column = 1 · O(m·n)",
    inputs: [
      { id: "m", label: "m (rows)", type: "number", default: 3 },
      { id: "n", label: "n (cols)", type: "number", default: 7 },
    ],
    legend: [
      { color: "#58C4DD", text: "parent cells" },
      { color: "#F0AC5F", text: "current cell" },
      { color: "#83C167", text: "destination" },
      { color: "#6b7684", text: "not filled yet" },
    ],
  },

  code: [
    "def unique_paths(m: int, n: int) -> int:",
    "    \"\"\"Return the number of right/down paths across an ``m x n`` grid.\"\"\"",
    "    dp = [1] * n  # dp[j] = ways to reach column j of the current row",
    "    for _ in range(1, m):",
    "        for j in range(1, n):",
    "            dp[j] += dp[j - 1]  # above (old dp[j]) + left (new dp[j-1])",
    "    return dp[n - 1]",
  ],

  read(values) {
    const m = Number(values.m);
    const n = Number(values.n);
    if (!Number.isInteger(m) || !Number.isInteger(n)) return null;
    if (m < 1 || m > 10 || n < 1 || n > 10) return null;
    return { m, n };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || args.length < 2) return null;
    const m = Number(args[0]);
    const n = Number(args[1]);
    if (!Number.isInteger(m) || !Number.isInteger(n)) return null;
    if (m < 1 || m > 10 || n < 1 || n > 10) return null;
    return { m: String(m), n: String(n) };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, STAGE_W } = ctx;
    const { m, n } = params;
    const dp = Array.from({ length: m }, () => new Array(n).fill(1));
    for (let i = 1; i < m; i++) {
      for (let j = 1; j < n; j++) dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
    }
    const answer = dp[m - 1][n - 1];

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
      m, n, dp, answer, cells: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title ---------------------------------------------------------
    scene.title = txt("Unique Paths", {
      x: 64, y: 64, "font-size": 42, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    scene.subtitle = txt(
      m + "×" + n + " grid   ·   only right and down   ·   count every route from (0,0) to (" +
      (m - 1) + "," + (n - 1) + ")",
      { x: 64, y: 101, "font-size": 18, fill: C.grey },
      textL
    );
    setOpacity(scene.subtitle, 0);

    // ---- table panel ---------------------------------------------------
    const pX = 40, pY = 132, pW = 700, pH = 470;
    scene.panel = el("g", {}, chipsL);
    el("rect", {
      x: pX, y: pY, width: pW, height: pH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.panel);
    setOpacity(scene.panel, 0);
    scene.panelTitle = txt("dp table · ways into each cell", {
      x: pX + 20, y: pY + 28, "font-size": 16, fill: C.blue,
    }, textL);
    setOpacity(scene.panelTitle, 0);

    const cellW = clamp(560 / n, 38, 58);
    const cellH = clamp(350 / m, 30, 46);
    const gridW = n * cellW;
    const gridH = m * cellH;
    const gridX = pX + (pW - gridW) / 2;
    const availTop = pY + 58;
    const availH = pH - 100;
    const gridTop = availTop + (availH - gridH) / 2;
    const valFont = clamp(Math.min(cellW * 0.34, cellH * 0.46), 12, 22);

    // column / row indices
    scene.labels = el("g", {}, textL);
    setOpacity(scene.labels, 0);
    for (let j = 0; j < n; j++) {
      txt(String(j), {
        x: gridX + j * cellW + cellW / 2, y: gridTop - 9,
        "text-anchor": "middle", "font-size": 11, fill: C.grey,
      }, scene.labels);
    }
    for (let i = 0; i < m; i++) {
      txt(String(i), {
        x: gridX - 13, y: gridTop + i * cellH + cellH / 2,
        "text-anchor": "end", "dominant-baseline": "central",
        "font-size": 11, fill: C.grey,
      }, scene.labels);
    }

    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        const x = gridX + j * cellW;
        const y = gridTop + i * cellH;
        const g = el("g", {}, chipsL);
        const rect = el("rect", {
          x: x + 1.5, y: y + 1.5, width: cellW - 3, height: cellH - 3, rx: 6,
          fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.5,
        }, g);
        const ring = el("rect", {
          x: x + 1, y: y + 1, width: cellW - 2, height: cellH - 2, rx: 6,
          fill: "none", stroke: C.green, "stroke-width": 3,
          filter: "url(#glow-green)",
        }, g);
        setOpacity(ring, 0);
        const label = txt("", {
          x: x + cellW / 2, y: y + cellH / 2 + 1, "text-anchor": "middle",
          "dominant-baseline": "central", "font-size": valFont, fill: C.white,
        }, g);
        setOpacity(g, 0);
        scene.cells.push({ i, j, g, rect, ring, label, value: dp[i][j] });
      }
    }

    // first cell / last cell tags (one label when the grid is a single line)
    scene.startTag = txt(m === 1 && n === 1 ? "start · end" : "start", {
      x: gridX + cellW / 2, y: gridTop + gridH + 16, "text-anchor": "middle",
      "font-size": 12, fill: C.blue,
    }, textL);
    scene.endTag = txt(m === 1 || n === 1 ? "" : "end", {
      x: gridX + (n - 1) * cellW + cellW / 2, y: gridTop + gridH + 16,
      "text-anchor": "middle", "font-size": 12, fill: C.green,
    }, textL);
    setOpacity(scene.startTag, 0);
    setOpacity(scene.endTag, 0);

    // ---- right panel ---------------------------------------------------
    const rX = 764, rY = 132, rW = 476, rH = 470;
    scene.sidePanel = el("g", {}, chipsL);
    el("rect", {
      x: rX, y: rY, width: rW, height: rH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.sidePanel);
    setOpacity(scene.sidePanel, 0);
    scene.sideTitle = txt("recurrence", {
      x: rX + 22, y: rY + 30, "font-size": 18, fill: C.gold,
    }, textL);
    setOpacity(scene.sideTitle, 0);

    const statics = [
      ["dp[i][j] = routes to cell (i, j)", 70, C.grey],
      ["dp[i][j] = dp[i-1][j] + dp[i][j-1]", 100, C.white],
      ["first row / first column = 1", 130, C.blue],
    ];
    for (const [text, dy, color] of statics) {
      txt(text, {
        x: rX + 22, y: rY + dy, "font-size": 14, fill: color,
      }, textL);
    }

    scene.cellLabel = txt("current cell", {
      x: rX + 22, y: rY + 202, "font-size": 13, fill: C.grey,
    }, textL);
    setOpacity(scene.cellLabel, 0);
    scene.cellText = txt("—", {
      x: rX + 22, y: rY + 238, "font-size": 32, fill: C.gold,
    }, textL);
    setOpacity(scene.cellText, 0);
    scene.formula = txt("", {
      x: rX + 22, y: rY + 278, "font-size": 15, fill: C.white,
    }, textL);
    setOpacity(scene.formula, 0);
    scene.waysLabel = txt("ways into this cell", {
      x: rX + 22, y: rY + 330, "font-size": 13, fill: C.grey,
    }, textL);
    setOpacity(scene.waysLabel, 0);
    scene.waysText = txt("—", {
      x: rX + 22, y: rY + 376, "font-size": 42, fill: C.green,
    }, textL);
    setOpacity(scene.waysText, 0);
    scene.answerText = txt("answer = dp[" + (m - 1) + "][" + (n - 1) + "] = " + answer, {
      x: rX + 22, y: rY + 434, "font-size": 15, fill: C.green,
    }, textL);
    setOpacity(scene.answerText, 0);
    scene.answerNote = txt("the rolling-row code keeps only these n values", {
      x: rX + 22, y: rY + 456, "font-size": 11, fill: C.grey,
    }, textL);
    setOpacity(scene.answerNote, 0);

    // ---- status + result ----------------------------------------------
    scene.status = txt("", {
      x: 64, y: 618, "font-size": 19, fill: C.gold,
    }, textL);
    setOpacity(scene.status, 0);
    scene.resultBox = el("rect", {
      x: 340, y: 642, width: 600, height: 54, rx: 12,
      fill: "#111a16", stroke: C.green, "stroke-width": 2.2,
      filter: "url(#glow-green)",
    }, resultL);
    setOpacity(scene.resultBox, 0);
    scene.result = txt("", {
      x: STAGE_W / 2, y: 669, "text-anchor": "middle",
      "dominant-baseline": "central", "font-size": 28, fill: C.green,
    }, resultL);
    scene.note = txt("", {
      x: STAGE_W / 2, y: 710, "text-anchor": "middle",
      "font-size": 13, fill: C.grey,
    }, resultL);

    // ---- baseline ------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.panel, scene.panelTitle,
                          scene.labels, scene.startTag, scene.endTag,
                          scene.sidePanel, scene.sideTitle, scene.cellLabel,
                          scene.cellText, scene.formula, scene.waysLabel,
                          scene.waysText, scene.answerText, scene.answerNote,
                          scene.status, scene.resultBox, scene.note]) {
        setOpacity(node, 0);
      }
      for (const cell of scene.cells) {
        setOpacity(cell.g, 0);
        setOpacity(cell.ring, 0);
        cell.label.textContent = "";
        cell.rect.setAttribute("fill", C.chipFill);
        cell.rect.setAttribute("stroke", C.greyDark);
        cell.rect.setAttribute("stroke-width", "1.5");
        cell.label.setAttribute("fill", C.white);
      }
      scene.cellText.textContent = "—";
      scene.formula.textContent = "";
      scene.waysText.textContent = "—";
      scene.status.textContent = "";
      scene.result.textContent = "";
      scene.note.textContent = "";
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity } = ctx;
    const { m, n, dp, answer } = scene;
    const easeOut = ease.outCubic;
    const stepDur = m * n > 40 ? 0.09 : 0.14;

    scene.reset();

    const status = (text, color, log) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || C.gold);
        setOpacity(scene.status, 1);
      });
      if (log) tl.log(text, color || C.gold, { hold: false });
    };

    const paint = (step, u) => {
      const { i, j } = step;
      for (const cell of scene.cells) {
        const idx = cell.i * n + cell.j;
        const curIdx = i * n + j;
        const revealed = idx < curIdx;
        const isCurrent = cell.i === i && cell.j === j;
        const isTop = cell.i === i - 1 && cell.j === j;
        const isLeft = cell.i === i && cell.j === j - 1;
        if (revealed || isCurrent) {
          cell.label.textContent = String(cell.value);
          setOpacity(cell.g, isCurrent ? u : 1);
          cell.rect.setAttribute("fill", isCurrent ? "#2a2214" : C.chipFill);
          cell.rect.setAttribute("stroke", isCurrent ? C.gold : (isTop || isLeft ? C.blue : C.greyDark));
          cell.rect.setAttribute("stroke-width", isCurrent || isTop || isLeft ? "2.4" : "1.5");
          cell.label.setAttribute("fill", isCurrent ? C.gold : C.white);
        } else {
          setOpacity(cell.g, 0);
        }
      }
    };

    // ---- intro ---------------------------------------------------------
    tl.line(1);
    tl.add(0.65, scene.writer(scene.title), easeOut);
    tl.add(0.4, u => setOpacity(scene.subtitle, u), easeOut);
    tl.add(0.3, u => {
      setOpacity(scene.panel, u);
      setOpacity(scene.panelTitle, u);
      setOpacity(scene.labels, u);
      setOpacity(scene.startTag, u);
      setOpacity(scene.endTag, u);
      setOpacity(scene.sidePanel, u);
      setOpacity(scene.sideTitle, u);
      setOpacity(scene.cellLabel, u);
      setOpacity(scene.cellText, u);
      setOpacity(scene.waysLabel, u);
      setOpacity(scene.waysText, u);
      setOpacity(scene.answerText, u);
      setOpacity(scene.answerNote, u);
    }, easeOut);
    for (const cell of scene.cells) {
      tl.add(0.016, u => setOpacity(cell.g, u), easeOut);
    }
    status("first row and first column have exactly one straight path", C.blue, true);
    tl.wait(0.2);

    // ---- fill the table ------------------------------------------------
    let row = -1;
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (j === 0 && i !== row) {
          row = i;
          tl.line(i === 0 ? [3, 4] : [4, 5]);
          status("row " + i + ": fill left to right", C.grey, false);
          tl.log("row " + i + " of the dp table", C.blue, { hold: false });
        }
        const value = dp[i][j];
        if (i === 0 || j === 0) {
          status("(" + i + "," + j + ") is on the top row or left column  →  " + value + " path", C.blue, false);
        } else {
          status("(" + i + "," + j + "): " + dp[i - 1][j] + " above + " + dp[i][j - 1] +
            " left = " + value, C.gold, false);
        }
        tl.add(stepDur, u => paint({ i, j }, u), easeOut);
        tl.line([5, 6]);
        if (j === n - 1 || (i === 0 && j === 0)) {
          tl.add(0.01, () => {
            scene.cellText.textContent = "(" + i + ", " + j + ")";
            scene.waysText.textContent = String(value);
            scene.formula.textContent = i === 0 || j === 0
              ? "edge cell  ·  one straight path"
              : dp[i - 1][j] + " + " + dp[i][j - 1] + " = " + value;
          });
          tl.log("(" + i + "," + j + ") = " + value,
            i === m - 1 && j === n - 1 ? C.green : C.gold, { hold: false });
        }
      }
    }

    // ---- answer --------------------------------------------------------
    tl.line(7);
    tl.add(0.01, () => {
      scene.cellText.textContent = "(" + (m - 1) + ", " + (n - 1) + ")";
      scene.waysText.textContent = String(answer);
      scene.formula.textContent = "destination reached";
      const last = scene.cells[scene.cells.length - 1];
      last.rect.setAttribute("stroke", C.green);
      last.rect.setAttribute("stroke-width", "2.6");
      last.label.setAttribute("fill", C.green);
      setOpacity(last.ring, 1);
    });
    status("return dp[" + (m - 1) + "][" + (n - 1) + "] = " + answer, C.green, true);
    tl.add(0.4, u => setOpacity(scene.resultBox, u), easeOut);
    tl.add(0.01, () => {
      scene.result.textContent = "return " + answer;
      scene.note.textContent = answer + " distinct right/down routes across the " + m + "×" + n + " grid";
    });
    tl.add(0.55, scene.writer(scene.result), ease.linear);
    tl.add(0.4, scene.writer(scene.note), ease.linear);
    tl.wait(1.0);

    return tl.finish();
  },
};
