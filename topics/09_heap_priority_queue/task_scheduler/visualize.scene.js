/* Task Scheduler — animated walkthrough scene.
 *
 * The most frequent task dictates the schedule.  We count labels, find the
 * maximum frequency f and how many labels share it (m), then compare the
 * cooldown bound (f-1)(n+1)+m with the raw number of tasks.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Task Scheduler",
    subtitle: "most frequent task sets the pace · (f−1)(n+1)+m vs len(tasks) · O(t)",
    inputs: [
      {
        id: "tasks",
        label: "tasks",
        type: "text",
        default: "A, A, A, B, B, B",
        width: "wide",
      },
      { id: "n", label: "cooldown n", type: "number", default: 2 },
    ],
    legend: [
      { color: "#58C4DD", text: "task / count" },
      { color: "#F0AC5F", text: "max frequency" },
      { color: "#5CD0B3", text: "cooldown slot" },
      { color: "#83C167", text: "answer" },
    ],
  },

  code: [
    "from collections import Counter",
    "from typing import List",
    "def least_interval(tasks: List[str], n: int) -> int:",
    "    \"\"\"Return the least number of intervals needed to run every task.\"\"\"",
    "    counts = Counter(tasks)",
    "    max_freq = max(counts.values())",
    "    # how many distinct tasks share the maximum frequency",
    "    max_freq_tasks = sum(1 for freq in counts.values() if freq == max_freq)",
    "    return max((max_freq - 1) * (n + 1) + max_freq_tasks, len(tasks))",
  ],

  read(values) {
    const raw = String(values.tasks || "").trim();
    if (!raw) return null;
    const tasks = raw.split(/[\s,]+/).filter(Boolean).map(s => s.toUpperCase());
    if (tasks.length < 1 || tasks.length > 12) return null;
    if (!tasks.every(t => /^[A-Z]$/.test(t))) return null;
    const n = Number(values.n);
    if (!Number.isInteger(n) || n < 0 || n > 5) return null;
    return { tasks, n };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const tasks = args[0].map(s => String(s).toUpperCase());
      const n = Number(args[1]);
      if (tasks.length >= 1 && tasks.length <= 12 &&
          tasks.every(t => /^[A-Z]$/.test(t)) &&
          Number.isInteger(n) && n >= 0 && n <= 5) {
        return { tasks: tasks.join(", "), n: String(n) };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const { tasks, n } = params;
    const sim = simulateScheduler(tasks, n);
    const total = tasks.length;

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-teal", C.teal);
    ctx.glow("glow-green", C.green);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const arcsL = ctx.layer("arcs");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = {
      tasks, n, sim, ctx, taskChips: [], bars: [], stripCells: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title ---------------------------------------------------------
    scene.title = txt("Task Scheduler", {
      x: 64, y: 64, "font-size": 40, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    const sub = el("text", { x: 64, y: 100, "font-size": 19, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "tasks = ";
    el("tspan", { fill: C.white }, sub).textContent = "[" + tasks.map(t => "\"" + t + "\"").join(", ") + "]";
    el("tspan", {}, sub).textContent = "     n = ";
    el("tspan", { fill: C.gold }, sub).textContent = String(n);
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // ---- task chips ----------------------------------------------------
    const gap = total > 9 ? 6 : 10;
    const chipW = clamp((1080 - gap * (total - 1)) / total, 34, 62);
    const chipH = 48;
    const totalW = total * chipW + (total - 1) * gap;
    const startX = STAGE_W / 2 - totalW / 2;
    const chipTop = 126;
    const font = clamp(chipW * 0.48, 14, 24);

    tasks.forEach((task, i) => {
      const x = startX + i * (chipW + gap);
      const g = el("g", { transform: "translate(" + x + " " + chipTop + ")" }, chipsL);
      const enter = el("g", {}, g);
      const rect = el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx: 9,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, enter);
      const t = txt(task, {
        x: chipW / 2, y: chipH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": font, fill: C.white,
      }, enter);
      const idx = txt(String(i), {
        x: chipW / 2, y: -9, "text-anchor": "middle", "font-size": 11, fill: C.grey,
      }, enter);
      setOpacity(enter, 0);
      scene.taskChips.push({ i, task, g, enter, rect, t, idx, cx: x + chipW / 2 });
    });

    const pointer = el("g", {}, ptrL);
    el("polygon", { points: "-7,-11 7,-11 0,0", fill: C.blue }, pointer);
    setOpacity(pointer, 0);
    scene.pointer = pointer;
    scene.chipBottom = chipTop + chipH;

    // ---- counts panel --------------------------------------------------
    const cX = 48, cY = 202, cW = 560, cH = 352;
    scene.countPanel = el("g", {}, chipsL);
    el("rect", {
      x: cX, y: cY, width: cW, height: cH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.countPanel);
    setOpacity(scene.countPanel, 0);
    scene.countTitle = txt("counts  ·  frequency of each label", {
      x: cX + 20, y: cY + 30, "font-size": 18, fill: C.blue,
    }, textL);
    setOpacity(scene.countTitle, 0);

    const labels = sim.labels;
    const baseline = cY + 286;
    const maxBarH = 188;
    const slotW = (cW - 70) / Math.max(labels.length, 1);
    const barW = clamp(slotW * 0.5, 22, 58);
    scene.baseline = baseline;
    scene.maxBarH = maxBarH;

    labels.forEach((label, li) => {
      const x = cX + 35 + slotW * li + (slotW - barW) / 2;
      const g = el("g", {}, chipsL);
      const bar = el("rect", {
        x, y: baseline, width: barW, height: 0, rx: Math.min(8, barW * 0.3),
        fill: C.blue, "fill-opacity": 0.85,
      }, g);
      const glow = el("rect", {
        x: x - 3, y: baseline, width: barW + 6, height: 0, rx: 9,
        fill: "none", stroke: C.gold, "stroke-width": 3, filter: "url(#glow-gold)",
      }, g);
      setOpacity(glow, 0);
      const countText = txt("0", {
        x: x + barW / 2, y: baseline - 10, "text-anchor": "middle",
        "font-size": 21, fill: C.white,
      }, g);
      const labelText = txt(label, {
        x: x + barW / 2, y: baseline + 28, "text-anchor": "middle",
        "font-size": 22, fill: C.blue,
      }, g);
      const freqBadge = txt("", {
        x: x + barW / 2, y: baseline - maxBarH - 18, "text-anchor": "middle",
        "font-size": 13, fill: C.gold,
      }, g);
      setOpacity(freqBadge, 0);
      scene.bars.push({ label, x, barW, bar, glow, countText, labelText, freqBadge, count: 0 });
    });

    // ---- formula panel -------------------------------------------------
    const fX = 632, fY = 202, fW = 600, fH = 352;
    scene.formulaPanel = el("g", {}, chipsL);
    el("rect", {
      x: fX, y: fY, width: fW, height: fH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.formulaPanel);
    setOpacity(scene.formulaPanel, 0);
    scene.formulaTitle = txt("frequency bound", {
      x: fX + 20, y: fY + 30, "font-size": 18, fill: C.gold,
    }, textL);
    setOpacity(scene.formulaTitle, 0);

    const formulaLine = (y, color, size) => {
      const t = txt("", {
        x: fX + 22, y: y, "font-size": size || 18, fill: color || C.white,
      }, textL);
      setOpacity(t, 0);
      return t;
    };
    scene.fLine = formulaLine(fY + 76, C.white, 19);
    scene.mLine = formulaLine(fY + 116, C.white, 19);
    scene.bLine = formulaLine(fY + 160, C.teal, 19);
    scene.lenLine = formulaLine(fY + 198, C.grey, 17);
    scene.ansLine = formulaLine(fY + 242, C.green, 22);
    scene.stripLabel = formulaLine(fY + 286, C.grey, 13);

    // Cooldown skeleton strip: groups of (n+1) slots.
    const bound = sim.bound;
    const stripY = fY + 316;
    const stripMaxW = fW - 44;
    const cellGap = 2;
    const cellW = clamp((stripMaxW - cellGap * (bound - 1)) / Math.max(bound, 1), 8, 26);
    const stripW = bound * cellW + (bound - 1) * cellGap;
    const stripX = fX + (fW - stripW) / 2;
    for (let i = 0; i < bound; i++) {
      const x = stripX + i * (cellW + cellGap);
      const row = Math.floor(i / (n + 1));
      const col = i % (n + 1);
      const isMax = col < sim.maxLabels.length;
      const g = el("g", {}, chipsL);
      const rect = el("rect", {
        x, y: stripY, width: cellW, height: 22, rx: 4,
        fill: isMax ? "#262015" : C.chipFill,
        stroke: isMax ? C.gold : C.greyDark, "stroke-width": 1.2,
      }, g);
      const t = txt(isMax ? sim.maxLabels[col] : "·", {
        x: x + cellW / 2, y: stripY + 11, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": clamp(cellW * 0.62, 7, 13),
        fill: isMax ? C.gold : C.grey,
      }, g);
      setOpacity(g, 0);
      scene.stripCells.push({ g, rect, t, isMax });
    }

    // ---- bottom narration ---------------------------------------------
    scene.status = txt("", {
      x: 64, y: 600, "font-size": 20, fill: C.gold,
    }, textL);
    scene.detail = txt("", {
      x: 64, y: 630, "font-size": 16, fill: C.grey,
    }, textL);
    scene.result = txt("", {
      x: STAGE_W / 2, y: 694, "text-anchor": "middle",
      "font-size": 30, fill: C.green,
    }, resultL);
    setOpacity(scene.status, 0);
    setOpacity(scene.detail, 0);
    setOpacity(scene.result, 0);

    // ---- reset ---------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.countPanel, scene.countTitle,
                          scene.formulaPanel, scene.formulaTitle, scene.fLine, scene.mLine,
                          scene.bLine, scene.lenLine, scene.ansLine, scene.stripLabel,
                          scene.status, scene.detail, scene.result]) setOpacity(node, 0);
      scene.fLine.textContent = "";
      scene.mLine.textContent = "";
      scene.bLine.textContent = "";
      scene.lenLine.textContent = "";
      scene.ansLine.textContent = "";
      scene.stripLabel.textContent = "";
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.result.textContent = "";
      for (const chip of scene.taskChips) {
        setOpacity(chip.enter, 0);
        chip.rect.setAttribute("fill", C.chipFill);
        chip.rect.setAttribute("stroke", C.greyDark);
        chip.t.setAttribute("fill", C.white);
      }
      setOpacity(scene.pointer, 0);
      for (const b of scene.bars) {
        b.count = 0;
        b.bar.setAttribute("height", "0");
        b.bar.setAttribute("y", String(baseline));
        b.bar.setAttribute("fill", C.blue);
        b.glow.setAttribute("height", "0");
        b.glow.setAttribute("y", String(baseline - 3));
        setOpacity(b.glow, 0);
        b.countText.textContent = "0";
        b.countText.setAttribute("fill", C.white);
        b.labelText.setAttribute("fill", C.blue);
        b.freqBadge.textContent = "";
        setOpacity(b.freqBadge, 0);
      }
      for (const cell of scene.stripCells) {
        setOpacity(cell.g, 0);
        cell.rect.setAttribute("fill", cell.isMax ? "#262015" : C.chipFill);
        cell.rect.setAttribute("stroke", cell.isMax ? C.gold : C.greyDark);
      }
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity, setTranslate } = ctx;
    const { tasks, n, sim } = scene;
    const easeOut = ease.outCubic;
    const baseline = scene.baseline;
    const maxBarH = scene.maxBarH;

    scene.reset();

    const status = (text, color) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || C.gold);
        setOpacity(scene.status, 1);
        scene.detail.textContent = "";
        setOpacity(scene.detail, 0);
      });
      tl.log(text, color || C.gold);
    };
    const detail = text => {
      tl.add(0.01, () => {
        scene.detail.textContent = text;
        setOpacity(scene.detail, 1);
      });
    };
    const barH = count => maxBarH * count / sim.maxFreq;

    // ---- intro ---------------------------------------------------------
    tl.line([1, 2]);
    tl.add(0.6, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    for (const chip of scene.taskChips) {
      tl.add(0.14, u => setOpacity(chip.enter, u), easeOut);
    }
    tl.line([3, 4]);
    status("tasks are run in CPU intervals; identical tasks need n intervals between them", C.blue);
    detail("the bottleneck is the task that appears most often");
    tl.add(0.4, u => {
      setOpacity(scene.countPanel, u);
      setOpacity(scene.countTitle, u);
      setOpacity(scene.formulaPanel, u);
      setOpacity(scene.formulaTitle, u);
    }, easeOut);
    tl.wait(0.1);

    // ---- count ---------------------------------------------------------
    tl.line(5);
    status("Counter(tasks)  ·  tally each label", C.blue);
    let prevChip = null;
    for (const step of sim.tally) {
      const chip = scene.taskChips[step.i];
      const bar = scene.bars.find(b => b.label === step.task);
      tl.line(5);
      if (prevChip) {
        tl.add(0.18, u => {
          setOpacity(prevChip.rect, 1);
          prevChip.rect.setAttribute("stroke", C.greyDark);
          prevChip.rect.setAttribute("fill", C.chipFill);
          prevChip.t.setAttribute("fill", C.white);
        }, easeOut);
      }
      tl.add(0.28, u => {
        setOpacity(scene.pointer, u);
        setTranslate(scene.pointer, chip.cx - 10, scene.chipBottom + 4);
      }, easeOut);
      tl.add(0.01, () => {
        chip.rect.setAttribute("stroke", C.blue);
        chip.rect.setAttribute("fill", "#132a38");
        chip.t.setAttribute("fill", C.blue);
      });
      const fromH = baseline + bar.bar.getAttribute("height") * -0 + 0; // placeholder
      const prevCount = bar.count;
      bar.count = step.count;
      const toH = barH(step.count);
      const from = maxBarH * prevCount / sim.maxFreq;
      tl.add(0.32, u => {
        const h = from + (toH - from) * u;
        bar.bar.setAttribute("height", String(h));
        bar.bar.setAttribute("y", String(baseline - h));
      }, easeOut);
      tl.add(0.01, () => {
        bar.countText.textContent = String(step.count);
      });
      prevChip = chip;
      tl.wait(0.03);
    }
    if (prevChip) {
      tl.add(0.2, u => {
        setOpacity(prevChip.rect, 1);
        prevChip.rect.setAttribute("stroke", C.greyDark);
        prevChip.rect.setAttribute("fill", C.chipFill);
        prevChip.t.setAttribute("fill", C.white);
        setOpacity(scene.pointer, 1 - u);
      }, easeOut);
    }

    // ---- max frequency -------------------------------------------------
    tl.line(6);
    status("max_freq = " + sim.maxFreq + "  ·  this task controls the schedule", C.gold);
    for (const bar of scene.bars) {
      if (bar.label === sim.maxLabels[0]) {
        tl.add(0.35, u => {
          bar.bar.setAttribute("fill", C.gold);
          bar.glow.setAttribute("height", String(barH(sim.maxFreq)));
          bar.glow.setAttribute("y", String(baseline - barH(sim.maxFreq) - 3));
          setOpacity(bar.glow, u);
          bar.countText.setAttribute("fill", C.gold);
          bar.labelText.setAttribute("fill", C.gold);
        }, easeOut);
      }
    }
    tl.add(0.01, () => {
      scene.fLine.textContent = "f = max frequency = " + sim.maxFreq;
      setOpacity(scene.fLine, 1);
    });
    tl.wait(0.1);

    // ---- how many share it --------------------------------------------
    tl.line([7, 8]);
    status("m = " + sim.maxLabels.length + " label" + (sim.maxLabels.length === 1 ? "" : "s") +
           " share frequency " + sim.maxFreq, C.gold);
    for (const bar of scene.bars) {
      if (sim.maxLabels.includes(bar.label)) {
        tl.add(0.25, u => {
          bar.freqBadge.textContent = "f = " + sim.maxFreq;
          setOpacity(bar.freqBadge, u);
        }, easeOut);
      }
    }
    tl.add(0.01, () => {
      scene.mLine.textContent = "m = " + sim.maxLabels.length + "   (" + sim.maxLabels.join(", ") + ")";
      setOpacity(scene.mLine, 1);
    });
    tl.wait(0.1);

    // ---- formula -------------------------------------------------------
    tl.line(9);
    status("cooldown bound = (f − 1)(n + 1) + m", C.teal);
    tl.add(0.01, () => {
      scene.bLine.textContent = "(" + sim.maxFreq + " − 1) × (" + n + " + 1) + " +
        sim.maxLabels.length + " = " + sim.bound;
      setOpacity(scene.bLine, 1);
      scene.lenLine.textContent = "len(tasks) = " + tasks.length;
      setOpacity(scene.lenLine, 1);
    });
    tl.add(0.45, u => {
      for (const cell of scene.stripCells) setOpacity(cell.g, u);
    }, easeOut);
    tl.add(0.01, () => {
      scene.stripLabel.textContent = "lower bound in slots  ·  gold = max-frequency tasks";
      setOpacity(scene.stripLabel, 1);
    });
    detail("the bound is a skeleton: gold cells run A/B, '·' cells are cooldown gaps");
    tl.wait(0.1);

    // ---- answer --------------------------------------------------------
    tl.line(9);
    status("answer = max(" + sim.bound + ", " + tasks.length + ") = " + sim.answer, C.green);
    tl.add(0.01, () => {
      scene.ansLine.textContent = "max(" + sim.bound + ", " + tasks.length + ") = " + sim.answer;
      setOpacity(scene.ansLine, 1);
    });
    if (sim.answer > sim.bound) {
      detail("there are more tasks than cooldown gaps, so other labels fill the idle slots back-to-back");
      tl.add(0.45, u => {
        for (const cell of scene.stripCells) {
          if (!cell.isMax) {
            cell.rect.setAttribute("fill", "#132a38");
            cell.rect.setAttribute("stroke", C.blue);
            cell.t.setAttribute("fill", C.blue);
          }
        }
      }, easeOut);
    } else if (sim.answer === sim.bound) {
      detail("the cooldown bound is the whole schedule; unused gaps would only add idle time");
    } else {
      detail("all tasks fit back-to-back in fewer slots than the cooldown skeleton");
    }
    tl.add(0.01, () => {
      scene.result.textContent = "return " + sim.answer;
      setOpacity(scene.result, 1);
    });
    tl.add(0.5, u => setOpacity(scene.result, u), easeOut);
    tl.log("return " + sim.answer, C.green);
    tl.wait(0.9);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure simulation.
 * ------------------------------------------------------------------ */

function simulateScheduler(tasks, n) {
  const counts = new Map();
  const tally = [];
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    counts.set(task, (counts.get(task) || 0) + 1);
    tally.push({ i, task, count: counts.get(task) });
  }
  const labels = [...counts.keys()].sort();
  let maxFreq = 0;
  for (const label of labels) maxFreq = Math.max(maxFreq, counts.get(label));
  const maxLabels = labels.filter(label => counts.get(label) === maxFreq);
  const bound = (maxFreq - 1) * (n + 1) + maxLabels.length;
  const answer = Math.max(bound, tasks.length);
  return { counts, labels, tally, maxFreq, maxLabels, bound, answer };
}
