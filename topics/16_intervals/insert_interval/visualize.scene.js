/* Insert Interval — animated sweep scene.
 *
 * The input intervals are already sorted.  A new interval sweeps over them:
 * intervals ending before it starts are copied through, intervals starting
 * before it ends widen it, and everything left is copied after it.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Insert Interval",
    subtitle: "keep · absorb / widen · append · one linear sweep over sorted intervals",
    inputs: [
      { id: "intervals", label: "intervals (a-b, c-d)", type: "text", default: "1-3, 6-9", width: "wide" },
      { id: "new_interval", label: "new interval", type: "text", default: "2-5" },
    ],
    legend: [
      { color: "#58C4DD", text: "existing interval" },
      { color: "#F0AC5F", text: "new / widening" },
      { color: "#83C167", text: "kept in result" },
      { color: "#FC6255", text: "absorbed" },
    ],
  },

  code: [
    "def insert(intervals: List[List[int]], new_interval: List[int]) -> List[List[int]]:",
    "    \"\"\"Insert ``new_interval`` into ``intervals`` and merge any overlaps.\"\"\"",
    "    result: List[List[int]] = []",
    "    i, n = 0, len(intervals)",
    "    start, end = new_interval",
    "    # 1. Intervals that end strictly before the new one starts: keep as-is.",
    "    while i < n and intervals[i][1] < start:",
    "        result.append(intervals[i])",
    "        i += 1",
    "    # 2. Intervals that overlap the new one: absorb them by widening [start, end].",
    "    while i < n and intervals[i][0] <= end:",
    "        start = min(start, intervals[i][0])",
    "        end = max(end, intervals[i][1])",
    "        i += 1",
    "    result.append([start, end])",
    "    # 3. Everything else comes after the merged interval.",
    "    while i < n:",
    "        result.append(intervals[i])",
    "        i += 1",
    "    return result",
  ],

  read(values) {
    const intervals = parseIntervalText(values.intervals);
    const merged = parseIntervalText(values.new_interval);
    if (!intervals || !merged || merged.length !== 1) return null;
    if (intervals.length > 8) return null;
    for (let i = 1; i < intervals.length; i++) {
      if (intervals[i][0] < intervals[i - 1][1]) return null;
    }
    return { intervals, newInterval: merged[0] };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || args.length !== 2) return null;
    const [intervals, newInterval] = args;
    if (!Array.isArray(intervals) || !Array.isArray(newInterval)) return null;
    if (intervals.length > 8 || newInterval.length !== 2) return null;
    if (!intervals.every(pair => Array.isArray(pair) && pair.length === 2)) return null;
    return {
      intervals: intervals.map(pair => pair[0] + "-" + pair[1]).join(", "),
      new_interval: newInterval[0] + "-" + newInterval[1],
    };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, STAGE_W } = ctx;
    const { intervals, newInterval } = params;
    const sim = simulateInsert(intervals, newInterval);
    const maxResult = Math.max(1, sim.result.length);

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
      intervals, newInterval, sim, ctx, bars: [], resultBars: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title ---------------------------------------------------------
    scene.title = txt("Insert Interval", {
      x: 64, y: 62, "font-size": 40, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    const sub = el("text", { x: 64, y: 98, "font-size": 18, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "new interval = ";
    el("tspan", { fill: C.gold }, sub).textContent =
      "[" + newInterval[0] + ", " + newInterval[1] + "]";
    el("tspan", { fill: C.grey }, sub).textContent = "     " + intervals.length +
      " sorted interval" + (intervals.length === 1 ? "" : "s");
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // ---- axis ----------------------------------------------------------
    const axis = makeIntervalAxis(
      intervals.flatMap(pair => pair).concat(newInterval, sim.result.flatMap(pair => pair)),
      100, 1200, 0.08
    );
    const axisY = 205;
    const axisG = el("g", {}, chipsL);
    el("line", {
      x1: axis.x0, y1: axisY, x2: axis.x1, y2: axisY,
      stroke: C.greyDark, "stroke-width": 2,
    }, axisG);
    for (const tick of axis.ticks) {
      el("line", {
        x1: axis.sx(tick), y1: axisY - 5, x2: axis.sx(tick), y2: axisY + 6,
        stroke: C.greyDark, "stroke-width": 1.5,
      }, axisG);
      txt(String(tick), {
        x: axis.sx(tick), y: axisY + 22, "text-anchor": "middle",
        "font-size": 10, fill: C.grey,
      }, axisG);
    }
    setOpacity(axisG, 0);
    scene.axisG = axisG;

    scene.phase = txt("phase 1 · keep intervals that end before start", {
      x: 64, y: 142, "font-size": 16, fill: C.blue,
    }, textL);
    scene.vars = txt("i = 0 · start = " + newInterval[0] + " · end = " + newInterval[1], {
      x: 760, y: 142, "font-size": 15, fill: C.gold,
    }, textL);
    setOpacity(scene.phase, 0);
    setOpacity(scene.vars, 0);

    // ---- lanes ---------------------------------------------------------
    const laneLabel = (text, y, color) => {
      const node = txt(text, { x: 64, y: y, "font-size": 12, fill: color || C.grey }, textL);
      setOpacity(node, 0);
      return node;
    };
    scene.newLabel = laneLabel("new interval", 240, C.gold);
    scene.inputLabel = laneLabel("intervals", 296, C.blue);
    scene.resultLabel = laneLabel("result", 388, C.green);

    const barH = 32;
    const newBarY = 246, inputBarY = 304, resultBarY = 396;

    // new interval bar (dynamic)
    const newG = el("g", {}, chipsL);
    const newRect = el("rect", {
      x: axis.sx(newInterval[0]), y: newBarY,
      width: Math.max(4, axis.sx(newInterval[1]) - axis.sx(newInterval[0])),
      height: barH, rx: 7, fill: "#262015", stroke: C.gold, "stroke-width": 2.5,
      filter: "url(#glow-gold)",
    }, newG);
    const newText = txt("[" + newInterval[0] + ", " + newInterval[1] + "]", {
      x: 0, y: newBarY + barH / 2 + 1, "text-anchor": "middle",
      "dominant-baseline": "central", "font-size": 13, fill: C.gold,
    }, newG);
    setOpacity(newG, 0);
    scene.newG = newG;
    scene.newRect = newRect;
    scene.newText = newText;

    // existing intervals
    intervals.forEach((pair, i) => {
      const x = axis.sx(pair[0]);
      const w = Math.max(4, axis.sx(pair[1]) - x);
      const g = el("g", {}, chipsL);
      const rect = el("rect", {
        x, y: inputBarY, width: w, height: barH, rx: 7,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, g);
      const label = txt("[" + pair[0] + ", " + pair[1] + "]", {
        x: x + w / 2, y: inputBarY + barH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": w > 58 ? 12 : 9,
        fill: C.white,
      }, g);
      const idx = txt("i=" + i, {
        x, y: inputBarY - 6, "font-size": 9, fill: C.grey,
      }, g);
      setOpacity(g, 0);
      scene.bars.push({ i, pair, g, rect, label, idx });
    });

    if (!intervals.length) {
      scene.emptyInput = txt("intervals = []", {
        x: axis.x0, y: inputBarY + 20, "font-size": 16, fill: C.grey,
      }, textL);
      setOpacity(scene.emptyInput, 0);
    }

    // result bars
    for (let i = 0; i < maxResult; i++) {
      const g = el("g", {}, chipsL);
      const rect = el("rect", {
        x: 0, y: resultBarY, width: 0, height: barH, rx: 7,
        fill: "#17251a", stroke: C.green, "stroke-width": 2,
      }, g);
      const label = txt("", {
        x: 0, y: resultBarY + barH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": 12, fill: C.green,
      }, g);
      setOpacity(g, 0);
      scene.resultBars.push({ g, rect, label });
    }

    scene.resultList = txt("result = []", {
      x: 64, y: 476, "font-size": 16, fill: C.green,
    }, textL);
    setOpacity(scene.resultList, 0);

    // ---- narration -----------------------------------------------------
    scene.status = txt("", {
      x: 64, y: 600, "font-size": 20, fill: C.gold,
    }, textL);
    scene.detail = txt("", {
      x: 64, y: 630, "font-size": 16, fill: C.grey,
    }, textL);
    scene.result = txt("", {
      x: STAGE_W / 2, y: 690, "text-anchor": "middle",
      "font-size": 26, fill: C.green,
    }, resultL);
    for (const node of [scene.status, scene.detail, scene.result]) setOpacity(node, 0);

    // ---- state helpers -------------------------------------------------
    scene.setNew = (start, end) => {
      const x = axis.sx(start);
      const w = Math.max(4, axis.sx(end) - x);
      scene.newRect.setAttribute("x", x);
      scene.newRect.setAttribute("width", w);
      scene.newText.setAttribute("x", x + w / 2);
      scene.newText.textContent = "[" + start + ", " + end + "]";
      scene.newText.setAttribute("font-size", w > 58 ? 13 : 9);
    };

    scene.setBars = (kept, mergedFrom, absorbed, current) => {
      const keptSet = new Set(kept);
      const mergedSet = new Set(mergedFrom);
      for (const bar of scene.bars) {
        let fill = C.chipFill, stroke = C.greyDark, color = C.white;
        if (keptSet.has(bar.i)) {
          fill = "#17251a"; stroke = C.green; color = C.green;
        } else if (mergedSet.has(bar.i)) {
          fill = "#2a1515"; stroke = C.red; color = C.red;
        }
        if (bar.i === current) {
          fill = "#262015"; stroke = C.gold; color = C.gold;
        }
        if (bar.i === absorbed && !mergedSet.has(bar.i)) {
          fill = "#2a1515"; stroke = C.red; color = C.red;
        }
        bar.rect.setAttribute("fill", fill);
        bar.rect.setAttribute("stroke", stroke);
        bar.label.setAttribute("fill", color);
      }
    };

    scene.setResult = result => {
      for (let i = 0; i < scene.resultBars.length; i++) {
        const bar = scene.resultBars[i];
        if (i < result.length) {
          const [a, b] = result[i];
          const x = axis.sx(a);
          const w = Math.max(4, axis.sx(b) - x);
          bar.rect.setAttribute("x", x);
          bar.rect.setAttribute("width", w);
          bar.label.setAttribute("x", x + w / 2);
          bar.label.textContent = "[" + a + ", " + b + "]";
          bar.label.setAttribute("font-size", w > 52 ? 12 : 9);
          setOpacity(bar.g, 1);
        } else {
          setOpacity(bar.g, 0);
        }
      }
      scene.resultList.textContent = "result = " + formatPairs(result);
    };

    // ---- reset ---------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.axisG, scene.phase, scene.vars,
                          scene.newLabel, scene.inputLabel, scene.resultLabel,
                          scene.newG, scene.emptyInput, scene.resultList,
                          scene.status, scene.detail, scene.result]) {
        if (node) setOpacity(node, 0);
      }
      for (const bar of scene.bars) setOpacity(bar.g, 0);
      for (const bar of scene.resultBars) setOpacity(bar.g, 0);
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.result.textContent = "";
      scene.resultList.textContent = "result = []";
      scene.phase.textContent = "phase 1 · keep intervals that end before start";
      scene.vars.textContent = "i = 0 · start = " + newInterval[0] + " · end = " + newInterval[1];
      scene.setNew(newInterval[0], newInterval[1]);
      scene.setBars([], [], null, null);
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity } = ctx;
    const { intervals, newInterval, sim } = scene;
    const easeOut = ease.outCubic;

    scene.reset();

    const status = (text, color, det, log) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || C.gold);
        setOpacity(scene.status, 1);
        if (det !== undefined) {
          scene.detail.textContent = det;
          setOpacity(scene.detail, 1);
        }
      });
      if (log !== false) tl.log(text, color || C.gold, { hold: false });
    };

    const setNew = (start, end) => tl.add(0.01, () => scene.setNew(start, end));
    const setBars = (kept, mergedFrom, absorbed, current) =>
      tl.add(0.01, () => scene.setBars(kept, mergedFrom, absorbed, current));
    const setResult = result => tl.add(0.01, () => scene.setResult(result));

    // ---- intro ---------------------------------------------------------
    tl.line([1, 2, 3, 4, 5]);
    tl.add(0.55, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    for (const node of [scene.axisG, scene.phase, scene.vars, scene.newLabel,
                        scene.inputLabel, scene.resultLabel]) {
      tl.add(0.14, u => setOpacity(node, u), easeOut);
    }
    for (const bar of scene.bars) tl.add(0.08, u => setOpacity(bar.g, u), easeOut);
    if (scene.emptyInput) tl.add(0.2, u => setOpacity(scene.emptyInput, u), easeOut);
    tl.add(0.2, u => setOpacity(scene.newG, u), easeOut);
    tl.add(0.2, u => setOpacity(scene.resultList, u), easeOut);
    setNew(newInterval[0], newInterval[1]);
    setBars([], [], null, 0);
    status("start with i = 0 and the new interval [" + newInterval[0] + ", " +
      newInterval[1] + "]", C.blue,
      "the intervals are already sorted by start", true);
    tl.wait(0.1);

    // ---- events --------------------------------------------------------
    for (const ev of sim.events) {
      if (ev.kind === "keep") {
        tl.line(ev.phase === 1 ? [6, 7, 8, 9] : [16, 17, 18, 19]);
        setBars(ev.kept, ev.mergedFrom, null, ev.index);
        setResult(ev.result);
        scene.phase.textContent = ev.phase === 1
          ? "phase 1 · keep intervals that end before start"
          : "phase 3 · append everything after the merged interval";
        scene.vars.textContent = "i = " + ev.index + " · start = " + ev.start + " · end = " + ev.end;
        status(ev.phase === 1
          ? "[" + ev.result[ev.result.length - 1].join(", ") + "] ends before start → keep"
          : "[" + ev.result[ev.result.length - 1].join(", ") + "] comes after end → append",
          C.green,
          ev.phase === 1
            ? "intervals[i][1] < start, so this interval is already in its final place"
            : "the remaining intervals start after the merged interval ends", true);
      } else if (ev.kind === "absorb") {
        tl.line([10, 11, 12, 13, 14]);
        setNew(ev.start, ev.end);
        setBars(ev.kept, ev.mergedFrom, ev.index, ev.index);
        scene.phase.textContent = "phase 2 · absorb overlapping intervals";
        scene.vars.textContent = "i = " + ev.index + " · start = " + ev.start + " · end = " + ev.end;
        status("[" + intervals[ev.index].join(", ") + "] overlaps → widen to [" +
          ev.start + ", " + ev.end + "]", C.gold,
          "start = min(start, intervals[i][0]) and end = max(end, intervals[i][1])", true);
      } else if (ev.kind === "emit") {
        tl.line(15);
        setNew(ev.start, ev.end);
        setResult(ev.result);
        setBars(ev.kept, ev.mergedFrom, null, null);
        scene.phase.textContent = "phase 2 · emit the merged interval";
        scene.vars.textContent = "i = " + ev.index + " · merged = [" + ev.start + ", " + ev.end + "]";
        status("append merged interval [" + ev.start + ", " + ev.end + "]", C.green,
          "nothing else overlaps it after the widening pass", true);
      } else if (ev.kind === "done") {
        tl.line(20);
        setResult(ev.result);
        setBars(ev.kept, ev.mergedFrom, null, null);
        status("return " + ev.result.length + " interval" +
          (ev.result.length === 1 ? "" : "s"), C.green,
          "phase 1 + phase 2 + phase 3 cover the whole input exactly once", true);
      }
      tl.wait(0.04);
    }

    // ---- final answer --------------------------------------------------
    tl.add(0.01, () => {
      scene.result.textContent = "return " + sim.result.length + " interval" +
        (sim.result.length === 1 ? "" : "s");
      setOpacity(scene.result, 1);
    });
    tl.add(0.5, u => setOpacity(scene.result, u), easeOut);
    tl.log("return " + formatPairs(sim.result), C.green);
    tl.wait(0.8);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Parsing, axis, simulation.
 * ------------------------------------------------------------------ */

function parseIntervalText(raw) {
  const text = String(raw == null ? "" : raw).trim();
  if (!text) return [];
  const parts = text.split(/[;,]+/).map(part => part.trim()).filter(Boolean);
  const pairs = [];
  for (const part of parts) {
    const m = /^(-?\d+)\s*-\s*(-?\d+)$/.exec(part);
    if (!m) return null;
    const a = Number(m[1]), b = Number(m[2]);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a > b || Math.abs(a) > 999 || Math.abs(b) > 999) {
      return null;
    }
    pairs.push([a, b]);
  }
  return pairs;
}

function formatPairs(pairs) {
  return "[" + pairs.map(pair => "[" + pair[0] + ", " + pair[1] + "]").join(", ") + "]";
}

function makeIntervalAxis(values, x0, x1, padRatio) {
  const finite = values.filter(v => Number.isFinite(v));
  let lo = finite.length ? Math.min(...finite) : 0;
  let hi = finite.length ? Math.max(...finite) : 1;
  if (hi === lo) { hi += 1; lo -= 1; }
  const pad = Math.max(1, Math.ceil((hi - lo) * (padRatio || 0.08)));
  lo -= pad;
  hi += pad;
  const span = hi - lo;
  const rawStep = span / 8;
  const pow = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / pow;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * pow;
  const ticks = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) {
    ticks.push(Number(v.toFixed(6)));
  }
  const sx = v => x0 + (v - lo) / span * (x1 - x0);
  return { lo, hi, x0, x1, sx, ticks };
}

function simulateInsert(intervals, newInterval) {
  const events = [];
  const result = [];
  const kept = [];
  const mergedFrom = [];
  let i = 0;
  let start = newInterval[0];
  let end = newInterval[1];
  const n = intervals.length;

  const snapshot = (kind, extra) => {
    events.push({
      kind,
      kept: kept.slice(),
      mergedFrom: mergedFrom.slice(),
      result: result.map(pair => pair.slice()),
      start, end, index: i,
      ...(extra || {}),
    });
  };

  while (i < n && intervals[i][1] < start) {
    result.push(intervals[i].slice());
    kept.push(i);
    snapshot("keep", { phase: 1 });
    i += 1;
  }
  while (i < n && intervals[i][0] <= end) {
    start = Math.min(start, intervals[i][0]);
    end = Math.max(end, intervals[i][1]);
    mergedFrom.push(i);
    snapshot("absorb", { phase: 2 });
    i += 1;
  }
  result.push([start, end]);
  snapshot("emit", { phase: 2 });
  while (i < n) {
    result.push(intervals[i].slice());
    kept.push(i);
    snapshot("keep", { phase: 3 });
    i += 1;
  }
  snapshot("done", { phase: 4, start, end, index: i });
  return { events, result };
}
