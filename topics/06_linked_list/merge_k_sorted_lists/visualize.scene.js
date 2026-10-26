/* Merge K Sorted Lists — animated walkthrough scene (3Blue1Brown style).
 *
 * Every input list keeps a pointer at its current head. A min-heap holds the
 * current candidate from each non-empty list. Each pop takes the globally
 * smallest head, appends it to the merged chain, and pushes that list's next
 * node. The heap panel shows the candidates with the root at the top.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Merge K Sorted Lists",
    subtitle: "min-heap of current heads · pop smallest, push its next · O(N log k)",
    inputs: [
      {
        id: "lists", label: "lists (use | between lists)", type: "text",
        default: "1, 4, 5 | 1, 3, 4 | 2, 6", width: "wide",
      },
    ],
    legend: [
      { color: "#58C4DD", text: "input lists" },
      { color: "#F0AC5F", text: "heap root / chosen" },
      { color: "#83C167", text: "merged chain" },
      { color: "#B58CD6", text: "heap candidates" },
    ],
  },

  code: [
    "def merge_k_lists(lists: List[List[int]]) -> List[int]:",
    "    heap: List[tuple] = []",
    "    for index, values in enumerate(lists):",
    "        node = build_linked_list(values)",
    "        if node is not None:",
    "            heap.append((node.val, index, node))",
    "    heapq.heapify(heap)",
    "    dummy = tail = ListNode()",
    "    while heap:",
    "        _, index, node = heapq.heappop(heap)",
    "        tail.next = node",
    "        tail = node",
    "        if node.next is not None:",
    "            heapq.heappush(heap, (node.next.val, index, node.next))",
    "    tail.next = None",
    "    return linked_list_to_list(dummy.next)",
  ],

  read(values) {
    const raw = (values.lists || "").trim();
    if (!raw) return { lists: [] };
    const parts = raw.split("|").map(s => s.trim());
    if (parts.length > 4) return null;
    const lists = [];
    for (const part of parts) {
      if (!part) { lists.push([]); continue; }
      const nums = part.split(/[\s,]+/).filter(Boolean).map(Number);
      if (nums.length > 6 || !nums.every(Number.isInteger)) return null;
      for (let i = 1; i < nums.length; i++) if (nums[i] < nums[i - 1]) return null;
      lists.push(nums);
    }
    if (lists.reduce((n, xs) => n + xs.length, 0) > 9) return null;
    return { lists };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const lists = args[0];
      if (lists.length > 4) return null;
      const out = [];
      for (const xs of lists) {
        if (!Array.isArray(xs)) return null;
        const nums = xs.map(Number);
        if (nums.length > 6 || !nums.every(Number.isInteger)) return null;
        for (let i = 1; i < nums.length; i++) if (nums[i] < nums[i - 1]) return null;
        out.push(nums);
      }
      if (out.reduce((n, xs) => n + xs.length, 0) > 9) return null;
      return { lists: out.map(xs => xs.join(", ")).join(" | ") };
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, setScaleAt, STAGE_W } = ctx;
    const lists = params.lists;
    const sim = simulate(lists);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-purple", C.purple);
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
      lists, sim, ctx, rowNodes: [], rowEdges: [], headPtrs: [], heapRows: [],
      mergedNodes: [], mergedEdges: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title -----------------------------------------------------------
    scene.title = txt("Merge K Sorted Lists", {
      x: 64, y: 66, "font-size": 41, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    const sub = el("text", { x: 64, y: 100, "font-size": 19, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "k = ";
    el("tspan", { fill: C.blue }, sub).textContent = String(lists.length);
    el("tspan", {}, sub).textContent = "     total nodes = ";
    el("tspan", { fill: C.green }, sub).textContent = String(sim.merged.length);
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- geometry --------------------------------------------------------
    const k = lists.length;
    const rowGap = 84;
    const rowTop = 150;
    const nodeH = 54;
    const nodeW = 54;
    const gap = 12;
    const rowStartX = 226;
    const mergedY = 496;
    scene.nodeH = nodeH;
    scene.mergedY = mergedY;

    // -- input rows ------------------------------------------------------
    lists.forEach((values, li) => {
      const y = rowTop + li * rowGap;
      const label = txt("L" + li, {
        x: 92, y: y + nodeH / 2 + 1, "font-size": 18, fill: C.blue,
      }, textL);
      setOpacity(label, 0);
      scene["rowLabel" + li] = label;

      const nodes = [], edges = [];
      values.forEach((value, i) => {
        const x = rowStartX + i * (nodeW + gap);
        const g = el("g", { transform: "translate(" + x + " " + y + ")" }, chipsL);
        const enter = el("g", {}, g);
        const scale = el("g", {}, enter);
        el("rect", {
          x: 0, y: 0, width: nodeW, height: nodeH, rx: 9,
          fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.8,
        }, scale);
        const idle = txt(String(value), {
          x: nodeW / 2, y: nodeH / 2 + 1, "text-anchor": "middle",
          "dominant-baseline": "central", "font-size": 20, fill: C.white,
        }, scale);
        const hot = txt(String(value), {
          x: nodeW / 2, y: nodeH / 2 + 1, "text-anchor": "middle",
          "dominant-baseline": "central", "font-size": 20, fill: C.gold,
        }, scale);
        setOpacity(hot, 0);
        const ring = el("rect", {
          x: 0, y: 0, width: nodeW, height: nodeH, rx: 9, fill: "none",
          stroke: C.gold, "stroke-width": 3, filter: "url(#glow-gold)",
        }, scale);
        setOpacity(ring, 0);
        setOpacity(enter, 0);
        nodes.push({ value, g, enter, scale, idle, hot, ring, x, cx: x + nodeW / 2, y });
        if (i > 0) {
          const prev = nodes[i - 1];
          const ey = y + nodeH / 2;
          const eg = el("g", {}, arcsL);
          el("line", {
            x1: prev.x + nodeW, y1: ey, x2: x - 8, y2: ey, stroke: C.blue,
            "stroke-width": 2.2, "stroke-linecap": "round",
          }, eg);
          el("polygon", {
            points: (x - 8) + "," + (ey - 5.5) + " " + (x - 8) + "," + (ey + 5.5) + " " + x + "," + ey,
            fill: C.blue,
          }, eg);
          setOpacity(eg, 0);
          edges.push(eg);
        }
      });
      scene.rowNodes.push(nodes);
      scene.rowEdges.push(edges);
      if (!values.length) {
        const empty = txt("empty", {
          x: rowStartX + 8, y: y + nodeH / 2, "font-size": 17, fill: C.grey,
          "dominant-baseline": "central",
        }, textL);
        setOpacity(empty, 0);
        scene["emptyRow" + li] = empty;
      }

      const ptr = el("g", {}, ptrL);
      setOpacity(ptr, 0);
      el("path", { d: "M -6 0 L 6 0 L 0 9 Z", fill: C.gold, filter: "url(#glow-gold)" }, ptr);
      txt("head", { x: 0, y: -8, "text-anchor": "middle", "font-size": 13, fill: C.gold }, ptr);
      scene.headPtrs.push(ptr);
    });

    // -- heap panel ------------------------------------------------------
    const heapX = 820, heapY = 160, heapW = 400, heapH = 252;
    const heapPanel = el("g", {}, chipsL);
    el("rect", {
      x: heapX, y: heapY, width: heapW, height: heapH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, heapPanel);
    scene.heapPanel = heapPanel;
    scene.heapTitle = txt("min-heap  ·  one candidate per list", {
      x: heapX + 18, y: heapY + 27, "font-size": 16, fill: C.purple,
    }, textL);
    setOpacity(heapPanel, 0);
    setOpacity(scene.heapTitle, 0);
    for (let i = 0; i < 4; i++) {
      const t = txt("", {
        x: heapX + 18, y: heapY + 62 + i * 30, "font-size": 17, fill: C.purple,
      }, textL);
      setOpacity(t, 0);
      scene.heapRows.push(t);
    }
    scene.heapEmpty = txt("empty", {
      x: heapX + 18, y: heapY + 62, "font-size": 17, fill: C.grey,
    }, textL);
    setOpacity(scene.heapEmpty, 0);

    // -- merged chain ----------------------------------------------------
    scene.mergedLabel = txt("merged", {
      x: 92, y: mergedY + nodeH / 2 + 1, "font-size": 18, fill: C.green,
    }, textL);
    setOpacity(scene.mergedLabel, 0);
    const total = sim.merged.length;
    const mGap = total > 7 ? 10 : 16;
    const mW = total ? clamp((700 - mGap * (total - 1)) / total, 48, 70) : 70;
    const mTotal = total * mW + Math.max(0, total - 1) * mGap;
    const mStart = 250 + (700 - mTotal) / 2;
    scene.mW = mW;
    sim.merged.forEach((value, i) => {
      const x = mStart + i * (mW + mGap);
      const g = el("g", { transform: "translate(" + x + " " + mergedY + ")" }, chipsL);
      const enter = el("g", {}, g);
      const scale = el("g", {}, enter);
      el("rect", {
        x: 0, y: 0, width: mW, height: nodeH, rx: 9,
        fill: "#13261B", stroke: C.green, "stroke-width": 1.8,
      }, scale);
      const val = txt(String(value), {
        x: mW / 2, y: nodeH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": 19, fill: C.green,
      }, scale);
      const flash = el("rect", {
        x: 0, y: 0, width: mW, height: nodeH, rx: 9, fill: "none",
        stroke: C.gold, "stroke-width": 3, filter: "url(#glow-gold)",
      }, scale);
      setOpacity(flash, 0);
      setOpacity(enter, 0);
      scene.mergedNodes.push({ value, g, enter, scale, val, flash, x, cx: x + mW / 2 });
      if (i > 0) {
        const prev = scene.mergedNodes[i - 1];
        const ey = mergedY + nodeH / 2;
        const eg = el("g", {}, arcsL);
        el("line", {
          x1: prev.x + mW, y1: ey, x2: x - 8, y2: ey, stroke: C.green,
          "stroke-width": 2.2, "stroke-linecap": "round",
        }, eg);
        el("polygon", {
          points: (x - 8) + "," + (ey - 5.5) + " " + (x - 8) + "," + (ey + 5.5) + " " + x + "," + ey,
          fill: C.green,
        }, eg);
        setOpacity(eg, 0);
        scene.mergedEdges.push(eg);
      }
    });

    scene.dummyLabel = txt("dummy", {
      x: 250 - 34, y: mergedY + nodeH / 2, "text-anchor": "middle",
      "font-size": 14, fill: C.gold, "dominant-baseline": "central",
    }, textL);
    scene.dummyArrow = el("line", {
      x1: 250 - 14, y1: mergedY + nodeH / 2, x2: 250 - 4, y2: mergedY + nodeH / 2,
      stroke: C.gold, "stroke-width": 2.2,
    }, ptrL);
    setOpacity(scene.dummyLabel, 0);
    setOpacity(scene.dummyArrow, 0);

    scene.tailPtr = el("g", {}, ptrL);
    setOpacity(scene.tailPtr, 0);
    el("path", { d: "M -6 0 L 6 0 L 0 9 Z", fill: C.green, filter: "url(#glow-green)" }, scene.tailPtr);
    txt("tail", { x: 0, y: -8, "text-anchor": "middle", "font-size": 14, fill: C.green }, scene.tailPtr);

    // -- status + result -------------------------------------------------
    scene.status = txt("", {
      x: STAGE_W / 2, y: 602, "text-anchor": "middle", "font-size": 21, fill: C.gold,
    }, textL);
    setOpacity(scene.status, 0);

    scene.result = txt("return " + JSON.stringify(sim.merged), {
      x: STAGE_W / 2, y: 664, "text-anchor": "middle", "font-size": 27, fill: C.green,
    }, resultL);
    const rule = el("line", {
      x1: STAGE_W / 2 - 210, y1: 684, x2: STAGE_W / 2 + 210, y2: 684,
      stroke: C.green, "stroke-width": 4, "stroke-linecap": "round",
    }, resultL);
    const ruleLen = rule.getTotalLength();
    rule.setAttribute("stroke-dasharray", String(ruleLen));
    rule.setAttribute("stroke-dashoffset", String(ruleLen));
    scene.resultRule = rule;
    scene.ruleLen = ruleLen;

    // -- reset -----------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.heapTitle, scene.heapEmpty, scene.mergedLabel,
                          scene.dummyLabel, scene.status]) setOpacity(node, 0);
      scene.status.textContent = "";
      setOpacity(scene.heapPanel, 0);
      setOpacity(scene.dummyArrow, 0);
      setOpacity(scene.tailPtr, 0);
      for (let li = 0; li < k; li++) {
        setOpacity(scene["rowLabel" + li], 0);
        if (scene["emptyRow" + li]) setOpacity(scene["emptyRow" + li], 0);
        for (const node of scene.rowNodes[li]) {
          setOpacity(node.enter, 0);
          setScaleAt(node.scale, nodeW / 2, nodeH / 2, 1);
          setOpacity(node.g, 1);
          setOpacity(node.idle, 1);
          setOpacity(node.hot, 0);
          setOpacity(node.ring, 0);
        }
        for (const e of scene.rowEdges[li]) setOpacity(e, 0);
        setOpacity(scene.headPtrs[li], 0);
      }
      for (const t of scene.heapRows) {
        setOpacity(t, 0);
        t.textContent = "";
      }
      for (const node of scene.mergedNodes) {
        setOpacity(node.enter, 0);
        setScaleAt(node.scale, scene.mW / 2, nodeH / 2, 1);
        setOpacity(node.flash, 0);
      }
      for (const e of scene.mergedEdges) setOpacity(e, 0);
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt } = ctx;
    const { lists, sim } = scene;
    const nodeH = scene.nodeH;
    const mergedY = scene.mergedY;

    scene.reset();

    const status = (text, color) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || ctx.C.gold);
      });
      tl.log(text, color || ctx.C.gold);
    };
    const setHeap = heap => {
      const sorted = heap.slice().sort((a, b) => a.value - b.value || a.list - b.list);
      for (let i = 0; i < scene.heapRows.length; i++) {
        const row = scene.heapRows[i];
        if (i < sorted.length) {
          const h = sorted[i];
          row.textContent = "v=" + h.value + "   ·   L" + h.list;
          row.setAttribute("fill", i === 0 ? ctx.C.gold : ctx.C.purple);
          setOpacity(row, 1);
        } else {
          row.textContent = "";
          setOpacity(row, 0);
        }
      }
      setOpacity(scene.heapEmpty, sorted.length ? 0 : 1);
    };
    const moveHead = (li, pos, dur) => {
      const nodes = scene.rowNodes[li];
      if (pos >= nodes.length) {
        tl.add(dur || 0.25, u => setOpacity(scene.headPtrs[li], 1 - u), ease.outCubic);
      } else {
        const node = nodes[pos];
        const from = Number((/translate\(([-\d.]+)/.exec(scene.headPtrs[li].getAttribute("transform") || "translate(0 0)") || [0, 0])[1]);
        tl.add(dur || 0.28, u => {
          setOpacity(scene.headPtrs[li], 1);
          setTranslate(scene.headPtrs[li], from + (node.cx - from) * u, node.y - 18);
        }, ease.inOutSine);
      }
    };

    // -- intro -----------------------------------------------------------
    tl.line(1);
    tl.add(0.65, scene.writer(scene.title), ease.outCubic);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), ease.outCubic);
    tl.add(0.3, u => {
      setOpacity(scene.heapPanel, u);
      setOpacity(scene.heapTitle, u);
      setOpacity(scene.mergedLabel, u);
    }, ease.outCubic);

    tl.line(2);
    status("heap = []   →   one candidate from each non-empty list", ctx.C.purple);
    tl.add(0.25, u => setOpacity(scene.status, u), ease.outCubic);
    lists.forEach((values, li) => {
      tl.line(3);
      const y = 150 + li * 84;
      tl.line(4);
      tl.add(0.01, () => setOpacity(scene["rowLabel" + li], 1));
      values.forEach((value, i) => {
        const node = scene.rowNodes[li][i];
        tl.add(0.22, u => {
          setOpacity(node.enter, u);
          node.enter.setAttribute("transform", "translate(0 " + (1 - u) * 10 + ")");
          setScaleAt(node.scale, 54 / 2, nodeH / 2, 0.85 + 0.15 * u);
        }, ease.outCubic);
      });
      for (const e of scene.rowEdges[li]) tl.add(0.12, u => setOpacity(e, u), ease.outCubic);
      if (scene["emptyRow" + li]) tl.add(0.2, u => setOpacity(scene["emptyRow" + li], u), ease.outCubic);
      tl.line(5);
      if (values.length) {
        tl.line(6);
        const node = scene.rowNodes[li][0];
        tl.add(0.01, () => {
          setTranslate(scene.headPtrs[li], node.cx, node.y - 18);
          setOpacity(scene.headPtrs[li], 1);
        });
        status("list " + li + " contributes head value " + values[0], ctx.C.blue);
      } else {
        status("list " + li + " is empty   →   skip it", ctx.C.grey);
      }
      tl.wait(0.05);
    });
    tl.line(7);
    tl.add(0.01, () => setHeap(sim.initialHeap));
    status("heapq.heapify(heap)   →   the smallest head is now the root", ctx.C.gold);

    tl.line(8);
    tl.add(0.3, u => {
      setOpacity(scene.dummyLabel, u);
      setOpacity(scene.dummyArrow, u);
    }, ease.outCubic);
    status("dummy = tail = ListNode()", ctx.C.gold);
    if (sim.merged.length) {
      tl.add(0.01, () => {
        setTranslate(scene.tailPtr, 250 - 24, mergedY + nodeH + 16);
        setOpacity(scene.tailPtr, 1);
      });
    }

    // -- pop / push loop -------------------------------------------------
    sim.steps.forEach((step, si) => {
      tl.line(9);
      status(
        "while heap: pop the root " + step.value + " from list " + step.list,
        ctx.C.gold
      );
      tl.line(10);
      // Flash the current heap root before updating.
      if (scene.heapRows[0]) {
        tl.add(0.25, u => {
          scene.heapRows[0].setAttribute("fill", u > 0.45 ? ctx.C.red : ctx.C.gold);
        }, ease.linear);
      }
      tl.add(0.01, () => setHeap(step.beforeHeap));
      tl.line(11);
      const mn = scene.mergedNodes[si];
      tl.add(0.36, u => {
        setOpacity(mn.enter, Math.min(1, u * 2.1));
        mn.enter.setAttribute("transform", "translate(0 " + (1 - u) * 12 + ")");
        setScaleAt(mn.scale, scene.mW / 2, nodeH / 2, 0.84 + 0.16 * u);
      }, ease.outCubic);
      if (si > 0) tl.add(0.18, u => setOpacity(scene.mergedEdges[si - 1], u), ease.outCubic);
      tl.add(0.22, u => setOpacity(mn.flash, Math.sin(Math.PI * u)), ease.linear);
      tl.line(12);
      tl.add(0.2, u => {
        setTranslate(scene.tailPtr, mn.cx, mergedY + nodeH + 16);
        setOpacity(scene.tailPtr, u);
      }, ease.inOutSine);

      // The consumed input node is dimmed and its head pointer advances.
      const consumed = scene.rowNodes[step.list][step.pos];
      tl.add(0.01, () => {
        setOpacity(consumed.hot, 0);
        setOpacity(consumed.ring, 0);
        setOpacity(consumed.g, 0.28);
      });
      moveHead(step.list, step.pos + 1, 0.28);
      tl.line(13);
      if (step.nextValue !== null) {
        tl.line(14);
        tl.add(0.01, () => setHeap(step.afterHeap));
        status(
          "push next head " + step.nextValue + " from list " + step.list + " into the heap",
          ctx.C.purple
        );
      } else {
        tl.add(0.01, () => setHeap(step.afterHeap));
        status("list " + step.list + " is exhausted   →   no push", ctx.C.grey);
      }
      tl.wait(0.1);
    });

    // -- finish ----------------------------------------------------------
    tl.line(15);
    status("tail.next = None   →   terminate the merged chain", ctx.C.green);
    tl.add(0.25, u => setOpacity(scene.tailPtr, 1 - u), ease.outCubic);
    tl.line(16);
    status("return dummy.next   →   the sorted merge", ctx.C.green);
    tl.add(0.25, u => {
      setOpacity(scene.status, 1 - u);
      setOpacity(scene.dummyLabel, 1 - u);
      setOpacity(scene.dummyArrow, 1 - u);
      setOpacity(scene.heapTitle, 1 - u);
      setOpacity(scene.heapEmpty, 1 - u);
      for (const row of scene.heapRows) setOpacity(row, 1 - u);
    }, ease.outCubic);
    tl.add(0.55, scene.writer(scene.result), ease.linear);
    tl.add(0.4, u => scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u))), ease.outCubic);
    tl.log("merged = [" + sim.merged.join(", ") + "]", ctx.C.green);
    tl.wait(0.7);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model.
 * ------------------------------------------------------------------ */

function simulate(lists) {
  let heap = [];
  lists.forEach((values, list) => {
    if (values.length) heap.push({ value: values[0], list, pos: 0 });
  });
  const initialHeap = heap.slice();
  const merged = [];
  const steps = [];
  let guard = 0;
  while (heap.length && guard++ < 100) {
    const sorted = heap.slice().sort((a, b) => a.value - b.value || a.list - b.list);
    const chosen = sorted[0];
    const beforeHeap = heap.slice();
    heap = heap.filter(h => h !== chosen);
    merged.push(chosen.value);
    const nextPos = chosen.pos + 1;
    let nextValue = null;
    if (nextPos < lists[chosen.list].length) {
      nextValue = lists[chosen.list][nextPos];
      heap.push({ value: nextValue, list: chosen.list, pos: nextPos });
    }
    steps.push({
      value: chosen.value, list: chosen.list, pos: chosen.pos,
      nextValue, beforeHeap, afterHeap: heap.slice(),
    });
  }
  return { initialHeap, merged, steps };
}
