/* Linked List Cycle — animated walkthrough scene (3Blue1Brown style).
 *
 * Floyd's tortoise-and-hare: `slow` advances one link and `fast` advances two.
 * If the list has a cycle the hare eventually laps the tortoise; if the hare
 * reaches None first, the list is acyclic. The cycle back-edge is drawn as an
 * arc from the tail to `pos`.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Linked List Cycle",
    subtitle: "Floyd's tortoise & hare · slow ×1, fast ×2 · O(n) time · O(1) space",
    inputs: [
      { id: "head", label: "head", type: "text", default: "3, 2, 0, -4", width: "wide" },
      { id: "pos", label: "pos", type: "number", default: 1, min: -1, max: 12 },
    ],
    legend: [
      { color: "#58C4DD", text: "slow (tortoise)" },
      { color: "#B58CD6", text: "fast (hare)" },
      { color: "#FC6255", text: "meeting node" },
      { color: "#F0AC5F", text: "cycle back-edge" },
    ],
  },

  code: [
    "def has_cycle(head: List[int], pos: int) -> bool:",
    "    node = build_cyclic_linked_list(head, pos)",
    "    slow = fast = node",
    "    while fast is not None and fast.next is not None:",
    "        slow = slow.next",
    "        fast = fast.next.next",
    "        if slow is fast:",
    "            return True",
    "    return False",
  ],

  read(values) {
    const raw = (values.head || "").trim();
    const pos = Number(values.pos);
    const nums = raw ? raw.split(/[\s,]+/).filter(Boolean).map(Number) : [];
    if (!nums.every(Number.isInteger) || nums.length > 9) return null;
    if (!Number.isInteger(pos) || pos < -1 || pos >= nums.length) return null;
    return { values: nums, pos };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0]) && Number.isInteger(args[1])) {
      const values = args[0].map(Number);
      const pos = args[1];
      if (values.length <= 9 && values.every(Number.isInteger) && pos >= -1 && pos < values.length) {
        return { head: values.join(", "), pos };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, setScaleAt, STAGE_W } = ctx;
    const { values, pos } = params;
    const sim = simulate(values, pos);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-purple", C.purple);
    ctx.glow("glow-red", C.red);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const arcsL = ctx.layer("arcs");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = {
      values, pos, sim, ctx, nodes: [], edges: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title -----------------------------------------------------------
    scene.title = txt("Linked List Cycle", {
      x: 64, y: 70, "font-size": 43, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    const sub = el("text", { x: 64, y: 105, "font-size": 21, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "head = ";
    el("tspan", { fill: C.white }, sub).textContent = "[" + values.join(", ") + "]";
    el("tspan", {}, sub).textContent = "     pos = ";
    el("tspan", { fill: pos >= 0 ? C.gold : C.grey }, sub).textContent =
      pos >= 0 ? String(pos) : "-1 (no cycle)";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- row geometry ----------------------------------------------------
    const rowY = 296;
    const nodeH = 76;
    const n = values.length;
    const gap = n > 7 ? 20 : 32;
    const nodeW = n ? clamp((920 - gap * (n - 1)) / n, 52, 104) : 104;
    const totalW = n ? n * nodeW + (n - 1) * gap : 0;
    const startX = STAGE_W / 2 - totalW / 2;
    const font = clamp(nodeW * 0.38, 16, 30);
    scene.rowY = rowY;
    scene.nodeH = nodeH;

    scene.rowLabel = txt("linked list", {
      x: 96, y: 192, "font-size": 18, fill: C.grey,
    }, textL);
    setOpacity(scene.rowLabel, 0);

    if (!n) {
      scene.emptyNode = txt("head = None", {
        x: STAGE_W / 2, y: rowY + nodeH / 2, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": 25, fill: C.grey,
      }, textL);
      setOpacity(scene.emptyNode, 0);
    }

    values.forEach((value, i) => {
      const x = startX + i * (nodeW + gap);
      const g = el("g", { transform: "translate(" + x + " " + rowY + ")" }, chipsL);
      const enter = el("g", {}, g);
      const scale = el("g", {}, enter);
      el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 12,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, scale);
      const idle = txt(String(value), {
        x: nodeW / 2, y: nodeH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": font, fill: C.white,
      }, scale);
      const blue = txt(String(value), {
        x: nodeW / 2, y: nodeH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": font, fill: C.blue,
      }, scale);
      const purple = txt(String(value), {
        x: nodeW / 2, y: nodeH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": font, fill: C.purple,
      }, scale);
      const red = txt(String(value), {
        x: nodeW / 2, y: nodeH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": font, fill: C.red,
      }, scale);
      setOpacity(blue, 0); setOpacity(purple, 0); setOpacity(red, 0);
      const ringBlue = el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 12, fill: "none",
        stroke: C.blue, "stroke-width": 3, filter: "url(#glow-blue)",
      }, scale);
      const ringPurple = el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 12, fill: "none",
        stroke: C.purple, "stroke-width": 3, filter: "url(#glow-purple)",
      }, scale);
      const ringRed = el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 12, fill: "none",
        stroke: C.red, "stroke-width": 3.5, filter: "url(#glow-red)",
      }, scale);
      setOpacity(ringBlue, 0); setOpacity(ringPurple, 0); setOpacity(ringRed, 0);
      txt(String(i), {
        x: nodeW / 2, y: -16, "text-anchor": "middle", "font-size": 14, fill: C.grey,
      }, enter);
      setOpacity(enter, 0);
      scene.nodes.push({
        i, value, g, enter, scale, idle, blue, purple, red,
        ringBlue, ringPurple, ringRed, x, cx: x + nodeW / 2, w: nodeW, h: nodeH,
      });
    });

    // -- forward edges ---------------------------------------------------
    const mkEdge = (from, to, color) => {
      const y = rowY + nodeH / 2;
      const x1 = from.x + nodeW, x2 = to.x;
      const g = el("g", {}, arcsL);
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
    for (let i = 0; i < n - 1; i++) scene.edges.push(mkEdge(scene.nodes[i], scene.nodes[i + 1], C.grey));

    // -- cycle back-edge -------------------------------------------------
    if (n && pos >= 0) {
      const tail = scene.nodes[n - 1], target = scene.nodes[pos];
      const y = rowY - 8;
      const dx = Math.abs(tail.cx - target.cx);
      const lift = clamp(90 + dx * 0.18, 90, 210);
      const path = el("path", {
        d: "M " + tail.cx + " " + y +
           " Q " + ((tail.cx + target.cx) / 2) + " " + (y - lift) +
           " " + target.cx + " " + y,
        fill: "none", stroke: C.gold, "stroke-width": 3.2,
        "stroke-linecap": "round", filter: "url(#glow-gold)",
      }, arcsL);
      const head = el("polygon", {
        points: (target.cx - 8) + "," + (y - 7) + " " +
                (target.cx + 8) + "," + (y - 7) + " " +
                target.cx + "," + (y + 8),
        fill: C.gold,
      }, arcsL);
      const label = txt("tail → pos " + pos, {
        x: (tail.cx + target.cx) / 2, y: y - lift * 0.55,
        "text-anchor": "middle", "font-size": 17, fill: C.gold,
      }, arcsL);
      scene.cycleArc = { path, head, label };
      setOpacity(path, 0);
      setOpacity(head, 0);
      setOpacity(label, 0);
    } else if (n) {
      scene.noneTail = txt("None", {
        x: scene.nodes[n - 1].x + nodeW + 20, y: rowY + nodeH / 2,
        "font-size": 19, fill: C.grey, "dominant-baseline": "central",
      }, textL);
      setOpacity(scene.noneTail, 0);
    }

    // -- pointers --------------------------------------------------------
    const mkPointer = (label, color, glow, labelDx) => {
      const g = el("g", {}, ptrL);
      setOpacity(g, 0);
      el("path", { d: "M -7 0 L 7 0 L 0 10 Z", fill: color, filter: "url(#" + glow + ")" }, g);
      txt(label, {
        x: labelDx || 0, y: -8, "text-anchor": "middle", "font-size": 16, fill: color,
      }, g);
      return g;
    };
    scene.ptrSlow = mkPointer("slow", C.blue, "glow-blue", -19);
    scene.ptrFast = mkPointer("fast", C.purple, "glow-purple", 19);
    scene.fastNone = txt("fast = None", {
      x: STAGE_W / 2, y: rowY + nodeH + 64, "text-anchor": "middle",
      "font-size": 19, fill: C.purple,
    }, textL);
    setOpacity(scene.fastNone, 0);

    // -- status + result -------------------------------------------------
    scene.status = txt("", {
      x: STAGE_W / 2, y: 502, "text-anchor": "middle", "font-size": 23, fill: C.gold,
    }, textL);
    setOpacity(scene.status, 0);

    scene.result = txt(sim.cycle ? "return True" : "return False", {
      x: STAGE_W / 2, y: 640, "text-anchor": "middle", "font-size": 36,
      fill: sim.cycle ? C.green : C.grey,
    }, resultL);
    const rule = el("line", {
      x1: STAGE_W / 2 - 150, y1: 662, x2: STAGE_W / 2 + 150, y2: 662,
      stroke: sim.cycle ? C.green : C.greyDark, "stroke-width": 4,
      "stroke-linecap": "round",
    }, resultL);
    const ruleLen = rule.getTotalLength();
    rule.setAttribute("stroke-dasharray", String(ruleLen));
    rule.setAttribute("stroke-dashoffset", String(ruleLen));
    scene.resultRule = rule;
    scene.ruleLen = ruleLen;

    // -- reset -----------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.rowLabel, scene.status, scene.fastNone]) setOpacity(node, 0);
      if (scene.emptyNode) setOpacity(scene.emptyNode, 0);
      if (scene.noneTail) setOpacity(scene.noneTail, 0);
      scene.status.textContent = "";
      for (const node of scene.nodes) {
        setOpacity(node.enter, 0);
        node.enter.setAttribute("transform", "translate(0 0)");
        setScaleAt(node.scale, node.w / 2, node.h / 2, 1);
        setOpacity(node.idle, 1);
        setOpacity(node.blue, 0);
        setOpacity(node.purple, 0);
        setOpacity(node.red, 0);
        setOpacity(node.ringBlue, 0);
        setOpacity(node.ringPurple, 0);
        setOpacity(node.ringRed, 0);
      }
      for (const e of scene.edges) setOpacity(e, 0);
      if (scene.cycleArc) {
        setOpacity(scene.cycleArc.path, 0);
        setOpacity(scene.cycleArc.head, 0);
        setOpacity(scene.cycleArc.label, 0);
        scene.cycleArc.path.setAttribute("stroke-width", "3.2");
        scene.cycleArc.label.setAttribute("fill", C.gold);
      }
      setOpacity(scene.ptrSlow, 0);
      setOpacity(scene.ptrFast, 0);
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt } = ctx;
    const { values, pos, sim, nodes } = scene;
    const rowY = scene.rowY, nodeH = scene.nodeH;

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
      tl.add(dur || 0.35, u => {
        setOpacity(ptr, 1);
        setTranslate(ptr, fx + (x - fx) * u, fy + (y - fy) * u);
      }, ease.inOutSine);
    };

    // -- intro -----------------------------------------------------------
    tl.line(1);
    tl.add(0.65, scene.writer(scene.title), ease.outCubic);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), ease.outCubic);
    tl.add(0.25, u => setOpacity(scene.rowLabel, u), ease.outCubic);
    if (scene.emptyNode) {
      tl.line(2);
      tl.add(0.4, u => setOpacity(scene.emptyNode, u), ease.outCubic);
      status("empty list   →   fast is None immediately", ctx.C.grey);
      tl.line(9);
      tl.add(0.6, scene.writer(scene.result), ease.linear);
      tl.add(0.35, u => scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u))), ease.outCubic);
      tl.wait(0.7);
      return tl.finish();
    }

    nodes.forEach(node => {
      tl.add(0.27, u => {
        setOpacity(node.enter, u);
        node.enter.setAttribute("transform", "translate(0 " + (1 - u) * 12 + ")");
        setScaleAt(node.scale, node.w / 2, node.h / 2, 0.86 + 0.14 * u);
      }, ease.outCubic);
    });
    tl.add(0.3, u => {
      for (const e of scene.edges) setOpacity(e, u);
      if (scene.noneTail) setOpacity(scene.noneTail, u);
    }, ease.outCubic);
    if (scene.cycleArc) {
      tl.add(0.45, u => {
        setOpacity(scene.cycleArc.path, u);
        setOpacity(scene.cycleArc.head, u);
        setOpacity(scene.cycleArc.label, u);
      }, ease.outCubic);
    }

    tl.line(2);
    status("build the chain" + (pos >= 0 ? " and wire tail.next to index " + pos : " with no cycle"), ctx.C.gold);
    tl.line(3);
    status("slow = fast = node   →   both start at the head", ctx.C.blue);
    tl.add(0.3, u => setOpacity(scene.status, u), ease.outCubic);
    movePtr(scene.ptrSlow, nodes[0].cx, rowY - 34, 0.35);
    movePtr(scene.ptrFast, nodes[0].cx, rowY - 34, 0.35);

    // -- Floyd's loop ----------------------------------------------------
    let prevSlow = 0, prevFast = 0;
    sim.frames.forEach((frame, fi) => {
      tl.line(4);
      status(
        "fast = " + (frame.fast === null ? "None" : nodes[frame.fast].value) +
        " and fast.next = " + (frame.fast === null || nextIndex(frame.fast, values.length, pos) === null
          ? "None" : nodes[nextIndex(frame.fast, values.length, pos)].value),
        ctx.C.purple
      );

      tl.line(5);
      const s = frame.slow;
      if (s !== null) {
        movePtr(scene.ptrSlow, nodes[s].cx, rowY - 34, 0.32);
        tl.add(0.25, u => {
          setOpacity(nodes[s].idle, 1 - u);
          setOpacity(nodes[s].blue, u);
          setOpacity(nodes[s].ringBlue, u);
        }, ease.outCubic);
      }
      tl.line(6);
      if (frame.fast !== null) {
        movePtr(scene.ptrFast, nodes[frame.fast].cx, rowY - 34, 0.4);
        tl.add(0.25, u => {
          setOpacity(nodes[frame.fast].purple, u);
          setOpacity(nodes[frame.fast].ringPurple, u);
        }, ease.outCubic);
      } else {
        tl.add(0.3, u => {
          setOpacity(scene.ptrFast, 1 - u);
          setOpacity(scene.fastNone, u);
        }, ease.outCubic);
      }
      status(
        "slow = slow.next = " + (s === null ? "None" : nodes[s].value) +
        "   ·   fast = fast.next.next = " + (frame.fast === null ? "None" : nodes[frame.fast].value),
        ctx.C.gold
      );

      tl.line(7);
      if (frame.meet) {
        status("slow is fast   →   the pointers met inside the cycle", ctx.C.red);
        tl.line(8);
        tl.add(0.35, u => {
          setOpacity(nodes[frame.slow].blue, 0);
          setOpacity(nodes[frame.slow].purple, 0);
          setOpacity(nodes[frame.slow].red, u);
          setOpacity(nodes[frame.slow].ringBlue, 0);
          setOpacity(nodes[frame.slow].ringPurple, 0);
          setOpacity(nodes[frame.slow].ringRed, u);
        }, ease.outCubic);
        tl.add(0.4, u => setScaleAt(nodes[frame.slow].scale, nodes[frame.slow].w / 2, nodes[frame.slow].h / 2,
          1 + 0.09 * Math.sin(Math.PI * u)), ease.linear);
        if (scene.cycleArc) {
          tl.add(0.4, u => {
            scene.cycleArc.path.setAttribute("stroke-width", String(3.2 + 2.5 * Math.sin(Math.PI * u)));
            scene.cycleArc.label.setAttribute("fill", ctx.C.red);
          }, ease.linear);
        }
        tl.line(8);
      } else {
        status("slow ≠ fast   →   keep running", ctx.C.grey);
      }

      // Clean up the previous highlights, but leave the meeting node red.
      tl.add(0.01, () => {
        if (!frame.meet) {
          if (prevSlow !== s && prevSlow !== null) {
            setOpacity(nodes[prevSlow].blue, 0);
            setOpacity(nodes[prevSlow].idle, 1);
            setOpacity(nodes[prevSlow].ringBlue, 0);
          }
          if (prevFast !== frame.fast && prevFast !== null) {
            setOpacity(nodes[prevFast].purple, 0);
            setOpacity(nodes[prevFast].idle, 1);
            setOpacity(nodes[prevFast].ringPurple, 0);
          }
        }
        prevSlow = s;
        prevFast = frame.fast;
      });
      tl.wait(0.12);
    });

    // -- no cycle / final -------------------------------------------------
    if (!sim.cycle) {
      tl.line(9);
      status("fast reached None   →   the list has no cycle", ctx.C.grey);
    }
    const fadeOut = (node, dur) => {
      const from = Number(node.style.opacity) || 0;
      tl.add(dur || 0.3, u => setOpacity(node, from * (1 - u)), ease.outCubic);
    };
    fadeOut(scene.status);
    fadeOut(scene.ptrSlow);
    fadeOut(scene.ptrFast);
    fadeOut(scene.fastNone);
    tl.add(0.6, scene.writer(scene.result), ease.linear);
    tl.add(0.4, u => scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u))), ease.outCubic);
    tl.log(sim.cycle ? "cycle detected → True" : "no cycle → False", sim.cycle ? ctx.C.green : ctx.C.grey);
    tl.wait(0.7);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model.
 * ------------------------------------------------------------------ */

function nextIndex(i, n, pos) {
  if (i === null || i < 0) return null;
  if (i < n - 1) return i + 1;
  return pos >= 0 ? pos : null;
}

function simulate(values, pos) {
  const n = values.length;
  if (!n) return { frames: [], cycle: false };
  let slow = 0, fast = 0;
  const frames = [];
  let guard = 0;
  while (fast !== null && nextIndex(fast, n, pos) !== null && guard++ < 40) {
    slow = nextIndex(slow, n, pos);
    const mid = nextIndex(fast, n, pos);
    fast = nextIndex(mid, n, pos);
    const meet = slow !== null && fast !== null && slow === fast;
    frames.push({ slow, fast, meet });
    if (meet) return { frames, cycle: true };
  }
  frames.push({ slow, fast: null, meet: false });
  return { frames, cycle: false };
}
