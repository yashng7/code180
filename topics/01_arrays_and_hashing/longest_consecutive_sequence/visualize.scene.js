/* Longest Consecutive Sequence — animated walkthrough scene (3Blue1Brown style).
 *
 * Show the input chips, build a `num_set` strip from them, then for each
 * candidate ask the O(1) run-start question `value - 1 in set?`. Non-starts are
 * skipped; a true start walks upward, lighting each successor and drawing a
 * link between consecutive values while a running `best` ticks up. The winning
 * run ends up glowing gold and the answer is revealed.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Longest Consecutive Sequence",
    subtitle: "hash set · run starts · O(n)",
    inputs: [
      { id: "nums", label: "nums", type: "text", default: "100, 4, 200, 1, 3, 2", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "candidate" },
      { color: "#83C167", text: "run start" },
      { color: "#5CD0B3", text: "in run" },
      { color: "#F0AC5F", text: "best" },
    ],
  },

  code: [
    "def longest_consecutive(nums: List[int]) -> int:",
    "    num_set = set(nums)",
    "    best = 0",
    "    for value in num_set:",
    "        if value - 1 in num_set:",
    "            continue",
    "        length = 1",
    "        while value + length in num_set:",
    "            length += 1",
    "        best = max(best, length)",
    "    return best",
  ],

  read(values) {
    const raw = (values.nums || "").trim();
    if (!raw) return null;
    const nums = raw.split(/[\s,]+/).filter(Boolean).map(Number);
    if (nums.length < 1 || nums.length > 12) return null;
    if (!nums.every(Number.isInteger)) return null;
    return { nums };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const nums = args[0].map(Number);
      if (nums.length && nums.length <= 12 && nums.every(Number.isInteger)) {
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
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-teal", C.teal);
    ctx.glow("glow-gold", C.gold);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const ptrL = ctx.layer("pointer");
    const arcL = ctx.layer("arcs");
    const resultL = ctx.layer("result");

    const scene = { nums, sim, ctx, numChips: [], setChips: [], setIndex: {} };
    scene._writers = [];
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // --- title + subtitle -------------------------------------------
    scene.title = txt("Longest Consecutive Sequence", {
      x: 64, y: 80, "font-size": 44, fill: C.white, "letter-spacing": 1,
    }, textL);
    const sub = el("text", { x: 64, y: 116, "font-size": 22, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "nums = ";
    el("tspan", { fill: C.white }, sub).textContent = "[" + nums.join(", ") + "]";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // --- input chips (nums) -----------------------------------------
    const gap = n > 9 ? 10 : 14;
    const chipW = clamp((1152 - gap * (n - 1)) / n, 38, 96);
    const chipH = 64;
    const chipTop = 150;
    const totalW = n * chipW + (n - 1) * gap;
    const startX = STAGE_W / 2 - totalW / 2;
    const fontSize = clamp(chipW * 0.42, 13, 34);
    scene.chipW = chipW;

    nums.forEach((value, i) => {
      const x = startX + i * (chipW + gap);
      const pos = el("g", { transform: "translate(" + x + " " + chipTop + ")" }, chipsL);
      const enter = el("g", {}, pos);
      const scale = el("g", {}, enter);
      const cx = chipW / 2, cy = chipH / 2;
      const rx = Math.min(14, chipW * 0.3);
      el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, scale);
      const mk = fill => txt(String(value), {
        x: cx, y: cy + 1, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": fontSize, fill,
      }, scale);
      const idle = mk(C.white);
      const blue = mk(C.blue);
      const teal = mk(C.teal);
      setOpacity(blue, 0);
      setOpacity(teal, 0);
      const hlBlue = el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx, fill: "none",
        stroke: C.blue, "stroke-width": 3, filter: "url(#glow-blue)",
      }, scale);
      const hlTeal = el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx, fill: "none",
        stroke: C.teal, "stroke-width": 3, filter: "url(#glow-teal)",
      }, scale);
      setOpacity(hlBlue, 0);
      setOpacity(hlTeal, 0);
      txt(String(i), {
        x: cx, y: -14, "text-anchor": "middle", "font-size": 16, fill: C.grey,
      }, enter);
      setOpacity(enter, 0);
      scene.numChips.push({
        i, value, pos, enter, scale, cx, cy, rx,
        textIdle: idle, textBlue: blue, textTeal: teal, hlBlue, hlTeal, gx: x + cx,
      });
    });

    // --- num_set strip ----------------------------------------------
    scene.setCaption = txt("num_set = set(nums)", {
      x: 64, y: 286, "font-size": 22, fill: C.grey,
    }, textL);
    setOpacity(scene.setCaption, 0);

    const m = Math.max(sim.sorted.length, 1);
    const sGap = 14;
    const sW = clamp((1152 - sGap * (m - 1)) / m, 40, 96);
    const sH = 58;
    const sTop = 306;
    const sTotal = m * sW + (m - 1) * sGap;
    const sStart = STAGE_W / 2 - sTotal / 2;
    const sFont = clamp(sW * 0.42, 13, 30);
    scene.setTop = sTop;
    scene.setH = sH;

    sim.sorted.forEach((value, j) => {
      const x = sStart + j * (sW + sGap);
      const pos = el("g", { transform: "translate(" + x + " " + sTop + ")" }, chipsL);
      const enter = el("g", {}, pos);
      const scale = el("g", {}, enter);
      const cx = sW / 2, cy = sH / 2;
      const rx = Math.min(12, sW * 0.3);
      el("rect", {
        x: 0, y: 0, width: sW, height: sH, rx,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, scale);
      const mk = fill => txt(String(value), {
        x: cx, y: cy + 1, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": sFont, fill,
      }, scale);
      const idle = mk(C.white);
      const blue = mk(C.blue);
      const green = mk(C.green);
      const teal = mk(C.teal);
      setOpacity(blue, 0);
      setOpacity(green, 0);
      setOpacity(teal, 0);
      const hlBlue = el("rect", {
        x: 0, y: 0, width: sW, height: sH, rx, fill: "none",
        stroke: C.blue, "stroke-width": 3, filter: "url(#glow-blue)",
      }, scale);
      const hlGreen = el("rect", {
        x: 0, y: 0, width: sW, height: sH, rx, fill: "none",
        stroke: C.green, "stroke-width": 3, filter: "url(#glow-green)",
      }, scale);
      const hlTeal = el("rect", {
        x: 0, y: 0, width: sW, height: sH, rx, fill: "none",
        stroke: C.teal, "stroke-width": 3, filter: "url(#glow-teal)",
      }, scale);
      const hlGold = el("rect", {
        x: 0, y: 0, width: sW, height: sH, rx, fill: "none",
        stroke: C.gold, "stroke-width": 3.5, filter: "url(#glow-gold)",
      }, scale);
      setOpacity(hlBlue, 0);
      setOpacity(hlGreen, 0);
      setOpacity(hlTeal, 0);
      setOpacity(hlGold, 0);
      setOpacity(enter, 0);
      const chip = {
        j, value, pos, enter, scale, cx, cy, rx,
        textIdle: idle, textBlue: blue, textGreen: green, textTeal: teal,
        hlBlue, hlGreen, hlTeal, hlGold, gx: x + cx,
      };
      scene.setChips.push(chip);
      scene.setIndex[value] = chip;
    });

    // --- candidate pointer (points up at the set strip) -------------
    const pointer = el("g", {}, ptrL);
    el("line", {
      x1: 0, y1: 40, x2: 0, y2: 14,
      stroke: C.blue, "stroke-width": 3.5, "stroke-linecap": "round",
    }, pointer);
    el("path", { d: "M -10 14 L 0 0 L 10 14 Z", fill: C.blue }, pointer);
    setOpacity(pointer, 0);
    scene.pointer = pointer;
    scene.pointerY = sTop + sH + 2;
    setTranslate(pointer, scene.setChips[0].gx, scene.pointerY);

    // --- per-candidate links between consecutive run values ---------
    sim.candidates.forEach(cand => {
      cand.arcs = [];
      for (let k = 1; k < cand.chain.length; k++) {
        const a = scene.setIndex[cand.chain[k - 1]];
        const b = scene.setIndex[cand.chain[k]];
        if (!a || !b) continue;
        const y = sTop;
        const ctrlY = sTop - clamp(44 + 12 * (k - 1), 44, 88);
        const path = el("path", {
          d: "M " + a.gx + " " + y + " Q " + ((a.gx + b.gx) / 2) + " " + ctrlY + " " + b.gx + " " + y,
          fill: "none", stroke: C.teal, "stroke-width": 3, "stroke-linecap": "round",
        }, arcL);
        const len = path.getTotalLength();
        path.setAttribute("stroke-dasharray", String(len));
        path.setAttribute("stroke-dashoffset", String(len));
        cand.arcs.push({ path, len });
      }
    });

    // --- narration text lines ---------------------------------------
    scene.question = txt("", {
      x: STAGE_W / 2, y: 452, "text-anchor": "middle", "font-size": 27, fill: C.grey,
    }, textL);
    scene.verdict = txt("", {
      x: STAGE_W / 2, y: 488, "text-anchor": "middle", "font-size": 23, fill: C.grey,
    }, textL);
    scene.walk = txt("", {
      x: STAGE_W / 2, y: 526, "text-anchor": "middle", "font-size": 23, fill: C.teal,
    }, textL);
    scene.best = txt("", {
      x: STAGE_W / 2, y: 562, "text-anchor": "middle", "font-size": 23, fill: C.gold,
    }, textL);
    setOpacity(scene.question, 0);
    setOpacity(scene.verdict, 0);
    setOpacity(scene.walk, 0);
    setOpacity(scene.best, 0);

    // --- result + underline -----------------------------------------
    scene.result = txt("return " + sim.best, {
      x: STAGE_W / 2, y: 636, "text-anchor": "middle", "font-size": 40, fill: C.green,
    }, resultL);
    const rule = el("line", {
      x1: STAGE_W / 2 - 150, y1: 658, x2: STAGE_W / 2 + 150, y2: 658,
      stroke: C.green, "stroke-width": 4, "stroke-linecap": "round",
    }, resultL);
    const ruleLen = rule.getTotalLength();
    rule.setAttribute("stroke-dasharray", String(ruleLen));
    rule.setAttribute("stroke-dashoffset", String(ruleLen));
    scene.resultRule = rule;
    scene.ruleLen = ruleLen;

    // --- baseline state: the timeline replays from here ---------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.setCaption, 0);
      for (const chip of scene.numChips) {
        setOpacity(chip.enter, 0);
        chip.enter.setAttribute("transform", "translate(0 0)");
        setScaleAt(chip.scale, chip.cx, chip.cy, 1);
        setOpacity(chip.textIdle, 1);
        setOpacity(chip.textBlue, 0);
        setOpacity(chip.textTeal, 0);
        setOpacity(chip.hlBlue, 0);
        setOpacity(chip.hlTeal, 0);
      }
      for (const c of scene.setChips) {
        setOpacity(c.enter, 0);
        setScaleAt(c.scale, c.cx, c.cy, 1);
        setOpacity(c.textIdle, 1);
        setOpacity(c.textBlue, 0);
        setOpacity(c.textGreen, 0);
        setOpacity(c.textTeal, 0);
        setOpacity(c.hlBlue, 0);
        setOpacity(c.hlGreen, 0);
        setOpacity(c.hlTeal, 0);
        setOpacity(c.hlGold, 0);
      }
      setOpacity(scene.pointer, 0);
      setTranslate(scene.pointer, scene.setChips[0].gx, scene.pointerY);
      scene.question.textContent = "";
      scene.verdict.textContent = "";
      scene.walk.textContent = "";
      scene.best.textContent = "";
      setOpacity(scene.question, 0);
      setOpacity(scene.verdict, 0);
      setOpacity(scene.walk, 0);
      setOpacity(scene.best, 0);
      for (const cand of sim.candidates) {
        for (const arc of cand.arcs) arc.path.setAttribute("stroke-dashoffset", String(arc.len));
      }
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt } = ctx;
    const { nums, sim } = scene;

    // --- set-chip state machine (idle <-> candidate / start / run) ----
    const STATE = {
      idle:      { textIdle: 1, textBlue: 0, textGreen: 0, textTeal: 0, hlBlue: 0, hlGreen: 0, hlTeal: 0 },
      candidate: { textIdle: 0, textBlue: 1, textGreen: 0, textTeal: 0, hlBlue: 1, hlGreen: 0, hlTeal: 0 },
      start:     { textIdle: 0, textBlue: 0, textGreen: 1, textTeal: 0, hlBlue: 0, hlGreen: 1, hlTeal: 0 },
      run:       { textIdle: 0, textBlue: 0, textGreen: 0, textTeal: 1, hlBlue: 0, hlGreen: 0, hlTeal: 1 },
    };
    const applyState = (chip, from, to, u) => {
      const A = STATE[from], B = STATE[to];
      setOpacity(chip.textIdle, A.textIdle + (B.textIdle - A.textIdle) * u);
      setOpacity(chip.textBlue, A.textBlue + (B.textBlue - A.textBlue) * u);
      setOpacity(chip.textGreen, A.textGreen + (B.textGreen - A.textGreen) * u);
      setOpacity(chip.textTeal, A.textTeal + (B.textTeal - A.textTeal) * u);
      setOpacity(chip.hlBlue, A.hlBlue + (B.hlBlue - A.hlBlue) * u);
      setOpacity(chip.hlGreen, A.hlGreen + (B.hlGreen - A.hlGreen) * u);
      setOpacity(chip.hlTeal, A.hlTeal + (B.hlTeal - A.hlTeal) * u);
    };
    const goState = (chip, to, dur) => {
      const from = chip.state || "idle";
      if (from === to) return;
      chip.state = to;
      tl.add(dur, u => applyState(chip, from, to, u), ease.outCubic);
    };

    // --- num-chip state machine (idle <-> candidate / run) ------------
    const NSTATE = {
      idle:      { textIdle: 1, textBlue: 0, textTeal: 0, hlBlue: 0, hlTeal: 0 },
      candidate: { textIdle: 0, textBlue: 1, textTeal: 0, hlBlue: 1, hlTeal: 0 },
      run:       { textIdle: 0, textBlue: 0, textTeal: 1, hlBlue: 0, hlTeal: 1 },
    };
    const applyN = (chip, from, to, u) => {
      const A = NSTATE[from], B = NSTATE[to];
      setOpacity(chip.textIdle, A.textIdle + (B.textIdle - A.textIdle) * u);
      setOpacity(chip.textBlue, A.textBlue + (B.textBlue - A.textBlue) * u);
      setOpacity(chip.textTeal, A.textTeal + (B.textTeal - A.textTeal) * u);
      setOpacity(chip.hlBlue, A.hlBlue + (B.hlBlue - A.hlBlue) * u);
      setOpacity(chip.hlTeal, A.hlTeal + (B.hlTeal - A.hlTeal) * u);
    };
    const goN = (chip, to, dur) => {
      const from = chip.nstate || "idle";
      if (from === to) return;
      chip.nstate = to;
      tl.add(dur, u => applyN(chip, from, to, u), ease.outCubic);
    };
    const numsFor = value => scene.numChips.filter(c => c.value === value);

    const setLine = (node, text, fill, fadeOut) => {
      if (fadeOut) tl.add(fadeOut, u => setOpacity(node, 1 - u), ease.outCubic);
      tl.add(0.001, () => { node.textContent = text; node.setAttribute("fill", fill); });
      tl.add(0.28, u => setOpacity(node, u), ease.outCubic);
      tl.log(text, fill);
    };

    // --- intro --------------------------------------------------------
    tl.line(1);
    tl.add(0.6, scene.writer(scene.title), ease.outCubic);
    tl.add(0.4, u => setOpacity(scene.subtitle, u), ease.outCubic);
    for (const chip of scene.numChips) {
      tl.add(0.3, u => {
        setOpacity(chip.enter, u);
        chip.enter.setAttribute("transform", "translate(0 " + (1 - u) * 14 + ")");
      }, ease.outCubic);
      tl.wait(0.05);
    }

    // --- build num_set ------------------------------------------------
    tl.line(2);
    tl.add(0.4, u => setOpacity(scene.setCaption, u), ease.outCubic);
    for (const c of scene.setChips) {
      tl.add(0.35, u => {
        setOpacity(c.enter, Math.min(1, u * 2));
        setScaleAt(c.scale, c.cx, c.cy, u);
      }, ease.outBack);
      tl.wait(0.04);
    }
    tl.line(3);
    tl.wait(0.2);

    // --- narrate each candidate ---------------------------------------
    let walkShown = false, bestShown = false, goldChips = [], bestLen = 0;
    sim.candidates.forEach((cand, ci) => {
      const chip = scene.setIndex[cand.value];

      tl.line(4);
      // pointer glides across the strip
      if (ci === 0) {
        tl.add(0.45, u => {
          setOpacity(scene.pointer, u);
          setTranslate(scene.pointer, chip.gx, scene.pointerY);
        }, ease.outCubic);
      } else {
        const from = scene.setIndex[sim.candidates[ci - 1].value].gx;
        tl.add(0.45, u => setTranslate(scene.pointer, from + (chip.gx - from) * u, scene.pointerY), ease.inOutSine);
      }

      // light the candidate
      goState(chip, "candidate", 0.3);
      for (const c of numsFor(cand.value)) goN(c, "candidate", 0.3);
      tl.add(0.35, u => setScaleAt(chip.scale, chip.cx, chip.cy, 1 + 0.05 * Math.sin(Math.PI * u)), ease.linear);

      // the run-start question
      tl.line(5);
      setLine(scene.question, "is " + (cand.value - 1) + " in num_set?", "#6b7684", 0.2);

      if (!cand.isStart) {
        tl.line(6);
        setLine(scene.verdict, (cand.value - 1) + " is in the set → not a run start, skip", "#6b7684", 0.18);
        tl.add(0.35, u => setScaleAt(chip.scale, chip.cx, chip.cy, 1 + 0.04 * Math.sin(Math.PI * u)), ease.linear);
        goState(chip, "idle", 0.3);
        for (const c of numsFor(cand.value)) goN(c, "idle", 0.3);
        tl.add(0.3, u => setOpacity(scene.verdict, 1 - u * 0.75), ease.outCubic);
        tl.wait(0.12);
        return;
      }

      // a real run start
      goState(chip, "start", 0.3);
      setLine(scene.verdict, (cand.value - 1) + " is not in the set → run start!", "#83C167", 0.18);
      tl.add(0.4, u => setScaleAt(chip.scale, chip.cx, chip.cy, 1 + 0.07 * Math.sin(Math.PI * u)), ease.linear);

      if (!walkShown) { tl.add(0.28, u => setOpacity(scene.walk, u), ease.outCubic); walkShown = true; }
      tl.line(7);
      tl.add(0.001, () => {
        scene.walk.textContent = "run so far:  " + cand.value + "   (length 1)";
      });
      tl.log("run so far:  " + cand.value + "   (length 1)", ctx.C.teal);

      // walk upward, lighting each successor and linking them
      for (let k = 1; k < cand.chain.length; k++) {
        const cur = scene.setIndex[cand.chain[k]];
        tl.line(8);
        goState(cur, "run", 0.28);
        for (const c of numsFor(cur.value)) goN(c, "run", 0.28);
        const arc = cand.arcs[k - 1];
        if (arc) tl.add(0.4, u => arc.path.setAttribute("stroke-dashoffset", String(arc.len * (1 - u))), ease.inOutSine);
        tl.line(9);
        const walkText = "run so far:  " + cand.chain.slice(0, k + 1).join(" → ") + "   (length " + (k + 1) + ")";
        tl.add(0.001, () => {
          scene.walk.textContent = walkText;
        });
        tl.log(walkText, ctx.C.teal);
        tl.add(0.3, u => setScaleAt(cur.scale, cur.cx, cur.cy, 1 + 0.06 * Math.sin(Math.PI * u)), ease.linear);
        tl.wait(0.1);
      }

      // running best + a gold glow on the current champion
      tl.line(10);
      tl.add(0.001, () => { scene.best.textContent = "best = " + cand.bestAfter; });
      tl.log("best = " + cand.bestAfter, ctx.C.gold);
      if (!bestShown) { tl.add(0.3, u => setOpacity(scene.best, u), ease.outCubic); bestShown = true; }
      if (cand.bestAfter === cand.length && cand.length > 1 && cand.length > bestLen) {
        const winners = cand.chain.map(v => scene.setIndex[v]);
        for (const c of goldChips) tl.add(0.25, u => setOpacity(c.hlGold, 1 - u), ease.outCubic);
        for (const c of winners) tl.add(0.3, u => setOpacity(c.hlGold, u), ease.outCubic);
        goldChips = winners;
        bestLen = cand.length;
      }
      tl.wait(0.35);
    });

    // --- finale: dim the rest, glow the winner, reveal the answer -----
    tl.line(11);
    tl.add(0.4, u => {
      setOpacity(scene.question, 1 - u);
      setOpacity(scene.verdict, 1 - u);
      setOpacity(scene.walk, 1 - u);
      setOpacity(scene.pointer, 1 - u);
    }, ease.outCubic);
    for (const c of scene.setChips) {
      if (sim.bestChain.indexOf(c.value) < 0) {
        tl.add(0.4, u => setOpacity(c.enter, 1 - 0.62 * u), ease.outCubic);
      }
    }
    for (const v of sim.bestChain) {
      const c = scene.setIndex[v];
      if (c) tl.add(0.35, u => setOpacity(c.hlGold, u), ease.outCubic);
      for (const nchip of numsFor(v)) goN(nchip, "run", 0.35);
    }

    tl.add(0.6, scene.writer(scene.result), ease.linear);
    tl.add(0.45, u => {
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u)));
    }, ease.outCubic);
    tl.wait(1.6);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model: the runs the animation narrates.
 * ------------------------------------------------------------------ */

function simulate(nums) {
  const set = new Set(nums);
  const sorted = Array.from(set).sort((a, b) => a - b);
  const candidates = [];
  let best = 0;
  let bestChain = [];

  for (const value of sorted) {
    const isStart = !set.has(value - 1);
    const cand = { value, isStart, chain: [value] };
    if (isStart) {
      while (set.has(value + cand.chain.length)) cand.chain.push(value + cand.chain.length);
      cand.length = cand.chain.length;
      if (cand.length > best) {
        best = cand.length;
        bestChain = cand.chain.slice();
      }
      cand.bestAfter = best;
    }
    candidates.push(cand);
  }
  return { sorted, candidates, best, bestChain };
}
