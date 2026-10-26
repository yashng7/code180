/* Meeting Rooms II — sweep by start with a min-heap of active end times.
 *
 * Each meeting either reuses the room that frees up first (pop the minimum
 * end) or opens a new room.  The heap size after the sweep is the answer.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Meeting Rooms II",
    subtitle: "sweep by start · reuse the earliest-ending room · heap size = rooms",
    inputs: [
      { id: "intervals", label: "meetings (a-b, c-d)", type: "text", default: "0-30, 5-10, 15-20", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "meeting" },
      { color: "#5CD0B3", text: "reused a room" },
      { color: "#B58CD6", text: "opened a new room" },
      { color: "#FC6255", text: "popped end" },
    ],
  },

  code: [
    "def min_meeting_rooms(intervals: List[List[int]]) -> int:",
    "    \"\"\"Sweep meetings in start order, reusing the room that frees up first.\"\"\"",
    "    if not intervals:",
    "        return 0",
    "    intervals = sorted(intervals)          # process by start time",
    "    # Min-heap of end times of meetings currently in progress.",
    "    active_ends: List[int] = []",
    "    for start, end in intervals:",
    "        # If the earliest-finishing active meeting is done by `start`, reuse it.",
    "        if active_ends and active_ends[0] <= start:",
    "            heapq.heappop(active_ends)",
    "        heapq.heappush(active_ends, end)",
    "    # Every heap entry is a meeting that overlaps some other concurrently.",
    "    return len(active_ends)",
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
    const sim = simulateRooms(intervals);

    ctx.backdrop();
    ctx.glow("glow-teal", C.teal);
    ctx.glow("glow-purple", C.purple);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-red", C.red);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const barsL = ctx.layer("chips");
    const panelL = ctx.layer("panel");
    const resultL = ctx.layer("result");

    const scene = { intervals, sim, ctx, bars: [], heapChips: [], _writers: [] };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    scene.title = txt("Meeting Rooms II", {
      x: 64, y: 62, "font-size": 40, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    scene.subtitle = txt("minimum rooms = peak concurrent meetings · keep the earliest end on top", {
      x: 64, y: 98, "font-size": 18, fill: C.grey,
    }, textL);
    setOpacity(scene.subtitle, 0);

    // ---- rooms badge ---------------------------------------------------
    const badge = el("g", {}, resultL);
    const badgeRect = el("rect", {
      x: 850, y: 48, width: 370, height: 86, rx: 12,
      fill: "#121a1b", stroke: C.teal, "stroke-width": 2,
    }, badge);
    txt("rooms open", {
      x: 872, y: 78, "font-size": 13, fill: C.grey,
    }, badge);
    const badgeNum = txt("0", {
      x: 872, y: 119, "font-size": 40, fill: C.teal,
    }, badge);
    const badgeNote = txt("peak so far", {
      x: 1130, y: 112, "font-size": 12, fill: C.grey, "text-anchor": "end",
    }, badge);
    setOpacity(badge, 0);
    scene.badge = badge;
    scene.badgeRect = badgeRect;
    scene.badgeNum = badgeNum;
    scene.badgeNote = badgeNote;

    // ---- axis ----------------------------------------------------------
    const axis = makeIntervalAxis(intervals.flatMap(pair => pair), 90, 800, 0.08);
    const axisY = 198;
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
      x: 64, y: 145, "font-size": 16, fill: C.blue,
    }, textL);
    scene.vars = txt("", { x: 470, y: 145, "font-size": 14, fill: C.gold }, textL);
    setOpacity(scene.phase, 0);
    setOpacity(scene.vars, 0);

    // ---- heap panel ----------------------------------------------------
    const panel = el("g", {}, panelL);
    el("rect", {
      x: 850, y: 152, width: 370, height: 452, rx: 12,
      fill: "#10151d", stroke: C.greyDark, "stroke-width": 1.5,
    }, panel);
    txt("active_ends · min at top", {
      x: 872, y: 180, "font-size": 15, fill: C.white,
    }, panel);
    const heapSub = txt("empty", {
      x: 872, y: 201, "font-size": 12, fill: C.grey,
    }, panel);
    scene.heapSub = heapSub;
    setOpacity(panel, 0);
    scene.panel = panel;

    const heapChipX = 870, heapChipW = 330, heapChipH = 32, heapGap = 7;
    for (let i = 0; i < 9; i++) {
      const y = 214 + i * (heapChipH + heapGap);
      const g = el("g", {}, panelL);
      const rect = el("rect", {
        x: heapChipX, y, width: heapChipW, height: heapChipH, rx: 6,
        fill: C.chipFill, stroke: C.blue, "stroke-width": 1.5,
      }, g);
      const label = txt("", {
        x: heapChipX + 14, y: y + heapChipH / 2 + 1,
        "dominant-baseline": "central", "font-size": 14, fill: C.blue,
      }, g);
      const tag = txt("", {
        x: heapChipX + heapChipW - 14, y: y + heapChipH / 2 + 1,
        "dominant-baseline": "central", "text-anchor": "end",
        "font-size": 10, fill: C.grey,
      }, g);
      setOpacity(g, 0);
      scene.heapChips.push({ g, rect, label, tag });
    }

    // ---- meeting bars --------------------------------------------------
    const barH = 25, laneGap = 35, firstLane = 238;
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
        fill: C.chipFill, stroke: C.blue, "stroke-width": 2,
      }, g);
      const label = txt("[" + pair[0] + ", " + pair[1] + "]", {
        x: x + w / 2, y: y + barH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": w > 55 ? 12 : 9,
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
      scene.empty = txt("no meetings → 0 rooms", {
        x: 64, y: 290, "font-size": 22, fill: C.grey,
      }, textL);
      setOpacity(scene.empty, 0);
    }

    // sweep line
    const sweep = el("g", {}, barsL);
    const sweepLine = el("line", {
      x1: axis.x0, y1: axisY, x2: axis.x0, y2: lastLaneBottom + 8,
      stroke: C.gold, "stroke-width": 2, "stroke-dasharray": "5 5",
    }, sweep);
    const sweepCap = el("path", {
      d: "M -6 0 L 6 0 L 0 9 Z", fill: C.gold,
    }, sweep);
    setOpacity(sweep, 0);
    scene.sweep = sweep;
    scene.sweepLine = sweepLine;
    scene.sweepCap = sweepCap;

    scene.status = txt("", { x: 64, y: 640, "font-size": 20, fill: C.gold }, textL);
    scene.detail = txt("", { x: 64, y: 672, "font-size": 16, fill: C.grey }, textL);
    for (const node of [scene.status, scene.detail]) setOpacity(node, 0);

    // ---- helpers -------------------------------------------------------
    scene.setBars = (current, done) => {
      for (const bar of scene.bars) {
        let fill = C.chipFill, stroke = C.blue, color = C.blue;
        if (bar.pos < current || (done && bar.pos <= current)) {
          if (sim.reusedBy[bar.pos]) {
            fill = "#10211e"; stroke = C.teal; color = C.teal;
          } else {
            fill = "#211827"; stroke = C.purple; color = C.purple;
          }
        }
        if (!done && bar.pos === current) {
          stroke = C.gold;
          if (sim.reusedBy[bar.pos]) {
            fill = "#10211e"; color = C.teal;
          } else {
            fill = "#211827"; color = C.purple;
          }
        }
        bar.rect.setAttribute("fill", fill);
        bar.rect.setAttribute("stroke", stroke);
        bar.label.setAttribute("fill", color);
        bar.tag.setAttribute("fill", bar.pos === current ? C.gold : C.grey);
      }
    };

    scene.setHeap = (heap, opts) => {
      const options = opts || {};
      scene.heapSub.textContent = heap.length
        ? "room count = " + heap.length + " · top = active_ends[0]"
        : "empty · no active meeting";
      for (let i = 0; i < scene.heapChips.length; i++) {
        const chip = scene.heapChips[i];
        if (i < heap.length) {
          chip.label.textContent = "end = " + heap[i];
          chip.tag.textContent = i === 0 ? "min" : "";
          let fill = "#111b28", stroke = C.blue, color = C.blue;
          if (i === 0) {
            fill = "#10211e"; stroke = C.green; color = C.green;
          }
          if (options.pop && i === 0) {
            fill = "#2a1515"; stroke = C.red; color = C.red;
            chip.tag.textContent = "pop";
          }
          if (options.pushed != null && heap[i] === options.pushed &&
              (options.pushedIndex == null || i === options.pushedIndex)) {
            fill = "#262015"; stroke = C.gold; color = C.gold;
            chip.tag.textContent = "pushed";
          }
          chip.rect.setAttribute("fill", fill);
          chip.rect.setAttribute("stroke", stroke);
          chip.label.setAttribute("fill", color);
          chip.tag.setAttribute("fill", i === 0 ? C.grey : C.grey);
          setOpacity(chip.g, 1);
        } else {
          setOpacity(chip.g, 0);
        }
      }
      scene.badgeNum.textContent = String(heap.length);
    };

    scene.setRooms = (rooms, note) => {
      scene.badgeNum.textContent = String(rooms);
      scene.badgeNote.textContent = note || "rooms open";
    };

    scene.setSweep = start => {
      if (start == null) {
        setOpacity(scene.sweep, 0);
        return;
      }
      const x = axis.sx(start);
      scene.sweepLine.setAttribute("x1", x);
      scene.sweepLine.setAttribute("x2", x);
      scene.sweepCap.setAttribute("transform", "translate(" + x + "," + axisY + ")");
      setOpacity(scene.sweep, 1);
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
                          scene.panel, scene.badge, scene.sweep,
                          scene.status, scene.detail, scene.empty]) {
        if (node) setOpacity(node, 0);
      }
      for (const bar of scene.bars) {
        setOpacity(bar.g, 0);
        setOpacity(bar.tag, 0);
        if (bar.g.removeAttribute) bar.g.removeAttribute("transform");
        else bar.g.setAttribute("transform", "");
      }
      for (const chip of scene.heapChips) setOpacity(chip.g, 0);
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.phase.textContent = "sort meetings by start";
      scene.vars.textContent = "";
      scene.badgeNum.textContent = "0";
      scene.badgeNote.textContent = "peak so far";
      scene.heapSub.textContent = "empty · no active meeting";
      scene.setSortOffsets(0);
      scene.setBars(null, false);
      scene.setSweep(null);
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
    const setBars = (current, done) =>
      tl.add(0.01, () => scene.setBars(current, done));
    const setHeap = (heap, opts) =>
      tl.add(0.01, () => scene.setHeap(heap, opts));
    const setSweep = start =>
      tl.add(0.01, () => scene.setSweep(start));
    const setRooms = (rooms, note) =>
      tl.add(0.01, () => scene.setRooms(rooms, note));

    // ---- intro ---------------------------------------------------------
    tl.line([1, 2]);
    tl.add(0.55, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    for (const node of [scene.axisG, scene.phase, scene.vars, scene.panel, scene.badge]) {
      tl.add(0.12, u => setOpacity(node, u), easeOut);
    }
    scene.setSortOffsets(0);
    for (const bar of scene.bars) tl.add(0.09, u => setOpacity(bar.g, u), easeOut);
    if (scene.empty) tl.add(0.2, u => setOpacity(scene.empty, u), easeOut);
    setBars(null, false);
    setHeap([], {});
    setRooms(0, "peak so far");
    if (intervals.length) {
      status(intervals.length + " meetings · sort by start", C.blue,
        "the heap stores only the end times of meetings still in progress", true);
    } else {
      status("no meetings · no rooms needed", C.blue,
        "the empty input returns 0 before the loop", true);
    }
    tl.wait(0.08);

    // ---- sort ----------------------------------------------------------
    tl.line([5]);
    if (intervals.length > 1) {
      status("sorted by start · sweep left to right", C.blue,
        "the original index appears above each meeting after the reorder", true);
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
      tl.line([3, 4]);
      setSweep(null);
      setHeap([], {});
      setRooms(0, "return 0");
      status("return 0", C.green, "no meetings means no rooms and no heap operations", true);
      tl.log("return 0", C.green);
      tl.wait(0.8);
      return tl.finish();
    }

    // ---- meeting sweep -------------------------------------------------
    for (const ev of sim.events) {
      const pair = ev.pos != null ? sorted[ev.pos] : null;
      if (pair) scene.vars.textContent = "start = " + pair[0] + " · end = " + pair[1];
      if (ev.kind === "pop") {
        tl.line([8, 9, 10, 11]);
        setBars(ev.pos, false);
        setSweep(pair[0]);
        setHeap(ev.heapBefore, { pop: true });
        setRooms(ev.heapBefore.length, "before pop");
        status("active_ends[0] = " + ev.popped + " ≤ start " + pair[0] +
          " → pop the free room", C.red,
          "the earliest-ending meeting is over, so this room can be reused", true);
      } else if (ev.kind === "push") {
        const reuse = ev.reused;
        tl.line(ev.checked ? [8, 9, 12] : [12]);
        setBars(ev.pos, false);
        setSweep(pair[0]);
        setHeap(ev.heap, { pushed: pair[1], pushedIndex: ev.pushedIndex });
        setRooms(ev.heap.length, reuse ? "reused" : "new room");
        if (reuse) {
          status("push end " + pair[1] + " into the reused room", C.teal,
            "the new end goes back into the heap · heap size stays " + ev.heap.length, true);
        } else {
          status(ev.checked
            ? "active_ends[0] = " + ev.topBefore + " > start " + pair[0] +
              " → open a new room"
            : "heap empty → open the first room", C.purple,
            "push end " + pair[1] + " · heap size becomes " + ev.heap.length, true);
        }
      } else if (ev.kind === "done") {
        tl.line([13, 14]);
        setBars(sorted.length - 1, true);
        setSweep(null);
        setHeap(ev.heap, {});
        setRooms(ev.rooms, "return " + ev.rooms);
        status("return len(active_ends) = " + ev.rooms, C.green,
          "every heap entry is one room · the peak concurrency is " + ev.rooms, true);
      }
      tl.wait(0.04);
    }

    tl.log("return " + sim.result, C.green);
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

function simulateRooms(intervals) {
  const sortedOrder = intervals.map((_, i) => i)
    .sort((a, b) => intervals[a][0] - intervals[b][0] ||
      intervals[a][1] - intervals[b][1] || a - b);
  const sorted = sortedOrder.map(i => intervals[i].slice());
  const events = [];
  const reusedBy = new Array(sorted.length).fill(false);
  let active = [];

  for (let pos = 0; pos < sorted.length; pos++) {
    const [start, end] = sorted[pos];
    const before = active.slice();
    const topBefore = active.length ? active[0] : null;
    const reuse = active.length > 0 && active[0] <= start;
    let popped = null;
    if (reuse) {
      popped = active[0];
      active = active.slice(1);
      reusedBy[pos] = true;
      events.push({
        kind: "pop", pos, heapBefore: before,
        heapAfter: active.slice(), popped,
      });
    }
    active = active.concat(end).sort((a, b) => a - b);
    const pushedIndex = active.indexOf(end);
    events.push({
      kind: "push", pos, checked: topBefore != null && !reuse,
      topBefore, reused: reuse, heap: active.slice(), pushedIndex,
    });
  }
  events.push({ kind: "done", heap: active.slice(), rooms: active.length });
  return { sorted, sortedOrder, events, reusedBy, result: active.length };
}
