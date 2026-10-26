/* Reorder List — animated walkthrough scene (3Blue1Brown style).
 *
 * Three acts: find the middle with slow/fast pointers, reverse the second
 * half, then interleave the two halves. The original row stays on top while
 * the reversed second half and the final weave are shown below it.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Reorder List",
    subtitle: "middle → reverse second half → interleave · O(n) time · O(1) space",
    inputs: [
      { id: "head", label: "head", type: "text", default: "1, 2, 3, 4, 5", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "first half" },
      { color: "#B58CD6", text: "reversed second half" },
      { color: "#F0AC5F", text: "slow / fast" },
      { color: "#83C167", text: "interleaved result" },
    ],
  },

  code: [
    "def reorder_list(head: List[int]) -> List[int]:",
    "    root = build_linked_list(head)",
    "    if root is None or root.next is None:",
    "        return linked_list_to_list(root)",
    "    slow, fast = root, root.next",
    "    while fast is not None and fast.next is not None:",
    "        slow = slow.next",
    "        fast = fast.next.next",
    "    second = slow.next",
    "    slow.next = None",
    "    prev = None",
    "    while second is not None:",
    "        second.next, prev, second = prev, second, second.next",
    "    second = prev",
    "    first = root",
    "    while second is not None:",
    "        first_next, second_next = first.next, second.next",
    "        first.next = second",
    "        second.next = first_next",
    "        first, second = first_next, second_next",
    "    return linked_list_to_list(root)",
  ],

  read(values) {
    const raw = (values.head || "").trim();
    const nums = raw ? raw.split(/[\s,]+/).filter(Boolean).map(Number) : [];
    if (!nums.every(Number.isInteger) || nums.length > 8) return null;
    return { values: nums };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const values = args[0].map(Number);
      if (values.length <= 8 && values.every(Number.isInteger)) {
        return { head: values.join(", ") };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, setScaleAt, STAGE_W } = ctx;
    const { values } = params;
    const sim = simulate(values);

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
      values, sim, ctx, topNodes: [], topEdges: [], revNodes: [], revEdges: [],
      finalNodes: [], finalEdges: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title -----------------------------------------------------------
    scene.title = txt("Reorder List", {
      x: 64, y: 68, "font-size": 44, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    const sub = el("text", { x: 64, y: 103, "font-size": 21, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "head = ";
    el("tspan", { fill: C.white }, sub).textContent = "[" + values.join(", ") + "]";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- geometry --------------------------------------------------------
    const n = values.length;
    const nodeH = 64;
    const gap = n > 6 ? 16 : 26;
    const nodeW = n ? clamp((900 - gap * (n - 1)) / n, 54, 98) : 98;
    const rowX = n ? STAGE_W / 2 - (n * nodeW + (n - 1) * gap) / 2 : STAGE_W / 2;
    const topY = 192, revY = 350, finalY = 508;
    const font = clamp(nodeW * 0.4, 15, 29);
    scene.topY = topY;
    scene.revY = revY;
    scene.finalY = finalY;
    scene.nodeW = nodeW;
    scene.nodeH = nodeH;

    const rowLabel = (text, color, y) => {
      const t = txt(text, { x: 92, y: y + nodeH / 2 + 1, "font-size": 18, fill: color }, textL);
      setOpacity(t, 0);
      return t;
    };
    scene.labelTop = rowLabel("original", C.grey, topY);
    scene.labelRev = rowLabel("second half reversed", C.purple, revY);
    scene.labelFinal = rowLabel("interleaved", C.green, finalY);

    const mkNode = (value, x, top, color, parent) => {
      const g = el("g", { transform: "translate(" + x + " " + top + ")" }, parent);
      const enter = el("g", {}, g);
      const scale = el("g", {}, enter);
      el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 11,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, scale);
      const mk = fill => txt(String(value), {
        x: nodeW / 2, y: nodeH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": font, fill,
      }, scale);
      const idle = mk(color === C.green ? C.green : C.white);
      const hot = mk(color);
      const red = mk(C.red);
      setOpacity(hot, 0);
      setOpacity(red, 0);
      const ring = el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 11, fill: "none",
        stroke: color, "stroke-width": 3,
        filter: "url(#" + (color === C.purple ? "glow-purple" : (color === C.green ? "glow-green" : "glow-blue")) + ")",
      }, scale);
      const redRing = el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 11, fill: "none",
        stroke: C.red, "stroke-width": 3.4, filter: "url(#glow-red)",
      }, scale);
      setOpacity(ring, 0);
      setOpacity(redRing, 0);
      setOpacity(enter, 0);
      return {
        value, g, enter, scale, idle, hot, red, ring, redRing,
        x, cx: x + nodeW / 2, top, w: nodeW, h: nodeH,
      };
    };

    // -- top row ---------------------------------------------------------
    values.forEach((v, i) => {
      scene.topNodes.push(mkNode(v, rowX + i * (nodeW + gap), topY, C.blue, chipsL));
    });
    const mkEdge = (from, to, color, parent) => {
      const y = from.top + nodeH / 2;
      const x1 = from.x + nodeW, x2 = to.x;
      const g = el("g", {}, parent);
      el("line", {
        x1, y1: y, x2: x2 - 8, y2: y, stroke: color, "stroke-width": 2.6,
        "stroke-linecap": "round",
      }, g);
      el("polygon", {
        points: (x2 - 8) + "," + (y - 6.5) + " " + (x2 - 8) + "," + (y + 6.5) + " " + x2 + "," + y,
        fill: color,
      }, g);
      setOpacity(g, 0);
      return g;
    };
    for (let i = 0; i < n - 1; i++) scene.topEdges.push(mkEdge(scene.topNodes[i], scene.topNodes[i + 1], C.grey, arcsL));

    // -- reversed second half row ---------------------------------------
    sim.revValues.forEach((v, i) => {
      scene.revNodes.push(mkNode(v, rowX + i * (nodeW + gap), revY, C.purple, chipsL));
      if (i > 0) scene.revEdges.push(mkEdge(scene.revNodes[i - 1], scene.revNodes[i], C.purple, arcsL));
    });

    // -- final row -------------------------------------------------------
    sim.finalValues.forEach((v, i) => {
      scene.finalNodes.push(mkNode(v, rowX + i * (nodeW + gap), finalY, C.green, chipsL));
      if (i > 0) scene.finalEdges.push(mkEdge(scene.finalNodes[i - 1], scene.finalNodes[i], C.green, arcsL));
    });

    // -- pointers --------------------------------------------------------
    const mkPointer = (label, color, glow, dx) => {
      const g = el("g", {}, ptrL);
      setOpacity(g, 0);
      el("path", { d: "M -7 0 L 7 0 L 0 10 Z", fill: color, filter: "url(#" + glow + ")" }, g);
      txt(label, { x: dx || 0, y: -8, "text-anchor": "middle", "font-size": 16, fill: color }, g);
      return g;
    };
    scene.ptrSlow = mkPointer("slow", C.blue, "glow-blue", -19);
    scene.ptrFast = mkPointer("fast", C.gold, "glow-gold", 19);
    scene.ptrRev = mkPointer("prev", C.purple, "glow-purple", 0);
    scene.ptrFirst = mkPointer("first", C.blue, "glow-blue", 0);

    // -- status + result -------------------------------------------------
    scene.status = txt("", {
      x: STAGE_W / 2, y: 610, "text-anchor": "middle", "font-size": 20, fill: C.gold,
    }, textL);
    setOpacity(scene.status, 0);

    scene.result = txt("return " + JSON.stringify(sim.finalValues), {
      x: STAGE_W / 2, y: 676, "text-anchor": "middle", "font-size": 29, fill: C.green,
    }, resultL);
    const rule = el("line", {
      x1: STAGE_W / 2 - 175, y1: 696, x2: STAGE_W / 2 + 175, y2: 696,
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
      for (const node of [scene.subtitle, scene.labelTop, scene.labelRev, scene.labelFinal, scene.status]) setOpacity(node, 0);
      scene.status.textContent = "";
      for (const node of scene.topNodes.concat(scene.revNodes, scene.finalNodes)) {
        setOpacity(node.enter, 0);
        node.enter.setAttribute("transform", "translate(0 0)");
        setScaleAt(node.scale, node.w / 2, node.h / 2, 1);
        setOpacity(node.idle, 1);
        setOpacity(node.hot, 0);
        setOpacity(node.red, 0);
        setOpacity(node.ring, 0);
        setOpacity(node.redRing, 0);
      }
      for (const node of scene.topNodes) node.hot.setAttribute("fill", C.blue);
      for (const e of scene.topEdges.concat(scene.revEdges, scene.finalEdges)) setOpacity(e, 0);
      for (const p of [scene.ptrSlow, scene.ptrFast, scene.ptrRev, scene.ptrFirst]) setOpacity(p, 0);
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt } = ctx;
    const { values, sim } = scene;
    const { topNodes, revNodes, finalNodes } = scene;
    const topY = scene.topY, revY = scene.revY, finalY = scene.finalY;

    scene.reset();

    const status = (text, color) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || ctx.C.gold);
      });
      tl.log(text, color || ctx.C.gold);
    };
    const ptrPos = ptr => {
      const tr = ptr.getAttribute("transform") || "translate(0 0)";
      const m = /translate\(([-\d.]+)[,\s]+([-\d.]+)/.exec(tr);
      return m ? [Number(m[1]), Number(m[2])] : [0, 0];
    };
    const movePtr = (ptr, x, y, dur) => {
      const [fx, fy] = ptrPos(ptr);
      tl.add(dur || 0.3, u => {
        setOpacity(ptr, 1);
        setTranslate(ptr, fx + (x - fx) * u, fy + (y - fy) * u);
      }, ease.inOutSine);
    };

    // -- intro -----------------------------------------------------------
    tl.line(1);
    tl.add(0.65, scene.writer(scene.title), ease.outCubic);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), ease.outCubic);
    for (const label of [scene.labelTop, scene.labelRev, scene.labelFinal]) {
      tl.add(0.22, u => setOpacity(label, u), ease.outCubic);
    }
    topNodes.forEach(node => {
      tl.add(0.27, u => {
        setOpacity(node.enter, u);
        node.enter.setAttribute("transform", "translate(0 " + (1 - u) * 12 + ")");
        setScaleAt(node.scale, node.w / 2, node.h / 2, 0.86 + 0.14 * u);
      }, ease.outCubic);
    });
    tl.add(0.25, u => {
      for (const e of scene.topEdges) setOpacity(e, u);
    }, ease.outCubic);

    tl.line(2);
    status("root = build_linked_list(head)", ctx.C.blue);
    tl.line(3);
    if (sim.trivial) {
      status("root is None or has one node   →   nothing to reorder", ctx.C.grey);
      tl.line(4);
      tl.add(0.55, scene.writer(scene.result), ease.linear);
      tl.add(0.35, u => scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u))), ease.outCubic);
      tl.wait(0.7);
      return tl.finish();
    }
    status("root has at least two nodes   →   continue", ctx.C.grey);

    // -- find the middle -------------------------------------------------
    tl.line(5);
    status("slow = root, fast = root.next", ctx.C.gold);
    tl.add(0.3, u => setOpacity(scene.status, u), ease.outCubic);
    movePtr(scene.ptrSlow, topNodes[0].cx, topY - 30, 0.3);
    movePtr(scene.ptrFast, topNodes[1].cx, topY - 30, 0.3);
    tl.add(0.2, u => {
      setOpacity(topNodes[0].idle, 1 - u);
      setOpacity(topNodes[0].hot, u);
      setOpacity(topNodes[0].ring, u);
      setOpacity(topNodes[1].idle, 1 - u);
      setOpacity(topNodes[1].hot, u);
      setOpacity(topNodes[1].ring, u);
    }, ease.outCubic);

    sim.middleFrames.forEach((frame, fi) => {
      tl.line(6);
      status(
        "fast = " + frame.fast + " and fast.next = " + frame.fastNext + "   →   advance both",
        ctx.C.gold
      );
      tl.line(7);
      movePtr(scene.ptrSlow, topNodes[frame.slow].cx, topY - 30, 0.3);
      tl.line(8);
      movePtr(scene.ptrFast, topNodes[frame.fast].cx, topY - 30, 0.36);
      tl.add(0.01, () => {
        for (const node of topNodes) {
          setOpacity(node.hot, 0);
          setOpacity(node.idle, 1);
          setOpacity(node.ring, 0);
        }
        setOpacity(topNodes[frame.slow].idle, 0);
        setOpacity(topNodes[frame.slow].hot, 1);
        setOpacity(topNodes[frame.slow].ring, 1);
        setOpacity(topNodes[frame.fast].idle, 0);
        setOpacity(topNodes[frame.fast].hot, 1);
        setOpacity(topNodes[frame.fast].ring, 1);
      });
      tl.wait(0.08);
    });
    const mid = sim.mid;
    tl.line(9);
    status("second = slow.next   →   split after index " + mid, ctx.C.purple);
    tl.add(0.35, u => {
      for (const node of topNodes) {
        setOpacity(node.idle, 1 - u);
        setOpacity(node.hot, u);
        setOpacity(node.ring, 0);
      }
      for (let i = 0; i <= mid; i++) {
        topNodes[i].hot.setAttribute("fill", ctx.C.blue);
      }
      for (let i = mid + 1; i < topNodes.length; i++) {
        topNodes[i].hot.setAttribute("fill", ctx.C.purple);
      }
    }, ease.outCubic);
    tl.line(10);
    if (scene.topEdges[mid]) {
      tl.add(0.3, u => setOpacity(scene.topEdges[mid], 1 - u), ease.outCubic);
    }
    status("slow.next = None   →   the two halves are separated", ctx.C.red);

    // -- reverse the second half ----------------------------------------
    tl.line(11);
    status("prev = None   →   build the reversed half", ctx.C.purple);
    tl.add(0.3, u => setOpacity(scene.status, u), ease.outCubic);
    for (let k = 0; k < sim.revValues.length; k++) {
      tl.line(12);
      tl.line(13);
      const rn = revNodes[k];
      tl.add(0.4, u => {
        setOpacity(rn.enter, Math.min(1, u * 2.1));
        rn.enter.setAttribute("transform", "translate(0 " + (1 - u) * 12 + ")");
        setScaleAt(rn.scale, rn.w / 2, rn.h / 2, 0.85 + 0.15 * u);
        setOpacity(rn.idle, 1 - u);
        setOpacity(rn.hot, u);
      }, ease.outCubic);
      if (k > 0) tl.add(0.25, u => setOpacity(scene.revEdges[k - 1], u), ease.outCubic);
      if (k === 0) movePtr(scene.ptrRev, rn.cx, revY - 28, 0.28);
      else movePtr(scene.ptrRev, rn.cx, revY - 28, 0.28);
      status("second.next = prev   →   append " + rn.value + " to the reversed half", ctx.C.purple);
      tl.wait(0.1);
    }
    tl.line(14);
    status("second = prev   →   the reversed half is ready", ctx.C.green);
    tl.add(0.3, u => setOpacity(scene.ptrRev, 1 - u), ease.outCubic);

    // -- interleave ------------------------------------------------------
    tl.line(15);
    status("first = root   →   start weaving", ctx.C.blue);
    movePtr(scene.ptrFirst, topNodes[0].cx, topY - 30, 0.3);
    tl.line(16);
    for (let k = 0; k < finalNodes.length; k++) {
      const fn = finalNodes[k];
      tl.add(0.34, u => {
        setOpacity(fn.enter, Math.min(1, u * 2.1));
        fn.enter.setAttribute("transform", "translate(0 " + (1 - u) * 12 + ")");
        setScaleAt(fn.scale, fn.w / 2, fn.h / 2, 0.85 + 0.15 * u);
        setOpacity(fn.idle, 1 - u);
        setOpacity(fn.hot, u);
      }, ease.outCubic);
      if (k > 0) tl.add(0.2, u => setOpacity(scene.finalEdges[k - 1], u), ease.outCubic);
      tl.line(17);
      if (k % 2 === 0) tl.line(18);
      else tl.line(19);
      status(
        "weave " + (k + 1) + " / " + finalNodes.length + ": take " + fn.value +
        (k % 2 === 0 ? " from the first half" : " from the reversed half"),
        ctx.C.green
      );
      tl.line(20);
      tl.wait(0.08);
    }

    // -- result ----------------------------------------------------------
    tl.line(21);
    status("return root   →   reordered list", ctx.C.green);
    tl.add(0.25, u => {
      setOpacity(scene.status, 1 - u);
      setOpacity(scene.ptrFirst, 1 - u);
      setOpacity(scene.ptrSlow, 1 - u);
      setOpacity(scene.ptrFast, 1 - u);
    }, ease.outCubic);
    tl.add(0.55, scene.writer(scene.result), ease.linear);
    tl.add(0.4, u => scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u))), ease.outCubic);
    tl.log("reordered = [" + sim.finalValues.join(", ") + "]", ctx.C.green);
    tl.wait(0.7);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model.
 * ------------------------------------------------------------------ */

function simulate(values) {
  const n = values.length;
  if (n <= 1) {
    return {
      trivial: true, mid: 0, middleFrames: [], revValues: [], finalValues: values.slice(),
    };
  }
  let slow = 0, fast = 1;
  const middleFrames = [];
  while (fast < n && fast + 1 < n) {
    middleFrames.push({ slow, fast, fastNext: fast + 1 });
    slow += 1;
    fast += 2;
  }
  const mid = slow;
  const first = values.slice(0, mid + 1);
  const second = values.slice(mid + 1);
  const revValues = second.slice().reverse();
  const finalValues = [];
  for (let i = 0; i < first.length || i < revValues.length; i++) {
    if (i < first.length) finalValues.push(first[i]);
    if (i < revValues.length) finalValues.push(revValues[i]);
  }
  return { trivial: false, mid, middleFrames, revValues, finalValues };
}
