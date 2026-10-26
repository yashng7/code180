/* Two Sum — animated walkthrough scene (3Blue1Brown style).
 *
 * Sweep left to right, computing `complement = target - nums[i]` at each step
 * and checking whether it is already in the `seen` hash map. On a hit, both
 * elements glow green, an arc ties the pair together, and the indices are
 * returned.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Two Sum",
    subtitle: "one pass · hash map · O(n)",
    inputs: [
      { id: "nums", label: "nums", type: "text", default: "2, 7, 11, 15", width: "wide" },
      { id: "target", label: "target", type: "number", default: 9, width: "narrow" },
    ],
    legend: [
      { color: "#58C4DD", text: "current" },
      { color: "#F0AC5F", text: "complement" },
      { color: "#5CD0B3", text: "in seen" },
      { color: "#83C167", text: "match" },
    ],
  },

  code: [
    "def two_sum(nums: List[int], target: int) -> List[int]:",
    "    seen: dict[int, int] = {}",
    "    for index, value in enumerate(nums):",
    "        complement = target - value",
    "        if complement in seen:",
    "            return [seen[complement], index]",
    "        seen[value] = index",
    "    return []",
  ],

  read(values) {
    const raw = (values.nums || "").trim();
    if (!raw) return null;
    const nums = raw.split(/[\s,]+/).filter(Boolean).map(Number);
    const target = Number(values.target);
    if (nums.length < 1 || nums.length > 24) return null;
    if (!nums.every(Number.isInteger) || !Number.isInteger(target)) return null;
    return { nums, target };
  },

  fromArgs(args) {
    if (Array.isArray(args) && args.length >= 2 && Array.isArray(args[0])) {
      const nums = args[0].map(Number);
      const target = Number(args[1]);
      if (nums.length && nums.every(Number.isFinite) && Number.isFinite(target)) {
        return { nums: nums.join(", "), target: String(target) };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, setScaleAt, STAGE_W } = ctx;
    const { nums, target } = params;
    const n = nums.length;
    const sim = simulate(nums, target);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-gold", C.gold);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const ptrL = ctx.layer("pointer");
    const arcL = ctx.layer("arcs");
    const resultL = ctx.layer("result");

    const scene = { nums, target, sim, ctx, chips: [], seenChips: [], _writers: [] };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // title + subtitle
    scene.title = txt("Two Sum", {
      x: 64, y: 80, "font-size": 46, fill: C.white, "letter-spacing": 1,
    }, textL);
    const sub = el("text", { x: 64, y: 118, "font-size": 23, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "nums = ";
    el("tspan", { fill: C.white }, sub).textContent = "[" + nums.join(", ") + "]";
    el("tspan", {}, sub).textContent = " · target = ";
    el("tspan", { fill: C.gold }, sub).textContent = String(target);
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // array chips
    const gap = n > 10 ? 10 : 18;
    const chipW = clamp((1120 - gap * (n - 1)) / n, 34, 96);
    const chipH = 92;
    const chipTop = 250;
    const totalW = n * chipW + (n - 1) * gap;
    const startX = STAGE_W / 2 - totalW / 2;
    const fontSize = clamp(chipW * 0.42, 13, 36);
    scene.chipW = chipW;
    scene.chipH = chipH;
    scene.chipTop = chipTop;

    nums.forEach((value, i) => {
      const x = startX + i * (chipW + gap);
      const pos = el("g", { transform: "translate(" + x + " " + chipTop + ")" }, chipsL);
      const enter = el("g", {}, pos);
      const scale = el("g", {}, enter);
      const cx = chipW / 2, cy = chipH / 2;
      const rx = Math.min(16, chipW * 0.3);
      el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, scale);
      const mkText = fill => txt(String(value), {
        x: cx, y: cy + 1, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": fontSize, fill,
      }, scale);
      const idle = mkText(C.white);
      const blue = mkText(C.blue);
      const green = mkText(C.green);
      setOpacity(blue, 0);
      setOpacity(green, 0);
      const hlBlue = el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx, fill: "none",
        stroke: C.blue, "stroke-width": 3, filter: "url(#glow-blue)",
      }, scale);
      const hlGreen = el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx, fill: "none",
        stroke: C.green, "stroke-width": 3.5, filter: "url(#glow-green)",
      }, scale);
      setOpacity(hlBlue, 0);
      setOpacity(hlGreen, 0);
      txt(String(i), {
        x: cx, y: -18, "text-anchor": "middle", "font-size": 18, fill: C.grey,
      }, enter);
      setOpacity(enter, 0);
      scene.chips.push({
        i, value, pos, enter, scale, cx, cy, rx,
        textIdle: idle, textBlue: blue, textGreen: green, hlBlue, hlGreen,
        gx: x + cx, top: chipTop, bottom: chipTop + chipH,
      });
    });

    // pointer arrow
    const pointer = el("g", {}, ptrL);
    el("line", {
      x1: 0, y1: 66, x2: 0, y2: 30,
      stroke: C.blue, "stroke-width": 3.5, "stroke-linecap": "round",
    }, pointer);
    el("path", { d: "M -10 32 L 0 4 L 10 32 Z", fill: C.blue }, pointer);
    setOpacity(pointer, 0);
    scene.pointer = pointer;
    scene.pointerY = chipTop + chipH;
    setTranslate(pointer, scene.chips[0].gx - 46, scene.pointerY);
    scene.pointerLabels = nums.map((_, i) => {
      const lab = txt("i = " + i, {
        x: 0, y: 92, "text-anchor": "middle", "font-size": 18, fill: C.grey,
      }, pointer);
      setOpacity(lab, 0);
      return lab;
    });

    // per-step complement equations
    scene.equations = sim.steps.map(step => {
      const eq = el("text", {
        x: STAGE_W / 2, y: 468, "text-anchor": "middle", "font-size": 30,
      }, textL);
      const part = (str, fill) => {
        const t = el("tspan", fill ? { fill } : {}, eq);
        t.textContent = str;
      };
      part("complement = ", C.grey);
      part(String(target), C.gold);
      part(" − ", C.grey);
      part(String(step.value), C.blue);
      part(" = ", C.grey);
      part(String(step.complement), C.gold);
      return eq;
    });

    // per-step status lines
    scene.statuses = sim.steps.map(step => {
      const message = step.found
        ? step.complement + " is in seen at index " + step.mate + "  ✓"
        : step.complement + " not in seen → record " + step.value + " : " + step.i;
      return txt(message, {
        x: STAGE_W / 2, y: 512, "text-anchor": "middle", "font-size": 21,
        fill: step.found ? C.green : C.grey,
      }, textL);
    });

    // seen hash map
    scene.seenCaption = txt("seen", {
      x: STAGE_W / 2, y: 554, "text-anchor": "middle", "font-size": 21, fill: C.grey,
    }, textL);
    setOpacity(scene.seenCaption, 0);

    const inserts = sim.steps.filter(s => !s.found);
    const m = Math.max(inserts.length, 1);
    const seenW = clamp((1024 - 10 * (m - 1)) / m, 52, 124);
    const seenGap = 10;
    const seenTotal = m * seenW + (m - 1) * seenGap;
    const seenStart = STAGE_W / 2 - seenTotal / 2;
    const seenTop = 574;
    const seenH = 46;
    const seenFont = clamp(seenW * 0.25, 11, 21);

    scene.seenChips = inserts.map((step, slot) => {
      const x = seenStart + slot * (seenW + seenGap);
      const pos = el("g", { transform: "translate(" + x + " " + seenTop + ")" }, chipsL);
      const enter = el("g", {}, pos);
      const scale = el("g", {}, enter);
      const cx = seenW / 2, cy = seenH / 2;
      el("rect", {
        x: 0, y: 0, width: seenW, height: seenH, rx: 11,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, scale);
      const mkText = fill => txt(step.value + " : " + step.i, {
        x: cx, y: cy + 1, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": seenFont, fill,
      }, scale);
      const idle = mkText(C.teal);
      const green = mkText(C.green);
      setOpacity(green, 0);
      const flash = el("rect", {
        x: 0, y: 0, width: seenW, height: seenH, rx: 11, fill: "none",
        stroke: C.gold, "stroke-width": 3, filter: "url(#glow-gold)",
      }, scale);
      const match = el("rect", {
        x: 0, y: 0, width: seenW, height: seenH, rx: 11, fill: "none",
        stroke: C.green, "stroke-width": 3.5, filter: "url(#glow-green)",
      }, scale);
      setOpacity(flash, 0);
      setOpacity(match, 0);
      setOpacity(enter, 0);
      return {
        step, pos, enter, scale, cx, cy, x, slot,
        textIdle: idle, textGreen: green, flash, match, gx: x + cx,
      };
    });

    if (sim.foundAt >= 0) {
      const last = sim.steps[sim.steps.length - 1];
      const a = scene.chips[last.mate];
      const b = scene.chips[last.i];
      const y = chipTop - 4;
      const dx = Math.abs(b.gx - a.gx);
      const ctrlY = chipTop - clamp(95 + dx * 0.22, 95, 215);
      const path = el("path", {
        d: "M " + a.gx + " " + y + " Q " + ((a.gx + b.gx) / 2) + " " + ctrlY + " " + b.gx + " " + y,
        fill: "none", stroke: C.green, "stroke-width": 3.5, "stroke-linecap": "round",
      }, arcL);
      const len = path.getTotalLength();
      path.setAttribute("stroke-dasharray", String(len));
      path.setAttribute("stroke-dashoffset", String(len));
      const label = txt(a.value + " + " + b.value + " = " + target, {
        x: (a.gx + b.gx) / 2, y: (y + ctrlY) / 2 - 24,
        "text-anchor": "middle", "font-size": 30, fill: C.green,
      }, arcL);
      scene.arc = { path, len, label };
    }

    const found = sim.foundAt >= 0;
    const lastStep = sim.steps[sim.steps.length - 1];
    scene.result = txt(
      found ? "return [" + lastStep.mate + ", " + lastStep.i + "]" : "return []",
      {
        x: STAGE_W / 2, y: 678, "text-anchor": "middle", "font-size": 42,
        fill: found ? C.green : C.grey,
      }, resultL);
    const rule = el("line", {
      x1: STAGE_W / 2 - 150, y1: 698, x2: STAGE_W / 2 + 150, y2: 698,
      stroke: found ? C.green : C.greyDark, "stroke-width": 4, "stroke-linecap": "round",
    }, resultL);
    const ruleLen = rule.getTotalLength();
    rule.setAttribute("stroke-dasharray", String(ruleLen));
    rule.setAttribute("stroke-dashoffset", String(ruleLen));
    scene.resultRule = rule;
    scene.ruleLen = ruleLen;

    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.seenCaption, 0);
      for (const chip of scene.chips) {
        setOpacity(chip.enter, 0);
        chip.enter.setAttribute("transform", "translate(0 0)");
        setScaleAt(chip.scale, chip.cx, chip.cy, 1);
        setOpacity(chip.textIdle, 1);
        setOpacity(chip.textBlue, 0);
        setOpacity(chip.textGreen, 0);
        setOpacity(chip.hlBlue, 0);
        setOpacity(chip.hlGreen, 0);
      }
      setOpacity(scene.pointer, 0);
      setTranslate(scene.pointer, scene.chips[0].gx - 46, scene.pointerY);
      for (const label of scene.pointerLabels) setOpacity(label, 0);
      for (const sc of scene.seenChips) {
        setOpacity(sc.enter, 0);
        setScaleAt(sc.scale, sc.cx, sc.cy, 1);
        setOpacity(sc.textIdle, 1);
        setOpacity(sc.textGreen, 0);
        setOpacity(sc.flash, 0);
        setOpacity(sc.match, 0);
      }
      if (scene.arc) scene.arc.path.setAttribute("stroke-dashoffset", String(scene.arc.len));
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt } = ctx;
    const { nums, sim } = scene;

    tl.line(1);
    tl.add(0.6, scene.writer(scene.title), ease.outCubic);
    tl.add(0.4, u => setOpacity(scene.subtitle, u), ease.outCubic);
    nums.forEach((_, i) => {
      const chip = scene.chips[i];
      tl.add(0.4, u => {
        setOpacity(chip.enter, u);
        chip.enter.setAttribute("transform", "translate(0 " + (1 - u) * 18 + ")");
      }, ease.outCubic);
      tl.wait(0.07);
    });
    tl.line(2);
    tl.add(0.4, u => setOpacity(scene.seenCaption, u), ease.outCubic);

    let prevEq = null, prevStatus = null, prevLabel = null;
    const seenUpTo = [];

    sim.steps.forEach((step, si) => {
      const chip = scene.chips[step.i];
      const prevChip = step.i > 0 ? scene.chips[step.i - 1] : null;

      tl.line(3);
      if (prevChip) {
        tl.add(0.35, u => {
          setOpacity(prevChip.textBlue, 1 - u);
          setOpacity(prevChip.textIdle, u);
          setOpacity(prevChip.hlBlue, 1 - u);
        }, ease.outCubic);
      }

      if (si === 0) {
        tl.add(0.45, u => {
          setOpacity(scene.pointer, u);
          setTranslate(scene.pointer, chip.gx - 46 * (1 - u), scene.pointerY);
        }, ease.outCubic);
      } else {
        const from = scene.chips[step.i - 1].gx;
        tl.add(0.5, u => setTranslate(scene.pointer, from + (chip.gx - from) * u, scene.pointerY), ease.inOutSine);
      }
      const label = scene.pointerLabels[step.i];
      const fadingLabel = prevLabel;
      tl.add(0.3, u => {
        if (fadingLabel) setOpacity(fadingLabel, 1 - u);
        setOpacity(label, u);
      }, ease.linear);

      tl.add(0.4, u => {
        setOpacity(chip.textIdle, 1 - u);
        setOpacity(chip.textBlue, u);
        setOpacity(chip.hlBlue, u);
      }, ease.outCubic);
      tl.add(0.5, u => setScaleAt(chip.scale, chip.cx, chip.cy, 1 + 0.06 * Math.sin(Math.PI * u)), ease.linear);

      tl.line(4);
      const fadingEq = prevEq;
      if (fadingEq) tl.add(0.22, u => setOpacity(fadingEq, 1 - u), ease.outCubic);
      tl.add(0.7, scene.writer(scene.equations[si]), ease.linear);

      tl.line(step.found ? 5 : [5, 7]);
      const fadingStatus = prevStatus;
      if (fadingStatus) tl.add(0.18, u => setOpacity(fadingStatus, 1 - u), ease.outCubic);
      tl.add(0.5, scene.writer(scene.statuses[si]), ease.linear);

      const flashDur = seenUpTo.length > 6 ? 0.07 : 0.12;

      if (step.found) {
        for (const sc of seenUpTo) {
          tl.add(flashDur, u => setOpacity(sc.flash, Math.sin(Math.PI * u)), ease.linear);
          if (sc.step.value === step.complement) break;
        }
        const matchChip = seenUpTo.find(sc => sc.step.value === step.complement);
        tl.add(0.35, u => {
          setOpacity(matchChip.match, u);
          setOpacity(matchChip.textGreen, u);
          setOpacity(matchChip.textIdle, 1 - u);
        }, ease.outCubic);
        tl.add(0.5, u => setScaleAt(matchChip.scale, matchChip.cx, matchChip.cy, 1 + 0.09 * Math.sin(Math.PI * u)), ease.linear);

        tl.add(0.25, u => setOpacity(scene.statuses[si], 1 - u), ease.outCubic);
        tl.add(0.25, u => setOpacity(scene.equations[si], 1 - u), ease.outCubic);
        tl.add(0.3, u => setOpacity(scene.pointer, 1 - u), ease.outCubic);

        tl.line(6);
        const mateChip = scene.chips[step.mate];
        tl.add(0.45, u => {
          setOpacity(mateChip.textIdle, 1 - u);
          setOpacity(mateChip.textGreen, u);
          setOpacity(mateChip.hlGreen, u);
        }, ease.outCubic);
        tl.add(0.45, u => {
          setOpacity(chip.textBlue, 1 - u);
          setOpacity(chip.textGreen, u);
          setOpacity(chip.hlBlue, 1 - u);
          setOpacity(chip.hlGreen, u);
        }, ease.outCubic);
        tl.add(0.5, u => {
          const pop = 1 + 0.07 * Math.sin(Math.PI * u);
          setScaleAt(mateChip.scale, mateChip.cx, mateChip.cy, pop);
          setScaleAt(chip.scale, chip.cx, chip.cy, pop);
        }, ease.linear);

        tl.add(0.65, u => {
          scene.arc.path.setAttribute("stroke-dashoffset", String(scene.arc.len * (1 - u)));
        }, ease.inOutSine);
        tl.add(0.6, scene.writer(scene.arc.label), ease.linear);
        tl.add(0.75, scene.writer(scene.result), ease.linear);
        tl.add(0.45, u => {
          scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u)));
        }, ease.outCubic);
        tl.wait(1.6);
      } else {
        tl.line(5);
        for (const sc of seenUpTo) {
          tl.add(flashDur, u => setOpacity(sc.flash, Math.sin(Math.PI * u)), ease.linear);
        }
        tl.line(7);
        const sc = scene.seenChips[seenUpTo.length];
        if (sc) {
          seenUpTo.push(sc);
          tl.add(0.55, u => {
            setOpacity(sc.enter, Math.min(1, u * 2));
            setScaleAt(sc.scale, sc.cx, sc.cy, u);
          }, ease.outBack);
          tl.add(0.35, u => setOpacity(sc.flash, Math.sin(Math.PI * Math.min(u, 1))), ease.linear);
        }
      }

      prevEq = scene.equations[si];
      prevStatus = scene.statuses[si];
      prevLabel = label;
    });

    if (sim.foundAt < 0) {
      tl.line(8);
      tl.add(0.4, u => {
        for (let i = 0; i < scene.chips.length; i++) setOpacity(scene.chips[i].enter, 1 - 0.55 * u);
      }, ease.outCubic);
      tl.add(0.6, scene.writer(scene.result), ease.linear);
      tl.add(0.45, u => {
        scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u)));
      }, ease.outCubic);
      tl.wait(1.4);
    }

    return tl.finish();
  },
};

function simulate(nums, target) {
  const seen = new Map();
  const steps = [];
  for (let i = 0; i < nums.length; i++) {
    const value = nums[i];
    const complement = target - value;
    if (seen.has(complement)) {
      steps.push({ i, value, complement, mate: seen.get(complement), found: true });
      return { steps, foundAt: i };
    }
    steps.push({ i, value, complement, mate: -1, found: false });
    seen.set(value, i);
  }
  return { steps, foundAt: -1 };
}
