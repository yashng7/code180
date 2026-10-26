/* Merge Intervals — animated sort + coalesce scene.
 *
 * Intervals slide into sorted order, then one growing result interval
 * absorbs every interval that starts before it ends.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Merge Intervals",
    subtitle: "sort by start · coalesce into the last result interval",
    inputs: [
      { id: "intervals", label: "intervals (a-b, c-d)", type: "text", default: "1-3, 2-6, 8-10, 15-18", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "sorted interval" },
      { color: "#F0AC5F", text: "current / growing" },
      { color: "#83C167", text: "merged result" },
    ],
  },

  code: [
    "def merge(intervals: List[List[int]]) -> List[List[int]]:",
    "    \"\"\"Sort by start and coalesce every interval that overlaps the last one.\"\"\"",
    "    result: List[List[int]] = []",
    "    for start, end in sorted(intervals):",
    "        # sorted() on [start, end] pairs orders by start, then by end.",
    "        if result and start <= result[-1][1]:",
    "            result[-1][1] = max(result[-1][1], end)   # extend, never shrink",
    "        else:",
    "            result.append([start, end])",
    "    return result",
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
    const sim = simulateMerge(intervals);
    const maxResult = Math.max(1, sim.result.length);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const barsL = ctx.layer("chips");
    const resultL = ctx.layer("result");

    const scene = { intervals, sim, ctx, bars: [], resultBars: [], _writers: [] };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title ---------------------------------------------------------
    scene.title = txt("Merge Intervals", {
      x: 64, y: 62, "font-size": 40, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    scene.subtitle = txt("sort by start, then extend the last merged interval whenever " +
      "the next one overlaps", {
      x: 64, y: 98, "font-size": 18, fill: C.grey,
    }, textL);
    setOpacity(scene.subtitle, 0);

    // ---- axis ----------------------------------------------------------
    const axis = makeIntervalAxis(
      intervals.flatMap(pair => pair).concat(sim.result.flatMap(pair => pair)),
      100, 1200, 0.08
    );
    const axisY = 186;
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

    scene.phase = txt("sort intervals by start (then end)", {
      x: 64, y: 142, "font-size": 16, fill: C.blue,
    }, textL);
    scene.vars = txt("", { x: 900, y: 142, "font-size": 15, fill: C.gold }, textL);
    setOpacity(scene.phase, 0);
    setOpacity(scene.vars, 0);

    // ---- sorted input lanes -------------------------------------------
    const barH = 24, laneGap = 32, firstLane = 232, resultBarY = 548;
    const resultLabel = txt("result", { x: 64, y: 540, "font-size": 12, fill: C.green }, textL);
    setOpacity(resultLabel, 0);
    scene.resultLabel = resultLabel;

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
      scene.bars.push({ pair, pos, orig, g, rect, label, tag });
    });

    if (!intervals.length) {
      scene.empty = txt("intervals = []  →  result = []", {
        x: 64, y: 270, "font-size": 22, fill: C.grey,
      }, textL);
      setOpacity(scene.empty, 0);
    }

    // ---- result bars ---------------------------------------------------
    for (let i = 0; i < maxResult; i++) {
      const g = el("g", {}, barsL);
      const rect = el("rect", {
        x: 0, y: resultBarY, width: 0, height: 30, rx: 7,
        fill: "#17251a", stroke: C.green, "stroke-width": 2,
      }, g);
      const label = txt("", {
        x: 0, y: resultBarY + 16, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": 12, fill: C.green,
      }, g);
      setOpacity(g, 0);
      scene.resultBars.push({ g, rect, label });
    }

    scene.resultList = txt("result = []", {
      x: 64, y: 606, "font-size": 17, fill: C.green,
    }, textL);
    setOpacity(scene.resultList, 0);

    scene.status = txt("", { x: 64, y: 638, "font-size": 20, fill: C.gold }, textL);
    scene.detail = txt("", { x: 64, y: 666, "font-size": 16, fill: C.grey }, textL);
    scene.final = txt("", {
      x: STAGE_W / 2, y: 698, "text-anchor": "middle", "font-size": 25, fill: C.green,
    }, resultL);
    for (const node of [scene.status, scene.detail, scene.final]) setOpacity(node, 0);

    // ---- helpers -------------------------------------------------------
    scene.setBars = (current, groups, done) => {
      const groupOf = new Map();
      groups.forEach((members, gi) => members.forEach(i => groupOf.set(i, gi)));
      for (const bar of scene.bars) {
        const gi = groupOf.get(bar.pos);
        let fill = C.chipFill, stroke = C.greyDark, color = C.white;
        if (gi !== undefined) {
          const last = gi === groups.length - 1;
          if (!done && last) {
            fill = "#262015"; stroke = C.gold; color = C.gold;
          } else {
            fill = "#17251a"; stroke = C.green; color = C.green;
          }
        }
        if (bar.pos === current) {
          fill = "#262015"; stroke = C.gold; color = C.gold;
        }
        bar.rect.setAttribute("fill", fill);
        bar.rect.setAttribute("stroke", stroke);
        bar.label.setAttribute("fill", color);
        bar.tag.setAttribute("fill", bar.pos === current ? C.gold : C.grey);
      }
    };

    scene.setResult = result => {
      for (let i = 0; i < scene.resultBars.length; i++) {
        const bar = scene.resultBars[i];
        if (i < result.length) {
          const [a, b] = result[i];
          const x = axis.sx(a);
          const w = Math.max(5, axis.sx(b) - x);
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

    scene.setSortOffsets = (amount) => {
      for (const bar of scene.bars) {
        const dy = (bar.orig - bar.pos) * laneGap * (1 - amount);
        bar.g.setAttribute("transform", "translate(0," + dy.toFixed(2) + ")");
      }
    };

    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.axisG, scene.phase, scene.vars,
                          scene.resultLabel, scene.resultList, scene.status,
                          scene.detail, scene.final, scene.empty]) {
        if (node) setOpacity(node, 0);
      }
      for (const bar of scene.bars) {
        setOpacity(bar.g, 0);
        setOpacity(bar.tag, 0);
        bar.g.removeAttribute ? bar.g.removeAttribute("transform") :
          bar.g.setAttribute("transform", "");
      }
      for (const bar of scene.resultBars) setOpacity(bar.g, 0);
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.final.textContent = "";
      scene.resultList.textContent = "result = []";
      scene.phase.textContent = "sort intervals by start (then end)";
      scene.vars.textContent = "";
      scene.setSortOffsets(0);
      scene.setBars(null, [], false);
      scene.setResult([]);
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity } = ctx;
    const { sim } = scene;
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
    const setBars = (current, groups, done) =>
      tl.add(0.01, () => scene.setBars(current, groups, done));
    const setResult = result => tl.add(0.01, () => scene.setResult(result));

    // ---- intro ---------------------------------------------------------
    tl.line([1, 2, 3]);
    tl.add(0.55, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    for (const node of [scene.axisG, scene.phase, scene.vars, scene.resultLabel,
                        scene.resultList]) {
      tl.add(0.12, u => setOpacity(node, u), easeOut);
    }
    scene.setSortOffsets(0);
    for (const bar of scene.bars) {
      tl.add(0.09, u => setOpacity(bar.g, u), easeOut);
    }
    if (scene.empty) tl.add(0.2, u => setOpacity(scene.empty, u), easeOut);
    setBars(null, [], false);
    status(intervalsLength(scene.intervals) + " intervals · sort them by start", C.blue,
      "sorted() on [start, end] pairs orders by start, then by end", true);
    tl.wait(0.1);

    // ---- sort ----------------------------------------------------------
    tl.line([4]);
    tl.add(0.05, () => {
      scene.phase.textContent = "sort by start · result is empty";
    });
    status("sorted order · smallest start first", C.blue,
      "the original index is shown above each bar, so you can see the reordering", true);
    tl.add(0.65, u => {
      scene.setSortOffsets(easeMove(u));
    }, u => u);
    tl.add(0.01, () => scene.setSortOffsets(1));
    tl.add(0.18, u => {
      for (const bar of scene.bars) setOpacity(bar.tag, u);
    }, easeOut);
    tl.wait(0.08);

    // ---- events --------------------------------------------------------
    for (const ev of sim.events) {
      if (ev.kind === "extend") {
        tl.line([5, 6, 7]);
        setBars(ev.pos, ev.groups, false);
        setResult(ev.result);
        scene.phase.textContent = "overlap · extend the last result interval";
        scene.vars.textContent = "start = " + ev.start + " <= " + ev.oldEnd + " → end = " + ev.end;
        status("[" + ev.start + ", " + ev.end + "] starts before the current end " +
          ev.oldEnd + " → extend", C.gold,
          "max(" + ev.oldEnd + ", " + ev.end + ") = " + ev.end +
          " · the merged interval never shrinks", true);
      } else if (ev.kind === "append") {
        tl.line([8, 9]);
        setBars(ev.pos, ev.groups, false);
        setResult(ev.result);
        scene.phase.textContent = "disjoint · start a new result interval";
        scene.vars.textContent = "start = " + ev.start + " > " + ev.prevEnd;
        status("[" + ev.start + ", " + ev.end + "] starts after " + ev.prevEnd +
          " → append", C.green,
          "there is a real gap, so this interval cannot merge with the last one", true);
      } else if (ev.kind === "done") {
        tl.line([10]);
        setBars(null, ev.groups, true);
        setResult(ev.result);
        scene.phase.textContent = "all intervals processed";
        scene.vars.textContent = "";
        status("return " + ev.result.length + " disjoint interval" +
          (ev.result.length === 1 ? "" : "s"), C.green,
          "every input interval was either appended or absorbed exactly once", true);
      }
      tl.wait(0.04);
    }

    // ---- final ---------------------------------------------------------
    tl.add(0.01, () => {
      scene.final.textContent = "return " + formatPairs(sim.result);
      scene.final.setAttribute("font-size", formatPairs(sim.result).length > 76 ? 20 : 25);
      setOpacity(scene.final, 1);
    });
    tl.add(0.5, u => setOpacity(scene.final, u), easeOut);
    tl.log("return " + formatPairs(sim.result), C.green);
    tl.wait(0.8);
    return tl.finish();
  },
};

function intervalsLength(intervals) {
  return intervals.length;
}

function simulateMerge(intervals) {
  const sortedOrder = intervals.map((_, i) => i)
    .sort((a, b) => intervals[a][0] - intervals[b][0] ||
      intervals[a][1] - intervals[b][1] || a - b);
  const sorted = sortedOrder.map(i => intervals[i].slice());
  const result = [];
  const groups = [];
  const events = [];

  sorted.forEach((pair, pos) => {
    const [start, end] = pair;
    if (result.length && start <= result[result.length - 1][1]) {
      const oldEnd = result[result.length - 1][1];
      result[result.length - 1][1] = Math.max(oldEnd, end);
      groups[groups.length - 1].push(pos);
      events.push({
        kind: "extend", pos, start, end, oldEnd,
        result: result.map(x => x.slice()),
        groups: groups.map(g => g.slice()),
      });
    } else {
      result.push([start, end]);
      groups.push([pos]);
      events.push({
        kind: "append", pos, start, end,
        prevEnd: result.length > 1 ? result[result.length - 2][1] : null,
        result: result.map(x => x.slice()),
        groups: groups.map(g => g.slice()),
      });
    }
  });
  events.push({
    kind: "done",
    result: result.map(x => x.slice()),
    groups: groups.map(g => g.slice()),
  });
  return { sorted, sortedOrder, events, result, groups };
}

/* ------------------------------------------------------------------ *
 * Parsing, axis.
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
