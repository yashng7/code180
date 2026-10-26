/* Top K Frequent Elements — animated walkthrough scene (3Blue1Brown style).
 *
 * Count how often each value appears (bars grow), bucket the values by
 * frequency from high to low, then collect the k most frequent values and
 * reveal the answer.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Top K Frequent Elements",
    subtitle: "count · bucket sort · O(n)",
    inputs: [
      { id: "nums", label: "nums", type: "text", default: "1, 1, 1, 2, 2, 3", width: "wide" },
      { id: "k", label: "k", type: "number", default: 2 },
    ],
    legend: [
      { color: "#58C4DD", text: "tallying" },
      { color: "#5CD0B3", text: "bucket" },
      { color: "#83C167", text: "top-k" },
    ],
  },

  code: [
    "def top_k_frequent(nums: List[int], k: int) -> List[int]:",
    "    counts: dict[int, int] = {}",
    "    for value in nums:",
    "        counts[value] = counts.get(value, 0) + 1",
    "    buckets: List[List[int]] = [[] for _ in range(len(nums) + 1)]",
    "    for value, freq in counts.items():",
    "        buckets[freq].append(value)",
    "    result: List[int] = []",
    "    for freq in range(len(buckets) - 1, 0, -1):",
    "        for value in buckets[freq]:",
    "            result.append(value)",
    "            if len(result) == k:",
    "                return result",
    "    return result",
  ],

  read(values) {
    const raw = (values.nums || "").trim();
    if (!raw) return null;
    const nums = raw.split(/[\s,]+/).filter(Boolean).map(Number);
    if (nums.length < 1 || nums.length > 12) return null;
    if (!nums.every(Number.isInteger)) return null;
    const k = Number(values.k);
    if (!Number.isInteger(k) || k < 1 || k > nums.length) return null;
    return { nums, k };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const nums = args[0].map(Number);
      const k = Number(args[1]);
      if (nums.length && nums.every(Number.isFinite) && Number.isFinite(k)) {
        return { nums: nums.join(", "), k: String(k) };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, setScaleAt, STAGE_W } = ctx;
    const nums = params.nums;
    const k = params.k;
    const n = nums.length;
    const sim = simulate(nums, k);
    const D = sim.distinct.length;
    const maxFreq = sim.maxFreq;

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-teal", C.teal);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-gold", C.gold);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = {
      nums, k, sim, ctx,
      chips: [], bars: [], bucketRows: [], trayChips: [],
      valueChip: new Map(), barByValue: new Map(), rowByFreq: new Map(),
      baseline: 540, maxBarH: 200,
    };
    scene._writers = [];
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title + subtitle ----
    scene.title = txt("Top K Frequent Elements", {
      x: 64, y: 76, "font-size": 42, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    const sub = el("text", { x: 64, y: 112, "font-size": 21, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "nums = ";
    el("tspan", { fill: C.white }, sub).textContent = "[" + nums.join(", ") + "]";
    el("tspan", {}, sub).textContent = "   k = ";
    el("tspan", { fill: C.white }, sub).textContent = String(k);
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // ---- array chips ----
    const gap = n > 10 ? 8 : 16;
    const chipW = clamp((1120 - gap * (n - 1)) / n, 40, 88);
    const chipH = 62;
    const chipTop = 150;
    const totalW = n * chipW + (n - 1) * gap;
    const startX = STAGE_W / 2 - totalW / 2;
    const fontSize = clamp(chipW * 0.4, 14, 30);
    scene.chipTop = chipTop;
    scene.chipH = chipH;

    nums.forEach((value, i) => {
      const x = startX + i * (chipW + gap);
      const pos = el("g", { transform: "translate(" + x + " " + chipTop + ")" }, chipsL);
      const enter = el("g", {}, pos);
      const scale = el("g", {}, enter);
      const cx = chipW / 2, cy = chipH / 2;
      const rx = Math.min(14, chipW * 0.28);
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
      setOpacity(blue, 0);
      const hlBlue = el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx, fill: "none",
        stroke: C.blue, "stroke-width": 3, filter: "url(#glow-blue)",
      }, scale);
      setOpacity(hlBlue, 0);
      txt(String(i), {
        x: cx, y: -14, "text-anchor": "middle", "font-size": 16, fill: C.grey,
      }, enter);
      setOpacity(enter, 0);
      scene.chips.push({
        i, value, gx: x + cx, pos, enter, scale, cx, cy,
        textIdle: idle, textBlue: blue, hlBlue,
      });
    });

    // pointer under the current chip
    const pointerY = chipTop + chipH + 6;
    scene.pointerY = pointerY;
    const pointer = el("g", {}, ptrL);
    el("line", {
      x1: 0, y1: 30, x2: 0, y2: 14, stroke: C.blue, "stroke-width": 3, "stroke-linecap": "round",
    }, pointer);
    el("path", { d: "M -9 14 L 0 -8 L 9 14 Z", fill: C.blue }, pointer);
    setOpacity(pointer, 0);
    setTranslate(pointer, scene.chips[0].gx - 34, pointerY);
    scene.pointer = pointer;

    // ---- frequency bars (one per distinct value) ----
    const areaX = 64, areaW = 560, baseline = scene.baseline, maxBarH = scene.maxBarH;
    const slotW = areaW / D;
    const barW = clamp(slotW * 0.5, 16, 56);
    scene.countsLabel = txt("counts (frequency of each value)", {
      x: areaX, y: 300, "font-size": 19, fill: C.grey,
    }, textL);
    setOpacity(scene.countsLabel, 0);
    el("line", {
      x1: areaX, y1: baseline, x2: areaX + areaW, y2: baseline,
      stroke: C.greyDark, "stroke-width": 2,
    }, textL);

    sim.distinct.forEach((value, j) => {
      const x = areaX + slotW * j + (slotW - barW) / 2;
      const g = el("g", {}, chipsL);
      const bar = el("rect", {
        x, y: baseline, width: barW, height: 0, rx: Math.min(8, barW * 0.3),
        fill: C.blue, "fill-opacity": 0.85,
      }, g);
      const glowRect = el("rect", {
        x, y: baseline, width: barW, height: 0, rx: Math.min(8, barW * 0.3),
        fill: "none", stroke: C.gold, "stroke-width": 3, filter: "url(#glow-gold)",
      }, g);
      setOpacity(glowRect, 0);
      const countText = txt("", {
        x: x + barW / 2, y: baseline - 8, "text-anchor": "middle",
        "font-size": 20, fill: C.white,
      }, g);
      setOpacity(countText, 0);
      txt(String(value), {
        x: x + barW / 2, y: baseline + 26, "text-anchor": "middle",
        "font-size": 20, fill: C.cyan,
      }, g);
      const entry = { value, x, bar, glowRect, countText };
      scene.bars.push(entry);
      scene.barByValue.set(value, entry);
    });

    // ---- buckets, highest frequency first ----
    const bx = 680, bTop = 340;
    const rows = sim.bucketOrder;
    const rowH = clamp(200 / Math.max(rows.length, 1), 16, 42);
    scene.bucketsLabel = txt("buckets (freq → values)", {
      x: bx, y: 300, "font-size": 19, fill: C.grey,
    }, textL);
    setOpacity(scene.bucketsLabel, 0);

    rows.forEach((freq, ri) => {
      const y = bTop + ri * rowH;
      const g = el("g", { transform: "translate(" + bx + " " + y + ")" }, chipsL);
      const enter = el("g", {}, g);
      const hl = el("rect", {
        x: 0, y: 2, width: 560, height: rowH - 6, rx: 8, fill: "none",
        stroke: C.teal, "stroke-width": 2, filter: "url(#glow-teal)",
      }, enter);
      setOpacity(hl, 0);
      txt("f=" + freq, {
        x: 4, y: rowH / 2, "dominant-baseline": "central",
        "font-size": 19, fill: C.teal,
      }, enter);

      const cw2 = 38, cgap = 8, ch2 = Math.max(14, rowH - 12);
      const values = sim.buckets.get(freq) || [];
      values.forEach((value, vi) => {
        const cx0 = 72 + vi * (cw2 + cgap);
        const cg = el("g", { transform: "translate(" + cx0 + " " + ((rowH - ch2) / 2) + ")" }, enter);
        el("rect", {
          x: 0, y: 0, width: cw2, height: ch2, rx: 7,
          fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.6,
        }, cg);
        const tAttrs = {
          x: cw2 / 2, y: ch2 / 2 + 1, "text-anchor": "middle",
          "dominant-baseline": "central", "font-size": 17,
        };
        const tIdle = txt(String(value), Object.assign({ fill: C.white }, tAttrs), cg);
        const tGreen = txt(String(value), Object.assign({ fill: C.green }, tAttrs), cg);
        setOpacity(tGreen, 0);
        const hlg = el("rect", {
          x: 0, y: 0, width: cw2, height: ch2, rx: 7, fill: "none",
          stroke: C.green, "stroke-width": 2.6, filter: "url(#glow-green)",
        }, cg);
        setOpacity(hlg, 0);
        scene.valueChip.set(value, { tIdle, tGreen, hlg });
      });
      setOpacity(enter, 0);
      const row = { freq, g, enter, hl, x: bx, baseY: y };
      scene.bucketRows.push(row);
      scene.rowByFreq.set(freq, row);
    });

    // ---- per-step status lines ----
    const statusAttrs = { x: STAGE_W / 2, y: 560, "text-anchor": "middle", "font-size": 22 };
    scene.tallyStatus = sim.tally.map(step => txt(
      "nums[" + step.i + "] = " + step.value + "  →  count[" + step.value + "] = " + step.count,
      Object.assign({ fill: C.blue }, statusAttrs), textL));
    scene.bucketStatus = sim.bucketOrder.map(freq => {
      const vals = sim.buckets.get(freq) || [];
      return txt(
        "bucket[" + freq + "] ← values seen " + freq + "×  :  [" + vals.join(", ") + "]",
        Object.assign({ fill: C.teal }, statusAttrs), textL);
    });
    scene.collectStatus = sim.collected.map((item, ci) => txt(
      "take " + item.value + "  (" + item.freq + "×)   →   " + (ci + 1) + " of " + k,
      Object.assign({ fill: C.green }, statusAttrs), textL));
    for (const node of scene.tallyStatus) setOpacity(node, 0);
    for (const node of scene.bucketStatus) setOpacity(node, 0);
    for (const node of scene.collectStatus) setOpacity(node, 0);

    // ---- result tray + final answer ----
    const trayY = 584, trayH = 34, trayW = 56, trayGap = 10;
    const m = Math.max(sim.collected.length, 1);
    const trayTotal = m * trayW + (m - 1) * trayGap;
    const trayStart = STAGE_W / 2 - trayTotal / 2;
    sim.collected.forEach((item, ci) => {
      const x = trayStart + ci * (trayW + trayGap);
      const pos = el("g", { transform: "translate(" + x + " " + trayY + ")" }, chipsL);
      const enter = el("g", {}, pos);
      const scale = el("g", {}, enter);
      const cx = trayW / 2, cy = trayH / 2;
      el("rect", {
        x: 0, y: 0, width: trayW, height: trayH, rx: 9,
        fill: C.chipFill, stroke: C.green, "stroke-width": 2, filter: "url(#glow-green)",
      }, scale);
      txt(String(item.value), {
        x: cx, y: cy + 1, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": 19, fill: C.green,
      }, scale);
      setOpacity(enter, 0);
      scene.trayChips.push({ pos, enter, scale, cx, cy });
    });

    const answer = "[" + sim.collected.map(item => item.value).join(", ") + "]";
    scene.result = txt("return " + answer, {
      x: STAGE_W / 2, y: 674, "text-anchor": "middle", "font-size": 40, fill: C.green,
    }, resultL);
    const rule = el("line", {
      x1: STAGE_W / 2 - 170, y1: 692, x2: STAGE_W / 2 + 170, y2: 692,
      stroke: C.green, "stroke-width": 4, "stroke-linecap": "round",
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
      setOpacity(scene.countsLabel, 0);
      setOpacity(scene.bucketsLabel, 0);
      for (const chip of scene.chips) {
        setOpacity(chip.enter, 0);
        chip.enter.setAttribute("transform", "translate(0 0)");
        setScaleAt(chip.scale, chip.cx, chip.cy, 1);
        setOpacity(chip.textIdle, 1);
        setOpacity(chip.textBlue, 0);
        setOpacity(chip.hlBlue, 0);
      }
      setOpacity(scene.pointer, 0);
      setTranslate(scene.pointer, scene.chips[0].gx - 34, scene.pointerY);
      for (const b of scene.bars) {
        b.bar.setAttribute("height", "0");
        b.bar.setAttribute("y", String(scene.baseline));
        b.glowRect.setAttribute("height", "0");
        b.glowRect.setAttribute("y", String(scene.baseline));
        setOpacity(b.glowRect, 0);
        b.countText.textContent = "";
        setOpacity(b.countText, 0);
      }
      for (const row of scene.bucketRows) {
        setOpacity(row.enter, 0);
        setTranslate(row.g, row.x, row.baseY);
        setOpacity(row.hl, 0);
      }
      for (const chip of scene.valueChip.values()) {
        setOpacity(chip.tIdle, 1);
        setOpacity(chip.tGreen, 0);
        setOpacity(chip.hlg, 0);
      }
      for (const node of scene.tallyStatus) setOpacity(node, 0);
      for (const node of scene.bucketStatus) setOpacity(node, 0);
      for (const node of scene.collectStatus) setOpacity(node, 0);
      for (const t of scene.trayChips) {
        setOpacity(t.enter, 0);
        setScaleAt(t.scale, t.cx, t.cy, 1);
      }
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt } = ctx;
    const { nums, sim } = scene;
    const maxFreq = sim.maxFreq;
    const baseline = scene.baseline;
    const barH = count => scene.maxBarH * count / maxFreq;

    // --- intro --------------------------------------------------------
    tl.line(1);
    tl.add(0.6, scene.writer(scene.title), ease.outCubic);
    tl.add(0.4, u => setOpacity(scene.subtitle, u), ease.outCubic);
    nums.forEach((_, i) => {
      const chip = scene.chips[i];
      tl.add(0.35, u => {
        setOpacity(chip.enter, u);
        chip.enter.setAttribute("transform", "translate(0 " + (1 - u) * 16 + ")");
      }, ease.outCubic);
      tl.wait(0.05);
    });
    tl.add(0.45, u => setOpacity(scene.countsLabel, u), ease.outCubic);
    tl.add(0.45, u => setOpacity(scene.bucketsLabel, u), ease.outCubic);
    tl.line(2);
    tl.wait(0.2);

    // --- tally: grow one bar per element ------------------------------
    const heights = new Map();
    for (const value of sim.distinct) heights.set(value, 0);

    let prevTally = null;
    sim.tally.forEach((step, si) => {
      const chip = scene.chips[step.i];
      const bar = scene.barByValue.get(step.value);

      tl.line(3);
      if (si === 0) {
        tl.add(0.4, u => {
          setOpacity(scene.pointer, u);
          setTranslate(scene.pointer, chip.gx - 34 * (1 - u), scene.pointerY);
        }, ease.outCubic);
      } else {
        const prevChip = scene.chips[sim.tally[si - 1].i];
        tl.add(0.3, u => setTranslate(scene.pointer, prevChip.gx + (chip.gx - prevChip.gx) * u, scene.pointerY), ease.inOutSine);
        tl.add(0.2, u => {
          setOpacity(prevChip.textBlue, 1 - u);
          setOpacity(prevChip.textIdle, u);
          setOpacity(prevChip.hlBlue, 1 - u);
        }, ease.outCubic);
      }

      tl.add(0.3, u => {
        setOpacity(chip.textIdle, 1 - u);
        setOpacity(chip.textBlue, u);
        setOpacity(chip.hlBlue, u);
      }, ease.outCubic);
      tl.add(0.35, u => setScaleAt(chip.scale, chip.cx, chip.cy, 1 + 0.06 * Math.sin(Math.PI * u)), ease.linear);

      const fromH = heights.get(step.value);
      const toH = barH(step.count);
      heights.set(step.value, toH);
      tl.line(4);
      tl.add(0.45, u => {
        const h = fromH + (toH - fromH) * u;
        bar.bar.setAttribute("height", String(h));
        bar.bar.setAttribute("y", String(baseline - h));
      }, ease.outCubic);
      tl.add(0.28, u => {
        bar.countText.textContent = String(step.count);
        setOpacity(bar.countText, u);
      }, ease.outCubic);
      tl.add(0.3, u => {
        bar.glowRect.setAttribute("height", String(toH));
        bar.glowRect.setAttribute("y", String(baseline - toH));
        setOpacity(bar.glowRect, Math.sin(Math.PI * u));
      }, ease.linear);

      const fadingTally = prevTally;
      if (fadingTally) tl.add(0.16, u => setOpacity(fadingTally, 1 - u), ease.outCubic);
      tl.add(0.45, scene.writer(scene.tallyStatus[si]), ease.linear);
      prevTally = scene.tallyStatus[si];
    });

    const finalTally = prevTally;
    if (finalTally) tl.add(0.2, u => setOpacity(finalTally, 1 - u), ease.outCubic);
    tl.add(0.3, u => setOpacity(scene.pointer, 1 - u), ease.outCubic);
    const lastChip = scene.chips[sim.tally[sim.tally.length - 1].i];
    tl.add(0.25, u => {
      setOpacity(lastChip.textBlue, 1 - u);
      setOpacity(lastChip.textIdle, u);
      setOpacity(lastChip.hlBlue, 1 - u);
    }, ease.outCubic);
    tl.line(5);
    tl.wait(0.2);

    // --- buckets: reveal high → low -----------------------------------
    let prevBucket = null;
    sim.bucketOrder.forEach((freq, ri) => {
      const row = scene.rowByFreq.get(freq);
      tl.line([6, 7]);
      tl.add(0.45, u => {
        setOpacity(row.enter, u);
        setTranslate(row.g, row.x, row.baseY + (1 - u) * 14);
      }, ease.outCubic);
      tl.add(0.28, u => setOpacity(row.hl, 0.85 * u), ease.outCubic);
      if (ri > 0) {
        const prevRow = scene.rowByFreq.get(sim.bucketOrder[ri - 1]);
        tl.add(0.22, u => setOpacity(prevRow.hl, 0.85 * (1 - u)), ease.outCubic);
      }
      const fadingBucket = prevBucket;
      if (fadingBucket) tl.add(0.16, u => setOpacity(fadingBucket, 1 - u), ease.outCubic);
      tl.add(0.45, scene.writer(scene.bucketStatus[ri]), ease.linear);
      prevBucket = scene.bucketStatus[ri];
    });
    const finalBucket = prevBucket;
    if (finalBucket) tl.add(0.2, u => setOpacity(finalBucket, 1 - u), ease.outCubic);
    for (const row of scene.bucketRows) {
      tl.add(0.2, u => setOpacity(row.hl, 0.85 * (1 - u)), ease.outCubic);
    }
    tl.line(8);
    tl.wait(0.15);

    // --- collect the k most frequent ----------------------------------
    let prevCollect = null;
    sim.collected.forEach((item, ci) => {
      const chip = scene.valueChip.get(item.value);
      const row = scene.rowByFreq.get(item.freq);
      if (ci === 0 || item.freq !== sim.collected[ci - 1].freq) tl.line(9);
      tl.line(10);
      tl.add(0.28, u => setOpacity(row.hl, 0.85 * u), ease.outCubic);
      tl.add(0.35, u => {
        setOpacity(chip.tIdle, 1 - u);
        setOpacity(chip.tGreen, u);
        setOpacity(chip.hlg, u);
      }, ease.outCubic);

      const tray = scene.trayChips[ci];
      tl.line(11);
      tl.add(0.45, u => {
        setOpacity(tray.enter, Math.min(1, u * 2));
        setScaleAt(tray.scale, tray.cx, tray.cy, u);
      }, ease.outBack);
      tl.line(12);

      const fadingCollect = prevCollect;
      if (fadingCollect) tl.add(0.16, u => setOpacity(fadingCollect, 1 - u), ease.outCubic);
      tl.add(0.45, scene.writer(scene.collectStatus[ci]), ease.linear);
      prevCollect = scene.collectStatus[ci];
      tl.wait(0.1);
    });
    const finalCollect = prevCollect;
    if (finalCollect) tl.add(0.25, u => setOpacity(finalCollect, 1 - u), ease.outCubic);

    // --- answer -------------------------------------------------------
    tl.line(sim.collected.length === scene.k ? 13 : 14);
    tl.add(0.6, scene.writer(scene.result), ease.linear);
    tl.add(0.4, u => {
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u)));
    }, ease.outCubic);
    tl.wait(1.6);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model: the frames the animation narrates.
 * ------------------------------------------------------------------ */

function simulate(nums, k) {
  const counts = new Map();
  const distinct = [];
  for (const value of nums) {
    if (!counts.has(value)) {
      counts.set(value, 0);
      distinct.push(value);
    }
    counts.set(value, counts.get(value) + 1);
  }

  let maxFreq = 0;
  for (const value of distinct) maxFreq = Math.max(maxFreq, counts.get(value));

  const buckets = new Map();
  for (let f = 1; f <= maxFreq; f++) buckets.set(f, []);
  for (const value of distinct) buckets.get(counts.get(value)).push(value);

  const bucketOrder = [];
  for (let f = maxFreq; f >= 1; f--) if (buckets.get(f).length) bucketOrder.push(f);

  const collected = [];
  for (let f = maxFreq; f >= 1 && collected.length < k; f--) {
    for (const value of buckets.get(f)) {
      collected.push({ value, freq: f });
      if (collected.length === k) break;
    }
  }

  const tally = [];
  const running = new Map();
  nums.forEach((value, i) => {
    running.set(value, (running.get(value) || 0) + 1);
    tally.push({ i, value, count: running.get(value) });
  });

  return { counts, distinct, buckets, bucketOrder, maxFreq, collected, tally };
}
