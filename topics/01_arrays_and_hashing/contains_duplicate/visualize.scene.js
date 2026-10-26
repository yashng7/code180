/* Contains Duplicate — animated walkthrough scene (3Blue1Brown style).
 *
 * Sweep left to right, lighting the current element and growing a `seen`
 * hash set. The first value we meet twice stops the scan: both copies glow
 * red, an arc ties them together, and the answer is True.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Contains Duplicate",
    subtitle: "one pass · hash set · O(n)",
    inputs: [
      { id: "nums", label: "nums", type: "text", default: "1, 2, 3, 1", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "current" },
      { color: "#5CD0B3", text: "in seen" },
      { color: "#FC6255", text: "duplicate" },
    ],
  },

  code: [
    "def contains_duplicate(nums: List[int]) -> bool:",
    "    seen: set[int] = set()",
    "    for value in nums:",
    "        if value in seen:",
    "            return True",
    "        seen.add(value)",
    "    return False",
  ],

  read(values) {
    const raw = (values.nums || "").trim();
    if (!raw) return null;
    const nums = raw.split(/[\s,]+/).filter(Boolean).map(Number);
    if (nums.length < 1 || nums.length > 24) return null;
    if (!nums.every(Number.isInteger)) return null;
    return { nums };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const nums = args[0].map(Number);
      if (nums.length && nums.every(Number.isFinite)) return { nums: nums.join(", ") };
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
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-red", C.red);
    ctx.glow("glow-gold", C.gold);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const ptrL = ctx.layer("pointer");
    const arcL = ctx.layer("arcs");
    const resultL = ctx.layer("result");

    const scene = { nums, sim, ctx, chips: [], seenChips: [] };
    scene._writers = [];
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // title + subtitle
    scene.title = txt("Contains Duplicate", {
      x: 64, y: 80, "font-size": 46, fill: C.white, "letter-spacing": 1,
    }, textL);
    const sub = el("text", { x: 64, y: 118, "font-size": 23, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "nums = ";
    el("tspan", { fill: C.white }, sub).textContent = "[" + nums.join(", ") + "]";
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
      const red = mkText(C.red);
      setOpacity(blue, 0);
      setOpacity(red, 0);
      const hlBlue = el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx, fill: "none",
        stroke: C.blue, "stroke-width": 3, filter: "url(#glow-blue)",
      }, scale);
      const hlRed = el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx, fill: "none",
        stroke: C.red, "stroke-width": 3.5, filter: "url(#glow-red)",
      }, scale);
      setOpacity(hlBlue, 0);
      setOpacity(hlRed, 0);
      txt(String(i), {
        x: cx, y: -18, "text-anchor": "middle", "font-size": 18, fill: C.grey,
      }, enter);
      setOpacity(enter, 0);
      scene.chips.push({
        i, value, pos, enter, scale, cx, cy, rx,
        textIdle: idle, textBlue: blue, textRed: red, hlBlue, hlRed,
        gx: x + cx, top: chipTop, bottom: chipTop + chipH,
      });
    });

    // pointer arrow (glides between chips)
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

    // per-step membership question:  is <value> in seen?
    scene.lookups = sim.steps.map(step => {
      const node = el("text", {
        x: STAGE_W / 2, y: 468, "text-anchor": "middle", "font-size": 30,
      }, textL);
      const part = (str, fill) => {
        const t = el("tspan", fill ? { fill } : {}, node);
        t.textContent = str;
      };
      part("is ", C.grey);
      part(String(step.value), C.blue);
      part(" in seen?", C.grey);
      return node;
    });

    // per-step status line
    scene.statuses = sim.steps.map(step => {
      const message = step.hit
        ? step.value + " already in seen → duplicate!"
        : step.value + " not in seen → add it";
      return txt(message, {
        x: STAGE_W / 2, y: 512, "text-anchor": "middle", "font-size": 21,
        fill: step.hit ? C.red : C.grey,
      }, textL);
    });

    // seen hash set
    scene.seenCaption = txt("seen", {
      x: STAGE_W / 2, y: 554, "text-anchor": "middle", "font-size": 21, fill: C.grey,
    }, textL);
    setOpacity(scene.seenCaption, 0);

    const inserts = sim.steps.filter(s => !s.hit);
    const m = Math.max(inserts.length, 1);
    const seenW = clamp((1024 - 10 * (m - 1)) / m, 36, 92);
    const seenGap = 10;
    const seenTotal = m * seenW + (m - 1) * seenGap;
    const seenStart = STAGE_W / 2 - seenTotal / 2;
    const seenTop = 574;
    const seenH = 46;
    const seenFont = clamp(seenW * 0.42, 11, 22);
    scene.seenW = seenW;

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
      const mkText = fill => txt(String(step.value), {
        x: cx, y: cy + 1, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": seenFont, fill,
      }, scale);
      const idle = mkText(C.teal);
      const red = mkText(C.red);
      setOpacity(red, 0);
      const flash = el("rect", {
        x: 0, y: 0, width: seenW, height: seenH, rx: 11, fill: "none",
        stroke: C.gold, "stroke-width": 3, filter: "url(#glow-gold)",
      }, scale);
      const match = el("rect", {
        x: 0, y: 0, width: seenW, height: seenH, rx: 11, fill: "none",
        stroke: C.red, "stroke-width": 3.5, filter: "url(#glow-red)",
      }, scale);
      setOpacity(flash, 0);
      setOpacity(match, 0);
      setOpacity(enter, 0);
      return {
        step, pos, enter, scale, cx, cy, x, slot,
        textIdle: idle, textRed: red, flash, match, gx: x + cx,
      };
    });

    // connecting arc + equality label (only when a duplicate exists)
    if (sim.hitAt >= 0) {
      const hitStep = sim.steps[sim.hitAt];
      const dup = scene.seenChips.find(sc => sc.step.value === hitStep.value);
      const b = scene.chips[hitStep.i];
      const a = dup ? { gx: dup.gx } : { gx: b.gx };
      const y = chipTop - 4;
      const dx = Math.abs(b.gx - a.gx);
      const ctrlY = chipTop - clamp(95 + dx * 0.22, 95, 215);
      const path = el("path", {
        d: "M " + a.gx + " " + y + " Q " + ((a.gx + b.gx) / 2) + " " + ctrlY + " " + b.gx + " " + y,
        fill: "none", stroke: C.red, "stroke-width": 3.5, "stroke-linecap": "round",
      }, arcL);
      const len = path.getTotalLength();
      path.setAttribute("stroke-dasharray", String(len));
      path.setAttribute("stroke-dashoffset", String(len));
      const label = txt(hitStep.value + " = " + hitStep.value, {
        x: (a.gx + b.gx) / 2, y: (y + ctrlY) / 2 - 24,
        "text-anchor": "middle", "font-size": 30, fill: C.red,
      }, arcL);
      scene.arc = { path, len, label, dup };
    }

    // result + underline
    const dup = sim.hitAt >= 0;
    scene.result = txt(dup ? "return True" : "return False", {
      x: STAGE_W / 2, y: 678, "text-anchor": "middle", "font-size": 42,
      fill: dup ? C.green : C.grey,
    }, resultL);
    const rule = el("line", {
      x1: STAGE_W / 2 - 150, y1: 698, x2: STAGE_W / 2 + 150, y2: 698,
      stroke: dup ? C.green : C.greyDark, "stroke-width": 4, "stroke-linecap": "round",
    }, resultL);
    const ruleLen = rule.getTotalLength();
    rule.setAttribute("stroke-dasharray", String(ruleLen));
    rule.setAttribute("stroke-dashoffset", String(ruleLen));
    scene.resultRule = rule;
    scene.ruleLen = ruleLen;

    // --- baseline state: the timeline replays from here on every render ---
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
        setOpacity(chip.textRed, 0);
        setOpacity(chip.hlBlue, 0);
        setOpacity(chip.hlRed, 0);
      }
      setOpacity(scene.pointer, 0);
      setTranslate(scene.pointer, scene.chips[0].gx - 46, scene.pointerY);
      for (const label of scene.pointerLabels) setOpacity(label, 0);
      for (const node of scene.lookups) setOpacity(node, 0);
      for (const node of scene.statuses) setOpacity(node, 0);
      for (const sc of scene.seenChips) {
        setOpacity(sc.enter, 0);
        setScaleAt(sc.scale, sc.cx, sc.cy, 1);
        setOpacity(sc.textIdle, 1);
        setOpacity(sc.textRed, 0);
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

    // --- intro --------------------------------------------------------
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

    // --- walk the array ----------------------------------------------
    let prevLookup = null, prevStatus = null, prevLabel = null;
    const seenUpTo = [];

    sim.steps.forEach((step, si) => {
      const chip = scene.chips[step.i];
      const prevChip = step.i > 0 ? scene.chips[step.i - 1] : null;

      tl.line(3);
      if (prevChip && !sim.steps[si - 1].hit) {
        tl.add(0.35, u => {
          setOpacity(prevChip.textBlue, 1 - u);
          setOpacity(prevChip.textIdle, u);
          setOpacity(prevChip.hlBlue, 1 - u);
        }, ease.outCubic);
      }

      // pointer glides to this element
      if (si === 0) {
        tl.add(0.45, u => {
          setOpacity(scene.pointer, u);
          setTranslate(scene.pointer, chip.gx - 46 * (1 - u), scene.pointerY);
        }, ease.outCubic);
      } else {
        const from = scene.chips[sim.steps[si - 1].i].gx;
        tl.add(0.5, u => setTranslate(scene.pointer, from + (chip.gx - from) * u, scene.pointerY), ease.inOutSine);
      }
      const label = scene.pointerLabels[step.i];
      const fadingLabel = prevLabel;
      tl.add(0.3, u => {
        if (fadingLabel) setOpacity(fadingLabel, 1 - u);
        setOpacity(label, u);
      }, ease.linear);

      // current element lights up and pulses
      tl.add(0.4, u => {
        setOpacity(chip.textIdle, 1 - u);
        setOpacity(chip.textBlue, u);
        setOpacity(chip.hlBlue, u);
      }, ease.outCubic);
      tl.add(0.5, u => setScaleAt(chip.scale, chip.cx, chip.cy, 1 + 0.06 * Math.sin(Math.PI * u)), ease.linear);

      // question + status for this step
      tl.line(4);
      const fadingLookup = prevLookup;
      if (fadingLookup) tl.add(0.22, u => setOpacity(fadingLookup, 1 - u), ease.outCubic);
      tl.add(0.7, scene.writer(scene.lookups[si]), ease.linear);
      const fadingStatus = prevStatus;
      if (fadingStatus) tl.add(0.18, u => setOpacity(fadingStatus, 1 - u), ease.outCubic);
      tl.add(0.5, scene.writer(scene.statuses[si]), ease.linear);

      const flashDur = seenUpTo.length > 6 ? 0.07 : 0.12;

      if (step.hit) {
        // glance across the set, then lock onto the repeat
        for (const sc of seenUpTo) {
          tl.add(flashDur, u => setOpacity(sc.flash, Math.sin(Math.PI * u)), ease.linear);
          if (sc.step.value === step.value) break;
        }
        const matchChip = seenUpTo.find(sc => sc.step.value === step.value);
        if (matchChip) {
          tl.add(0.35, u => {
            setOpacity(matchChip.match, u);
            setOpacity(matchChip.textRed, u);
            setOpacity(matchChip.textIdle, 1 - u);
          }, ease.outCubic);
          tl.add(0.5, u => setScaleAt(matchChip.scale, matchChip.cx, matchChip.cy, 1 + 0.09 * Math.sin(Math.PI * u)), ease.linear);
        }

        // --- finale: both copies, arc, result ------------------------
        tl.line(5);
        tl.add(0.25, u => setOpacity(scene.statuses[si], 1 - u), ease.outCubic);
        tl.add(0.25, u => setOpacity(scene.lookups[si], 1 - u), ease.outCubic);
        tl.add(0.3, u => setOpacity(scene.pointer, 1 - u), ease.outCubic);

        tl.add(0.45, u => {
          setOpacity(chip.textBlue, 1 - u);
          setOpacity(chip.textRed, u);
          setOpacity(chip.hlBlue, 1 - u);
          setOpacity(chip.hlRed, u);
        }, ease.outCubic);
        tl.add(0.5, u => setScaleAt(chip.scale, chip.cx, chip.cy, 1 + 0.07 * Math.sin(Math.PI * u)), ease.linear);

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
        // glance across the set, then insert
        for (const sc of seenUpTo) {
          tl.add(flashDur, u => setOpacity(sc.flash, Math.sin(Math.PI * u)), ease.linear);
        }
        tl.line(6);
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

      prevLookup = scene.lookups[si];
      prevStatus = scene.statuses[si];
      prevLabel = label;
    });

    // --- no duplicate: dim everything, show the False result ----------
    if (sim.hitAt < 0) {
      tl.line(7);
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

/* ------------------------------------------------------------------ *
 * Pure algorithm model: the frames the animation narrates.
 * ------------------------------------------------------------------ */

function simulate(nums) {
  const seen = new Set();
  const steps = [];
  for (let i = 0; i < nums.length; i++) {
    const value = nums[i];
    const hit = seen.has(value);
    steps.push({ i, value, hit });
    if (hit) return { steps, hitAt: i };
    seen.add(value);
  }
  return { steps, hitAt: -1 };
}
