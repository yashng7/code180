/* 3Sum — animated walkthrough scene (3Blue1Brown style).
 *
 * First sort the array so duplicates sit side by side and monotonic two-pointer
 * sweeps work. Each chip smoothly glides from its original position into its
 * sorted slot. Then walk the anchor `i` (gold) left-to-right while squeezing
 * `l` (blue) and `r` (teal) inward:
 *   - sum < 0  -> advance `l` to increase the sum
 *   - sum > 0  -> retreat `r` to decrease the sum
 *   - sum == 0 -> light the triplet green, arc the three elements together,
 *                 drop a badge into the output tray, and skip duplicates.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "3Sum",
    subtitle: "sort + fix anchor + two pointers · O(n²) time · O(1) space",
    inputs: [
      { id: "nums", label: "nums", type: "text", default: "-1, 0, 1, 2, -1, -4", width: "wide" },
    ],
    legend: [
      { color: "#F0AC5F", text: "anchor i" },
      { color: "#58C4DD", text: "left l" },
      { color: "#5CD0B3", text: "right r" },
      { color: "#83C167", text: "triplet = 0" },
    ],
  },

  code: [
    "def three_sum(nums: List[int]) -> List[List[int]]:",
    "    nums.sort()",
    "    result: List[List[int]] = []",
    "    n = len(nums)",
    "    for i in range(n - 2):",
    "        if i > 0 and nums[i] == nums[i - 1]:",
    "            continue",
    "        if nums[i] > 0:",
    "            break",
    "        left, right = i + 1, n - 1",
    "        while left < right:",
    "            total = nums[i] + nums[left] + nums[right]",
    "            if total < 0:",
    "                left += 1",
    "            elif total > 0:",
    "                right -= 1",
    "            else:",
    "                result.append([nums[i], nums[left], nums[right]])",
    "                left += 1",
    "                right -= 1",
    "                while left < right and nums[left] == nums[left - 1]:",
    "                    left += 1",
    "                while left < right and nums[right] == nums[right + 1]:",
    "                    right -= 1",
    "    return result",
  ],

  read(values) {
    const raw = (values.nums || "").trim();
    if (!raw) return null;
    const nums = raw.split(/[\s,]+/).filter(Boolean).map(Number);
    if (nums.length < 3 || nums.length > 10) return null;
    if (!nums.every(Number.isInteger)) return null;
    return { nums };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const nums = args[0].map(Number);
      if (nums.length >= 3 && nums.length <= 10 && nums.every(Number.isInteger)) {
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
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-teal", C.teal);
    ctx.glow("glow-green", C.green);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const ptrL = ctx.layer("pointer");
    const arcL = ctx.layer("arcs");
    const resultL = ctx.layer("result");

    const scene = {
      nums, sim, ctx,
      chips: [], idxLabels: [], sums: [], cmps: [], arcs: [], badges: [],
      _writers: [], writables: [],
    };
    scene.writer = node => {
      const w = writable(node);
      w(0);
      scene._writers.push(w);
      scene.writables.push(node);
      return w;
    };

    // -- title + subtitle -------------------------------------------------
    scene.title = txt("3Sum", {
      x: 64, y: 76, "font-size": 46, fill: C.white, "letter-spacing": 1,
    }, textL);
    const sub = el("text", { x: 64, y: 114, "font-size": 22, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "nums = ";
    el("tspan", { fill: C.white }, sub).textContent = "[" + nums.join(", ") + "]";
    el("tspan", { fill: C.grey }, sub).textContent = "   →   sorted = ";
    el("tspan", { fill: C.teal }, sub).textContent = "[" + sim.sorted.join(", ") + "]";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- array chips (built in sorted order, animated from origX -> sortedX) --
    const gap = n > 8 ? 12 : 16;
    const chipW = clamp((1120 - gap * (n - 1)) / n, 44, 98);
    const chipH = 82;
    const chipTop = 212;
    const totalW = n * chipW + (n - 1) * gap;
    const startX = STAGE_W / 2 - totalW / 2;
    const fontSize = clamp(chipW * 0.42, 15, 36);
    scene.chipW = chipW;
    scene.chipH = chipH;
    scene.chipTop = chipTop;

    const slotX = k => startX + k * (chipW + gap);

    sim.items.forEach((item, sortedIdx) => {
      const origX = slotX(item.origIdx);
      const sortedX = slotX(sortedIdx);
      const pos = el("g", { transform: "translate(" + origX + " " + chipTop + ")" }, chipsL);
      const enter = el("g", {}, pos);
      const scale = el("g", {}, enter);
      const cx = chipW / 2, cy = chipH / 2;
      const rx = Math.min(14, chipW * 0.28);

      el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, scale);

      const mkText = fill => txt(String(item.value), {
        x: cx, y: cy + 1, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": fontSize, fill,
      }, scale);
      const textIdle = mkText(C.white);
      const textGold = mkText(C.gold);
      const textBlue = mkText(C.blue);
      const textTeal = mkText(C.teal);
      const textGreen = mkText(C.green);
      setOpacity(textGold, 0);
      setOpacity(textBlue, 0);
      setOpacity(textTeal, 0);
      setOpacity(textGreen, 0);

      const ring = (color, glow, w) => {
        const r = el("rect", {
          x: 0, y: 0, width: chipW, height: chipH, rx, fill: "none",
          stroke: color, "stroke-width": w, filter: "url(#" + glow + ")",
        }, scale);
        setOpacity(r, 0);
        return r;
      };
      const hlGold = ring(C.gold, "glow-gold", 3.2);
      const hlBlue = ring(C.blue, "glow-blue", 3);
      const hlTeal = ring(C.teal, "glow-teal", 3);
      const hlGreen = ring(C.green, "glow-green", 3.6);

      const idxLab = txt(String(sortedIdx), {
        x: sortedX + cx, y: chipTop - 14, "text-anchor": "middle", "font-size": 15, fill: C.grey,
      }, textL);
      setOpacity(idxLab, 0);
      scene.idxLabels.push(idxLab);

      setOpacity(enter, 0);
      scene.chips.push({
        sortedIdx, origIdx: item.origIdx, value: item.value,
        origX, sortedX, gx: sortedX + cx,
        pos, enter, scale, cx, cy, rx,
        textIdle, textGold, textBlue, textTeal, textGreen,
        hlGold, hlBlue, hlTeal, hlGreen,
      });
    });

    // -- pointers i, l, r below the array ---------------------------------
    const ptrY = chipTop + chipH + 10;
    scene.ptrY = ptrY;
    function buildPointer(color, glowId, label) {
      const g = el("g", {}, ptrL);
      el("path", { d: "M -8 12 L 0 -2 L 8 12 Z", fill: color, filter: "url(#" + glowId + ")" }, g);
      el("line", {
        x1: 0, y1: 12, x2: 0, y2: 32,
        stroke: color, "stroke-width": 3.2, "stroke-linecap": "round",
      }, g);
      txt(label, {
        x: 0, y: 54, "text-anchor": "middle", "font-size": 21,
        fill: color, "font-weight": "bold",
      }, g);
      setOpacity(g, 0);
      return { g };
    }
    scene.iPtr = buildPointer(C.gold, "glow-gold", "i");
    scene.lPtr = buildPointer(C.blue, "glow-blue", "l");
    scene.rPtr = buildPointer(C.teal, "glow-teal", "r");

    // -- narration lines per step -----------------------------------------
    sim.steps.forEach(step => {
      const sumNode = el("text", {
        x: STAGE_W / 2, y: 422, "text-anchor": "middle", "font-size": 27,
      }, textL);
      const part = (str, fill) => {
        const t = el("tspan", fill ? { fill } : {}, sumNode);
        t.textContent = str;
      };
      if (step.kind === "sort") {
        part("Step 1 · ", C.teal);
        part("sort nums ascending so duplicates are adjacent", C.white);
      } else if (step.kind === "skip_i") {
        part("anchor ", C.grey);
        part("i = " + step.i, C.gold);
        part("  (nums[" + step.i + "] = " + sim.sorted[step.i] + ")", C.grey);
      } else if (step.kind === "pos_i") {
        part("anchor ", C.grey);
        part("nums[" + step.i + "] = " + sim.sorted[step.i] + " > 0", C.gold);
      } else if (step.i != null && step.l != null && step.r != null) {
        const a = sim.sorted[step.i], b = sim.sorted[step.l], c = sim.sorted[step.r];
        part("nums[" + step.i + "]", C.gold);
        part(" + ", C.grey);
        part("nums[" + step.l + "]", C.blue);
        part(" + ", C.grey);
        part("nums[" + step.r + "]", C.teal);
        part("  =  ", C.grey);
        part(fmtNum(a), C.gold);
        part(" + ", C.grey);
        part(fmtNum(b), C.blue);
        part(" + ", C.grey);
        part(fmtNum(c), C.teal);
        part("  =  ", C.grey);
        part(String(step.sum), step.sum === 0 ? C.green : C.white);
      } else {
        part("scan complete", C.grey);
      }
      scene.sums.push(sumNode);

      const cmpColor = step.kind === "found" ? C.green
        : (step.kind === "move_l" ? C.blue
          : (step.kind === "move_r" ? C.teal
            : (step.kind === "anchor" ? C.gold : C.grey)));
      const cmpNode = txt(step.message, {
        x: STAGE_W / 2, y: 462, "text-anchor": "middle", "font-size": 22,
        fill: cmpColor,
      }, textL);
      scene.cmps.push(cmpNode);

      // connecting two-hop arc for each found triplet
      if (step.kind === "found") {
        const ci = scene.chips[step.i];
        const cl = scene.chips[step.l];
        const cr = scene.chips[step.r];
        const y = chipTop - 6;
        const c1Y = chipTop - clamp(46 + Math.abs(cl.gx - ci.gx) * 0.14, 46, 78);
        const c2Y = chipTop - clamp(46 + Math.abs(cr.gx - cl.gx) * 0.14, 46, 78);
        const d = "M " + ci.gx + " " + y
          + " Q " + ((ci.gx + cl.gx) / 2) + " " + c1Y + " " + cl.gx + " " + y
          + " Q " + ((cl.gx + cr.gx) / 2) + " " + c2Y + " " + cr.gx + " " + y;
        const path = el("path", {
          d, fill: "none", stroke: C.green, "stroke-width": 3.4,
          "stroke-linecap": "round", filter: "url(#glow-green)",
        }, arcL);
        const len = path.getTotalLength();
        path.setAttribute("stroke-dasharray", String(len));
        path.setAttribute("stroke-dashoffset", String(len));
        scene.arcs.push({ path, len });
      } else {
        scene.arcs.push(null);
      }
    });

    // -- discovered triplets tray -----------------------------------------
    scene.trayCaption = txt("zero-sum triplets:", {
      x: 64, y: 548, "font-size": 21, fill: C.grey,
    }, textL);
    setOpacity(scene.trayCaption, 0);

    const badgeW = 168, badgeH = 48, badgeGap = 18;
    const badgeStartX = 270, badgeTop = 516;
    sim.triplets.forEach((trip, ti) => {
      const bx = badgeStartX + ti * (badgeW + badgeGap);
      const pos = el("g", { transform: "translate(" + bx + " " + badgeTop + ")" }, chipsL);
      const enter = el("g", {}, pos);
      const scale = el("g", {}, enter);
      const cx = badgeW / 2, cy = badgeH / 2;
      el("rect", {
        x: 0, y: 0, width: badgeW, height: badgeH, rx: 12,
        fill: C.chipFill, stroke: C.green, "stroke-width": 2.5,
        filter: "url(#glow-green)",
      }, scale);
      txt("[" + trip.join(", ") + "]", {
        x: cx, y: cy + 1, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": 22, fill: C.green, "font-weight": "bold",
      }, scale);
      setOpacity(enter, 0);
      scene.badges.push({ enter, scale, cx, cy });
    });

    // -- final result + underline -----------------------------------------
    const resStr = sim.triplets.length
      ? "return [" + sim.triplets.map(t => "[" + t.join(", ") + "]").join(", ") + "]"
      : "return []";
    scene.result = txt(resStr, {
      x: STAGE_W / 2, y: 646, "text-anchor": "middle",
      "font-size": sim.triplets.length > 2 ? 34 : 40,
      fill: sim.triplets.length ? C.green : C.grey,
    }, resultL);
    const rule = el("line", {
      x1: STAGE_W / 2 - 170, y1: 668, x2: STAGE_W / 2 + 170, y2: 668,
      stroke: sim.triplets.length ? C.green : C.greyDark,
      "stroke-width": 4, "stroke-linecap": "round",
    }, resultL);
    const ruleLen = rule.getTotalLength();
    rule.setAttribute("stroke-dasharray", String(ruleLen));
    rule.setAttribute("stroke-dashoffset", String(ruleLen));
    scene.resultRule = rule;
    scene.ruleLen = ruleLen;

    // -- deterministic reset for timeline scrubbing -----------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.trayCaption, 0);
      for (const lab of scene.idxLabels) setOpacity(lab, 0);
      for (const chip of scene.chips) {
        setOpacity(chip.enter, 0);
        chip.enter.setAttribute("transform", "translate(0 0)");
        setTranslate(chip.pos, chip.origX, scene.chipTop);
        setScaleAt(chip.scale, chip.cx, chip.cy, 1);
        setOpacity(chip.textIdle, 1);
        setOpacity(chip.textGold, 0);
        setOpacity(chip.textBlue, 0);
        setOpacity(chip.textTeal, 0);
        setOpacity(chip.textGreen, 0);
        setOpacity(chip.hlGold, 0);
        setOpacity(chip.hlBlue, 0);
        setOpacity(chip.hlTeal, 0);
        setOpacity(chip.hlGreen, 0);
      }
      setOpacity(scene.iPtr.g, 0);
      setOpacity(scene.lPtr.g, 0);
      setOpacity(scene.rPtr.g, 0);
      for (const b of scene.badges) {
        setOpacity(b.enter, 0);
        setScaleAt(b.scale, b.cx, b.cy, 1);
      }
      for (const arc of scene.arcs) {
        if (arc) {
          arc.path.setAttribute("stroke-dashoffset", String(arc.len));
          setOpacity(arc.path, 1);
        }
      }
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt } = ctx;
    const { chips, sim } = scene;

    // -- intro: title + unsorted chips ------------------------------------
    tl.line(1);
    tl.add(0.55, scene.writer(scene.title), ease.outCubic);
    tl.add(0.38, u => setOpacity(scene.subtitle, u), ease.outCubic);

    // reveal chips in their original input order
    const byOrig = chips.slice().sort((a, b) => a.origIdx - b.origIdx);
    byOrig.forEach(chip => {
      tl.add(0.22, u => {
        setOpacity(chip.enter, u);
        chip.enter.setAttribute("transform", "translate(0 " + (1 - u) * 16 + ")");
      }, ease.outCubic);
      tl.wait(0.04);
    });
    tl.line([3, 4]);
    tl.add(0.3, u => setOpacity(scene.trayCaption, u), ease.outCubic);

    let prevSum = null, prevCmp = null;
    let curI = null, curL = null, curR = null;
    let ptrVisible = false;
    let badgeIdx = 0;
    let prevI = null;

    // helper to smoothly transition chip role highlights
    const highlightRoles = (nextI, nextL, nextR, isFound) => {
      const pI = curI, pL = curL, pR = curR;
      tl.add(0.28, u => {
        for (let k = 0; k < chips.length; k++) {
          const c = chips[k];
          const wasI = k === pI, wasL = k === pL, wasR = k === pR;
          const nowI = k === nextI, nowL = k === nextL, nowR = k === nextR;
          const gI = wasI ? (nowI ? 1 : 1 - u) : (nowI ? u : 0);
          const gL = wasL ? (nowL ? 1 : 1 - u) : (nowL ? u : 0);
          const gR = wasR ? (nowR ? 1 : 1 - u) : (nowR ? u : 0);
          setOpacity(c.hlGold, isFound && nowI ? 1 - u : gI);
          setOpacity(c.hlBlue, isFound && nowL ? 1 - u : gL);
          setOpacity(c.hlTeal, isFound && nowR ? 1 - u : gR);
          setOpacity(c.hlGreen, isFound && (nowI || nowL || nowR) ? u : 0);

          setOpacity(c.textGold, isFound && nowI ? 1 - u : gI);
          setOpacity(c.textBlue, isFound && nowL ? 1 - u : gL);
          setOpacity(c.textTeal, isFound && nowR ? 1 - u : gR);
          setOpacity(c.textGreen, isFound && (nowI || nowL || nowR) ? u : 0);
          const colored = Math.max(
            isFound && (nowI || nowL || nowR) ? u : 0,
            isFound && nowI ? 1 - u : gI,
            isFound && nowL ? 1 - u : gL,
            isFound && nowR ? 1 - u : gR
          );
          setOpacity(c.textIdle, 1 - colored);
        }
      }, ease.outCubic);
      curI = nextI;
      curL = nextL;
      curR = nextR;
    };

    sim.steps.forEach((step, si) => {
      let sumLine = 12;
      if (step.kind === "sort") {
        sumLine = 2;
        tl.line(2);
      } else if (step.kind === "skip_i" || step.kind === "pos_i") {
        sumLine = 5;
        tl.line(5);
      } else {
        if (si === 0 || step.i !== prevI) {
          tl.line(5);
          tl.line(10);
        }
        tl.line(11);
      }

      const fadingSum = prevSum;
      if (fadingSum) tl.add(0.14, u => setOpacity(fadingSum, 1 - u), ease.outCubic);
      tl.line(sumLine);
      tl.add(0.36, scene.writer(scene.sums[si]), ease.linear);
      if (step.kind !== "sort") {
        tl.line(step.kind === "skip_i" ? 6
          : (step.kind === "pos_i" ? 8
            : (step.kind === "move_l" ? 13
              : (step.kind === "move_r" ? 15 : 17))));
      }
      const fadingCmp = prevCmp;
      if (fadingCmp) tl.add(0.12, u => setOpacity(fadingCmp, 1 - u), ease.outCubic);
      tl.add(0.32, scene.writer(scene.cmps[si]), ease.linear);
      prevSum = scene.sums[si];
      prevCmp = scene.cmps[si];

      if (step.kind === "sort") {
        // glide every chip from origX -> sortedX along a distinct arc
        tl.add(0.75, u => {
          for (const chip of chips) {
            const x = chip.origX + (chip.sortedX - chip.origX) * u;
            const lift = (chip.sortedIdx - chip.origIdx) * 9 * Math.sin(Math.PI * u);
            setTranslate(chip.pos, x, scene.chipTop + lift);
          }
          for (const lab of scene.idxLabels) setOpacity(lab, u);
        }, ease.inOutSine);
        tl.wait(0.2);
        return;
      }

      if (step.kind === "skip_i" || step.kind === "pos_i") {
        const ic = chips[step.i];
        const fromX = curI != null ? chips[curI].gx : ic.gx;
        const hadLR = ptrVisible;
        tl.line(step.kind === "skip_i" ? 7 : 9);
        tl.add(0.32, u => {
          setOpacity(scene.iPtr.g, 1);
          setOpacity(scene.lPtr.g, hadLR ? 1 - u : 0);
          setOpacity(scene.rPtr.g, hadLR ? 1 - u : 0);
          setTranslate(scene.iPtr.g, fromX + (ic.gx - fromX) * u, scene.ptrY);
        }, ease.inOutSine);
        ptrVisible = false;
        highlightRoles(step.i, null, null, false);
        tl.add(0.35, u => {
          setScaleAt(ic.scale, ic.cx, ic.cy, 1 + 0.05 * Math.sin(Math.PI * u));
        }, ease.linear);
        prevI = step.i;
        return;
      }

      if (step.i != null && step.l != null && step.r != null) {
        const ic = chips[step.i], lc = chips[step.l], rc = chips[step.r];
        if (!ptrVisible) {
          tl.add(0.38, u => {
            setOpacity(scene.iPtr.g, u);
            setOpacity(scene.lPtr.g, u);
            setOpacity(scene.rPtr.g, u);
            setTranslate(scene.iPtr.g, ic.gx, scene.ptrY);
            setTranslate(scene.lPtr.g, lc.gx, scene.ptrY);
            setTranslate(scene.rPtr.g, rc.gx, scene.ptrY);
          }, ease.outCubic);
          ptrVisible = true;
        } else {
          const fromI = curI != null ? chips[curI].gx : ic.gx;
          const fromL = curL != null ? chips[curL].gx : lc.gx;
          const fromR = curR != null ? chips[curR].gx : rc.gx;
          if (fromI !== ic.gx || fromL !== lc.gx || fromR !== rc.gx) {
            tl.add(0.36, u => {
              setTranslate(scene.iPtr.g, fromI + (ic.gx - fromI) * u, scene.ptrY);
              setTranslate(scene.lPtr.g, fromL + (lc.gx - fromL) * u, scene.ptrY);
              setTranslate(scene.rPtr.g, fromR + (rc.gx - fromR) * u, scene.ptrY);
            }, ease.inOutSine);
          }
        }

        if (step.kind === "found") {
          tl.line(18);
          highlightRoles(step.i, step.l, step.r, true);
          const arc = scene.arcs[si];
          if (arc) {
            tl.add(0.5, u => {
              arc.path.setAttribute("stroke-dashoffset", String(arc.len * (1 - u)));
            }, ease.inOutSine);
          }
          tl.add(0.42, u => {
            const s = 1 + 0.07 * Math.sin(Math.PI * u);
            setScaleAt(ic.scale, ic.cx, ic.cy, s);
            setScaleAt(lc.scale, lc.cx, lc.cy, s);
            setScaleAt(rc.scale, rc.cx, rc.cy, s);
          }, ease.linear);

          tl.line([19, 20]);
          const badge = scene.badges[badgeIdx++];
          if (badge) {
            tl.add(0.45, u => {
              setOpacity(badge.enter, Math.min(1, u * 2));
              setScaleAt(badge.scale, badge.cx, badge.cy, u);
            }, ease.outBack);
          }
          tl.line([21, 22, 23, 24]);
          if (arc) {
            tl.add(0.28, u => setOpacity(arc.path, 1 - u), ease.outCubic);
          }
        } else {
          tl.line(step.kind === "move_l" ? 14 : 16);
          highlightRoles(step.i, step.l, step.r, false);
          if (step.kind === "move_l" || step.kind === "move_r") {
            const mv = step.kind === "move_l" ? lc : rc;
            tl.add(0.32, u => {
              setScaleAt(mv.scale, mv.cx, mv.cy, 1 + 0.05 * Math.sin(Math.PI * u));
            }, ease.linear);
          }
        }
        prevI = step.i;
      }
    });

    // -- finale: fade pointers, show final return value -------------------
    tl.line(25);
    highlightRoles(null, null, null, false);
    tl.add(0.3, u => {
      setOpacity(scene.iPtr.g, 1 - u);
      setOpacity(scene.lPtr.g, 1 - u);
      setOpacity(scene.rPtr.g, 1 - u);
    }, ease.outCubic);
    tl.add(0.65, scene.writer(scene.result), ease.linear);
    tl.add(0.45, u => {
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u)));
    }, ease.outCubic);
    tl.wait(1.5);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model: sort + fix anchor i + two-pointer sweep.
 * ------------------------------------------------------------------ */

function fmtNum(v) {
  return v < 0 ? "(" + v + ")" : String(v);
}

function simulate(nums) {
  const items = nums.map((value, origIdx) => ({ value, origIdx }));
  items.sort((a, b) => (a.value !== b.value ? a.value - b.value : a.origIdx - b.origIdx));
  const sorted = items.map(x => x.value);
  const n = sorted.length;

  const steps = [];
  const triplets = [];

  steps.push({
    kind: "sort",
    message: "sorted = [" + sorted.join(", ") + "]  →  ready for two pointers",
  });

  for (let i = 0; i < n - 2; i++) {
    if (i > 0 && sorted[i] === sorted[i - 1]) {
      steps.push({
        kind: "skip_i",
        i,
        message: "nums[" + i + "] == nums[" + (i - 1) + "] (" + sorted[i] + ")  →  skip duplicate anchor",
      });
      continue;
    }
    if (sorted[i] > 0) {
      steps.push({
        kind: "pos_i",
        i,
        message: "anchor > 0 in sorted array  →  no remaining triplet can sum to 0, stop",
      });
      break;
    }

    let l = i + 1, r = n - 1;
    while (l < r) {
      const sum = sorted[i] + sorted[l] + sorted[r];
      if (sum < 0) {
        steps.push({
          kind: "move_l",
          i, l, r, sum,
          message: sum + " < 0  →  sum too small, advance l += 1",
        });
        l += 1;
      } else if (sum > 0) {
        steps.push({
          kind: "move_r",
          i, l, r, sum,
          message: sum + " > 0  →  sum too large, retreat r -= 1",
        });
        r -= 1;
      } else {
        const trip = [sorted[i], sorted[l], sorted[r]];
        triplets.push(trip);
        steps.push({
          kind: "found",
          i, l, r, sum: 0,
          triplet: trip,
          message: "sum == 0  ✓  record [" + trip.join(", ") + "] and step both pointers inward",
        });
        l += 1;
        r -= 1;
        while (l < r && sorted[l] === sorted[l - 1]) l += 1;
        while (l < r && sorted[r] === sorted[r + 1]) r -= 1;
      }
    }
  }

  return { items, sorted, steps, triplets };
}
