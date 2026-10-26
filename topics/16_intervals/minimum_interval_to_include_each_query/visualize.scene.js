/* Minimum Interval to Include Each Query — offline sweep + min-heap scene.
 *
 * Sort queries from smallest to largest so the interval sweep only moves
 * forward.  Admit intervals whose start is <= q, drop candidates whose end
 * is < q, and the heap top is the shortest surviving interval.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Minimum Interval to Include Each Query",
    subtitle: "offline queries · sweep intervals by start · heap keyed by interval length",
    inputs: [
      { id: "intervals", label: "intervals (a-b, c-d)", type: "text", default: "1-4, 2-4, 3-6, 4-4", width: "wide" },
      { id: "queries", label: "queries (comma separated)", type: "text", default: "2, 3, 4, 5" },
    ],
    legend: [
      { color: "#58C4DD", text: "admitted" },
      { color: "#83C167", text: "heap top / best" },
      { color: "#FC6255", text: "expired" },
      { color: "#F0AC5F", text: "current" },
    ],
  },

  code: [
    "def min_interval(intervals: List[List[int]], queries: List[int]) -> List[int]:",
    "    \"\"\"Answer every query offline, sweeping intervals by start in query order.\"\"\"",
    "    intervals.sort(key=lambda pair: pair[0])",
    "    # Process queries from smallest to largest so the sweep only moves forward.",
    "    order = sorted(range(len(queries)), key=lambda i: queries[i])",
    "    answer = [-1] * len(queries)",
    "    heap: List[tuple[int, int]] = []   # (length, end) of candidate intervals",
    "    j = 0",
    "    for i in order:",
    "        q = queries[i]",
    "        # Admit every interval whose start is <= q.",
    "        while j < len(intervals) and intervals[j][0] <= q:",
    "            start, end = intervals[j]",
    "            heapq.heappush(heap, (end - start + 1, end))",
    "            j += 1",
    "        # Discard intervals that end before q — they can't cover it.",
    "        while heap and heap[0][1] < q:",
    "            heapq.heappop(heap)",
    "        if heap:",
    "            answer[i] = heap[0][0]      # smallest length still covering q",
    "    return answer",
  ],

  read(values) {
    const intervals = parseIntervalText(values.intervals);
    const queries = parseQueryText(values.queries);
    if (!intervals || !queries || intervals.length > 8 || queries.length > 6) return null;
    return { intervals, queries };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || args.length !== 2) return null;
    const [intervals, queries] = args;
    if (!Array.isArray(intervals) || !Array.isArray(queries)) return null;
    if (intervals.length > 8 || queries.length > 6) return null;
    if (!intervals.every(pair => Array.isArray(pair) && pair.length === 2)) return null;
    if (!queries.every(q => typeof q === "number" && Number.isFinite(q))) return null;
    return {
      intervals: intervals.map(pair => pair[0] + "-" + pair[1]).join(", "),
      queries: queries.join(", "),
    };
  },

  buildScene(params, ctx) {
    const { el, txt, C, setOpacity, STAGE_W } = ctx;
    const { intervals, queries } = params;
    const sim = simulateMinInterval(intervals, queries);

    ctx.backdrop();
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-red", C.red);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-blue", C.blue);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const barsL = ctx.layer("chips");
    const panelL = ctx.layer("panel");
    const resultL = ctx.layer("result");

    const scene = { intervals, queries, sim, ctx, bars: [], _writers: [] };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    scene.title = txt("Minimum Interval for Each Query", {
      x: 64, y: 62, "font-size": 38, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    scene.subtitle = txt("sort queries · admit starts ≤ q · expire ends < q · shortest active interval wins", {
      x: 64, y: 98, "font-size": 17, fill: C.grey,
    }, textL);
    setOpacity(scene.subtitle, 0);

    // ---- axis ----------------------------------------------------------
    const allValues = intervals.flatMap(pair => pair).concat(queries);
    const axis = makeIntervalAxis(allValues, 90, 790, 0.08);
    const axisY = 205;
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

    scene.phase = txt("sort intervals by start", {
      x: 64, y: 148, "font-size": 16, fill: C.blue,
    }, textL);
    scene.vars = txt("", { x: 470, y: 148, "font-size": 14, fill: C.gold }, textL);
    setOpacity(scene.phase, 0);
    setOpacity(scene.vars, 0);

    // ---- query table ---------------------------------------------------
    const queryPanel = el("g", {}, panelL);
    el("rect", {
      x: 830, y: 150, width: 386, height: 252, rx: 12,
      fill: "#10151d", stroke: C.greyDark, "stroke-width": 1.5,
    }, queryPanel);
    txt("queries · original order", {
      x: 850, y: 178, "font-size": 15, fill: C.white,
    }, queryPanel);
    txt("#", { x: 850, y: 201, "font-size": 11, fill: C.grey }, queryPanel);
    txt("q", { x: 896, y: 201, "font-size": 11, fill: C.grey }, queryPanel);
    txt("answer", {
      x: 1188, y: 201, "font-size": 11, fill: C.grey, "text-anchor": "end",
    }, queryPanel);
    setOpacity(queryPanel, 0);
    scene.queryPanel = queryPanel;

    const queryRows = [];
    for (let i = 0; i < queries.length; i++) {
      const y = 212 + i * 29;
      const g = el("g", {}, panelL);
      const bg = el("rect", {
        x: 842, y, width: 362, height: 25, rx: 5,
        fill: "transparent", stroke: "transparent", "stroke-width": 1.5,
      }, g);
      const idx = txt("#" + i, {
        x: 850, y: y + 18, "font-size": 13, fill: C.grey,
      }, g);
      const q = txt(String(queries[i]), {
        x: 896, y: y + 18, "font-size": 13, fill: C.white,
      }, g);
      const ans = txt("—", {
        x: 1188, y: y + 18, "font-size": 13, fill: C.grey, "text-anchor": "end",
      }, g);
      const rank = txt("", {
        x: 1160, y: y + 18, "font-size": 10, fill: C.grey, "text-anchor": "end",
      }, g);
      setOpacity(g, 0);
      queryRows.push({ g, bg, idx, q, ans, rank });
    }
    scene.queryRows = queryRows;

    // ---- heap panel ----------------------------------------------------
    const heapPanel = el("g", {}, panelL);
    el("rect", {
      x: 830, y: 416, width: 386, height: 274, rx: 12,
      fill: "#10151d", stroke: C.greyDark, "stroke-width": 1.5,
    }, heapPanel);
    txt("candidate heap · (length, end)", {
      x: 850, y: 443, "font-size": 15, fill: C.white,
    }, heapPanel);
    const heapSub = txt("empty", {
      x: 850, y: 462, "font-size": 11, fill: C.grey,
    }, heapPanel);
    scene.heapSub = heapSub;
    setOpacity(heapPanel, 0);
    scene.heapPanel = heapPanel;

    const heapChips = [];
    for (let i = 0; i < 8; i++) {
      const y = 468 + i * 27;
      const g = el("g", {}, panelL);
      const rect = el("rect", {
        x: 848, y, width: 350, height: 23, rx: 5,
        fill: C.chipFill, stroke: C.blue, "stroke-width": 1.5,
      }, g);
      const label = txt("", {
        x: 862, y: y + 16, "font-size": 12, fill: C.blue,
      }, g);
      const tag = txt("", {
        x: 1184, y: y + 16, "font-size": 9, fill: C.grey, "text-anchor": "end",
      }, g);
      setOpacity(g, 0);
      heapChips.push({ g, rect, label, tag });
    }
    scene.heapChips = heapChips;

    // ---- interval bars -------------------------------------------------
    const barH = 27, laneGap = 37, firstLane = 252;
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
        "dominant-baseline": "central", "font-size": w > 58 ? 12 : 9,
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
      scene.empty = txt("intervals = []  →  every answer stays −1", {
        x: 64, y: 300, "font-size": 20, fill: C.grey,
      }, textL);
      setOpacity(scene.empty, 0);
    }

    // sweep line + q label
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

    const qLabel = txt("", {
      x: 90, y: 185, "text-anchor": "middle", "font-size": 13, fill: C.gold,
    }, textL);
    setOpacity(qLabel, 0);
    scene.qLabel = qLabel;

    scene.status = txt("", { x: 64, y: 625, "font-size": 20, fill: C.gold }, textL);
    scene.detail = txt("", { x: 64, y: 657, "font-size": 16, fill: C.grey }, textL);
    scene.final = txt("", {
      x: 64, y: 695, "font-size": 21, fill: C.green,
    }, resultL);
    for (const node of [scene.status, scene.detail, scene.final]) setOpacity(node, 0);

    // ---- helpers -------------------------------------------------------
    scene.setBars = ev => {
      const active = new Set(ev.heap.map(entry => entry.pos));
      const discarded = new Set(ev.discarded);
      const topPos = ev.heap.length ? ev.heap[0].pos : null;
      for (const bar of scene.bars) {
        let fill = C.chipFill, stroke = C.blue, color = C.white;
        if (bar.pos < ev.j) {
          if (discarded.has(bar.pos)) {
            fill = "#2a1515"; stroke = C.red; color = C.red;
          } else if (active.has(bar.pos)) {
            fill = "#111b28"; stroke = C.blue; color = C.blue;
          } else {
            fill = C.chipFill; stroke = C.greyDark; color = C.grey;
          }
        }
        if (bar.pos === topPos) {
          fill = "#10211e"; stroke = C.green; color = C.green;
        }
        if (ev.currentPos != null && bar.pos === ev.currentPos) {
          fill = "#262015"; stroke = C.gold; color = C.gold;
        }
        bar.rect.setAttribute("fill", fill);
        bar.rect.setAttribute("stroke", stroke);
        bar.label.setAttribute("fill", color);
        bar.tag.setAttribute("fill", bar.pos === topPos ? C.green : C.grey);
      }
    };

    scene.setQueries = ev => {
      const current = ev.i != null ? ev.i : null;
      for (let idx = 0; idx < scene.queryRows.length; idx++) {
        const row = scene.queryRows[idx];
        const done = ev.answers[idx] != null && ev.answers[idx] !== -1;
        row.ans.textContent = ev.answers[idx] == null ? "—" : String(ev.answers[idx]);
        row.ans.setAttribute("fill",
          ev.answers[idx] == null ? C.grey : done ? C.green : C.red);
        row.rank.textContent = "#" + (sim.queryRank[idx] + 1);
        row.rank.setAttribute("fill", idx === current ? C.gold : C.grey);
        row.q.setAttribute("fill", idx === current ? C.gold : C.white);
        row.idx.setAttribute("fill", idx === current ? C.gold : C.grey);
        if (idx === current) {
          row.bg.setAttribute("fill", "#211d15");
          row.bg.setAttribute("stroke", C.gold);
        } else {
          row.bg.setAttribute("fill", "transparent");
          row.bg.setAttribute("stroke", "transparent");
        }
      }
    };

    scene.setHeap = (heap, opts) => {
      const options = opts || {};
      scene.heapSub.textContent = heap.length
        ? "size = " + heap.length + " · top = shortest length"
        : "empty · no candidate covers this q";
      for (let i = 0; i < scene.heapChips.length; i++) {
        const chip = scene.heapChips[i];
        if (i < heap.length) {
          const entry = heap[i];
          chip.label.textContent =
            "(len = " + entry.len + ", end = " + entry.end + ")";
          let fill = "#111b28", stroke = C.blue, color = C.blue, tag = "";
          if (i === 0) {
            fill = "#10211e"; stroke = C.green; color = C.green; tag = "top";
          }
          if (options.popped && i === 0) {
            fill = "#2a1515"; stroke = C.red; color = C.red; tag = "pop expired";
          }
          if (options.pushed && i === options.pushedIndex) {
            fill = "#262015"; stroke = C.gold; color = C.gold; tag = "pushed";
          }
          chip.rect.setAttribute("fill", fill);
          chip.rect.setAttribute("stroke", stroke);
          chip.label.setAttribute("fill", color);
          chip.tag.textContent = tag;
          chip.tag.setAttribute("fill", i === 0 && !options.pushed ? C.green : C.grey);
          setOpacity(chip.g, 1);
        } else {
          setOpacity(chip.g, 0);
        }
      }
    };

    scene.setSweep = (q, show) => {
      if (q == null || show === false) {
        setOpacity(scene.sweep, 0);
        setOpacity(scene.qLabel, 0);
        return;
      }
      const x = axis.sx(q);
      scene.sweepLine.setAttribute("x1", x);
      scene.sweepLine.setAttribute("x2", x);
      scene.sweepCap.setAttribute("transform", "translate(" + x + "," + axisY + ")");
      scene.qLabel.textContent = "q = " + q;
      scene.qLabel.setAttribute("x", Math.max(105, Math.min(775, x)));
      setOpacity(scene.sweep, 1);
      setOpacity(scene.qLabel, 1);
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
                          scene.queryPanel, scene.heapPanel, scene.sweep,
                          scene.qLabel, scene.status, scene.detail, scene.final,
                          scene.empty]) {
        if (node) setOpacity(node, 0);
      }
      for (const bar of scene.bars) {
        setOpacity(bar.g, 0);
        setOpacity(bar.tag, 0);
        if (bar.g.removeAttribute) bar.g.removeAttribute("transform");
        else bar.g.setAttribute("transform", "");
      }
      for (const row of scene.queryRows) setOpacity(row.g, 0);
      for (const chip of scene.heapChips) setOpacity(chip.g, 0);
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.final.textContent = "";
      scene.phase.textContent = "sort intervals by start";
      scene.vars.textContent = "";
      scene.qLabel.textContent = "";
      scene.setSortOffsets(0);
      scene.setBars({ j: 0, heap: [], discarded: [], currentPos: null });
      scene.setHeap([], {});
      scene.setQueries({
        i: null, answers: new Array(queries.length).fill(null),
      });
      scene.setSweep(null);
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity } = ctx;
    const { sim, intervals, queries } = scene;
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
    const apply = ev => tl.add(0.01, () => {
      scene.setBars(ev);
      scene.setQueries(ev);
    });
    const setHeap = (heap, opts) =>
      tl.add(0.01, () => scene.setHeap(heap, opts));
    const setSweep = (q, show) =>
      tl.add(0.01, () => scene.setSweep(q, show));

    // ---- intro ---------------------------------------------------------
    tl.line([1, 2, 3]);
    tl.add(0.55, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    for (const node of [scene.axisG, scene.phase, scene.vars,
                        scene.queryPanel, scene.heapPanel]) {
      tl.add(0.12, u => setOpacity(node, u), easeOut);
    }
    scene.setSortOffsets(0);
    for (const bar of scene.bars) tl.add(0.09, u => setOpacity(bar.g, u), easeOut);
    for (const row of scene.queryRows) tl.add(0.06, u => setOpacity(row.g, u), easeOut);
    if (scene.empty) tl.add(0.2, u => setOpacity(scene.empty, u), easeOut);
    apply({ j: 0, heap: [], discarded: [], currentPos: null,
            i: null, answers: new Array(queries.length).fill(null) });
    setHeap([], {});
    status(intervals.length + " intervals · " + queries.length + " queries", C.blue,
      "query order is sorted by value; answers are stored under the original index", true);
    tl.wait(0.08);

    // ---- interval sort -------------------------------------------------
    scene.phase.textContent = "sort intervals by start · then sweep queries in value order";
    if (intervals.length > 1) {
      status("sort intervals by start", C.blue,
        "sorted(intervals, key=start) · the sweep never needs to move backwards", true);
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

    // ---- events --------------------------------------------------------
    for (const ev of sim.events) {
      if (ev.kind === "query") {
        tl.line([9, 10]);
        apply(ev);
        setSweep(ev.q, true);
        scene.vars.textContent = "i = " + ev.i + " · q = " + ev.q + " · j = " + ev.j;
        status("query q = " + ev.q + " (original index " + ev.i + ")", C.gold,
          "process queries smallest first · j is the next interval to admit", true);
      } else if (ev.kind === "admit") {
        tl.line([11, 12, 13, 14, 15]);
        apply(ev);
        setSweep(ev.q, true);
        setHeap(ev.heap, { pushed: true, pushedIndex: ev.pushedIndex });
        scene.vars.textContent = "q = " + ev.q + " · j = " + ev.j;
        const pair = sim.sorted[ev.pos];
        status("interval [" + pair[0] + ", " + pair[1] + "] starts at " + pair[0] +
          " ≤ " + ev.q + " → admit", C.gold,
          "push (" + (pair[1] - pair[0] + 1) + ", " + pair[1] +
          ") onto the length heap", true);
      } else if (ev.kind === "discard") {
        tl.line([16, 17, 18]);
        apply(ev);
        setSweep(ev.q, true);
        setHeap(ev.heapBefore, { popped: true });
        scene.vars.textContent = "q = " + ev.q + " · pop end " + ev.popped.end;
        status("end " + ev.popped.end + " < q " + ev.q + " → discard", C.red,
          "this interval cannot cover the current query or any later query", true);
      } else if (ev.kind === "answer") {
        tl.line(ev.answers[ev.i] === -1 ? [19] : [19, 20]);
        apply(ev);
        setSweep(ev.q, true);
        setHeap(ev.heap, {});
        scene.vars.textContent = "q = " + ev.q + " · " +
          (ev.answers[ev.i] === -1 ? "heap empty" : "best length = " + ev.answers[ev.i]);
        if (ev.answers[ev.i] === -1) {
          status("heap empty → answer stays −1", C.red,
            "no admitted interval still covers q = " + ev.q, true);
        } else {
          status("answer[" + ev.i + "] = " + ev.answers[ev.i], C.green,
            "heap top is the shortest candidate still covering q = " + ev.q, true);
        }
      } else if (ev.kind === "done") {
        tl.line([21]);
        apply(ev);
        setSweep(null);
        setHeap(ev.heap, {});
        scene.vars.textContent = "all queries answered";
        status("return " + formatNumbers(ev.answers), C.green,
          "answers are indexed by the original query positions", true);
      }
      tl.wait(0.035);
    }

    tl.add(0.01, () => {
      scene.final.textContent = "return " + formatNumbers(sim.answers);
      setOpacity(scene.final, 1);
    });
    tl.add(0.45, u => setOpacity(scene.final, u), easeOut);
    tl.log("return " + formatNumbers(sim.answers), C.green);
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

function parseQueryText(raw) {
  const text = String(raw == null ? "" : raw).trim();
  if (!text) return [];
  const parts = text.split(/[\s,]+/).map(part => part.trim()).filter(Boolean);
  const queries = [];
  for (const part of parts) {
    if (!/^-?\d+$/.test(part)) return null;
    const value = Number(part);
    if (!Number.isFinite(value) || Math.abs(value) > 999) return null;
    queries.push(value);
  }
  return queries;
}

function formatNumbers(values) {
  return "[" + values.map(v => v === -1 ? "−1" : String(v)).join(", ") + "]";
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

function simulateMinInterval(intervals, queries) {
  const sortedOrder = intervals.map((_, i) => i)
    .sort((a, b) => intervals[a][0] - intervals[b][0] ||
      intervals[a][1] - intervals[b][1] || a - b);
  const sorted = sortedOrder.map(i => intervals[i].slice());
  const order = queries.map((_, i) => i)
    .sort((a, b) => queries[a] - queries[b] || a - b);
  const queryRank = new Array(queries.length).fill(0);
  order.forEach((idx, rank) => { queryRank[idx] = rank; });

  const answers = new Array(queries.length).fill(-1);
  const events = [];
  const discarded = [];
  let heap = [];
  let j = 0;

  const snapshot = (kind, extra) => {
    events.push({
      kind,
      j,
      heap: heap.map(entry => ({ ...entry })),
      discarded: discarded.slice(),
      answers: answers.slice(),
      currentPos: null,
      ...(extra || {}),
    });
  };

  for (const i of order) {
    const q = queries[i];
    snapshot("query", { i, q });
    while (j < sorted.length && sorted[j][0] <= q) {
      const [start, end] = sorted[j];
      const entry = { len: end - start + 1, end, pos: j };
      heap = heap.concat(entry).sort((a, b) =>
        a.len - b.len || a.end - b.end || a.pos - b.pos);
      j += 1;
      const pushedIndex = heap.findIndex(e => e.pos === entry.pos);
      snapshot("admit", { i, q, pos: entry.pos, pushedIndex });
    }
    while (heap.length && heap[0].end < q) {
      const popped = heap[0];
      const heapBefore = heap.map(entry => ({ ...entry }));
      heap = heap.slice(1);
      discarded.push(popped.pos);
      events.push({
        kind: "discard",
        i,
        q,
        j,
        heapBefore,
        heap: heap.map(entry => ({ ...entry })),
        discarded: discarded.slice(),
        answers: answers.slice(),
        currentPos: popped.pos,
        popped: { ...popped },
      });
    }
    if (heap.length) answers[i] = heap[0].len;
    snapshot("answer", { i, q });
  }
  snapshot("done", { i: null, q: null });
  return { sorted, sortedOrder, order, queryRank, events, answers };
}
