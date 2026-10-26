/* Reverse Linked List — animated walkthrough scene (3Blue1Brown style).
 *
 * The list is drawn as a row of nodes. The iterative algorithm walks `node`
 * from left to right, flipping the next pointer behind it. Reversed links are
 * shown underneath the row so the old and new directions can be compared.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Reverse Linked List",
    subtitle: "prev / node / next · flip each next pointer · O(n) time · O(1) space",
    inputs: [
      { id: "head", label: "head", type: "text", default: "1, 2, 3, 4, 5", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "node (current)" },
      { color: "#83C167", text: "prev (reversed prefix)" },
      { color: "#F0AC5F", text: "reversed next pointer" },
    ],
  },

  code: [
    "def reverse_list(head: List[int]) -> List[int]:",
    "    node = build_linked_list(head)",
    "    prev = None",
    "    while node is not None:",
    "        node.next, prev, node = prev, node, node.next",
    "    return linked_list_to_list(prev)",
  ],

  read(values) {
    const raw = (values.head || "").trim();
    if (!raw) return { values: [] };
    const nums = raw.split(/[\s,]+/).filter(Boolean).map(Number);
    if (nums.length > 10 || !nums.every(Number.isInteger)) return null;
    return { values: nums };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const values = args[0].map(Number);
      if (values.length <= 10 && values.every(Number.isInteger)) {
        return { head: values.join(", ") };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, setScaleAt, STAGE_W } = ctx;
    const values = params.values;
    const n = values.length;
    const sim = simulate(values);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-teal", C.teal);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const arcsL = ctx.layer("arcs");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = {
      values, sim, ctx, nodes: [], edges: [], revEdges: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title -----------------------------------------------------------
    scene.title = txt("Reverse Linked List", {
      x: 64, y: 72, "font-size": 44, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    const sub = el("text", { x: 64, y: 108, "font-size": 21, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "head = ";
    el("tspan", { fill: C.white }, sub).textContent = "[" + values.join(", ") + "]";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- row label -------------------------------------------------------
    scene.rowLabel = txt("linked list", {
      x: 96, y: 184, "font-size": 18, fill: C.grey,
    }, textL);
    setOpacity(scene.rowLabel, 0);

    // -- node row --------------------------------------------------------
    const rowY = 250;
    const nodeH = 76;
    const gap = n > 7 ? 22 : 34;
    const nodeW = n ? clamp((960 - gap * (n - 1)) / n, 58, 108) : 108;
    const totalW = n ? n * nodeW + (n - 1) * gap : 0;
    const startX = STAGE_W / 2 - totalW / 2;
    const fontSize = clamp(nodeW * 0.38, 17, 31);
    scene.rowY = rowY;
    scene.nodeH = nodeH;

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
      const cx = nodeW / 2, cy = nodeH / 2;
      const rect = el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 12,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, scale);
      const mk = fill => txt(String(value), {
        x: cx, y: cy + 1, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": fontSize, fill,
      }, scale);
      const idle = mk(C.white), blue = mk(C.blue), green = mk(C.green), gold = mk(C.gold);
      setOpacity(blue, 0);
      setOpacity(green, 0);
      setOpacity(gold, 0);
      const ringBlue = el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 12, fill: "none",
        stroke: C.blue, "stroke-width": 3.5, filter: "url(#glow-blue)",
      }, scale);
      const ringGreen = el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 12, fill: "none",
        stroke: C.green, "stroke-width": 3.5, filter: "url(#glow-green)",
      }, scale);
      setOpacity(ringBlue, 0);
      setOpacity(ringGreen, 0);
      txt(String(i), {
        x: cx, y: -17, "text-anchor": "middle", "font-size": 14, fill: C.grey,
      }, enter);
      setOpacity(enter, 0);
      scene.nodes.push({
        i, value, g, enter, scale, rect, idle, blue, green, gold,
        ringBlue, ringGreen, x, cx: x + cx, cy: rowY + cy, w: nodeW, h: nodeH,
      });
    });

    // -- original forward edges ------------------------------------------
    for (let i = 0; i < n - 1; i++) {
      const a = scene.nodes[i], b = scene.nodes[i + 1];
      const y = rowY + nodeH / 2;
      const x1 = a.x + nodeW;
      const x2 = b.x;
      const g = el("g", {}, arcsL);
      const line = el("line", {
        x1, y1: y, x2: x2 - 10, y2: y, stroke: C.grey, "stroke-width": 3,
        "stroke-linecap": "round",
      }, g);
      const head = el("polygon", {
        points: (x2 - 10) + "," + (y - 8) + " " + (x2 - 10) + "," + (y + 8) + " " + x2 + "," + y,
        fill: C.grey,
      }, g);
      setOpacity(g, 0);
      scene.edges.push({ g, line, head });
    }

    // -- reversed edges (drawn beneath the row) --------------------------
    for (let i = 0; i < n - 1; i++) {
      const a = scene.nodes[i], b = scene.nodes[i + 1];
      const y = rowY + nodeH + 32;
      const g = el("g", {}, arcsL);
      const line = el("line", {
        x1: b.cx, y1: y, x2: a.cx + 10, y2: y, stroke: C.gold, "stroke-width": 3.2,
        "stroke-linecap": "round", filter: "url(#glow-gold)",
      }, g);
      const head = el("polygon", {
        points: (a.cx + 10) + "," + (y - 8) + " " + (a.cx + 10) + "," + (y + 8) + " " + a.cx + "," + y,
        fill: C.gold,
      }, g);
      setOpacity(g, 0);
      scene.revEdges.push({ g, line, head });
    }

    // -- prev / node pointers -------------------------------------------
    const mkPointer = (label, color, glow) => {
      const g = el("g", {}, ptrL);
      setOpacity(g, 0);
      el("path", {
        d: "M -8 0 L 8 0 L 0 12 Z", fill: color, filter: "url(#" + glow + ")",
      }, g);
      txt(label, {
        x: 0, y: -9, "text-anchor": "middle", "font-size": 17, fill: color,
      }, g);
      return g;
    };
    scene.nodePtr = mkPointer("node", C.blue, "glow-blue");
    scene.prevPtr = mkPointer("prev", C.green, "glow-green");
    scene.nullPrev = txt("prev = None", {
      x: STAGE_W / 2, y: rowY + nodeH + 64, "text-anchor": "middle",
      "font-size": 18, fill: C.green,
    }, textL);
    setOpacity(scene.nullPrev, 0);

    // -- dynamic narration + result -------------------------------------
    scene.status = txt("", {
      x: STAGE_W / 2, y: 490, "text-anchor": "middle", "font-size": 23, fill: C.gold,
    }, textL);
    setOpacity(scene.status, 0);

    scene.result = txt("return " + JSON.stringify(sim.finalValues), {
      x: STAGE_W / 2, y: 648, "text-anchor": "middle", "font-size": 34, fill: C.green,
    }, resultL);
    const rule = el("line", {
      x1: STAGE_W / 2 - 170, y1: 670, x2: STAGE_W / 2 + 170, y2: 670,
      stroke: C.green, "stroke-width": 4, "stroke-linecap": "round",
    }, resultL);
    const ruleLen = rule.getTotalLength();
    rule.setAttribute("stroke-dasharray", String(ruleLen));
    rule.setAttribute("stroke-dashoffset", String(ruleLen));
    scene.resultRule = rule;
    scene.ruleLen = ruleLen;

    // -- baseline --------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.rowLabel, 0);
      setOpacity(scene.nodePtr, 0);
      setOpacity(scene.prevPtr, 0);
      setOpacity(scene.nullPrev, 0);
      setOpacity(scene.status, 0);
      scene.status.textContent = "";
      if (scene.emptyNode) setOpacity(scene.emptyNode, 0);
      for (const node of scene.nodes) {
        setOpacity(node.enter, 0);
        node.enter.setAttribute("transform", "translate(0 0)");
        setScaleAt(node.scale, node.w / 2, node.h / 2, 1);
        setOpacity(node.idle, 1);
        setOpacity(node.blue, 0);
        setOpacity(node.green, 0);
        setOpacity(node.gold, 0);
        setOpacity(node.ringBlue, 0);
        setOpacity(node.ringGreen, 0);
      }
      for (const e of scene.edges) setOpacity(e.g, 0);
      for (const e of scene.revEdges) setOpacity(e.g, 0);
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
      if (scene.nodes[0]) {
        setTranslate(scene.nodePtr, scene.nodes[0].cx, rowY - 28);
      }
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt } = ctx;
    const { values, sim, nodes } = scene;
    const rowY = scene.rowY, nodeH = scene.nodeH;

    scene.reset();

    const status = (text, color) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || ctx.C.gold);
      });
      tl.log(text, color || ctx.C.gold);
    };

    const movePointer = (ptr, x, y, dur) => {
      tl.add(dur || 0.35, u => {
        setOpacity(ptr, 1);
        const curX = Number((/translate\(([-\d.]+)/.exec(ptr.getAttribute("transform") || "translate(0 0)") || [0, 0])[1]);
        setTranslate(ptr, curX + (x - curX) * u, y);
      }, ease.inOutSine);
    };

    // -- intro -----------------------------------------------------------
    tl.line(1);
    tl.add(0.7, scene.writer(scene.title), ease.outCubic);
    tl.add(0.4, u => setOpacity(scene.subtitle, u), ease.outCubic);
    tl.add(0.35, u => setOpacity(scene.rowLabel, u), ease.outCubic);
    if (scene.emptyNode) {
      tl.line(2);
      tl.add(0.5, u => setOpacity(scene.emptyNode, u), ease.outCubic);
      status("empty list: there is nothing to reverse", ctx.C.grey);
      tl.line(6);
      tl.add(0.6, scene.writer(scene.result), ease.linear);
      tl.add(0.4, u => scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u))), ease.outCubic);
      tl.wait(0.8);
      return tl.finish();
    }

    nodes.forEach((node, i) => {
      tl.add(0.36, u => {
        setOpacity(node.enter, u);
        node.enter.setAttribute("transform", "translate(0 " + (1 - u) * 16 + ")");
        setScaleAt(node.scale, node.w / 2, node.h / 2, 1 - 0.18 * (1 - u));
      }, ease.outCubic);
      tl.wait(0.05);
    });
    tl.add(0.4, u => {
      for (const e of scene.edges) setOpacity(e.g, u);
    }, ease.outCubic);
    status("start with prev = None; node points at the head", ctx.C.blue);
    tl.add(0.3, u => setOpacity(scene.status, u), ease.outCubic);

    tl.line(2);
    status("node = build_linked_list(head)", ctx.C.blue);
    tl.line(3);
    status("prev = None   (the reversed prefix starts empty)", ctx.C.green);
    tl.add(0.35, u => setOpacity(scene.nullPrev, u), ease.outCubic);
    movePointer(scene.nodePtr, nodes[0].cx, rowY - 28, 0.4);
    tl.wait(0.2);

    // -- walk the list ---------------------------------------------------
    let prevIndex = null;
    sim.frames.forEach((frame, fi) => {
      const cur = nodes[frame.cur];
      const prev = frame.prev === null ? null : nodes[frame.prev];

      tl.line(4);
      status(
        "while node is not None: node = " + cur.value +
        (prev ? "   ·   prev = " + prev.value : "   ·   prev = None"),
        ctx.C.blue
      );

      // Light the current node and move the node pointer to it.
      tl.add(0.35, u => {
        setOpacity(cur.idle, 1 - u);
        setOpacity(cur.blue, u);
        setOpacity(cur.ringBlue, u);
        if (prev) {
          setOpacity(prev.ringGreen, u);
          setOpacity(prev.blue, 0);
          setOpacity(prev.green, u);
        }
      }, ease.outCubic);
      movePointer(scene.nodePtr, cur.cx, rowY - 28, 0.35);
      if (prev) movePointer(scene.prevPtr, prev.cx, rowY + nodeH + 8, 0.35);

      // The assignment flips one edge.
      tl.line(5);
      if (frame.cur > 0) {
        const edge = scene.edges[frame.cur - 1];
        const rev = scene.revEdges[frame.cur - 1];
        tl.add(0.45, u => {
          setOpacity(edge.g, 1 - u);
          setOpacity(rev.g, u);
          setOpacity(rev.line, u);
        }, ease.outCubic);
        status("node.next = prev   →   " + cur.value + " now points back to " + nodes[frame.cur - 1].value, ctx.C.gold);
      } else {
        status("node.next = prev   →   " + cur.value + " becomes the new tail", ctx.C.gold);
      }
      tl.add(0.4, u => setScaleAt(cur.scale, cur.w / 2, cur.h / 2, 1 + 0.05 * Math.sin(Math.PI * u)), ease.linear);

      prevIndex = frame.cur;
      tl.add(0.01, () => {
        setOpacity(scene.nullPrev, 0);
        if (prev) {
          setOpacity(prev.ringBlue, 0);
          setOpacity(prev.blue, 0);
          setOpacity(prev.green, 1);
          setOpacity(prev.ringGreen, 1);
        }
        setOpacity(cur.blue, 1);
        setOpacity(cur.ringBlue, 1);
      });
      if (frame.next !== null) {
        movePointer(scene.nodePtr, nodes[frame.next].cx, rowY - 28, 0.35);
      } else {
        tl.add(0.35, u => setOpacity(scene.nodePtr, 1 - u), ease.outCubic);
      }
      if (prev) movePointer(scene.prevPtr, cur.cx, rowY + nodeH + 8, 0.35);
      tl.wait(0.1);
    });

    // -- final state -----------------------------------------------------
    tl.line(6);
    status("node is None   →   prev is the new head", ctx.C.green);
    tl.add(0.35, u => setOpacity(scene.status, 1 - u), ease.outCubic);
    if (nodes.length) {
      const last = nodes[nodes.length - 1];
      tl.add(0.3, u => setOpacity(scene.nodePtr, 1 - u), ease.outCubic);
      tl.add(0.3, u => setOpacity(scene.prevPtr, 1 - u), ease.outCubic);
      tl.add(0.45, u => {
        for (const node of nodes) {
          setOpacity(node.blue, 0);
          setOpacity(node.green, u);
          setOpacity(node.ringBlue, 0);
          setOpacity(node.ringGreen, 0);
        }
        for (const e of scene.revEdges) setOpacity(e.g, 1);
      }, ease.outCubic);
    }
    tl.add(0.65, scene.writer(scene.result), ease.linear);
    tl.add(0.4, u => {
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u)));
    }, ease.outCubic);
    tl.log("reversed list = [" + sim.finalValues.join(", ") + "]", ctx.C.green);
    tl.wait(0.8);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model.
 * ------------------------------------------------------------------ */

function simulate(values) {
  const n = values.length;
  const frames = [];
  let node = n ? 0 : null;
  let prev = null;
  while (node !== null) {
    const next = node + 1 < n ? node + 1 : null;
    frames.push({ cur: node, prev, next });
    prev = node;
    node = next;
  }
  return { frames, finalValues: values.slice().reverse() };
}
