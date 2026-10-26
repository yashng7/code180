/* Minimum Window Substring — animated walkthrough scene (3Blue1Brown style).
 *
 * Expand `right` across `s` until every unique character in `t` meets its
 * required count (`formed == required`). Then contract `left` as far as
 * possible while keeping the window valid, locking in the shortest valid
 * substring seen so far.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Minimum Window Substring",
    subtitle: "expand right to satisfy · shrink left to minimize · O(|s| + |t|) time",
    inputs: [
      { id: "s", label: "s", type: "text", default: "ADOBECODEBANC", width: "wide" },
      { id: "t", label: "t", type: "text", default: "ABC", width: "narrow" },
    ],
    legend: [
      { color: "#58C4DD", text: "left boundary (shrink)" },
      { color: "#F0AC5F", text: "right boundary (expand)" },
      { color: "#83C167", text: "valid window (formed == req)" },
      { color: "#5CD0B3", text: "best minimum window" },
    ],
  },

  code: [
    "def min_window(s: str, t: str) -> str:",
    "    if not t or not s or len(t) > len(s):",
    "        return \"\"",
    "    need: Dict[str, int] = {}",
    "    for ch in t:",
    "        need[ch] = need.get(ch, 0) + 1",
    "    required = len(need)",
    "    window: Dict[str, int] = {}",
    "    formed = 0",
    "    left = 0",
    "    best: tuple[int, int] | None = None",
    "    for right, ch in enumerate(s):",
    "        window[ch] = window.get(ch, 0) + 1",
    "        if ch in need and window[ch] == need[ch]:",
    "            formed += 1",
    "        while formed == required:",
    "            if best is None or right - left + 1 < best[1]:",
    "                best = (left, right - left + 1)",
    "            outgoing = s[left]",
    "            window[outgoing] -= 1",
    "            if outgoing in need and window[outgoing] < need[outgoing]:",
    "                formed -= 1",
    "            left += 1",
    "    if best is None:",
    "        return \"\"",
    "    start, length = best",
    "    return s[start:start + length]",
  ],

  read(values) {
    const s = (values.s || "").trim();
    const t = (values.t || "").trim();
    if (!s || !t || s.length > 15 || t.length > 10) return null;
    return { s, t };
  },

  fromArgs(args) {
    if (Array.isArray(args) && typeof args[0] === "string" && typeof args[1] === "string") {
      const s = args[0];
      const t = args[1];
      if (s.length >= 1 && s.length <= 15 && t.length >= 1 && t.length <= 10) {
        return { s, t };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const { s, t } = params;
    const n = s.length;
    const sim = simulate(s, t);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-teal", C.teal);
    ctx.glow("glow-red", C.red);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const arcsL = ctx.layer("arcs");
    const chipsL = ctx.layer("chips");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = {
      s, t, sim, ctx,
      cells: [], needBadges: {}, eqs: [], actions: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title + subtitle -------------------------------------------------
    scene.title = txt("Minimum Window Substring", {
      x: 64, y: 72, "font-size": 42, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    const sub = el("text", { x: 64, y: 110, "font-size": 22, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = 's = "';
    el("tspan", { fill: C.white }, sub).textContent = s;
    el("tspan", {}, sub).textContent = `",   t = "`;
    el("tspan", { fill: C.teal }, sub).textContent = t;
    el("tspan", {}, sub).textContent = '"';
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- top-right formed / required & best badge -------------------------
    const scoreG = el("g", {}, textL);
    setOpacity(scoreG, 0);
    el("rect", {
      x: 840, y: 50, width: 380, height: 66, rx: 10,
      fill: "#111722", stroke: C.teal, "stroke-width": 2,
    }, scoreG);
    txt("formed:", { x: 860, y: 83, "font-size": 20, fill: C.grey, "dominant-baseline": "central" }, scoreG);
    scene.formedVal = txt(`0/${sim.required}`, {
      x: 995, y: 83, "font-size": 23, fill: C.gold,
      "text-anchor": "end", "dominant-baseline": "central",
    }, scoreG);
    txt("best:", { x: 1025, y: 83, "font-size": 20, fill: C.grey, "dominant-baseline": "central" }, scoreG);
    scene.bestVal = txt("∞", {
      x: 1200, y: 83, "font-size": 23, fill: C.teal,
      "text-anchor": "end", "dominant-baseline": "central",
    }, scoreG);
    scene.scoreBadge = scoreG;

    // -- s character array ------------------------------------------------
    const rowY = 232;
    const cellW = clamp(Math.floor(990 / n) - 8, 48, 72);
    const cellH = 66;
    const pitch = cellW + 8;
    const totalW = n * pitch - 8;
    const startX = STAGE_W / 2 - totalW / 2;

    scene.bestOutline = el("rect", {
      x: startX - 10, y: rowY - cellH / 2 - 12,
      width: cellW + 20, height: cellH + 24, rx: 14,
      fill: "none", stroke: C.teal, "stroke-width": 2.5, "stroke-dasharray": "6 4",
    }, arcsL);
    setOpacity(scene.bestOutline, 0);

    scene.winBox = el("rect", {
      x: startX - 5, y: rowY - cellH / 2 - 7,
      width: cellW + 10, height: cellH + 14, rx: 10,
      fill: C.gold, "fill-opacity": 0.13,
      stroke: C.gold, "stroke-width": 2.5,
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
        x: cx, y: rowY, "font-size": 26, fill: C.white,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);

      const idxTxt = txt(String(i), {
        x: cx, y: rowY + cellH / 2 + 22, "font-size": 15, fill: C.grey,
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

    // -- need vs window badges for unique chars in t ----------------------
    const uniqT = Object.keys(sim.need);
    const mapY = 360;
    scene.mapLabel = txt("t counts (win/need) :", {
      x: 110, y: mapY, "font-size": 20, fill: C.grey,
      "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.mapLabel, 0);

    const badgeW = 108;
    const badgeGap = 14;
    const mapStartX = 330;
    uniqT.forEach((ch, idx) => {
      const bx = mapStartX + idx * (badgeW + badgeGap);
      const g = el("g", {}, chipsL);
      setOpacity(g, 0);
      const rect = el("rect", {
        x: bx, y: mapY - 22, width: badgeW, height: 44, rx: 8,
        fill: "#111722", stroke: C.slate, "stroke-width": 1.8,
      }, g);
      const needCount = sim.need[ch];
      const label = txt(`'${ch}': 0/${needCount}`, {
        x: bx + badgeW / 2, y: mapY, "font-size": 19, fill: C.grey,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);
      scene.needBadges[ch] = { g, rect, label, ch, needCount };
    });

    // -- step equations & actions -----------------------------------------
    sim.steps.forEach(st => {
      const eq = el("text", {
        x: STAGE_W / 2, y: 452, "font-size": 25, fill: C.white,
        "text-anchor": "middle",
      }, textL);
      if (st.phase === "expand") {
        el("tspan", { fill: C.gold }, eq).textContent = `expand right → ${st.r} ('${st.ch}')`;
        el("tspan", { fill: C.grey }, eq).textContent = `   ·   window [${st.l}..${st.r}] = "${st.winStr}"   ·   formed = `;
        el("tspan", { fill: st.valid ? C.green : C.white }, eq).textContent = `${st.formed}/${sim.required}`;
      } else {
        el("tspan", { fill: C.blue }, eq).textContent = `shrink left → ${st.l} (drop '${st.ch}')`;
        el("tspan", { fill: C.grey }, eq).textContent = `   ·   window [${st.l}..${st.r}] (len ${st.r - st.l + 1})   ·   formed = `;
        el("tspan", { fill: st.valid ? C.green : C.red }, eq).textContent = `${st.formed}/${sim.required}`;
      }
      scene.eqs.push(eq);

      const act = txt(st.actionText, {
        x: STAGE_W / 2, y: 498, "font-size": 22,
        fill: st.isNewBest ? C.teal : (st.valid ? C.green : C.grey),
        "text-anchor": "middle",
      }, textL);
      scene.actions.push(act);
    });

    // -- final banner -----------------------------------------------------
    const bY = 595;
    const found = sim.bestLen < Infinity;
    scene.bannerBox = el("rect", {
      x: 240, y: bY - 36, width: 800, height: 70, rx: 12,
      fill: found ? "#13261B" : "#2A1417",
      stroke: found ? C.green : C.red, "stroke-width": 2.5,
      filter: found ? "url(#glow-green)" : "url(#glow-red)",
    }, resultL);
    setOpacity(scene.bannerBox, 0);

    const bannerMsg = found
      ? `return "${sim.bestSub}"   (min window [${sim.bestL}..${sim.bestR}], length ${sim.bestLen})`
      : `return ""   (no substring of s contains all characters of "${t}")`;
    scene.bannerText = txt(bannerMsg, {
      x: STAGE_W / 2, y: bY, "font-size": 26, fill: found ? C.green : C.red,
      "text-anchor": "middle", "dominant-baseline": "central",
    }, resultL);

    scene.complexity = txt(
      "left & right each advance at most |s| times · O(|s| + |t|) time · O(|Σ|) space",
      { x: STAGE_W / 2, y: 668, "font-size": 20, fill: C.grey, "text-anchor": "middle" },
      resultL
    );

    // -- reset ------------------------------------------------------------
    scene.reset = () => {
      setOpacity(scene.title, 0);
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.scoreBadge, 0);
      scene.formedVal.textContent = `0/${sim.required}`;
      scene.bestVal.textContent = "∞";
      setOpacity(scene.winBox, 0);
      setOpacity(scene.bestOutline, 0);
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
      for (const ch of Object.keys(scene.needBadges)) {
        const b = scene.needBadges[ch];
        setOpacity(b.g, 0);
        b.rect.setAttribute("stroke", C.slate);
        b.label.setAttribute("fill", C.grey);
        b.label.textContent = `'${ch}': 0/${b.needCount}`;
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
    const ptrY = 232 - 33 - 10;

    const wTitle = scene.writer(scene.title);
    const wEqs = scene.eqs.map(scene.writer);
    const wActs = scene.actions.map(scene.writer);
    const wBanner = scene.writer(scene.bannerText);
    const wComplex = scene.writer(scene.complexity);
    const guardReturn = scene.t.length > scene.s.length;

    scene.reset();

    const applyBadges = (winCounts, formed, valid) => {
      scene.formedVal.textContent = `${formed}/${sim.required}`;
      scene.formedVal.setAttribute("fill", valid ? C.green : C.gold);
      for (const ch of Object.keys(scene.needBadges)) {
        const b = scene.needBadges[ch];
        const have = winCounts[ch] || 0;
        b.label.textContent = `'${ch}': ${have}/${b.needCount}`;
        const met = have >= b.needCount;
        b.rect.setAttribute("stroke", met ? C.green : (have > 0 ? C.gold : C.slate));
        b.label.setAttribute("fill", met ? C.green : (have > 0 ? C.white : C.grey));
      }
    };

    const styleWindow = (l, r, valid) => {
      const col = valid ? C.green : C.gold;
      scene.winBox.setAttribute("stroke", col);
      scene.winBox.setAttribute("fill", col);
      scene.cells.forEach((c, idx) => {
        if (idx >= l && idx <= r) {
          c.box.setAttribute("stroke", col);
          c.box.setAttribute("fill", valid ? "#15281E" : "#262015");
        } else {
          c.box.setAttribute("stroke", C.cellStroke);
          c.box.setAttribute("fill", C.cellBg);
        }
      });
    };

    // 1. Title + subtitle + array + need badges
    tl.line(1);
    tl.add(0.75, wTitle);
    tl.add(0.45, u => setOpacity(scene.subtitle, easeOut(u)));
    tl.line(guardReturn ? [2, 3] : [2, 4, 5, 6, 7, 8, 9, 10, 11]);
    tl.add(0.65, u => {
      setOpacity(scene.scoreBadge, easeOut(u));
      setOpacity(scene.mapLabel, easeOut(u));
      scene.cells.forEach((c, i) => {
        const start = i * 0.04;
        const p = clamp((u - start) / Math.max(0.25, 1 - start), 0, 1);
        setOpacity(c.g, easeOut(p));
      });
      Object.values(scene.needBadges).forEach(b => setOpacity(b.g, easeOut(u)));
    });
    tl.wait(0.2);

    let prevEq = null;
    let prevAct = null;

    sim.steps.forEach((st, idx) => {
      const prevSt = idx === 0 ? { l: 0, r: 0 } : sim.steps[idx - 1];
      const cPrevL = scene.cells[Math.min(prevSt.l, scene.cells.length - 1)];
      const cPrevR = scene.cells[Math.min(prevSt.r, scene.cells.length - 1)];
      const cL = scene.cells[Math.min(st.l, scene.cells.length - 1)];
      const cR = scene.cells[Math.min(st.r, scene.cells.length - 1)];
      const fadingEq = prevEq;
      const fadingAct = prevAct;
      const formedIncreased = st.phase === "expand"
        && Object.prototype.hasOwnProperty.call(sim.need, st.ch)
        && st.winSnapshot[st.ch] === sim.need[st.ch];

      if (st.phase === "expand") {
        tl.line(12);
      } else {
        tl.line(st.valid ? [19, 20, 21, 23] : [19, 20, 21, 22, 23]);
      }
      tl.add(0.4, u => {
        const e = easeInOut(u);
        if (fadingEq) setOpacity(fadingEq, 1 - e);
        if (fadingAct) setOpacity(fadingAct, 1 - e);
        setTranslate(scene.leftPtr, lerp(cPrevL.cx, cL.cx, e), ptrY);
        setTranslate(scene.rightPtr, lerp(cPrevR.cx, cR.cx, e), ptrY);
        setOpacity(scene.leftPtr, 1);
        setOpacity(scene.rightPtr, 1);

        const wLeft = lerp(cPrevL.x, cL.x, e) - 5;
        const wRight = lerp(cPrevR.x + cPrevR.w, cR.x + cR.w, e) + 5;
        scene.winBox.setAttribute("x", wLeft);
        scene.winBox.setAttribute("width", Math.max(12, wRight - wLeft));
        setOpacity(scene.winBox, 1);

        if (u > 0.5) {
          styleWindow(st.l, st.r, st.valid);
          applyBadges(st.winSnapshot, st.formed, st.valid);
        }
      });

      if (st.phase === "expand") tl.line(formedIncreased ? [13, 14, 15] : [13, 14]);
      tl.add(0.5, wEqs[idx]);
      tl.line(st.valid ? [16, 17] : 16);
      tl.add(0.45, wActs[idx]);
      if (st.isNewBest) {
        tl.line(18);
        tl.add(0.3, u => {
          if (u > 0.3) {
            scene.bestVal.textContent = `"${st.bestSubAfter}" (${st.bestLenAfter})`;
            const bL = scene.cells[st.bestLAfter];
            const bR = scene.cells[st.bestRAfter];
            scene.bestOutline.setAttribute("x", bL.x - 10);
            scene.bestOutline.setAttribute("width", bR.x + bR.w - bL.x + 20);
            setOpacity(scene.bestOutline, 1);
          }
        });
      }

      prevEq = scene.eqs[idx];
      prevAct = scene.actions[idx];
    });

    const lastEq = prevEq;
    const lastAct = prevAct;
    tl.line(guardReturn ? 3 : (sim.bestLen < Infinity ? [24, 26, 27] : [24, 25]));
    tl.add(0.4, u => {
      const e = easeOut(u);
      if (lastEq) setOpacity(lastEq, 1 - e);
      if (lastAct) setOpacity(lastAct, 1 - e);
      if (u > 0.5 && sim.bestLen < Infinity) {
        const bL = scene.cells[sim.bestL];
        const bR = scene.cells[sim.bestR];
        scene.winBox.setAttribute("x", bL.x - 5);
        scene.winBox.setAttribute("width", bR.x + bR.w - bL.x + 10);
        styleWindow(sim.bestL, sim.bestR, true);
      }
    });

    tl.add(0.3, u => setOpacity(scene.bannerBox, easeOut(u)));
    tl.add(0.55, wBanner);
    tl.add(0.65, wComplex);
    tl.wait(0.6);
  },
};

function simulate(s, t) {
  const need = {};
  for (const ch of t) need[ch] = (need[ch] || 0) + 1;
  const required = Object.keys(need).length;
  const win = {};
  let formed = 0;

  let bestLen = Infinity;
  let bestL = 0;
  let bestR = -1;
  let left = 0;
  const steps = [];

  const snap = () => {
    const out = {};
    for (const k of Object.keys(need)) out[k] = win[k] || 0;
    return out;
  };

  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    win[ch] = (win[ch] || 0) + 1;
    if (need[ch] !== undefined && win[ch] === need[ch]) {
      formed += 1;
    }

    const validNow = formed === required;
    let isNewBest = false;
    if (validNow && right - left + 1 < bestLen) {
      bestLen = right - left + 1;
      bestL = left;
      bestR = right;
      isNewBest = true;
    }

    steps.push({
      phase: "expand",
      l: left,
      r: right,
      ch,
      winStr: s.slice(left, right + 1),
      winSnapshot: snap(),
      formed,
      valid: validNow,
      isNewBest,
      bestLenAfter: bestLen,
      bestLAfter: bestL,
      bestRAfter: bestR,
      bestSubAfter: bestLen < Infinity ? s.slice(bestL, bestR + 1) : "",
      actionText: validNow
        ? (isNewBest
            ? `all ${required} target chars satisfied! New shortest window "${s.slice(bestL, bestR + 1)}" (len ${bestLen})`
            : `window valid (len ${right - left + 1}) → now shrink left to minimize`)
        : `need ${required - formed} more character group(s) → keep expanding right`,
    });

    while (left <= right && formed === required) {
      const leftCh = s[left];
      win[leftCh] -= 1;
      if (need[leftCh] !== undefined && win[leftCh] < need[leftCh]) {
        formed -= 1;
      }
      left += 1;

      const stillValid = formed === required && left <= right;
      let shrinkBest = false;
      if (stillValid && right - left + 1 < bestLen) {
        bestLen = right - left + 1;
        bestL = left;
        bestR = right;
        shrinkBest = true;
      }

      if (left <= right) {
        steps.push({
          phase: "shrink",
          l: left,
          r: right,
          ch: leftCh,
          winStr: s.slice(left, right + 1),
          winSnapshot: snap(),
          formed,
          valid: stillValid,
          isNewBest: shrinkBest,
          bestLenAfter: bestLen,
          bestLAfter: bestL,
          bestRAfter: bestR,
          bestSubAfter: bestLen < Infinity ? s.slice(bestL, bestR + 1) : "",
          actionText: stillValid
            ? (shrinkBest
                ? `still valid after dropping '${leftCh}'! New shortest window "${s.slice(bestL, bestR + 1)}" (len ${bestLen})`
                : `still valid (len ${right - left + 1}) → continue shrinking left`)
            : `dropped required '${leftCh}' → window no longer valid, resume expanding right`,
        });
      }
    }
  }

  return {
    steps,
    need,
    required,
    bestLen,
    bestL,
    bestR,
    bestSub: bestLen < Infinity ? s.slice(bestL, bestR + 1) : "",
  };
}
