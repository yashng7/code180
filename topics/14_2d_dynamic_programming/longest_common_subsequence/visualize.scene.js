/* Shared 2-D DP table renderer for Topic 14 scenes.
 *
 * This block is copied into each generated scene so every visualize.html stays
 * self-contained.  A scene supplies a table, prefilled cells, ordered steps,
 * and the code-line / narration text for each recurrence evaluation.
 */
"use strict";

function buildTableScene(spec, ctx) {
  const { el, txt, C, clamp, setOpacity, STAGE_W } = ctx;
  const R = spec.rowLabels.length;
  const Cn = spec.colLabels.length;
  const specDp = spec.dp || [];

  ctx.backdrop();
  ctx.glow("glow-blue", C.blue);
  ctx.glow("glow-gold", C.gold);
  ctx.glow("glow-green", C.green);
  ctx.glow("glow-red", C.red);

  const writable = ctx.makeWritable();
  const textL = ctx.layer("text");
  const chipsL = ctx.layer("chips");
  const resultL = ctx.layer("result");

  const scene = {
    spec, R, Cn, cells: [], steps: spec.steps || [], early: !!spec.early,
    _writers: [],
  };
  scene.writer = node => {
    const w = writable(node);
    scene._writers.push(w);
    return w;
  };

  scene.title = txt(spec.title, {
    x: 64, y: 64, "font-size": 40, fill: C.white, "letter-spacing": 0.5,
  }, textL);
  scene.subtitle = txt(spec.subtitle, {
    x: 64, y: 101, "font-size": 18, fill: C.grey,
  }, textL);
  setOpacity(scene.subtitle, 0);

  // ---- left table panel ---------------------------------------------
  const pX = 40, pY = 132, pW = 700, pH = 470;
  scene.panel = el("g", {}, chipsL);
  el("rect", {
    x: pX, y: pY, width: pW, height: pH, rx: 14,
    fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
  }, scene.panel);
  setOpacity(scene.panel, 0);
  scene.panelTitle = txt(spec.panelTitle || "dp table", {
    x: pX + 20, y: pY + 28, "font-size": 16, fill: C.blue,
  }, textL);
  setOpacity(scene.panelTitle, 0);

  if (scene.early) {
    scene.earlyTitle = txt(spec.earlyTitle || "early return", {
      x: pX + pW / 2, y: pY + 195, "text-anchor": "middle",
      "font-size": 30, fill: C.gold,
    }, textL);
    scene.earlySub = txt(spec.earlySub || "", {
      x: pX + pW / 2, y: pY + 242, "text-anchor": "middle",
      "font-size": 17, fill: C.grey,
    }, textL);
    setOpacity(scene.earlyTitle, 0);
    setOpacity(scene.earlySub, 0);
  } else {
    // ---- table geometry ---------------------------------------------
    const rowLabelW = clamp(
      Math.max(...spec.rowLabels.map(label => String(label).length)) * 7 + 12,
      32, 82
    );
    const colLabelH = spec.colSubLabels ? 30 : 20;
    const availW = pW - rowLabelW - 52;
    const availH = pH - 92 - colLabelH;
    const cellW = clamp(availW / Cn, 20, spec.cellMaxW || 58);
    const cellH = clamp(availH / R, 18, spec.cellMaxH || 46);
    const gridW = Cn * cellW;
    const gridH = R * cellH;
    const gridX = pX + rowLabelW + Math.max(0, (availW - gridW) / 2);
    const gridTop = pY + 58 + colLabelH + Math.max(0, (availH - gridH) / 2);
    scene.grid = { cellW, cellH, gridX, gridTop, gridW, gridH };
    const valFont = clamp(
      Math.min(cellW * 0.36, cellH * (spec.valueFontScale || 0.46)),
      9, spec.valueFontMax || 22
    );

    scene.labels = el("g", {}, textL);
    setOpacity(scene.labels, 0);
    for (let j = 0; j < Cn; j++) {
      txt(String(spec.colLabels[j]), {
        x: gridX + j * cellW + cellW / 2,
        y: gridTop - (spec.colSubLabels ? 18 : 8),
        "text-anchor": "middle", "font-size": spec.colLabelSize || 11,
        fill: C.grey,
      }, scene.labels);
      if (spec.colSubLabels) {
        txt(String(spec.colSubLabels[j]), {
          x: gridX + j * cellW + cellW / 2, y: gridTop - 5,
          "text-anchor": "middle", "font-size": 9, fill: C.greyDark,
        }, scene.labels);
      }
    }
    for (let i = 0; i < R; i++) {
      txt(String(spec.rowLabels[i]), {
        x: gridX - 10, y: gridTop + i * cellH + cellH / 2,
        "text-anchor": "end", "dominant-baseline": "central",
        "font-size": spec.rowLabelSize || 11, fill: C.grey,
      }, scene.labels);
    }
    scene.corner = txt(spec.cornerLabel || "", {
      x: gridX - 10, y: gridTop - 18, "text-anchor": "end",
      "font-size": 9, fill: C.greyDark,
    }, scene.labels);

    scene.prefill = new Map();
    for (const item of spec.prefill || []) {
      scene.prefill.set(item.i + "," + item.j, item);
    }
    scene.stepByCoord = new Map();
    scene.steps.forEach((step, index) => {
      step.index = index;
      scene.stepByCoord.set(step.i + "," + step.j, step);
    });

    for (let i = 0; i < R; i++) {
      for (let j = 0; j < Cn; j++) {
        const x = gridX + j * cellW;
        const y = gridTop + i * cellH;
        const g = el("g", {}, chipsL);
        const rect = el("rect", {
          x: x + 1.5, y: y + 1.5,
          width: Math.max(2, cellW - 3), height: Math.max(2, cellH - 3), rx: 5,
          fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.4,
        }, g);
        const ring = el("rect", {
          x: x + 1, y: y + 1,
          width: Math.max(2, cellW - 2), height: Math.max(2, cellH - 2), rx: 5,
          fill: "none", stroke: C.green, "stroke-width": 3,
          filter: "url(#glow-green)",
        }, g);
        setOpacity(ring, 0);
        const label = txt("", {
          x: x + cellW / 2, y: y + cellH / 2 + 1,
          "text-anchor": "middle", "dominant-baseline": "central",
          "font-size": valFont, fill: C.white,
        }, g);
        setOpacity(g, 0);
        scene.cells.push({ i, j, g, rect, ring, label, x, y });
      }
    }

    scene.startTag = txt(spec.startTag || "", {
      x: gridX + gridW / 2, y: gridTop + gridH + 18,
      "text-anchor": "middle", "font-size": 11, fill: C.grey,
    }, textL);
    setOpacity(scene.startTag, 0);
  }

  // ---- right recurrence panel ---------------------------------------
  const rX = 764, rY = 132, rW = 476, rH = 470;
  scene.sidePanel = el("g", {}, chipsL);
  el("rect", {
    x: rX, y: rY, width: rW, height: rH, rx: 14,
    fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
  }, scene.sidePanel);
  setOpacity(scene.sidePanel, 0);
  scene.sideTitle = txt(spec.sideTitle || "recurrence", {
    x: rX + 22, y: rY + 30, "font-size": 18, fill: C.gold,
  }, textL);
  setOpacity(scene.sideTitle, 0);

  const statics = spec.statics || [];
  for (let k = 0; k < statics.length; k++) {
    txt(statics[k].text || statics[k][0], {
      x: rX + 22, y: rY + 68 + k * 27,
      "font-size": 13, fill: (statics[k].color || statics[k][2]) || C.grey,
    }, textL);
  }

  scene.cellLabel = txt(spec.cellLabel || "current cell", {
    x: rX + 22, y: rY + 196, "font-size": 13, fill: C.grey,
  }, textL);
  scene.cellText = txt("—", {
    x: rX + 22, y: rY + 232, "font-size": 30, fill: C.gold,
  }, textL);
  scene.formula = txt("", {
    x: rX + 22, y: rY + 274, "font-size": 14, fill: C.white,
  }, textL);
  scene.valueLabel = txt(spec.valueLabel || "value", {
    x: rX + 22, y: rY + 322, "font-size": 13, fill: C.grey,
  }, textL);
  scene.valueText = txt("—", {
    x: rX + 22, y: rY + 364, "font-size": 40, fill: C.green,
  }, textL);
  scene.answer = txt(spec.answerText || "", {
    x: rX + 22, y: rY + 420, "font-size": 15, fill: C.green,
  }, textL);
  scene.answerNote = txt(spec.answerNote || "", {
    x: rX + 22, y: rY + 448, "font-size": 11, fill: C.grey,
  }, textL);
  for (const node of [scene.cellLabel, scene.cellText, scene.formula,
                      scene.valueLabel, scene.valueText, scene.answer,
                      scene.answerNote]) setOpacity(node, 0);

  // ---- status + result ----------------------------------------------
  scene.status = txt("", {
    x: 64, y: 620, "font-size": 19, fill: C.gold,
  }, textL);
  scene.detail = txt("", {
    x: 64, y: 646, "font-size": 14, fill: C.grey,
  }, textL);
  setOpacity(scene.status, 0);
  setOpacity(scene.detail, 0);
  scene.resultBox = el("rect", {
    x: 340, y: 662, width: 600, height: 44, rx: 10,
    fill: "#111a16", stroke: C.green, "stroke-width": 2.2,
    filter: "url(#glow-green)",
  }, resultL);
  setOpacity(scene.resultBox, 0);
  scene.result = txt("", {
    x: STAGE_W / 2, y: 685, "text-anchor": "middle",
    "dominant-baseline": "central", "font-size": 25, fill: C.green,
  }, resultL);
  scene.note = txt("", {
    x: STAGE_W / 2, y: 714, "text-anchor": "middle",
    "font-size": 11, fill: C.grey,
  }, resultL);
  setOpacity(scene.result, 0);
  setOpacity(scene.note, 0);

  // ---- painting ------------------------------------------------------
  scene.paint = (currentIndex, u) => {
    const current = currentIndex >= 0 ? scene.steps[currentIndex] : null;
    const parents = new Set(
      current && current.parents ? current.parents.map(p => p[0] + "," + p[1]) : []
    );
    for (const cell of scene.cells) {
      const key = cell.i + "," + cell.j;
      const step = scene.stepByCoord.get(key);
      const pre = scene.prefill.get(key);
      const visible = step ? step.index <= currentIndex : !!pre;
      if (!visible) {
        setOpacity(cell.g, 0);
        cell.label.textContent = "";
        continue;
      }
      const isCurrent = !!step && step.index === currentIndex && currentIndex >= 0;
      const isParent = parents.has(key);
      const value = step ? step.value : pre.value;
      cell.label.textContent = spec.formatValue
        ? spec.formatValue(value) : String(value);
      let fill = pre && !step ? "#111b28" : C.chipFill;
      let stroke = pre && !step ? C.greyDark : C.greyDark;
      let width = pre && !step ? 1.6 : 1.4;
      let color = pre && !step ? C.blue : C.white;
      if (isParent) {
        fill = "#101b26"; stroke = C.blue; width = 2.2; color = C.white;
      }
      if (isCurrent) {
        width = 2.5;
        if (step.tone === "true" || step.tone === "match") {
          fill = "#10211e"; stroke = C.green; color = C.green;
        } else if (step.tone === "false") {
          fill = "#2a1515"; stroke = C.red; color = C.red;
        } else {
          fill = "#2a2214"; stroke = C.gold; color = C.gold;
        }
      }
      cell.rect.setAttribute("fill", fill);
      cell.rect.setAttribute("stroke", stroke);
      cell.rect.setAttribute("stroke-width", String(width));
      cell.label.setAttribute("fill", color);
      setOpacity(cell.g, isCurrent ? u : 1);
    }
  };

  scene.setStep = step => {
    if (!step) {
      scene.cellText.textContent = "—";
      scene.formula.textContent = "";
      scene.valueText.textContent = "—";
      return;
    }
    scene.cellText.textContent = spec.coordLabel
      ? spec.coordLabel(step) : "(" + step.i + ", " + step.j + ")";
    scene.formula.textContent = step.formula || "";
    scene.formula.setAttribute("font-size", (step.formula || "").length > 54 ? 11.5 : 14);
    scene.valueText.textContent = spec.formatValue
      ? spec.formatValue(step.value) : String(step.value);
    scene.valueText.setAttribute("fill",
      step.tone === "false" ? C.red : step.tone === "true" ? C.green : C.green);
  };

  scene.reset = () => {
    for (const w of scene._writers) w.reset();
    for (const node of [scene.subtitle, scene.panel, scene.panelTitle,
                        scene.labels, scene.earlyTitle, scene.earlySub,
                        scene.startTag, scene.sidePanel, scene.sideTitle,
                        scene.cellLabel, scene.cellText, scene.formula,
                        scene.valueLabel, scene.valueText, scene.answer,
                        scene.answerNote, scene.status, scene.detail,
                        scene.resultBox, scene.result, scene.note]) {
      if (node) setOpacity(node, 0);
    }
    for (const cell of scene.cells) {
      setOpacity(cell.g, 0);
      setOpacity(cell.ring, 0);
      cell.label.textContent = "";
      cell.rect.setAttribute("fill", C.chipFill);
      cell.rect.setAttribute("stroke", C.greyDark);
      cell.rect.setAttribute("stroke-width", "1.4");
      cell.label.setAttribute("fill", C.white);
    }
    scene.cellText.textContent = "—";
    scene.formula.textContent = "";
    scene.valueText.textContent = "—";
    scene.status.textContent = "";
    scene.detail.textContent = "";
    scene.result.textContent = "";
    scene.note.textContent = "";
  };

  return scene;
}

function buildTableTimeline(scene, tl, ctx) {
  const { C, ease, setOpacity } = ctx;
  const { spec, steps } = scene;
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

  // ---- intro ---------------------------------------------------------
  tl.line(spec.introLines || [1, 2]);
  tl.add(0.55, scene.writer(scene.title), easeOut);
  tl.add(0.32, u => setOpacity(scene.subtitle, u), easeOut);
  tl.add(0.26, u => {
    setOpacity(scene.panel, u);
    setOpacity(scene.panelTitle, u);
    setOpacity(scene.sidePanel, u);
    setOpacity(scene.sideTitle, u);
    setOpacity(scene.cellLabel, u);
    setOpacity(scene.cellText, u);
    setOpacity(scene.formula, u);
    setOpacity(scene.valueLabel, u);
    setOpacity(scene.valueText, u);
    setOpacity(scene.answer, u);
    setOpacity(scene.answerNote, u);
  }, easeOut);

  if (scene.early) {
    tl.add(0.3, u => {
      setOpacity(scene.earlyTitle, u);
      setOpacity(scene.earlySub, u);
    }, easeOut);
    status(spec.earlyStatus || "early return", C.gold, spec.earlyDetail, true);
    tl.line(spec.earlyLines || []);
    tl.add(0.01, () => {
      scene.cellText.textContent = "—";
      scene.formula.textContent = spec.earlyFormula || "";
      scene.valueText.textContent = spec.formatValue
        ? spec.formatValue(spec.answer) : String(spec.answer);
    });
    tl.line(spec.finalLines || []);
    status(spec.finalStatus || "return " + spec.answer, C.green, spec.finalDetail, true);
    tl.add(0.01, () => {
      scene.result.textContent = spec.resultText || ("return " + spec.answer);
      scene.note.textContent = spec.resultNote || "";
    });
    tl.add(0.3, u => {
      setOpacity(scene.resultBox, u);
      setOpacity(scene.result, u);
      setOpacity(scene.note, u);
    }, easeOut);
    tl.wait(0.7);
    return tl.finish();
  }

  tl.add(0.26, u => setOpacity(scene.labels, u), easeOut);
  tl.add(0.18, u => setOpacity(scene.startTag, u), easeOut);
  tl.add(0.25, u => scene.paint(-1, u), easeOut);
  status(spec.introStatus || "initialize the base row and column", C.blue,
    spec.introDetail, true);
  tl.wait(0.12);

  // ---- recurrence steps ---------------------------------------------
  const stepDur = steps.length > 90 ? 0.085 : steps.length > 50 ? 0.11 : 0.16;
  for (let k = 0; k < steps.length; k++) {
    const step = steps[k];
    tl.line(step.lines || []);
    tl.add(0.01, () => scene.setStep(step));
    status(step.status || "", step.color || C.gold, step.detail, false);
    tl.add(stepDur, u => scene.paint(k, u), easeOut);
    if (step.log || step.j === 0 || k === steps.length - 1) {
      tl.log(step.status || "fill (" + step.i + "," + step.j + ")",
        step.color || C.gold, { hold: false });
    }
    if (step.wait) tl.wait(step.wait);
  }

  // ---- answer --------------------------------------------------------
  tl.line(spec.finalLines || []);
  tl.add(0.01, () => {
    scene.setStep({
      i: spec.answerCell ? spec.answerCell[0] : scene.R - 1,
      j: spec.answerCell ? spec.answerCell[1] : scene.Cn - 1,
      value: spec.answer,
      formula: spec.finalFormula || "",
      tone: spec.answerTone || "true",
    });
    for (const coord of spec.answerCells || [[scene.R - 1, scene.Cn - 1]]) {
      const cell = scene.cells.find(c => c.i === coord[0] && c.j === coord[1]);
      if (cell) {
        setOpacity(cell.ring, 1);
        cell.rect.setAttribute("stroke", C.green);
        cell.rect.setAttribute("stroke-width", "2.6");
        cell.label.setAttribute("fill", C.green);
      }
    }
  });
  status(spec.finalStatus || ("return " + spec.answer), C.green,
    spec.finalDetail, true);
  tl.add(0.01, () => {
    scene.result.textContent = spec.resultText || ("return " + spec.answer);
    scene.note.textContent = spec.resultNote || "";
  });
  tl.add(0.35, u => {
    setOpacity(scene.resultBox, u);
    setOpacity(scene.result, u);
    setOpacity(scene.note, u);
  }, easeOut);
  tl.wait(0.85);
  return tl.finish();
}
const SCENE = {
  meta: {
    title: "Longest Common Subsequence",
    subtitle: "dp[i][j] = match ? diag + 1 : max(top, left) · two-sequence DP",
    inputs: [
      { id: "text1", label: "text1", type: "text", default: "abcde", width: "wide" },
      { id: "text2", label: "text2", type: "text", default: "ace" },
    ],
    legend: [
      { color: "#58C4DD", text: "parent cells" },
      { color: "#83C167", text: "matching cell" },
      { color: "#F0AC5F", text: "current cell" },
      { color: "#6b7684", text: "not filled yet" },
    ],
  },

  code: [
    "def longest_common_subsequence(text1: str, text2: str) -> int:",
    "    \"\"\"Return the length of the longest common subsequence.\"\"\"",
    "    if len(text2) > len(text1):",
    "        text1, text2 = text2, text1  # keep the shorter string on the dp row",
    "    dp = [0] * (len(text2) + 1)",
    "    for c1 in text1:",
    "        prev = 0  # dp[i-1][j-1] from the previous row",
    "        for j, c2 in enumerate(text2, start=1):",
    "            saved = dp[j]  # dp[i-1][j] before overwriting",
    "            if c1 == c2:",
    "                dp[j] = prev + 1",
    "            else:",
    "                dp[j] = max(dp[j], dp[j - 1])",
    "            prev = saved",
    "    return dp[len(text2)]",
  ],

  read(values) {
    const a = String(values.text1 == null ? "" : values.text1).trim();
    const b = String(values.text2 == null ? "" : values.text2).trim();
    if (a.length > 12 || b.length > 12) return null;
    if (/\s/.test(a) || /\s/.test(b)) return null;
    return { text1: a, text2: b };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || args.length !== 2) return null;
    if (typeof args[0] !== "string" || typeof args[1] !== "string") return null;
    if (args[0].length > 12 || args[1].length > 12) return null;
    return { text1: args[0], text2: args[1] };
  },

  buildScene(params, ctx) {
    return buildTableScene(makeLcsSpec(params), ctx);
  },

  buildTimeline(scene, tl, ctx) {
    return buildTableTimeline(scene, tl, ctx);
  },
};

function makeLcsSpec(params) {
  let a = params.text1;
  let b = params.text2;
  if (b.length > a.length) {
    const tmp = a; a = b; b = tmp;
  }
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  const steps = [];
  const prefill = [];
  for (let j = 0; j <= n; j++) prefill.push({ i: 0, j, value: 0 });
  for (let i = 1; i <= m; i++) prefill.push({ i, j: 0, value: 0 });

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const ch1 = a[i - 1], ch2 = b[j - 1];
      const top = dp[i - 1][j];
      const left = dp[i][j - 1];
      const diag = dp[i - 1][j - 1];
      if (ch1 === ch2) {
        dp[i][j] = diag + 1;
        steps.push({
          i, j, value: dp[i][j], tone: "match",
          parents: [[i - 1, j - 1]],
          lines: [8, 9, 10, 11],
          formula: "match → 1 + diag = 1 + " + diag + " = " + dp[i][j],
          status: "‘" + ch1 + "’ matches ‘" + ch2 + "’ → diag + 1 = " + dp[i][j],
          detail: "a match extends the LCS built before both characters",
          log: j === 1,
        });
      } else {
        dp[i][j] = Math.max(top, left);
        steps.push({
          i, j, value: dp[i][j],
          parents: [[i - 1, j], [i, j - 1]],
          lines: [8, 9, 12, 13],
          formula: "no match → max(top " + top + ", left " + left + ") = " + dp[i][j],
          status: "‘" + ch1 + "’ ≠ ‘" + ch2 + "’ → max(" + top + ", " + left + ") = " + dp[i][j],
          detail: "drop one character from either string and keep the better prefix",
          log: j === 1,
        });
      }
    }
  }

  const answer = dp[m][n];
  return {
    title: "Longest Common Subsequence",
    subtitle: "row = " + (a || "ε") + "   ·   column = " + (b || "ε") +
      "   ·   keep the shorter string on the columns",
    panelTitle: "dp table · LCS lengths for prefixes",
    rowLabels: ["ε"].concat(a.split("")),
    colLabels: ["ε"].concat(b.split("")),
    cornerLabel: "i \\ j",
    dp, prefill, steps, answer,
    formatValue: value => String(value),
    coordLabel: step => "(i=" + step.i + ", j=" + step.j + ")",
    statics: [
      { text: "dp[i][j] = LCS(text1[:i], text2[:j])", color: "#ececec" },
      { text: "match  →  dp[i-1][j-1] + 1", color: "#83C167" },
      { text: "mismatch → max(top, left)", color: "#58C4DD" },
      { text: a.length && b.length ? "first row / first column = 0" : "empty string → all zeroes", color: "#6b7684" },
    ],
    cellLabel: "prefix pair",
    valueLabel: "LCS length",
    answerText: "answer = dp[" + m + "][" + n + "] = " + answer,
    answerNote: a.length && b.length
      ? "the diagonal on a match is what makes a subsequence"
      : "an empty string shares no characters with anything",
    introLines: [1, 2, 3],
    introStatus: "initialize the empty-prefix row and column with zeroes",
    introDetail: "the rolling row code keeps only one row, but the full table is shown here",
    finalLines: [15],
    finalStatus: "return dp[" + n + "] = " + answer,
    finalDetail: "the bottom-right cell is the LCS length of the complete strings",
    finalFormula: "complete strings → LCS = " + answer,
    resultText: "return " + answer,
    resultNote: answer + " characters can be shared in order without rearranging either string",
  };
}
