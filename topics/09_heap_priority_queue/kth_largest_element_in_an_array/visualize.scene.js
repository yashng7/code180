/* Kth Largest Element in an Array — animated walkthrough scene.
 *
 * The first k values start a min-heap.  Each later number is compared with the
 * root: if it is larger, heapreplace swaps it in and sifts down, so the root
 * always stays the smallest of the k largest values seen so far.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Kth Largest Element in an Array",
    subtitle: "min-heap of the k largest values · root is the answer · O(n log k)",
    inputs: [
      {
        id: "nums",
        label: "nums",
        type: "text",
        default: "3, 2, 1, 5, 6, 4",
        width: "wide",
      },
      { id: "k", label: "k", type: "number", default: 2 },
    ],
    legend: [
      { color: "#58C4DD", text: "heap / current value" },
      { color: "#F0AC5F", text: "root = kth largest" },
      { color: "#83C167", text: "replaced" },
      { color: "#FC6255", text: "ignored" },
    ],
  },

  code: [
    "def find_kth_largest(nums: List[int], k: int) -> int:",
    "    \"\"\"Return the k-th largest element (1-indexed) in ``nums``.\"\"\"",
    "    heap = nums[:k]                  # min-heap of the k largest seen so far",
    "    heapq.heapify(heap)",
    "    for num in nums[k:]:",
    "        if num > heap[0]:            # beats the current smallest of the top-k",
    "            heapq.heapreplace(heap, num)",
    "    return heap[0]",
  ],

  read(values) {
    const raw = String(values.nums || "").trim();
    if (!raw) return null;
    const nums = raw.split(/[\s,]+/).filter(Boolean).map(Number);
    if (nums.length < 1 || nums.length > 12) return null;
    if (!nums.every(v => Number.isInteger(v) && Math.abs(v) <= 99)) return null;
    const k = Number(values.k);
    if (!Number.isInteger(k) || k < 1 || k > nums.length) return null;
    return { nums, k };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const nums = args[0].map(Number);
      const k = Number(args[1]);
      if (nums.length >= 1 && nums.length <= 12 && Number.isInteger(k) &&
          k >= 1 && k <= nums.length && nums.every(v => Number.isInteger(v))) {
        return { nums: nums.join(", "), k: String(k) };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, setScaleAt, STAGE_W } = ctx;
    const { nums, k } = params;
    const sim = simulateKth(nums, k);
    const n = nums.length;
    const pool = Math.max(k, 1);

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
      nums, k, sim, ctx, chips: [], nodes: [], edges: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title ---------------------------------------------------------
    scene.title = txt("Kth Largest Element in an Array", {
      x: 64, y: 64, "font-size": 38, fill: C.white, "letter-spacing": 0.3,
    }, textL);
    const sub = el("text", { x: 64, y: 100, "font-size": 19, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "nums = ";
    el("tspan", { fill: C.white }, sub).textContent = "[" + nums.join(", ") + "]";
    el("tspan", {}, sub).textContent = "     k = ";
    el("tspan", { fill: C.gold }, sub).textContent = String(k);
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // ---- input chips ---------------------------------------------------
    const gap = n > 9 ? 8 : 12;
    const chipW = clamp((1120 - gap * (n - 1)) / n, 44, 76);
    const chipH = 58;
    const totalW = n * chipW + (n - 1) * gap;
    const startX = STAGE_W / 2 - totalW / 2;
    const chipTop = 140;
    const fontSize = clamp(chipW * 0.4, 14, 28);

    nums.forEach((value, i) => {
      const x = startX + i * (chipW + gap);
      const g = el("g", { transform: "translate(" + x + " " + chipTop + ")" }, chipsL);
      const enter = el("g", {}, g);
      const rect = el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx: 10,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, enter);
      const t = txt(String(value), {
        x: chipW / 2, y: chipH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": fontSize, fill: C.white,
      }, enter);
      const idx = txt(String(i), {
        x: chipW / 2, y: -10, "text-anchor": "middle",
        "font-size": 12, fill: C.grey,
      }, enter);
      setOpacity(enter, 0);
      scene.chips.push({ i, value, g, enter, rect, t, idx, x, cx: x + chipW / 2 });
    });

    const pointer = el("g", {}, ptrL);
    el("polygon", { points: "-8,-12 8,-12 0,0", fill: C.blue }, pointer);
    setOpacity(pointer, 0);
    scene.pointer = pointer;
    scene.chipBottom = chipTop + chipH;

    // ---- heap panel ----------------------------------------------------
    const panelX = 48, panelY = 238, panelW = 690, panelH = 330;
    scene.panel = el("g", {}, chipsL);
    el("rect", {
      x: panelX, y: panelY, width: panelW, height: panelH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.panel);
    setOpacity(scene.panel, 0);
    scene.panelTitle = txt("heap  ·  k largest values  ·  root = smallest of them", {
      x: panelX + 20, y: panelY + 30, "font-size": 17, fill: C.blue,
    }, textL);
    setOpacity(scene.panelTitle, 0);

    const treeLeft = panelX + 30;
    const treeW = panelW - 60;
    const nodeX = i => {
      const depth = Math.floor(Math.log2(i + 1));
      const first = Math.pow(2, depth) - 1;
      const slot = i - first;
      return treeLeft + ((slot + 0.5) / Math.pow(2, depth)) * treeW;
    };
    const nodeY = i => panelY + 78 + Math.floor(Math.log2(i + 1)) * 82;
    scene.nodeR = 23;

    for (let i = 0; i < pool; i++) {
      const x = nodeX(i), y = nodeY(i);
      const g = el("g", { transform: "translate(" + x + " " + y + ")" }, chipsL);
      const enter = el("g", {}, g);
      const scale = el("g", {}, enter);
      const circle = el("circle", {
        cx: 0, cy: 0, r: scene.nodeR, fill: C.chipFill,
        stroke: C.greyDark, "stroke-width": 2.2,
      }, scale);
      const value = txt("", {
        x: 0, y: 1, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": 20, fill: C.white,
      }, scale);
      const ring = el("circle", {
        cx: 0, cy: 0, r: scene.nodeR + 5, fill: "none",
        stroke: C.gold, "stroke-width": 3, filter: "url(#glow-gold)",
      }, scale);
      const idx = txt("i=" + i, {
        x: 0, y: scene.nodeR + 15, "text-anchor": "middle",
        "font-size": 10, fill: C.grey,
      }, enter);
      setOpacity(enter, 0);
      setOpacity(ring, 0);
      scene.nodes.push({ i, x, y, g, enter, scale, circle, value, ring, idx });
    }

    for (let i = 1; i < pool; i++) {
      const p = Math.floor((i - 1) / 2);
      const line = el("line", {
        x1: nodeX(p), y1: nodeY(p) + scene.nodeR - 2,
        x2: nodeX(i), y2: nodeY(i) - scene.nodeR + 2,
        stroke: C.greyDark, "stroke-width": 2.1,
      }, arcsL);
      setOpacity(line, 0);
      scene.edges.push({ i, p, line });
    }

    // ---- stats panel ---------------------------------------------------
    const sideX = 770, sideY = 238, sideW = 462, sideH = 330;
    scene.sidePanel = el("g", {}, chipsL);
    el("rect", {
      x: sideX, y: sideY, width: sideW, height: sideH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.sidePanel);
    setOpacity(scene.sidePanel, 0);
    scene.sideTitle = txt("invariant", {
      x: sideX + 20, y: sideY + 30, "font-size": 18, fill: C.gold,
    }, textL);
    setOpacity(scene.sideTitle, 0);

    const statLabel = (text, y) => {
      const t = txt(text, {
        x: sideX + 24, y: y, "font-size": 14, fill: C.grey,
      }, textL);
      setOpacity(t, 0);
      return t;
    };
    const statValue = (y, color, size) => {
      const t = txt("", {
        x: sideX + 24, y: y, "font-size": size || 24, fill: color || C.white,
      }, textL);
      setOpacity(t, 0);
      return t;
    };
    scene.kLabel = statLabel("k", 280);
    scene.kValue = statValue(310, C.gold, 28);
    scene.sizeLabel = statLabel("heap size", 352);
    scene.sizeValue = statValue(382, C.blue, 24);
    scene.rootLabel = statLabel("root  =  k-th largest", 424);
    scene.rootValue = statValue(454, C.gold, 30);
    scene.curLabel = statLabel("current number", 496);
    scene.curValue = statValue(526, C.white, 26);
    scene.topLabel = statLabel("top-k values", 556);
    scene.topValue = statValue(556, C.green, 15);
    scene.topValue.setAttribute("x", String(sideX + 148));

    scene.arrayText = txt("", {
      x: 64, y: 590, "font-size": 16, fill: C.blue,
    }, textL);
    setOpacity(scene.arrayText, 0);

    // ---- status / result ----------------------------------------------
    scene.status = txt("", {
      x: 64, y: 628, "font-size": 20, fill: C.gold,
    }, textL);
    scene.detail = txt("", {
      x: 64, y: 656, "font-size": 16, fill: C.grey,
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
      for (const node of [scene.subtitle, scene.panel, scene.panelTitle, scene.sidePanel,
                          scene.sideTitle, scene.kLabel, scene.kValue, scene.sizeLabel,
                          scene.sizeValue, scene.rootLabel, scene.rootValue, scene.curLabel,
                          scene.curValue, scene.topLabel, scene.topValue, scene.arrayText,
                          scene.status, scene.detail, scene.result]) {
        setOpacity(node, 0);
      }
      scene.kValue.textContent = "";
      scene.sizeValue.textContent = "";
      scene.rootValue.textContent = "";
      scene.curValue.textContent = "";
      scene.topValue.textContent = "";
      scene.arrayText.textContent = "";
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.result.textContent = "";
      for (const chip of scene.chips) {
        setOpacity(chip.enter, 0);
        chip.rect.setAttribute("fill", C.chipFill);
        chip.rect.setAttribute("stroke", C.greyDark);
        chip.t.setAttribute("fill", C.white);
      }
      setOpacity(scene.pointer, 0);
      for (const node of scene.nodes) {
        setOpacity(node.enter, 0);
        setScaleAt(node.scale, 0, 0, 1);
        setOpacity(node.ring, 0);
        node.value.textContent = "";
        node.circle.setAttribute("fill", C.chipFill);
        node.circle.setAttribute("stroke", C.greyDark);
      }
      for (const e of scene.edges) setOpacity(e.line, 0);
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity, setTranslate } = ctx;
    const { nums, k, sim } = scene;
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
    const setText = (node, text, color) => {
      tl.add(0.01, () => {
        node.textContent = text;
        if (color) node.setAttribute("fill", color);
        setOpacity(node, 1);
      });
    };
    const setArray = heap => {
      tl.add(0.01, () => {
        scene.arrayText.textContent = "heap array = [" + heap.join(", ") + "]";
        setOpacity(scene.arrayText, 1);
      });
    };
    const clearRings = () => {
      for (const node of scene.nodes) setOpacity(node.ring, 0);
    };
    const applyState = (state, dur) => {
      const arr = Array.isArray(state) ? state : state.heap;
      const marks = Array.isArray(state) ? [] : (state.marks || []);
      tl.add(0.01, () => {
        for (let i = 0; i < scene.nodes.length; i++) {
          const node = scene.nodes[i];
          if (i < arr.length) {
            node.value.textContent = String(arr[i]);
            node.value.setAttribute("font-size", String(arr[i]).length >= 3 ? "16" : "20");
            setOpacity(node.enter, 1);
            node.circle.setAttribute("fill", i === 0 ? "#16232b" : C.chipFill);
            node.circle.setAttribute("stroke", i === 0 ? C.blue : C.greyDark);
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
        scene.sizeValue.textContent = arr.length + " / " + k;
        setOpacity(scene.sizeValue, 1);
      });
      tl.add(dur || 0.2, u => {
        for (const node of scene.nodes) {
          const op = Number(node.ring.style.opacity) || 0;
          if (op > 0) setOpacity(node.ring, Math.max(0, 1 - u));
        }
      }, easeOut);
      setArray(arr);
    };
    const setChipState = (i, stroke, fill, textColor) => {
      tl.add(0.01, () => {
        const chip = scene.chips[i];
        chip.rect.setAttribute("stroke", stroke);
        chip.rect.setAttribute("fill", fill);
        chip.t.setAttribute("fill", textColor);
      });
    };

    // ---- intro ---------------------------------------------------------
    tl.line([1, 2]);
    tl.add(0.6, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    for (const chip of scene.chips) {
      tl.add(0.16, u => setOpacity(chip.enter, u), easeOut);
    }
    tl.add(0.4, u => {
      setOpacity(scene.panel, u);
      setOpacity(scene.panelTitle, u);
      setOpacity(scene.sidePanel, u);
      setOpacity(scene.sideTitle, u);
      for (const n of [scene.kLabel, scene.sizeLabel, scene.rootLabel,
                       scene.curLabel, scene.topLabel]) setOpacity(n, u);
    }, easeOut);
    setText(scene.kValue, String(k), C.gold);
    setText(scene.sizeValue, "0 / " + k, C.blue);
    tl.line(3);
    status("start with the first k = " + k + " values as a min-heap", C.blue);
    detail("these are the only candidates that can still be among the k largest");
    for (let i = 0; i < k; i++) {
      setChipState(i, C.blue, "#132a38", C.blue);
    }
    tl.wait(0.15);

    // raw heap before heapify
    applyState(sim.initialRaw, 0.22);
    tl.line(4);
    status("heapify turns the slice into a valid min-heap", C.teal);
    sim.heapifyStates.forEach((state, si) => {
      if (si === 0) return;
      applyState(state, 0.22);
    });
    setText(scene.sizeValue, String(sim.initialRaw.length) + " / " + k, C.blue);
    setText(scene.rootValue, String(sim.initialRaw.length ? sim.initialRaw[0] : "—"), C.gold);
    setText(scene.topValue, "[" + sim.initialRaw.slice().sort((a, b) => b - a).join(", ") + "]", C.green);
    tl.wait(0.15);

    // ---- scan / replace ------------------------------------------------
    for (const step of sim.steps) {
      const chip = scene.chips[step.i];
      tl.line(5);
      tl.add(0.28, u => {
        setOpacity(scene.pointer, u);
        setTranslate(scene.pointer, chip.cx - 12, scene.chipBottom + 6);
      }, easeOut);
      setChipState(step.i, C.blue, "#132a38", C.blue);
      setText(scene.curValue, String(step.num), C.white);
      status("consider nums[" + step.i + "] = " + step.num, C.blue);
      tl.line(6);
      const rootNode = scene.nodes[0];
      tl.add(0.01, () => {
        if (rootNode) {
          rootNode.ring.setAttribute("stroke", step.accept ? C.gold : C.red);
          setOpacity(rootNode.ring, 1);
        }
      });
      if (step.accept) {
        status(step.num + " > root " + step.root + "  →  it belongs in the top-k", C.green);
        detail("heapreplace removes the current smallest and sifts the new value down");
        tl.line(7);
        step.states.forEach((state, si) => applyState(state, 0.2));
        setChipState(step.i, C.green, "#17251a", C.green);
        setText(scene.sizeValue, String(k) + " / " + k, C.blue);
        setText(scene.rootValue, String(step.newRoot), C.gold);
        setText(scene.topValue, "[" + step.top.join(", ") + "]", C.green);
      } else {
        status(step.num + " ≤ root " + step.root + "  →  ignore it", C.red);
        detail("it cannot be larger than all k values already kept");
        setChipState(step.i, C.red, "#2d1718", C.red);
        tl.add(0.32, u => {
          if (rootNode) setOpacity(rootNode.ring, 1 - u);
        }, easeOut);
      }
      tl.wait(0.12);
    }

    // ---- answer --------------------------------------------------------
    clearRings();
    tl.line(8);
    status("return the root of the min-heap", C.green);
    detail("the smallest of the k largest values is exactly the k-th largest");
    tl.add(0.01, () => {
      const root = scene.nodes[0];
      if (root) {
        root.ring.setAttribute("stroke", C.green);
        setOpacity(root.ring, 1);
      }
    });
    tl.add(0.01, () => {
      scene.result.textContent = "return " + sim.result;
      setOpacity(scene.result, 1);
    });
    tl.add(0.5, u => setOpacity(scene.result, u), easeOut);
    tl.log("return " + sim.result, C.green);
    tl.wait(0.9);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Heap helpers and simulation.
 * ------------------------------------------------------------------ */

function kthSnapshot(a) {
  return a.slice();
}

function kthSiftDown(a, i, states) {
  const n = a.length;
  while (true) {
    let smallest = i;
    const l = 2 * i + 1, r = 2 * i + 2;
    if (l < n && a[l] < a[smallest]) smallest = l;
    if (r < n && a[r] < a[smallest]) smallest = r;
    if (smallest === i) break;
    const t = a[i]; a[i] = a[smallest]; a[smallest] = t;
    states.push({ heap: kthSnapshot(a), marks: [i, smallest] });
    i = smallest;
  }
}

function kthHeapifyStates(a) {
  const states = [{ heap: kthSnapshot(a), marks: [] }];
  for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) kthSiftDown(a, i, states);
  return states;
}

function kthReplaceStates(a, value) {
  const states = [];
  a[0] = value;
  states.push({ heap: kthSnapshot(a), marks: [0] });
  kthSiftDown(a, 0, states);
  return states;
}

function simulateKth(nums, k) {
  const initialRaw = nums.slice(0, k);
  const work = initialRaw.slice();
  const heapify = kthHeapifyStates(work);
  const steps = [];

  for (let i = k; i < nums.length; i++) {
    const num = nums[i];
    const root = work[0];
    const accept = num > root;
    let states = [];
    let newRoot = root;
    if (accept) {
      states = kthReplaceStates(work, num);
      newRoot = work[0];
    }
    steps.push({
      i, num, root, accept, states, newRoot,
      top: work.slice().sort((a, b) => b - a),
    });
  }

  return {
    initialRaw,
    heapifyStates: heapify,
    steps,
    result: work[0],
  };
}
