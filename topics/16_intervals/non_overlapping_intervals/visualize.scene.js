/* Non-overlapping Intervals — greedy-by-earliest-end scene.
 *
 * Sort by end, keep the first interval, then keep every later interval that
 * starts at or after the last kept end.  Anything starting earlier is removed.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Non-overlapping Intervals",
    subtitle: "sort by end · greedily keep the earliest-finishing compatible interval",
    inputs: [
      { id: "intervals", label: "intervals (a-b, c-d)", type: "text", default: "1-2, 2-3, 3-4, 1-3", width: "wide" },
    ],
    legend: [
      { color: "#83C167", text: "kept" },
      { color: "#FC6255", text: "removed" },
      { color: "#F0AC5F", text: "current" },
      { color: "#58C4DD", text: "prev_end marker" },
    ],
  },

  code: [
    "def erase_overlap_intervals(intervals: List[List[int]]) -> int:",
    "    \"\"\"Greedily keep the interval that ends earliest, counting the rest.\"\"\"",
    "    if not intervals:",
    "        return 0",
    "    # Sort by END: keeping the earliest-ending compatible interval is optimal.",
    "    intervals = sorted(intervals, key=lambda pair: pair[1])",
    "    removed = 0",
    "    prev_end = intervals[0][1]",
    "    for start, end in intervals[1:]:",
    "        if start < prev_end:      # overlaps the last kept interval",
    "            removed += 1",
    "        else:                     # compatible: keep it and advance",
    "            prev_end = end",
    "    return removed",
  ],

  read(values) {
    const intervals = parseIntervalText(values.intervals);
    if (!intervals || intervals.length > 9) return null;
    return { intervals };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || args.length !== 1) return null;
    const intervals = args[0];
    if (!Array.isArray(intervals) || intervals.length > 9) return null;
    if (!intervals.every(pair => Array.isArray(pair) && pair.length === 2)) return null;
    return { intervals: intervals.map(pair => pair[0] + "-" + pair[1]).join(", ") };
  },

  buildScene(params, ctx) {
    const { el, txt, C, setOpacity, STAGE_W } = ctx;
    const { intervals } = params;
    const sim = simulateErase(intervals);

    ctx.backdrop();
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-red", C.red);
    ctx.glow("glow-gold", C.gold);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const barsL = ctx.layer("chips");
    const resultL = ctx.layer("result");

    const scene = { intervals, sim, ctx, bars: [], _writers: [] };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    scene.title = txt("Non-overlapping Intervals", {
      x: 64, y: 62, "font-size": 40, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    scene.subtitle = txt("sort by end · keep the earliest finish · count everything that still overlaps", {
      x: 64, y: 98, "font-size": 18, fill: C.grey,
    }, textL);
    setOpacity(scene.subtitle, 0);

    const axis = makeIntervalAxis(
      intervals.flatMap(pair => pair), 100, 1200, 0.08
    );
    const axisY = 188;
    const axisG = el("g", {}, barsL);
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
        x: axis.sx(tick), y: axisY + 21, "text-anchor": "middle",
        "font-size": 10, fill: C.grey,
      }, axisG);
    }
    setOpacity(axisG, 0);
    scene.axisG = axisG;

    scene.phase = txt("sort intervals by end", {
      x: 64, y: 142, "font-size": 16, fill: C.blue,
    }, textL);
    scene.vars = txt("removed = 0 · prev_end = —", {
      x: 840, y: 142, "font-size": 15, fill: C.gold,
    }, textL);
    setOpacity(scene.phase, 0);
    setOpacity(scene.vars, 0);

    // ---- sorted lanes --------------------------------------------------
    const barH = 25, laneGap = 35, firstLane = 236;
    const lastLaneBottom = firstLane + Math.max(0, intervals.length - 1) * laneGap + barH;
    const sorted = sim.sorted;
    const sortedOrder = sim.sortedOrder;

    sorted.forEach((pair, pos) => {
      const orig = sortedOrder[pos];
      const y = firstLane + pos * laneGap;
      const x = axis.sx(pair[0]);
      const w = Math.max(5, axis.sx(pair[1]) - x);
      const g = el("g", {}, barsL);
      const rect = el("rect", {
        x, y, width: w, height: barH, rx: 6,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, g);
      const label = txt("[" + pair[0] + ", " + pair[1] + "]", {
        x: x + w / 2, y: y + barH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": w > 52 ? 12 : 9,
        fill: C.white,
      }, g);
      const tag = txt("#" + orig, {
        x, y: y - 4, "font-size": 9, fill: C.grey,
      }, g);
      setOpacity(tag, 0);
      setOpacity(g, 0);
      scene.bars.push({ pair, pos, orig, y, g, rect, label, tag });
    });

    if (!intervals.length) {
      scene.empty = txt("intervals = []  →  nothing to remove", {
        x: 64, y: 300, "font-size": 22, fill: C.grey,
      }, textL);
      setOpacity(scene.empty, 0);
    }

    // prev_end marker
    const marker = el("g", {}, barsL);
    const markerLine = el("line", {
      x1: axis.x0, y1: axisY + 8, x2: axis.x0, y2: lastLaneBottom + 10,
      stroke: C.blue, "stroke-width": 2, "stroke-dasharray": "5 5",
    }, marker);
    const markerCap = el("path", {
      d: "M -6 0 L 6 0 L 0 9 Z", fill: C.blue,
    }, marker);
    setOpacity(marker, 0);
    scene.marker = marker;
    scene.markerLine = markerLine;
    scene.markerCap = markerCap;

    // overlap shading on the current lane
    const overlapRect = el("rect", {
      x: 0, y: 0, width: 0, height: barH, rx: 4,
      fill: "#3a1717", stroke: C.red, "stroke-width": 1.5,
      "stroke-dasharray": "4 4",
    }, barsL);
    setOpacity(overlapRect, 0);
    scene.overlapRect = overlapRect;

    // ---- counters ------------------------------------------------------
    scene.removedPanel = el("g", {}, resultL);
    el("rect", {
      x: 64, y: 575, width: 270, height: 66, rx: 10,
      fill: "#1b1214", stroke: C.red, "stroke-width": 2,
    }, scene.removedPanel);
    txt("removed", {
      x: 84, y: 600, "font-size": 12, fill: C.grey,
    }, scene.removedPanel);
    const removedNum = txt("0", {
      x: 84, y: 628, "font-size": 28, fill: C.red,
    }, scene.removedPanel);
    scene.removedNum = removedNum;

    scene.keptPanel = el("g", {}, resultL);
    el("rect", {
      x: 352, y: 575, width: 270, height: 66, rx: 10,
      fill: "#121b14", stroke: C.green, "stroke-width": 2,
    }, scene.keptPanel);
    txt("kept", {
      x: 372, y: 600, "font-size": 12, fill: C.grey,
    }, scene.keptPanel);
    const keptNum = txt("0", {
      x: 372, y: 628, "font-size": 28, fill: C.green,
    }, scene.keptPanel);
    scene.keptNum = keptNum;
    for (const node of [scene.removedPanel, scene.keptPanel]) setOpacity(node, 0);

    scene.status = txt("", { x: 64, y: 670, "font-size": 20, fill: C.gold }, textL);
    scene.detail = txt("", { x: 760, y: 670, "font-size": 15, fill: C.grey }, textL);
    scene.final = txt("", {
      x: STAGE_W / 2, y: 705, "text-anchor": "middle", "font-size": 24, fill: C.green,
    }, resultL);
    for (const node of [scene.status, scene.detail, scene.final]) setOpacity(node, 0);

    // ---- helpers -------------------------------------------------------
    scene.setBars = (current, kept, removed, done) => {
      const keptSet = new Set(kept);
      const removedSet = new Set(removed);
      for (const bar of scene.bars) {
        let fill = C.chipFill, stroke = C.greyDark, color = C.white;
        if (keptSet.has(bar.pos)) {
          fill = "#17251a"; stroke = C.green; color = C.green;
        } else if (removedSet.has(bar.pos)) {
          fill = "#2a1515"; stroke = C.red; color = C.red;
        }
        if (!done && bar.pos === current) {
          fill = removedSet.has(bar.pos) ? "#2a1515" : "#262015";
          stroke = removedSet.has(bar.pos) ? C.red : C.gold;
          color = removedSet.has(bar.pos) ? C.red : C.gold;
        }
        bar.rect.setAttribute("fill", fill);
        bar.rect.setAttribute("stroke", stroke);
        bar.label.setAttribute("fill", color);
        bar.tag.setAttribute("fill", bar.pos === current ? C.gold : C.grey);
      }
      scene.removedNum.textContent = String(removed.length);
      scene.keptNum.textContent = String(kept.length);
    };

    scene.setMarker = prevEnd => {
      if (prevEnd == null) {
        setOpacity(scene.marker, 0);
        return;
      }
      const x = axis.sx(prevEnd);
      scene.markerLine.setAttribute("x1", x);
      scene.markerLine.setAttribute("x2", x);
      scene.markerCap.setAttribute("transform", "translate(" + x + "," + (axisY + 8) + ")");
      setOpacity(scene.marker, 1);
    };

    scene.showOverlap = (on, start, end, y) => {
      if (!on) {
        setOpacity(scene.overlapRect, 0);
        return;
      }
      const x = axis.sx(start);
      const x2 = axis.sx(end);
      scene.overlapRect.setAttribute("x", x);
      scene.overlapRect.setAttribute("y", y - 2);
      scene.overlapRect.setAttribute("width", Math.max(2, x2 - x));
      setOpacity(scene.overlapRect, 1);
    };

    scene.setSortOffsets = amount => {
      for (const bar of scene.bars) {
        const dy = (bar.orig - bar.pos) * laneGap * (1 - amount);
        bar.g.setAttribute("transform", "translate(0," + dy.toFixed(2) + ")");
      }
    };

    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.axisG, scene.phase, scene.vars,
                          scene.marker, scene.overlapRect, scene.removedPanel,
                          scene.keptPanel, scene.status, scene.detail, scene.final,
                          scene.empty]) {
        if (node) setOpacity(node, 0);
      }
      for (const bar of scene.bars) {
        setOpacity(bar.g, 0);
        setOpacity(bar.tag, 0);
        if (bar.g.removeAttribute) bar.g.removeAttribute("transform");
        else bar.g.setAttribute("transform", "");
      }
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.final.textContent = "";
      scene.removedNum.textContent = "0";
      scene.keptNum.textContent = "0";
      scene.phase.textContent = "sort intervals by end";
      scene.vars.textContent = "removed = 0 · prev_end = —";
      scene.setSortOffsets(0);
      scene.setBars(null, [], [], false);
      scene.setMarker(null);
      scene.showOverlap(false);
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity } = ctx;
    const { sim, intervals } = scene;
    const easeOut = ease.outCubic;
    const easeMove = ease.inOutSine;

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
    const setBars = (current, kept, removed, done) =>
      tl.add(0.01, () => scene.setBars(current, kept, removed, done));
    const setMarker = prevEnd => tl.add(0.01, () => scene.setMarker(prevEnd));
    const showOverlap = (on, start, end, y) =>
      tl.add(0.01, () => scene.showOverlap(on, start, end, y));

    // ---- intro ---------------------------------------------------------
    tl.line([1, 2]);
    tl.add(0.55, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    for (const node of [scene.axisG, scene.phase, scene.vars,
                        scene.removedPanel, scene.keptPanel]) {
      tl.add(0.12, u => setOpacity(node, u), easeOut);
    }
    scene.setSortOffsets(0);
    for (const bar of scene.bars) tl.add(0.09, u => setOpacity(bar.g, u), easeOut);
    if (scene.empty) tl.add(0.2, u => setOpacity(scene.empty, u), easeOut);
    setBars(null, [], [], false);
    status(intervals.length + " intervals · sort by end, not by start", C.blue,
      "an early finish leaves the most room for everything that follows", true);
    tl.wait(0.08);

    // ---- sort ----------------------------------------------------------
    tl.line([5, 6]);
    status("sorted by end · keep the earliest-finishing interval first", C.blue,
      "the original index stays on each bar (#0, #1, ...)", true);
    tl.add(0.65, u => scene.setSortOffsets(easeMove(u)), u => u);
    tl.add(0.01, () => scene.setSortOffsets(1));
    tl.add(0.18, u => {
      for (const bar of scene.bars) setOpacity(bar.tag, u);
    }, easeOut);
    tl.wait(0.05);

    if (!intervals.length) {
      tl.line([3, 4]);
      setMarker(null);
      status("no intervals → return 0", C.green, "the empty case is handled up front", true);
      tl.line([14]);
      tl.add(0.01, () => {
        scene.final.textContent = "return 0";
        setOpacity(scene.final, 1);
      });
      tl.add(0.5, u => setOpacity(scene.final, u), easeOut);
      tl.log("return 0", C.green);
      tl.wait(0.8);
      return tl.finish();
    }

    // ---- first interval ------------------------------------------------
    tl.line([7, 8]);
    setBars(0, [0], [], false);
    setMarker(sim.prevEnds[0]);
    scene.vars.textContent = "removed = 0 · prev_end = " + sim.prevEnds[0];
    status("keep the first interval · prev_end = " + sim.prevEnds[0], C.green,
      "its end is the earliest finish among all intervals", true);
    tl.wait(0.05);

    // ---- events --------------------------------------------------------
    for (const ev of sim.events) {
      if (ev.kind === "remove") {
        tl.line([9, 10, 11]);
        setBars(ev.pos, ev.kept, ev.removed, false);
        showOverlap(true, ev.start, ev.prevEnd, ev.y);
        scene.vars.textContent = "removed = " + ev.removed.length + " · prev_end = " + ev.prevEnd;
        status("[" + ev.start + ", " + ev.end + "] starts before prev_end " +
          ev.prevEnd + " → remove", C.red,
          "it overlaps the last kept interval · removed becomes " + ev.removed.length, true);
      } else if (ev.kind === "keep") {
        tl.line([9, 12, 13]);
        setBars(ev.pos, ev.kept, ev.removed, false);
        showOverlap(false);
        setMarker(ev.prevEnd);
        scene.vars.textContent = "removed = " + ev.removed.length + " · prev_end = " + ev.prevEnd;
        status("[" + ev.start + ", " + ev.end + "] starts at or after prev_end → keep", C.green,
          "advance prev_end to " + ev.prevEnd + " · it touches, so it does not overlap", true);
      } else if (ev.kind === "done") {
        tl.line([14]);
        setBars(null, ev.kept, ev.removed, true);
        showOverlap(false);
        scene.vars.textContent = "removed = " + ev.removed.length + " · kept = " + ev.kept.length;
        status("return " + ev.removed.length + " removal" +
          (ev.removed.length === 1 ? "" : "s"), C.green,
          "greedy by earliest end is optimal: " + ev.kept.length +
          " intervals remain non-overlapping", true);
      }
      tl.wait(0.04);
    }

    tl.add(0.01, () => {
      scene.final.textContent = "return " + sim.removedCount;
      setOpacity(scene.final, 1);
    });
    tl.add(0.5, u => setOpacity(scene.final, u), easeOut);
    tl.log("return " + sim.removedCount, C.green);
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
    if (!Number.isFinite(a) || !Number.isFinite(b) || a > b ||
        Math.abs(a) > 999 || Math.abs(b) > 999) return null;
    pairs.push([a, b]);
  }
  return pairs;
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

function simulateErase(intervals) {
  const sortedOrder = intervals.map((_, i) => i)
    .sort((a, b) => intervals[a][1] - intervals[b][1] || a - b);
  const sorted = sortedOrder.map(i => intervals[i].slice());
  if (!sorted.length) {
    return {
      sorted, sortedOrder, events: [], kept: [], removed: [],
      prevEnds: [], removedCount: 0,
    };
  }
  const kept = [0];
  const removed = [];
  const prevEnds = [sorted[0][1]];
  const events = [];
  let prevEnd = sorted[0][1];
  for (let pos = 1; pos < sorted.length; pos++) {
    const [start, end] = sorted[pos];
    if (start < prevEnd) {
      removed.push(pos);
      events.push({
        kind: "remove", pos, start, end, prevEnd,
        kept: kept.slice(), removed: removed.slice(),
        y: 236 + pos * 35,
      });
    } else {
      kept.push(pos);
      prevEnd = end;
      prevEnds.push(prevEnd);
      events.push({
        kind: "keep", pos, start, end, prevEnd,
        kept: kept.slice(), removed: removed.slice(),
        y: 236 + pos * 35,
      });
    }
  }
  events.push({
    kind: "done", kept: kept.slice(), removed: removed.slice(),
    prevEnd, prevEnds: prevEnds.slice(),
  });
  return {
    sorted, sortedOrder, events, kept, removed, prevEnds,
    removedCount: removed.length,
  };
}
