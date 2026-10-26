/* Product of Array Except Self — animated walkthrough scene (3Blue1Brown style).
 *
 * Two rows: the input `nums` on top, the answer `res` below. Pass 1 sweeps
 * left → right carrying the running `prefix` product and writes res[i] before
 * folding nums[i] in; pass 2 sweeps right → left multiplying in the running
 * `suffix` product. Then the finished array is revealed.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Product of Array Except Self",
    subtitle: "two passes · no division · O(n)",
    inputs: [
      { id: "nums", label: "nums", type: "text", default: "1, 2, 3, 4", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "prefix (left)" },
      { color: "#5CD0B3", text: "suffix (right)" },
      { color: "#83C167", text: "final res[i]" },
    ],
  },

  code: [
    "def product_except_self(nums: List[int]) -> List[int]:",
    "    n = len(nums)",
    "    result = [1] * n",
    "    prefix = 1",
    "    for i in range(n):",
    "        result[i] = prefix",
    "        prefix *= nums[i]",
    "    suffix = 1",
    "    for i in range(n - 1, -1, -1):",
    "        result[i] *= suffix",
    "        suffix *= nums[i]",
    "    return result",
  ],

  read(values) {
    const raw = (values.nums || "").trim();
    if (!raw) return null;
    const nums = raw.split(/[\s,]+/).filter(Boolean).map(Number);
    if (nums.length < 1 || nums.length > 8) return null;
    if (!nums.every(Number.isInteger)) return null;
    return { nums };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const nums = args[0].map(Number);
      if (nums.length >= 1 && nums.length <= 8 && nums.every(Number.isInteger)) {
        return { nums: nums.join(", ") };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, setScaleAt, STAGE_W } = ctx;
    const nums = params.nums;
    const n = nums.length;
    const sim = simulate(nums);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-teal", C.teal);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-gold", C.gold);

    const writable = ctx.makeWritable();
    const bgL = ctx.layer("bg");
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = { nums, sim, ctx, numsChips: [], resChips: [], steps: [] };
    scene._writers = [];
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // --- geometry ------------------------------------------------------
    const gap = n > 5 ? 16 : 28;
    const chipW = clamp((1000 - gap * (n - 1)) / n, 54, 130);
    const chipH = 84;
    const numsTop = 250;
    const resTop = 410;
    const totalW = n * chipW + (n - 1) * gap;
    const startX = STAGE_W / 2 - totalW / 2;
    const fontSize = clamp(chipW * 0.4, 16, 34);
    const colLeft = i => startX + i * (chipW + gap) - 12;
    scene.chipW = chipW;
    scene.colLeft = colLeft;

    // --- title ---------------------------------------------------------
    scene.title = txt("Product of Array Except Self", {
      x: 64, y: 80, "font-size": 44, fill: C.white, "letter-spacing": 1,
    }, textL);
    const sub = el("text", { x: 64, y: 118, "font-size": 22, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "res[i] = ";
    el("tspan", { fill: C.blue }, sub).textContent = "product left of i";
    el("tspan", {}, sub).textContent = "  ×  ";
    el("tspan", { fill: C.teal }, sub).textContent = "product right of i";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // --- row labels ----------------------------------------------------
    scene.numsLabel = txt("nums", {
      x: 64, y: numsTop + chipH / 2 + 8, "font-size": 24, fill: C.grey,
    }, textL);
    scene.resLabel = txt("res", {
      x: 64, y: resTop + chipH / 2 + 8, "font-size": 24, fill: C.grey,
    }, textL);
    setOpacity(scene.numsLabel, 0);
    setOpacity(scene.resLabel, 0);

    // --- column highlight spanning both rows ---------------------------
    const colHl = el("rect", {
      x: 0, y: numsTop - 12, width: chipW + 24,
      height: (resTop + chipH + 12) - (numsTop - 12), rx: 22,
      fill: C.blue, "fill-opacity": 0.06, stroke: C.blue, "stroke-opacity": 0.35,
      "stroke-width": 1.5,
    }, bgL);
    setOpacity(colHl, 0);
    setTranslate(colHl, colLeft(0), 0);
    scene.colHl = colHl;

    // --- chip helpers --------------------------------------------------
    const mkChip = (x, y) => {
      const pos = el("g", { transform: "translate(" + x + " " + y + ")" }, chipsL);
      const enter = el("g", {}, pos);
      const scale = el("g", {}, enter);
      const cx = chipW / 2, cy = chipH / 2;
      el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx: 14,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, scale);
      return { pos, enter, scale, cx, cy };
    };
    const mkValue = (fill, str, scale) => txt(str, {
      x: chipW / 2, y: chipH / 2 + 1, "text-anchor": "middle",
      "dominant-baseline": "central", "font-size": fontSize, fill,
    }, scale);

    // --- input row -----------------------------------------------------
    nums.forEach((value, i) => {
      const x = startX + i * (chipW + gap);
      const g = mkChip(x, numsTop);
      const idle = mkValue(C.white, String(value), g.scale);
      const blue = mkValue(C.blue, String(value), g.scale);
      setOpacity(blue, 0);
      const hl = el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx: 14, fill: "none",
        stroke: C.blue, "stroke-width": 3, filter: "url(#glow-blue)",
      }, g.scale);
      setOpacity(hl, 0);
      txt(String(i), {
        x: g.cx, y: -16, "text-anchor": "middle", "font-size": 18, fill: C.grey,
      }, g.enter);
      setOpacity(g.enter, 0);
      scene.numsChips.push({
        i, value, pos: g.pos, enter: g.enter, scale: g.scale, cx: g.cx, cy: g.cy,
        gx: x + g.cx, textIdle: idle, textBlue: blue, hl,
      });
    });

    // --- output row ----------------------------------------------------
    sim.result.forEach((value, i) => {
      const x = startX + i * (chipW + gap);
      const g = mkChip(x, resTop);
      const idle = mkValue(C.greyDark, "·", g.scale);
      const pre = mkValue(C.blue, String(sim.prefix[i]), g.scale);
      const fin = mkValue(C.green, String(value), g.scale);
      setOpacity(pre, 0);
      setOpacity(fin, 0);
      const flashGold = el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx: 14, fill: "none",
        stroke: C.gold, "stroke-width": 3, filter: "url(#glow-gold)",
      }, g.scale);
      const flashGreen = el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx: 14, fill: "none",
        stroke: C.green, "stroke-width": 3.5, filter: "url(#glow-green)",
      }, g.scale);
      setOpacity(flashGold, 0);
      setOpacity(flashGreen, 0);
      setOpacity(g.enter, 0);
      scene.resChips.push({
        i, value, pos: g.pos, enter: g.enter, scale: g.scale, cx: g.cx, cy: g.cy,
        gx: x + g.cx, idle, pre, fin, flashGold, flashGreen,
      });
    });

    // --- index labels between the rows ---------------------------------
    scene.indexLabels = nums.map((_, i) => {
      const lab = txt(String(i), {
        x: startX + i * (chipW + gap) + chipW / 2,
        y: (numsTop + chipH + resTop) / 2 + 7,
        "text-anchor": "middle", "font-size": 20, fill: C.grey,
      }, textL);
      setOpacity(lab, 0);
      return lab;
    });

    // --- pointer above the input row -----------------------------------
    const pointer = el("g", {}, ptrL);
    el("path", { d: "M -11 -2 L 0 16 L 11 -2 Z", fill: C.blue }, pointer);
    setOpacity(pointer, 0);
    scene.pointer = pointer;
    scene.pointerY = numsTop - 30;
    setTranslate(pointer, scene.numsChips[0].gx, scene.pointerY);

    // --- the algorithm steps the timeline narrates ---------------------
    const steps = [];
    for (let i = 0; i < n; i++) {
      steps.push({ kind: "prefix", i, value: sim.prefix[i], after: sim.prefix[i] * nums[i] });
    }
    for (let i = n - 1; i >= 0; i--) {
      steps.push({ kind: "suffix", i, value: sim.suffix[i], after: sim.suffix[i] * nums[i] });
    }
    scene.steps = steps;

    scene.readouts = steps.map(step => {
      const node = el("text", {
        x: STAGE_W / 2, y: 556, "text-anchor": "middle", "font-size": 30,
      }, textL);
      el("tspan", { fill: step.kind === "prefix" ? C.blue : C.teal }, node)
        .textContent = (step.kind === "prefix" ? "prefix = " : "suffix = ") + step.value;
      return node;
    });
    scene.statuses = steps.map(step => {
      const msg = step.kind === "prefix"
        ? "res[" + step.i + "] = " + step.value + "   (everything left of " + step.i + ")"
        : "res[" + step.i + "] = " + sim.prefix[step.i] + " × " + step.value + " = " + sim.result[step.i];
      return txt(msg, {
        x: STAGE_W / 2, y: 600, "text-anchor": "middle", "font-size": 22, fill: C.grey,
      }, textL);
    });

    // --- final answer --------------------------------------------------
    scene.result = txt("return [" + sim.result.join(", ") + "]", {
      x: STAGE_W / 2, y: 662, "text-anchor": "middle", "font-size": 40, fill: C.green,
    }, resultL);
    const rule = el("line", {
      x1: STAGE_W / 2 - 190, y1: 684, x2: STAGE_W / 2 + 190, y2: 684,
      stroke: C.green, "stroke-width": 4, "stroke-linecap": "round",
    }, resultL);
    const ruleLen = rule.getTotalLength();
    rule.setAttribute("stroke-dasharray", String(ruleLen));
    rule.setAttribute("stroke-dashoffset", String(ruleLen));
    scene.resultRule = rule;
    scene.ruleLen = ruleLen;

    // --- baseline state: the timeline replays from here ----------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.numsLabel, 0);
      setOpacity(scene.resLabel, 0);
      setOpacity(scene.colHl, 0);
      setTranslate(scene.colHl, colLeft(0), 0);
      for (const ch of scene.numsChips) {
        setOpacity(ch.enter, 0);
        ch.enter.setAttribute("transform", "translate(0 0)");
        setScaleAt(ch.scale, ch.cx, ch.cy, 1);
        setOpacity(ch.textIdle, 1);
        setOpacity(ch.textBlue, 0);
        setOpacity(ch.hl, 0);
      }
      for (const ch of scene.resChips) {
        setOpacity(ch.enter, 0);
        ch.enter.setAttribute("transform", "translate(0 0)");
        setScaleAt(ch.scale, ch.cx, ch.cy, 1);
        setOpacity(ch.idle, 1);
        setOpacity(ch.pre, 0);
        setOpacity(ch.fin, 0);
        setOpacity(ch.flashGold, 0);
        setOpacity(ch.flashGreen, 0);
      }
      for (const lab of scene.indexLabels) setOpacity(lab, 0);
      setOpacity(scene.pointer, 0);
      setTranslate(scene.pointer, scene.numsChips[0].gx, scene.pointerY);
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt } = ctx;
    const { nums, steps } = scene;

    // --- intro ---------------------------------------------------------
    tl.line(1);
    tl.add(0.7, scene.writer(scene.title), ease.outCubic);
    tl.line(2);
    tl.add(0.4, u => setOpacity(scene.subtitle, u), ease.outCubic);
    tl.add(0.4, u => {
      setOpacity(scene.numsLabel, u);
      setOpacity(scene.resLabel, u);
    }, ease.outCubic);
    scene.numsChips.forEach(ch => {
      tl.add(0.3, u => {
        setOpacity(ch.enter, u);
        ch.enter.setAttribute("transform", "translate(0 " + (1 - u) * 16 + ")");
      }, ease.outCubic);
      tl.wait(0.05);
    });
    scene.indexLabels.forEach(lab => {
      tl.add(0.22, u => setOpacity(lab, u), ease.outCubic);
    });
    tl.line(3);
    scene.resChips.forEach(ch => {
      tl.add(0.26, u => {
        setOpacity(ch.enter, u);
        ch.enter.setAttribute("transform", "translate(0 " + (1 - u) * 16 + ")");
      }, ease.outCubic);
      tl.wait(0.04);
    });
    tl.add(0.3, u => {
      setOpacity(scene.colHl, u);
      setOpacity(scene.pointer, u);
    }, ease.outCubic);
    tl.line(4);
    tl.wait(0.3);

    // --- walk the passes ----------------------------------------------
    let prevReadout = null, prevStatus = null;

    steps.forEach((step, si) => {
      const nchip = scene.numsChips[step.i];
      const rchip = scene.resChips[step.i];

      const isFirstSuffix = step.kind === "suffix" && (si === 0 || steps[si - 1].kind !== "suffix");
      if (isFirstSuffix) tl.line(8);
      else tl.line(step.kind === "prefix" ? 5 : 9);
      // glide the column highlight + pointer to this index
      if (si > 0) {
        const prevStep = steps[si - 1];
        const fromX = scene.colLeft(prevStep.i);
        const toX = scene.colLeft(step.i);
        const fromGx = scene.numsChips[prevStep.i].gx;
        tl.add(0.5, u => {
          setTranslate(scene.colHl, fromX + (toX - fromX) * u, 0);
          setTranslate(scene.pointer, fromGx + (nchip.gx - fromGx) * u, scene.pointerY);
        }, ease.inOutSine);
      }

      if (isFirstSuffix) tl.line(9);
      // swap in this step's running-value readout and status line
      const fadingReadout = prevReadout;
      const fadingStatus = prevStatus;
      if (fadingReadout) tl.add(0.22, u => setOpacity(fadingReadout, 1 - u), ease.outCubic);
      if (fadingStatus) tl.add(0.2, u => setOpacity(fadingStatus, 1 - u), ease.outCubic);
      tl.add(0.5, scene.writer(scene.readouts[si]), ease.linear);
      tl.add(0.45, scene.writer(scene.statuses[si]), ease.linear);

      if (step.kind === "prefix") {
        // light the current input cell
        tl.add(0.35, u => {
          setOpacity(nchip.textIdle, 1 - u);
          setOpacity(nchip.textBlue, u);
          setOpacity(nchip.hl, u);
        }, ease.outCubic);
        // write the prefix product into res[i]
        tl.line(6);
        tl.add(0.5, u => {
          setOpacity(rchip.idle, 1 - u);
          setOpacity(rchip.pre, u);
          setOpacity(rchip.flashGold, Math.sin(Math.PI * u) * 0.9);
        }, ease.outCubic);
        tl.add(0.4, u => setScaleAt(rchip.scale, rchip.cx, rchip.cy, 1 + 0.06 * Math.sin(Math.PI * u)), ease.linear);
        // fold the input cell into the running prefix
        tl.line(7);
        tl.add(0.35, u => {
          setOpacity(nchip.textBlue, 1 - u);
          setOpacity(nchip.textIdle, 1 - 0.6 * u);
          setOpacity(nchip.hl, 1 - u);
        }, ease.outCubic);
        tl.wait(0.12);
      } else {
        // multiply the suffix product in and finalize res[i]
        tl.line(10);
        tl.add(0.55, u => {
          setOpacity(rchip.pre, 1 - u);
          setOpacity(rchip.fin, u);
          setOpacity(rchip.flashGreen, Math.sin(Math.PI * u) * 0.95);
        }, ease.outCubic);
        tl.add(0.45, u => setScaleAt(rchip.scale, rchip.cx, rchip.cy, 1 + 0.07 * Math.sin(Math.PI * u)), ease.linear);
        tl.line(11);
        tl.wait(0.15);
      }

      prevReadout = scene.readouts[si];
      prevStatus = scene.statuses[si];
    });

    // --- finale --------------------------------------------------------
    tl.line(12);
    const finalReadout = prevReadout;
    const finalStatus = prevStatus;
    if (finalReadout) tl.add(0.35, u => setOpacity(finalReadout, 1 - u), ease.outCubic);
    if (finalStatus) tl.add(0.35, u => setOpacity(finalStatus, 1 - u), ease.outCubic);
    tl.add(0.3, u => {
      setOpacity(scene.pointer, 1 - u);
      setOpacity(scene.colHl, 1 - u);
    }, ease.outCubic);
    tl.add(0.5, u => {
      for (const ch of scene.resChips) setScaleAt(ch.scale, ch.cx, ch.cy, 1 + 0.05 * Math.sin(Math.PI * u));
    }, ease.linear);
    tl.add(0.7, scene.writer(scene.result), ease.linear);
    tl.add(0.45, u => {
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u)));
    }, ease.outCubic);
    tl.wait(1.4);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model: the frames the animation narrates.
 * ------------------------------------------------------------------ */

function simulate(nums) {
  const n = nums.length;
  const prefix = new Array(n), suffix = new Array(n), result = new Array(n);
  let run = 1;
  for (let i = 0; i < n; i++) { prefix[i] = run; run *= nums[i]; }
  run = 1;
  for (let i = n - 1; i >= 0; i--) { suffix[i] = run; run *= nums[i]; }
  for (let i = 0; i < n; i++) result[i] = prefix[i] * suffix[i];
  return { prefix, suffix, result };
}
