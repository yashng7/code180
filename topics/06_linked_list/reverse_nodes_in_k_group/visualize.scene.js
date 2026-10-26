/* Reverse Nodes in K-Group — animated walkthrough scene.
 *
 * A dummy node anchors the list. For each full group of k nodes, `kth` finds
 * the group's last node, `group_next` saves the node after it, and the k links
 * are reversed in place. A shorter trailing group is left untouched.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Reverse Nodes in K-Group",
    subtitle: "reverse complete groups of k · leave the tail · O(n) time · O(1) space",
    inputs: [
      { id: "head", label: "head", type: "text", default: "1, 2, 3, 4, 5", width: "wide" },
      { id: "k", label: "k", type: "number", default: 2, min: 1, max: 8 },
    ],
    legend: [
      { color: "#F0AC5F", text: "current k-group" },
      { color: "#58C4DD", text: "group_prev / kth" },
      { color: "#83C167", text: "reversed group" },
      { color: "#6b7684", text: "unchanged tail" },
    ],
  },

  code: [
    "def reverse_k_group(head: List[int], k: int) -> List[int]:",
    "    dummy = ListNode(0, build_linked_list(head))",
    "    group_prev = dummy",
    "    while True:",
    "        kth = group_prev",
    "        count = 0",
    "        while kth is not None and count < k:",
    "            kth = kth.next",
    "            count += 1",
    "        if kth is None:",
    "            break  # fewer than k nodes remain",
    "        group_next = kth.next",
    "        prev, cur = group_next, group_prev.next",
    "        for _ in range(k):",
    "            cur.next, prev, cur = prev, cur, cur.next",
    "        tail = group_prev.next",
    "        group_prev.next = kth",
    "        group_prev = tail",
    "    return linked_list_to_list(dummy.next)",
  ],

  read(values) {
    const raw = (values.head || "").trim();
    const k = Number(values.k);
    const nums = raw ? raw.split(/[\s,]+/).filter(Boolean).map(Number) : [];
    if (!nums.every(Number.isInteger) || nums.length > 9) return null;
    if (!Number.isInteger(k) || k < 1 || k > 8) return null;
    return { values: nums, k };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0]) && Number.isInteger(args[1])) {
      const values = args[0].map(Number);
      const k = args[1];
      if (values.length <= 9 && values.every(Number.isInteger) && k >= 1 && k <= 8) {
        return { head: values.join(", "), k };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, setScaleAt, STAGE_W } = ctx;
    const { values, k } = params;
    const sim = simulate(values, k);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-grey", C.grey);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const arcsL = ctx.layer("arcs");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = {
      values, k, sim, ctx, nodes: [], edges: [], groups: [], reverseArcs: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title -----------------------------------------------------------
    scene.title = txt("Reverse Nodes in K-Group", {
      x: 64, y: 70, "font-size": 42, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    const sub = el("text", { x: 64, y: 106, "font-size": 21, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "head = ";
    el("tspan", { fill: C.white }, sub).textContent = "[" + values.join(", ") + "]";
    el("tspan", {}, sub).textContent = "     k = ";
    el("tspan", { fill: C.gold }, sub).textContent = String(k);
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- row geometry ----------------------------------------------------
    const rowY = 258;
    const nodeH = 72;
    const count = values.length + 1; // dummy + values
    const gap = count > 7 ? 16 : 28;
    const nodeW = clamp((930 - gap * (count - 1)) / count, 48, 96);
    const totalW = count * nodeW + (count - 1) * gap;
    const startX = STAGE_W / 2 - totalW / 2;
    const font = clamp(nodeW * 0.4, 15, 29);
    scene.rowY = rowY;
    scene.nodeW = nodeW;
    scene.nodeH = nodeH;

    scene.rowLabel = txt("dummy → groups of k", {
      x: 96, y: 190, "font-size": 18, fill: C.grey,
    }, textL);
    setOpacity(scene.rowLabel, 0);

    const mkNode = (value, x, isDummy) => {
      const g = el("g", { transform: "translate(" + x + " " + rowY + ")" }, chipsL);
      const enter = el("g", {}, g);
      const scale = el("g", {}, enter);
      el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 11,
        fill: isDummy ? "#181a1f" : C.chipFill,
        stroke: isDummy ? C.gold : C.greyDark,
        "stroke-width": isDummy ? 2.3 : 2,
        "stroke-dasharray": isDummy ? "6 4" : "none",
      }, scale);
      const text = txt(isDummy ? "D" : String(value), {
        x: nodeW / 2, y: nodeH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": isDummy ? font - 2 : font,
        fill: isDummy ? C.gold : C.white,
      }, scale);
      const ring = el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 11, fill: "none",
        stroke: C.gold, "stroke-width": 3.4, filter: "url(#glow-gold)",
      }, scale);
      const greenRing = el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 11, fill: "none",
        stroke: C.green, "stroke-width": 3, filter: "url(#glow-green)",
      }, scale);
      setOpacity(ring, 0);
      setOpacity(greenRing, 0);
      if (isDummy) {
        txt("dummy", {
          x: nodeW / 2, y: -16, "text-anchor": "middle", "font-size": 14, fill: C.gold,
        }, enter);
      }
      setOpacity(enter, 0);
      return { value, isDummy, g, enter, scale, text, ring, greenRing, x, cx: x + nodeW / 2, w: nodeW, h: nodeH };
    };

    scene.nodes.push(mkNode(0, startX, true));
    values.forEach((v, i) => {
      scene.nodes.push(mkNode(v, startX + (i + 1) * (nodeW + gap), false));
    });

    // -- forward edges ---------------------------------------------------
    const mkEdge = (from, to) => {
      const y = rowY + nodeH / 2;
      const x1 = from.x + nodeW, x2 = to.x;
      const g = el("g", {}, arcsL);
      el("line", {
        x1, y1: y, x2: x2 - 9, y2: y, stroke: C.grey, "stroke-width": 2.7,
        "stroke-linecap": "round",
      }, g);
      el("polygon", {
        points: (x2 - 9) + "," + (y - 7) + " " + (x2 - 9) + "," + (y + 7) + " " + x2 + "," + y,
        fill: C.grey,
      }, g);
      setOpacity(g, 0);
      return g;
    };
    for (let i = 0; i < scene.nodes.length - 1; i++) scene.edges.push(mkEdge(scene.nodes[i], scene.nodes[i + 1]));

    // -- group brackets --------------------------------------------------
    sim.groups.forEach((group, gi) => {
      const start = scene.nodes[group.start];
      const end = scene.nodes[group.end];
      const x = start.x - 8;
      const w = end.x + nodeW - start.x + 16;
      const g = el("g", {}, arcsL);
      const rect = el("rect", {
        x, y: rowY - 18, width: w, height: nodeH + 36, rx: 14,
        fill: "none", stroke: group.full ? C.gold : C.grey,
        "stroke-width": 2.2, "stroke-dasharray": group.full ? "none" : "7 5",
      }, g);
      const lbl = txt(
        group.full ? "group " + (gi + 1) : "tail < k",
        {
          x: x + w / 2, y: rowY - 28, "text-anchor": "middle", "font-size": 15,
          fill: group.full ? C.gold : C.grey,
        }, g
      );
      setOpacity(g, 0);
      scene.groups.push({ g, rect, lbl, group });
    });

    // -- pointers --------------------------------------------------------
    const mkPointer = (label, color, glow, dy) => {
      const g = el("g", {}, ptrL);
      setOpacity(g, 0);
      el("path", { d: "M -7 0 L 7 0 L 0 10 Z", fill: color, filter: "url(#" + glow + ")" }, g);
      txt(label, { x: 0, y: dy, "text-anchor": "middle", "font-size": 15, fill: color }, g);
      return g;
    };
    scene.ptrGp = mkPointer("group_prev", C.blue, "glow-blue", -10);
    scene.ptrKth = mkPointer("kth", C.gold, "glow-gold", -10);
    scene.ptrNext = mkPointer("group_next", C.green, "glow-green", -10);
    scene.noneKth = txt("kth = None", {
      x: startX + count * (nodeW + gap) + 22, y: rowY + nodeH / 2,
      "font-size": 17, fill: C.grey, "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.noneKth, 0);

    // -- status + result -------------------------------------------------
    scene.status = txt("", {
      x: STAGE_W / 2, y: 500, "text-anchor": "middle", "font-size": 22, fill: C.gold,
    }, textL);
    scene.detail = txt("", {
      x: STAGE_W / 2, y: 538, "text-anchor": "middle", "font-size": 18, fill: C.grey,
    }, textL);
    setOpacity(scene.status, 0);
    setOpacity(scene.detail, 0);

    scene.result = txt("return " + JSON.stringify(sim.output), {
      x: STAGE_W / 2, y: 640, "text-anchor": "middle", "font-size": 32, fill: C.green,
    }, resultL);
    const rule = el("line", {
      x1: STAGE_W / 2 - 175, y1: 662, x2: STAGE_W / 2 + 175, y2: 662,
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
      for (const node of [scene.subtitle, scene.rowLabel, scene.status, scene.detail, scene.noneKth]) setOpacity(node, 0);
      scene.status.textContent = "";
      scene.detail.textContent = "";
      for (const node of scene.nodes) {
        setOpacity(node.enter, 0);
        node.enter.setAttribute("transform", "translate(0 0)");
        setScaleAt(node.scale, node.w / 2, node.h / 2, 1);
        node.text.textContent = node.isDummy ? "D" : String(node.value);
        node.text.setAttribute("fill", node.isDummy ? C.gold : C.white);
        setOpacity(node.ring, 0);
        setOpacity(node.greenRing, 0);
      }
      for (const e of scene.edges) setOpacity(e, 0);
      for (const g of scene.groups) setOpacity(g.g, 0);
      for (const g of scene.reverseArcs) setOpacity(g, 0);
      for (const p of [scene.ptrGp, scene.ptrKth, scene.ptrNext]) setOpacity(p, 0);
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt } = ctx;
    const { values, k, sim, nodes } = scene;
    const rowY = scene.rowY, nodeH = scene.nodeH;

    scene.reset();

    const status = (text, color) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || ctx.C.gold);
      });
      tl.log(text, color || ctx.C.gold);
    };
    const detail = text => {
      tl.add(0.01, () => { scene.detail.textContent = text; });
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
    const at = i => nodes[i];

    // -- intro -----------------------------------------------------------
    tl.line(1);
    tl.add(0.65, scene.writer(scene.title), ease.outCubic);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), ease.outCubic);
    tl.add(0.25, u => setOpacity(scene.rowLabel, u), ease.outCubic);
    nodes.forEach(node => {
      tl.add(0.25, u => {
        setOpacity(node.enter, u);
        node.enter.setAttribute("transform", "translate(0 " + (1 - u) * 12 + ")");
        setScaleAt(node.scale, node.w / 2, node.h / 2, 0.86 + 0.14 * u);
      }, ease.outCubic);
    });
    tl.add(0.3, u => {
      for (const e of scene.edges) setOpacity(e, u);
    }, ease.outCubic);

    tl.line(2);
    status("dummy = ListNode(0, head)   →   anchor before the first group", ctx.C.gold);
    tl.line(3);
    status("group_prev = dummy", ctx.C.blue);
    tl.add(0.3, u => setOpacity(scene.status, u), ease.outCubic);
    movePtr(scene.ptrGp, nodes[0].cx, rowY - 34, 0.35);

    // -- process groups --------------------------------------------------
    let gpIndex = 0;
    sim.groups.forEach((group, gi) => {
      if (!group.full) {
        tl.line(7);
        detail("remaining nodes: " + (group.end - group.start + 1) + " < k = " + k);
        tl.line([8, 9]);
        movePtr(scene.ptrKth, at(group.end).cx, rowY - 58, 0.3);
        tl.line(10);
        status("kth is None after fewer than k steps   →   break", ctx.C.grey);
        tl.line(11);
        tl.add(0.35, u => setOpacity(scene.groups[gi].g, u), ease.outCubic);
        detail("tail is shorter than k; leave it unchanged");
        tl.wait(0.4);
        return;
      }

      tl.line(4);
      status("while True: find the k-th node of the next group", ctx.C.gold);
      tl.line(5);
      movePtr(scene.ptrGp, at(group.prev).cx, rowY - 34, 0.25);
      tl.line(6);
      detail("count = 0");
      tl.line(7);
      for (let c = 0; c < k; c++) {
        tl.line(8);
        movePtr(scene.ptrKth, at(group.start + c).cx, rowY - 58, 0.22);
        detail("kth = kth.next   ·   count = " + (c + 1) + " / " + k);
        tl.add(0.01, () => {
          if (c > 0) setOpacity(at(group.start + c - 1).ring, 0);
          setOpacity(at(group.start + c).ring, 1);
        });
        tl.wait(0.04);
      }
      tl.line(9);
      tl.line(10);
      status("kth is not None   →   this is a complete group", ctx.C.gold);
      tl.add(0.35, u => setOpacity(scene.groups[gi].g, u), ease.outCubic);
      detail("group " + (gi + 1) + ": positions " + group.start + " … " + group.end);
      tl.wait(0.15);

      // group_next
      tl.line(12);
      if (group.end + 1 < nodes.length) {
        movePtr(scene.ptrNext, at(group.end + 1).cx, rowY - 82, 0.3);
        detail("group_next = node after the group");
      } else {
        tl.add(0.01, () => setOpacity(scene.noneKth, 1));
        detail("group_next = None (group ends at the tail)");
      }

      // Reverse links: show gold arcs, then swap values.
      tl.line(13);
      tl.add(0.3, u => {
        for (let j = group.start; j < group.end; j++) {
          setOpacity(scene.edges[j], 1 - 0.8 * u);
        }
      }, ease.outCubic);
      const arcG = ctx.el("g", {}, ctx.layer("arcs"));
      for (let j = group.start; j < group.end; j++) {
        const from = at(j + 1), to = at(j);
        const y = rowY + nodeH + 22;
        ctx.el("path", {
          d: "M " + from.cx + " " + (rowY + nodeH) +
             " Q " + ((from.cx + to.cx) / 2) + " " + (y + 20) +
             " " + (to.cx + 8) + " " + (rowY + nodeH),
          fill: "none", stroke: ctx.C.gold, "stroke-width": 2.8,
          "stroke-linecap": "round", filter: "url(#glow-gold)",
        }, arcG);
        ctx.el("polygon", {
          points: (to.cx + 8) + "," + (rowY + nodeH + 5) + " " +
                  (to.cx + 8) + "," + (rowY + nodeH + 19) + " " +
                  (to.cx - 2) + "," + (rowY + nodeH + 12),
          fill: ctx.C.gold,
        }, arcG);
      }
      setOpacity(arcG, 0);
      scene.reverseArcs.push(arcG);
      tl.add(0.45, u => setOpacity(arcG, u), ease.outCubic);
      tl.line(14);
      tl.line(15);
      detail("for _ in range(" + k + "): flip each cur.next");
      tl.wait(0.3);

      // Swap the displayed values to reflect the reordered nodes.
      const before = nodes.slice(group.start, group.end + 1).map(n => n.value);
      const after = before.slice().reverse();
      tl.add(0.35, u => {
        for (let j = group.start; j <= group.end; j++) {
          const node = at(j);
          const idx = j - group.start;
          const a = before[idx], b = after[idx];
          node.text.textContent = String(u < 0.5 ? a : b);
          node.text.setAttribute("fill", u < 0.5 ? ctx.C.white : ctx.C.green);
          setOpacity(node.greenRing, Math.sin(Math.PI * u));
        }
      }, ease.inOutSine);
      tl.line([16, 17]);
      detail("tail = old first node; group_prev.next = kth");
      tl.line(18);
      detail("group_prev = tail   →   ready for the next group");
      tl.add(0.01, () => {
        for (let j = group.start; j <= group.end; j++) {
          at(j).text.setAttribute("fill", ctx.C.green);
          setOpacity(at(j).ring, 0);
          setOpacity(at(j).greenRing, 0);
        }
        setOpacity(arcG, 0);
        for (let j = group.start; j < group.end; j++) setOpacity(scene.edges[j], 1);
        setOpacity(scene.ptrNext, 0);
        setOpacity(scene.noneKth, 0);
      });
      // group_prev is the old first node, now at the end of this group.
      gpIndex = group.end;
      movePtr(scene.ptrGp, at(group.end).cx, rowY - 34, 0.3);
      movePtr(scene.ptrKth, at(group.end).cx, rowY - 58, 0.3);
      tl.wait(0.25);
    });

    // -- final -----------------------------------------------------------
    tl.line(19);
    status("all groups processed   →   return dummy.next", ctx.C.green);
    const fadeOut = (node, dur) => {
      const from = Number(node.style.opacity) || 0;
      tl.add(dur || 0.25, u => setOpacity(node, from * (1 - u)), ease.outCubic);
    };
    fadeOut(scene.status);
    fadeOut(scene.detail);
    fadeOut(scene.ptrGp);
    fadeOut(scene.ptrKth);
    fadeOut(scene.noneKth);
    for (const g of scene.groups) fadeOut(g.g);
    tl.add(0.6, scene.writer(scene.result), ease.linear);
    tl.add(0.4, u => scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u))), ease.outCubic);
    tl.log("output = [" + sim.output.join(", ") + "]", ctx.C.green);
    tl.wait(0.7);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model.  Visual index 0 is the dummy node.
 * ------------------------------------------------------------------ */

function simulate(values, k) {
  const groups = [];
  let groupPrev = 0;
  let guard = 0;
  while (guard++ < 30) {
    const start = groupPrev + 1;
    const end = start + k - 1;
    if (start >= values.length + 1) break;
    if (end >= values.length + 1) {
      groups.push({ start, end: values.length, prev: groupPrev, full: false });
      break;
    }
    groups.push({ start, end, prev: groupPrev, full: true });
    groupPrev = end;
  }
  const output = values.slice();
  for (const g of groups) {
    if (!g.full) continue;
    const a = g.start - 1, b = g.end - 1;
    const seg = output.slice(a, b + 1).reverse();
    for (let i = 0; i < seg.length; i++) output[a + i] = seg[i];
  }
  return { groups, output };
}
