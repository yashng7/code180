/* Merge Two Sorted Lists — animated walkthrough scene (3Blue1Brown style).
 *
 * Two sorted input chains sit on top. `a` and `b` compare their current heads,
 * the smaller node is spliced onto the merged chain below, and `tail` advances.
 * Once one input runs out, its remaining suffix is attached in one move.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Merge Two Sorted Lists",
    subtitle: "dummy head + tail · compare heads, splice smaller · O(n + m)",
    inputs: [
      { id: "l1", label: "list 1", type: "text", default: "1, 2, 4", width: "wide" },
      { id: "l2", label: "list 2", type: "text", default: "1, 3, 4", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "list 1 / a" },
      { color: "#B58CD6", text: "list 2 / b" },
      { color: "#83C167", text: "merged chain" },
      { color: "#F0AC5F", text: "tail" },
    ],
  },

  code: [
    "def merge_two_lists(l1: List[int], l2: List[int]) -> List[int]:",
    "    a = build_linked_list(l1)",
    "    b = build_linked_list(l2)",
    "    dummy = ListNode()",
    "    tail = dummy",
    "    while a is not None and b is not None:",
    "        if a.val <= b.val:",
    "            tail.next, a = a, a.next",
    "        else:",
    "            tail.next, b = b, b.next",
    "        tail = tail.next",
    "    tail.next = a if a is not None else b",
    "    return linked_list_to_list(dummy.next)",
  ],

  read(values) {
    const raw1 = (values.l1 || "").trim();
    const raw2 = (values.l2 || "").trim();
    const parse = raw => {
      if (!raw) return [];
      const nums = raw.split(/[\s,]+/).filter(Boolean).map(Number);
      return nums.every(Number.isInteger) ? nums : null;
    };
    const a = parse(raw1), b = parse(raw2);
    if (!a || !b) return null;
    if (a.length > 7 || b.length > 7) return null;
    for (let i = 1; i < a.length; i++) if (a[i] < a[i - 1]) return null;
    for (let i = 1; i < b.length; i++) if (b[i] < b[i - 1]) return null;
    return { a, b };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0]) && Array.isArray(args[1])) {
      const a = args[0].map(Number), b = args[1].map(Number);
      const sorted = xs => xs.every((v, i) => i === 0 || xs[i - 1] <= v);
      if (a.length <= 7 && b.length <= 7 && a.every(Number.isInteger) && b.every(Number.isInteger) && sorted(a) && sorted(b)) {
        return { l1: a.join(", "), l2: b.join(", ") };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, setScaleAt, STAGE_W } = ctx;
    const { a, b } = params;
    const sim = simulate(a, b);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-purple", C.purple);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-gold", C.gold);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const arcsL = ctx.layer("arcs");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = {
      a, b, sim, ctx, nodesA: [], nodesB: [], merged: [], mergedEdges: [],
      _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title -----------------------------------------------------------
    scene.title = txt("Merge Two Sorted Lists", {
      x: 64, y: 70, "font-size": 42, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    const sub = el("text", { x: 64, y: 105, "font-size": 21, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "list 1 = ";
    el("tspan", { fill: C.blue }, sub).textContent = "[" + a.join(", ") + "]";
    el("tspan", {}, sub).textContent = "     list 2 = ";
    el("tspan", { fill: C.purple }, sub).textContent = "[" + b.join(", ") + "]";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- row geometry ----------------------------------------------------
    const nodeH = 62;
    const gap = 22;
    const maxLen = Math.max(a.length, b.length, sim.merged.length, 1);
    const nodeW = clamp((820 - gap * (maxLen - 1)) / maxLen, 48, 88);
    const rowX = 276;
    const row1Y = 190, row2Y = 296, mergedY = 458;
    const font = clamp(nodeW * 0.4, 15, 27);
    scene.nodeW = nodeW;
    scene.nodeH = nodeH;
    scene.mergedY = mergedY;

    const mkRowLabel = (text, color, y) => {
      const t = txt(text, { x: 96, y: y + nodeH / 2 + 1, "font-size": 19, fill: color }, textL);
      setOpacity(t, 0);
      return t;
    };
    scene.labelA = mkRowLabel("list 1", C.blue, row1Y);
    scene.labelB = mkRowLabel("list 2", C.purple, row2Y);
    scene.labelM = mkRowLabel("merged", C.green, mergedY);

    const mkNode = (value, i, x, top, color, parent) => {
      const g = el("g", { transform: "translate(" + x + " " + top + ")" }, parent);
      const enter = el("g", {}, g);
      const scale = el("g", {}, enter);
      const rect = el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 11,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, scale);
      const mk = fill => txt(String(value), {
        x: nodeW / 2, y: nodeH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": font, fill,
      }, scale);
      const idle = mk(C.white), hot = mk(color);
      setOpacity(hot, 0);
      const ring = el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 11, fill: "none",
        stroke: color, "stroke-width": 3.2, filter: "url(#" + (color === C.purple ? "glow-purple" : "glow-blue") + ")",
      }, scale);
      setOpacity(ring, 0);
      setOpacity(enter, 0);
      return {
        i, value, g, enter, scale, rect, idle, hot, ring,
        x, cx: x + nodeW / 2, top, w: nodeW, h: nodeH,
      };
    };

    // -- input nodes -----------------------------------------------------
    const startA = rowX;
    a.forEach((v, i) => scene.nodesA.push(mkNode(v, i, startA + i * (nodeW + gap), row1Y, C.blue, chipsL)));
    b.forEach((v, i) => scene.nodesB.push(mkNode(v, i, startA + i * (nodeW + gap), row2Y, C.purple, chipsL)));

    if (!a.length) {
      scene.emptyA = txt("None", {
        x: startA + 18, y: row1Y + nodeH / 2, "font-size": 22, fill: C.grey,
        "dominant-baseline": "central",
      }, textL);
      setOpacity(scene.emptyA, 0);
    }
    if (!b.length) {
      scene.emptyB = txt("None", {
        x: startA + 18, y: row2Y + nodeH / 2, "font-size": 22, fill: C.grey,
        "dominant-baseline": "central",
      }, textL);
      setOpacity(scene.emptyB, 0);
    }

    // -- input edges -----------------------------------------------------
    const mkEdge = (from, to, color, parent) => {
      const y = from.top + nodeH / 2;
      const x1 = from.x + nodeW, x2 = to.x;
      const g = el("g", {}, parent);
      el("line", {
        x1, y1: y, x2: x2 - 9, y2: y, stroke: color, "stroke-width": 2.8,
        "stroke-linecap": "round",
      }, g);
      el("polygon", {
        points: (x2 - 9) + "," + (y - 7) + " " + (x2 - 9) + "," + (y + 7) + " " + x2 + "," + y,
        fill: color,
      }, g);
      setOpacity(g, 0);
      return g;
    };
    scene.edgesA = [];
    scene.edgesB = [];
    for (let i = 0; i < a.length - 1; i++) scene.edgesA.push(mkEdge(scene.nodesA[i], scene.nodesA[i + 1], C.blue, arcsL));
    for (let i = 0; i < b.length - 1; i++) scene.edgesB.push(mkEdge(scene.nodesB[i], scene.nodesB[i + 1], C.purple, arcsL));

    // -- merged nodes (pre-created, revealed as appended) ----------------
    sim.merged.forEach((value, i) => {
      const x = rowX + i * (nodeW + gap);
      const g = el("g", { transform: "translate(" + x + " " + mergedY + ")" }, chipsL);
      const enter = el("g", {}, g);
      const scale = el("g", {}, enter);
      el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 11,
        fill: "#13261B", stroke: C.green, "stroke-width": 2,
      }, scale);
      const val = txt(String(value), {
        x: nodeW / 2, y: nodeH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": font, fill: C.green,
      }, scale);
      const flash = el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 11, fill: "none",
        stroke: C.gold, "stroke-width": 3, filter: "url(#glow-gold)",
      }, scale);
      setOpacity(flash, 0);
      setOpacity(enter, 0);
      scene.merged.push({ i, value, g, enter, scale, val, flash, x, cx: x + nodeW / 2, top: mergedY });
      if (i > 0) {
        const prev = scene.merged[i - 1];
        const y = mergedY + nodeH / 2;
        const eg = el("g", {}, arcsL);
        el("line", {
          x1: prev.x + nodeW, y1: y, x2: x - 9, y2: y, stroke: C.green,
          "stroke-width": 2.8, "stroke-linecap": "round",
        }, eg);
        el("polygon", {
          points: (x - 9) + "," + (y - 7) + " " + (x - 9) + "," + (y + 7) + " " + x + "," + y,
          fill: C.green,
        }, eg);
        setOpacity(eg, 0);
        scene.mergedEdges.push(eg);
      }
    });
    scene.dummyLabel = txt("dummy", {
      x: rowX - 40, y: mergedY + nodeH / 2, "text-anchor": "middle",
      "font-size": 16, fill: C.gold, "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.dummyLabel, 0);
    scene.dummyArrow = el("line", {
      x1: rowX - 20, y1: mergedY + nodeH / 2, x2: rowX - 8, y2: mergedY + nodeH / 2,
      stroke: C.gold, "stroke-width": 2.5,
    }, ptrL);
    setOpacity(scene.dummyArrow, 0);

    // -- pointers --------------------------------------------------------
    const mkPointer = (label, color, glow) => {
      const g = el("g", {}, ptrL);
      setOpacity(g, 0);
      el("path", { d: "M -7 0 L 7 0 L 0 10 Z", fill: color, filter: "url(#" + glow + ")" }, g);
      txt(label, { x: 0, y: -8, "text-anchor": "middle", "font-size": 16, fill: color }, g);
      return g;
    };
    scene.ptrA = mkPointer("a", C.blue, "glow-blue");
    scene.ptrB = mkPointer("b", C.purple, "glow-purple");
    scene.ptrTail = mkPointer("tail", C.gold, "glow-gold");
    scene.noneA = txt("a = None", {
      x: startA + a.length * (nodeW + gap) + 22, y: row1Y + nodeH / 2,
      "font-size": 17, fill: C.grey, "dominant-baseline": "central",
    }, textL);
    scene.noneB = txt("b = None", {
      x: startA + b.length * (nodeW + gap) + 22, y: row2Y + nodeH / 2,
      "font-size": 17, fill: C.grey, "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.noneA, 0);
    setOpacity(scene.noneB, 0);

    // -- status + result -------------------------------------------------
    scene.status = txt("", {
      x: STAGE_W / 2, y: 550, "text-anchor": "middle", "font-size": 22, fill: C.gold,
    }, textL);
    setOpacity(scene.status, 0);

    scene.result = txt("return " + JSON.stringify(sim.merged), {
      x: STAGE_W / 2, y: 646, "text-anchor": "middle", "font-size": 31, fill: C.green,
    }, resultL);
    const rule = el("line", {
      x1: STAGE_W / 2 - 170, y1: 668, x2: STAGE_W / 2 + 170, y2: 668,
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
      for (const node of [scene.subtitle, scene.labelA, scene.labelB, scene.labelM,
                          scene.status, scene.noneA, scene.noneB, scene.dummyLabel]) setOpacity(node, 0);
      scene.status.textContent = "";
      for (const node of scene.nodesA.concat(scene.nodesB)) {
        setOpacity(node.enter, 0);
        node.enter.setAttribute("transform", "translate(0 0)");
        setScaleAt(node.scale, node.w / 2, node.h / 2, 1);
        setOpacity(node.idle, 1);
        setOpacity(node.hot, 0);
        setOpacity(node.ring, 0);
      }
      for (const e of scene.edgesA.concat(scene.edgesB)) setOpacity(e, 0);
      for (const m of scene.merged) {
        setOpacity(m.enter, 0);
        setScaleAt(m.scale, nodeW / 2, nodeH / 2, 1);
        setOpacity(m.flash, 0);
      }
      for (const e of scene.mergedEdges) setOpacity(e, 0);
      setOpacity(scene.ptrA, 0);
      setOpacity(scene.ptrB, 0);
      setOpacity(scene.ptrTail, 0);
      setOpacity(scene.dummyArrow, 0);
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt } = ctx;
    const { a, b, sim } = scene;
    const { nodeW, nodeH, mergedY } = scene;
    const row1Y = 190, row2Y = 296;

    scene.reset();

    const status = (text, color) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || ctx.C.gold);
      });
      tl.log(text, color || ctx.C.gold);
    };
    const ptrPos = (ptr, x, y) => {
      const tr = ptr.getAttribute("transform") || "translate(0 0)";
      const m = /translate\(([-\d.]+)[,\s]+([-\d.]+)/.exec(tr);
      return m ? [Number(m[1]), Number(m[2])] : [0, 0];
    };
    const movePtr = (ptr, x, y, dur) => {
      const [fromX, fromY] = ptrPos(ptr, x, y);
      tl.add(dur || 0.32, u => {
        setOpacity(ptr, 1);
        setTranslate(ptr, fromX + (x - fromX) * u, fromY + (y - fromY) * u);
      }, ease.inOutSine);
    };

    // -- intro -----------------------------------------------------------
    tl.line(1);
    tl.add(0.65, scene.writer(scene.title), ease.outCubic);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), ease.outCubic);
    for (const label of [scene.labelA, scene.labelB, scene.labelM]) {
      tl.add(0.25, u => setOpacity(label, u), ease.outCubic);
    }
    for (const node of scene.nodesA) {
      tl.add(0.3, u => {
        setOpacity(node.enter, u);
        node.enter.setAttribute("transform", "translate(0 " + (1 - u) * 14 + ")");
        setScaleAt(node.scale, node.w / 2, node.h / 2, 0.82 + 0.18 * u);
      }, ease.outCubic);
    }
    for (const e of scene.edgesA) tl.add(0.15, u => setOpacity(e, u), ease.outCubic);
    for (const node of scene.nodesB) {
      tl.add(0.3, u => {
        setOpacity(node.enter, u);
        node.enter.setAttribute("transform", "translate(0 " + (1 - u) * 14 + ")");
        setScaleAt(node.scale, node.w / 2, node.h / 2, 0.82 + 0.18 * u);
      }, ease.outCubic);
    }
    for (const e of scene.edgesB) tl.add(0.15, u => setOpacity(e, u), ease.outCubic);
    if (scene.emptyA) tl.add(0.3, u => setOpacity(scene.emptyA, u), ease.outCubic);
    if (scene.emptyB) tl.add(0.3, u => setOpacity(scene.emptyB, u), ease.outCubic);

    tl.line([2, 3]);
    status("a and b point at the two sorted heads", ctx.C.blue);
    tl.add(0.3, u => setOpacity(scene.status, u), ease.outCubic);
    tl.line([4, 5]);
    tl.add(0.35, u => {
      setOpacity(scene.dummyLabel, u);
      setOpacity(scene.dummyArrow, u);
    }, ease.outCubic);
    status("dummy = ListNode(); tail = dummy", ctx.C.gold);

    if (a.length) movePtr(scene.ptrA, scene.nodesA[0].cx, row1Y - 24, 0.3);
    else {
      tl.add(0.01, () => { setOpacity(scene.noneA, 1); });
    }
    if (b.length) movePtr(scene.ptrB, scene.nodesB[0].cx, row2Y - 24, 0.3);
    else {
      tl.add(0.01, () => { setOpacity(scene.noneB, 1); });
    }

    // -- comparison frames ----------------------------------------------
    let prevTailX = null;
    sim.frames.forEach((frame, fi) => {
      const chosen = frame.pick === "a" ? scene.nodesA[frame.i] : scene.nodesB[frame.j];
      const other = frame.pick === "a" ? scene.nodesB[frame.j] : scene.nodesA[frame.i];
      const rowY = frame.pick === "a" ? row1Y : row2Y;

      tl.line(6);
      status(
        "while both lists have nodes: compare a.val = " + (frame.pick === "a" ? chosen.value : a[frame.i]) +
        " with b.val = " + (frame.pick === "a" ? b[frame.j] : chosen.value),
        ctx.C.gold
      );
      tl.line(7);
      tl.add(0.3, u => {
        if (frame.pick === "a") {
          setOpacity(scene.nodesA[frame.i].idle, 1 - u);
          setOpacity(scene.nodesA[frame.i].hot, u);
          setOpacity(scene.nodesA[frame.i].ring, u);
          if (scene.nodesB[frame.j]) setOpacity(scene.nodesB[frame.j].ring, 0);
        } else {
          setOpacity(scene.nodesB[frame.j].idle, 1 - u);
          setOpacity(scene.nodesB[frame.j].hot, u);
          setOpacity(scene.nodesB[frame.j].ring, u);
          if (scene.nodesA[frame.i]) setOpacity(scene.nodesA[frame.i].ring, 0);
        }
      }, ease.outCubic);
      status(
        frame.pick === "a"
          ? "a.val <= b.val   →   take " + chosen.value + " from list 1"
          : "a.val > b.val   →   take " + chosen.value + " from list 2",
        frame.pick === "a" ? ctx.C.blue : ctx.C.purple
      );
      if (frame.pick === "a") tl.line(8);
      else tl.line([9, 10]);

      // Append the chosen node to the merged chain.
      const m = scene.merged[fi];
      const fromX = prevTailX === null ? scene.merged[0].x - 70 : prevTailX;
      tl.add(0.45, u => {
        setOpacity(m.enter, Math.min(1, u * 2.2));
        m.enter.setAttribute("transform", "translate(" + (1 - u) * (fromX - m.x) + " 0)");
        setScaleAt(m.scale, nodeW / 2, nodeH / 2, 0.86 + 0.14 * u);
      }, ease.outCubic);
      if (fi > 0) tl.add(0.25, u => setOpacity(scene.mergedEdges[fi - 1], u), ease.outCubic);
      tl.add(0.3, u => setOpacity(m.flash, Math.sin(Math.PI * u)), ease.linear);
      movePtr(scene.ptrTail, m.cx, mergedY + nodeH + 14, 0.28);
      prevTailX = m.x + nodeW;

      tl.line(11);
      status("tail = tail.next   →   merged length is now " + (fi + 1), ctx.C.green);
      if (frame.pick === "a") {
        const next = frame.i + 1;
        if (next < a.length) movePtr(scene.ptrA, scene.nodesA[next].cx, row1Y - 24, 0.3);
        else tl.add(0.25, u => setOpacity(scene.ptrA, 1 - u), ease.outCubic);
      } else {
        const next = frame.j + 1;
        if (next < b.length) movePtr(scene.ptrB, scene.nodesB[next].cx, row2Y - 24, 0.3);
        else tl.add(0.25, u => setOpacity(scene.ptrB, 1 - u), ease.outCubic);
      }
      tl.add(0.01, () => {
        if (frame.pick === "a") {
          const node = scene.nodesA[frame.i];
          setOpacity(node.hot, 0);
          setOpacity(node.idle, 1);
          setOpacity(node.ring, 0);
        } else {
          const node = scene.nodesB[frame.j];
          setOpacity(node.hot, 0);
          setOpacity(node.idle, 1);
          setOpacity(node.ring, 0);
        }
      });
      tl.wait(0.1);
    });

    // -- attach the remaining suffix ------------------------------------
    tl.line(12);
    const rem = sim.remaining === "a" ? sim.remA : sim.remB;
    if (rem.length) {
      const first = scene.merged[sim.frames.length];
      status("one list is exhausted   →   attach the remaining suffix", ctx.C.gold);
      tl.add(0.01, () => {
        setOpacity(scene.noneA, sim.remaining === "a" ? 1 : 0);
        setOpacity(scene.noneB, sim.remaining === "b" ? 1 : 0);
        if (sim.remaining === "a") setOpacity(scene.ptrA, 0);
        if (sim.remaining === "b") setOpacity(scene.ptrB, 0);
      });
      for (let k = 0; k < rem.length; k++) {
        const m = scene.merged[sim.frames.length + k];
        tl.add(0.35, u => {
          setOpacity(m.enter, Math.min(1, u * 2));
          m.enter.setAttribute("transform", "translate(0 " + (1 - u) * 10 + ")");
          setScaleAt(m.scale, nodeW / 2, nodeH / 2, 0.9 + 0.1 * u);
        }, ease.outCubic);
        if (sim.frames.length + k > 0) {
          tl.add(0.2, u => setOpacity(scene.mergedEdges[sim.frames.length + k - 1], u), ease.outCubic);
        }
        movePtr(scene.ptrTail, m.cx, mergedY + nodeH + 14, 0.25);
        tl.add(0.2, u => setOpacity(m.flash, Math.sin(Math.PI * u)), ease.linear);
      }
    } else {
      status("both lists are exhausted   →   stop splicing", ctx.C.grey);
    }

    tl.line(13);
    const fadeOut = (node, dur) => {
      const from = Number(node.style.opacity) || 0;
      tl.add(dur || 0.3, u => setOpacity(node, from * (1 - u)), ease.outCubic);
    };
    fadeOut(scene.ptrA);
    fadeOut(scene.ptrB);
    fadeOut(scene.ptrTail);
    fadeOut(scene.dummyLabel);
    fadeOut(scene.dummyArrow);
    fadeOut(scene.status);
    tl.add(0.6, scene.writer(scene.result), ease.linear);
    tl.add(0.4, u => scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u))), ease.outCubic);
    tl.log("merged list = [" + sim.merged.join(", ") + "]", ctx.C.green);
    tl.wait(0.7);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model.
 * ------------------------------------------------------------------ */

function simulate(a, b) {
  const frames = [];
  const merged = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    const pick = a[i] <= b[j] ? "a" : "b";
    if (pick === "a") {
      frames.push({ i, j, pick, value: a[i] });
      merged.push(a[i]);
      i++;
    } else {
      frames.push({ i, j, pick, value: b[j] });
      merged.push(b[j]);
      j++;
    }
  }
  const remaining = i < a.length ? "a" : (j < b.length ? "b" : null);
  const remA = a.slice(i);
  const remB = b.slice(j);
  while (i < a.length) merged.push(a[i++]);
  while (j < b.length) merged.push(b[j++]);
  return { frames, merged, remaining, remA, remB };
}
