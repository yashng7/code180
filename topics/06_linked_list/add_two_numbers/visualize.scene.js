/* Add Two Numbers — animated walkthrough scene (3Blue1Brown style).
 *
 * The digits are stored least-significant first, so the two input chains are
 * added column by column from the head. `carry` is folded into each total,
 * `divmod` splits it into the output digit and the next carry, and the result
 * is appended to a new chain below.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Add Two Numbers",
    subtitle: "reverse-digit lists · carry left to right · O(max(n, m))",
    inputs: [
      { id: "l1", label: "list 1", type: "text", default: "2, 4, 3", width: "wide" },
      { id: "l2", label: "list 2", type: "text", default: "5, 6, 4", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "a (list 1)" },
      { color: "#B58CD6", text: "b (list 2)" },
      { color: "#F0AC5F", text: "carry" },
      { color: "#83C167", text: "sum digits" },
    ],
  },

  code: [
    "def add_two_numbers(l1: List[int], l2: List[int]) -> List[int]:",
    "    a = build_linked_list(l1)",
    "    b = build_linked_list(l2)",
    "    dummy = tail = ListNode()",
    "    carry = 0",
    "    while a is not None or b is not None or carry:",
    "        total = carry",
    "        if a is not None:",
    "            total += a.val",
    "            a = a.next",
    "        if b is not None:",
    "            total += b.val",
    "            b = b.next",
    "        carry, digit = divmod(total, 10)",
    "        tail.next = ListNode(digit)",
    "        tail = tail.next",
    "    return linked_list_to_list(dummy.next)",
  ],

  read(values) {
    const parse = raw => {
      raw = (raw || "").trim();
      if (!raw) return [];
      const nums = raw.split(/[\s,]+/).filter(Boolean).map(Number);
      return nums.every(v => Number.isInteger(v) && v >= 0 && v <= 9) ? nums : null;
    };
    const a = parse(values.l1), b = parse(values.l2);
    if (!a || !b) return null;
    if (a.length > 8 || b.length > 8) return null;
    return { a, b };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0]) && Array.isArray(args[1])) {
      const a = args[0].map(Number), b = args[1].map(Number);
      const ok = xs => xs.length <= 8 && xs.every(v => Number.isInteger(v) && v >= 0 && v <= 9);
      if (ok(a) && ok(b)) return { l1: a.join(", "), l2: b.join(", ") };
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
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const arcsL = ctx.layer("arcs");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = {
      a, b, sim, ctx, nodesA: [], nodesB: [], resultNodes: [], resultEdges: [],
      _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title -----------------------------------------------------------
    scene.title = txt("Add Two Numbers", {
      x: 64, y: 70, "font-size": 43, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    const sub = el("text", { x: 64, y: 105, "font-size": 21, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "l1 = ";
    el("tspan", { fill: C.blue }, sub).textContent = "[" + a.join(", ") + "]";
    el("tspan", {}, sub).textContent = "     l2 = ";
    el("tspan", { fill: C.purple }, sub).textContent = "[" + b.join(", ") + "]";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- layout ----------------------------------------------------------
    const nodeH = 60;
    const maxLen = Math.max(a.length, b.length, sim.result.length, 1);
    const gap = 22;
    const nodeW = clamp((820 - gap * (maxLen - 1)) / maxLen, 46, 86);
    const rowX = 278;
    const row1Y = 184, row2Y = 292, resultY = 452;
    const font = clamp(nodeW * 0.42, 15, 28);
    scene.row1Y = row1Y;
    scene.row2Y = row2Y;
    scene.nodeW = nodeW;
    scene.nodeH = nodeH;

    const label = (text, color, y) => {
      const t = txt(text, { x: 96, y: y + nodeH / 2 + 1, "font-size": 19, fill: color }, textL);
      setOpacity(t, 0);
      return t;
    };
    scene.labelA = label("a  (ones →)", C.blue, row1Y);
    scene.labelB = label("b  (ones →)", C.purple, row2Y);
    scene.labelR = label("sum", C.green, resultY);

    const mkNode = (value, x, top, color, parent, isResult) => {
      const g = el("g", { transform: "translate(" + x + " " + top + ")" }, parent);
      const enter = el("g", {}, g);
      const scale = el("g", {}, enter);
      el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 10,
        fill: isResult ? "#13261B" : C.chipFill,
        stroke: isResult ? C.green : C.greyDark,
        "stroke-width": 2,
      }, scale);
      const mk = fill => txt(String(value), {
        x: nodeW / 2, y: nodeH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": font, fill,
      }, scale);
      const idle = mk(isResult ? C.green : C.white);
      const hot = mk(color);
      setOpacity(hot, 0);
      const ring = el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 10, fill: "none",
        stroke: color, "stroke-width": 3.2,
        filter: "url(#" + (color === C.purple ? "glow-purple" : "glow-blue") + ")",
      }, scale);
      setOpacity(ring, 0);
      setOpacity(enter, 0);
      return {
        value, g, enter, scale, idle, hot, ring, x, top,
        cx: x + nodeW / 2, w: nodeW, h: nodeH,
      };
    };

    a.forEach((v, i) => scene.nodesA.push(mkNode(v, rowX + i * (nodeW + gap), row1Y, C.blue, chipsL, false)));
    b.forEach((v, i) => scene.nodesB.push(mkNode(v, rowX + i * (nodeW + gap), row2Y, C.purple, chipsL, false)));
    sim.result.forEach((v, i) => {
      const node = mkNode(v, rowX + i * (nodeW + gap), resultY, C.green, chipsL, true);
      scene.resultNodes.push(node);
      if (i > 0) {
        const prev = scene.resultNodes[i - 1];
        const y = resultY + nodeH / 2;
        const eg = el("g", {}, arcsL);
        el("line", {
          x1: prev.x + nodeW, y1: y, x2: node.x - 9, y2: y, stroke: C.green,
          "stroke-width": 2.7, "stroke-linecap": "round",
        }, eg);
        el("polygon", {
          points: (node.x - 9) + "," + (y - 7) + " " + (node.x - 9) + "," + (y + 7) + " " + node.x + "," + y,
          fill: C.green,
        }, eg);
        setOpacity(eg, 0);
        scene.resultEdges.push(eg);
      }
    });

    const mkEdge = (from, to, color) => {
      const y = from.top + nodeH / 2;
      const x1 = from.x + nodeW, x2 = to.x;
      const g = el("g", {}, arcsL);
      el("line", {
        x1, y1: y, x2: x2 - 9, y2: y, stroke: color, "stroke-width": 2.7,
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
    for (let i = 0; i < a.length - 1; i++) scene.edgesA.push(mkEdge(scene.nodesA[i], scene.nodesA[i + 1], C.blue));
    for (let i = 0; i < b.length - 1; i++) scene.edgesB.push(mkEdge(scene.nodesB[i], scene.nodesB[i + 1], C.purple));

    if (!a.length) {
      scene.emptyA = txt("None", {
        x: rowX + 12, y: row1Y + nodeH / 2, "font-size": 21, fill: C.grey,
        "dominant-baseline": "central",
      }, textL);
      setOpacity(scene.emptyA, 0);
    }
    if (!b.length) {
      scene.emptyB = txt("None", {
        x: rowX + 12, y: row2Y + nodeH / 2, "font-size": 21, fill: C.grey,
        "dominant-baseline": "central",
      }, textL);
      setOpacity(scene.emptyB, 0);
    }

    // -- pointers --------------------------------------------------------
    const mkPointer = (text, color, glow) => {
      const g = el("g", {}, ptrL);
      setOpacity(g, 0);
      el("path", { d: "M -7 0 L 7 0 L 0 10 Z", fill: color, filter: "url(#" + glow + ")" }, g);
      txt(text, { x: 0, y: -8, "text-anchor": "middle", "font-size": 16, fill: color }, g);
      return g;
    };
    scene.ptrA = mkPointer("a", C.blue, "glow-blue");
    scene.ptrB = mkPointer("b", C.purple, "glow-purple");

    // -- carry badge -----------------------------------------------------
    const carryX = 1080, carryY = 150;
    scene.carryBox = el("g", {}, chipsL);
    el("rect", {
      x: carryX - 66, y: carryY - 30, width: 132, height: 60, rx: 12,
      fill: "#262015", stroke: C.gold, "stroke-width": 2.2,
      filter: "url(#glow-gold)",
    }, scene.carryBox);
    txt("carry", {
      x: carryX, y: carryY - 12, "text-anchor": "middle", "font-size": 15, fill: C.gold,
    }, scene.carryBox);
    scene.carryText = txt("0", {
      x: carryX, y: carryY + 15, "text-anchor": "middle", "font-size": 25,
      fill: C.white, "dominant-baseline": "central",
    }, scene.carryBox);
    setOpacity(scene.carryBox, 0);

    // -- equation + status ----------------------------------------------
    scene.eq = txt("", {
      x: STAGE_W / 2, y: 528, "text-anchor": "middle", "font-size": 24, fill: C.white,
    }, textL);
    scene.status = txt("", {
      x: STAGE_W / 2, y: 568, "text-anchor": "middle", "font-size": 20, fill: C.gold,
    }, textL);
    setOpacity(scene.eq, 0);
    setOpacity(scene.status, 0);

    // -- result ----------------------------------------------------------
    scene.result = txt("return " + JSON.stringify(sim.result), {
      x: STAGE_W / 2, y: 646, "text-anchor": "middle", "font-size": 32, fill: C.green,
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
      for (const node of [scene.subtitle, scene.labelA, scene.labelB, scene.labelR,
                          scene.eq, scene.status, scene.carryBox]) setOpacity(node, 0);
      if (scene.emptyA) setOpacity(scene.emptyA, 0);
      if (scene.emptyB) setOpacity(scene.emptyB, 0);
      scene.eq.textContent = "";
      scene.status.textContent = "";
      scene.carryText.textContent = "0";
      for (const node of scene.nodesA.concat(scene.nodesB, scene.resultNodes)) {
        setOpacity(node.enter, 0);
        node.enter.setAttribute("transform", "translate(0 0)");
        setScaleAt(node.scale, node.w / 2, node.h / 2, 1);
        setOpacity(node.idle, 1);
        setOpacity(node.hot, 0);
        setOpacity(node.ring, 0);
      }
      for (const e of scene.edgesA.concat(scene.edgesB, scene.resultEdges)) setOpacity(e, 0);
      setOpacity(scene.ptrA, 0);
      setOpacity(scene.ptrB, 0);
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt } = ctx;
    const { a, b, sim } = scene;
    const { nodeW, nodeH } = scene;
    const row1Y = scene.row1Y, row2Y = scene.row2Y;

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
    for (const label of [scene.labelA, scene.labelB, scene.labelR]) {
      tl.add(0.22, u => setOpacity(label, u), ease.outCubic);
    }
    for (const node of scene.nodesA) {
      tl.add(0.28, u => {
        setOpacity(node.enter, u);
        node.enter.setAttribute("transform", "translate(0 " + (1 - u) * 12 + ")");
        setScaleAt(node.scale, node.w / 2, node.h / 2, 0.85 + 0.15 * u);
      }, ease.outCubic);
    }
    for (const e of scene.edgesA) tl.add(0.12, u => setOpacity(e, u), ease.outCubic);
    for (const node of scene.nodesB) {
      tl.add(0.28, u => {
        setOpacity(node.enter, u);
        node.enter.setAttribute("transform", "translate(0 " + (1 - u) * 12 + ")");
        setScaleAt(node.scale, node.w / 2, node.h / 2, 0.85 + 0.15 * u);
      }, ease.outCubic);
    }
    for (const e of scene.edgesB) tl.add(0.12, u => setOpacity(e, u), ease.outCubic);
    if (scene.emptyA) tl.add(0.25, u => setOpacity(scene.emptyA, u), ease.outCubic);
    if (scene.emptyB) tl.add(0.25, u => setOpacity(scene.emptyB, u), ease.outCubic);

    tl.line([2, 3, 4]);
    status("build both lists; dummy/tail start a fresh result chain", ctx.C.gold);
    tl.add(0.3, u => setOpacity(scene.status, u), ease.outCubic);
    tl.line(5);
    tl.add(0.3, u => setOpacity(scene.carryBox, u), ease.outCubic);
    if (a.length) movePtr(scene.ptrA, scene.nodesA[0].cx, row1Y - 24, 0.3);
    if (b.length) movePtr(scene.ptrB, scene.nodesB[0].cx, row2Y - 24, 0.3);

    // -- column by column ------------------------------------------------
    sim.frames.forEach((frame, fi) => {
      const na = frame.av === null ? null : scene.nodesA[frame.i];
      const nb = frame.bv === null ? null : scene.nodesB[frame.j];
      const out = scene.resultNodes[fi];

      tl.line(6);
      status(
        "column " + (fi + 1) + ": a = " + (frame.av === null ? "None" : frame.av) +
        ", b = " + (frame.bv === null ? "None" : frame.bv) +
        ", carry = " + frame.carryBefore,
        ctx.C.gold
      );
      tl.line(7);
      tl.add(0.01, () => {
        scene.eq.textContent = "total = carry + a.val + b.val = " +
          frame.carryBefore + " + " + (frame.av === null ? 0 : frame.av) +
          " + " + (frame.bv === null ? 0 : frame.bv) + " = " + frame.total;
        scene.eq.setAttribute("fill", ctx.C.white);
      });
      tl.add(0.35, u => setOpacity(scene.eq, u), ease.outCubic);

      // highlight both current digits
      tl.line([8, 9, 10, 11, 12, 13]);
      tl.add(0.3, u => {
        if (na) {
          setOpacity(na.idle, 1 - u);
          setOpacity(na.hot, u);
          setOpacity(na.ring, u);
        }
        if (nb) {
          setOpacity(nb.idle, 1 - u);
          setOpacity(nb.hot, u);
          setOpacity(nb.ring, u);
        }
      }, ease.outCubic);

      tl.line(14);
      status(
        "divmod(" + frame.total + ", 10)   →   digit = " + frame.digit +
        ", carry = " + frame.carryAfter,
        ctx.C.gold
      );
      tl.add(0.3, u => {
        scene.carryText.textContent = String(frame.carryAfter);
        scene.carryText.setAttribute("fill", frame.carryAfter ? ctx.C.gold : ctx.C.white);
        setScaleAt(scene.carryText, 1080, 165, 1 + 0.18 * Math.sin(Math.PI * u));
      }, ease.linear);

      tl.line(15);
      tl.add(0.35, u => {
        setOpacity(out.enter, Math.min(1, u * 2.2));
        out.enter.setAttribute("transform", "translate(0 " + (1 - u) * 12 + ")");
        setScaleAt(out.scale, nodeW / 2, nodeH / 2, 0.84 + 0.16 * u);
      }, ease.outCubic);
      if (fi > 0) tl.add(0.2, u => setOpacity(scene.resultEdges[fi - 1], u), ease.outCubic);
      tl.line(16);
      status("tail = tail.next   →   output digit " + frame.digit + " appended", ctx.C.green);

      // advance a and b
      tl.add(0.01, () => {
        if (na) {
          setOpacity(na.hot, 0);
          setOpacity(na.ring, 0);
          setOpacity(na.idle, 1);
        }
        if (nb) {
          setOpacity(nb.hot, 0);
          setOpacity(nb.ring, 0);
          setOpacity(nb.idle, 1);
        }
      });
      const nextA = frame.i + 1;
      const nextB = frame.j + 1;
      if (na) {
        if (nextA < a.length) movePtr(scene.ptrA, scene.nodesA[nextA].cx, row1Y - 24, 0.25);
        else tl.add(0.2, u => setOpacity(scene.ptrA, 1 - u), ease.outCubic);
      }
      if (nb) {
        if (nextB < b.length) movePtr(scene.ptrB, scene.nodesB[nextB].cx, row2Y - 24, 0.25);
        else tl.add(0.2, u => setOpacity(scene.ptrB, 1 - u), ease.outCubic);
      }
      tl.wait(0.1);
    });

    // -- return ----------------------------------------------------------
    tl.line(17);
    status("carry is 0 and both lists are exhausted   →   return dummy.next", ctx.C.green);
    const fadeOut = (node, dur) => {
      const from = Number(node.style.opacity) || 0;
      tl.add(dur || 0.25, u => setOpacity(node, from * (1 - u)), ease.outCubic);
    };
    fadeOut(scene.eq);
    fadeOut(scene.status);
    fadeOut(scene.carryBox);
    fadeOut(scene.ptrA);
    fadeOut(scene.ptrB);
    tl.add(0.6, scene.writer(scene.result), ease.linear);
    tl.add(0.4, u => scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u))), ease.outCubic);
    tl.log("sum = [" + sim.result.join(", ") + "]", ctx.C.green);
    tl.wait(0.7);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model.
 * ------------------------------------------------------------------ */

function simulate(a, b) {
  const frames = [];
  const result = [];
  let i = 0, j = 0, carry = 0;
  while (i < a.length || j < b.length || carry) {
    const av = i < a.length ? a[i] : null;
    const bv = j < b.length ? b[j] : null;
    const total = carry + (av === null ? 0 : av) + (bv === null ? 0 : bv);
    const digit = total % 10;
    const carryAfter = Math.floor(total / 10);
    frames.push({ i, j, av, bv, carryBefore: carry, total, digit, carryAfter });
    result.push(digit);
    carry = carryAfter;
    if (av !== null) i++;
    if (bv !== null) j++;
  }
  return { frames, result };
}
