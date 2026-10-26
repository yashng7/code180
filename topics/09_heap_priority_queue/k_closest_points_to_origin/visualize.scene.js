/* K Closest Points to Origin — animated walkthrough scene.
 *
 * Every point becomes a heap entry (-squared_distance, x, y).  The min-heap on
 * that tuple has the farthest point at its root, because the farthest point has
 * the most negative distance.  Popping while more than k remain leaves exactly
 * the k closest points.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "K Closest Points to Origin",
    subtitle: "max-heap by squared distance · pop the farthest · O(n log k)",
    inputs: [
      {
        id: "points",
        label: "points (x,y; …)",
        type: "text",
        default: "1,3; -2,2",
        width: "wide",
      },
      { id: "k", label: "k", type: "number", default: 1 },
    ],
    legend: [
      { color: "#58C4DD", text: "point / heap node" },
      { color: "#F0AC5F", text: "farthest kept (root)" },
      { color: "#83C167", text: "kept point" },
      { color: "#FC6255", text: "popped point" },
    ],
  },

  code: [
    "def k_closest(points: List[List[int]], k: int) -> List[List[int]]:",
    "    \"\"\"Return any ``k`` points with the smallest distance to ``(0, 0)``.\"\"\"",
    "    # Max-heap of the k smallest distances: store negated distance so the",
    "    # root is the *farthest* point kept so far and can be evicted.",
    "    heap = [(-(x * x + y * y), x, y) for x, y in points]",
    "    heapq.heapify(heap)",
    "    while len(heap) > k:",
    "        heapq.heappop(heap)",
    "    return [[x, y] for _, x, y in heap]",
  ],

  read(values) {
    const raw = String(values.points || "").trim();
    if (!raw) return null;
    const points = [];
    for (const chunk of raw.split(";")) {
      const part = chunk.trim();
      if (!part) continue;
      const nums = part.split(/[\s,]+/).filter(Boolean).map(Number);
      if (nums.length !== 2 || !nums.every(v => Number.isInteger(v) && Math.abs(v) <= 99)) return null;
      points.push([nums[0], nums[1]]);
    }
    if (points.length < 1 || points.length > 8) return null;
    const k = Number(values.k);
    if (!Number.isInteger(k) || k < 1 || k > points.length) return null;
    return { points, k };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const points = args[0].map(p => Array.isArray(p) ? p.map(Number) : null);
      const k = Number(args[1]);
      if (points.length >= 1 && points.length <= 8 &&
          points.every(p => p && p.length === 2 && p.every(Number.isInteger)) &&
          Number.isInteger(k) && k >= 1 && k <= points.length) {
        return {
          points: points.map(p => p[0] + "," + p[1]).join("; "),
          k: String(k),
        };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const { points, k } = params;
    const sim = simulateClosest(points, k);
    const n = points.length;

    ctx.backdrop();
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
      points, k, sim, ctx, pointViews: [], nodes: [], edges: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title ---------------------------------------------------------
    scene.title = txt("K Closest Points to Origin", {
      x: 64, y: 64, "font-size": 39, fill: C.white, "letter-spacing": 0.3,
    }, textL);
    const sub = el("text", { x: 64, y: 100, "font-size": 19, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "points = ";
    el("tspan", { fill: C.white }, sub).textContent =
      "[" + points.map(p => "(" + p[0] + "," + p[1] + ")").join(", ") + "]";
    el("tspan", {}, sub).textContent = "     k = ";
    el("tspan", { fill: C.gold }, sub).textContent = String(k);
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // ---- scatter panel -------------------------------------------------
    const sX = 48, sY = 168, sW = 574, sH = 406;
    scene.scatterPanel = el("g", {}, chipsL);
    el("rect", {
      x: sX, y: sY, width: sW, height: sH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.scatterPanel);
    setOpacity(scene.scatterPanel, 0);
    scene.scatterTitle = txt("points  ·  distance from the origin", {
      x: sX + 20, y: sY + 30, "font-size": 18, fill: C.blue,
    }, textL);
    setOpacity(scene.scatterTitle, 0);

    let maxAbs = 1;
    for (const p of points) maxAbs = Math.max(maxAbs, Math.abs(p[0]), Math.abs(p[1]));
    const cx = sX + sW / 2;
    const cy = sY + sH / 2 + 8;
    const scale = Math.min((sW / 2 - 50) / maxAbs, (sH / 2 - 62) / maxAbs);
    scene.plot = { cx, cy, scale, maxAbs };

    const axisX = el("line", {
      x1: sX + 24, y1: cy, x2: sX + sW - 24, y2: cy,
      stroke: C.greyDark, "stroke-width": 1.5,
    }, arcsL);
    const axisY = el("line", {
      x1: cx, y1: sY + 52, x2: cx, y2: sY + sH - 22,
      stroke: C.greyDark, "stroke-width": 1.5,
    }, arcsL);
    setOpacity(axisX, 0);
    setOpacity(axisY, 0);
    scene.axes = [axisX, axisY];
    scene.originLabel = txt("origin", {
      x: cx + 8, y: cy + 18, "font-size": 12, fill: C.grey,
    }, textL);
    setOpacity(scene.originLabel, 0);

    points.forEach((p, i) => {
      const x = cx + p[0] * scale;
      const y = cy - p[1] * scale;
      const g = el("g", { transform: "translate(" + x + " " + y + ")" }, chipsL);
      const enter = el("g", {}, g);
      const dot = el("circle", {
        cx: 0, cy: 0, r: 10, fill: C.blue, stroke: C.stage, "stroke-width": 2,
      }, enter);
      const ring = el("circle", {
        cx: 0, cy: 0, r: 16, fill: "none", stroke: C.gold,
        "stroke-width": 5, filter: "url(#glow-gold)",
      }, enter);
      const anchor = x > sX + sW - 90 ? "end" : "start";
      const dx = anchor === "end" ? -15 : 15;
      const coord = txt("(" + p[0] + ", " + p[1] + ")", {
        x: dx, y: -12, "text-anchor": anchor, "font-size": 16, fill: C.white,
      }, enter);
      const dist = txt("d² = " + (p[0] * p[0] + p[1] * p[1]), {
        x: dx, y: 20, "text-anchor": anchor, "font-size": 14, fill: C.teal,
      }, enter);
      setOpacity(enter, 0);
      setOpacity(ring, 0);
      scene.pointViews.push({ i, p, x, y, g, enter, dot, ring, coord, dist });
    });

    // ---- heap panel ----------------------------------------------------
    const hX = 652, hY = 168, hW = 580, hH = 406;
    scene.heapPanel = el("g", {}, chipsL);
    el("rect", {
      x: hX, y: hY, width: hW, height: hH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.heapPanel);
    setOpacity(scene.heapPanel, 0);
    scene.heapTitle = txt("heap  ·  (−d², x, y)", {
      x: hX + 20, y: hY + 30, "font-size": 18, fill: C.blue,
    }, textL);
    scene.heapSub = txt("root = farthest point kept  →  pop until only k remain", {
      x: hX + 20, y: hY + 56, "font-size": 14, fill: C.grey,
    }, textL);
    setOpacity(scene.heapTitle, 0);
    setOpacity(scene.heapSub, 0);

    const treeLeft = hX + 28;
    const treeW = hW - 56;
    const nodeX = i => {
      const depth = Math.floor(Math.log2(i + 1));
      const first = Math.pow(2, depth) - 1;
      const slot = i - first;
      return treeLeft + ((slot + 0.5) / Math.pow(2, depth)) * treeW;
    };
    const nodeY = i => hY + 128 + Math.floor(Math.log2(i + 1)) * 70;
    scene.nodeW = 98;
    scene.nodeH = 46;

    for (let i = 0; i < n; i++) {
      const x = nodeX(i), y = nodeY(i);
      const g = el("g", { transform: "translate(" + x + " " + y + ")" }, chipsL);
      const enter = el("g", {}, g);
      const rect = el("rect", {
        x: -scene.nodeW / 2, y: -scene.nodeH / 2,
        width: scene.nodeW, height: scene.nodeH, rx: 9,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, enter);
      const coord = txt("", {
        x: 0, y: -6, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": 13, fill: C.white,
      }, enter);
      const key = txt("", {
        x: 0, y: 12, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": 12, fill: C.teal,
      }, enter);
      const ring = el("rect", {
        x: -scene.nodeW / 2 - 3, y: -scene.nodeH / 2 - 3,
        width: scene.nodeW + 6, height: scene.nodeH + 6, rx: 11,
        fill: "none", stroke: C.gold, "stroke-width": 3, filter: "url(#glow-gold)",
      }, enter);
      const idx = txt("i=" + i, {
        x: 0, y: 31, "text-anchor": "middle", "font-size": 10, fill: C.grey,
      }, enter);
      setOpacity(enter, 0);
      setOpacity(ring, 0);
      scene.nodes.push({ i, x, y, g, enter, rect, coord, key, ring, idx });
    }

    for (let i = 1; i < n; i++) {
      const p = Math.floor((i - 1) / 2);
      const line = el("line", {
        x1: nodeX(p), y1: nodeY(p) + scene.nodeH / 2,
        x2: nodeX(i), y2: nodeY(i) - scene.nodeH / 2,
        stroke: C.greyDark, "stroke-width": 2,
      }, arcsL);
      setOpacity(line, 0);
      scene.edges.push({ i, p, line });
    }

    scene.heapSizeLabel = txt("heap size = 0", {
      x: hX + 20, y: hY + hH - 42, "font-size": 15, fill: C.grey,
    }, textL);
    scene.removedLabel = txt("", {
      x: hX + 20, y: hY + hH - 18, "font-size": 15, fill: C.red,
    }, textL);
    setOpacity(scene.heapSizeLabel, 0);
    setOpacity(scene.removedLabel, 0);

    // ---- bottom narration ---------------------------------------------
    scene.status = txt("", {
      x: 64, y: 620, "font-size": 20, fill: C.gold,
    }, textL);
    scene.detail = txt("", {
      x: 64, y: 650, "font-size": 16, fill: C.grey,
    }, textL);
    scene.result = txt("", {
      x: STAGE_W / 2, y: 698, "text-anchor": "middle",
      "font-size": 28, fill: C.green,
    }, resultL);
    setOpacity(scene.status, 0);
    setOpacity(scene.detail, 0);
    setOpacity(scene.result, 0);

    // ---- reset ---------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.scatterPanel, scene.scatterTitle,
                          scene.axes[0], scene.axes[1], scene.originLabel,
                          scene.heapPanel, scene.heapTitle, scene.heapSub,
                          scene.heapSizeLabel, scene.removedLabel, scene.status,
                          scene.detail, scene.result]) setOpacity(node, 0);
      scene.heapSizeLabel.textContent = "heap size = 0";
      scene.removedLabel.textContent = "";
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.result.textContent = "";
      for (const p of scene.pointViews) {
        setOpacity(p.enter, 0);
        setOpacity(p.ring, 0);
        p.dot.setAttribute("fill", C.blue);
        p.coord.setAttribute("fill", C.white);
      }
      for (const node of scene.nodes) {
        setOpacity(node.enter, 0);
        setOpacity(node.ring, 0);
        node.coord.textContent = "";
        node.key.textContent = "";
        node.rect.setAttribute("fill", C.chipFill);
        node.rect.setAttribute("stroke", C.greyDark);
      }
      for (const e of scene.edges) setOpacity(e.line, 0);
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity, setTranslate } = ctx;
    const { points, k, sim } = scene;
    const easeOut = ease.outCubic;

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
    const applyHeap = (state, dur) => {
      const arr = Array.isArray(state) ? state : state.heap;
      const marks = Array.isArray(state) ? [] : (state.marks || []);
      tl.add(0.01, () => {
        for (let i = 0; i < scene.nodes.length; i++) {
          const node = scene.nodes[i];
          if (i < arr.length) {
            const e = arr[i];
            node.coord.textContent = "(" + e.x + ", " + e.y + ")";
            node.key.textContent = "−d² = " + e.key;
            setOpacity(node.enter, 1);
            node.rect.setAttribute("fill", i === 0 ? "#16232b" : C.chipFill);
            node.rect.setAttribute("stroke", i === 0 ? C.blue : C.greyDark);
          } else {
            setOpacity(node.enter, 0);
          }
          setOpacity(node.ring, 0);
        }
        for (const e of scene.edges) {
          setOpacity(e.line, (e.i < arr.length && e.p < arr.length) ? 1 : 0);
        }
        for (const i of marks) {
          const node = scene.nodes[i];
          if (!node) continue;
          node.ring.setAttribute("stroke", C.gold);
          setOpacity(node.ring, 1);
        }
        scene.heapSizeLabel.textContent = "heap size = " + arr.length + "   (k = " + k + ")";
        tl.log("heap size = " + arr.length, C.blue, { hold: false });
      });
      tl.add(dur || 0.2, u => {
        for (const node of scene.nodes) {
          const op = Number(node.ring.style.opacity) || 0;
          if (op > 0) setOpacity(node.ring, Math.max(0, 1 - u));
        }
      }, easeOut);
    };
    const markPoint = (i, stroke, fill) => {
      tl.add(0.01, () => {
        const p = scene.pointViews[i];
        if (!p) return;
        p.ring.setAttribute("stroke", stroke);
        setOpacity(p.ring, 1);
        p.dot.setAttribute("fill", fill);
      });
    };

    // ---- intro ---------------------------------------------------------
    tl.line([1, 2]);
    tl.add(0.6, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    tl.add(0.35, u => {
      setOpacity(scene.scatterPanel, u);
      setOpacity(scene.scatterTitle, u);
      setOpacity(scene.axes[0], u);
      setOpacity(scene.axes[1], u);
      setOpacity(scene.originLabel, u);
    }, easeOut);
    for (const p of scene.pointViews) {
      tl.add(0.22, u => setOpacity(p.enter, u), easeOut);
      tl.wait(0.04);
    }
    tl.line([3, 4]);
    status("squared distance x² + y² preserves the distance ordering", C.blue);
    detail("no square root is needed, and the entries are negated to turn the min-heap into a max-heap");

    // ---- build heap ----------------------------------------------------
    tl.line(5);
    status("build one entry per point:  (−d², x, y)", C.teal);
    tl.add(0.35, u => {
      setOpacity(scene.heapPanel, u);
      setOpacity(scene.heapTitle, u);
      setOpacity(scene.heapSub, u);
      setOpacity(scene.heapSizeLabel, u);
    }, easeOut);
    for (const e of sim.initialRaw) {
      const mark = scene.pointViews[e.i];
      if (mark) {
        markPoint(e.i, C.blue, C.blue);
      }
    }
    applyHeap(sim.initialRaw, 0.25);
    tl.line(6);
    status("heapify  ·  the most negative distance rises to the root", C.gold);
    sim.heapifyStates.forEach((state, si) => {
      if (si === 0) return;
      applyHeap(state, 0.22);
    });
    const rootNow = sim.initialRaw.length ? sim.initialRaw[0] : null;
    if (rootNow) {
      markPoint(rootNow.i, C.gold, C.gold);
      detail("root = (" + rootNow.x + ", " + rootNow.y + ") with d² = " + (-rootNow.key) + " — the farthest kept");
    }
    tl.wait(0.15);

    // ---- pop far points -------------------------------------------------
    let removedCount = 0;
    for (const step of sim.steps) {
      const removed = step.removed;
      tl.line(7);
      status("heap size " + step.beforeSize + " > k = " + k + "  →  pop the root", C.red);
      detail("remove the farthest point (" + removed.x + ", " + removed.y + "), d² = " + (-removed.key));
      markPoint(removed.i, C.red, C.red);
      const rootNode = scene.nodes[0];
      tl.add(0.28, u => {
        if (rootNode) {
          rootNode.ring.setAttribute("stroke", C.red);
          setOpacity(rootNode.ring, u);
        }
      }, easeOut);
      tl.line(8);
      step.states.forEach((state, si) => applyHeap(state, 0.2));
      removedCount++;
      tl.add(0.01, () => {
        scene.removedLabel.textContent = "popped " + removedCount + ":  (" +
          removed.x + ", " + removed.y + ")  d² = " + (-removed.key);
        setOpacity(scene.removedLabel, 1);
      });
      tl.wait(0.1);
    }

    // ---- output --------------------------------------------------------
    tl.line(9);
    status("only the k closest points remain in the heap", C.green);
    detail("return their coordinates in any order");
    for (const e of sim.outputEntries) markPoint(e.i, C.green, C.green);
    tl.add(0.01, () => {
      const root = scene.nodes[0];
      if (root) {
        root.ring.setAttribute("stroke", C.green);
        setOpacity(root.ring, 1);
      }
    });
    const out = "[" + sim.outputEntries.map(e => "(" + e.x + ", " + e.y + ")").join(", ") + "]";
    tl.add(0.01, () => {
      scene.result.textContent = "return " + out;
      setOpacity(scene.result, 1);
    });
    tl.add(0.5, u => setOpacity(scene.result, u), easeOut);
    tl.log("return " + out, C.green);
    tl.wait(0.9);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Tuple heap helpers.  Entries are {key, x, y, i} but Python's heap
 * compares only (key, x, y), so `i` is display metadata.
 * ------------------------------------------------------------------ */

function closestCmp(a, b) {
  if (a.key !== b.key) return a.key - b.key;
  if (a.x !== b.x) return a.x - b.x;
  return a.y - b.y;
}

function closestSnapshot(a) {
  return a.slice();
}

function closestSiftDown(a, i, states) {
  const n = a.length;
  while (true) {
    let smallest = i;
    const l = 2 * i + 1, r = 2 * i + 2;
    if (l < n && closestCmp(a[l], a[smallest]) < 0) smallest = l;
    if (r < n && closestCmp(a[r], a[smallest]) < 0) smallest = r;
    if (smallest === i) break;
    const t = a[i]; a[i] = a[smallest]; a[smallest] = t;
    states.push({ heap: closestSnapshot(a), marks: [i, smallest] });
    i = smallest;
  }
}

function closestHeapifyStates(a) {
  const states = [{ heap: closestSnapshot(a), marks: [] }];
  for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) closestSiftDown(a, i, states);
  return states;
}

function closestPopStates(a) {
  const states = [];
  const out = a[0];
  const last = a.pop();
  if (a.length) {
    a[0] = last;
    states.push({ heap: closestSnapshot(a), marks: [0] });
    closestSiftDown(a, 0, states);
  } else {
    states.push({ heap: closestSnapshot(a), marks: [] });
  }
  return { removed: out, states };
}

function simulateClosest(points, k) {
  const raw = points.map((p, i) => ({
    key: -(p[0] * p[0] + p[1] * p[1]), x: p[0], y: p[1], i,
  }));
  const work = raw.slice();
  const heapify = closestHeapifyStates(work);
  const steps = [];

  while (work.length > k) {
    const beforeSize = work.length;
    const popped = closestPopStates(work);
    steps.push({ removed: popped.removed, states: popped.states, beforeSize });
  }

  return {
    initialRaw: raw,
    heapifyStates: heapify,
    steps,
    outputEntries: work.slice(),
  };
}
