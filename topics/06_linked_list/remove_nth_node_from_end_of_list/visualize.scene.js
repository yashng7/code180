/* Remove Nth Node From End of List — animated walkthrough scene.
 *
 * A dummy node makes the head easy to delete. `fast` is advanced n nodes
 * first, opening a gap of n between the two pointers. Then both move until
 * `fast` reaches the last node; `slow` is now just before the target. The
 * target is unlinked with slow.next = slow.next.next.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Remove Nth Node From End of List",
    subtitle: "dummy head + two pointers · one pass · O(n) time · O(1) space",
    inputs: [
      { id: "head", label: "head", type: "text", default: "1, 2, 3, 4, 5", width: "wide" },
      { id: "n", label: "n", type: "number", default: 2, min: 1, max: 10 },
    ],
    legend: [
      { color: "#58C4DD", text: "slow" },
      { color: "#B58CD6", text: "fast" },
      { color: "#FC6255", text: "node to remove" },
      { color: "#83C167", text: "repaired next pointer" },
    ],
  },

  code: [
    "def remove_nth_from_end(head: List[int], n: int) -> List[int]:",
    "    dummy = ListNode(0, build_linked_list(head))",
    "    slow = fast = dummy",
    "    for _ in range(n):",
    "        fast = fast.next",
    "    while fast.next is not None:",
    "        fast = fast.next",
    "        slow = slow.next",
    "    slow.next = slow.next.next",
    "    return linked_list_to_list(dummy.next)",
  ],

  read(values) {
    const raw = (values.head || "").trim();
    const n = Number(values.n);
    const nums = raw ? raw.split(/[\s,]+/).filter(Boolean).map(Number) : [];
    if (!nums.every(Number.isInteger) || nums.length > 9) return null;
    if (!Number.isInteger(n) || n < 1 || n > nums.length) return null;
    return { values: nums, n };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0]) && Number.isInteger(args[1])) {
      const values = args[0].map(Number);
      const n = args[1];
      if (values.length <= 9 && values.every(Number.isInteger) && n >= 1 && n <= values.length) {
        return { head: values.join(", "), n };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, setScaleAt, STAGE_W } = ctx;
    const { values, n } = params;
    const sim = simulate(values, n);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-purple", C.purple);
    ctx.glow("glow-red", C.red);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-gold", C.gold);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const arcsL = ctx.layer("arcs");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = {
      values, n, sim, ctx, nodes: [], edges: [], bridge: null, _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title -----------------------------------------------------------
    scene.title = txt("Remove Nth Node From End", {
      x: 64, y: 70, "font-size": 41, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    const sub = el("text", { x: 64, y: 106, "font-size": 21, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "head = ";
    el("tspan", { fill: C.white }, sub).textContent = "[" + values.join(", ") + "]";
    el("tspan", {}, sub).textContent = "     n = ";
    el("tspan", { fill: C.red }, sub).textContent = String(n);
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- row geometry ----------------------------------------------------
    const rowY = 246;
    const nodeH = 74;
    const totalNodes = values.length + 1;
    const gap = totalNodes > 7 ? 18 : 30;
    const nodeW = clamp((900 - gap * (totalNodes - 1)) / totalNodes, 56, 100);
    const totalW = totalNodes * nodeW + (totalNodes - 1) * gap;
    const startX = STAGE_W / 2 - totalW / 2;
    const font = clamp(nodeW * 0.4, 15, 30);
    scene.rowY = rowY;
    scene.nodeH = nodeH;
    scene.nodeW = nodeW;

    scene.rowLabel = txt("dummy → head", {
      x: 96, y: 190, "font-size": 18, fill: C.grey,
    }, textL);
    setOpacity(scene.rowLabel, 0);

    const mkNode = (value, i, x, isDummy) => {
      const g = el("g", { transform: "translate(" + x + " " + rowY + ")" }, chipsL);
      const enter = el("g", {}, g);
      const scale = el("g", {}, enter);
      const rect = el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 11,
        fill: isDummy ? "#181a1f" : C.chipFill,
        stroke: isDummy ? C.gold : C.greyDark,
        "stroke-width": isDummy ? 2.4 : 2,
        "stroke-dasharray": isDummy ? "6 4" : "none",
      }, scale);
      const mk = fill => txt(isDummy ? "D" : String(value), {
        x: nodeW / 2, y: nodeH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": isDummy ? font - 2 : font, fill,
      }, scale);
      const idle = mk(isDummy ? C.gold : C.white);
      const blue = mk(C.blue), purple = mk(C.purple), red = mk(C.red), green = mk(C.green);
      setOpacity(blue, 0); setOpacity(purple, 0); setOpacity(red, 0); setOpacity(green, 0);
      const ringBlue = el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 11, fill: "none",
        stroke: C.blue, "stroke-width": 3, filter: "url(#glow-blue)",
      }, scale);
      const ringPurple = el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 11, fill: "none",
        stroke: C.purple, "stroke-width": 3, filter: "url(#glow-purple)",
      }, scale);
      const ringRed = el("rect", {
        x: 0, y: 0, width: nodeW, height: nodeH, rx: 11, fill: "none",
        stroke: C.red, "stroke-width": 3.5, filter: "url(#glow-red)",
      }, scale);
      setOpacity(ringBlue, 0); setOpacity(ringPurple, 0); setOpacity(ringRed, 0);
      if (isDummy) {
        txt("dummy", {
          x: nodeW / 2, y: -16, "text-anchor": "middle", "font-size": 14, fill: C.gold,
        }, enter);
      }
      setOpacity(enter, 0);
      return {
        i, value, isDummy, g, enter, scale, rect, idle, blue, purple, red, green,
        ringBlue, ringPurple, ringRed, x, cx: x + nodeW / 2, w: nodeW, h: nodeH,
      };
    };

    scene.nodes.push(mkNode(0, 0, startX, true));
    values.forEach((v, i) => {
      scene.nodes.push(mkNode(v, i + 1, startX + (i + 1) * (nodeW + gap), false));
    });

    // -- edges -----------------------------------------------------------
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
    for (let i = 0; i < scene.nodes.length - 1; i++) {
      scene.edges.push(mkEdge(scene.nodes[i], scene.nodes[i + 1], i === 0 ? C.gold : C.grey));
    }

    // -- None marker after the tail -------------------------------------
    scene.noneText = txt("None", {
      x: scene.nodes[scene.nodes.length - 1].x + nodeW + 18,
      y: rowY + nodeH / 2, "font-size": 18, fill: C.grey,
      "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.noneText, 0);

    // -- pointers --------------------------------------------------------
    const mkPointer = (label, color, glow, labelDx) => {
      const g = el("g", {}, ptrL);
      setOpacity(g, 0);
      el("path", { d: "M -7 0 L 7 0 L 0 10 Z", fill: color, filter: "url(#" + glow + ")" }, g);
      txt(label, { x: labelDx || 0, y: -8, "text-anchor": "middle", "font-size": 16, fill: color }, g);
      return g;
    };
    scene.ptrSlow = mkPointer("slow", C.blue, "glow-blue", -20);
    scene.ptrFast = mkPointer("fast", C.purple, "glow-purple", 20);
    scene.ptrTarget = mkPointer("target", C.red, "glow-red", 0);

    // -- status + result -------------------------------------------------
    scene.status = txt("", {
      x: STAGE_W / 2, y: 470, "text-anchor": "middle", "font-size": 22, fill: C.gold,
    }, textL);
    setOpacity(scene.status, 0);
    scene.gap = txt("", {
      x: STAGE_W / 2, y: 506, "text-anchor": "middle", "font-size": 18, fill: C.grey,
    }, textL);
    setOpacity(scene.gap, 0);

    scene.result = txt("return " + JSON.stringify(sim.output), {
      x: STAGE_W / 2, y: 640, "text-anchor": "middle", "font-size": 33, fill: C.green,
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
      for (const node of [scene.subtitle, scene.rowLabel, scene.status, scene.gap, scene.noneText]) setOpacity(node, 0);
      scene.status.textContent = "";
      scene.gap.textContent = "";
      for (const node of scene.nodes) {
        setOpacity(node.enter, 0);
        node.enter.setAttribute("transform", "translate(0 0)");
        setScaleAt(node.scale, node.w / 2, node.h / 2, 1);
        setOpacity(node.idle, 1);
        setOpacity(node.blue, 0);
        setOpacity(node.purple, 0);
        setOpacity(node.red, 0);
        setOpacity(node.green, 0);
        setOpacity(node.ringBlue, 0);
        setOpacity(node.ringPurple, 0);
        setOpacity(node.ringRed, 0);
      }
      for (const e of scene.edges) setOpacity(e, 0);
      if (scene.bridge) setOpacity(scene.bridge, 0);
      for (const p of [scene.ptrSlow, scene.ptrFast, scene.ptrTarget]) setOpacity(p, 0);
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt } = ctx;
    const { values, n, sim, nodes } = scene;
    const rowY = scene.rowY, nodeH = scene.nodeH, nodeW = scene.nodeW;

    scene.reset();

    const status = (text, color) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || ctx.C.gold);
      });
      tl.log(text, color || ctx.C.gold);
    };
    const gapLine = text => {
      tl.add(0.01, () => { scene.gap.textContent = text; });
    };
    const ptrPos = ptr => {
      const tr = ptr.getAttribute("transform") || "translate(0 0)";
      const m = /translate\(([-\d.]+)[,\s]+([-\d.]+)/.exec(tr);
      return m ? [Number(m[1]), Number(m[2])] : [0, 0];
    };
    const movePtr = (ptr, x, y, dur) => {
      const [fromX, fromY] = ptrPos(ptr);
      tl.add(dur || 0.32, u => {
        setOpacity(ptr, 1);
        setTranslate(ptr, fromX + (x - fromX) * u, fromY + (y - fromY) * u);
      }, ease.inOutSine);
    };
    const at = i => nodes[i];

    // -- intro -----------------------------------------------------------
    tl.line(1);
    tl.add(0.65, scene.writer(scene.title), ease.outCubic);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), ease.outCubic);
    tl.add(0.3, u => setOpacity(scene.rowLabel, u), ease.outCubic);
    nodes.forEach((node, i) => {
      tl.add(0.28, u => {
        setOpacity(node.enter, u);
        node.enter.setAttribute("transform", "translate(0 " + (1 - u) * 14 + ")");
        setScaleAt(node.scale, node.w / 2, node.h / 2, 0.84 + 0.16 * u);
      }, ease.outCubic);
      tl.wait(0.04);
    });
    tl.add(0.3, u => {
      for (const e of scene.edges) setOpacity(e, u);
      setOpacity(scene.noneText, u);
    }, ease.outCubic);

    tl.line(2);
    status("dummy = ListNode(0, head)   →   sentinel before the real head", ctx.C.gold);
    tl.line(3);
    status("slow = fast = dummy", ctx.C.blue);
    tl.add(0.3, u => setOpacity(scene.status, u), ease.outCubic);
    movePtr(scene.ptrSlow, nodes[0].cx, rowY - 28, 0.35);
    movePtr(scene.ptrFast, nodes[0].cx, rowY - 28, 0.35);
    gapLine("gap between slow and fast: 0");

    // -- advance fast n times -------------------------------------------
    tl.line(4);
    for (let k = 0; k < n; k++) {
      tl.line(5);
      movePtr(scene.ptrFast, at(k + 1).cx, rowY - 28, 0.32);
      tl.add(0.2, u => {
        setOpacity(at(k + 1).purple, u);
        setOpacity(at(k + 1).ringPurple, u);
      }, ease.outCubic);
      gapLine("for _ in range(" + n + "):   fast advanced " + (k + 1) + " / " + n);
      tl.add(0.01, () => {
        if (k > 0) {
          setOpacity(at(k).purple, 0);
          setOpacity(at(k).ringPurple, 0);
        }
      });
      tl.wait(0.06);
    }
    status("fast is n nodes ahead of slow", ctx.C.purple);

    // -- move both until fast reaches the last node ----------------------
    tl.line(6);
    sim.walk.forEach((step, k) => {
      tl.line([7, 8]);
      movePtr(scene.ptrFast, at(step.fast).cx, rowY - 28, 0.3);
      movePtr(scene.ptrSlow, at(step.slow).cx, rowY - 28, 0.3);
      tl.add(0.18, u => {
        setOpacity(at(step.slow).blue, u);
        setOpacity(at(step.slow).ringBlue, u);
      }, ease.outCubic);
      tl.add(0.01, () => {
        if (k > 0) {
          setOpacity(at(sim.walk[k - 1].slow).blue, 0);
          setOpacity(at(sim.walk[k - 1].slow).ringBlue, 0);
        }
        if (k > 0) {
          setOpacity(at(sim.walk[k - 1].fast).purple, 0);
          setOpacity(at(sim.walk[k - 1].fast).ringPurple, 0);
        }
      });
      gapLine("fast.next is not None   →   advance both pointers");
      tl.wait(0.05);
    });

    // -- target and unlink ----------------------------------------------
    const target = at(sim.target);
    const before = at(sim.target - 1);
    tl.line(9);
    status(
      "slow.next is " + (target.isDummy ? "dummy" : target.value) +
      "   →   remove the node " + n + " from the end",
      ctx.C.red
    );
    movePtr(scene.ptrTarget, target.cx, rowY - 28, 0.35);
    tl.add(0.4, u => {
      setOpacity(target.red, u);
      setOpacity(target.ringRed, u);
      setOpacity(target.idle, 1 - u);
    }, ease.outCubic);
    tl.add(0.35, u => setScaleAt(target.scale, target.w / 2, target.h / 2, 1 + 0.08 * Math.sin(Math.PI * u)), ease.linear);
    tl.wait(0.2);

    // Bridge over the removed node.
    const bridgeX1 = before.x + nodeW;
    const bridgeX2 = sim.target + 1 < nodes.length ? nodes[sim.target + 1].x : before.x + nodeW + 100;
    const bridgeY = rowY + nodeH + 28;
    const bridge = ctx.el("g", {}, scene.ctx.layer("arcs"));
    ctx.el("path", {
      d: "M " + bridgeX1 + " " + (rowY + nodeH / 2) +
         " Q " + ((bridgeX1 + bridgeX2) / 2) + " " + bridgeY +
         " " + (bridgeX2 - 10) + " " + (rowY + nodeH / 2),
      fill: "none", stroke: ctx.C.green, "stroke-width": 3.2,
      "stroke-linecap": "round", filter: "url(#glow-green)",
    }, bridge);
    ctx.el("polygon", {
      points: (bridgeX2 - 10) + "," + (rowY + nodeH / 2 - 7) + " " +
              (bridgeX2 - 10) + "," + (rowY + nodeH / 2 + 7) + " " +
              bridgeX2 + "," + (rowY + nodeH / 2),
      fill: ctx.C.green,
    }, bridge);
    setOpacity(bridge, 0);
    scene.bridge = bridge;

    tl.add(0.35, u => {
      for (let i = 0; i < scene.edges.length; i++) {
        if (i === sim.target - 1 || i === sim.target) setOpacity(scene.edges[i], 1 - u);
      }
      setOpacity(target.enter, 1 - u);
      setOpacity(bridge, u);
    }, ease.outCubic);
    status(
      "slow.next = slow.next.next   →   " +
      (before.isDummy ? "dummy" : String(before.value)) +
      " now points past the removed node",
      ctx.C.green
    );
    tl.add(0.01, () => {
      setOpacity(target.ringRed, 0);
      setOpacity(target.red, 0);
      setOpacity(scene.ptrTarget, 0);
      if (sim.target + 1 < nodes.length) {
        setOpacity(nodes[sim.target + 1].idle, 1);
      }
    });
    gapLine("linked list repaired; length is now " + sim.output.length);
    tl.wait(0.3);

    // -- result ----------------------------------------------------------
    tl.line(10);
    status("return the remaining values", ctx.C.green);
    tl.add(0.3, u => {
      setOpacity(scene.status, 1 - u);
      setOpacity(scene.gap, 1 - u);
      setOpacity(scene.ptrSlow, 1 - u);
      setOpacity(scene.ptrFast, 1 - u);
    }, ease.outCubic);
    tl.add(0.6, scene.writer(scene.result), ease.linear);
    tl.add(0.4, u => scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u))), ease.outCubic);
    tl.log("remaining list = [" + sim.output.join(", ") + "]", ctx.C.green);
    tl.wait(0.7);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model.  Visual index 0 is the dummy node.
 * ------------------------------------------------------------------ */

function simulate(values, n) {
  const len = values.length;
  let slow = 0, fast = 0;
  const advance = [];
  for (let k = 0; k < n; k++) {
    fast += 1;
    advance.push({ slow, fast });
  }
  const walk = [];
  while (fast < len) {
    fast += 1;
    slow += 1;
    walk.push({ slow, fast });
  }
  const target = slow + 1;
  const output = values.slice();
  if (target - 1 >= 0) output.splice(target - 1, 1);
  return { advance, walk, target, output };
}
