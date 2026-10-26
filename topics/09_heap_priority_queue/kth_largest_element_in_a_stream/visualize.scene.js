/* Kth Largest Element in a Stream — animated walkthrough scene.
 *
 * A design problem.  The operation ribbon at the top is replayed in order.
 * `KthLargest(k, nums)` keeps a min-heap of the k largest values; `add(val)`
 * pushes and, when the heap grows past k, pops the smallest.  The root is the
 * k-th largest value.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Kth Largest Element in a Stream",
    subtitle: "min-heap of the k largest values · root = k-th largest · O(log k) per add",
    inputs: [
      {
        id: "ops",
        label: "operations",
        type: "text",
        default: "KthLargest(3, [4, 5, 8, 2]), add(3), add(5), add(10), add(9), add(4)",
        width: "wide",
      },
    ],
    legend: [
      { color: "#58C4DD", text: "heap / stream" },
      { color: "#F0AC5F", text: "root = k-th largest" },
      { color: "#83C167", text: "pushed value" },
      { color: "#FC6255", text: "popped minimum" },
    ],
  },

  code: [
    "class KthLargest:",
    "    \"\"\"Reports the k-th largest value in a growing stream of integers.\"\"\"",
    "    def __init__(self, k: int, nums: List[int]) -> None:",
    "        self._k = k",
    "        self._heap = list(nums)          # min-heap of the k largest values",
    "        heapq.heapify(self._heap)",
    "        while len(self._heap) > k:",
    "            heapq.heappop(self._heap)",
    "    def add(self, val: int) -> int:",
    "        heapq.heappush(self._heap, val)",
    "        if len(self._heap) > self._k:    # drop the smallest so we keep k",
    "            heapq.heappop(self._heap)",
    "        return self._heap[0]",
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
      if (name === "KthLargest") {
        const parts = splitTopLevel(inner);
        if (parts.length !== 2) return null;
        const k = Number(parts[0].trim());
        const list = parts[1].trim();
        if (!/^\[.*\]$/.test(list)) return null;
        const body = list.slice(1, -1).trim();
        const nums = body ? splitTopLevel(body).map(s => Number(s.trim())) : [];
        if (!Number.isInteger(k) || k < 1 || k > 8) return null;
        if (nums.length > 8 || !nums.every(Number.isInteger)) return null;
        ops.push({ name, k, nums });
      } else if (name === "add") {
        const parts = splitTopLevel(inner);
        if (parts.length !== 1) return null;
        const val = Number(parts[0].trim());
        if (!Number.isInteger(val)) return null;
        ops.push({ name, val });
      } else {
        return null;
      }
    }
    if (!ops.length || ops[0].name !== "KthLargest" || ops.length > 9) return null;
    return { ops };
  },

  fromArgs(args) {
    let payload = null;
    if (args && !Array.isArray(args) && typeof args === "object" && args.ops) payload = args;
    else if (Array.isArray(args) && args[0] && !Array.isArray(args[0]) && args[0].ops) payload = args[0];
    if (!payload || !Array.isArray(payload.ops) || !Array.isArray(payload.vals)) return null;
    if (payload.ops.length !== payload.vals.length || payload.ops.length > 9) return null;
    const parts = [];
    for (let i = 0; i < payload.ops.length; i++) {
      const name = payload.ops[i];
      const vals = payload.vals[i];
      if (!Array.isArray(vals)) return null;
      if (name === "KthLargest") {
        if (vals.length !== 2 || !Array.isArray(vals[1])) return null;
        parts.push("KthLargest(" + vals[0] + ", [" + vals[1].join(", ") + "])");
      } else if (name === "add") {
        if (vals.length !== 1) return null;
        parts.push("add(" + vals[0] + ")");
      } else {
        return null;
      }
    }
    return { ops: parts.join(", ") };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const ops = params.ops;
    const sim = simulateKthStream(ops);
    const init = ops[0];
    const adds = ops.filter(op => op.name === "add");
    const pool = Math.max(init.k, init.nums.length, 1);

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
      ops, sim, ctx, opCells: [], initialChips: [], addedChips: [],
      nodes: [], edges: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title ---------------------------------------------------------
    scene.title = txt("Kth Largest Element in a Stream", {
      x: 64, y: 62, "font-size": 38, fill: C.white, "letter-spacing": 0.3,
    }, textL);
    const sub = el("text", { x: 64, y: 96, "font-size": 18, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "k = ";
    el("tspan", { fill: C.gold }, sub).textContent = String(init.k);
    el("tspan", {}, sub).textContent = "     initial nums = ";
    el("tspan", { fill: C.white }, sub).textContent = "[" + init.nums.join(", ") + "]";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // ---- operation ribbon ---------------------------------------------
    const opY = 134, opH = 38;
    const nOps = ops.length;
    const opW = clamp(Math.floor(1100 / nOps) - 8, 72, 132);
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
      const label = op.name === "KthLargest"
        ? "KthLargest(" + op.k + ", …)"
        : "add(" + op.val + ")";
      const t = txt(label, {
        x: x + opW / 2, y: opY, "text-anchor": "middle",
        "dominant-baseline": "central",
        "font-size": clamp(opW / Math.max(9, label.length * 0.57), 8, 13),
        fill: C.grey,
      }, g);
      const ret = txt("", {
        x: x + opW / 2, y: opY + opH / 2 + 20, "text-anchor": "middle",
        "font-size": 15, fill: C.teal,
      }, textL);
      setOpacity(ret, 0);
      scene.opCells.push({ i, op, g, rect, t, ret, x, cx: x + opW / 2 });
    });

    const ptr = el("g", {}, ptrL);
    el("polygon", { points: "-8,-12 8,-12 0,-1", fill: C.gold, filter: "url(#glow-gold)" }, ptr);
    setOpacity(ptr, 0);
    scene.opPtr = ptr;

    // ---- stream panel --------------------------------------------------
    const sX = 48, sY = 202, sW = 476, sH = 318;
    scene.streamPanel = el("g", {}, chipsL);
    el("rect", {
      x: sX, y: sY, width: sW, height: sH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.streamPanel);
    setOpacity(scene.streamPanel, 0);
    scene.streamTitle = txt("stream  ·  values seen", {
      x: sX + 20, y: sY + 30, "font-size": 18, fill: C.blue,
    }, textL);
    setOpacity(scene.streamTitle, 0);

    const chipRow = (values, y, topLabel, color) => {
      const label = txt(topLabel, {
        x: sX + 22, y: y - 22, "font-size": 13, fill: color || C.grey,
      }, textL);
      setOpacity(label, 0);
      const gap = values.length > 7 ? 4 : 7;
      const w = clamp((sW - 44 - gap * (values.length - 1)) / Math.max(values.length, 1), 26, 48);
      const h = 42;
      const total = values.length * w + (values.length - 1) * gap;
      const x0 = sX + (sW - total) / 2;
      const chips = [];
      values.forEach((value, i) => {
        const x = x0 + i * (w + gap);
        const g = el("g", { transform: "translate(" + x + " " + y + ")" }, chipsL);
        const enter = el("g", {}, g);
        const rect = el("rect", {
          x: 0, y: 0, width: w, height: h, rx: 8,
          fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.8,
        }, enter);
        const t = txt(String(value), {
          x: w / 2, y: h / 2 + 1, "text-anchor": "middle",
          "dominant-baseline": "central", "font-size": clamp(w * 0.44, 13, 21),
          fill: C.white,
        }, enter);
        setOpacity(enter, 0);
        chips.push({ g, enter, rect, t, value, w });
      });
      return { label, chips };
    };

    const initialRow = chipRow(init.nums, sY + 98, "initial nums", C.blue);
    scene.streamInitialLabel = initialRow.label;
    scene.initialChips = initialRow.chips;
    const addedRow = adds.length
      ? chipRow(adds.map(a => a.val), sY + 236, "added values", C.green)
      : { label: null, chips: [] };
    scene.streamAddedLabel = addedRow.label;
    scene.addedChips = addedRow.chips;

    // ---- heap panel ----------------------------------------------------
    const hX = 548, hY = 202, hW = 684, hH = 318;
    scene.heapPanel = el("g", {}, chipsL);
    el("rect", {
      x: hX, y: hY, width: hW, height: hH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.heapPanel);
    setOpacity(scene.heapPanel, 0);
    scene.heapTitle = txt("self._heap  ·  min-heap of the k largest values", {
      x: hX + 20, y: hY + 30, "font-size": 18, fill: C.blue,
    }, textL);
    setOpacity(scene.heapTitle, 0);
    scene.kText = txt("k = " + init.k, {
      x: hX + hW - 170, y: hY + 30, "font-size": 16, fill: C.gold,
    }, textL);
    scene.sizeText = txt("heap size = 0", {
      x: hX + hW - 90, y: hY + 30, "font-size": 16, fill: C.grey,
    }, textL);
    scene.sizeText.setAttribute("text-anchor", "end");
    setOpacity(scene.kText, 0);
    setOpacity(scene.sizeText, 0);

    const treeLeft = hX + 26;
    const treeW = hW - 52;
    const nodeX = i => {
      const depth = Math.floor(Math.log2(i + 1));
      const first = Math.pow(2, depth) - 1;
      const slot = i - first;
      return treeLeft + ((slot + 0.5) / Math.pow(2, depth)) * treeW;
    };
    const nodeY = i => hY + 96 + Math.floor(Math.log2(i + 1)) * 78;
    scene.nodeR = 22;

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
        "font-size": 18, fill: C.white,
      }, scale);
      const ring = el("circle", {
        cx: 0, cy: 0, r: scene.nodeR + 5, fill: "none",
        stroke: C.gold, "stroke-width": 3, filter: "url(#glow-gold)",
      }, scale);
      const idx = txt("i=" + i, {
        x: 0, y: scene.nodeR + 14, "text-anchor": "middle",
        "font-size": 9.5, fill: C.grey,
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

    scene.arrayText = txt("", {
      x: hX + 20, y: hY + 268, "font-size": 15, fill: C.blue,
    }, textL);
    scene.rootText = txt("root = —", {
      x: hX + 20, y: hY + 296, "font-size": 17, fill: C.gold,
    }, textL);
    scene.poppedText = txt("popped = —", {
      x: hX + 300, y: hY + 296, "font-size": 16, fill: C.red,
    }, textL);
    for (const t of [scene.arrayText, scene.rootText, scene.poppedText]) setOpacity(t, 0);

    // ---- bottom narration ---------------------------------------------
    scene.status = txt("", {
      x: 64, y: 576, "font-size": 20, fill: C.gold,
    }, textL);
    scene.detail = txt("", {
      x: 64, y: 606, "font-size": 16, fill: C.grey,
    }, textL);
    scene.result = txt("", {
      x: STAGE_W / 2, y: 652, "text-anchor": "middle",
      "font-size": 22, fill: C.green,
    }, resultL);
    scene.final = txt("", {
      x: STAGE_W / 2, y: 690, "text-anchor": "middle",
      "font-size": 20, fill: C.green,
    }, resultL);
    setOpacity(scene.status, 0);
    setOpacity(scene.detail, 0);
    setOpacity(scene.result, 0);
    setOpacity(scene.final, 0);

    // ---- reset ---------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.streamPanel, scene.streamTitle,
                          scene.heapPanel, scene.heapTitle, scene.kText, scene.sizeText,
                          scene.arrayText, scene.rootText, scene.poppedText,
                          scene.status, scene.detail, scene.result, scene.final]) {
        setOpacity(node, 0);
      }
      if (scene.streamInitialLabel) setOpacity(scene.streamInitialLabel, 0);
      if (scene.streamAddedLabel) setOpacity(scene.streamAddedLabel, 0);
      for (const chip of scene.initialChips.concat(scene.addedChips)) {
        setOpacity(chip.enter, 0);
        chip.rect.setAttribute("fill", C.chipFill);
        chip.rect.setAttribute("stroke", C.greyDark);
        chip.t.setAttribute("fill", C.white);
      }
      for (const cell of scene.opCells) {
        setOpacity(cell.g, 0);
        cell.rect.setAttribute("fill", C.chipFill);
        cell.rect.setAttribute("stroke", C.greyDark);
        cell.t.setAttribute("fill", C.grey);
        cell.ret.textContent = "";
        setOpacity(cell.ret, 0);
      }
      setOpacity(scene.opPtr, 0);
      for (const node of scene.nodes) {
        setOpacity(node.enter, 0);
        node.value.textContent = "";
        node.circle.setAttribute("fill", C.chipFill);
        node.circle.setAttribute("stroke", C.greyDark);
        setOpacity(node.ring, 0);
      }
      for (const e of scene.edges) setOpacity(e.line, 0);
      scene.arrayText.textContent = "";
      scene.rootText.textContent = "root = —";
      scene.poppedText.textContent = "popped = —";
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.result.textContent = "";
      scene.final.textContent = "";
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity, setTranslate } = ctx;
    const { ops, sim } = scene;
    const init = ops[0];
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
    const activeOp = (index, prevIndex) => {
      tl.add(0.32, u => {
        const e = ease.inOutSine(u);
        const fromX = prevIndex == null ? scene.opCells[0].cx : scene.opCells[prevIndex].cx;
        setTranslate(scene.opPtr, fromX + (scene.opCells[index].cx - fromX) * e,
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
    const applyState = (state, dur) => {
      const arr = Array.isArray(state) ? state : state.heap;
      const marks = Array.isArray(state) ? [] : (state.marks || []);
      tl.add(0.01, () => {
        for (let i = 0; i < scene.nodes.length; i++) {
          const node = scene.nodes[i];
          if (i < arr.length) {
            node.value.textContent = String(arr[i]);
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
        scene.sizeText.textContent = "heap size = " + arr.length;
        scene.arrayText.textContent = "heap = [" + arr.join(", ") + "]";
        if (arr.length) scene.rootText.textContent = "root = " + arr[0];
        else scene.rootText.textContent = "root = —";
      });
      tl.add(dur || 0.2, u => {
        for (const node of scene.nodes) {
          const op = Number(node.ring.style.opacity) || 0;
          if (op > 0) setOpacity(node.ring, Math.max(0, 1 - u));
        }
      }, easeOut);
    };
    const showChip = (chip, color, fill, dur) => {
      tl.add(dur || 0.25, u => {
        setOpacity(chip.enter, u);
        chip.rect.setAttribute("stroke", color || C.greyDark);
        chip.rect.setAttribute("fill", fill || C.chipFill);
        chip.t.setAttribute("fill", color === C.greyDark ? C.white : (color || C.white));
      }, easeOut);
    };

    // ---- intro ---------------------------------------------------------
    tl.line([1, 2]);
    tl.add(0.6, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    for (const cell of scene.opCells) {
      tl.add(0.12, u => setOpacity(cell.g, u), easeOut);
    }
    tl.add(0.35, u => {
      setOpacity(scene.streamPanel, u);
      setOpacity(scene.streamTitle, u);
      setOpacity(scene.heapPanel, u);
      setOpacity(scene.heapTitle, u);
      setOpacity(scene.kText, u);
      setOpacity(scene.sizeText, u);
      setOpacity(scene.arrayText, u);
      setOpacity(scene.rootText, u);
      setOpacity(scene.poppedText, u);
      if (scene.streamInitialLabel) setOpacity(scene.streamInitialLabel, u);
      if (scene.streamAddedLabel) setOpacity(scene.streamAddedLabel, u);
    }, easeOut);
    tl.line([3, 4]);
    status("KthLargest(k, nums): remember k and copy the initial stream", C.blue);
    detail("the stream panel will grow as add() is called");
    for (const chip of scene.initialChips) showChip(chip, C.blue, "#132a38", 0.18);
    tl.line(5);
    setReturn(0, null);
    applyState(sim.init.raw, 0.2);
    tl.line(6);
    status("heapify the initial values", C.teal);
    sim.init.heapifyStates.forEach((state, si) => {
      if (si === 0) return;
      applyState(state, 0.18);
    });
    tl.line(7);
    status("trim to the k largest values", C.gold);
    for (const pop of sim.init.pops) {
      tl.add(0.01, () => {
        scene.poppedText.textContent = "popped = " + pop.value;
      });
      const root = scene.nodes[0];
      if (root) {
        tl.add(0.2, u => {
          root.ring.setAttribute("stroke", C.red);
          setOpacity(root.ring, u);
        }, easeOut);
      }
      applyState(pop.states[pop.states.length - 1], 0.18);
      tl.line(8);
    }
    tl.wait(0.15);

    let prevIndex = 0;
    let addIndex = 0;
    for (let si = 1; si < ops.length; si++) {
      const op = ops[si];
      const step = sim.steps[si];
      activeOp(si, prevIndex);
      prevIndex = si;
      tl.line(9);
      status("add(" + op.val + ")", C.blue);
      detail("push the new value into the min-heap");
      const chip = scene.addedChips[addIndex];
      if (chip) showChip(chip, C.green, "#17251a", 0.25);
      addIndex++;

      tl.line(10);
      step.pushStates.forEach((state, k) => applyState(state, 0.18));
      tl.line(11);
      if (step.popped !== null) {
        status("heap size " + (step.beforeLen + 1) + " > k = " + init.k + "  →  drop the smallest", C.red);
        detail("the root is the smallest value in the heap, so it can never be the k-th largest");
        const root = scene.nodes[0];
        if (root) {
          tl.add(0.2, u => {
            root.ring.setAttribute("stroke", C.red);
            setOpacity(root.ring, u);
          }, easeOut);
        }
        tl.line(12);
        step.popStates.forEach((state, k) => applyState(state, 0.18));
        tl.add(0.01, () => { scene.poppedText.textContent = "popped = " + step.popped; });
      } else {
        status("heap size " + (step.beforeLen + 1) + " ≤ k = " + init.k + "  →  keep it", C.green);
        detail("no value needs to be evicted yet");
      }
      tl.line(13);
      status("return the root  →  " + step.root, C.green);
      detail("the smallest of the k largest values is the k-th largest");
      tl.add(0.01, () => {
        const node = scene.nodes[0];
        if (node) {
          node.ring.setAttribute("stroke", C.green);
          setOpacity(node.ring, 1);
        }
      });
      setReturn(si, step.root);
      tl.wait(0.12);
    }

    // ---- summary -------------------------------------------------------
    tl.add(0.3, u => {
      setOpacity(scene.opPtr, 1 - u);
      setOpacity(scene.status, 1 - u);
      setOpacity(scene.detail, 1 - u);
    }, easeOut);
    scene.final.textContent = "";
    tl.add(0.01, () => {
      scene.final.textContent = "returns = [" + sim.returns.map(v => v === null ? "null" : String(v)).join(", ") + "]";
      setOpacity(scene.final, 1);
    });
    tl.add(0.45, u => setOpacity(scene.final, u), easeOut);
    tl.log("returns = [" + sim.returns.map(v => v === null ? "null" : String(v)).join(", ") + "]", C.green);
    tl.wait(0.8);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Parsing and simulation.
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

function streamSnapshot(a) {
  return a.slice();
}

function streamSiftDown(a, i, states) {
  const n = a.length;
  while (true) {
    let smallest = i;
    const l = 2 * i + 1, r = 2 * i + 2;
    if (l < n && a[l] < a[smallest]) smallest = l;
    if (r < n && a[r] < a[smallest]) smallest = r;
    if (smallest === i) break;
    const t = a[i]; a[i] = a[smallest]; a[smallest] = t;
    states.push({ heap: streamSnapshot(a), marks: [i, smallest] });
    i = smallest;
  }
}

function streamSiftUp(a, i, states) {
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (a[i] >= a[p]) break;
    const t = a[i]; a[i] = a[p]; a[p] = t;
    states.push({ heap: streamSnapshot(a), marks: [i, p] });
    i = p;
  }
}

function streamHeapifyStates(a) {
  const states = [{ heap: streamSnapshot(a), marks: [] }];
  for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) streamSiftDown(a, i, states);
  return states;
}

function streamPushStates(a, value) {
  const states = [];
  a.push(value);
  states.push({ heap: streamSnapshot(a), marks: [a.length - 1] });
  streamSiftUp(a, a.length - 1, states);
  return states;
}

function streamPopStates(a) {
  const states = [];
  const out = a[0];
  const last = a.pop();
  if (a.length) {
    a[0] = last;
    states.push({ heap: streamSnapshot(a), marks: [0] });
    streamSiftDown(a, 0, states);
  } else {
    states.push({ heap: streamSnapshot(a), marks: [] });
  }
  return { value: out, states };
}

function simulateKthStream(ops) {
  const init = ops[0];
  const k = init.k;
  const work = init.nums.slice();
  const heapify = streamHeapifyStates(work);
  const initPops = [];
  while (work.length > k) {
    const popped = streamPopStates(work);
    initPops.push({ value: popped.value, states: popped.states });
  }

  const steps = [{ kind: "init" }];
  const returns = [null];
  for (let i = 1; i < ops.length; i++) {
    const op = ops[i];
    const beforeLen = work.length;
    const pushStates = streamPushStates(work, op.val);
    let popped = null;
    let popStates = [];
    if (work.length > k) {
      const p = streamPopStates(work);
      popped = p.value;
      popStates = p.states;
    }
    const root = work[0];
    steps.push({ kind: "add", val: op.val, beforeLen, pushStates, popped, popStates, root });
    returns.push(root);
  }

  return {
    init: { raw: init.nums.slice(), heapifyStates: heapify, pops: initPops },
    steps,
    returns,
  };
}
