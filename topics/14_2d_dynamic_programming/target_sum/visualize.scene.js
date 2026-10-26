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
    title: "Target Sum",
    subtitle: "plus − minus = target → count subsets with sum (total + target) / 2",
    inputs: [
      { id: "nums", label: "nums (comma separated)", type: "text", default: "1, 1, 1, 1, 1", width: "wide" },
      { id: "target", label: "target", type: "number", default: 3 },
    ],
    legend: [
      { color: "#58C4DD", text: "unchanged / skip" },
      { color: "#83C167", text: "choose this number" },
      { color: "#F0AC5F", text: "current cell" },
      { color: "#FC6255", text: "early return" },
    ],
  },

  code: [
    "def find_target_sum_ways(nums: List[int], target: int) -> int:",
    "    \"\"\"Return the number of +/- assignments whose sum equals ``target``.\"\"\"",
    "    total = sum(nums)",
    "    if abs(target) > total or (total + target) % 2:",
    "        return 0",
    "    goal = (total + target) // 2",
    "    dp = [0] * (goal + 1)",
    "    dp[0] = 1",
    "    for num in nums:",
    "        for subtotal in range(goal, num - 1, -1):",
    "            dp[subtotal] += dp[subtotal - num]",
    "    return dp[goal]",
  ],

  read(values) {
    const nums = parseNumberList(values.nums);
    const target = Number(values.target);
    if (!nums || nums.length > 6) return null;
    if (nums.some(v => !Number.isInteger(v) || v < 0 || v > 99)) return null;
    if (!Number.isInteger(target) || Math.abs(target) > 999) return null;
    return { nums, target };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || args.length !== 2) return null;
    const nums = args[0], target = Number(args[1]);
    if (!Array.isArray(nums) || nums.length > 6) return null;
    if (nums.some(v => !Number.isInteger(v) || v < 0 || v > 99)) return null;
    if (!Number.isInteger(target) || Math.abs(target) > 999) return null;
    return { nums: nums.join(", "), target: String(target) };
  },

  buildScene(params, ctx) {
    return buildTableScene(makeTargetSpec(params), ctx);
  },

  buildTimeline(scene, tl, ctx) {
    return buildTableTimeline(scene, tl, ctx);
  },
};

function parseNumberList(raw) {
  const text = String(raw == null ? "" : raw).trim();
  if (!text) return [];
  const parts = text.split(/[\s,]+/).filter(Boolean);
  const nums = [];
  for (const part of parts) {
    if (!/^-?\d+$/.test(part)) return null;
    nums.push(Number(part));
  }
  return nums;
}

function makeTargetSpec(params) {
  const nums = params.nums;
  const target = Number(params.target);
  const total = nums.reduce((sum, value) => sum + value, 0);
  const title = "Target Sum";
  const subtitle = "nums [" + nums.join(", ") + "] · target " + target +
    " · total " + total;
  const common = {
    title, subtitle,
    panelTitle: "subset-sum table · ways to choose plus-signed numbers",
    statics: [
      { text: "plus − minus = target", color: "#ececec" },
      { text: "plus = (total + target) / 2", color: "#83C167" },
      { text: "dp[i][s] = ways using nums[:i] to sum to s", color: "#58C4DD" },
      { text: "process subtotals high → low for 0/1 reuse", color: "#6b7684" },
    ],
    cellLabel: "number / subtotal",
    valueLabel: "ways",
    answerNote: "target = plusSum − minusSum, so choosing plus-signed values is enough",
  };

  if (Math.abs(target) > total || (total + target) % 2 !== 0) {
    const reason = Math.abs(target) > total
      ? "|target| " + Math.abs(target) + " > total " + total
      : "total + target = " + (total + target) + " is odd";
    return {
      ...common,
      early: true,
      rowLabels: ["ε"],
      colLabels: ["ε"],
      earlyTitle: "early return 0",
      earlySub: reason,
      earlyStatus: "the plus/minus split is impossible → return 0",
      earlyDetail: "all plus-signed values must sum to a whole number (total + target) / 2",
      earlyFormula: "abs(target) > total or (total + target) % 2",
      earlyLines: [3, 4, 5],
      answer: 0,
      answerText: "answer = 0",
      introLines: [1, 2, 3],
      finalLines: [12],
      finalStatus: "return 0",
      finalDetail: "no assignment can reach this target",
      formatValue: value => String(value),
      resultText: "return 0",
      resultNote: reason,
    };
  }

  const goal = (total + target) / 2;
  const R = nums.length + 1, Cn = goal + 1;
  const dp = Array.from({ length: R }, () => new Array(Cn).fill(0));
  dp[0][0] = 1;
  const prefill = [{ i: 0, j: 0, value: 1 }];
  for (let j = 1; j < Cn; j++) prefill.push({ i: 0, j, value: 0 });

  const steps = [];
  for (let i = 1; i < R; i++) {
    const num = nums[i - 1];
    for (let subtotal = goal; subtotal >= 0; subtotal--) {
      if (subtotal < num) {
        dp[i][subtotal] = dp[i - 1][subtotal];
        steps.push({
          i, j: subtotal, value: dp[i][subtotal],
          parents: [[i - 1, subtotal]],
          lines: [9, 10],
          formula: "subtotal " + subtotal + " < num " + num + " → skip",
          status: "subtotal " + subtotal + " < " + num + " → this number cannot be chosen",
          detail: "the count carries over unchanged from the previous row",
          log: subtotal === goal,
        });
      } else {
        const skip = dp[i - 1][subtotal];
        const take = dp[i - 1][subtotal - num];
        dp[i][subtotal] = skip + take;
        steps.push({
          i, j: subtotal, value: dp[i][subtotal], tone: "match",
          parents: [[i - 1, subtotal], [i - 1, subtotal - num]],
          lines: [9, 10, 11],
          formula: "skip " + skip + " + choose " + take + " = " + dp[i][subtotal],
          status: "num " + num + ": skip " + skip + " + choose " + take +
            " = " + dp[i][subtotal],
          detail: "choose the number once (0/1 knapsack), so the second parent is one row up",
          log: subtotal === goal,
        });
      }
    }
  }

  const answer = dp[R - 1][Cn - 1];
  return {
    ...common,
    rowLabels: ["∅"].concat(nums.map(String)),
    colLabels: Array.from({ length: Cn }, (_, j) => String(j)),
    cornerLabel: "nums \\ sum",
    dp, prefill, steps, answer,
    formatValue: value => String(value),
    coordLabel: step => "(num=" + (step.i === 0 ? "∅" : nums[step.i - 1]) +
      ", sum=" + step.j + ")",
    answerText: "goal = (" + total + " + " + target + ") / 2 = " + goal +
      " → answer = " + answer,
    introLines: [1, 2, 3, 4, 5, 6, 7, 8],
    introStatus: "goal = " + goal + " · dp[0] = 1 · descending sums prevent reuse",
    introDetail: "each row either skips the number or takes it once",
    finalLines: [12],
    finalStatus: "return dp[" + goal + "] = " + answer,
    finalDetail: "the goal column counts subsets whose plus signs give the target",
    finalFormula: "plus-signed subset reaches " + goal + " → " + answer + " assignment" +
      (answer === 1 ? "" : "s"),
    resultText: "return " + answer,
    resultNote: answer + " +/- assignment" + (answer === 1 ? "" : "s") +
      " of [" + nums.join(", ") + "] equal " + target,
  };
}
