/* Koko Eating Bananas — animated walkthrough scene (3Blue1Brown style).
 *
 * Binary search on the answer, not on an array. The piles are drawn as bars;
 * under them, a row of chips shows ceil(pile / speed) for the speed being
 * tested. A number line tracks the candidate speed window [lo, hi], with the
 * current mid marked. Each feasibility check either keeps mid as a candidate
 * (hi = mid) or discards it (lo = mid + 1) until lo and hi meet at the minimum
 * workable speed.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Koko Eating Bananas",
    subtitle: "binary search on the answer · O(n log max(piles))",
    inputs: [
      { id: "piles", label: "piles", type: "text", default: "3, 6, 7, 11", width: "wide" },
      { id: "h", label: "h", type: "number", default: 8 },
    ],
    legend: [
      { color: "#58C4DD", text: "pile / speed window" },
      { color: "#F0AC5F", text: "current mid" },
      { color: "#83C167", text: "feasible" },
      { color: "#FC6255", text: "too slow" },
    ],
  },

  code: [
    "def min_eating_speed(piles: List[int], h: int) -> int:",
    "    \"\"\"Binary search on the *answer* (the speed), not on the array.\"\"\"",
    "",
    "    def hours_needed(speed: int) -> int:",
    "        # ceil(pile / speed) hours for each pile",
    "        return sum((pile + speed - 1) // speed for pile in piles)",
    "",
    "    lo, hi = 1, max(piles)          # 1 is the slowest, max(piles) always works",
    "    while lo < hi:",
    "        mid = (lo + hi) // 2",
    "        if hours_needed(mid) <= h:",
    "            hi = mid                # feasible: try to go slower",
    "        else:",
    "            lo = mid + 1            # too slow: must speed up",
    "    return lo",
  ],

  read(values) {
    const raw = (values.piles || "").trim();
    const hRaw = (values.h || "").trim();
    if (!raw || !hRaw) return null;
    const piles = raw.split(/[\s,]+/).filter(Boolean).map(Number);
    const h = Number(hRaw);
    if (piles.length < 1 || piles.length > 8) return null;
    if (!piles.every(p => Number.isInteger(p) && p >= 1)) return null;
    if (!Number.isInteger(h) || h < piles.length) return null;
    return { piles, h };
  },

  fromArgs(args) {
    if (Array.isArray(args) && args.length >= 2 && Array.isArray(args[0])) {
      const piles = args[0].map(Number);
      const h = Number(args[1]);
      if (piles.length >= 1 && piles.length <= 8
          && piles.every(p => Number.isInteger(p) && p >= 1)
          && Number.isInteger(h) && h >= piles.length) {
        return { piles: piles.join(", "), h: String(h) };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, setScaleAt } = ctx;
    const { piles, h } = params;
    const sim = simulate(piles, h);
    const n = piles.length;
    const maxV = sim.max;

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-purple", C.purple);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = {
      piles, h, sim, ctx, posOf: null,
      bars: [], chips: [], _writers: [],
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

    // ---- title + subtitle ------------------------------------------------
    scene.title = txt("Koko Eating Bananas", {
      x: 64, y: 62, "font-size": 42, fill: C.white, "letter-spacing": 0.5,
    }, textL);

    const sub = el("text", { x: 64, y: 98, "font-size": 20, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "piles = ";
    el("tspan", { fill: C.white }, sub).textContent =
      "[" + piles.join(", ") + "]";
    el("tspan", {}, sub).textContent = "   ·   h = ";
    el("tspan", { fill: C.gold }, sub).textContent = String(h);
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // ---- h badge (top right) --------------------------------------------
    const hBadge = el("g", {}, textL);
    setOpacity(hBadge, 0);
    el("rect", {
      x: 1030, y: 38, width: 186, height: 64, rx: 12,
      fill: "#111722", stroke: C.gold, "stroke-width": 2,
    }, hBadge);
    txt("h = " + h, {
      x: 1123, y: 69, "text-anchor": "middle", "font-size": 26, fill: C.gold,
    }, hBadge);
    txt("hours available", {
      x: 1123, y: 89, "text-anchor": "middle", "font-size": 13, fill: C.grey,
    }, hBadge);
    scene.hBadge = hBadge;

    // ---- current-speed card ---------------------------------------------
    const card = el("g", {}, textL);
    setOpacity(card, 0);
    el("rect", {
      x: 930, y: 150, width: 286, height: 150, rx: 14,
      fill: "#111722", stroke: C.greyDark, "stroke-width": 2,
    }, card);
    txt("current speed", {
      x: 1073, y: 178, "text-anchor": "middle", "font-size": 16, fill: C.grey,
    }, card);
    scene.speedVal = txt("k = —", {
      x: 1073, y: 222, "text-anchor": "middle", "font-size": 34, fill: C.blue,
    }, card);
    txt("bananas per hour", {
      x: 1073, y: 248, "text-anchor": "middle", "font-size": 14, fill: C.grey,
    }, card);
    scene.verdict = txt("", {
      x: 1073, y: 278, "text-anchor": "middle", "font-size": 17, fill: C.green,
    }, card);
    scene.card = card;

    // ---- pile bars -------------------------------------------------------
    const regionL = 90, regionR = 860, baseline = 300;
    const gap = 18;
    const barW = clamp((regionR - regionL - gap * (n - 1)) / n, 34, 92);
    const totalW = n * barW + (n - 1) * gap;
    const startX = (regionL + regionR) / 2 - totalW / 2;
    const maxBarH = 96;

    scene.pilesCaption = label("piles   ·   bar height = bananas", 90, 148, C.grey, 20);

    piles.forEach((p, i) => {
      const x = startX + i * (barW + gap);
      const bh = 20 + (p / maxV) * maxBarH;
      const g = el("g", { transform: "translate(" + x + " " + baseline + ")" }, chipsL);
      const enter = el("g", {}, g);
      setOpacity(enter, 0);
      const rect = el("rect", {
        x: 0, y: -bh, width: barW, height: bh, rx: 6,
        fill: "#16283A", stroke: C.blue, "stroke-width": 2,
      }, enter);
      const valueStr = String(p);
      txt(valueStr, {
        x: barW / 2, y: -bh - 10, "text-anchor": "middle",
        "font-size": clamp(20 - Math.max(0, valueStr.length - 3) * 1.2, 12, 20),
        fill: C.white,
      }, enter);
      txt(String(i), {
        x: barW / 2, y: 22, "text-anchor": "middle",
        "font-size": 15, fill: C.grey,
      }, enter);
      scene.bars.push({ i, value: p, g, enter, rect, x, cx: x + barW / 2, bh });
    });

    // ---- per-pile hour chips --------------------------------------------
    const chipTop = 342, chipH = 34;
    const chipW = Math.min(barW, 72);
    piles.forEach((p, i) => {
      const bar = scene.bars[i];
      const cx = bar.cx;
      const g = el("g", {
        transform: "translate(" + cx + " " + (chipTop + chipH / 2) + ")",
      }, chipsL);
      const enter = el("g", {}, g);
      setOpacity(enter, 0);
      const scale = el("g", {}, enter);
      el("rect", {
        x: -chipW / 2, y: -chipH / 2, width: chipW, height: chipH, rx: 8,
        fill: "#151b26", stroke: C.greyDark, "stroke-width": 1.5,
      }, scale);
      const text = txt("?", {
        x: 0, y: 1, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": 18, fill: C.gold,
      }, scale);
      scene.chips.push({
        i, value: p, g, enter, scale, text, cx, cy: chipTop + chipH / 2,
      });
    });

    scene.chipCaption = label(
      "each chip = ⌈pile / speed⌉ hours at the current speed",
      90, 392, C.grey, 16
    );

    // ---- dynamic total / comparison -------------------------------------
    scene.total = txt("", {
      x: 640, y: 428, "text-anchor": "middle", "font-size": 22, fill: C.white,
    }, textL);
    setOpacity(scene.total, 0);

    scene.action = txt("", {
      x: 640, y: 462, "text-anchor": "middle", "font-size": 20, fill: C.gold,
    }, textL);
    setOpacity(scene.action, 0);

    // ---- speed number line ----------------------------------------------
    const X1 = 120, X2 = 1160, RANGE_Y = 540;
    const posOf = v => maxV === 1
      ? (X1 + X2) / 2
      : X1 + ((v - 1) / (maxV - 1)) * (X2 - X1);
    scene.posOf = posOf;

    scene.rangeCaption = label(
      "speed range   ·   [1, max(piles)] = [1, " + maxV + "]",
      90, 492, C.grey, 19
    );

    el("line", {
      x1: X1, y1: RANGE_Y, x2: X2, y2: RANGE_Y,
      stroke: C.greyDark, "stroke-width": 4, "stroke-linecap": "round",
    }, ptrL);
    el("line", {
      x1: X1, y1: RANGE_Y - 7, x2: X1, y2: RANGE_Y + 7,
      stroke: C.grey, "stroke-width": 2,
    }, ptrL);
    el("line", {
      x1: X2, y1: RANGE_Y - 7, x2: X2, y2: RANGE_Y + 7,
      stroke: C.grey, "stroke-width": 2,
    }, ptrL);

    const win = el("rect", {
      x: posOf(1), y: RANGE_Y - 5,
      width: Math.max(0, posOf(maxV) - posOf(1)), height: 10, rx: 5,
      fill: C.blue, "fill-opacity": 0.18,
    }, ptrL);
    scene.win = win;

    if (maxV === 1) {
      txt("1", {
        x: (X1 + X2) / 2, y: 566, "text-anchor": "middle",
        "font-size": 17, fill: C.grey,
      }, textL);
    } else {
      txt("1", {
        x: X1, y: 566, "text-anchor": "middle", "font-size": 17, fill: C.grey,
      }, textL);
      txt(String(maxV), {
        x: X2, y: 566, "text-anchor": "middle", "font-size": 17, fill: C.grey,
      }, textL);
    }

    const loG = el("g", {}, ptrL);
    setOpacity(loG, 0);
    el("line", {
      x1: 0, y1: -6, x2: 0, y2: 10,
      stroke: C.blue, "stroke-width": 3, "stroke-linecap": "round",
    }, loG);
    scene.loLabel = txt("lo = 1", {
      x: 0, y: 44, "text-anchor": "middle", "font-size": 17, fill: C.blue,
    }, loG);
    setTranslate(loG, posOf(1), RANGE_Y);

    const hiG = el("g", {}, ptrL);
    setOpacity(hiG, 0);
    el("line", {
      x1: 0, y1: -6, x2: 0, y2: 10,
      stroke: C.gold, "stroke-width": 3, "stroke-linecap": "round",
    }, hiG);
    scene.hiLabel = txt("hi = " + maxV, {
      x: 0, y: 70, "text-anchor": "middle", "font-size": 17, fill: C.gold,
    }, hiG);
    setTranslate(hiG, posOf(maxV), RANGE_Y);

    const midG = el("g", {}, ptrL);
    setOpacity(midG, 0);
    el("path", {
      d: "M 0 0 L -9 -14 L 9 -14 Z", fill: C.purple,
      filter: "url(#glow-purple)",
    }, midG);
    scene.midLabel = txt("mid = —", {
      x: 0, y: -24, "text-anchor": "middle", "font-size": 17, fill: C.purple,
    }, midG);
    setTranslate(midG, posOf(maxV), RANGE_Y);

    scene.loG = loG;
    scene.hiG = hiG;
    scene.midG = midG;

    // ---- answer banner ---------------------------------------------------
    scene.result = txt("minimum speed = " + sim.answer, {
      x: 640, y: 654, "text-anchor": "middle", "font-size": 36, fill: C.green,
    }, resultL);
    setOpacity(scene.result, 0);

    const rule = el("line", {
      x1: 640 - 190, y1: 676, x2: 640 + 190, y2: 676,
      stroke: C.green, "stroke-width": 4, "stroke-linecap": "round",
    }, resultL);
    rule.setAttribute("stroke-dasharray", String(rule.getTotalLength()));
    rule.setAttribute("stroke-dashoffset", String(rule.getTotalLength()));
    scene.resultRule = rule;
    scene.ruleLen = rule.getTotalLength();

    // ---- baseline --------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.hBadge, 0);
      setOpacity(scene.card, 0);
      setOpacity(scene.pilesCaption, 0);
      setOpacity(scene.chipCaption, 0);
      setOpacity(scene.rangeCaption, 0);

      for (const bar of scene.bars) {
        setOpacity(bar.enter, 0);
        bar.enter.setAttribute("transform", "translate(0 0)");
        bar.rect.setAttribute("stroke", C.blue);
      }
      for (const chip of scene.chips) {
        setOpacity(chip.enter, 0);
        chip.enter.setAttribute("transform", "translate(0 0)");
        setScaleAt(chip.scale, 0, 0, 1);
        chip.text.textContent = "?";
        chip.text.setAttribute("font-size", "18");
      }

      scene.total.textContent = "";
      scene.total.setAttribute("fill", C.white);
      setOpacity(scene.total, 0);
      scene.action.textContent = "";
      scene.action.setAttribute("fill", C.gold);
      setOpacity(scene.action, 0);

      scene.speedVal.textContent = "k = —";
      scene.speedVal.setAttribute("font-size", "34");
      scene.verdict.textContent = "";
      scene.verdict.setAttribute("fill", C.green);

      scene.loLabel.textContent = "lo = 1";
      scene.hiLabel.textContent = "hi = " + maxV;
      scene.midLabel.textContent = "mid = —";
      setTranslate(scene.loG, posOf(1), RANGE_Y);
      setTranslate(scene.hiG, posOf(maxV), RANGE_Y);
      setTranslate(scene.midG, posOf(maxV), RANGE_Y);
      setOpacity(scene.loG, 0);
      setOpacity(scene.hiG, 0);
      setOpacity(scene.midG, 0);

      scene.win.setAttribute("x", String(posOf(1)));
      scene.win.setAttribute("width", String(Math.max(0, posOf(maxV) - posOf(1))));

      setOpacity(scene.result, 0);
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt } = ctx;
    const { piles, h, sim } = scene;
    const steps = sim.steps;
    const maxV = sim.max;
    const posOf = scene.posOf;
    const RANGE_Y = 540;

    const wTitle = scene.writer(scene.title);
    const wResult = scene.writer(scene.result);

    const showAnswer = () => {
      tl.line(15);
      tl.add(0.35, u => {
        if (u > 0.001) {
          scene.speedVal.textContent = "k = " + sim.answer;
          scene.speedVal.setAttribute("font-size", "34");
          scene.verdict.textContent = "✓ minimum";
          scene.verdict.setAttribute("fill", ctx.C.green);
          scene.action.textContent = "lo = hi = " + sim.answer + " → smallest feasible speed";
          scene.action.setAttribute("fill", ctx.C.green);
          setOpacity(scene.action, 1);
        }
      }, ease.linear);
      tl.log("minimum speed = " + sim.answer, ctx.C.green);
      tl.add(0.6, wResult, ease.linear);
      tl.add(0.5, u => {
        scene.resultRule.setAttribute(
          "stroke-dashoffset", String(scene.ruleLen * (1 - u))
        );
      }, ease.outCubic);
      tl.wait(1.3);
    };

    // ---- intro -----------------------------------------------------------
    tl.line(1);
    tl.add(0.55, wTitle, ease.outCubic);
    tl.add(0.4, u => setOpacity(scene.subtitle, u), ease.outCubic);
    tl.add(0.35, u => setOpacity(scene.hBadge, u), ease.outCubic);
    tl.add(0.35, u => setOpacity(scene.card, u), ease.outCubic);
    tl.add(0.35, u => setOpacity(scene.pilesCaption, u), ease.outCubic);

    scene.bars.forEach(bar => {
      tl.add(0.32, u => {
        setOpacity(bar.enter, u);
        bar.enter.setAttribute("transform", "translate(0 " + (1 - u) * 14 + ")");
      }, ease.outCubic);
      tl.wait(0.06);
    });

    tl.add(0.35, u => setOpacity(scene.chipCaption, u), ease.outCubic);
    scene.chips.forEach(chip => {
      tl.add(0.3, u => {
        setOpacity(chip.enter, u);
        chip.enter.setAttribute("transform", "translate(0 " + (1 - u) * 10 + ")");
      }, ease.outCubic);
      tl.wait(0.04);
    });

    tl.line(8);
    tl.add(0.4, u => {
      setOpacity(scene.rangeCaption, u);
      setOpacity(scene.loG, u);
      setOpacity(scene.hiG, u);
    }, ease.outCubic);
    tl.log("search k in [1, max(piles)] = [1, " + maxV + "]", ctx.C.gold);

    if (!steps.length) {
      tl.line(9);
      tl.add(0.35, u => {
        if (u > 0.001) {
          scene.action.textContent = "max(piles) = 1 → speed 1 is the only candidate";
          setOpacity(scene.action, 1);
        }
      }, ease.linear);
      tl.log("max(piles) = 1, so speed 1 is the only candidate", ctx.C.gold);
      showAnswer();
      return tl.finish();
    }

    // ---- binary search ---------------------------------------------------
    steps.forEach((step, si) => {
      const fromMid = si === 0 ? posOf(step.mid) : posOf(steps[si - 1].mid);
      const toMid = posOf(step.mid);
      const fromLo = posOf(step.lo), fromHi = posOf(step.hi);
      const toLo = posOf(step.nextLo), toHi = posOf(step.nextHi);
      const fromW = fromHi - fromLo, toW = toHi - toLo;

      tl.line([9, 10]);
      tl.add(0.22, u => {
        for (const bar of scene.bars) bar.rect.setAttribute("stroke", ctx.C.gold);
      }, ease.linear);

      tl.add(0.4, u => {
        setOpacity(scene.midG, 1);
        setTranslate(scene.midG, fromMid + (toMid - fromMid) * u, RANGE_Y);
        if (u > 0.001) scene.midLabel.textContent = "mid = " + step.mid;
        scene.speedVal.textContent = "k = " + step.mid;
        scene.speedVal.setAttribute(
          "font-size",
          String(ctx.clamp(36 - Math.max(0, ("k = " + step.mid).length - 6) * 2.2, 18, 36))
        );
        scene.verdict.textContent = "";
        scene.total.setAttribute("fill", ctx.C.white);
      }, ease.inOutSine);
      tl.log("try k = " + step.mid, ctx.C.blue);

      tl.line(6);
      tl.add(0.2, u => {
        scene.total.textContent = "hours_needed(" + step.mid + ") = …";
        setOpacity(scene.total, 1);
      }, ease.linear);

      piles.forEach((p, i) => {
        const chip = scene.chips[i];
        tl.add(0.18, u => {
          if (u > 0.001) {
            const s = String(step.hours[i]);
            chip.text.textContent = s;
            chip.text.setAttribute(
              "font-size",
              String(ctx.clamp(18 - Math.max(0, s.length - 3) * 1.8, 10, 18))
            );
          }
          setScaleAt(chip.scale, 0, 0, 1 + 0.16 * Math.sin(Math.PI * u));
        }, ease.linear);
      });

      tl.add(0.3, u => {
        if (u > 0.001) {
          scene.total.textContent = "hours_needed(" + step.mid + ") = " + step.total;
        }
      }, ease.linear);
      tl.log("ceil terms: " + step.hours.join(" + ") + " = " + step.total, ctx.C.teal);

      tl.line(11);
      tl.add(0.35, u => {
        if (u > 0.001) {
          scene.total.textContent =
            "hours_needed(" + step.mid + ") = " + step.total +
            "   " + (step.ok ? "≤" : ">") + "   h = " + h +
            "   →   " + (step.ok ? "feasible" : "too slow");
          scene.total.setAttribute("fill", step.ok ? ctx.C.green : ctx.C.red);
          scene.verdict.textContent = step.ok ? "✓ feasible" : "✗ too slow";
          scene.verdict.setAttribute("fill", step.ok ? ctx.C.green : ctx.C.red);
        }
      }, ease.linear);
      tl.log(
        step.total + (step.ok ? " ≤ " : " > ") + "h = " + h +
        " → " + (step.ok ? "feasible" : "too slow"),
        step.ok ? ctx.C.green : ctx.C.red
      );

      tl.line(step.ok ? 12 : 14);
      tl.add(0.45, u => {
        const e = ease.inOutSine(u);
        setTranslate(scene.loG, fromLo + (toLo - fromLo) * e, RANGE_Y);
        setTranslate(scene.hiG, fromHi + (toHi - fromHi) * e, RANGE_Y);
        scene.win.setAttribute("x", String(fromLo + (toLo - fromLo) * e));
        scene.win.setAttribute("width", String(Math.max(0, fromW + (toW - fromW) * e)));
        if (u > 0.001) {
          scene.loLabel.textContent = "lo = " + step.nextLo;
          scene.hiLabel.textContent = "hi = " + step.nextHi;
          scene.action.textContent = step.ok
            ? step.total + " ≤ " + h + " → feasible, try slower: hi = mid = " + step.nextHi
            : step.total + " > " + h + " → too slow, speed up: lo = mid + 1 = " + step.nextLo;
          scene.action.setAttribute("fill", step.ok ? ctx.C.green : ctx.C.gold);
          setOpacity(scene.action, 1);
        }
      }, ease.inOutSine);
      tl.log(
        step.ok
          ? "hi = mid = " + step.nextHi + " → search [" + step.nextLo + ", " + step.nextHi + "]"
          : "lo = mid + 1 = " + step.nextLo + " → search [" + step.nextLo + ", " + step.nextHi + "]",
        ctx.C.gold
      );

      tl.add(0.2, u => {
        for (const bar of scene.bars) bar.rect.setAttribute("stroke", ctx.C.blue);
      }, ease.linear);
    });

    tl.add(0.3, u => setOpacity(scene.midG, 1 - u), ease.outCubic);
    showAnswer();
    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model: binary search on the speed, with the frame
 * data each feasibility check needs.
 * ------------------------------------------------------------------ */
function simulate(piles, h) {
  let lo = 1;
  let hi = Math.max.apply(null, piles);
  const steps = [];

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const hours = piles.map(p => Math.ceil(p / mid));
    const total = hours.reduce((a, b) => a + b, 0);
    const ok = total <= h;
    const nextLo = ok ? lo : mid + 1;
    const nextHi = ok ? mid : hi;
    steps.push({ lo, hi, mid, hours, total, ok, nextLo, nextHi });
    lo = nextLo;
    hi = nextHi;
  }

  return { steps, answer: lo, max: Math.max.apply(null, piles) };
}
