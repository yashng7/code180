/* Longest Repeating Character Replacement — animated walkthrough scene.
 *
 * Frame the active substring `s[left..right]` and display live character
 * frequency badges plus `max_freq`. A window of length `len` needs
 * `len - max_freq` replacements to become all one character. Whenever
 * `len - max_freq > k`, decrement `counts[s[left]]` and shift `left` right by
 * one so the window never shrinks below the best valid size seen so far.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Longest Repeating Character Replacement",
    subtitle: "monotonic sliding window + max_freq · O(n) time · O(Σ) space",
    inputs: [
      { id: "s", label: "s", type: "text", default: "AABABBA", width: "wide" },
      { id: "k", label: "k", type: "number", default: 1, min: 0, max: 14 },
    ],
    legend: [
      { color: "#58C4DD", text: "left boundary" },
      { color: "#F0AC5F", text: "right cursor" },
      { color: "#83C167", text: "valid window (repl ≤ k)" },
      { color: "#FC6255", text: "exceeds k (slide left +1)" },
    ],
  },

  code: [
    "def character_replacement(s: str, k: int) -> int:",
    "    count: Dict[str, int] = {}",
    "    left = 0",
    "    best = 0",
    "    max_count = 0",
    "    for right, ch in enumerate(s):",
    "        count[ch] = count.get(ch, 0) + 1",
    "        max_count = max(max_count, count[ch])",
    "        while (right - left + 1) - max_count > k:",
    "            count[s[left]] -= 1",
    "            left += 1",
    "        best = max(best, right - left + 1)",
    "    return best",
  ],

  read(values) {
    const s = (values.s || "").trim().toUpperCase();
    const k = Number(values.k);
    if (s.length < 1 || s.length > 14) return null;
    if (!Number.isInteger(k) || k < 0 || k > s.length) return null;
    return { s, k };
  },

  fromArgs(args) {
    if (Array.isArray(args) && typeof args[0] === "string" && Number.isInteger(args[1])) {
      const s = args[0];
      const k = args[1];
      if (s.length >= 1 && s.length <= 14 && k >= 0) {
        return { s, k };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const { s, k } = params;
    const n = s.length;
    const sim = simulate(s, k);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-red", C.red);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const arcsL = ctx.layer("arcs");
    const chipsL = ctx.layer("chips");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = {
      s, k, sim, ctx,
      cells: [], freqBadges: {}, eqs: [], actions: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title + subtitle -------------------------------------------------
    scene.title = txt("Longest Repeating Character Replacement", {
      x: 64, y: 72, "font-size": 38, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    const sub = el("text", { x: 64, y: 110, "font-size": 22, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = 's = "';
    el("tspan", { fill: C.white }, sub).textContent = s;
    el("tspan", {}, sub).textContent = `",   k = `;
    el("tspan", { fill: C.gold }, sub).textContent = String(k);
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- top-right scoreboard (max_freq & best) ---------------------------
    const scoreG = el("g", {}, textL);
    setOpacity(scoreG, 0);
    el("rect", {
      x: 880, y: 50, width: 340, height: 66, rx: 10,
      fill: "#111722", stroke: C.green, "stroke-width": 2,
    }, scoreG);
    txt("max_freq:", { x: 900, y: 83, "font-size": 20, fill: C.grey, "dominant-baseline": "central" }, scoreG);
    scene.maxFreqVal = txt("0", { x: 1018, y: 83, "font-size": 24, fill: C.gold, "text-anchor": "end", "dominant-baseline": "central" }, scoreG);
    txt("best:", { x: 1065, y: 83, "font-size": 20, fill: C.grey, "dominant-baseline": "central" }, scoreG);
    scene.bestVal = txt("0", { x: 1196, y: 83, "font-size": 26, fill: C.green, "text-anchor": "end", "dominant-baseline": "central" }, scoreG);
    scene.scoreBadge = scoreG;

    // -- character array geometry -----------------------------------------
    const rowY = 235;
    const cellW = clamp(Math.floor(960 / n) - 8, 52, 74);
    const cellH = 68;
    const pitch = cellW + 8;
    const totalW = n * pitch - 8;
    const startX = STAGE_W / 2 - totalW / 2;

    scene.winBox = el("rect", {
      x: startX - 6, y: rowY - cellH / 2 - 8,
      width: cellW + 12, height: cellH + 16, rx: 12,
      fill: C.green, "fill-opacity": 0.12,
      stroke: C.green, "stroke-width": 2.5,
    }, arcsL);
    setOpacity(scene.winBox, 0);

    for (let i = 0; i < n; i++) {
      const x = startX + i * pitch;
      const cx = x + cellW / 2;
      const g = el("g", {}, chipsL);
      setOpacity(g, 0);

      const box = el("rect", {
        x, y: rowY - cellH / 2, width: cellW, height: cellH, rx: 8,
        fill: C.cellBg, stroke: C.cellStroke, "stroke-width": 2,
      }, g);

      const chTxt = txt(s[i], {
        x: cx, y: rowY, "font-size": 28, fill: C.white,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);

      const idxTxt = txt(String(i), {
        x: cx, y: rowY + cellH / 2 + 22, "font-size": 16, fill: C.grey,
        "text-anchor": "middle",
      }, g);

      scene.cells.push({ g, box, chTxt, idxTxt, x, cx, w: cellW, ch: s[i] });
    }

    // -- left & right pointers --------------------------------------------
    const mkPtr = (label, color, glowId, dy) => {
      const g = el("g", {}, ptrL);
      setOpacity(g, 0);
      el("polygon", {
        points: "-9,-16 9,-16 0,-2",
        fill: color, filter: `url(#${glowId})`,
      }, g);
      txt(label, {
        x: 0, y: dy, "font-size": 18, fill: color,
        "text-anchor": "middle",
      }, g);
      return g;
    };
    scene.leftPtr = mkPtr("left", C.blue, "glow-blue", -24);
    scene.rightPtr = mkPtr("right", C.gold, "glow-gold", -44);

    // -- counts row -------------------------------------------------------
    const uniq = sim.uniqueChars;
    const mapY = 362;
    scene.mapLabel = txt("window counts :", {
      x: 110, y: mapY, "font-size": 21, fill: C.grey,
      "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.mapLabel, 0);

    const badgeW = 98;
    const badgeGap = 14;
    const mapStartX = 290;
    uniq.forEach((ch, idx) => {
      const bx = mapStartX + idx * (badgeW + badgeGap);
      const g = el("g", {}, chipsL);
      setOpacity(g, 0);
      const rect = el("rect", {
        x: bx, y: mapY - 22, width: badgeW, height: 44, rx: 8,
        fill: "#111722", stroke: C.slate, "stroke-width": 1.8,
      }, g);
      const label = txt(`'${ch}': 0`, {
        x: bx + badgeW / 2, y: mapY, "font-size": 19, fill: C.grey,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);
      scene.freqBadges[ch] = { g, rect, label, ch };
    });

    // -- per-step equation & action text ----------------------------------
    sim.steps.forEach(st => {
      const eq = el("text", {
        x: STAGE_W / 2, y: 452, "font-size": 25, fill: C.white,
        "text-anchor": "middle",
      }, textL);
      el("tspan", { fill: C.gold }, eq).textContent = `add '${st.ch}' @ ${st.right}`;
      el("tspan", { fill: C.grey }, eq).textContent =
        `  →  len(${st.lenBefore}) − max_freq(${st.maxFreq}) = `;
      el("tspan", { fill: st.exceeded ? C.red : C.green }, eq).textContent =
        `${st.replBefore} replacements`;
      el("tspan", { fill: C.grey }, eq).textContent =
        st.exceeded ? ` > k (${k})` : ` ≤ k (${k})`;
      scene.eqs.push(eq);

      const act = txt(st.actionText, {
        x: STAGE_W / 2, y: 498, "font-size": 22,
        fill: st.exceeded ? C.blue : C.green,
        "text-anchor": "middle",
      }, textL);
      scene.actions.push(act);
    });

    // -- final banner -----------------------------------------------------
    const bY = 595;
    scene.bannerBox = el("rect", {
      x: 240, y: bY - 36, width: 800, height: 70, rx: 12,
      fill: "#13261B", stroke: C.green, "stroke-width": 2.5,
      filter: "url(#glow-green)",
    }, resultL);
    setOpacity(scene.bannerBox, 0);

    scene.bannerText = txt(
      `return ${sim.best}   (longest replaceable window "${sim.bestSub}" of length ${sim.best})`,
      {
        x: STAGE_W / 2, y: bY, "font-size": 26, fill: C.green,
        "text-anchor": "middle", "dominant-baseline": "central",
      },
      resultL
    );

    scene.complexity = txt(
      "Window only grows or slides by 1 · O(n) time · O(Σ) space",
      { x: STAGE_W / 2, y: 668, "font-size": 20, fill: C.grey, "text-anchor": "middle" },
      resultL
    );

    // -- reset ------------------------------------------------------------
    scene.reset = () => {
      setOpacity(scene.title, 0);
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.scoreBadge, 0);
      scene.maxFreqVal.textContent = "0";
      scene.bestVal.textContent = "0";
      setOpacity(scene.winBox, 0);
      setOpacity(scene.leftPtr, 0);
      setOpacity(scene.rightPtr, 0);
      setOpacity(scene.mapLabel, 0);
      setOpacity(scene.bannerBox, 0);
      if (scene.cells[0]) {
        setTranslate(scene.leftPtr, scene.cells[0].cx, rowY - cellH / 2 - 10);
        setTranslate(scene.rightPtr, scene.cells[0].cx, rowY - cellH / 2 - 10);
      }
      for (const c of scene.cells) {
        setOpacity(c.g, 0);
        c.box.setAttribute("fill", C.cellBg);
        c.box.setAttribute("stroke", C.cellStroke);
      }
      for (const ch of Object.keys(scene.freqBadges)) {
        const b = scene.freqBadges[ch];
        setOpacity(b.g, 0);
        b.rect.setAttribute("stroke", C.slate);
        b.label.setAttribute("fill", C.grey);
        b.label.textContent = `'${ch}': 0`;
      }
      for (const w of scene._writers) w.reset();
    };

    return scene;
  },

  buildTimeline(scene, tl) {
    const { ctx, sim } = scene;
    const { C, ease, clamp, setOpacity, setTranslate } = ctx;
    const easeOut = ease.outCubic;
    const easeInOut = ease.inOutSine;
    const lerp = (a, b, t) => a + (b - a) * t;
    const ptrY = 235 - 34 - 10;

    const wTitle = scene.writer(scene.title);
    const wEqs = scene.eqs.map(scene.writer);
    const wActs = scene.actions.map(scene.writer);
    const wBanner = scene.writer(scene.bannerText);
    const wComplex = scene.writer(scene.complexity);

    scene.reset();

    const applyCounts = counts => {
      for (const ch of Object.keys(scene.freqBadges)) {
        const b = scene.freqBadges[ch];
        const v = counts[ch] || 0;
        b.label.textContent = `'${ch}': ${v}`;
        b.rect.setAttribute("stroke", v > 0 ? C.gold : C.slate);
        b.label.setAttribute("fill", v > 0 ? C.white : C.grey);
      }
    };

    const styleWindow = (l, r, isRed) => {
      scene.winBox.setAttribute("stroke", isRed ? C.red : C.green);
      scene.winBox.setAttribute("fill", isRed ? C.red : C.green);
      scene.cells.forEach((c, idx) => {
        if (idx >= l && idx <= r) {
          c.box.setAttribute("stroke", isRed ? C.red : C.green);
          c.box.setAttribute("fill", isRed ? "#2C1418" : "#15281E");
        } else {
          c.box.setAttribute("stroke", C.cellStroke);
          c.box.setAttribute("fill", C.cellBg);
        }
      });
    };

    // 1. Title + subtitle + array + counts
    tl.line(1);
    tl.add(0.75, wTitle);
    tl.add(0.45, u => setOpacity(scene.subtitle, easeOut(u)));
    tl.line([2, 3, 4, 5]);
    tl.add(0.65, u => {
      setOpacity(scene.scoreBadge, easeOut(u));
      setOpacity(scene.mapLabel, easeOut(u));
      scene.cells.forEach((c, i) => {
        const start = i * 0.05;
        const p = clamp((u - start) / Math.max(0.25, 1 - start), 0, 1);
        setOpacity(c.g, easeOut(p));
      });
      Object.values(scene.freqBadges).forEach(b => setOpacity(b.g, easeOut(u)));
    });
    tl.wait(0.2);

    let prevEq = null;
    let prevAct = null;

    sim.steps.forEach((st, idx) => {
      const cRight = scene.cells[st.right];
      const prevRight = idx === 0 ? scene.cells[0] : scene.cells[sim.steps[idx - 1].right];
      const cLeftBefore = scene.cells[st.leftBefore];
      const cLeftAfter = scene.cells[st.leftAfter];
      const fadingEq = prevEq;
      const fadingAct = prevAct;

      // Expand right pointer
      tl.line(6);
      tl.add(0.45, u => {
        const e = easeInOut(u);
        if (fadingEq) setOpacity(fadingEq, 1 - e);
        if (fadingAct) setOpacity(fadingAct, 1 - e);
        setTranslate(scene.leftPtr, cLeftBefore.cx, ptrY);
        setTranslate(scene.rightPtr, lerp(prevRight.cx, cRight.cx, e), ptrY);
        setOpacity(scene.leftPtr, 1);
        setOpacity(scene.rightPtr, 1);
        const wLeft = cLeftBefore.x - 6;
        const wRight = lerp(prevRight.x + prevRight.w, cRight.x + cRight.w, e) + 6;
        scene.winBox.setAttribute("x", wLeft);
        scene.winBox.setAttribute("width", Math.max(16, wRight - wLeft));
        setOpacity(scene.winBox, 1);
        if (u > 0.5) {
          applyCounts(st.countsBefore);
          scene.maxFreqVal.textContent = String(st.maxFreq);
          styleWindow(st.leftBefore, st.right, st.exceeded);
        }
      });

      // Reveal replacement check equation
      tl.line([7, 8, 9]);
      tl.add(0.55, wEqs[idx]);

      // Reveal action + slide left if exceeded
      tl.line(st.exceeded ? [10, 11] : 12);
      tl.add(0.5, wActs[idx]);
      tl.line(12);
      tl.add(0.35, u => {
        const e = easeInOut(u);
        if (st.exceeded) {
          setTranslate(scene.leftPtr, lerp(cLeftBefore.cx, cLeftAfter.cx, e), ptrY);
          const wLeft = lerp(cLeftBefore.x, cLeftAfter.x, e) - 6;
          const wRight = cRight.x + cRight.w + 6;
          scene.winBox.setAttribute("x", wLeft);
          scene.winBox.setAttribute("width", Math.max(16, wRight - wLeft));
        }
        if (u > 0.5) {
          applyCounts(st.countsAfter);
          styleWindow(st.leftAfter, st.right, false);
          scene.bestVal.textContent = String(st.bestAfter);
        }
      });

      prevEq = scene.eqs[idx];
      prevAct = scene.actions[idx];
    });

    // Clear last step equations & highlight final best window
    const lastEq = prevEq;
    const lastAct = prevAct;
    tl.line(13);
    tl.add(0.45, u => {
      const e = easeOut(u);
      if (lastEq) setOpacity(lastEq, 1 - e);
      if (lastAct) setOpacity(lastAct, 1 - e);
      if (u > 0.5) {
        const cL = scene.cells[sim.bestL];
        const cR = scene.cells[sim.bestR];
        scene.winBox.setAttribute("x", cL.x - 6);
        scene.winBox.setAttribute("width", cR.x + cR.w - cL.x + 12);
        styleWindow(sim.bestL, sim.bestR, false);
      }
    });

    tl.add(0.3, u => setOpacity(scene.bannerBox, easeOut(u)));
    tl.add(0.55, wBanner);
    tl.add(0.65, wComplex);
    tl.wait(0.6);
  },
};

function simulate(s, k) {
  const counts = {};
  const uniqueChars = [];
  for (const ch of s) {
    if (!uniqueChars.includes(ch)) uniqueChars.push(ch);
  }

  let left = 0;
  let maxFreq = 0;
  let best = 0;
  let bestL = 0;
  let bestR = 0;
  const steps = [];

  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    const leftBefore = left;
    counts[ch] = (counts[ch] || 0) + 1;
    if (counts[ch] > maxFreq) maxFreq = counts[ch];

    const countsBefore = { ...counts };
    const lenBefore = right - left + 1;
    const replBefore = lenBefore - maxFreq;
    const exceeded = replBefore > k;

    if (exceeded) {
      const dropCh = s[left];
      counts[dropCh] -= 1;
      left += 1;
    }

    const countsAfter = { ...counts };
    const lenAfter = right - left + 1;
    if (lenAfter > best) {
      best = lenAfter;
      bestL = left;
      bestR = right;
    }

    const actionText = exceeded
      ? `drop s[${leftBefore}]='${s[leftBefore]}' & advance left → ${left} · window size stays ${lenAfter}`
      : `valid window [${left}..${right}] ("${s.slice(left, right + 1)}") → best = ${best}`;

    steps.push({
      right,
      ch,
      leftBefore,
      leftAfter: left,
      maxFreq,
      lenBefore,
      replBefore,
      exceeded,
      countsBefore,
      countsAfter,
      bestAfter: best,
      actionText,
    });
  }

  return {
    steps,
    uniqueChars,
    best,
    bestL,
    bestR,
    bestSub: s.slice(bestL, bestR + 1),
  };
}
