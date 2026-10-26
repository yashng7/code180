/* Copy List With Random Pointer — animated walkthrough scene.
 *
 * The input is a list of [value, random_index] pairs. The original chain is
 * drawn on top with its random arcs. A matching copy chain is created below,
 * then every next and random link is replicated through the old→new map.
 * Finally the copy is serialized back to the pair format.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Copy List With Random Pointer",
    subtitle: "old → new map · replicate next + random · O(n) time · O(n) space",
    inputs: [
      {
        id: "nodes", label: "pairs (value:random)", type: "text",
        default: "7:null, 13:0, 11:4, 10:2, 1:0", width: "wide",
      },
    ],
    legend: [
      { color: "#58C4DD", text: "original next" },
      { color: "#B58CD6", text: "original random" },
      { color: "#83C167", text: "copy next" },
      { color: "#F0AC5F", text: "copy random" },
    ],
  },

  code: [
    "def copy_random_list(nodes: List[List[Optional[int]]]) -> List[List[Optional[int]]]:",
    "    if not nodes:",
    "        return []",
    "    originals = [ListNode(val) for val, _ in nodes]",
    "    for i in range(len(originals) - 1):",
    "        originals[i].next = originals[i + 1]",
    "    for i, (_, random_index) in enumerate(nodes):",
    "        originals[i].random = originals[random_index] if random_index is not None else None",
    "    old_to_new = {node: ListNode(node.val) for node in originals}",
    "    for node in originals:",
    "        new_node = old_to_new[node]",
    "        new_node.next = old_to_new.get(node.next)",
    "        new_node.random = old_to_new.get(node.random)",
    "    index_of = {}",
    "    node = old_to_new[originals[0]]",
    "    position = 0",
    "    while node is not None:",
    "        index_of[node] = position",
    "        node = node.next",
    "        position += 1",
    "    output: List[List[Optional[int]]] = []",
    "    node = old_to_new[originals[0]]",
    "    while node is not None:",
    "        output.append(",
    "            [node.val, index_of[node.random] if node.random is not None else None]",
    "        )",
    "        node = node.next",
    "    return output",
  ],

  read(values) {
    const raw = (values.nodes || "").trim();
    if (!raw) return { pairs: [] };
    const pairs = [];
    const re = /(-?\d+)\s*:\s*(null|none|nil|-?\d+)/gi;
    let m, consumed = 0;
    while ((m = re.exec(raw)) !== null) {
      const between = raw.slice(consumed, m.index).replace(/[\s,;]+/g, "");
      if (between) return null;
      const value = Number(m[1]);
      const r = /^(null|none|nil)$/i.test(m[2]) ? null : Number(m[2]);
      if (!Number.isInteger(value)) return null;
      if (r !== null && !Number.isInteger(r)) return null;
      pairs.push([value, r]);
      consumed = re.lastIndex;
    }
    if (raw.slice(consumed).replace(/[\s,;]+/g, "")) return null;
    if (pairs.length > 6) return null;
    for (const [, r] of pairs) if (r !== null && (r < 0 || r >= pairs.length)) return null;
    return { pairs };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const pairs = args[0];
      if (pairs.length > 6) return null;
      const out = [];
      for (const p of pairs) {
        if (!Array.isArray(p) || p.length < 2) return null;
        const v = Number(p[0]);
        const r = p[1] === null || p[1] === undefined ? null : Number(p[1]);
        if (!Number.isInteger(v)) return null;
        if (r !== null && (!Number.isInteger(r) || r < 0 || r >= pairs.length)) return null;
        out.push([v, r]);
      }
      return { nodes: out.map(([v, r]) => v + ":" + (r === null ? "null" : r)).join(", ") };
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, setScaleAt, STAGE_W } = ctx;
    const { pairs } = params;
    const sim = simulate(pairs);

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
      pairs, sim, ctx, origNodes: [], copyNodes: [], origEdges: [], copyEdges: [],
      origArcs: [], copyArcs: [], outputChips: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title -----------------------------------------------------------
    scene.title = txt("Copy List With Random Pointer", {
      x: 64, y: 66, "font-size": 37, fill: C.white, "letter-spacing": 0.3,
    }, textL);
    const sub = el("text", { x: 64, y: 99, "font-size": 19, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "nodes = ";
    el("tspan", { fill: C.white }, sub).textContent =
      "[" + pairs.map(([v, r]) => "[" + v + ", " + (r === null ? "null" : r) + "]").join(", ") + "]";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- geometry --------------------------------------------------------
    const n = pairs.length;
    const nodeH = 74;
    const gap = n > 4 ? 22 : 34;
    const nodeW = n ? clamp((860 - gap * (n - 1)) / n, 64, 106) : 106;
    const rowX = n ? STAGE_W / 2 - (n * nodeW + (n - 1) * gap) / 2 : STAGE_W / 2;
    const origY = 210, copyY = 410;
    const font = clamp(nodeW * 0.36, 15, 27);
    scene.origY = origY;
    scene.copyY = copyY;
    scene.nodeW = nodeW;
    scene.nodeH = nodeH;

    const rowLabel = (text, color, y) => {
      const t = txt(text, { x: 92, y: y + nodeH / 2 + 1, "font-size": 18, fill: color }, textL);
      setOpacity(t, 0);
      return t;
    };
    scene.labelOrig = rowLabel("original", C.blue, origY);
    scene.labelCopy = rowLabel("copy (old → new)", C.green, copyY);

    const mkNode = (value, random, i, x, top, color, isCopy) => {
      const g = el("g", { transform: "translate(" + x + " " + top + ")" }, chipsL);
      const enter = el("g", {}, g);
      const scale = el("g", {}, enter);
      el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 11,
        fill: isCopy ? "#13261B" : C.chipFill,
        stroke: isCopy ? C.green : C.greyDark,
        "stroke-width": 2,
      }, scale);
      const mk = fill => txt(String(value), {
        x: nodeW / 2, y: nodeH / 2 + 2, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": font, fill,
      }, scale);
      const idle = mk(isCopy ? C.green : C.white);
      const hot = mk(color);
      setOpacity(hot, 0);
      const ring = el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 11, fill: "none",
        stroke: color, "stroke-width": 3,
        filter: "url(#" + (isCopy ? "glow-green" : "glow-blue") + ")",
      }, scale);
      setOpacity(ring, 0);
      const idx = txt("i=" + i, {
        x: 10, y: 15, "font-size": 11, fill: C.grey,
      }, scale);
      const rTxt = txt("r=" + (random === null ? "∅" : random), {
        x: nodeW / 2, y: nodeH - 12, "text-anchor": "middle",
        "font-size": clamp(nodeW * 0.15, 9, 14), fill: isCopy ? C.gold : C.purple,
      }, scale);
      setOpacity(enter, 0);
      return {
        i, value, random, g, enter, scale, idle, hot, ring, idx, rTxt,
        x, cx: x + nodeW / 2, top, w: nodeW, h: nodeH, isCopy,
      };
    };

    pairs.forEach(([v, r], i) => {
      scene.origNodes.push(mkNode(v, r, i, rowX + i * (nodeW + gap), origY, C.blue, false));
      scene.copyNodes.push(mkNode(v, r, i, rowX + i * (nodeW + gap), copyY, C.green, true));
    });

    if (!n) {
      scene.empty = txt("empty list   →   return []", {
        x: STAGE_W / 2, y: origY + nodeH / 2, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": 23, fill: C.grey,
      }, textL);
      setOpacity(scene.empty, 0);
    }

    // -- horizontal next edges ------------------------------------------
    const mkEdge = (from, to, color) => {
      const y = from.top + nodeH / 2;
      const x1 = from.x + nodeW, x2 = to.x;
      const g = el("g", {}, arcsL);
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
    for (let i = 0; i < n - 1; i++) {
      scene.origEdges.push(mkEdge(scene.origNodes[i], scene.origNodes[i + 1], C.blue));
      scene.copyEdges.push(mkEdge(scene.copyNodes[i], scene.copyNodes[i + 1], C.green));
    }

    // -- random arcs -----------------------------------------------------
    const mkArc = (from, to, color, above, glow) => {
      const y = above ? from.top : from.top + nodeH;
      const ty = above ? to.top : to.top + nodeH;
      const dx = Math.abs(to.cx - from.cx);
      const lift = (above ? -1 : 1) * (58 + Math.min(100, dx * 0.16));
      const midY = (y + ty) / 2 + lift;
      const g = el("g", {}, arcsL);
      const path = el("path", {
        d: "M " + from.cx + " " + y +
           " Q " + ((from.cx + to.cx) / 2) + " " + midY +
           " " + to.cx + " " + ty,
        fill: "none", stroke: color, "stroke-width": 2.3,
        "stroke-linecap": "round", filter: "url(#" + glow + ")",
      }, g);
      const tipY = above ? ty - 1 : ty + 1;
      const baseY = above ? ty - 12 : ty + 12;
      el("polygon", {
        points: (to.cx - 6.5) + "," + baseY + " " + (to.cx + 6.5) + "," + baseY +
                " " + to.cx + "," + tipY,
        fill: color,
      }, g);
      setOpacity(g, 0);
      return g;
    };
    for (let i = 0; i < n; i++) {
      const r = pairs[i][1];
      if (r === null) {
        scene.origArcs.push(null);
        scene.copyArcs.push(null);
      } else {
        scene.origArcs.push(mkArc(scene.origNodes[i], scene.origNodes[r], C.purple, true, "glow-purple"));
        scene.copyArcs.push(mkArc(scene.copyNodes[i], scene.copyNodes[r], C.gold, false, "glow-gold"));
      }
    }

    // -- scan pointer + status ------------------------------------------
    scene.scanPtr = el("g", {}, ptrL);
    setOpacity(scene.scanPtr, 0);
    el("path", { d: "M -7 0 L 7 0 L 0 10 Z", fill: C.gold, filter: "url(#glow-gold)" }, scene.scanPtr);
    txt("node", { x: 0, y: -8, "text-anchor": "middle", "font-size": 15, fill: C.gold }, scene.scanPtr);

    scene.status = txt("", {
      x: STAGE_W / 2, y: 548, "text-anchor": "middle", "font-size": 20, fill: C.gold,
    }, textL);
    scene.outputLine = txt("", {
      x: STAGE_W / 2, y: 590, "text-anchor": "middle", "font-size": 18, fill: C.teal,
    }, textL);
    setOpacity(scene.status, 0);
    setOpacity(scene.outputLine, 0);

    // -- result ----------------------------------------------------------
    scene.result = txt("return " + JSON.stringify(sim.output), {
      x: STAGE_W / 2, y: 658, "text-anchor": "middle", "font-size": 20, fill: C.green,
    }, resultL);
    const rule = el("line", {
      x1: STAGE_W / 2 - 320, y1: 680, x2: STAGE_W / 2 + 320, y2: 680,
      stroke: C.green, "stroke-width": 3.5, "stroke-linecap": "round",
    }, resultL);
    const ruleLen = rule.getTotalLength();
    rule.setAttribute("stroke-dasharray", String(ruleLen));
    rule.setAttribute("stroke-dashoffset", String(ruleLen));
    scene.resultRule = rule;
    scene.ruleLen = ruleLen;

    // -- reset -----------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.labelOrig, scene.labelCopy, scene.status, scene.outputLine]) setOpacity(node, 0);
      if (scene.empty) setOpacity(scene.empty, 0);
      scene.status.textContent = "";
      scene.outputLine.textContent = "";
      for (const node of scene.origNodes.concat(scene.copyNodes)) {
        setOpacity(node.enter, 0);
        node.enter.setAttribute("transform", "translate(0 0)");
        setScaleAt(node.scale, node.w / 2, node.h / 2, 1);
        setOpacity(node.idle, 1);
        setOpacity(node.hot, 0);
        setOpacity(node.ring, 0);
      }
      for (const e of scene.origEdges.concat(scene.copyEdges)) setOpacity(e, 0);
      for (const a of scene.origArcs.concat(scene.copyArcs)) if (a) setOpacity(a, 0);
      setOpacity(scene.scanPtr, 0);
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt } = ctx;
    const { pairs, sim } = scene;
    const { origNodes, copyNodes } = scene;
    const n = pairs.length;
    const nodeH = scene.nodeH;

    scene.reset();

    const status = (text, color) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || ctx.C.gold);
      });
      tl.log(text, color || ctx.C.gold);
    };
    const output = text => {
      tl.add(0.01, () => { scene.outputLine.textContent = text; });
    };

    // -- intro -----------------------------------------------------------
    tl.line(1);
    tl.add(0.65, scene.writer(scene.title), ease.outCubic);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), ease.outCubic);
    tl.add(0.22, u => {
      setOpacity(scene.labelOrig, u);
      setOpacity(scene.labelCopy, u);
    }, ease.outCubic);

    if (!n) {
      tl.line(2);
      status("nodes is empty   →   return []", ctx.C.grey);
      tl.line(3);
      tl.add(0.35, u => setOpacity(scene.empty, u), ease.outCubic);
      tl.add(0.55, scene.writer(scene.result), ease.linear);
      tl.add(0.35, u => scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u))), ease.outCubic);
      tl.wait(0.7);
      return tl.finish();
    }

    // -- original chain --------------------------------------------------
    tl.line(4);
    status("originals = [ListNode(val) for val, _ in nodes]", ctx.C.blue);
    origNodes.forEach(node => {
      tl.add(0.26, u => {
        setOpacity(node.enter, u);
        node.enter.setAttribute("transform", "translate(0 " + (1 - u) * 12 + ")");
        setScaleAt(node.scale, node.w / 2, node.h / 2, 0.85 + 0.15 * u);
      }, ease.outCubic);
    });
    tl.line([5, 6]);
    for (const e of scene.origEdges) tl.add(0.2, u => setOpacity(e, u), ease.outCubic);
    status("wire original next pointers left → right", ctx.C.blue);
    tl.line([7, 8]);
    for (let i = 0; i < n; i++) {
      if (scene.origArcs[i]) {
        tl.add(0.3, u => setOpacity(scene.origArcs[i], u), ease.outCubic);
        tl.wait(0.04);
      }
    }
    status("wire each original.random from its pair", ctx.C.purple);
    tl.add(0.25, u => setOpacity(scene.status, u), ease.outCubic);

    // -- first pass: copy nodes -----------------------------------------
    tl.line(9);
    status("old_to_new = {old: ListNode(old.val)}   →   copy every node", ctx.C.green);
    copyNodes.forEach(node => {
      tl.add(0.3, u => {
        setOpacity(node.enter, Math.min(1, u * 2));
        node.enter.setAttribute("transform", "translate(0 " + (1 - u) * 14 + ")");
        setScaleAt(node.scale, node.w / 2, node.h / 2, 0.8 + 0.2 * u);
      }, ease.outCubic);
      tl.wait(0.04);
    });

    // -- second pass: next + random -------------------------------------
    for (let i = 0; i < n; i++) {
      tl.line(10);
      status("for original node " + i + " (value " + pairs[i][0] + ")", ctx.C.green);
      tl.line(11);
      tl.add(0.01, () => {
        setOpacity(origNodes[i].idle, 0);
        setOpacity(origNodes[i].hot, 1);
        setOpacity(origNodes[i].ring, 1);
        setOpacity(copyNodes[i].idle, 0);
        setOpacity(copyNodes[i].hot, 1);
        setOpacity(copyNodes[i].ring, 1);
      });
      tl.line(12);
      if (i < n - 1) {
        tl.add(0.32, u => setOpacity(scene.copyEdges[i], u), ease.outCubic);
        status("new_node.next = old_to_new[old.next]   →   copy next " + i + " → " + (i + 1), ctx.C.green);
      } else {
        status("new_node.next = old_to_new.get(None)   →   None", ctx.C.grey);
      }
      tl.line(13);
      if (scene.copyArcs[i]) {
        tl.add(0.35, u => setOpacity(scene.copyArcs[i], u), ease.outCubic);
        status("new_node.random = old_to_new[old.random]   →   copy random → " + pairs[i][1], ctx.C.gold);
      } else {
        status("new_node.random = old_to_new.get(None)   →   None", ctx.C.grey);
      }
      tl.add(0.01, () => {
        setOpacity(origNodes[i].hot, 0);
        setOpacity(origNodes[i].idle, 1);
        setOpacity(origNodes[i].ring, 0);
        setOpacity(copyNodes[i].hot, 0);
        setOpacity(copyNodes[i].idle, 1);
        setOpacity(copyNodes[i].ring, 0);
      });
      tl.wait(0.1);
    }

    // -- serialize indices ----------------------------------------------
    tl.line(14);
    status("index_of = {}   →   number the copied nodes", ctx.C.teal);
    tl.line(15);
    tl.line(16);
    for (let i = 0; i < n; i++) {
      tl.line(17);
      tl.add(0.3, u => {
        setOpacity(copyNodes[i].idle, 1 - u);
        setOpacity(copyNodes[i].hot, u);
        setOpacity(copyNodes[i].ring, u);
      }, ease.outCubic);
      tl.add(0.3, u => {
        setTranslate(scene.scanPtr, copyNodes[i].cx, copyNodes[i].top + nodeH - 18);
        setOpacity(scene.scanPtr, u);
      }, ease.inOutSine);
      tl.line(18);
      output("index_of[copy " + i + "] = " + i);
      tl.line([19, 20]);
      tl.add(0.01, () => {
        setOpacity(copyNodes[i].idle, 1);
        setOpacity(copyNodes[i].hot, 0);
        setOpacity(copyNodes[i].ring, 0);
      });
      tl.wait(0.06);
    }

    // -- build output ----------------------------------------------------
    tl.line(21);
    output("output = []");
    tl.line(22);
    status("scan the copied chain again and serialize each pair", ctx.C.green);
    const built = [];
    for (let i = 0; i < n; i++) {
      tl.line(23);
      tl.line(24);
      const r = pairs[i][1];
      built.push([pairs[i][0], r]);
      tl.line(25);
      output("output = " + JSON.stringify(built));
      tl.line(26);
      tl.add(0.3, u => {
        setTranslate(scene.scanPtr, copyNodes[i].cx, copyNodes[i].top + nodeH - 18);
        setOpacity(scene.scanPtr, u);
      }, ease.inOutSine);
      tl.line(27);
      tl.wait(0.08);
    }
    tl.add(0.3, u => setOpacity(scene.scanPtr, 1 - u), ease.outCubic);
    tl.line(28);
    status("return output   →   a deep copy with the same random structure", ctx.C.green);
    tl.add(0.25, u => {
      setOpacity(scene.status, 1 - u);
      setOpacity(scene.outputLine, 1 - u);
    }, ease.outCubic);
    tl.add(0.55, scene.writer(scene.result), ease.linear);
    tl.add(0.4, u => scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u))), ease.outCubic);
    tl.log("copied = " + JSON.stringify(sim.output), ctx.C.green);
    tl.wait(0.7);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model.
 * ------------------------------------------------------------------ */

function simulate(pairs) {
  return {
    output: pairs.map(([v, r]) => [v, r]),
  };
}
