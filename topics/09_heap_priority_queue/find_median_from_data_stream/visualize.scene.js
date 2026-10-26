/* Find Median from Data Stream — animated walkthrough scene.
 *
 * Two heaps split the stream: `_small` is a max-heap (stored negated) for the
 * lower half and `_large` is a min-heap for the upper half.  The tops are the
 * two middle values, so the median is read in O(1).
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Find Median from Data Stream",
    subtitle: "one max-heap + one min-heap · balanced halves · median from the tops",
    inputs: [
      {
        id: "ops",
        label: "operations",
        type: "text",
        default: "MedianFinder(), addNum(1), addNum(2), findMedian(), addNum(3), findMedian()",
        width: "wide",
      },
    ],
    legend: [
      { color: "#B58CD6", text: "_small · lower half" },
      { color: "#58C4DD", text: "_large · upper half" },
      { color: "#F0AC5F", text: "median / top" },
      { color: "#83C167", text: "returned value" },
    ],
  },

  code: [
    "class MedianFinder:",
    "    \"\"\"Tracks the median of n added numbers.\"\"\"",
    "    def __init__(self) -> None:",
    "        self._small: list[int] = []      # max-heap (negated) — lower half",
    "        self._large: list[int] = []      # min-heap — upper half",
    "    def addNum(self, num: int) -> None:",
    "        # Push onto the lower half, then move its largest to the upper half,",
    "        # so every value in _small is <= every value in _large.",
    "        heapq.heappush(self._small, -num)",
    "        heapq.heappush(self._large, -heapq.heappop(self._small))",
    "        # Keep the sizes balanced: _small may hold at most one extra element.",
    "        if len(self._large) > len(self._small):",
    "            heapq.heappush(self._small, -heapq.heappop(self._large))",
    "    def findMedian(self) -> float:",
    "        if len(self._small) > len(self._large):",
    "            return float(-self._small[0])",
    "        return (-self._small[0] + self._large[0]) / 2.0",
  ],

  read(values) {
    const raw = String(values.ops || "").trim();
    if (!raw) return null;
    const tokens = splitTopLevel(raw);
    const ops = [];
    for (const token of tokens) {
      const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)$/.exec(token.trim());
      if (!m) return null;
      const name = m[1];
      const inner = m[2].trim();
      if (name === "MedianFinder") {
        if (inner) return null;
        ops.push({ name });
      } else if (name === "addNum") {
        const val = Number(inner);
        if (!inner || !Number.isInteger(val)) return null;
        ops.push({ name, val });
      } else if (name === "findMedian") {
        if (inner) return null;
        ops.push({ name });
      } else {
        return null;
      }
    }
    if (!ops.length || ops[0].name !== "MedianFinder" || ops.length > 10) return null;
    return { ops };
  },

  fromArgs(args) {
    let payload = null;
    if (args && !Array.isArray(args) && typeof args === "object" && args.ops) payload = args;
    else if (Array.isArray(args) && args[0] && !Array.isArray(args[0]) && args[0].ops) payload = args[0];
    if (!payload || !Array.isArray(payload.ops) || !Array.isArray(payload.vals)) return null;
    if (payload.ops.length !== payload.vals.length || payload.ops.length > 10) return null;
    const parts = [];
    for (let i = 0; i < payload.ops.length; i++) {
      const name = payload.ops[i];
      const vals = payload.vals[i] || [];
      if (name === "MedianFinder" || name === "findMedian") {
        parts.push(name + "()");
      } else if (name === "addNum") {
        if (vals.length !== 1) return null;
        parts.push("addNum(" + vals[0] + ")");
      } else {
        return null;
      }
    }
    return { ops: parts.join(", ") };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const ops = params.ops;
    const sim = simulateMedian(ops);
    const pool = 8;

    ctx.backdrop();
    ctx.glow("glow-purple", C.purple);
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-red", C.red);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const arcsL = ctx.layer("arcs");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = {
      ops, sim, ctx, opCells: [], smallNodes: [], largeNodes: [],
      smallEdges: [], largeEdges: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title ---------------------------------------------------------
    scene.title = txt("Find Median from Data Stream", {
      x: 64, y: 62, "font-size": 37, fill: C.white, "letter-spacing": 0.3,
    }, textL);
    const sub = el("text", { x: 64, y: 96, "font-size": 18, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "two heaps · ";
    el("tspan", { fill: C.purple }, sub).textContent = "_small (lower)";
    el("tspan", {}, sub).textContent = "  +  ";
    el("tspan", { fill: C.blue }, sub).textContent = "_large (upper)";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // ---- operation ribbon ---------------------------------------------
    const opY = 134, opH = 38;
    const nOps = ops.length;
    const opW = clamp(Math.floor(1100 / nOps) - 8, 72, 138);
    const opGap = 8;
    const totalW = nOps * opW + (nOps - 1) * opGap;
    const startX = STAGE_W / 2 - totalW / 2;
    scene.opY = opY;
    scene.opH = opH;

    ops.forEach((op, i) => {
      const x = startX + i * (opW + opGap);
      const g = el("g", {}, chipsL);
      setOpacity(g, 0);
      const rect = el("rect", {
        x, y: opY - opH / 2, width: opW, height: opH, rx: 8,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.8,
      }, g);
      const label = op.name === "addNum" ? "addNum(" + op.val + ")" : op.name + "()";
      const t = txt(label, {
        x: x + opW / 2, y: opY, "text-anchor": "middle",
        "dominant-baseline": "central",
        "font-size": clamp(opW / Math.max(9, label.length * 0.58), 8.5, 13),
        fill: C.grey,
      }, g);
      const ret = txt("", {
        x: x + opW / 2, y: opY + opH / 2 + 20, "text-anchor": "middle",
        "font-size": 14, fill: C.green,
      }, textL);
      setOpacity(ret, 0);
      scene.opCells.push({ i, op, g, rect, t, ret, cx: x + opW / 2 });
    });

    const ptr = el("g", {}, ptrL);
    el("polygon", { points: "-8,-12 8,-12 0,-1", fill: C.gold, filter: "url(#glow-gold)" }, ptr);
    setOpacity(ptr, 0);
    scene.opPtr = ptr;

    // ---- heap panel helper ---------------------------------------------
    const makeHeapPanel = (x0, title, subtitle, color, glowId) => {
      const y0 = 198, w = 574, h = 320;
      const panel = el("g", {}, chipsL);
      el("rect", {
        x: x0, y: y0, width: w, height: h, rx: 14,
        fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
      }, panel);
      setOpacity(panel, 0);
      const titleNode = txt(title, {
        x: x0 + 20, y: y0 + 30, "font-size": 18, fill: color,
      }, textL);
      setOpacity(titleNode, 0);
      const subNode = txt(subtitle, {
        x: x0 + 20, y: y0 + 54, "font-size": 13, fill: C.grey,
      }, textL);
      setOpacity(subNode, 0);

      const treeLeft = x0 + 24;
      const treeW = w - 48;
      const nodeX = i => {
        const depth = Math.floor(Math.log2(i + 1));
        const first = Math.pow(2, depth) - 1;
        const slot = i - first;
        return treeLeft + ((slot + 0.5) / Math.pow(2, depth)) * treeW;
      };
      const nodeY = i => y0 + 102 + Math.floor(Math.log2(i + 1)) * 74;
      const r = 21;
      const nodes = [];
      const edges = [];
      for (let i = 0; i < pool; i++) {
        const x = nodeX(i), y = nodeY(i);
        const g = el("g", { transform: "translate(" + x + " " + y + ")" }, chipsL);
        const enter = el("g", {}, g);
        const scale = el("g", {}, enter);
        const circle = el("circle", {
          cx: 0, cy: 0, r, fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2.1,
        }, scale);
        const value = txt("", {
          x: 0, y: 1, "text-anchor": "middle", "dominant-baseline": "central",
          "font-size": 17, fill: C.white,
        }, scale);
        const ring = el("circle", {
          cx: 0, cy: 0, r: r + 5, fill: "none", stroke: C.gold,
          "stroke-width": 3, filter: "url(#glow-gold)",
        }, scale);
        const idx = txt("i=" + i, {
          x: 0, y: r + 14, "text-anchor": "middle", "font-size": 9, fill: C.grey,
        }, enter);
        setOpacity(enter, 0);
        setOpacity(ring, 0);
        nodes.push({ i, x, y, g, enter, scale, circle, value, ring, idx });
      }
      for (let i = 1; i < pool; i++) {
        const p = Math.floor((i - 1) / 2);
        const line = el("line", {
          x1: nodeX(p), y1: nodeY(p) + r - 2,
          x2: nodeX(i), y2: nodeY(i) - r + 2,
          stroke: C.greyDark, "stroke-width": 2,
        }, arcsL);
        setOpacity(line, 0);
        edges.push({ i, p, line });
      }
      return {
        panel, titleNode, subNode, nodes, edges, x0, y0, w, h,
        arrayText: txt("", {
          x: x0 + 20, y: y0 + 268, "font-size": 14, fill: color,
        }, textL),
        sizeText: txt("", {
          x: x0 + 20, y: y0 + 294, "font-size": 14, fill: C.grey,
        }, textL),
      };
    };

    scene.smallPanel = makeHeapPanel(
      48, "_small  ·  max-heap (stored negated)", "lower half  ·  root = largest of the small values",
      C.purple, "glow-purple"
    );
    scene.largePanel = makeHeapPanel(
      658, "_large  ·  min-heap", "upper half  ·  root = smallest of the large values",
      C.blue, "glow-blue"
    );

    // ---- sorted view + median -----------------------------------------
    scene.sortedText = txt("", {
      x: 64, y: 552, "font-size": 17, fill: C.white,
    }, textL);
    scene.medianText = txt("", {
      x: 64, y: 584, "font-size": 21, fill: C.gold,
    }, textL);
    setOpacity(scene.sortedText, 0);
    setOpacity(scene.medianText, 0);

    // ---- narration -----------------------------------------------------
    scene.status = txt("", {
      x: 64, y: 620, "font-size": 20, fill: C.gold,
    }, textL);
    scene.detail = txt("", {
      x: 64, y: 648, "font-size": 16, fill: C.grey,
    }, textL);
    scene.final = txt("", {
      x: STAGE_W / 2, y: 692, "text-anchor": "middle",
      "font-size": 19, fill: C.green,
    }, resultL);
    setOpacity(scene.status, 0);
    setOpacity(scene.detail, 0);
    setOpacity(scene.final, 0);

    // ---- reset ---------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.sortedText, scene.medianText,
                          scene.status, scene.detail, scene.final]) setOpacity(node, 0);
      for (const cell of scene.opCells) {
        setOpacity(cell.g, 0);
        cell.rect.setAttribute("fill", C.chipFill);
        cell.rect.setAttribute("stroke", C.greyDark);
        cell.t.setAttribute("fill", C.grey);
        cell.ret.textContent = "";
        setOpacity(cell.ret, 0);
      }
      setOpacity(scene.opPtr, 0);
      for (const panel of [scene.smallPanel, scene.largePanel]) {
        setOpacity(panel.panel, 0);
        setOpacity(panel.titleNode, 0);
        setOpacity(panel.subNode, 0);
        setOpacity(panel.arrayText, 0);
        setOpacity(panel.sizeText, 0);
        panel.arrayText.textContent = "";
        panel.sizeText.textContent = "";
        for (const node of panel.nodes) {
          setOpacity(node.enter, 0);
          node.value.textContent = "";
          node.circle.setAttribute("fill", C.chipFill);
          node.circle.setAttribute("stroke", C.greyDark);
          setOpacity(node.ring, 0);
        }
        for (const e of panel.edges) setOpacity(e.line, 0);
      }
      scene.sortedText.textContent = "";
      scene.medianText.textContent = "";
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.final.textContent = "";
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity, setTranslate } = ctx;
    const { ops, sim } = scene;
    const easeOut = ease.outCubic;

    scene.reset();

    const status = (text, color, det) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || C.gold);
        setOpacity(scene.status, 1);
        if (det !== undefined) {
          scene.detail.textContent = det;
          setOpacity(scene.detail, 1);
        }
      });
      tl.log(text, color || C.gold);
    };
    const detail = text => {
      tl.add(0.01, () => {
        scene.detail.textContent = text;
        setOpacity(scene.detail, 1);
      });
    };
    const activeOp = (index, prevIndex) => {
      tl.add(0.3, u => {
        const e = ease.inOutSine(u);
        const from = prevIndex == null ? scene.opCells[0].cx : scene.opCells[prevIndex].cx;
        setTranslate(scene.opPtr, from + (scene.opCells[index].cx - from) * e,
          scene.opY - scene.opH / 2 - 5);
        setOpacity(scene.opPtr, 1);
        if (u > 0.45) {
          if (prevIndex != null) {
            const prev = scene.opCells[prevIndex];
            prev.rect.setAttribute("fill", C.chipFill);
            prev.rect.setAttribute("stroke", C.greyDark);
            prev.t.setAttribute("fill", C.grey);
          }
          scene.opCells[index].rect.setAttribute("fill", "#262015");
          scene.opCells[index].rect.setAttribute("stroke", C.gold);
          scene.opCells[index].t.setAttribute("fill", C.white);
        }
      });
    };
    const setReturn = (index, value) => {
      tl.add(0.01, () => {
        const ret = scene.opCells[index].ret;
        ret.textContent = value === null ? "null" : String(value);
        ret.setAttribute("fill", value === null ? C.grey : C.green);
        setOpacity(ret, 1);
      });
    };
    const applyBoth = (snap, dur) => {
      tl.add(0.01, () => {
        const pairs = [
          { panel: scene.smallPanel, arr: snap.small, neg: true, marks: snap.marksSmall || [] },
          { panel: scene.largePanel, arr: snap.large, neg: false, marks: snap.marksLarge || [] },
        ];
        for (const item of pairs) {
          const { panel, arr, neg, marks } = item;
          for (let i = 0; i < panel.nodes.length; i++) {
            const node = panel.nodes[i];
            if (i < arr.length) {
              const value = neg ? -arr[i] : arr[i];
              node.value.textContent = String(value);
              setOpacity(node.enter, 1);
              node.circle.setAttribute("fill", i === 0 ? "#1e2130" : C.chipFill);
              node.circle.setAttribute("stroke", i === 0 ? C.gold : C.greyDark);
            } else {
              setOpacity(node.enter, 0);
            }
            setOpacity(node.ring, 0);
          }
          for (const e of panel.edges) {
            setOpacity(e.line, (e.i < arr.length && e.p < arr.length) ? 1 : 0);
          }
          for (const i of marks) {
            const node = panel.nodes[i];
            if (!node) continue;
            node.ring.setAttribute("stroke", C.gold);
            setOpacity(node.ring, 1);
          }
          panel.arrayText.textContent = "array = [" +
            (neg ? arr.map(v => -v) : arr).join(", ") + "]";
          panel.sizeText.textContent = "size = " + arr.length;
          if (arr.length === 0) panel.arrayText.textContent = "array = []";
        }
      });
      tl.add(dur || 0.18, u => {
        for (const panel of [scene.smallPanel, scene.largePanel]) {
          for (const node of panel.nodes) {
            const op = Number(node.ring.style.opacity) || 0;
            if (op > 0) setOpacity(node.ring, Math.max(0, 1 - u));
          }
        }
      }, easeOut);
    };
    // The simulation already knows each add's sorted snapshot; use its step.
    const showSorted = (values, medianHint) => {
      tl.add(0.01, () => {
        scene.sortedText.textContent = "all values sorted = [" + values.join(", ") + "]";
        setOpacity(scene.sortedText, 1);
        if (medianHint !== undefined) {
          scene.medianText.textContent = medianHint;
          setOpacity(scene.medianText, 1);
        }
      });
    };

    // ---- intro ---------------------------------------------------------
    tl.line([1, 2]);
    tl.add(0.6, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    for (const cell of scene.opCells) tl.add(0.12, u => setOpacity(cell.g, u), easeOut);
    for (const panel of [scene.smallPanel, scene.largePanel]) {
      tl.add(0.35, u => {
        setOpacity(panel.panel, u);
        setOpacity(panel.titleNode, u);
        setOpacity(panel.subNode, u);
        setOpacity(panel.arrayText, u);
        setOpacity(panel.sizeText, u);
      }, easeOut);
    }
    tl.line([3, 4, 5]);
    status("start with two empty heaps", C.blue,
      "_small gets the lower half, _large gets the upper half");
    applyBoth({ small: [], large: [] }, 0.2);
    setReturn(0, null);
    tl.wait(0.1);

    let prevIndex = 0;
    for (let si = 1; si < ops.length; si++) {
      const op = ops[si];
      const step = sim.steps[si];
      activeOp(si, prevIndex);
      prevIndex = si;

      if (op.name === "addNum") {
        tl.line(6);
        tl.line(7);
        tl.line(8);
        status("addNum(" + op.val + ")  ·  push −" + op.val + " onto _small", C.purple,
          "the lower half is a max-heap, so its largest value sits at the root");
        step.segments[0].states.forEach((snap, k) => applyBoth(snap, 0.16));
        tl.line(9);
        status("move _small's largest into _large", C.blue,
          "this guarantees every value in _small ≤ every value in _large");
        step.segments[1].states.forEach((snap, k) => applyBoth(snap, 0.16));
        tl.line(10);
        if (step.rebalanced) {
          tl.line(11);
          status("_large grew too big  →  move its smallest back to _small", C.purple,
            "sizes stay balanced to within one element");
          step.segments[2].states.forEach((snap, k) => applyBoth(snap, 0.16));
        } else {
          tl.line(12);
          status("sizes are balanced  →  no move back", C.grey,
            "_small may hold at most one extra element");
        }
        setReturn(si, null);
        showSorted(step.sorted, step.medianHint);
        tl.wait(0.1);
      } else {
        tl.line(13);
        tl.line(14);
        if (step.odd) {
          tl.line(15);
          status("odd count  →  the extra element is in _small", C.gold,
            "the median is the root of the max-heap");
          tl.add(0.01, () => {
            const node = scene.smallPanel.nodes[0];
            if (node) {
              node.ring.setAttribute("stroke", C.green);
              setOpacity(node.ring, 1);
            }
          });
          tl.line(16);
          status("findMedian() = −_small[0] = " + medianFmt(step.result), C.green,
            "the middle value is the largest of the lower half");
        } else {
          status("even count  →  average the two roots", C.gold,
            "one middle value comes from each heap");
          tl.add(0.01, () => {
            for (const node of [scene.smallPanel.nodes[0], scene.largePanel.nodes[0]]) {
              if (node) {
                node.ring.setAttribute("stroke", C.green);
                setOpacity(node.ring, 1);
              }
            }
          });
          tl.line(17);
          status("findMedian() = (−_small[0] + _large[0]) / 2 = " + medianFmt(step.result), C.green,
            "the two tops are the middle pair");
        }
        setReturn(si, medianFmt(step.result));
        showSorted(step.sorted, "median = " + medianFmt(step.result));
        tl.wait(0.15);
      }
    }

    // ---- final summary -------------------------------------------------
    tl.add(0.3, u => {
      setOpacity(scene.opPtr, 1 - u);
      setOpacity(scene.status, 1 - u);
      setOpacity(scene.detail, 1 - u);
    }, easeOut);
    const returnsStr = "returns = [" + sim.returns.map(v => v === null ? "null" : medianFmt(v)).join(", ") + "]";
    tl.add(0.01, () => {
      scene.final.textContent = returnsStr;
      setOpacity(scene.final, 1);
    });
    tl.add(0.45, u => setOpacity(scene.final, u), easeOut);
    tl.log(returnsStr, C.green);
    tl.wait(0.8);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Parsing and two-heap simulation.
 * ------------------------------------------------------------------ */

function splitTopLevel(raw) {
  const parts = [];
  let depth = 0, start = 0;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") depth--;
    else if (ch === "," && depth === 0) {
      parts.push(raw.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(raw.slice(start));
  return parts.map(s => s.trim()).filter(Boolean);
}

function medianFmt(v) {
  return Number.isInteger(v) ? v.toFixed(1) : String(v);
}

function medianSnap(small, large, marksSmall, marksLarge) {
  return {
    small: small.slice(),
    large: large.slice(),
    marksSmall: (marksSmall || []).slice(),
    marksLarge: (marksLarge || []).slice(),
  };
}

function medianSiftDown(a, i, states) {
  const n = a.length;
  while (true) {
    let smallest = i;
    const l = 2 * i + 1, r = 2 * i + 2;
    if (l < n && a[l] < a[smallest]) smallest = l;
    if (r < n && a[r] < a[smallest]) smallest = r;
    if (smallest === i) break;
    const t = a[i]; a[i] = a[smallest]; a[smallest] = t;
    states.push({ heap: a.slice(), marks: [i, smallest] });
    i = smallest;
  }
}

function medianSiftUp(a, i, states) {
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (a[i] >= a[p]) break;
    const t = a[i]; a[i] = a[p]; a[p] = t;
    states.push({ heap: a.slice(), marks: [i, p] });
    i = p;
  }
}

function medianPushStates(a, value) {
  const states = [];
  a.push(value);
  states.push({ heap: a.slice(), marks: [a.length - 1] });
  medianSiftUp(a, a.length - 1, states);
  return states;
}

function medianPopStates(a) {
  const states = [];
  const out = a[0];
  const last = a.pop();
  if (a.length) {
    a[0] = last;
    states.push({ heap: a.slice(), marks: [0] });
    medianSiftDown(a, 0, states);
  } else {
    states.push({ heap: a.slice(), marks: [] });
  }
  return { value: out, states };
}

function medianWrap(states, side, other) {
  return states.map(s => side === "small"
    ? medianSnap(s.heap, other, s.marks, [])
    : medianSnap(other, s.heap, [], s.marks));
}

function medianSorted(values) {
  return values.slice().sort((a, b) => a - b);
}

function medianOf(small, large) {
  if (small.length > large.length) return -small[0];
  return (-small[0] + large[0]) / 2.0;
}

function simulateMedian(ops) {
  const small = [];
  const large = [];
  const all = [];
  const steps = [{ kind: "init" }];
  const returns = [null];

  for (let i = 1; i < ops.length; i++) {
    const op = ops[i];
    if (op.name === "addNum") {
      all.push(op.val);
      const segments = [];
      const pushSmall = medianPushStates(small, -op.val);
      segments.push({ kind: "pushSmall", states: medianWrap(pushSmall, "small", large) });

      const popSmall = medianPopStates(small);
      const smallSnaps = medianWrap(popSmall.states, "small", large);
      const pushLarge = medianPushStates(large, -popSmall.value);
      const largeSnaps = medianWrap(pushLarge, "large", small);
      segments.push({ kind: "moveToLarge", states: smallSnaps.concat(largeSnaps) });

      let rebalanced = false;
      let rebalanceStates = [];
      if (large.length > small.length) {
        rebalanced = true;
        const popLarge = medianPopStates(large);
        const largePart = medianWrap(popLarge.states, "large", small);
        const backPush = medianPushStates(small, -popLarge.value);
        const smallPart = medianWrap(backPush, "small", large);
        rebalanceStates = largePart.concat(smallPart);
        segments.push({ kind: "rebalance", states: rebalanceStates });
      }

      const sorted = medianSorted(all);
      const med = medianOf(small, large);
      steps.push({
        kind: "add", val: op.val, segments, rebalanced, sorted,
        medianHint: "median so far = " + medianFmt(med),
        small: small.slice(), large: large.slice(),
      });
      returns.push(null);
    } else {
      const sorted = medianSorted(all);
      const med = medianOf(small, large);
      steps.push({
        kind: "median", result: med, sorted, odd: small.length > large.length,
        small: small.slice(), large: large.slice(),
      });
      returns.push(med);
    }
  }

  return { steps, returns };
}
