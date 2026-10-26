/* Search in Rotated Sorted Array — animated walkthrough scene.
 *
 * A rotated sorted array is two sorted runs joined at the rotation drop. At
 * every probe one half must be the sorted one: compare nums[lo] with nums[mid]
 * to find it, then test whether the target lies inside that sorted run. If it
 * does, search there; if not, the target must be in the other half. A green
 * bracket marks the sorted half at each probe while the shaded [lo, hi] window
 * closes around the answer.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Search in Rotated Sorted Array",
    subtitle: "find the sorted half · O(log n)",
    inputs: [
      { id: "nums", label: "nums", type: "text", default: "4, 5, 6, 7, 0, 1, 2", width: "wide" },
      { id: "target", label: "target", type: "number", default: 0 },
    ],
    legend: [
      { color: "#58C4DD", text: "lo pointer" },
      { color: "#F0AC5F", text: "mid pointer" },
      { color: "#5CD0B3", text: "hi pointer" },
      { color: "#83C167", text: "sorted half" },
    ],
  },

  code: [
    "def search(nums: List[int], target: int) -> int:",
    "    lo, hi = 0, len(nums) - 1",
    "    while lo <= hi:",
    "        mid = (lo + hi) // 2",
    "        if nums[mid] == target:",
    "            return mid",
    "        if nums[lo] <= nums[mid]:",
    "            # left half [lo, mid] is sorted",
    "            if nums[lo] <= target < nums[mid]:",
    "                hi = mid - 1",
    "            else:",
    "                lo = mid + 1",
    "        else:",
    "            # right half [mid, hi] is sorted",
    "            if nums[mid] < target <= nums[hi]:",
    "                lo = mid + 1",
    "            else:",
    "                hi = mid - 1",
    "    return -1",
  ],

  read(values) {
    const raw = (values.nums || "").trim();
    if (!raw) return null;
    const nums = raw.split(/[\s,]+/).filter(Boolean).map(Number);
    if (nums.length < 1 || nums.length > 16) return null;
    if (!nums.every(Number.isInteger)) return null;
    if (new Set(nums).size !== nums.length) return null;
    let drops = 0;
    for (let i = 0; i < nums.length; i++) {
      if (nums[i] > nums[(i + 1) % nums.length]) drops++;
    }
    if (drops > 1) return null;

    const targetRaw = String(values.target == null ? "" : values.target).trim();
    if (targetRaw === "") return null;
    const target = Number(targetRaw);
    if (!Number.isInteger(target)) return null;
    return { nums, target };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const nums = args[0].map(Number);
      const target = Number(args[1]);
      if (nums.length >= 1 && nums.length <= 16
          && nums.every(Number.isInteger) && Number.isInteger(target)) {
        return { nums: nums.join(", "), target: String(target) };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, setScaleAt, STAGE_W } = ctx;
    const nums = params.nums;
    const target = params.target;
    const n = nums.length;
    const sim = simulate(nums, target);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-teal", C.teal);
    ctx.glow("glow-green", C.green);

    const writable = ctx.makeWritable();
    const bgL = ctx.layer("bg");
    const arcsL = ctx.layer("arcs");
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = { nums, target, sim, ctx, chips: [], _writers: [] };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title + subtitle -------------------------------------------------
    scene.title = txt("Search in Rotated Sorted Array", {
      x: 64, y: 76, "font-size": 38, fill: C.white, "letter-spacing": 0.2,
    }, textL);
    const sub = el("text", { x: 64, y: 116, "font-size": 22, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "nums = ";
    el("tspan", { fill: C.white }, sub).textContent = "[" + nums.join(", ") + "]";
    el("tspan", { fill: C.grey }, sub).textContent = "   target = ";
    el("tspan", { fill: C.gold }, sub).textContent = String(target);
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- layout -----------------------------------------------------------
    const gap = n > 10 ? 10 : 18;
    const chipW = clamp((1120 - gap * (n - 1)) / n, 36, 96);
    const chipH = 84;
    const chipTop = 250;
    const totalW = n * chipW + (n - 1) * gap;
    const startX = STAGE_W / 2 - totalW / 2;
    const fontSize = clamp(chipW * 0.42, 13, 34);
    const chipX = i => startX + i * (chipW + gap);
    const chipCenter = i => chipX(i) + chipW / 2;
    scene.chipX = chipX;
    scene.chipCenter = chipCenter;
    scene.chipW = chipW;
    scene.chipTop = chipTop;

    scene.rangeCaption = txt("active range  ·  one half must be sorted", {
      x: STAGE_W / 2, y: 164, "text-anchor": "middle", "font-size": 18, fill: C.grey,
    }, textL);
    setOpacity(scene.rangeCaption, 0);

    const rangeBox = (lo, hi) => {
      if (lo > hi) {
        const x = chipCenter(clamp(lo, 0, n - 1)) - 8;
        return { x, w: 0 };
      }
      const x = chipX(lo) - 8;
      return { x, w: chipX(hi) + chipW + 8 - x };
    };
    scene.rangeBox = rangeBox;
    const initialRange = rangeBox(0, n - 1);
    scene.range = el("rect", {
      x: initialRange.x, y: chipTop - 8, width: initialRange.w, height: chipH + 16,
      rx: 20, fill: C.blue, "fill-opacity": 0.10,
      stroke: C.blue, "stroke-opacity": 0.42, "stroke-width": 2,
      "stroke-dasharray": "7 6",
    }, bgL);
    setOpacity(scene.range, 0);

    // -- array chips ------------------------------------------------------
    nums.forEach((value, i) => {
      const x = chipX(i);
      const pos = el("g", { transform: "translate(" + x + " " + chipTop + ")" }, chipsL);
      const enter = el("g", {}, pos);
      const scale = el("g", {}, enter);
      const cx = chipW / 2, cy = chipH / 2;
      const rx = Math.min(16, chipW * 0.3);
      el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, scale);
      const mk = fill => txt(String(value), {
        x: cx, y: cy + 1, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": fontSize, fill,
      }, scale);
      const idle = mk(C.white);
      const gold = mk(C.gold);
      const green = mk(C.green);
      setOpacity(gold, 0);
      setOpacity(green, 0);
      const ring = (color, glowId, width) => {
        const r = el("rect", {
          x: 0, y: 0, width: chipW, height: chipH, rx, fill: "none",
          stroke: color, "stroke-width": width, filter: "url(#" + glowId + ")",
        }, scale);
        setOpacity(r, 0);
        return r;
      };
      const hlGold = ring(C.gold, "glow-gold", 3);
      const hlGreen = ring(C.green, "glow-green", 3.6);
      txt(String(i), {
        x: cx, y: -16, "text-anchor": "middle", "font-size": 16, fill: C.grey,
      }, enter);
      setOpacity(enter, 0);
      scene.chips.push({
        i, value, pos, enter, scale, cx, cy, rx,
        textIdle: idle, textGold: gold, textGreen: green, hlGold, hlGreen,
        gx: chipCenter(i),
      });
    });

    // -- staggered pointer rows ------------------------------------------
    const rowY = { lo: chipTop + chipH + 10, mid: chipTop + chipH + 56, hi: chipTop + chipH + 102 };
    scene.rowY = rowY;
    const buildPointer = (color, glowId, name, y) => {
      const g = el("g", {}, ptrL);
      el("path", {
        d: "M -10 2 L 0 -10 L 10 2 Z", fill: color, filter: "url(#" + glowId + ")",
      }, g);
      const label = txt(name, {
        x: 0, y: 26, "text-anchor": "middle", "font-size": 18,
        fill: color, "font-weight": "bold",
      }, g);
      setOpacity(g, 0);
      return { g, label, rowY: y };
    };
    scene.loPtr = buildPointer(C.blue, "glow-blue", "lo", rowY.lo);
    scene.midPtr = buildPointer(C.gold, "glow-gold", "mid", rowY.mid);
    scene.hiPtr = buildPointer(C.teal, "glow-teal", "hi", rowY.hi);

    // -- sorted-half bracket cue (above the chips) ------------------------
    scene.cueG = el("g", {}, arcsL);
    scene.cueLine = el("line", {
      x1: 0, y1: 216, x2: 0, y2: 216,
      stroke: C.green, "stroke-width": 4, "stroke-linecap": "round",
    }, scene.cueG);
    scene.cueTickL = el("line", {
      x1: 0, y1: 209, x2: 0, y2: 223,
      stroke: C.green, "stroke-width": 3, "stroke-linecap": "round",
    }, scene.cueG);
    scene.cueTickR = el("line", {
      x1: 0, y1: 209, x2: 0, y2: 223,
      stroke: C.green, "stroke-width": 3, "stroke-linecap": "round",
    }, scene.cueG);
    setOpacity(scene.cueG, 0);
    scene.cueLabel = txt("", {
      x: STAGE_W / 2, y: 194, "text-anchor": "middle", "font-size": 18,
      fill: C.green, "font-weight": "bold",
    }, textL);
    setOpacity(scene.cueLabel, 0);

    // -- dynamic equation + status ---------------------------------------
    scene.eq = txt("", {
      x: STAGE_W / 2, y: 500, "text-anchor": "middle", "font-size": 26, fill: C.gold,
    }, textL);
    scene.status = txt("", {
      x: STAGE_W / 2, y: 538, "text-anchor": "middle", "font-size": 21, fill: C.grey,
    }, textL);
    setOpacity(scene.eq, 0);
    setOpacity(scene.status, 0);

    // -- result banner ----------------------------------------------------
    const found = sim.foundAt >= 0;
    const bY = 610, bH = 64;
    scene.resultBox = el("rect", {
      x: STAGE_W / 2 - 330, y: bY, width: 660, height: bH, rx: 14,
      fill: found ? "#13261B" : "#151b26",
      stroke: found ? C.green : C.grey, "stroke-width": 2.5,
      filter: found ? "url(#glow-green)" : "url(#glow-blue)",
    }, resultL);
    setOpacity(scene.resultBox, 0);

    scene.result = txt(found ? "return " + sim.foundAt : "return -1", {
      x: STAGE_W / 2, y: bY + 40, "text-anchor": "middle", "font-size": 32,
      fill: found ? C.green : C.grey,
    }, resultL);

    const rule = el("line", {
      x1: STAGE_W / 2 - 190, y1: bY + bH + 12, x2: STAGE_W / 2 + 190, y2: bY + bH + 12,
      stroke: found ? C.green : C.greyDark, "stroke-width": 4, "stroke-linecap": "round",
    }, resultL);
    const ruleLen = rule.getTotalLength();
    rule.setAttribute("stroke-dasharray", String(ruleLen));
    rule.setAttribute("stroke-dashoffset", String(ruleLen));
    scene.resultRule = rule;
    scene.ruleLen = ruleLen;

    // -- baseline state ---------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.rangeCaption, 0);
      setOpacity(scene.range, 0);
      scene.range.setAttribute("x", initialRange.x);
      scene.range.setAttribute("width", initialRange.w);
      scene.range.setAttribute("fill", C.blue);
      scene.range.setAttribute("stroke", C.blue);
      for (const chip of scene.chips) {
        setOpacity(chip.enter, 0);
        chip.enter.setAttribute("transform", "translate(0 0)");
        setScaleAt(chip.scale, chip.cx, chip.cy, 1);
        setOpacity(chip.textIdle, 1);
        setOpacity(chip.textGold, 0);
        setOpacity(chip.textGreen, 0);
        setOpacity(chip.hlGold, 0);
        setOpacity(chip.hlGreen, 0);
      }
      const initMid = Math.floor((n - 1) / 2);
      const resetPtr = (ptr, idx, text) => {
        setOpacity(ptr.g, 0);
        setTranslate(ptr.g, chipCenter(idx), ptr.rowY);
        ptr.label.textContent = text;
      };
      resetPtr(scene.loPtr, 0, "lo = 0");
      resetPtr(scene.midPtr, initMid, "mid = " + initMid);
      resetPtr(scene.hiPtr, n - 1, "hi = " + (n - 1));
      setOpacity(scene.cueG, 0);
      setOpacity(scene.cueLabel, 0);
      scene.cueLabel.textContent = "";
      setOpacity(scene.eq, 0);
      scene.eq.textContent = "";
      setOpacity(scene.status, 0);
      scene.status.textContent = "";
      scene.status.setAttribute("fill", C.grey);
      setOpacity(scene.resultBox, 0);
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt } = ctx;
    const { nums, target, sim } = scene;
    const n = nums.length;
    const wTitle = scene.writer(scene.title);
    const wResult = scene.writer(scene.result);

    const moveLo = (fromIdx, toIdx, dur) => {
      const fromX = scene.chipCenter(fromIdx);
      const toX = scene.chipCenter(toIdx);
      tl.add(dur, u => {
        setTranslate(scene.loPtr.g, fromX + (toX - fromX) * u, scene.loPtr.rowY);
        if (u > 0.001) scene.loPtr.label.textContent = "lo = " + toIdx;
      }, ease.inOutSine);
    };
    const moveHi = (fromIdx, toIdx, dur) => {
      const fromX = scene.chipCenter(fromIdx);
      const toX = scene.chipCenter(toIdx);
      tl.add(dur, u => {
        setTranslate(scene.hiPtr.g, fromX + (toX - fromX) * u, scene.hiPtr.rowY);
        if (u > 0.001) scene.hiPtr.label.textContent = "hi = " + toIdx;
      }, ease.inOutSine);
    };
    const shrinkRange = (fromLo, fromHi, toLo, toHi, dur) => {
      const a = scene.rangeBox(fromLo, fromHi);
      const b = scene.rangeBox(toLo, toHi);
      tl.add(dur, u => {
        scene.range.setAttribute("x", a.x + (b.x - a.x) * u);
        scene.range.setAttribute("width", Math.max(0, a.w + (b.w - a.w) * u));
      }, ease.inOutSine);
    };
    const setCue = (lo, hi, label) => {
      const x1 = scene.chipX(lo) - 6;
      const x2 = scene.chipX(hi) + scene.chipW + 6;
      const cx = (x1 + x2) / 2;
      tl.add(0.16, u => {
        setOpacity(scene.cueG, 1 - u);
        setOpacity(scene.cueLabel, 1 - u);
      }, ease.outCubic);
      tl.add(0.01, () => {
        scene.cueLine.setAttribute("x1", String(x1));
        scene.cueLine.setAttribute("x2", String(x2));
        scene.cueTickL.setAttribute("x1", String(x1));
        scene.cueTickL.setAttribute("x2", String(x1));
        scene.cueTickR.setAttribute("x1", String(x2));
        scene.cueTickR.setAttribute("x2", String(x2));
        scene.cueLabel.setAttribute("x", String(cx));
        scene.cueLabel.textContent = label;
      }, ease.linear);
      tl.add(0.3, u => {
        setOpacity(scene.cueG, u);
        setOpacity(scene.cueLabel, u);
      }, ease.outCubic);
    };
    const hideCue = () => {
      tl.add(0.18, u => {
        setOpacity(scene.cueG, 1 - u);
        setOpacity(scene.cueLabel, 1 - u);
      }, ease.outCubic);
    };

    // -- intro ------------------------------------------------------------
    tl.line(1);
    tl.add(0.6, wTitle, ease.outCubic);
    tl.add(0.4, u => setOpacity(scene.subtitle, u), ease.outCubic);
    tl.add(0.3, u => setOpacity(scene.rangeCaption, u), ease.outCubic);
    nums.forEach((_, i) => {
      const chip = scene.chips[i];
      tl.add(0.28, u => {
        setOpacity(chip.enter, u);
        chip.enter.setAttribute("transform", "translate(0 " + (1 - u) * 16 + ")");
      }, ease.outCubic);
      tl.wait(0.05);
    });

    tl.line(2);
    tl.add(0.45, u => {
      setOpacity(scene.range, u);
      setOpacity(scene.loPtr.g, u);
      setOpacity(scene.hiPtr.g, u);
      setTranslate(scene.loPtr.g, scene.chipCenter(0), scene.loPtr.rowY);
      setTranslate(scene.hiPtr.g, scene.chipCenter(n - 1), scene.hiPtr.rowY);
      scene.loPtr.label.textContent = "lo = 0";
      scene.hiPtr.label.textContent = "hi = " + (n - 1);
    }, ease.outCubic);
    tl.add(0.3, u => {
      setOpacity(scene.eq, u);
      setOpacity(scene.status, u);
      if (u > 0.001) {
        scene.eq.textContent = "lo = 0   ·   hi = " + (n - 1) + "   ·   target = " + target;
        scene.status.textContent = "one sorted run is wrapped around the rotation drop";
      }
    }, ease.linear);
    tl.log("lo = 0, hi = " + (n - 1) + " → search the rotated array", ctx.C.blue);

    // -- probe loop -------------------------------------------------------
    let prevMid = null;
    sim.steps.forEach(step => {
      if (step.kind === "miss") return;

      tl.line(3);
      tl.add(0.24, u => {
        if (u > 0.001) {
          scene.status.setAttribute("fill", ctx.C.grey);
          scene.status.textContent = "lo = " + step.lo + " ≤ hi = " + step.hi + "  →  probe the middle";
        }
      }, ease.linear);
      tl.log("lo = " + step.lo + " ≤ hi = " + step.hi + " → keep searching", ctx.C.grey);

      tl.line(4);
      const midChip = scene.chips[step.mid];
      if (prevMid !== null) {
        const oldChip = scene.chips[prevMid];
        tl.add(0.22, u => {
          setOpacity(oldChip.textGold, 1 - u);
          setOpacity(oldChip.textIdle, u);
          setOpacity(oldChip.hlGold, 1 - u);
        }, ease.outCubic);
        const fromX = scene.chipCenter(prevMid);
        const toX = scene.chipCenter(step.mid);
        tl.add(0.36, u => {
          setTranslate(scene.midPtr.g, fromX + (toX - fromX) * u, scene.midPtr.rowY);
          if (u > 0.001) scene.midPtr.label.textContent = "mid = " + step.mid;
        }, ease.inOutSine);
      } else {
        const midX = scene.chipCenter(step.mid);
        tl.add(0.36, u => {
          setOpacity(scene.midPtr.g, u);
          setTranslate(scene.midPtr.g, midX, scene.midPtr.rowY);
          if (u > 0.001) scene.midPtr.label.textContent = "mid = " + step.mid;
        }, ease.outCubic);
      }
      tl.add(0.32, u => {
        setOpacity(midChip.textIdle, 1 - u);
        setOpacity(midChip.textGold, u);
        setOpacity(midChip.hlGold, u);
      }, ease.outCubic);
      tl.add(0.3, u => {
        if (u > 0.001) {
          scene.eq.textContent = "mid = (" + step.lo + " + " + step.hi + ") // 2 = "
            + step.mid + "   ·   nums[" + step.mid + "] = " + step.value;
        }
      }, ease.linear);
      tl.log("mid = (" + step.lo + " + " + step.hi + ") // 2 = " + step.mid
        + " → nums[" + step.mid + "] = " + step.value, ctx.C.gold);

      tl.line(5);
      tl.add(0.26, u => {
        if (u > 0.001) {
          scene.eq.textContent = "nums[" + step.mid + "] = " + step.value
            + "   vs   target = " + target;
        }
      }, ease.linear);

      if (step.kind === "found") {
        tl.add(0.26, u => {
          if (u > 0.001) {
            scene.status.setAttribute("fill", ctx.C.green);
            scene.status.textContent = step.value + " = " + target
              + "  →  return mid = " + step.mid;
          }
        }, ease.linear);
        tl.log(step.value + " = target " + target + " → found at index " + step.mid, ctx.C.green);

        tl.line(6);
        tl.add(0.35, u => {
          setOpacity(midChip.textGold, 1 - u);
          setOpacity(midChip.textGreen, u);
          setOpacity(midChip.hlGold, 1 - u);
          setOpacity(midChip.hlGreen, u);
          setOpacity(scene.loPtr.g, 1 - u);
          setOpacity(scene.hiPtr.g, 1 - u);
          scene.range.setAttribute("fill", ctx.C.green);
          scene.range.setAttribute("stroke", ctx.C.green);
        }, ease.outCubic);
        tl.add(0.45, u => {
          setScaleAt(midChip.scale, midChip.cx, midChip.cy, 1 + 0.07 * Math.sin(Math.PI * u));
        }, ease.linear);
        shrinkRange(step.lo, step.hi, step.mid, step.mid, 0.42);
        tl.add(0.5, u => setOpacity(scene.resultBox, u), ease.outCubic);
        tl.add(0.7, wResult, ease.linear);
        tl.add(0.45, u => {
          scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u)));
        }, ease.outCubic);
        tl.wait(1.5);
        return;
      }

      tl.add(0.24, u => {
        if (u > 0.001) {
          scene.status.setAttribute("fill", ctx.C.grey);
          scene.status.textContent = "not equal  →  find which half is sorted";
        }
      }, ease.linear);
      tl.log("nums[" + step.mid + "] = " + step.value + " ≠ target " + target, ctx.C.grey);

      tl.line(7);
      tl.add(0.26, u => {
        if (u > 0.001) {
          scene.eq.textContent = "nums[lo = " + step.lo + "] = " + nums[step.lo]
            + (step.kind.indexOf("left") === 0 ? "  ≤  " : "  >  ")
            + "nums[mid = " + step.mid + "] = " + step.value;
        }
      }, ease.linear);

      if (step.kind.indexOf("left") === 0) {
        tl.add(0.24, u => {
          if (u > 0.001) {
            scene.status.setAttribute("fill", ctx.C.green);
            scene.status.textContent = "left half [" + step.sortedLo + ", " + step.sortedHi
              + "] is sorted  →  test whether " + target + " is inside";
          }
        }, ease.linear);
        setCue(step.sortedLo, step.sortedHi,
          "left half [" + step.sortedLo + ", " + step.sortedHi + "] sorted");
        tl.log("left half [" + step.sortedLo + ", " + step.sortedHi + "] is sorted", ctx.C.green);

        tl.line(9);
        tl.add(0.26, u => {
          if (u > 0.001) {
            scene.eq.textContent = "nums[lo] = " + nums[step.lo] + "  ≤  target = " + target
              + "  <  nums[mid] = " + step.value
              + "   →  " + (step.kind === "left_inside" ? "true" : "false");
          }
        }, ease.linear);

        if (step.kind === "left_inside") {
          tl.add(0.26, u => {
            if (u > 0.001) {
              scene.status.setAttribute("fill", ctx.C.green);
              scene.status.textContent = target + " is inside the sorted left half  →  hi = mid - 1 = "
                + (step.mid - 1);
            }
          }, ease.linear);
          tl.log(target + " lies inside the sorted left half; hi = " + (step.mid - 1), ctx.C.green);
          tl.line(10);
          moveHi(step.hi, step.mid - 1, 0.45);
          shrinkRange(step.lo, step.hi, step.lo, step.mid - 1, 0.45);
        } else {
          tl.add(0.26, u => {
            if (u > 0.001) {
              scene.status.setAttribute("fill", ctx.C.blue);
              scene.status.textContent = target + " is outside the sorted left half  →  lo = mid + 1 = "
                + (step.mid + 1);
            }
          }, ease.linear);
          tl.log(target + " lies outside the sorted left half; lo = " + (step.mid + 1), ctx.C.blue);
          tl.line([11, 12]);
          moveLo(step.lo, step.mid + 1, 0.45);
          shrinkRange(step.lo, step.hi, step.mid + 1, step.hi, 0.45);
        }
      } else {
        tl.line(13);
        tl.add(0.24, u => {
          if (u > 0.001) {
            scene.status.setAttribute("fill", ctx.C.green);
            scene.status.textContent = "right half [" + step.sortedLo + ", " + step.sortedHi
              + "] is sorted  →  test whether " + target + " is inside";
          }
        }, ease.linear);
        setCue(step.sortedLo, step.sortedHi,
          "right half [" + step.sortedLo + ", " + step.sortedHi + "] sorted");
        tl.log("right half [" + step.sortedLo + ", " + step.sortedHi + "] is sorted", ctx.C.green);

        tl.line(15);
        tl.add(0.26, u => {
          if (u > 0.001) {
            scene.eq.textContent = "nums[mid] = " + step.value + "  <  target = " + target
              + "  ≤  nums[hi] = " + nums[step.hi]
              + "   →  " + (step.kind === "right_inside" ? "true" : "false");
          }
        }, ease.linear);

        if (step.kind === "right_inside") {
          tl.add(0.26, u => {
            if (u > 0.001) {
              scene.status.setAttribute("fill", ctx.C.green);
              scene.status.textContent = target + " is inside the sorted right half  →  lo = mid + 1 = "
                + (step.mid + 1);
            }
          }, ease.linear);
          tl.log(target + " lies inside the sorted right half; lo = " + (step.mid + 1), ctx.C.green);
          tl.line(16);
          moveLo(step.lo, step.mid + 1, 0.45);
          shrinkRange(step.lo, step.hi, step.mid + 1, step.hi, 0.45);
        } else {
          tl.add(0.26, u => {
            if (u > 0.001) {
              scene.status.setAttribute("fill", ctx.C.teal);
              scene.status.textContent = target + " is outside the sorted right half  →  hi = mid - 1 = "
                + (step.mid - 1);
            }
          }, ease.linear);
          tl.log(target + " lies outside the sorted right half; hi = " + (step.mid - 1), ctx.C.teal);
          tl.line([17, 18]);
          moveHi(step.hi, step.mid - 1, 0.45);
          shrinkRange(step.lo, step.hi, step.lo, step.mid - 1, 0.45);
        }
      }

      hideCue();
      prevMid = step.mid;
    });

    // -- loop condition fails: window empty ------------------------------
    if (sim.foundAt < 0) {
      const last = sim.steps[sim.steps.length - 1];
      tl.line(3);
      tl.add(0.28, u => {
        if (u > 0.001) {
          scene.eq.textContent = "lo = " + last.lo + "  >  hi = " + last.hi;
          scene.status.setAttribute("fill", ctx.C.grey);
          scene.status.textContent = "search window is empty  →  " + target + " is not in nums";
        }
      }, ease.linear);
      tl.log("lo = " + last.lo + " > hi = " + last.hi + " → window empty", ctx.C.grey);

      tl.line(19);
      tl.add(0.4, u => {
        setOpacity(scene.range, 1 - u);
        setOpacity(scene.loPtr.g, 1 - u);
        setOpacity(scene.midPtr.g, 1 - u);
        setOpacity(scene.hiPtr.g, 1 - u);
        if (prevMid !== null) {
          const oldChip = scene.chips[prevMid];
          setOpacity(oldChip.textGold, 1 - u);
          setOpacity(oldChip.textIdle, u);
          setOpacity(oldChip.hlGold, 1 - u);
        }
      }, ease.outCubic);
      tl.add(0.5, u => setOpacity(scene.resultBox, u), ease.outCubic);
      tl.add(0.7, wResult, ease.linear);
      tl.add(0.45, u => {
        scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u)));
      }, ease.outCubic);
      tl.wait(1.5);
    }

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model: the frames the animation narrates.
 * ------------------------------------------------------------------ */
function simulate(nums, target) {
  let lo = 0, hi = nums.length - 1;
  const steps = [];
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const value = nums[mid];
    if (value === target) {
      steps.push({ lo, hi, mid, value, kind: "found" });
      return { steps, foundAt: mid };
    }
    if (nums[lo] <= value) {
      const sortedLo = lo, sortedHi = mid;
      if (nums[lo] <= target && target < value) {
        steps.push({
          lo, hi, mid, value, kind: "left_inside", sortedLo, sortedHi,
        });
        hi = mid - 1;
      } else {
        steps.push({
          lo, hi, mid, value, kind: "left_outside", sortedLo, sortedHi,
        });
        lo = mid + 1;
      }
    } else {
      const sortedLo = mid, sortedHi = hi;
      if (value < target && target <= nums[hi]) {
        steps.push({
          lo, hi, mid, value, kind: "right_inside", sortedLo, sortedHi,
        });
        lo = mid + 1;
      } else {
        steps.push({
          lo, hi, mid, value, kind: "right_outside", sortedLo, sortedHi,
        });
        hi = mid - 1;
      }
    }
  }
  steps.push({ lo, hi, mid: null, kind: "miss" });
  return { steps, foundAt: -1 };
}
