/* Median of Two Sorted Arrays — animated walkthrough scene (3Blue1Brown style).
 *
 * The two arrays sit on separate rows. A moving cut on each row chooses i
 * elements from the shorter array and j = half - i from the other. The four
 * seam values (left1/right1/left2/right2, with -inf/+inf sentinels at the
 * edges) are collected in a side panel, and the two cross inequalities decide
 * whether the partition is valid. Invalid partitions move the binary-search
 * window; the valid one yields the median.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Median of Two Sorted Arrays",
    subtitle: "binary search the shorter array · O(log min(m, n))",
    inputs: [
      { id: "nums1", label: "nums1", type: "text", default: "1, 3", width: "wide" },
      { id: "nums2", label: "nums2", type: "text", default: "2", width: "wide" },
    ],
    legend: [
      { color: "#5CD0B3", text: "left half" },
      { color: "#58C4DD", text: "right half" },
      { color: "#F0AC5F", text: "partition cut" },
      { color: "#B58CD6", text: "sentinel" },
    ],
  },

  code: [
    "def find_median_sorted_arrays(nums1: List[int], nums2: List[int]) -> float:",
    "    \"\"\"Partition the two arrays so the left half holds the smaller values.\"\"\"",
    "    # Search the shorter array so ``j`` stays a valid index.",
    "    if len(nums1) > len(nums2):",
    "        nums1, nums2 = nums2, nums1",
    "    m, n = len(nums1), len(nums2)",
    "    half = (m + n + 1) // 2          # size of the combined left half",
    "    lo, hi = 0, m",
    "    while lo <= hi:",
    "        i = (lo + hi) // 2           # elements taken from nums1",
    "        j = half - i                 # elements taken from nums2",
    "        left1 = nums1[i - 1] if i > 0 else float(\"-inf\")",
    "        right1 = nums1[i] if i < m else float(\"inf\")",
    "        left2 = nums2[j - 1] if j > 0 else float(\"-inf\")",
    "        right2 = nums2[j] if j < n else float(\"inf\")",
    "",
    "        if left1 <= right2 and left2 <= right1:",
    "            if (m + n) % 2 == 1:",
    "                return float(max(left1, left2))",
    "            return (max(left1, left2) + min(right1, right2)) / 2.0",
    "        if left1 > right2:",
    "            hi = i - 1               # took too many from nums1",
    "        else:",
    "            lo = i + 1               # took too few from nums1",
    "    raise ValueError(\"Input arrays are not sorted\")",
  ],

  read(values) {
    const parse = raw => {
      const s = (raw || "").trim();
      return s === "" ? [] : s.split(/[\s,]+/).filter(Boolean).map(Number);
    };
    const nums1 = parse(values.nums1);
    const nums2 = parse(values.nums2);
    const valid = arr =>
      arr.length <= 8 &&
      arr.every(Number.isInteger) &&
      arr.every((v, i) => i === 0 || arr[i - 1] <= v);
    if (!valid(nums1) || !valid(nums2)) return null;
    if (nums1.length + nums2.length === 0) return null;
    return { nums1, nums2 };
  },

  fromArgs(args) {
    if (Array.isArray(args) && args.length >= 2
        && Array.isArray(args[0]) && Array.isArray(args[1])) {
      const nums1 = args[0].map(Number);
      const nums2 = args[1].map(Number);
      const valid = arr =>
        arr.length <= 8 &&
        arr.every(Number.isInteger) &&
        arr.every((v, i) => i === 0 || arr[i - 1] <= v);
      if (valid(nums1) && valid(nums2) && nums1.length + nums2.length > 0) {
        return { nums1: nums1.join(", "), nums2: nums2.join(", ") };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate } = ctx;
    const sim = simulate(params.nums1, params.nums2);
    const m = sim.m, n = sim.n;

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-teal", C.teal);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const arcsL = ctx.layer("arcs");
    const resultL = ctx.layer("result");

    const scene = {
      sim, nums1: sim.nums1, nums2: sim.nums2, m, n,
      chips1: [], chips2: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    const label = (str, x, y, fill, size) => {
      const t = txt(str, {
        x, y, "font-size": size || 18, fill: fill || C.grey,
      }, textL);
      setOpacity(t, 0);
      return t;
    };

    // ---- title / subtitle / swap note -----------------------------------
    scene.title = txt("Median of Two Sorted Arrays", {
      x: 64, y: 56, "font-size": 38, fill: C.white, "letter-spacing": 0.4,
    }, textL);

    scene.subtitle = txt(
      "partition both arrays so every left value ≤ every right value",
      { x: 64, y: 90, "font-size": 19, fill: C.grey },
      textL
    );
    setOpacity(scene.subtitle, 0);

    scene.swapNote = txt(
      sim.swapped
        ? "nums1 is longer → swap so the shorter array is searched"
        : "nums1 is already the shorter array → search it",
      {
        x: 64, y: 122, "font-size": 17,
        fill: sim.swapped ? C.gold : C.grey,
      },
      textL
    );
    setOpacity(scene.swapNote, 0);

    // ---- array rows ------------------------------------------------------
    const rowTop1 = 170, rowTop2 = 310, chipH = 64, gap = 10;
    const regionL = 300, regionR = 900, regionC = 600;

    const row1 = { arr: sim.nums1, top: rowTop1, count: m };
    const row2 = { arr: sim.nums2, top: rowTop2, count: n };
    const layout = row => {
      row.chipW = row.count
        ? clamp((regionR - regionL - gap * (row.count - 1)) / row.count, 38, 64)
        : 64;
      row.totalW = row.count ? row.count * row.chipW + (row.count - 1) * gap : 0;
      row.startX = regionC - row.totalW / 2;
      return row;
    };
    layout(row1);
    layout(row2);

    const cutX = (row, idx) => row.count === 0
      ? regionC
      : row.startX - gap / 2 + idx * (row.chipW + gap);

    scene.rowLabel1 = label("nums1", 110, rowTop1 + 30, C.teal, 24);
    scene.rowSub1 = label("shorter · searched", 110, rowTop1 + 54, C.grey, 14);
    scene.rowLabel2 = label("nums2", 110, rowTop2 + 30, C.blue, 24);
    scene.rowSub2 = label("other array", 110, rowTop2 + 54, C.grey, 14);

    const mkChips = (row, store) => {
      row.arr.forEach((value, i) => {
        const x = row.startX + i * (row.chipW + gap);
        const g = el("g", {
          transform: "translate(" + x + " " + row.top + ")",
        }, chipsL);
        const enter = el("g", {}, g);
        setOpacity(enter, 0);
        const rect = el("rect", {
          x: 0, y: 0, width: row.chipW, height: chipH, rx: 10,
          fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
        }, enter);
        const valueStr = String(value);
        const text = txt(valueStr, {
          x: row.chipW / 2, y: chipH / 2 + 1,
          "text-anchor": "middle", "dominant-baseline": "central",
          "font-size": clamp(
            Math.min(row.chipW * 0.4, 26) - Math.max(0, valueStr.length - 3) * 2.2,
            11, 26
          ),
          fill: C.white,
        }, enter);
        store.push({ i, value, g, enter, rect, text });
      });
    };
    mkChips(row1, scene.chips1);
    mkChips(row2, scene.chips2);

    scene.empty1 = null;
    scene.empty2 = null;
    if (row1.count === 0) {
      scene.empty1 = txt("(empty)", {
        x: regionC, y: rowTop1 + chipH / 2 + 1,
        "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": 18, fill: C.grey,
      }, textL);
      setOpacity(scene.empty1, 0);
    }
    if (row2.count === 0) {
      scene.empty2 = txt("(empty)", {
        x: regionC, y: rowTop2 + chipH / 2 + 1,
        "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": 18, fill: C.grey,
      }, textL);
      setOpacity(scene.empty2, 0);
    }

    // ---- partition cuts --------------------------------------------------
    const mkCut = initial => {
      const g = el("g", {}, arcsL);
      setOpacity(g, 0);
      el("line", {
        x1: 0, y1: -10, x2: 0, y2: chipH + 10,
        stroke: C.gold, "stroke-width": 3, "stroke-dasharray": "7 5",
      }, g);
      const lab = txt(initial, {
        x: 0, y: -18, "text-anchor": "middle", "font-size": 18, fill: C.gold,
      }, g);
      return { g, lab };
    };
    const cut1 = mkCut("i = 0");
    const cut2 = mkCut("j = 0");
    setTranslate(cut1.g, cutX(row1, 0), rowTop1);
    setTranslate(cut2.g, cutX(row2, 0), rowTop2);
    scene.cut1 = cut1.g;
    scene.cut2 = cut2.g;
    scene.cut1Label = cut1.lab;
    scene.cut2Label = cut2.lab;

    // ---- search-range line ----------------------------------------------
    scene.rangeText = txt(
      "half = " + sim.half + "   ·   i ∈ [0, " + m + "]",
      { x: regionC, y: 262, "text-anchor": "middle", "font-size": 18, fill: C.grey },
      textL
    );
    setOpacity(scene.rangeText, 0);

    // ---- partition-neighbour panel --------------------------------------
    const panel = el("g", {}, textL);
    setOpacity(panel, 0);
    el("rect", {
      x: 940, y: 132, width: 280, height: 252, rx: 14,
      fill: "#111722", stroke: C.greyDark, "stroke-width": 2,
    }, panel);
    txt("partition neighbours", {
      x: 958, y: 158, "font-size": 16, fill: C.grey,
    }, panel);
    txt("nums1", {
      x: 958, y: 184, "font-size": 14, fill: C.teal,
    }, panel);
    txt("nums2", {
      x: 958, y: 282, "font-size": 14, fill: C.blue,
    }, panel);

    const mkCard = (x, y, name, base) => {
      el("rect", {
        x, y, width: 120, height: 58, rx: 9,
        fill: "#151b26", stroke: C.greyDark, "stroke-width": 1.5,
      }, panel);
      txt(name, {
        x: x + 10, y: y + 20, "font-size": 13, fill: C.grey,
      }, panel);
      return {
        node: txt("—", {
          x: x + 60, y: y + 42, "text-anchor": "middle",
          "font-size": 22, fill: base,
        }, panel),
        base,
      };
    };
    scene.left1 = mkCard(956, 196, "left1", C.teal);
    scene.right1 = mkCard(1086, 196, "right1", C.blue);
    scene.left2 = mkCard(956, 294, "left2", C.teal);
    scene.right2 = mkCard(1086, 294, "right2", C.blue);
    scene.panel = panel;

    const setCard = (card, value) => {
      const s = fmtVal(value);
      card.node.textContent = s;
      card.node.setAttribute(
        "fill",
        (value === Number.NEGATIVE_INFINITY || value === Number.POSITIVE_INFINITY)
          ? C.purple
          : card.base
      );
      card.node.setAttribute(
        "font-size",
        String(clamp(22 - Math.max(0, s.length - 4) * 1.6, 12, 22))
      );
    };
    scene.setCard = setCard;

    // ---- cross inequalities + action ------------------------------------
    scene.ineq1 = txt("", {
      x: 640, y: 424, "text-anchor": "middle", "font-size": 22, fill: C.green,
    }, textL);
    scene.ineq2 = txt("", {
      x: 640, y: 460, "text-anchor": "middle", "font-size": 22, fill: C.green,
    }, textL);
    setOpacity(scene.ineq1, 0);
    setOpacity(scene.ineq2, 0);

    scene.action = txt("", {
      x: 640, y: 506, "text-anchor": "middle", "font-size": 20, fill: C.gold,
    }, textL);
    setOpacity(scene.action, 0);

    // ---- median result ---------------------------------------------------
    const last = sim.steps[sim.steps.length - 1];
    const loMax = Math.max(last.l1, last.l2);
    const hiMin = Math.min(last.r1, last.r2);
    const resultText = (m + n) % 2 === 1
      ? "median = max(" + fmtVal(last.l1) + ", " + fmtVal(last.l2) + ") = " + fmtFloat(sim.result)
      : "median = (" + fmtVal(loMax) + " + " + fmtVal(hiMin) + ") / 2 = " + fmtFloat(sim.result);

    scene.resultCaption = label("median", 640, 568, C.grey, 18);
    scene.resultCaption.setAttribute("text-anchor", "middle");

    scene.result = txt(resultText, {
      x: 640, y: 612, "text-anchor": "middle",
      "font-size": clamp(34 - Math.max(0, resultText.length - 34) * 0.6, 22, 34),
      fill: C.green,
    }, resultL);
    setOpacity(scene.result, 0);

    const rule = el("line", {
      x1: 640 - 200, y1: 636, x2: 640 + 200, y2: 636,
      stroke: C.green, "stroke-width": 4, "stroke-linecap": "round",
    }, resultL);
    rule.setAttribute("stroke-dasharray", String(rule.getTotalLength()));
    rule.setAttribute("stroke-dashoffset", String(rule.getTotalLength()));
    scene.resultRule = rule;
    scene.ruleLen = rule.getTotalLength();

    // ---- baseline --------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [
        scene.subtitle, scene.swapNote, scene.rowLabel1, scene.rowSub1,
        scene.rowLabel2, scene.rowSub2, scene.rangeText, scene.panel,
        scene.resultCaption,
      ]) setOpacity(node, 0);

      for (const chip of scene.chips1.concat(scene.chips2)) {
        setOpacity(chip.enter, 0);
        chip.enter.setAttribute("transform", "translate(0 0)");
        chip.rect.setAttribute("fill", C.chipFill);
        chip.rect.setAttribute("stroke", C.greyDark);
        chip.text.setAttribute("fill", C.white);
      }
      if (scene.empty1) setOpacity(scene.empty1, 0);
      if (scene.empty2) setOpacity(scene.empty2, 0);

      setOpacity(scene.cut1, 0);
      setOpacity(scene.cut2, 0);
      scene.cut1Label.textContent = "i = 0";
      scene.cut2Label.textContent = "j = 0";
      setTranslate(scene.cut1, cutX(row1, 0), rowTop1);
      setTranslate(scene.cut2, cutX(row2, 0), rowTop2);

      scene.rangeText.textContent = "half = " + sim.half + "   ·   i ∈ [0, " + m + "]";

      for (const card of [scene.left1, scene.right1, scene.left2, scene.right2]) {
        card.node.textContent = "—";
        card.node.setAttribute("font-size", "22");
        card.node.setAttribute("fill", card.base);
      }

      scene.ineq1.textContent = "";
      scene.ineq2.textContent = "";
      setOpacity(scene.ineq1, 0);
      setOpacity(scene.ineq2, 0);
      scene.action.textContent = "";
      scene.action.setAttribute("fill", C.gold);
      setOpacity(scene.action, 0);

      setOpacity(scene.result, 0);
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate } = ctx;
    const { sim } = scene;
    const steps = sim.steps;
    const rowTop1 = 170, rowTop2 = 310, chipH = 64, gap = 10;
    const regionL = 300, regionR = 900, regionC = 600;

    const row1 = { arr: sim.nums1, top: rowTop1, count: sim.m };
    const row2 = { arr: sim.nums2, top: rowTop2, count: sim.n };
    const layout = row => {
      row.chipW = row.count
        ? ctx.clamp((regionR - regionL - gap * (row.count - 1)) / row.count, 38, 64)
        : 64;
      row.totalW = row.count ? row.count * row.chipW + (row.count - 1) * gap : 0;
      row.startX = regionC - row.totalW / 2;
      return row;
    };
    layout(row1);
    layout(row2);
    const cutX = (row, idx) => row.count === 0
      ? regionC
      : row.startX - gap / 2 + idx * (row.chipW + gap);

    const wTitle = scene.writer(scene.title);
    const wResult = scene.writer(scene.result);

    const colorPartitions = step => {
      scene.chips1.forEach((chip, idx) => {
        const left = idx < step.i;
        chip.rect.setAttribute("fill", left ? "#15281E" : "#17283A");
        chip.rect.setAttribute("stroke", left ? ctx.C.teal : ctx.C.blue);
        chip.text.setAttribute("fill", left ? ctx.C.teal : ctx.C.blue);
      });
      scene.chips2.forEach((chip, idx) => {
        const left = idx < step.j;
        chip.rect.setAttribute("fill", left ? "#15281E" : "#17283A");
        chip.rect.setAttribute("stroke", left ? ctx.C.teal : ctx.C.blue);
        chip.text.setAttribute("fill", left ? ctx.C.teal : ctx.C.blue);
      });
    };

    // ---- intro -----------------------------------------------------------
    tl.line(1);
    tl.add(0.55, wTitle, ease.outCubic);
    tl.add(0.4, u => setOpacity(scene.subtitle, u), ease.outCubic);

    tl.line(4);
    tl.add(0.35, u => setOpacity(scene.swapNote, u), ease.outCubic);
    if (sim.swapped) {
      tl.line(5);
      tl.add(0.45, u => {
        setOpacity(scene.swapNote, 0.55 + 0.45 * u);
      }, ease.inOutSine);
      tl.log("nums1 is longer → swap so the shorter array is searched", ctx.C.gold);
    } else {
      tl.log("nums1 is already the shorter array → search it", ctx.C.grey);
    }

    tl.line(6);
    tl.add(0.4, u => {
      setOpacity(scene.rowLabel1, u);
      setOpacity(scene.rowSub1, u);
      setOpacity(scene.rowLabel2, u);
      setOpacity(scene.rowSub2, u);
    }, ease.outCubic);

    scene.chips1.forEach(chip => {
      tl.add(0.3, u => {
        setOpacity(chip.enter, u);
        chip.enter.setAttribute("transform", "translate(0 " + (1 - u) * 14 + ")");
      }, ease.outCubic);
      tl.wait(0.05);
    });
    scene.chips2.forEach(chip => {
      tl.add(0.3, u => {
        setOpacity(chip.enter, u);
        chip.enter.setAttribute("transform", "translate(0 " + (1 - u) * 14 + ")");
      }, ease.outCubic);
      tl.wait(0.05);
    });
    if (scene.empty1) tl.add(0.35, u => setOpacity(scene.empty1, u), ease.outCubic);
    if (scene.empty2) tl.add(0.35, u => setOpacity(scene.empty2, u), ease.outCubic);

    tl.line(7);
    tl.add(0.4, u => setOpacity(scene.rangeText, u), ease.outCubic);
    tl.line(8);
    tl.add(0.35, u => setOpacity(scene.panel, u), ease.outCubic);
    tl.log(
      "half = (m + n + 1) // 2 = " + sim.half +
      " · search i in [0, " + sim.m + "]",
      ctx.C.gold
    );

    // ---- binary search over i -------------------------------------------
    let solved = false;
    for (let si = 0; si < steps.length; si++) {
      const step = steps[si];
      const to1 = cutX(row1, step.i);
      const to2 = cutX(row2, step.j);
      const from1 = si === 0 ? to1 : cutX(row1, steps[si - 1].i);
      const from2 = si === 0 ? to2 : cutX(row2, steps[si - 1].j);
      const first = si === 0;

      scene.action.setAttribute("fill", ctx.C.gold);

      tl.line(9);
      if (first) {
        tl.add(0.3, u => {
          setTranslate(scene.cut1, to1, rowTop1);
          setTranslate(scene.cut2, to2, rowTop2);
          setOpacity(scene.cut1, u);
          setOpacity(scene.cut2, u);
        }, ease.outCubic);
      } else {
        tl.add(0.2, u => {
          setOpacity(scene.cut1, 1);
          setOpacity(scene.cut2, 1);
        }, ease.linear);
      }

      tl.line(10);
      tl.add(0.45, u => {
        setTranslate(scene.cut1, from1 + (to1 - from1) * u, rowTop1);
        if (u > 0.001) scene.cut1Label.textContent = "i = " + step.i;
      }, ease.inOutSine);
      tl.log("take i = " + step.i + " elements from nums1", ctx.C.teal);

      tl.line(11);
      tl.add(0.45, u => {
        setTranslate(scene.cut2, from2 + (to2 - from2) * u, rowTop2);
        if (u > 0.001) scene.cut2Label.textContent = "j = " + step.j;
      }, ease.inOutSine);
      tl.log("j = half - i = " + step.j + " elements from nums2", ctx.C.blue);

      tl.add(0.25, u => {
        if (u > 0.001) {
          scene.rangeText.textContent =
            "half = " + sim.half + "   ·   i ∈ [" + step.lo + ", " + step.hi + "]" +
            "   ·   i = " + step.i + ",  j = " + step.j;
        }
        colorPartitions(step);
      }, ease.linear);

      tl.line(12);
      tl.add(0.22, u => {
        if (u > 0.001) scene.setCard(scene.left1, step.l1);
      }, ease.linear);
      tl.line(13);
      tl.add(0.22, u => {
        if (u > 0.001) scene.setCard(scene.right1, step.r1);
      }, ease.linear);
      tl.line(14);
      tl.add(0.22, u => {
        if (u > 0.001) scene.setCard(scene.left2, step.l2);
      }, ease.linear);
      tl.line(15);
      tl.add(0.22, u => {
        if (u > 0.001) scene.setCard(scene.right2, step.r2);
      }, ease.linear);
      tl.log(
        "seam: left1=" + fmtVal(step.l1) + ", right1=" + fmtVal(step.r1) +
        ", left2=" + fmtVal(step.l2) + ", right2=" + fmtVal(step.r2),
        ctx.C.purple
      );

      tl.line(17);
      tl.add(0.4, u => {
        if (u > 0.001) {
          scene.ineq1.textContent =
            "left1 ≤ right2 :  " + fmtVal(step.l1) + " ≤ " + fmtVal(step.r2) +
            "   " + (step.ok1 ? "✓" : "✗");
          scene.ineq1.setAttribute("fill", step.ok1 ? ctx.C.green : ctx.C.red);
          scene.ineq2.textContent =
            "left2 ≤ right1 :  " + fmtVal(step.l2) + " ≤ " + fmtVal(step.r1) +
            "   " + (step.ok2 ? "✓" : "✗");
          scene.ineq2.setAttribute("fill", step.ok2 ? ctx.C.green : ctx.C.red);
          setOpacity(scene.ineq1, 1);
          setOpacity(scene.ineq2, 1);
        }
      }, ease.linear);
      tl.log(
        "left1 ≤ right2 " + (step.ok1 ? "✓" : "✗") +
        "   ·   left2 ≤ right1 " + (step.ok2 ? "✓" : "✗"),
        step.valid ? ctx.C.green : ctx.C.red
      );

      if (step.valid) {
        tl.line(18);
        tl.add(0.35, u => {
          if (u > 0.001) {
            scene.action.textContent = "both cross inequalities hold → valid partition";
            scene.action.setAttribute("fill", ctx.C.green);
            setOpacity(scene.action, 1);
          }
        }, ease.linear);
        tl.log("both cross inequalities hold → valid partition", ctx.C.green);

        tl.line((sim.m + sim.n) % 2 === 1 ? 19 : 20);
        tl.add(0.35, u => {
          if (u > 0.001) {
            scene.action.textContent = (sim.m + sim.n) % 2 === 1
              ? "odd total → median = max(left1, left2)"
              : "even total → median = (max(left1, left2) + min(right1, right2)) / 2";
          }
        }, ease.linear);
        tl.log(
          (sim.m + sim.n) % 2 === 1
            ? "odd total → take max(left1, left2)"
            : "even total → average max(left1, left2) and min(right1, right2)",
          ctx.C.gold
        );
        solved = true;
        break;
      }

      tl.line(21);
      tl.add(0.35, u => {
        if (u > 0.001) {
          scene.action.textContent = step.action === "left1 > right2"
            ? "left1 > right2 → took too many from nums1 · hi = i − 1 = " + step.nextHi
            : "left2 > right1 → took too few from nums1 · lo = i + 1 = " + step.nextLo;
          scene.action.setAttribute("fill", ctx.C.red);
          setOpacity(scene.action, 1);
        }
      }, ease.linear);
      tl.log(
        step.action === "left1 > right2"
          ? "left1 > right2 → took too many from nums1"
          : "left2 > right1 → took too few from nums1",
        ctx.C.red
      );

      tl.line(step.action === "left1 > right2" ? 22 : 24);
      tl.add(0.35, u => {
        if (u > 0.001) {
          scene.rangeText.textContent =
            "half = " + sim.half +
            "   ·   i ∈ [" + step.nextLo + ", " + step.nextHi + "]";
        }
      }, ease.linear);
      tl.log(
        step.action === "left1 > right2"
          ? "hi = i - 1 = " + step.nextHi
          : "lo = i + 1 = " + step.nextLo,
        ctx.C.gold
      );
    }

    if (solved) {
      tl.add(0.55, wResult, ease.linear);
      tl.add(0.5, u => {
        setOpacity(scene.resultCaption, u);
        scene.resultRule.setAttribute(
          "stroke-dashoffset", String(scene.ruleLen * (1 - u))
        );
      }, ease.outCubic);
      tl.log(
        "median = " + fmtFloat(sim.result),
        ctx.C.green
      );
      tl.wait(1.4);
    }

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model: partition search on the shorter array.
 * ------------------------------------------------------------------ */
function simulate(a, b) {
  let nums1 = a.slice();
  let nums2 = b.slice();
  const swapped = nums1.length > nums2.length;
  if (swapped) {
    const tmp = nums1;
    nums1 = nums2;
    nums2 = tmp;
  }

  const m = nums1.length, n = nums2.length;
  const half = Math.floor((m + n + 1) / 2);
  let lo = 0, hi = m;
  const steps = [];
  let result = null;

  while (lo <= hi) {
    const i = Math.floor((lo + hi) / 2);
    const j = half - i;
    const l1 = i > 0 ? nums1[i - 1] : Number.NEGATIVE_INFINITY;
    const r1 = i < m ? nums1[i] : Number.POSITIVE_INFINITY;
    const l2 = j > 0 ? nums2[j - 1] : Number.NEGATIVE_INFINITY;
    const r2 = j < n ? nums2[j] : Number.POSITIVE_INFINITY;
    const ok1 = l1 <= r2;
    const ok2 = l2 <= r1;
    const valid = ok1 && ok2;

    let nextLo = lo, nextHi = hi;
    let action = "";
    let value = null;

    if (valid) {
      value = (m + n) % 2 === 1
        ? Math.max(l1, l2)
        : (Math.max(l1, l2) + Math.min(r1, r2)) / 2;
    } else if (l1 > r2) {
      nextHi = i - 1;
      action = "left1 > right2";
    } else {
      nextLo = i + 1;
      action = "left2 > right1";
    }

    steps.push({
      lo, hi, i, j, l1, r1, l2, r2, ok1, ok2, valid,
      nextLo, nextHi, action, value,
    });

    if (valid) {
      result = value;
      break;
    }
    lo = nextLo;
    hi = nextHi;
  }

  return {
    nums1, nums2, swapped, m, n, half, steps, result,
    total: m + n,
  };
}

function fmtVal(v) {
  if (v === Number.NEGATIVE_INFINITY) return "-∞";
  if (v === Number.POSITIVE_INFINITY) return "+∞";
  return String(v);
}

function fmtFloat(v) {
  if (v === null || v === undefined) return "?";
  return Number.isInteger(v) ? v.toFixed(1) : String(v);
}
