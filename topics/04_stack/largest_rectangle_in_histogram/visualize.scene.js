/* Largest Rectangle in Histogram — animated walkthrough scene (3Blue1Brown style).
 *
 * Draw the histogram bars plus a trailing sentinel `0` bar at index `n`.
 * Maintain a monotonic non-decreasing stack of bar indices. Whenever the
 * current height is smaller than `heights[stack[-1]]`, pop `bar` and measure
 * the widest rectangle of height `heights[bar]` bounded on the left by the
 * new stack top and on the right by `i - 1`.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Largest Rectangle in Histogram",
    subtitle: "monotonic increasing stack + trailing 0 sentinel · O(n) time · O(n) space",
    inputs: [
      { id: "heights", label: "heights", type: "text", default: "2, 1, 5, 6, 2, 3", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "on monotonic stack" },
      { color: "#F0AC5F", text: "popped rectangle candidate" },
      { color: "#83C167", text: "largest rectangle so far" },
    ],
  },

  code: [
    "def largest_rectangle_area(heights: List[int]) -> int:",
    "    best = 0",
    "    stack: list[int] = []",
    "    for i, height in enumerate(heights + [0]):",
    "        while stack and heights[stack[-1]] > height:",
    "            bar = stack.pop()",
    "            width = i if not stack else i - stack[-1] - 1",
    "            best = max(best, heights[bar] * width)",
    "        stack.append(i)",
    "    return best",
  ],

  read(values) {
    const raw = (values.heights || "").trim();
    if (!raw) return null;
    const heights = raw.split(/[\s,]+/).filter(Boolean).map(Number);
    if (heights.length < 1 || heights.length > 11) return null;
    if (!heights.every(v => Number.isInteger(v) && v >= 0 && v <= 50)) return null;
    return { heights };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const heights = args[0].map(Number);
      if (heights.length >= 1 && heights.length <= 11
          && heights.every(v => Number.isInteger(v) && v >= 0)) {
        return { heights: heights.join(", ") };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const { heights } = params;
    const ext = heights.concat([0]);
    const m = ext.length;
    const sim = simulate(heights);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const arcsL = ctx.layer("arcs");
    const chipsL = ctx.layer("chips");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = {
      heights, ext, sim, ctx,
      bars: [], stackSlots: [], eqs: [], actions: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title + subtitle -------------------------------------------------
    scene.title = txt("Largest Rectangle in Histogram", {
      x: 64, y: 70, "font-size": 40, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    const sub = el("text", { x: 64, y: 108, "font-size": 21, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "heights = [";
    el("tspan", { fill: C.white }, sub).textContent = heights.join(", ");
    el("tspan", {}, sub).textContent = "]  +  [0] sentinel";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- top-right best area badge ----------------------------------------
    const bestG = el("g", {}, textL);
    setOpacity(bestG, 0);
    el("rect", {
      x: 920, y: 48, width: 300, height: 64, rx: 10,
      fill: "#111722", stroke: C.green, "stroke-width": 2,
    }, bestG);
    txt("max_area =", {
      x: 942, y: 80, "font-size": 22, fill: C.grey, "dominant-baseline": "central",
    }, bestG);
    scene.bestVal = txt("0", {
      x: 1196, y: 80, "font-size": 28, fill: C.green,
      "text-anchor": "end", "dominant-baseline": "central",
    }, bestG);
    scene.bestBadge = bestG;

    // -- histogram geometry -----------------------------------------------
    const baseY = 328;
    const maxBarH = 165;
    const peak = Math.max(1, ...heights);
    const barW = clamp(Math.floor(760 / m), 46, 68);
    const gap = 4;
    const pitch = barW + gap;
    const totalW = m * pitch - gap;
    const startX = STAGE_W / 2 - totalW / 2;
    const yOf = h => baseY - (h / peak) * maxBarH;

    scene.baseY = baseY;
    scene.yOf = yOf;
    scene.barW = barW;

    scene.axisLine = el("line", {
      x1: startX - 24, y1: baseY, x2: startX + totalW + 24, y2: baseY,
      stroke: C.slate, "stroke-width": 2,
    }, arcsL);
    setOpacity(scene.axisLine, 0);

    for (let i = 0; i < m; i++) {
      const h = ext[i];
      const isSentinel = i === m - 1;
      const x = startX + i * pitch;
      const cx = x + barW / 2;
      const topY = yOf(h);
      const bh = Math.max(4, baseY - topY);

      const g = el("g", {}, chipsL);
      setOpacity(g, 0);

      const rect = el("rect", {
        x, y: baseY - bh, width: barW, height: bh, rx: 4,
        fill: isSentinel ? "#111722" : C.cellBg,
        stroke: isSentinel ? C.dim : C.cellStroke,
        "stroke-width": 2,
      }, g);

      const hTxt = txt(isSentinel ? "0*" : String(h), {
        x: cx, y: baseY - bh - 14, "font-size": 17,
        fill: isSentinel ? C.dim : C.white, "text-anchor": "middle",
      }, g);

      const idxTxt = txt(String(i), {
        x: cx, y: baseY + 20, "font-size": 15, fill: C.grey,
        "text-anchor": "middle",
      }, g);

      scene.bars.push({ g, rect, hTxt, idxTxt, x, cx, w: barW, h, topY, isSentinel });
    }

    // -- candidate & champion rectangle overlays --------------------------
    scene.candRect = el("rect", {
      x: startX, y: baseY, width: 0, height: 0, rx: 4,
      fill: C.gold, "fill-opacity": 0.25,
      stroke: C.gold, "stroke-width": 2.5,
    }, ptrL);
    setOpacity(scene.candRect, 0);

    scene.bestRect = el("rect", {
      x: startX, y: baseY, width: 0, height: 0, rx: 4,
      fill: C.green, "fill-opacity": 0.16,
      stroke: C.green, "stroke-width": 2.5, "stroke-dasharray": "6 4",
    }, ptrL);
    setOpacity(scene.bestRect, 0);

    // -- cursor pointer ---------------------------------------------------
    const ptrG = el("g", {}, ptrL);
    setOpacity(ptrG, 0);
    el("polygon", {
      points: "-8,14 8,14 0,2",
      fill: C.gold, filter: "url(#glow-gold)",
    }, ptrG);
    scene.cursorPtr = ptrG;

    // -- monotonic stack row (y=392) --------------------------------------
    const stY = 392;
    scene.stackLabel = txt("increasing stack (idx:h) :", {
      x: 90, y: stY, "font-size": 19, fill: C.grey,
      "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.stackLabel, 0);

    const slotW = 78;
    const slotGap = 8;
    const stStartX = 330;
    for (let k = 0; k < m; k++) {
      const bx = stStartX + k * (slotW + slotGap);
      const g = el("g", {}, arcsL);
      setOpacity(g, 0);
      const rect = el("rect", {
        x: bx, y: stY - 20, width: slotW, height: 40, rx: 7,
        fill: "#142636", stroke: C.blue, "stroke-width": 2,
      }, g);
      const label = txt("", {
        x: bx + slotW / 2, y: stY, "font-size": 17, fill: C.white,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);
      scene.stackSlots.push({ g, rect, label });
    }

    // -- per-step equation & action notes ---------------------------------
    sim.steps.forEach(st => {
      const eq = el("text", {
        x: STAGE_W / 2, y: 460, "font-size": 25, fill: C.white,
        "text-anchor": "middle",
      }, textL);
      if (st.kind === "pop") {
        el("tspan", { fill: C.gold }, eq).textContent =
          `pop idx ${st.bar} (h=${st.barH}) < cur i=${st.i} (h=${st.curH})`;
        el("tspan", { fill: C.grey }, eq).textContent =
          `   →   span [${st.lBound}..${st.rBound}] (w=${st.width})   →   area = ${st.barH} × ${st.width} = `;
        el("tspan", { fill: st.isNewBest ? C.green : C.white }, eq).textContent = String(st.area);
      } else {
        el("tspan", { fill: C.blue }, eq).textContent =
          `i = ${st.i} (height ${st.curH}${st.isSentinel ? " sentinel" : ""})`;
        el("tspan", { fill: C.grey }, eq).textContent =
          `   →   push ${st.i}:${st.curH} onto increasing stack`;
      }
      scene.eqs.push(eq);

      const act = txt(st.actionText, {
        x: STAGE_W / 2, y: 504, "font-size": 22,
        fill: st.isNewBest ? C.green : (st.kind === "pop" ? C.gold : C.grey),
        "text-anchor": "middle",
      }, textL);
      scene.actions.push(act);
    });

    // -- final banner -----------------------------------------------------
    const bY = 595;
    scene.bannerBox = el("rect", {
      x: 230, y: bY - 36, width: 820, height: 70, rx: 12,
      fill: "#13261B", stroke: C.green, "stroke-width": 2.5,
      filter: "url(#glow-green)",
    }, resultL);
    setOpacity(scene.bannerBox, 0);

    scene.bannerText = txt(
      `return ${sim.best}   (rectangle [${sim.bestL}..${sim.bestR}] of height ${sim.bestH} × width ${sim.bestW})`,
      {
        x: STAGE_W / 2, y: bY, "font-size": 26, fill: C.green,
        "text-anchor": "middle", "dominant-baseline": "central",
      },
      resultL
    );

    scene.complexity = txt(
      "Each bar pushed & popped once · O(n) time · O(n) monotonic stack space",
      { x: STAGE_W / 2, y: 668, "font-size": 20, fill: C.grey, "text-anchor": "middle" },
      resultL
    );

    // -- reset ------------------------------------------------------------
    scene.reset = () => {
      setOpacity(scene.title, 0);
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.bestBadge, 0);
      scene.bestVal.textContent = "0";
      setOpacity(scene.axisLine, 0);
      setOpacity(scene.candRect, 0);
      setOpacity(scene.bestRect, 0);
      setOpacity(scene.cursorPtr, 0);
      setOpacity(scene.stackLabel, 0);
      setOpacity(scene.bannerBox, 0);
      if (scene.bars[0]) {
        setTranslate(scene.cursorPtr, scene.bars[0].cx, baseY + 26);
      }
      for (const b of scene.bars) {
        setOpacity(b.g, 0);
        b.rect.setAttribute("fill", b.isSentinel ? "#111722" : C.cellBg);
        b.rect.setAttribute("stroke", b.isSentinel ? C.dim : C.cellStroke);
      }
      for (const sl of scene.stackSlots) {
        setOpacity(sl.g, 0);
        sl.label.textContent = "";
      }
      for (const w of scene._writers) w.reset();
    };

    return scene;
  },

  buildTimeline(scene, tl) {
    const { ctx, sim, ext, baseY, yOf } = scene;
    const { C, ease, clamp, setOpacity, setTranslate } = ctx;
    const easeOut = ease.outCubic;
    const easeInOut = ease.inOutSine;
    const lerp = (a, b, t) => a + (b - a) * t;
    const ptrY = baseY + 26;

    const wTitle = scene.writer(scene.title);
    const wEqs = scene.eqs.map(scene.writer);
    const wActs = scene.actions.map(scene.writer);
    const wBanner = scene.writer(scene.bannerText);
    const wComplex = scene.writer(scene.complexity);

    scene.reset();

    const renderStack = stArr => {
      scene.stackSlots.forEach((sl, idx) => {
        if (idx < stArr.length) {
          const bIdx = stArr[idx];
          sl.label.textContent = `${bIdx}:${ext[bIdx]}`;
          setOpacity(sl.g, 1);
        } else {
          setOpacity(sl.g, 0);
        }
      });
      const inSet = new Set(stArr);
      scene.bars.forEach((b, idx) => {
        if (inSet.has(idx)) {
          b.rect.setAttribute("stroke", C.blue);
          b.rect.setAttribute("fill", "#142636");
        } else {
          b.rect.setAttribute("stroke", b.isSentinel ? C.dim : C.cellStroke);
          b.rect.setAttribute("fill", b.isSentinel ? "#111722" : C.cellBg);
        }
      });
    };

    // 1. Title + subtitle + histogram reveal
    tl.line(1);
    tl.add(0.75, wTitle);
    tl.add(0.45, u => setOpacity(scene.subtitle, easeOut(u)));
    tl.line([2, 3]);
    tl.add(0.65, u => {
      setOpacity(scene.bestBadge, easeOut(u));
      setOpacity(scene.axisLine, easeOut(u));
      setOpacity(scene.stackLabel, easeOut(u));
      scene.bars.forEach((b, i) => {
        const start = i * 0.05;
        const p = clamp((u - start) / Math.max(0.25, 1 - start), 0, 1);
        setOpacity(b.g, easeOut(p));
      });
    });
    tl.wait(0.2);

    let prevEq = null;
    let prevAct = null;
    let seenI = -1;

    sim.steps.forEach((st, idx) => {
      const bCur = scene.bars[st.i];
      const bPrev = idx === 0 ? bCur : scene.bars[sim.steps[idx - 1].i];
      const fadingEq = prevEq;
      const fadingAct = prevAct;
      const firstOfRow = st.i !== seenI;
      seenI = st.i;

      tl.line(st.kind === "pop"
        ? (firstOfRow ? [4, 5, 6, 7, 8] : [5, 6, 7, 8])
        : (firstOfRow ? [4, 5, 9] : [5, 9]));
      tl.add(0.38, u => {
        const e = easeInOut(u);
        if (fadingEq) setOpacity(fadingEq, 1 - e);
        if (fadingAct) setOpacity(fadingAct, 1 - e);
        setTranslate(scene.cursorPtr, lerp(bPrev.cx, bCur.cx, e), ptrY);
        setOpacity(scene.cursorPtr, 1);

        if (st.kind === "pop") {
          const bL = scene.bars[st.lBound];
          const bR = scene.bars[st.rBound];
          const top = yOf(st.barH);
          scene.candRect.setAttribute("x", bL.x);
          scene.candRect.setAttribute("y", top);
          scene.candRect.setAttribute("width", bR.x + bR.w - bL.x);
          scene.candRect.setAttribute("height", Math.max(2, baseY - top));
          setOpacity(scene.candRect, e);
        } else {
          setOpacity(scene.candRect, 0);
        }

        if (u > 0.5) {
          renderStack(st.stackAfter);
        }
      });

      tl.add(0.5, wEqs[idx]);
      tl.add(0.45, wActs[idx]);

      if (st.isNewBest) {
        tl.add(0.3, u => {
          if (u > 0.3) {
            scene.bestVal.textContent = String(st.bestAfter);
            const bL = scene.bars[st.lBound];
            const bR = scene.bars[st.rBound];
            const top = yOf(st.barH);
            scene.bestRect.setAttribute("x", bL.x);
            scene.bestRect.setAttribute("y", top);
            scene.bestRect.setAttribute("width", bR.x + bR.w - bL.x);
            scene.bestRect.setAttribute("height", Math.max(2, baseY - top));
            setOpacity(scene.bestRect, 1);
          }
        });
      }

      prevEq = scene.eqs[idx];
      prevAct = scene.actions[idx];
    });

    const lastEq = prevEq;
    const lastAct = prevAct;
    tl.add(0.4, u => {
      const e = easeOut(u);
      if (lastEq) setOpacity(lastEq, 1 - e);
      if (lastAct) setOpacity(lastAct, 1 - e);
      setOpacity(scene.candRect, 1 - e);
      setOpacity(scene.cursorPtr, 1 - e);
    });

    tl.line(10);
    tl.add(0.3, u => setOpacity(scene.bannerBox, easeOut(u)));
    tl.add(0.55, wBanner);
    tl.add(0.65, wComplex);
    tl.wait(0.6);
  },
};

function simulate(heights) {
  const ext = heights.concat([0]);
  const stack = [];
  let best = 0;
  let bestL = 0;
  let bestR = 0;
  let bestH = 0;
  let bestW = 0;
  const steps = [];

  for (let i = 0; i < ext.length; i++) {
    const curH = ext[i];
    const isSentinel = i === ext.length - 1;

    while (stack.length > 0 && ext[stack[stack.length - 1]] > curH) {
      const bar = stack.pop();
      const barH = ext[bar];
      const lBound = stack.length === 0 ? 0 : stack[stack.length - 1] + 1;
      const rBound = i - 1;
      const width = i - lBound;
      const area = barH * width;
      let isNewBest = false;
      if (area > best) {
        best = area;
        bestL = lBound;
        bestR = rBound;
        bestH = barH;
        bestW = width;
        isNewBest = true;
      }

      steps.push({
        kind: "pop",
        i,
        curH,
        isSentinel,
        bar,
        barH,
        lBound,
        rBound,
        width,
        area,
        isNewBest,
        bestAfter: best,
        stackAfter: stack.slice(),
        actionText: isNewBest
          ? `new largest rectangle! area ${area} (${barH} × ${width} across [${lBound}..${rBound}]) → max_area = ${best}`
          : `area ${area} ≤ max_area (${best}) · keep popping taller bars`,
      });
    }

    stack.push(i);
    steps.push({
      kind: "push",
      i,
      curH,
      isSentinel,
      isNewBest: false,
      bestAfter: best,
      stackAfter: stack.slice(),
      actionText: isSentinel
        ? `sentinel 0 flushed all positive bars · max_area = ${best}`
        : `monotonic stack = [${stack.map(idx => `${idx}:${ext[idx]}`).join(", ")}]`,
    });
  }

  return { steps, best, bestL, bestR, bestH, bestW };
}
