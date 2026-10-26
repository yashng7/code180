/* Two Sum II - Input Array Is Sorted — animated walkthrough scene (3Blue1Brown style).
 *
 * The array is sorted, so the pair can only be found by squeezing two pointers
 * inward from the ends. We glow `lo` (blue) and `hi` (gold), read off the
 * running sum `numbers[lo] + numbers[hi]`, compare it against the target and
 * move the one pointer that can fix the sum. On a hit both chips turn green,
 * an arc ties the pair together, and the answer is shown 1-indexed.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Two Sum II - Input Array Is Sorted",
    subtitle: "two pointers · O(n) time · O(1) space",
    inputs: [
      { id: "numbers", label: "numbers", type: "text", default: "2, 7, 11, 15", width: "wide" },
      { id: "target", label: "target", type: "number", default: 9 },
    ],
    legend: [
      { color: "#58C4DD", text: "lo pointer" },
      { color: "#F0AC5F", text: "hi pointer" },
      { color: "#5CD0B3", text: "pointer that moves" },
      { color: "#83C167", text: "match" },
    ],
  },

  code: [
    "def two_sum(numbers: List[int], target: int) -> List[int]:",
    "    left, right = 0, len(numbers) - 1",
    "    while left < right:",
    "        total = numbers[left] + numbers[right]",
    "        if total == target:",
    "            return [left + 1, right + 1]",
    "        if total < target:",
    "            left += 1",
    "        else:",
    "            right -= 1",
    "    return []",
  ],

  read(values) {
    const raw = (values.numbers || "").trim();
    if (!raw) return null;
    const numbers = raw.split(/[\s,]+/).filter(Boolean).map(Number);
    if (numbers.length < 2 || numbers.length > 10) return null;
    if (!numbers.every(Number.isInteger)) return null;

    const targetRaw = String(values.target == null ? "" : values.target).trim();
    if (targetRaw === "") return null;
    const target = Number(targetRaw);
    if (!Number.isFinite(target)) return null;
    return { numbers, target };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const numbers = args[0].map(Number);
      const target = Number(args[1]);
      if (numbers.length >= 2 && numbers.length <= 10
          && numbers.every(Number.isFinite) && Number.isFinite(target)) {
        return { numbers: numbers.join(", "), target: String(target) };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, setScaleAt, STAGE_W } = ctx;
    const numbers = params.numbers;
    const target = params.target;
    const n = numbers.length;
    const sim = simulate(numbers, target);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-teal", C.teal);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const ptrL = ctx.layer("pointer");
    const arcL = ctx.layer("arcs");
    const resultL = ctx.layer("result");

    const scene = {
      numbers, target, sim, ctx,
      chips: [], sums: [], cmps: [], _writers: [], writables: [],
    };
    // A write-on node stays opaque; its clip hides it. We pre-create the clip at
    // zero width so nothing flashes before the timeline reveals it.
    scene.writer = node => {
      const w = writable(node);
      w(0);
      scene._writers.push(w);
      scene.writables.push(node);
      return w;
    };

    // title + subtitle
    scene.title = txt("Two Sum II", {
      x: 64, y: 80, "font-size": 46, fill: C.white, "letter-spacing": 1,
    }, textL);
    const sub = el("text", { x: 64, y: 122, "font-size": 23, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "numbers = ";
    el("tspan", { fill: C.white }, sub).textContent = "[" + numbers.join(", ") + "]";
    el("tspan", { fill: C.grey }, sub).textContent = "   target = ";
    el("tspan", { fill: C.white }, sub).textContent = String(target);
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- array chips -----------------------------------------------------
    const gap = n > 8 ? 12 : 18;
    const chipW = clamp((1120 - gap * (n - 1)) / n, 40, 104);
    const chipH = 88;
    const chipTop = 236;
    const totalW = n * chipW + (n - 1) * gap;
    const startX = STAGE_W / 2 - totalW / 2;
    const fontSize = clamp(chipW * 0.42, 14, 38);
    scene.chipH = chipH;
    scene.chipTop = chipTop;

    numbers.forEach((value, i) => {
      const x = startX + i * (chipW + gap);
      const pos = el("g", { transform: "translate(" + x + " " + chipTop + ")" }, chipsL);
      const enter = el("g", {}, pos);
      const scale = el("g", {}, enter);
      const cx = chipW / 2, cy = chipH / 2;
      const rx = Math.min(15, chipW * 0.3);
      el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, scale);
      const mkText = fill => txt(String(value), {
        x: cx, y: cy + 1, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": fontSize, fill,
      }, scale);
      const idle = mkText(C.white);
      const green = mkText(C.green);
      setOpacity(green, 0);
      const ring = (color, glow, w) => {
        const r = el("rect", {
          x: 0, y: 0, width: chipW, height: chipH, rx, fill: "none",
          stroke: color, "stroke-width": w, filter: "url(#" + glow + ")",
        }, scale);
        setOpacity(r, 0);
        return r;
      };
      const hlBlue = ring(C.blue, "glow-blue", 3);
      const hlGold = ring(C.gold, "glow-gold", 3);
      const hlTeal = ring(C.teal, "glow-teal", 3.4);
      const hlGreen = ring(C.green, "glow-green", 3.6);
      txt(String(i), {
        x: cx, y: -16, "text-anchor": "middle", "font-size": 16, fill: C.grey,
      }, enter);
      setOpacity(enter, 0);
      scene.chips.push({
        i, value, pos, enter, scale, cx, cy, rx,
        textIdle: idle, textGreen: green,
        hlBlue, hlGold, hlTeal, hlGreen,
        gx: x + cx,
      });
    });

    // -- pointers (arrows below the chips, sliding inward) ----------------
    const ptrY = chipTop + chipH + 12;
    scene.ptrY = ptrY;
    function buildPointer(color, glowId, label) {
      const g = el("g", {}, ptrL);
      el("path", { d: "M -9 12 L 0 -2 L 9 12 Z", fill: color, filter: "url(#" + glowId + ")" }, g);
      el("line", {
        x1: 0, y1: 12, x2: 0, y2: 36,
        stroke: color, "stroke-width": 3.5, "stroke-linecap": "round",
      }, g);
      txt(label, {
        x: 0, y: 60, "text-anchor": "middle", "font-size": 22,
        fill: color, "font-weight": "bold",
      }, g);
      setOpacity(g, 0);
      return { g };
    }
    scene.loPtr = buildPointer(C.blue, "glow-blue", "lo");
    scene.hiPtr = buildPointer(C.gold, "glow-gold", "hi");

    // -- one sum line + one comparison line per step ----------------------
    sim.steps.forEach(step => {
      const sum = el("text", {
        x: STAGE_W / 2, y: 466, "text-anchor": "middle", "font-size": 30,
      }, textL);
      const part = (str, fill) => {
        const t = el("tspan", fill ? { fill } : {}, sum);
        t.textContent = str;
      };
      if (step.sum === undefined) {
        part("pointers crossed", C.grey);
      } else {
        part("numbers[" + step.lo + "]", C.blue);
        part(" + ", C.grey);
        part("numbers[" + step.hi + "]", C.gold);
        part(" = ", C.grey);
        part(numbers[step.lo] + " + " + numbers[step.hi] + " = ", C.grey);
        part(String(step.sum), C.white);
      }
      scene.sums.push(sum);

      const color = step.kind === "match" ? C.green
        : (step.kind === "move_lo" ? C.blue
          : (step.kind === "move_hi" ? C.gold : C.grey));
      const cmp = txt(cmpText(step, target), {
        x: STAGE_W / 2, y: 510, "text-anchor": "middle", "font-size": 24,
        fill: color,
      }, textL);
      scene.cmps.push(cmp);
    });

    // -- connecting arc + equality label (only on a match) -----------------
    if (sim.found) {
      const m = sim.steps[sim.steps.length - 1];
      const a = scene.chips[m.lo], b = scene.chips[m.hi];
      const y = chipTop - 6;
      const dx = Math.abs(b.gx - a.gx);
      const ctrlY = chipTop - clamp(62 + dx * 0.16, 62, 92);
      const path = el("path", {
        d: "M " + a.gx + " " + y + " Q " + ((a.gx + b.gx) / 2) + " " + ctrlY + " " + b.gx + " " + y,
        fill: "none", stroke: C.green, "stroke-width": 3.5, "stroke-linecap": "round",
      }, arcL);
      const len = path.getTotalLength();
      path.setAttribute("stroke-dasharray", String(len));
      path.setAttribute("stroke-dashoffset", String(len));
      const label = txt(numbers[m.lo] + " + " + numbers[m.hi] + " = " + target, {
        x: (a.gx + b.gx) / 2, y: (y + ctrlY) / 2 - 20,
        "text-anchor": "middle", "font-size": 28, fill: C.green,
      }, arcL);
      scene.arc = { path, len, label };
    }

    // -- result + underline -------------------------------------------------
    if (sim.found) {
      const m = sim.steps[sim.steps.length - 1];
      const res = el("text", {
        x: STAGE_W / 2, y: 640, "text-anchor": "middle", "font-size": 42,
      }, resultL);
      const part = (str, fill, size) => {
        const t = el("tspan", size ? { fill, "font-size": size } : { fill }, res);
        t.textContent = str;
      };
      part("return ", C.grey);
      part("[" + (m.lo + 1) + ", " + (m.hi + 1) + "]", C.green);
      part("   1-indexed", C.grey, 22);
      scene.result = res;
      scene.matched = true;
    } else {
      scene.result = txt("return []", {
        x: STAGE_W / 2, y: 640, "text-anchor": "middle", "font-size": 42, fill: C.grey,
      }, resultL);
      scene.matched = false;
    }
    const rule = el("line", {
      x1: STAGE_W / 2 - 150, y1: 662, x2: STAGE_W / 2 + 150, y2: 662,
      stroke: sim.found ? C.green : C.greyDark, "stroke-width": 4, "stroke-linecap": "round",
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
      for (const chip of scene.chips) {
        setOpacity(chip.enter, 0);
        chip.enter.setAttribute("transform", "translate(0 0)");
        setScaleAt(chip.scale, chip.cx, chip.cy, 1);
        setOpacity(chip.textIdle, 1);
        setOpacity(chip.textGreen, 0);
        setOpacity(chip.hlBlue, 0);
        setOpacity(chip.hlGold, 0);
        setOpacity(chip.hlTeal, 0);
        setOpacity(chip.hlGreen, 0);
      }
      const first = scene.chips[0], last = scene.chips[scene.chips.length - 1];
      setOpacity(scene.loPtr.g, 0);
      setOpacity(scene.hiPtr.g, 0);
      setTranslate(scene.loPtr.g, first.gx, scene.ptrY);
      setTranslate(scene.hiPtr.g, last.gx, scene.ptrY);
      if (scene.arc) scene.arc.path.setAttribute("stroke-dashoffset", String(scene.arc.len));
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt } = ctx;
    const { chips, sim } = scene;

    tl.line(1);
    tl.add(0.6, scene.writer(scene.title), ease.outCubic);
    tl.line(2);
    tl.add(0.4, u => setOpacity(scene.subtitle, u), ease.outCubic);

    // reveal the sorted array
    chips.forEach(chip => {
      tl.add(0.28, u => {
        setOpacity(chip.enter, u);
        chip.enter.setAttribute("transform", "translate(0 " + (1 - u) * 16 + ")");
      }, ease.outCubic);
      tl.wait(0.06);
    });

    let prevSum = null, prevCmp = null;

    sim.steps.forEach((step, si) => {
      const lc = chips[step.lo], rc = chips[step.hi];

      // -- pointers: appear at both ends, then slide inward as needed -----
      if (si === 0) {
        tl.add(0.5, u => {
          setOpacity(scene.loPtr.g, u);
          setOpacity(scene.hiPtr.g, u);
          setTranslate(scene.loPtr.g, lc.gx, scene.ptrY);
          setTranslate(scene.hiPtr.g, rc.gx, scene.ptrY);
        }, ease.outCubic);
        tl.add(0.35, u => {
          setOpacity(lc.hlBlue, u);
          setOpacity(rc.hlGold, u);
        }, ease.outCubic);
      } else {
        const prev = sim.steps[si - 1];
        if (step.lo !== prev.lo) {
          const from = chips[prev.lo].gx, to = lc.gx;
          tl.add(0.45, u => setTranslate(scene.loPtr.g, from + (to - from) * u, scene.ptrY), ease.inOutSine);
          tl.add(0.3, u => {
            setOpacity(chips[prev.lo].hlBlue, 1 - u);
            setOpacity(lc.hlBlue, u);
          }, ease.outCubic);
        }
        if (step.hi !== prev.hi) {
          const from = chips[prev.hi].gx, to = rc.gx;
          tl.add(0.45, u => setTranslate(scene.hiPtr.g, from + (to - from) * u, scene.ptrY), ease.inOutSine);
          tl.add(0.3, u => {
            setOpacity(chips[prev.hi].hlGold, 1 - u);
            setOpacity(rc.hlGold, u);
          }, ease.outCubic);
        }
      }

      // -- running sum + comparison ---------------------------------------
      tl.line(3);
      const fadingSum = prevSum;
      if (fadingSum) tl.add(0.18, u => setOpacity(fadingSum, 1 - u), ease.outCubic);
      tl.line(4);
      tl.add(0.4, scene.writer(scene.sums[si]), ease.linear);
      tl.line(step.kind === "move_lo" || step.kind === "move_hi" ? [5, 7] : 5);
      const fadingCmp = prevCmp;
      if (fadingCmp) tl.add(0.14, u => setOpacity(fadingCmp, 1 - u), ease.outCubic);
      tl.add(0.34, scene.writer(scene.cmps[si]), ease.linear);
      prevSum = scene.sums[si];
      prevCmp = scene.cmps[si];

      // -- decide: pulse the pointer that has to move ----------------------
      if (step.kind === "move_lo" || step.kind === "move_hi") {
        tl.line(step.kind === "move_lo" ? 8 : [9, 10]);
        const moving = step.kind === "move_lo" ? lc : rc;
        tl.add(0.5, u => {
          setOpacity(moving.hlTeal, Math.sin(Math.PI * u));
          setScaleAt(moving.scale, moving.cx, moving.cy, 1 + 0.05 * Math.sin(Math.PI * u));
        }, ease.linear);
      }

      // -- match: both chips green, arc, 1-indexed answer ------------------
      if (step.kind === "match") {
        tl.line(6);
        tl.add(0.4, u => {
          setOpacity(lc.hlBlue, 1 - u);
          setOpacity(rc.hlGold, 1 - u);
          setOpacity(lc.hlGreen, u);
          setOpacity(rc.hlGreen, u);
          setOpacity(lc.textIdle, 1 - u);
          setOpacity(rc.textIdle, 1 - u);
          setOpacity(lc.textGreen, u);
          setOpacity(rc.textGreen, u);
        }, ease.outCubic);
        tl.add(0.45, u => {
          setScaleAt(lc.scale, lc.cx, lc.cy, 1 + 0.07 * Math.sin(Math.PI * u));
          setScaleAt(rc.scale, rc.cx, rc.cy, 1 + 0.07 * Math.sin(Math.PI * u));
        }, ease.linear);
        tl.add(0.35, u => setOpacity(scene.cmps[si], 1 - u), ease.outCubic);
        tl.add(0.65, u => {
          scene.arc.path.setAttribute("stroke-dashoffset", String(scene.arc.len * (1 - u)));
        }, ease.inOutSine);
        tl.add(0.5, scene.writer(scene.arc.label), ease.linear);
        tl.add(0.7, scene.writer(scene.result), ease.linear);
        tl.add(0.45, u => {
          scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u)));
        }, ease.outCubic);
        tl.wait(1.6);
      }
    });

    // -- no solution (outside the stated constraints, but handled cleanly) --
    if (!sim.found) {
      tl.line(11);
      tl.add(0.4, u => {
        for (const chip of chips) setOpacity(chip.enter, 1 - 0.55 * u);
      }, ease.outCubic);
      tl.add(0.6, scene.writer(scene.result), ease.linear);
      tl.add(0.45, u => {
        scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u)));
      }, ease.outCubic);
      tl.wait(1.2);
    }

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model: the steps the animation narrates.
 * ------------------------------------------------------------------ */

function cmpText(step, target) {
  switch (step.kind) {
    case "start":
      return "compare " + step.sum + " with target " + target + " …";
    case "match":
      return step.sum + " = target " + target + "   ✓ match";
    case "move_lo":
      return step.sum + " < target " + target + "   → move lo right (need a bigger sum)";
    case "move_hi":
      return step.sum + " > target " + target + "   → move hi left (need a smaller sum)";
    default:
      return "pointers crossed → no pair";
  }
}

function simulate(numbers, target) {
  const n = numbers.length;
  let lo = 0, hi = n - 1;
  const steps = [];
  const push = (kind, extra) => {
    steps.push(Object.assign({ kind, lo, hi }, extra || {}));
  };

  push("start", { sum: numbers[lo] + numbers[hi] });

  while (lo < hi) {
    const sum = numbers[lo] + numbers[hi];
    if (sum === target) {
      push("match", { sum });
      return { steps, found: true };
    }
    if (sum > target) {
      push("move_hi", { sum });
      hi -= 1;
    } else {
      push("move_lo", { sum });
      lo += 1;
    }
  }

  push("none");
  return { steps, found: false };
}
