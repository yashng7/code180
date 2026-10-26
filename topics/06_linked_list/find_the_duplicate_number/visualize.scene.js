/* Find the Duplicate Number — animated walkthrough scene.
 *
 * Treat each array index as a node and `nums[i]` as its next pointer. The
 * repeated value creates a cycle. Floyd's algorithm finds the meeting point,
 * then resets `slow` to 0 and walks both pointers one step at a time until
 * they meet at the cycle entrance — the duplicate value.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Find the Duplicate Number",
    subtitle: "index → nums[index] · Floyd's cycle detection · O(n) time · O(1) space",
    inputs: [
      { id: "nums", label: "nums", type: "text", default: "1, 3, 4, 2, 2", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "slow" },
      { color: "#B58CD6", text: "fast" },
      { color: "#F0AC5F", text: "cycle edges" },
      { color: "#FC6255", text: "duplicate / entrance" },
    ],
  },

  code: [
    "def find_duplicate(nums: List[int]) -> int:",
    "    slow = fast = 0",
    "    while True:",
    "        slow = nums[slow]",
    "        fast = nums[nums[fast]]",
    "        if slow == fast:",
    "            break",
    "    slow = 0",
    "    while slow != fast:",
    "        slow = nums[slow]",
    "        fast = nums[fast]",
    "    return slow",
  ],

  read(values) {
    const raw = (values.nums || "").trim();
    if (!raw) return null;
    const nums = raw.split(/[\s,]+/).filter(Boolean).map(Number);
    if (nums.length < 2 || nums.length > 8) return null;
    if (!nums.every(Number.isInteger)) return null;
    if (nums.some(v => v < 1 || v > nums.length - 1)) return null;
    const seen = new Set();
    let dup = false;
    for (const v of nums) {
      if (seen.has(v)) dup = true;
      seen.add(v);
    }
    if (!dup) return null;
    return { nums };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const nums = args[0].map(Number);
      if (nums.length >= 2 && nums.length <= 8 && nums.every(Number.isInteger)) {
        return { nums: nums.join(", ") };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, setScaleAt, STAGE_W } = ctx;
    const { nums } = params;
    const n = nums.length;
    const sim = simulate(nums);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-purple", C.purple);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-red", C.red);
    ctx.glow("glow-green", C.green);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const arcsL = ctx.layer("arcs");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = {
      nums, sim, ctx, chips: [], edges: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title -----------------------------------------------------------
    scene.title = txt("Find the Duplicate Number", {
      x: 64, y: 68, "font-size": 41, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    const sub = el("text", { x: 64, y: 103, "font-size": 21, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "nums = ";
    el("tspan", { fill: C.white }, sub).textContent = "[" + nums.join(", ") + "]";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- array chips -----------------------------------------------------
    const chipTop = 212;
    const chipH = 78;
    const gap = n > 6 ? 14 : 26;
    const chipW = clamp((900 - gap * (n - 1)) / n, 64, 112);
    const totalW = n * chipW + (n - 1) * gap;
    const startX = STAGE_W / 2 - totalW / 2;
    const font = clamp(chipW * 0.38, 17, 32);
    scene.chipTop = chipTop;
    scene.chipH = chipH;

    scene.indexLabel = txt("index i", {
      x: 96, y: chipTop + chipH / 2, "font-size": 17, fill: C.grey,
    }, textL);
    scene.valueLabel = txt("nums[i]", {
      x: 96, y: chipTop + chipH / 2 + 24, "font-size": 15, fill: C.grey,
    }, textL);
    setOpacity(scene.indexLabel, 0);
    setOpacity(scene.valueLabel, 0);

    nums.forEach((value, i) => {
      const x = startX + i * (chipW + gap);
      const g = el("g", { transform: "translate(" + x + " " + chipTop + ")" }, chipsL);
      const enter = el("g", {}, g);
      const scale = el("g", {}, enter);
      el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx: 12,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, scale);
      const idle = txt(String(value), {
        x: chipW / 2, y: chipH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": font, fill: C.white,
      }, scale);
      const blue = txt(String(value), {
        x: chipW / 2, y: chipH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": font, fill: C.blue,
      }, scale);
      const purple = txt(String(value), {
        x: chipW / 2, y: chipH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": font, fill: C.purple,
      }, scale);
      const red = txt(String(value), {
        x: chipW / 2, y: chipH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": font, fill: C.red,
      }, scale);
      setOpacity(blue, 0); setOpacity(purple, 0); setOpacity(red, 0);
      const ringBlue = el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx: 12, fill: "none",
        stroke: C.blue, "stroke-width": 3, filter: "url(#glow-blue)",
      }, scale);
      const ringPurple = el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx: 12, fill: "none",
        stroke: C.purple, "stroke-width": 3, filter: "url(#glow-purple)",
      }, scale);
      const ringRed = el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx: 12, fill: "none",
        stroke: C.red, "stroke-width": 3.5, filter: "url(#glow-red)",
      }, scale);
      setOpacity(ringBlue, 0); setOpacity(ringPurple, 0); setOpacity(ringRed, 0);
      const idx = txt(String(i), {
        x: chipW / 2, y: -17, "text-anchor": "middle", "font-size": 16, fill: C.gold,
      }, enter);
      setOpacity(enter, 0);
      scene.chips.push({
        i, value, g, enter, scale, idle, blue, purple, red,
        ringBlue, ringPurple, ringRed, idx, x, cx: x + chipW / 2, w: chipW, h: chipH,
      });
    });

    // -- next-pointer arcs below the chips ------------------------------
    const arcBase = chipTop + chipH + 12;
    nums.forEach((target, i) => {
      const from = scene.chips[i], to = scene.chips[target];
      const y1 = chipTop + chipH;
      const lift = arcBase + (i % 2) * 26 + Math.min(54, Math.abs(to.cx - from.cx) * 0.12);
      const path = el("path", {
        d: "M " + from.cx + " " + y1 +
           " Q " + ((from.cx + to.cx) / 2) + " " + lift +
           " " + to.cx + " " + y1,
        fill: "none", stroke: C.grey, "stroke-width": 2.2,
        "stroke-linecap": "round",
      }, arcsL);
      const head = el("polygon", {
        points: (to.cx - 7) + "," + (y1 + 10) + " " +
                (to.cx + 7) + "," + (y1 + 10) + " " +
                to.cx + "," + (y1 - 1),
        fill: C.grey,
      }, arcsL);
      setOpacity(path, 0);
      setOpacity(head, 0);
      scene.edges.push({ i, target, path, head, cycle: sim.cycleEdges.has(i + "->" + target) });
    });

    // -- slow / fast pointers -------------------------------------------
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

    // -- status + result -------------------------------------------------
    scene.status = txt("", {
      x: STAGE_W / 2, y: 494, "text-anchor": "middle", "font-size": 22, fill: C.gold,
    }, textL);
    scene.detail = txt("", {
      x: STAGE_W / 2, y: 532, "text-anchor": "middle", "font-size": 18, fill: C.grey,
    }, textL);
    setOpacity(scene.status, 0);
    setOpacity(scene.detail, 0);

    scene.result = txt("return " + sim.duplicate, {
      x: STAGE_W / 2, y: 630, "text-anchor": "middle", "font-size": 36, fill: C.green,
    }, resultL);
    const rule = el("line", {
      x1: STAGE_W / 2 - 150, y1: 652, x2: STAGE_W / 2 + 150, y2: 652,
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
      for (const node of [scene.subtitle, scene.indexLabel, scene.valueLabel,
                          scene.status, scene.detail]) setOpacity(node, 0);
      scene.status.textContent = "";
      scene.detail.textContent = "";
      for (const chip of scene.chips) {
        setOpacity(chip.enter, 0);
        chip.enter.setAttribute("transform", "translate(0 0)");
        setScaleAt(chip.scale, chip.w / 2, chip.h / 2, 1);
        setOpacity(chip.idle, 1);
        setOpacity(chip.blue, 0);
        setOpacity(chip.purple, 0);
        setOpacity(chip.red, 0);
        setOpacity(chip.ringBlue, 0);
        setOpacity(chip.ringPurple, 0);
        setOpacity(chip.ringRed, 0);
      }
      for (const e of scene.edges) {
        setOpacity(e.path, 0);
        setOpacity(e.head, 0);
        e.path.setAttribute("stroke", C.grey);
        e.head.setAttribute("fill", C.grey);
      }
      setOpacity(scene.ptrSlow, 0);
      setOpacity(scene.ptrFast, 0);
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt } = ctx;
    const { nums, sim, chips } = scene;
    const chipTop = scene.chipTop;

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
      tl.add(dur || 0.32, u => {
        setOpacity(ptr, 1);
        setTranslate(ptr, fx + (x - fx) * u, fy + (y - fy) * u);
      }, ease.inOutSine);
    };
    const clearPointer = ptr => {
      tl.add(0.25, u => setOpacity(ptr, 1 - u), ease.outCubic);
    };
    const move = (ptr, idx) => movePtr(ptr, chips[idx].cx, chipTop - 34, 0.32);

    // -- intro -----------------------------------------------------------
    tl.line(1);
    tl.add(0.65, scene.writer(scene.title), ease.outCubic);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), ease.outCubic);
    tl.add(0.3, u => {
      setOpacity(scene.indexLabel, u);
      setOpacity(scene.valueLabel, u);
    }, ease.outCubic);
    chips.forEach(chip => {
      tl.add(0.26, u => {
        setOpacity(chip.enter, u);
        chip.enter.setAttribute("transform", "translate(0 " + (1 - u) * 12 + ")");
        setScaleAt(chip.scale, chip.w / 2, chip.h / 2, 0.86 + 0.14 * u);
      }, ease.outCubic);
    });
    tl.add(0.3, u => {
      for (const e of scene.edges) {
        setOpacity(e.path, u);
        setOpacity(e.head, u);
      }
    }, ease.outCubic);
    status("each index i points to nums[i]   →   follow the links", ctx.C.gold);
    tl.add(0.3, u => setOpacity(scene.status, u), ease.outCubic);
    tl.line(2);
    status("slow = fast = 0   →   start at index 0", ctx.C.blue);
    move(scene.ptrSlow, 0);
    move(scene.ptrFast, 0);

    // -- phase 1 ---------------------------------------------------------
    tl.line(3);
    let prevSlow = 0, prevFast = 0;
    sim.phase1.forEach((step, si) => {
      tl.line(4);
      move(scene.ptrSlow, step.slow);
      tl.add(0.22, u => {
        setOpacity(chips[step.slow].idle, 1 - u);
        setOpacity(chips[step.slow].blue, u);
        setOpacity(chips[step.slow].ringBlue, u);
      }, ease.outCubic);
      tl.line(5);
      move(scene.ptrFast, step.fast);
      tl.add(0.22, u => {
        setOpacity(chips[step.fast].purple, u);
        setOpacity(chips[step.fast].ringPurple, u);
      }, ease.outCubic);
      status(
        "slow = nums[" + step.slowFrom + "] = " + step.slow +
        "   ·   fast = nums[nums[" + step.fastFrom + "]] = " + step.fast,
        ctx.C.gold
      );
      detail("phase 1: find any meeting point inside the cycle");
      tl.line(6);
      if (step.meet) {
        status("slow == fast = " + step.slow + "   →   break", ctx.C.red);
        tl.line(7);
        tl.add(0.35, u => {
          setOpacity(chips[step.slow].blue, 0);
          setOpacity(chips[step.slow].purple, 0);
          setOpacity(chips[step.slow].red, u);
          setOpacity(chips[step.slow].ringBlue, 0);
          setOpacity(chips[step.slow].ringPurple, 0);
          setOpacity(chips[step.slow].ringRed, u);
        }, ease.outCubic);
        tl.add(0.35, u => setScaleAt(chips[step.slow].scale, chips[step.slow].w / 2, chips[step.slow].h / 2,
          1 + 0.08 * Math.sin(Math.PI * u)), ease.linear);
        tl.add(0.3, u => {
          for (const e of scene.edges) {
            if (e.cycle) {
              e.path.setAttribute("stroke", u > 0.45 ? ctx.C.gold : ctx.C.grey);
              e.head.setAttribute("fill", u > 0.45 ? ctx.C.gold : ctx.C.grey);
            }
          }
        }, ease.outCubic);
      } else {
        status("slow ≠ fast   →   continue", ctx.C.grey);
      }
      tl.add(0.01, () => {
        if (!step.meet) {
          if (prevSlow !== step.slow) {
            setOpacity(chips[prevSlow].blue, 0);
            setOpacity(chips[prevSlow].idle, 1);
            setOpacity(chips[prevSlow].ringBlue, 0);
          }
          if (prevFast !== step.fast) {
            setOpacity(chips[prevFast].purple, 0);
            setOpacity(chips[prevFast].idle, 1);
            setOpacity(chips[prevFast].ringPurple, 0);
          }
        }
        prevSlow = step.slow;
        prevFast = step.fast;
      });
      tl.wait(0.1);
    });

    // -- phase 2 ---------------------------------------------------------
    tl.line(8);
    status("slow = 0   →   reset the tortoise to the head", ctx.C.blue);
    move(scene.ptrSlow, 0);
    tl.add(0.3, u => {
      setOpacity(chips[0].idle, 1 - u);
      setOpacity(chips[0].blue, u);
      setOpacity(chips[0].ringBlue, u);
    }, ease.outCubic);
    detail("phase 2: both pointers move one step at a time");

    tl.line(9);
    sim.phase2.forEach((step, si) => {
      tl.line(10);
      move(scene.ptrSlow, step.slow);
      tl.line(11);
      move(scene.ptrFast, step.fast);
      status(
        "slow = nums[" + step.slowFrom + "] = " + step.slow +
        "   ·   fast = nums[" + step.fastFrom + "] = " + step.fast,
        ctx.C.gold
      );
      detail("walk until slow and fast land on the same entrance");
      tl.line(9);
      if (step.meet) {
        status("slow == fast = " + step.slow + "   →   cycle entrance found", ctx.C.red);
        tl.add(0.3, u => {
          setOpacity(chips[step.slow].blue, 0);
          setOpacity(chips[step.slow].purple, 0);
          setOpacity(chips[step.slow].red, u);
          setOpacity(chips[step.slow].ringBlue, 0);
          setOpacity(chips[step.slow].ringPurple, 0);
          setOpacity(chips[step.slow].ringRed, u);
        }, ease.outCubic);
        tl.add(0.3, u => setScaleAt(chips[step.slow].scale, chips[step.slow].w / 2, chips[step.slow].h / 2,
          1 + 0.09 * Math.sin(Math.PI * u)), ease.linear);
      }
      tl.wait(0.15);
    });

    // -- answer ----------------------------------------------------------
    tl.line(12);
    status("return slow = " + sim.duplicate + "   →   the duplicate value", ctx.C.green);
    tl.add(0.3, u => {
      setOpacity(scene.status, 1 - u);
      setOpacity(scene.detail, 1 - u);
      setOpacity(scene.ptrSlow, 1 - u);
      setOpacity(scene.ptrFast, 1 - u);
    }, ease.outCubic);
    tl.add(0.55, scene.writer(scene.result), ease.linear);
    tl.add(0.4, u => scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u))), ease.outCubic);
    tl.log("duplicate = " + sim.duplicate, ctx.C.green);
    tl.wait(0.7);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model.
 * ------------------------------------------------------------------ */

function simulate(nums) {
  let slow = 0, fast = 0;
  const phase1 = [];
  let guard = 0;
  while (guard++ < 60) {
    const slowFrom = slow, fastFrom = fast;
    slow = nums[slow];
    fast = nums[nums[fast]];
    const meet = slow === fast;
    phase1.push({ slowFrom, fastFrom, slow, fast, meet });
    if (meet) break;
  }
  const intersection = slow;
  const phase2 = [];
  slow = 0;
  guard = 0;
  while (slow !== fast && guard++ < 60) {
    const slowFrom = slow, fastFrom = fast;
    slow = nums[slow];
    fast = nums[fast];
    phase2.push({ slowFrom, fastFrom, slow, fast, meet: slow === fast });
  }
  const cycleEdges = new Set();
  let node = intersection;
  let g = 0;
  while (g++ < 60) {
    const target = nums[node];
    cycleEdges.add(node + "->" + target);
    node = target;
    if (node === intersection) break;
  }
  return { phase1, phase2, duplicate: slow, cycleEdges };
}
