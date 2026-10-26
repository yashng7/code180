/* Meeting Rooms — sorted adjacent-pair conflict check.
 *
 * Once meetings are sorted by start, an overlap can only occur between
 * neighbours: the current start must not fall before the previous end.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Meeting Rooms",
    subtitle: "sort by start · compare each meeting with the one just before it",
    inputs: [
      { id: "intervals", label: "meetings (a-b, c-d)", type: "text", default: "0-30, 5-10, 15-20", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "sorted meeting" },
      { color: "#83C167", text: "compatible" },
      { color: "#FC6255", text: "overlap → false" },
      { color: "#F0AC5F", text: "current" },
    ],
  },

  code: [
    "def can_attend_meetings(intervals: List[List[int]]) -> bool:",
    "    \"\"\"Return True iff no two intervals overlap (touching is allowed).\"\"\"",
    "    intervals = sorted(intervals)",
    "    for i in range(1, len(intervals)):",
    "        # Sorted by start, so an overlap shows up as the next start",
    "        # falling before the previous end.",
    "        if intervals[i][0] < intervals[i - 1][1]:",
    "            return False",
    "    return True",
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
    const sim = simulateMeetings(intervals);

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

    scene.title = txt("Meeting Rooms", {
      x: 64, y: 62, "font-size": 40, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    scene.subtitle = txt("can one person attend every meeting? sort by start, then check only neighbours", {
      x: 64, y: 98, "font-size": 18, fill: C.grey,
    }, textL);
    setOpacity(scene.subtitle, 0);

    // ---- answer badge --------------------------------------------------
    const badge = el("g", {}, resultL);
    const badgeRect = el("rect", {
      x: 930, y: 48, width: 260, height: 92, rx: 12,
      fill: "#121b14", stroke: C.green, "stroke-width": 2,
    }, badge);
    txt("can attend?", {
      x: 950, y: 78, "font-size": 13, fill: C.grey,
    }, badge);
    const badgeValue = txt("—", {
      x: 950, y: 120, "font-size": 34, fill: C.green,
    }, badge);
    setOpacity(badge, 0);
    scene.badge = badge;
    scene.badgeRect = badgeRect;
    scene.badgeValue = badgeValue;

    // ---- axis ----------------------------------------------------------
    const axis = makeIntervalAxis(intervals.flatMap(pair => pair), 100, 1200, 0.08);
    const axisY = 190;
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

    scene.phase = txt("sort meetings by start", {
      x: 64, y: 142, "font-size": 16, fill: C.blue,
    }, textL);
    scene.vars = txt("", { x: 760, y: 142, "font-size": 15, fill: C.gold }, textL);
    setOpacity(scene.phase, 0);
    setOpacity(scene.vars, 0);

    // ---- sorted bars ---------------------------------------------------
    const barH = 26, laneGap = 36, firstLane = 238;
    const lastLaneBottom = firstLane +
      Math.max(0, intervals.length - 1) * laneGap + barH;
    const sorted = sim.sorted;
    const sortedOrder = sim.sortedOrder;

    for (let pos = 0; pos < sorted.length; pos++) {
      const pair = sorted[pos];
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
    }

    if (!intervals.length) {
      scene.empty = txt("no meetings → trivially true", {
        x: 64, y: 290, "font-size": 22, fill: C.grey,
      }, textL);
      setOpacity(scene.empty, 0);
    }

    // previous-end marker and overlap shading
    const marker = el("g", {}, barsL);
    const markerLine = el("line", {
      x1: axis.x0, y1: axisY + 8, x2: axis.x0, y2: lastLaneBottom + 8,
      stroke: C.blue, "stroke-width": 2, "stroke-dasharray": "5 5",
    }, marker);
    const markerCap = el("path", {
      d: "M -6 0 L 6 0 L 0 9 Z", fill: C.blue,
    }, marker);
    setOpacity(marker, 0);
    scene.marker = marker;
    scene.markerLine = markerLine;
    scene.markerCap = markerCap;

    const overlapRect = el("rect", {
      x: 0, y: 0, width: 0, height: 0, rx: 3,
      fill: "#3a1717", stroke: C.red, "stroke-width": 1.5,
      "stroke-dasharray": "4 4",
    }, barsL);
    setOpacity(overlapRect, 0);
    scene.overlapRect = overlapRect;

    scene.status = txt("", { x: 64, y: 605, "font-size": 20, fill: C.gold }, textL);
    scene.detail = txt("", { x: 64, y: 636, "font-size": 16, fill: C.grey }, textL);
    scene.final = txt("", {
      x: 64, y: 680, "font-size": 22, fill: C.green,
    }, resultL);
    for (const node of [scene.status, scene.detail, scene.final]) setOpacity(node, 0);

    // ---- helpers -------------------------------------------------------
    scene.setBars = (current, kept, bad, done) => {
      const keptSet = new Set(kept);
      for (const bar of scene.bars) {
        let fill = C.chipFill, stroke = C.greyDark, color = C.white;
        if (keptSet.has(bar.pos)) {
          fill = "#17251a"; stroke = C.green; color = C.green;
        }
        if (bad != null && bar.pos === bad) {
          fill = "#2a1515"; stroke = C.red; color = C.red;
        }
        if (!done && bar.pos === current && (bad == null || bar.pos !== bad)) {
          fill = "#262015"; stroke = C.gold; color = C.gold;
        }
        bar.rect.setAttribute("fill", fill);
        bar.rect.setAttribute("stroke", stroke);
        bar.label.setAttribute("fill", color);
        bar.tag.setAttribute("fill", bar.pos === current ? C.gold : C.grey);
      }
    };

    scene.setMarker = (xValue, bottom) => {
      if (xValue == null) {
        setOpacity(scene.marker, 0);
        return;
      }
      const x = axis.sx(xValue);
      scene.markerLine.setAttribute("x1", x);
      scene.markerLine.setAttribute("x2", x);
      scene.markerLine.setAttribute("y2", (bottom || lastLaneBottom) + 8);
      scene.markerCap.setAttribute("transform", "translate(" + x + "," + (axisY + 8) + ")");
      setOpacity(scene.marker, 1);
    };

    scene.showOverlap = (on, start, end, top, bottom) => {
      if (!on) {
        setOpacity(scene.overlapRect, 0);
        return;
      }
      const x = axis.sx(start);
      const x2 = axis.sx(end);
      scene.overlapRect.setAttribute("x", x);
      scene.overlapRect.setAttribute("y", top - 2);
      scene.overlapRect.setAttribute("width", Math.max(2, x2 - x));
      scene.overlapRect.setAttribute("height", bottom - top + 4);
      setOpacity(scene.overlapRect, 1);
    };

    scene.setSortOffsets = amount => {
      for (const bar of scene.bars) {
        const dy = (bar.orig - bar.pos) * laneGap * (1 - amount);
        bar.g.setAttribute("transform", "translate(0," + dy.toFixed(2) + ")");
      }
    };

    scene.showBadge = (value, good) => {
      scene.badgeValue.textContent = value ? "True" : "False";
      scene.badgeValue.setAttribute("fill", good ? C.green : C.red);
      scene.badgeRect.setAttribute("fill", good ? "#121b14" : "#1b1214");
      scene.badgeRect.setAttribute("stroke", good ? C.green : C.red);
    };

    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.axisG, scene.phase, scene.vars,
                          scene.marker, scene.overlapRect, scene.badge,
                          scene.status, scene.detail, scene.final, scene.empty]) {
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
      scene.badgeValue.textContent = "—";
      scene.phase.textContent = "sort meetings by start";
      scene.vars.textContent = "";
      scene.setSortOffsets(0);
      scene.setBars(null, [], null, false);
      scene.setMarker(null);
      scene.showOverlap(false);
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity } = ctx;
    const { sim, intervals } = scene;
    const sorted = sim.sorted;
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
    const setBars = (current, kept, bad, done) =>
      tl.add(0.01, () => scene.setBars(current, kept, bad, done));
    const setMarker = (x, bottom) =>
      tl.add(0.01, () => scene.setMarker(x, bottom));
    const showOverlap = (on, start, end, top, bottom) =>
      tl.add(0.01, () => scene.showOverlap(on, start, end, top, bottom));

    // ---- intro ---------------------------------------------------------
    tl.line([1, 2]);
    tl.add(0.55, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    for (const node of [scene.axisG, scene.phase, scene.vars]) {
      tl.add(0.12, u => setOpacity(node, u), easeOut);
    }
    scene.setSortOffsets(0);
    for (const bar of scene.bars) tl.add(0.09, u => setOpacity(bar.g, u), easeOut);
    if (scene.empty) tl.add(0.2, u => setOpacity(scene.empty, u), easeOut);
    setBars(null, [], null, false);
    if (intervals.length) {
      status(intervals.length + " meetings · sorting by start makes the check local", C.blue,
        "after sorting, any overlap must involve adjacent meetings", true);
    } else {
      status("no meetings · nothing can conflict", C.blue,
        "the loop is skipped entirely", true);
    }
    tl.wait(0.08);

    // ---- sort ----------------------------------------------------------
    tl.line([3]);
    scene.phase.textContent = "sorted by start · compare adjacent meetings";
    if (intervals.length > 1) {
      status("sorted by start · earliest meeting first", C.blue,
        "the original index sits above each meeting", true);
      tl.add(0.65, u => scene.setSortOffsets(easeMove(u)), u => u);
      tl.add(0.01, () => scene.setSortOffsets(1));
      tl.add(0.18, u => {
        for (const bar of scene.bars) setOpacity(bar.tag, u);
      }, easeOut);
    } else if (intervals.length === 1) {
      tl.add(0.18, u => {
        for (const bar of scene.bars) setOpacity(bar.tag, u);
      }, easeOut);
    }
    tl.wait(0.05);

    if (!intervals.length) {
      tl.line([9]);
      tl.add(0.01, () => scene.showBadge(true, true));
      tl.add(0.4, u => setOpacity(scene.badge, u), easeOut);
      status("no meetings → return True", C.green,
        "the empty input is trivially compatible", true);
      tl.add(0.01, () => {
        scene.final.textContent = "return True";
        scene.final.setAttribute("fill", C.green);
        setOpacity(scene.final, 1);
      });
      tl.log("return True", C.green);
      tl.wait(0.8);
      return tl.finish();
    }

    // first meeting is the baseline
    setBars(0, [0], null, false);
    setMarker(sorted[0][1], scene.bars[0].y);
    tl.add(0.01, () => {
      scene.vars.textContent = "baseline prev_end = " + sorted[0][1];
    });
    status("baseline: meeting [0, " + sorted[0][1] + "] ends at " + sorted[0][1], C.green,
      "every later start will be compared with the previous end", true);
    tl.wait(0.04);

    // ---- comparisons ---------------------------------------------------
    for (const ev of sim.events) {
      const prev = sorted[ev.prevPos];
      const cur = sorted[ev.pos];
      if (ev.kind === "compare") {
        tl.line(ev.pass ? [4, 5, 6, 7] : [4, 5, 6, 7, 8]);
        setBars(ev.pos, ev.kept, ev.pass ? null : ev.pos, false);
        setMarker(ev.prevEnd, scene.bars[ev.pos].y);
        showOverlap(!ev.pass, cur[0], prev[1], scene.bars[ev.prevPos].y,
          scene.bars[ev.pos].y + 26);
        scene.vars.textContent = "i = " + ev.pos + " · prev_end = " + ev.prevEnd;
        if (ev.pass) {
          status("[" + cur[0] + ", " + cur[1] + "] starts at " + cur[0] +
            " ≥ prev_end " + ev.prevEnd + " → compatible", C.green,
            "touching is allowed: " + cur[0] + " is not less than " + ev.prevEnd, true);
        } else {
          status("[" + cur[0] + ", " + cur[1] + "] starts at " + cur[0] +
            " < prev_end " + ev.prevEnd + " → conflict", C.red,
            "starts before the previous meeting ends → return False immediately", true);
        }
      } else if (ev.kind === "done") {
        tl.line([9]);
        setBars(null, ev.kept, ev.bad, true);
        showOverlap(false);
        scene.vars.textContent = ev.result ? "all adjacent pairs compatible" : "conflict found";
        status(ev.result ? "every adjacent pair passed → return True"
          : "overlap found → return False", ev.result ? C.green : C.red,
          ev.result ? "no two meetings overlap (touching endpoints are fine)"
            : "early exit · the remaining meetings do not need to be checked", true);
        tl.add(0.01, () => scene.showBadge(ev.result, ev.result));
        tl.add(0.4, u => setOpacity(scene.badge, u), easeOut);
        tl.add(0.01, () => {
          scene.final.textContent = "return " + (ev.result ? "True" : "False");
          scene.final.setAttribute("fill", ev.result ? C.green : C.red);
          setOpacity(scene.final, 1);
        });
        tl.add(0.35, u => setOpacity(scene.final, u), easeOut);
      }
      tl.wait(0.04);
    }

    tl.log("return " + (sim.result ? "True" : "False"), sim.result ? C.green : C.red);
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

function simulateMeetings(intervals) {
  const sortedOrder = intervals.map((_, i) => i)
    .sort((a, b) => intervals[a][0] - intervals[b][0] ||
      intervals[a][1] - intervals[b][1] || a - b);
  const sorted = sortedOrder.map(i => intervals[i].slice());
  const events = [];
  let result = true;
  let bad = null;

  for (let pos = 1; pos < sorted.length; pos++) {
    const prevEnd = sorted[pos - 1][1];
    const pass = !(sorted[pos][0] < prevEnd);
    events.push({
      kind: "compare", pos, prevPos: pos - 1, prevEnd, pass,
      kept: sorted.slice(0, pos + 1).map((_, i) => i),
    });
    if (!pass) {
      result = false;
      bad = pos;
      break;
    }
  }
  events.push({
    kind: "done", result, bad,
    kept: result ? sorted.map((_, i) => i)
      : bad == null ? [] : sorted.slice(0, bad).map((_, i) => i),
  });
  return { sorted, sortedOrder, events, result };
}
