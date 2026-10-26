/* Container With Most Water — animated walkthrough scene (3Blue1Brown style).
 *
 * Draw the vertical walls as columns on an axis, place `lo` (blue) and `hi`
 * (gold) at the widest span, and shade the water rectangle between them up to
 * `min(height[lo], height[hi])`. Whenever a container beats `best`, lock in a
 * dashed green outline of that champion container. Always move the shorter
 * wall inward because keeping it can never increase the water height while the
 * width shrinks.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Container With Most Water",
    subtitle: "two pointers · move shorter wall · O(n) time · O(1) space",
    inputs: [
      { id: "height", label: "height", type: "text", default: "1, 8, 6, 2, 5, 4, 8, 3, 7", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "lo wall" },
      { color: "#F0AC5F", text: "hi wall" },
      { color: "#5CD0B3", text: "current water" },
      { color: "#83C167", text: "best container" },
    ],
  },

  code: [
    "def max_area(height: List[int]) -> int:",
    "    left, right = 0, len(height) - 1",
    "    best = 0",
    "    while left < right:",
    "        width = right - left",
    "        area = width * min(height[left], height[right])",
    "        best = max(best, area)",
    "        if height[left] < height[right]:",
    "            left += 1",
    "        else:",
    "            right -= 1",
    "    return best",
  ],

  read(values) {
    const raw = (values.height || "").trim();
    if (!raw) return null;
    const height = raw.split(/[\s,]+/).filter(Boolean).map(Number);
    if (height.length < 2 || height.length > 14) return null;
    if (!height.every(v => Number.isInteger(v) && v >= 0)) return null;
    return { height };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const height = args[0].map(Number);
      if (height.length >= 2 && height.length <= 14
          && height.every(v => Number.isInteger(v) && v >= 0)) {
        return { height: height.join(", ") };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const height = params.height;
    const n = height.length;
    const sim = simulate(height);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-teal", C.teal);
    ctx.glow("glow-green", C.green);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const arcsL = ctx.layer("arcs");
    const chipsL = ctx.layer("chips");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = {
      height, sim, ctx,
      bars: [], eqs: [], moves: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title + subtitle -------------------------------------------------
    scene.title = txt("Container With Most Water", {
      x: 64, y: 74, "font-size": 44, fill: C.white, "letter-spacing": 1,
    }, textL);
    const sub = el("text", { x: 64, y: 112, "font-size": 22, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "height = ";
    el("tspan", { fill: C.white }, sub).textContent = "[" + height.join(", ") + "]";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- chart geometry ---------------------------------------------------
    const baseY = 352;
    const maxBarH = 188;
    const peak = Math.max(1, ...height);
    const spanW = clamp(n * 84, 360, 1020);
    const stepX = spanW / (n - 1);
    const startX = STAGE_W / 2 - spanW / 2;
    const barW = clamp(stepX * 0.24, 10, 22);
    const yOf = h => baseY - (h / peak) * maxBarH;

    scene.baseY = baseY;
    scene.yOf = yOf;

    // best-so-far container outline (behind bars)
    scene.bestBox = el("rect", {
      x: startX, y: baseY, width: 0, height: 0, rx: 4,
      fill: C.green, "fill-opacity": 0.08,
      stroke: C.green, "stroke-width": 2.4, "stroke-dasharray": "7 5",
    }, arcsL);
    setOpacity(scene.bestBox, 0);

    // active water rectangle + top surface line
    scene.waterG = el("g", {}, arcsL);
    scene.waterRect = el("rect", {
      x: startX, y: baseY, width: 0, height: 0,
      fill: C.teal, "fill-opacity": 0.22,
    }, scene.waterG);
    scene.waterLine = el("line", {
      x1: startX, y1: baseY, x2: startX, y2: baseY,
      stroke: C.teal, "stroke-width": 3, filter: "url(#glow-teal)",
    }, scene.waterG);
    setOpacity(scene.waterG, 0);

    // baseline axis
    scene.axis = el("line", {
      x1: startX - 32, y1: baseY, x2: startX + spanW + 32, y2: baseY,
      stroke: C.greyDark, "stroke-width": 2.5, "stroke-linecap": "round",
    }, chipsL);
    setOpacity(scene.axis, 0);

    // wall bars
    height.forEach((h, i) => {
      const gx = startX + i * stepX;
      const bh = Math.max(4, (h / peak) * maxBarH);
      const topY = baseY - bh;
      const g = el("g", {}, chipsL);
      const rectIdle = el("rect", {
        x: gx - barW / 2, y: topY, width: barW, height: bh, rx: 4,
        fill: "#334155", stroke: "#475569", "stroke-width": 1.5,
      }, g);
      const rectLo = el("rect", {
        x: gx - barW / 2, y: topY, width: barW, height: bh, rx: 4,
        fill: C.blue, stroke: C.blue, "stroke-width": 2, filter: "url(#glow-blue)",
      }, g);
      const rectHi = el("rect", {
        x: gx - barW / 2, y: topY, width: barW, height: bh, rx: 4,
        fill: C.gold, stroke: C.gold, "stroke-width": 2, filter: "url(#glow-gold)",
      }, g);
      const rectBest = el("rect", {
        x: gx - barW / 2, y: topY, width: barW, height: bh, rx: 4,
        fill: C.green, stroke: C.green, "stroke-width": 2, filter: "url(#glow-green)",
      }, g);
      setOpacity(rectLo, 0);
      setOpacity(rectHi, 0);
      setOpacity(rectBest, 0);

      const valLab = txt(String(h), {
        x: gx, y: topY - 10, "text-anchor": "middle", "font-size": 16, fill: C.white,
      }, g);
      const idxLab = txt(String(i), {
        x: gx, y: baseY + 24, "text-anchor": "middle", "font-size": 15, fill: C.grey,
      }, g);
      setOpacity(g, 0);
      scene.bars.push({
        i, h, gx, topY, bh, g,
        rectIdle, rectLo, rectHi, rectBest, valLab, idxLab,
      });
    });

    // pointers lo and hi
    const ptrY = baseY + 34;
    scene.ptrY = ptrY;
    function buildPointer(color, glowId, label) {
      const g = el("g", {}, ptrL);
      el("path", { d: "M -8 12 L 0 -1 L 8 12 Z", fill: color, filter: "url(#" + glowId + ")" }, g);
      el("line", {
        x1: 0, y1: 12, x2: 0, y2: 32,
        stroke: color, "stroke-width": 3.2, "stroke-linecap": "round",
      }, g);
      txt(label, {
        x: 0, y: 52, "text-anchor": "middle", "font-size": 20,
        fill: color, "font-weight": "bold",
      }, g);
      setOpacity(g, 0);
      return { g };
    }
    scene.loPtr = buildPointer(C.blue, "glow-blue", "lo");
    scene.hiPtr = buildPointer(C.gold, "glow-gold", "hi");

    // per-step equation + move lines
    sim.steps.forEach(step => {
      const eq = el("text", {
        x: STAGE_W / 2, y: 468, "text-anchor": "middle", "font-size": 27,
      }, textL);
      const part = (str, fill) => {
        const t = el("tspan", fill ? { fill } : {}, eq);
        t.textContent = str;
      };
      part("width ", C.grey);
      part("(" + step.hi + " − " + step.lo + " = " + step.width + ")", C.white);
      part("  ×  min(", C.grey);
      part(String(step.hLo), C.blue);
      part(", ", C.grey);
      part(String(step.hHi), C.gold);
      part(") = ", C.grey);
      part(step.width + " × " + step.short + " = ", C.grey);
      part(String(step.area), step.isRecord ? C.green : C.teal);
      if (step.isRecord) part("   ★ new best!", C.green);
      scene.eqs.push(eq);

      const moveColor = step.move === "lo" ? C.blue : C.gold;
      const moveTxt = step.move === "lo"
        ? "h[" + step.lo + "] = " + step.hLo + " < h[" + step.hi + "] = " + step.hHi + "  →  move shorter wall lo += 1"
        : "h[" + step.hi + "] = " + step.hHi + " ≤ h[" + step.lo + "] = " + step.hLo + "  →  move shorter wall hi -= 1";
      scene.moves.push(txt(moveTxt, {
        x: STAGE_W / 2, y: 510, "text-anchor": "middle", "font-size": 22, fill: moveColor,
      }, textL));
    });

    // running best readout
    scene.bestText = txt("best area = 0", {
      x: STAGE_W / 2, y: 562, "text-anchor": "middle", "font-size": 24, fill: C.green,
    }, textL);
    setOpacity(scene.bestText, 0);

    // final result + underline
    scene.result = txt("return " + sim.best, {
      x: STAGE_W / 2, y: 644, "text-anchor": "middle", "font-size": 42, fill: C.green,
    }, resultL);
    const rule = el("line", {
      x1: STAGE_W / 2 - 140, y1: 666, x2: STAGE_W / 2 + 140, y2: 666,
      stroke: C.green, "stroke-width": 4, "stroke-linecap": "round",
    }, resultL);
    const ruleLen = rule.getTotalLength();
    rule.setAttribute("stroke-dasharray", String(ruleLen));
    rule.setAttribute("stroke-dashoffset", String(ruleLen));
    scene.resultRule = rule;
    scene.ruleLen = ruleLen;

    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.axis, 0);
      setOpacity(scene.waterG, 0);
      setOpacity(scene.bestBox, 0);
      setOpacity(scene.bestText, 0);
      scene.bestText.textContent = "best area = 0";
      for (const b of scene.bars) {
        setOpacity(b.g, 0);
        setOpacity(b.rectLo, 0);
        setOpacity(b.rectHi, 0);
        setOpacity(b.rectBest, 0);
      }
      setOpacity(scene.loPtr.g, 0);
      setOpacity(scene.hiPtr.g, 0);
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate } = ctx;
    const { bars, sim, baseY, yOf } = scene;

    const setWater = (x1, x2, hLevel) => {
      const top = yOf(hLevel);
      const w = Math.max(0, x2 - x1);
      const h = Math.max(0, baseY - top);
      scene.waterRect.setAttribute("x", String(x1));
      scene.waterRect.setAttribute("y", String(top));
      scene.waterRect.setAttribute("width", String(w));
      scene.waterRect.setAttribute("height", String(h));
      scene.waterLine.setAttribute("x1", String(x1));
      scene.waterLine.setAttribute("y1", String(top));
      scene.waterLine.setAttribute("x2", String(x2));
      scene.waterLine.setAttribute("y2", String(top));
    };

    tl.line(1);
    tl.add(0.55, scene.writer(scene.title), ease.outCubic);
    tl.line(2);
    tl.add(0.35, u => {
      setOpacity(scene.subtitle, u);
      setOpacity(scene.axis, u);
    }, ease.outCubic);

    bars.forEach(b => {
      tl.add(0.2, u => setOpacity(b.g, u), ease.outCubic);
      tl.wait(0.03);
    });
    tl.line(3);
    tl.add(0.3, u => setOpacity(scene.bestText, u), ease.outCubic);

    let prevEq = null, prevMove = null;

    sim.steps.forEach((step, si) => {
      const lb = bars[step.lo], rb = bars[step.hi];

      tl.line(4);

      if (si === 0) {
        tl.add(0.45, u => {
          setOpacity(scene.loPtr.g, u);
          setOpacity(scene.hiPtr.g, u);
          setTranslate(scene.loPtr.g, lb.gx, scene.ptrY);
          setTranslate(scene.hiPtr.g, rb.gx, scene.ptrY);
          setOpacity(lb.rectLo, u);
          setOpacity(rb.rectHi, u);
        }, ease.outCubic);
      } else {
        const prev = sim.steps[si - 1];
        const plb = bars[prev.lo], prb = bars[prev.hi];
        if (step.lo !== prev.lo) {
          tl.add(0.4, u => {
            setTranslate(scene.loPtr.g, plb.gx + (lb.gx - plb.gx) * u, scene.ptrY);
            setOpacity(plb.rectLo, 1 - u);
            setOpacity(lb.rectLo, u);
          }, ease.inOutSine);
        }
        if (step.hi !== prev.hi) {
          tl.add(0.4, u => {
            setTranslate(scene.hiPtr.g, prb.gx + (rb.gx - prb.gx) * u, scene.ptrY);
            setOpacity(prb.rectHi, 1 - u);
            setOpacity(rb.rectHi, u);
          }, ease.inOutSine);
        }
      }

      // fill water up to shorter wall
      tl.line(5);
      tl.add(0.38, u => {
        setOpacity(scene.waterG, 1);
        setWater(lb.gx, rb.gx, step.short * u);
      }, ease.outCubic);

      const fadingEq = prevEq;
      if (fadingEq) tl.add(0.14, u => setOpacity(fadingEq, 1 - u), ease.outCubic);
      tl.line(6);
      tl.add(0.42, scene.writer(scene.eqs[si]), ease.linear);
      prevEq = scene.eqs[si];

      if (step.isRecord) {
        tl.line(7);
        const bx = lb.gx, bw = rb.gx - lb.gx;
        const by = yOf(step.short), bh = baseY - by;
        const bestVal = step.best;
        const bestPair = "[" + step.lo + ".." + step.hi + "]";
        tl.add(0.32, u => {
          scene.bestBox.setAttribute("x", String(bx));
          scene.bestBox.setAttribute("y", String(by));
          scene.bestBox.setAttribute("width", String(bw));
          scene.bestBox.setAttribute("height", String(bh));
          setOpacity(scene.bestBox, u);
          scene.bestText.textContent = "best area = " + bestVal + "   (walls " + bestPair + ")";
        }, ease.outCubic);
      }

      const fadingMove = prevMove;
      if (fadingMove) tl.add(0.14, u => setOpacity(fadingMove, 1 - u), ease.outCubic);
      tl.line(8);
      tl.add(0.38, scene.writer(scene.moves[si]), ease.linear);
      tl.line(step.move === "lo" ? 9 : [10, 11]);
      prevMove = scene.moves[si];
    });

    // finale: highlight the winning walls in green
    tl.line(12);
    const lastStep = sim.steps[sim.steps.length - 1];
    const winLo = bars[sim.bestLo], winHi = bars[sim.bestHi];
    tl.add(0.4, u => {
      if (lastStep) {
        setOpacity(bars[lastStep.lo].rectLo, 1 - u);
        setOpacity(bars[lastStep.hi].rectHi, 1 - u);
      }
      setOpacity(scene.loPtr.g, 1 - u);
      setOpacity(scene.hiPtr.g, 1 - u);
      setOpacity(winLo.rectBest, u);
      setOpacity(winHi.rectBest, u);
      setWater(winLo.gx, winHi.gx, Math.min(winLo.h, winHi.h));
    }, ease.outCubic);

    tl.add(0.6, scene.writer(scene.result), ease.linear);
    tl.add(0.45, u => {
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u)));
    }, ease.outCubic);
    tl.wait(1.4);

    return tl.finish();
  },
};

function simulate(height) {
  let lo = 0, hi = height.length - 1;
  let best = 0, bestLo = 0, bestHi = hi;
  const steps = [];

  while (lo < hi) {
    const hLo = height[lo], hHi = height[hi];
    const width = hi - lo;
    const short = Math.min(hLo, hHi);
    const area = width * short;
    const isRecord = area > best;
    if (isRecord) {
      best = area;
      bestLo = lo;
      bestHi = hi;
    }
    const move = hLo < hHi ? "lo" : "hi";
    steps.push({ lo, hi, hLo, hHi, width, short, area, best, isRecord, move });
    if (move === "lo") lo += 1;
    else hi -= 1;
  }

  return { steps, best, bestLo, bestHi };
}
