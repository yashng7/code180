/* Last Stone Weight — animated walkthrough scene.
 *
 * A negated max-heap is drawn as a binary tree.  The two heaviest stones are
 * pulled from the root, smashed, and (when unequal) the difference is pushed
 * back.  The tree layout is fixed by array index, so every sift is visible.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Last Stone Weight",
    subtitle: "max-heap of negated weights · smash the two heaviest · O(n log n)",
    inputs: [
      {
        id: "stones",
        label: "stones",
        type: "text",
        default: "2, 7, 4, 1, 8, 1",
        width: "wide",
      },
    ],
    legend: [
      { color: "#58C4DD", text: "heap node" },
      { color: "#F0AC5F", text: "heaviest / current" },
      { color: "#83C167", text: "new stone / result" },
      { color: "#FC6255", text: "removed" },
    ],
  },

  code: [
    "def last_stone_weight(stones: List[int]) -> int:",
    "    \"\"\"Return the weight of the last remaining stone (0 if all destroyed).\"\"\"",
    "    heap = [-s for s in stones]       # negate to fake a max-heap",
    "    heapq.heapify(heap)",
    "    while len(heap) > 1:",
    "        y = -heapq.heappop(heap)      # heaviest",
    "        x = -heapq.heappop(heap)      # second heaviest",
    "        if y != x:",
    "            heapq.heappush(heap, -(y - x))",
    "    return -heap[0] if heap else 0",
  ],

  read(values) {
    const raw = String(values.stones || "").trim();
    if (!raw) return null;
    const stones = raw.split(/[\s,]+/).filter(Boolean).map(Number);
    if (stones.length < 1 || stones.length > 10) return null;
    if (!stones.every(v => Number.isInteger(v) && v >= 0 && v <= 99)) return null;
    return { stones };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const stones = args[0].map(Number);
      if (stones.length >= 1 && stones.length <= 10 &&
          stones.every(v => Number.isInteger(v) && v >= 0 && v <= 99)) {
        return { stones: stones.join(", ") };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, setScaleAt, STAGE_W } = ctx;
    const stones = params.stones;
    const sim = simulateStones(stones);
    const pool = Math.max(stones.length, 1);

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
      stones, sim, ctx, nodes: [], edges: [], _writers: [], _resets: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };
    scene.registerReset = fn => { scene._resets.push(fn); };

    // ---- title ---------------------------------------------------------
    scene.title = txt("Last Stone Weight", {
      x: 64, y: 64, "font-size": 40, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    const sub = el("text", { x: 64, y: 100, "font-size": 19, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "stones = ";
    el("tspan", { fill: C.white }, sub).textContent = "[" + stones.join(", ") + "]";
    el("tspan", {}, sub).textContent = "     max-heap stores each weight negated";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // ---- heap panel ----------------------------------------------------
    const panelX = 48, panelY = 176, panelW = 700, panelH = 380;
    scene.heapPanel = el("g", {}, chipsL);
    el("rect", {
      x: panelX, y: panelY, width: panelW, height: panelH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.heapPanel);
    setOpacity(scene.heapPanel, 0);
    scene.heapTitle = txt("heap  ·  root = heaviest stone", {
      x: panelX + 20, y: panelY + 30, "font-size": 18, fill: C.blue,
    }, textL);
    setOpacity(scene.heapTitle, 0);

    // Fixed complete-tree positions: a node keeps its array index forever.
    const treeLeft = panelX + 34;
    const treeW = panelW - 68;
    const levelY = i => {
      const depth = Math.floor(Math.log2(i + 1));
      return panelY + 86 + depth * 88;
    };
    const nodeX = i => {
      const depth = Math.floor(Math.log2(i + 1));
      const first = Math.pow(2, depth) - 1;
      const slot = i - first;
      const count = Math.pow(2, depth);
      return treeLeft + ((slot + 0.5) / count) * treeW;
    };
    scene.nodeR = 26;

    for (let i = 0; i < pool; i++) {
      const x = nodeX(i);
      const y = levelY(i);
      const g = el("g", { transform: "translate(" + x + " " + y + ")" }, chipsL);
      const enter = el("g", {}, g);
      const scale = el("g", {}, enter);
      const circle = el("circle", {
        cx: 0, cy: 0, r: scene.nodeR, fill: C.chipFill,
        stroke: C.greyDark, "stroke-width": 2.2,
      }, scale);
      const value = txt("", {
        x: 0, y: 1, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": 21, fill: C.white,
      }, scale);
      const ring = el("circle", {
        cx: 0, cy: 0, r: scene.nodeR + 5, fill: "none",
        stroke: C.gold, "stroke-width": 3, filter: "url(#glow-gold)",
      }, scale);
      const indexLabel = txt("i=" + i, {
        x: 0, y: scene.nodeR + 16, "text-anchor": "middle",
        "font-size": 11, fill: C.grey,
      }, enter);
      setOpacity(enter, 0);
      setOpacity(ring, 0);
      scene.nodes.push({ i, x, y, g, enter, scale, circle, value, ring, indexLabel });
    }

    for (let i = 1; i < pool; i++) {
      const p = Math.floor((i - 1) / 2);
      const line = el("line", {
        x1: nodeX(p), y1: levelY(p) + scene.nodeR - 2,
        x2: nodeX(i), y2: levelY(i) - scene.nodeR + 2,
        stroke: C.greyDark, "stroke-width": 2.2,
      }, arcsL);
      setOpacity(line, 0);
      const edge = { i, p, line };
      scene.edges.push(edge);
    }

    // ---- smash panel ---------------------------------------------------
    const sideX = 782, sideY = 176, sideW = 450, sideH = 380;
    scene.sidePanel = el("g", {}, chipsL);
    el("rect", {
      x: sideX, y: sideY, width: sideW, height: sideH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.sidePanel);
    setOpacity(scene.sidePanel, 0);
    scene.sideTitle = txt("smash step", {
      x: sideX + 20, y: sideY + 30, "font-size": 18, fill: C.gold,
    }, textL);
    setOpacity(scene.sideTitle, 0);

    const sideLabel = (text, y, color) => {
      const t = txt(text, {
        x: sideX + 24, y: y, "font-size": 14, fill: color || C.grey,
      }, textL);
      setOpacity(t, 0);
      return t;
    };
    scene.yLabel = sideLabel("heaviest  y", 258);
    scene.yValue = sideLabel("—", 290, C.gold);
    scene.xLabel = sideLabel("second heaviest  x", 330);
    scene.xValue = sideLabel("—", 362, C.blue);
    scene.eqLabel = sideLabel("result", 404);
    scene.eqValue = sideLabel("—", 438, C.green);
    scene.sideStats = sideLabel("heap size = " + stones.length, 500, C.grey);
    for (const t of [scene.yValue, scene.xValue, scene.eqValue]) {
      t.setAttribute("font-size", "30");
    }
    scene.eqValue.setAttribute("font-size", "22");

    // ---- stored-array line + supervision -------------------------------
    scene.arrayLabel = txt("heap array (stored negatives)", {
      x: 68, y: 584, "font-size": 14, fill: C.grey,
    }, textL);
    setOpacity(scene.arrayLabel, 0);
    scene.arrayText = txt("", {
      x: 68, y: 610, "font-size": 20, fill: C.blue,
    }, textL);
    setOpacity(scene.arrayText, 0);

    scene.status = txt("", {
      x: 64, y: 646, "font-size": 20, fill: C.gold,
    }, textL);
    scene.detail = txt("", {
      x: 64, y: 674, "font-size": 16, fill: C.grey,
    }, textL);
    scene.result = txt("", {
      x: STAGE_W / 2, y: 708, "text-anchor": "middle",
      "font-size": 28, fill: C.green,
    }, resultL);
    setOpacity(scene.status, 0);
    setOpacity(scene.detail, 0);
    setOpacity(scene.result, 0);

    // ---- reset ---------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const fn of scene._resets) fn();
      for (const n of [scene.subtitle, scene.heapPanel, scene.heapTitle, scene.sidePanel,
                       scene.sideTitle, scene.yLabel, scene.yValue, scene.xLabel,
                       scene.xValue, scene.eqLabel, scene.eqValue, scene.sideStats,
                       scene.arrayLabel, scene.arrayText, scene.status, scene.detail,
                       scene.result]) {
        setOpacity(n, 0);
      }
      scene.yValue.textContent = "—";
      scene.xValue.textContent = "—";
      scene.eqValue.textContent = "—";
      scene.sideStats.textContent = "heap size = " + stones.length;
      scene.arrayText.textContent = "";
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.result.textContent = "";
      for (const node of scene.nodes) {
        setOpacity(node.enter, 0);
        setScaleAt(node.scale, 0, 0, 1);
        setOpacity(node.ring, 0);
        node.circle.setAttribute("fill", C.chipFill);
        node.circle.setAttribute("stroke", C.greyDark);
        node.value.textContent = "";
      }
      for (const edge of scene.edges) {
        setOpacity(edge.line, 0);
        edge.line.setAttribute("stroke", C.greyDark);
      }
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity, setTranslate, setScaleAt } = ctx;
    const { sim } = scene;
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
    const side = (labelNode, valueNode, text, color) => {
      tl.add(0.01, () => {
        valueNode.textContent = text;
        valueNode.setAttribute("fill", color || C.green);
        setOpacity(valueNode, 1);
      });
    };
    const stored = state => "[" + state.map(v => String(v)).join(", ") + "]";
    const setArray = state => {
      tl.add(0.01, () => {
        scene.arrayText.textContent = stored(state);
        scene.arrayText.setAttribute("fill", C.blue);
        setOpacity(scene.arrayText, 1);
      });
    };
    const clearRings = () => {
      for (const node of scene.nodes) setOpacity(node.ring, 0);
    };
    const applyState = (state, dur, marks, removed) => {
      const arr = Array.isArray(state) ? state : state.heap;
      const activeMarks = Array.isArray(state) ? marks : state.marks;
      tl.add(0.01, () => {
        for (let i = 0; i < scene.nodes.length; i++) {
          const node = scene.nodes[i];
          if (i < arr.length) {
            const weight = -arr[i];
            node.value.textContent = String(weight);
            node.value.setAttribute("font-size", String(weight).length >= 3 ? "16" : "21");
            setOpacity(node.enter, 1);
            node.circle.setAttribute("fill", i === 0 ? "#16232b" : C.chipFill);
            node.circle.setAttribute("stroke", i === 0 ? C.blue : C.greyDark);
          } else {
            setOpacity(node.enter, 0);
          }
          setOpacity(node.ring, 0);
        }
        for (const e of scene.edges) {
          const on = e.i < arr.length && e.p < arr.length;
          setOpacity(e.line, on ? 1 : 0);
        }
        if (activeMarks) {
          for (const i of activeMarks) {
            const node = scene.nodes[i];
            if (!node) continue;
            node.ring.setAttribute("stroke", C.gold);
            setOpacity(node.ring, 1);
          }
        }
        if (removed != null && scene.nodes[0]) {
          scene.nodes[0].ring.setAttribute("stroke", C.red);
          setOpacity(scene.nodes[0].ring, 1);
        }
        scene.arrayText.textContent = stored(arr);
      });
      tl.add(dur || 0.2, u => {
        for (const node of scene.nodes) {
          if (node.ring.style.opacity === "1" || Number(node.ring.style.opacity) > 0) {
            setOpacity(node.ring, Math.max(0, 1 - u));
          }
        }
      }, easeOut);
    };

    // ---- intro ---------------------------------------------------------
    tl.line([1, 2]);
    tl.add(0.65, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    tl.add(0.4, u => {
      setOpacity(scene.heapPanel, u);
      setOpacity(scene.heapTitle, u);
      setOpacity(scene.sidePanel, u);
      setOpacity(scene.sideTitle, u);
    }, easeOut);
    for (const t of [scene.yLabel, scene.xLabel, scene.eqLabel, scene.sideStats,
                     scene.arrayLabel]) {
      tl.add(0.12, u => setOpacity(t, u), easeOut);
    }
    setArray(sim.initialRaw);
    tl.line(3);
    status("negate every stone, then let heapify arrange the max-heap", C.blue);
    detail("stored values are negative, so Python's min-heap puts the heaviest stone at index 0");

    // ---- heapify -------------------------------------------------------
    tl.line(4);
    status("heapq.heapify(heap)  ·  restore the heap property", C.teal);
    tl.add(0.25, u => {
      for (let i = 0; i < scene.nodes.length; i++) {
        const node = scene.nodes[i];
        const on = i < sim.initialRaw.length;
        setOpacity(node.enter, u);
        if (on) {
          node.value.textContent = String(-sim.initialRaw[i]);
          node.value.setAttribute("font-size", "21");
        }
        setOpacity(node.ring, 0);
      }
      for (const e of scene.edges) {
        const on = e.i < sim.initialRaw.length && e.p < sim.initialRaw.length;
        setOpacity(e.line, on ? u : 0);
      }
    }, easeOut);
    sim.heapifyStates.forEach((state, si) => {
      if (si === 0) return;
      applyState(state, 0.24, state.marks || []);
    });
    tl.wait(0.1);

    // ---- smash loop ----------------------------------------------------
    let lastSide = null;
    const clearSide = () => {
      if (lastSide) tl.add(0.15, u => setOpacity(lastSide, 1 - u), easeOut);
    };

    for (const step of sim.steps) {
      if (step.kind === "popY" || step.kind === "popX") {
        const isY = step.kind === "popY";
        tl.line(5);
        if (isY) {
          clearSide();
          tl.line(6);
          status("pop the root  →  y = " + step.value + " (heaviest)", C.gold);
          detail("heapq.heappop removes the smallest stored value; negating it gives the heaviest weight");
          side(scene.yLabel, scene.yValue, String(step.value), C.gold);
          lastSide = scene.yValue;
        } else {
          clearSide();
          tl.line(7);
          status("pop the new root  →  x = " + step.value + " (second heaviest)", C.blue);
          detail("the heap restores itself after the first pop, so the next root is the runner-up");
          side(scene.xLabel, scene.xValue, String(step.value), C.blue);
          lastSide = scene.xValue;
        }
        tl.add(0.25, u => {
          const node = scene.nodes[0];
          if (!node) return;
          node.ring.setAttribute("stroke", C.red);
          setOpacity(node.ring, u);
        }, easeOut);
        tl.wait(0.1);
        step.states.forEach((state, si) => {
          applyState(state, 0.22, si === 0 ? [] : (state.marks || []));
        });
        scene.sideStats.textContent = "heap size = " + step.size;
        tl.add(0.01, () => {
          scene.sideStats.textContent = "heap size = " + step.size;
        });
        tl.wait(0.08);
      } else if (step.kind === "push") {
        clearSide();
        tl.line(8);
        status("y ≠ x  →  push the difference " + step.value + " back", C.green);
        detail("the surviving stone has weight |y − x|, stored as −" + step.value);
        tl.line(9);
        side(scene.eqLabel, scene.eqValue, "|" + step.y + " − " + step.x + "| = " + step.value, C.green);
        lastSide = scene.eqValue;
        step.states.forEach((state, si) => {
          applyState(state, 0.22, si === 0 ? [] : (state.marks || []));
        });
        scene.sideStats.textContent = "heap size = " + step.size;
        tl.add(0.01, () => {
          scene.sideStats.textContent = "heap size = " + step.size;
        });
        tl.wait(0.08);
      } else if (step.kind === "destroy") {
        clearSide();
        tl.line(8);
        status("y = x  →  both stones are destroyed", C.red);
        detail("no stone is pushed, so the heap shrinks by two");
        side(scene.eqLabel, scene.eqValue, step.value + " − " + step.value + " = 0", C.red);
        lastSide = scene.eqValue;
        applyState(step.state, 0.24, []);
        scene.sideStats.textContent = "heap size = " + step.size;
        tl.add(0.01, () => {
          scene.sideStats.textContent = "heap size = " + step.size;
        });
        tl.wait(0.12);
      }
    }

    // ---- answer --------------------------------------------------------
    clearSide();
    tl.line(10);
    status("loop finished  →  " + (sim.result ? "one stone remains" : "no stones remain"), C.green);
    detail(sim.result ? "return -heap[0] = " + sim.result : "the heap is empty, so return 0");
    tl.add(0.35, u => {
      for (const node of scene.nodes) setOpacity(node.ring, 0);
    }, easeOut);
    tl.add(0.01, () => {
      scene.result.textContent = "return " + sim.result;
      scene.result.setAttribute("fill", sim.result ? C.green : C.red);
    });
    tl.add(0.5, u => setOpacity(scene.result, u), easeOut);
    tl.log("return " + sim.result, sim.result ? C.green : C.red);
    tl.wait(0.9);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure simulation: every intermediate heap snapshot the animation uses.
 * ------------------------------------------------------------------ */

function heapSnapshot(a) {
  return a.slice();
}

function heapSiftDown(a, i, cmp, states, marks) {
  const n = a.length;
  while (true) {
    let smallest = i;
    const l = 2 * i + 1, r = 2 * i + 2;
    if (l < n && cmp(a[l], a[smallest]) < 0) smallest = l;
    if (r < n && cmp(a[r], a[smallest]) < 0) smallest = r;
    if (smallest === i) break;
    const t = a[i]; a[i] = a[smallest]; a[smallest] = t;
    states.push({ heap: heapSnapshot(a), marks: [i, smallest] });
    i = smallest;
  }
}

function heapSiftUp(a, i, cmp, states) {
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (cmp(a[i], a[p]) >= 0) break;
    const t = a[i]; a[i] = a[p]; a[p] = t;
    states.push({ heap: heapSnapshot(a), marks: [i, p] });
    i = p;
  }
}

function heapifyStates(a, cmp) {
  const states = [{ heap: heapSnapshot(a), marks: [] }];
  for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) {
    heapSiftDown(a, i, cmp, states);
  }
  return states;
}

function pushStates(a, value, cmp) {
  const states = [];
  a.push(value);
  states.push({ heap: heapSnapshot(a), marks: [a.length - 1] });
  heapSiftUp(a, a.length - 1, cmp, states);
  return states;
}

function popStates(a, cmp) {
  const states = [];
  const out = a[0];
  const last = a.pop();
  if (a.length) {
    a[0] = last;
    states.push({ heap: heapSnapshot(a), marks: [0] });
    heapSiftDown(a, 0, cmp, states);
  } else {
    states.push({ heap: heapSnapshot(a), marks: [] });
  }
  return { value: out, states };
}

function simulateStones(stones) {
  const initialRaw = stones.map(s => -s);
  const work = initialRaw.slice();
  const cmp = (a, b) => a - b;
  const heapify = heapifyStates(work, cmp);
  const steps = [];
  let y = 0, x = 0;

  while (work.length > 1) {
    const py = popStates(work, cmp);
    y = -py.value;
    steps.push({ kind: "popY", value: y, states: py.states, size: work.length });

    const px = popStates(work, cmp);
    x = -px.value;
    steps.push({ kind: "popX", value: x, states: px.states, size: work.length });

    if (y !== x) {
      const value = y - x;
      const ps = pushStates(work, -value, cmp);
      steps.push({ kind: "push", value, y, x, states: ps, size: work.length });
    } else {
      steps.push({ kind: "destroy", value: x, y, x, state: heapSnapshot(work), size: work.length });
    }
  }

  const result = work.length ? -work[0] : 0;
  return {
    initialRaw,
    heapifyStates: heapify.map(s => ({ heap: s.heap, marks: s.marks })),
    steps,
    result,
  };
}
