/* Trapping Rain Water — animated walkthrough scene (3Blue1Brown style).
 *
 * Draw the elevation bars on an axis and close `lo` (blue) and `hi` (gold)
 * inward while tracking `left_max` and `right_max`. At each step the shorter
 * side determines the water level for its column: either the bar raises that
 * side's maximum wall, or `max - height[i]` units of water fill the column
 * above it in glowing cyan.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Trapping Rain Water",
    subtitle: "two pointers · running left_max & right_max · O(n) time · O(1) space",
    inputs: [
      { id: "height", label: "height", type: "text", default: "0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "lo & left_max" },
      { color: "#F0AC5F", text: "hi & right_max" },
      { color: "#5CD0B3", text: "trapped water" },
      { color: "#83C167", text: "total water" },
    ],
  },

  code: [
    "def trap(height: List[int]) -> int:",
    "    if not height:",
    "        return 0",
    "    left, right = 0, len(height) - 1",
    "    left_max = right_max = 0",
    "    water = 0",
    "    while left < right:",
    "        if height[left] < height[right]:",
    "            if height[left] >= left_max:",
    "                left_max = height[left]",
    "            else:",
    "                water += left_max - height[left]",
    "            left += 1",
    "        else:",
    "            if height[right] >= right_max:",
    "                right_max = height[right]",
    "            else:",
    "                water += right_max - height[right]",
    "            right -= 1",
    "    return water",
  ],

  read(values) {
    const raw = (values.height || "").trim();
    if (!raw) return null;
    const height = raw.split(/[\s,]+/).filter(Boolean).map(Number);
    if (height.length < 3 || height.length > 14) return null;
    if (!height.every(v => Number.isInteger(v) && v >= 0)) return null;
    return { height };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const height = args[0].map(Number);
      if (height.length >= 3 && height.length <= 14
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
      cols: [], eqs: [], notes: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title + subtitle -------------------------------------------------
    scene.title = txt("Trapping Rain Water", {
      x: 64, y: 74, "font-size": 44, fill: C.white, "letter-spacing": 1,
    }, textL);
    const sub = el("text", { x: 64, y: 112, "font-size": 22, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "height = ";
    el("tspan", { fill: C.white }, sub).textContent = "[" + height.join(", ") + "]";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- elevation profile + water blocks ---------------------------------
    const baseY = 352;
    const maxBarH = 180;
    const peak = Math.max(1, ...height);
    const gap = 8;
    const colW = clamp((1040 - gap * (n - 1)) / n, 38, 76);
    const totalW = n * colW + (n - 1) * gap;
    const startX = STAGE_W / 2 - totalW / 2;
    const unitH = maxBarH / peak;
    scene.baseY = baseY;
    scene.unitH = unitH;

    // left_max and right_max dashed guide lines
    scene.leftMaxLine = el("line", {
      x1: startX, y1: baseY, x2: startX, y2: baseY,
      stroke: C.blue, "stroke-width": 2.2, "stroke-dasharray": "6 5",
    }, arcsL);
    scene.rightMaxLine = el("line", {
      x1: startX + totalW, y1: baseY, x2: startX + totalW, y2: baseY,
      stroke: C.gold, "stroke-width": 2.2, "stroke-dasharray": "6 5",
    }, arcsL);
    setOpacity(scene.leftMaxLine, 0);
    setOpacity(scene.rightMaxLine, 0);

    scene.axis = el("line", {
      x1: startX - 20, y1: baseY, x2: startX + totalW + 20, y2: baseY,
      stroke: C.greyDark, "stroke-width": 2.5, "stroke-linecap": "round",
    }, chipsL);
    setOpacity(scene.axis, 0);

    height.forEach((h, i) => {
      const x = startX + i * (colW + gap);
      const gx = x + colW / 2;
      const bh = h * unitH;
      const barTop = baseY - bh;
      const wUnits = sim.trappedAt[i];
      const wh = wUnits * unitH;
      const waterTop = barTop - wh;

      const g = el("g", {}, chipsL);

      // water column sitting on top of the terrain bar
      const waterRect = el("rect", {
        x, y: barTop, width: colW, height: 0, rx: 4,
        fill: C.teal, "fill-opacity": 0.48,
        stroke: C.teal, "stroke-width": 1.6, filter: "url(#glow-teal)",
      }, g);
      setOpacity(waterRect, 0);

      const waterBadge = txt(wUnits > 0 ? "+" + wUnits : "", {
        x: gx, y: waterTop - 10, "text-anchor": "middle",
        "font-size": 16, fill: C.teal, "font-weight": "bold",
      }, g);
      setOpacity(waterBadge, 0);

      // terrain bar
      const barIdle = el("rect", {
        x, y: barTop, width: colW, height: Math.max(3, bh), rx: 4,
        fill: "#334155", stroke: "#475569", "stroke-width": 1.5,
      }, g);
      const hlLo = el("rect", {
        x, y: barTop, width: colW, height: Math.max(3, bh), rx: 4,
        fill: "none", stroke: C.blue, "stroke-width": 2.8, filter: "url(#glow-blue)",
      }, g);
      const hlHi = el("rect", {
        x, y: barTop, width: colW, height: Math.max(3, bh), rx: 4,
        fill: "none", stroke: C.gold, "stroke-width": 2.8, filter: "url(#glow-gold)",
      }, g);
      setOpacity(hlLo, 0);
      setOpacity(hlHi, 0);

      const hLabel = txt(String(h), {
        x: gx, y: baseY - Math.max(bh, 4) / 2 + 5,
        "text-anchor": "middle", "font-size": 15,
        fill: bh >= 22 ? C.white : C.grey,
      }, g);
      if (bh < 22) hLabel.setAttribute("y", String(barTop - 8));

      txt(String(i), {
        x: gx, y: baseY + 22, "text-anchor": "middle", "font-size": 14, fill: C.grey,
      }, g);

      setOpacity(g, 0);
      scene.cols.push({
        i, h, x, gx, colW, bh, barTop, wUnits, wh, waterTop,
        g, barIdle, hlLo, hlHi, waterRect, waterBadge,
      });
    });

    // pointers lo and hi
    const ptrY = baseY + 32;
    scene.ptrY = ptrY;
    function buildPointer(color, glowId, label) {
      const g = el("g", {}, ptrL);
      el("path", { d: "M -8 12 L 0 -1 L 8 12 Z", fill: color, filter: "url(#" + glowId + ")" }, g);
      el("line", {
        x1: 0, y1: 12, x2: 0, y2: 30,
        stroke: color, "stroke-width": 3.2, "stroke-linecap": "round",
      }, g);
      txt(label, {
        x: 0, y: 50, "text-anchor": "middle", "font-size": 20,
        fill: color, "font-weight": "bold",
      }, g);
      setOpacity(g, 0);
      return { g };
    }
    scene.loPtr = buildPointer(C.blue, "glow-blue", "lo");
    scene.hiPtr = buildPointer(C.gold, "glow-gold", "hi");

    // per-step equations + explanations
    sim.steps.forEach(step => {
      const eq = el("text", {
        x: STAGE_W / 2, y: 462, "text-anchor": "middle", "font-size": 26,
      }, textL);
      const part = (str, fill) => {
        const t = el("tspan", fill ? { fill } : {}, eq);
        t.textContent = str;
      };
      if (step.side === "left") {
        part("h[lo=" + step.lo + "] = " + step.hLo, C.blue);
        part(" < ", C.grey);
        part("h[hi=" + step.hi + "] = " + step.hHi, C.gold);
        part("   →   settle left column " + step.idx, C.white);
      } else {
        part("h[hi=" + step.hi + "] = " + step.hHi, C.gold);
        part(" ≤ ", C.grey);
        part("h[lo=" + step.lo + "] = " + step.hLo, C.blue);
        part("   →   settle right column " + step.idx, C.white);
      }
      scene.eqs.push(eq);

      const noteColor = step.added > 0 ? C.teal : (step.side === "left" ? C.blue : C.gold);
      scene.notes.push(txt(step.message, {
        x: STAGE_W / 2, y: 504, "text-anchor": "middle", "font-size": 22, fill: noteColor,
      }, textL));
    });

    // running maxima + water tally
    scene.tally = txt("left_max = 0   ·   right_max = 0   ·   water = 0", {
      x: STAGE_W / 2, y: 558, "text-anchor": "middle", "font-size": 22, fill: C.green,
    }, textL);
    setOpacity(scene.tally, 0);

    // final result + underline
    scene.result = txt("return " + sim.totalWater, {
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
      setOpacity(scene.leftMaxLine, 0);
      setOpacity(scene.rightMaxLine, 0);
      setOpacity(scene.tally, 0);
      scene.tally.textContent = "left_max = 0   ·   right_max = 0   ·   water = 0";
      for (const c of scene.cols) {
        setOpacity(c.g, 0);
        setOpacity(c.hlLo, 0);
        setOpacity(c.hlHi, 0);
        setOpacity(c.waterRect, 0);
        c.waterRect.setAttribute("y", String(c.barTop));
        c.waterRect.setAttribute("height", "0");
        setOpacity(c.waterBadge, 0);
      }
      setOpacity(scene.loPtr.g, 0);
      setOpacity(scene.hiPtr.g, 0);
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate } = ctx;
    const { cols, sim, baseY, unitH } = scene;
    const firstX = cols[0].x;
    const lastRight = cols[cols.length - 1].x + cols[cols.length - 1].colW;

    tl.line(1);
    tl.add(0.55, scene.writer(scene.title), ease.outCubic);
    tl.line(4);
    tl.add(0.35, u => {
      setOpacity(scene.subtitle, u);
      setOpacity(scene.axis, u);
    }, ease.outCubic);

    cols.forEach(c => {
      tl.add(0.16, u => setOpacity(c.g, u), ease.outCubic);
      tl.wait(0.02);
    });
    tl.line([5, 6]);
    tl.add(0.3, u => setOpacity(scene.tally, u), ease.outCubic);

    let prevEq = null, prevNote = null;

    sim.steps.forEach((step, si) => {
      const lc = cols[step.lo], rc = cols[step.hi];

      tl.line(7);

      if (si === 0) {
        tl.add(0.4, u => {
          setOpacity(scene.loPtr.g, u);
          setOpacity(scene.hiPtr.g, u);
          setTranslate(scene.loPtr.g, lc.gx, scene.ptrY);
          setTranslate(scene.hiPtr.g, rc.gx, scene.ptrY);
          setOpacity(lc.hlLo, u);
          setOpacity(rc.hlHi, u);
        }, ease.outCubic);
      } else {
        const prev = sim.steps[si - 1];
        const plc = cols[prev.lo], prc = cols[prev.hi];
        if (step.lo !== prev.lo) {
          tl.add(0.32, u => {
            setTranslate(scene.loPtr.g, plc.gx + (lc.gx - plc.gx) * u, scene.ptrY);
            setOpacity(plc.hlLo, 1 - u);
            setOpacity(lc.hlLo, u);
          }, ease.inOutSine);
        }
        if (step.hi !== prev.hi) {
          tl.add(0.32, u => {
            setTranslate(scene.hiPtr.g, prc.gx + (rc.gx - prc.gx) * u, scene.ptrY);
            setOpacity(prc.hlHi, 1 - u);
            setOpacity(rc.hlHi, u);
          }, ease.inOutSine);
        }
      }

      const fadingEq = prevEq;
      if (fadingEq) tl.add(0.12, u => setOpacity(fadingEq, 1 - u), ease.outCubic);
      tl.line(8);
      tl.add(0.36, scene.writer(scene.eqs[si]), ease.linear);
      prevEq = scene.eqs[si];

      const fadingNote = prevNote;
      if (fadingNote) tl.add(0.12, u => setOpacity(fadingNote, 1 - u), ease.outCubic);
      tl.line(step.side === "left" ? 9 : [14, 15]);
      tl.add(0.36, scene.writer(scene.notes[si]), ease.linear);
      prevNote = scene.notes[si];

      // animate water fill or max-wall line update
      const col = cols[step.idx];
      const lmY = baseY - step.leftMax * unitH;
      const rmY = baseY - step.rightMax * unitH;
      const lmEnd = cols[step.lo].x + cols[step.lo].colW;
      const rmStart = cols[step.hi].x;
      const tallyStr = "left_max = " + step.leftMax
        + "   ·   right_max = " + step.rightMax
        + "   ·   water = " + step.water;

      tl.line(step.side === "left"
        ? (step.added > 0 ? [11, 12] : 10)
        : (step.added > 0 ? [17, 18] : 16));
      tl.add(0.38, u => {
        if (step.leftMax > 0) {
          setOpacity(scene.leftMaxLine, 1);
          scene.leftMaxLine.setAttribute("x1", String(firstX));
          scene.leftMaxLine.setAttribute("y1", String(lmY));
          scene.leftMaxLine.setAttribute("x2", String(lmEnd));
          scene.leftMaxLine.setAttribute("y2", String(lmY));
        }
        if (step.rightMax > 0) {
          setOpacity(scene.rightMaxLine, 1);
          scene.rightMaxLine.setAttribute("x1", String(rmStart));
          scene.rightMaxLine.setAttribute("y1", String(rmY));
          scene.rightMaxLine.setAttribute("x2", String(lastRight));
          scene.rightMaxLine.setAttribute("y2", String(rmY));
        }
        if (step.added > 0) {
          const curH = col.wh * u;
          setOpacity(col.waterRect, 1);
          col.waterRect.setAttribute("y", String(col.barTop - curH));
          col.waterRect.setAttribute("height", String(curH));
          setOpacity(col.waterBadge, u);
        }
        scene.tally.textContent = tallyStr;
      }, ease.outCubic);
      tl.line(step.side === "left" ? 13 : 19);
    });

    // finale
    tl.line(20);
    const last = sim.steps[sim.steps.length - 1];
    tl.add(0.32, u => {
      if (last) {
        setOpacity(cols[last.lo].hlLo, 1 - u);
        setOpacity(cols[last.hi].hlHi, 1 - u);
      }
      setOpacity(scene.loPtr.g, 1 - u);
      setOpacity(scene.hiPtr.g, 1 - u);
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
  const n = height.length;
  let lo = 0, hi = n - 1;
  let leftMax = 0, rightMax = 0, water = 0;
  const trappedAt = new Array(n).fill(0);
  const steps = [];

  while (lo < hi) {
    const hLo = height[lo], hHi = height[hi];
    if (hLo < hHi) {
      let added = 0, message = "";
      if (hLo >= leftMax) {
        leftMax = hLo;
        message = "h[" + lo + "] = " + hLo + " raises left_max to " + leftMax + " (no water trapped here)";
      } else {
        added = leftMax - hLo;
        water += added;
        trappedAt[lo] = added;
        message = "left_max (" + leftMax + ") − h[" + lo + "] (" + hLo + ") = +" + added + " water  →  total = " + water;
      }
      steps.push({ side: "left", idx: lo, lo, hi, hLo, hHi, leftMax, rightMax, added, water, message });
      lo += 1;
    } else {
      let added = 0, message = "";
      if (hHi >= rightMax) {
        rightMax = hHi;
        message = "h[" + hi + "] = " + hHi + " raises right_max to " + rightMax + " (no water trapped here)";
      } else {
        added = rightMax - hHi;
        water += added;
        trappedAt[hi] = added;
        message = "right_max (" + rightMax + ") − h[" + hi + "] (" + hHi + ") = +" + added + " water  →  total = " + water;
      }
      steps.push({ side: "right", idx: hi, lo, hi, hLo, hHi, leftMax, rightMax, added, water, message });
      hi -= 1;
    }
  }

  return { steps, trappedAt, totalWater: water };
}
