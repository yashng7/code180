/* Longest Substring Without Repeating Characters — animated walkthrough scene.
 *
 * Render `s` as a row of character cells framed by a sliding window [left..right].
 * Below the array, display a live `last_seen` dictionary of character -> index
 * badges. Whenever `s[right]` already lies inside `[left..right]`, flash the
 * earlier occurrence in red and jump `left` directly past it (`last_seen[ch] + 1`).
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Longest Substring Without Repeating Characters",
    subtitle: "sliding window + last_seen map · O(n) time · O(min(n, Σ)) space",
    inputs: [
      { id: "s", label: "s", type: "text", default: "abcabcbb", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "left boundary" },
      { color: "#F0AC5F", text: "right cursor" },
      { color: "#83C167", text: "active unique window" },
      { color: "#FC6255", text: "duplicate collision" },
    ],
  },

  code: [
    "def length_of_longest_substring(s: str) -> int:",
    "    last: Dict[str, int] = {}",
    "    left = 0",
    "    best = 0",
    "    for right, ch in enumerate(s):",
    "        if ch in last and last[ch] >= left:",
    "            left = last[ch] + 1",
    "        last[ch] = right",
    "        best = max(best, right - left + 1)",
    "    return best",
  ],

  read(values) {
    const s = (values.s || "").trim();
    if (s.length < 1 || s.length > 14) return null;
    return { s };
  },

  fromArgs(args) {
    if (Array.isArray(args) && typeof args[0] === "string") {
      const s = args[0];
      if (s.length >= 1 && s.length <= 14) return { s };
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const s = params.s;
    const n = s.length;
    const sim = simulate(s);

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
      s, sim, ctx,
      cells: [], mapBadges: {}, eqs: [], actions: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title + subtitle -------------------------------------------------
    scene.title = txt("Longest Substring Without Repeating Characters", {
      x: 64, y: 72, "font-size": 38, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    const sub = el("text", { x: 64, y: 110, "font-size": 22, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = 's = "';
    el("tspan", { fill: C.white }, sub).textContent = s;
    el("tspan", {}, sub).textContent = '"';
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- best length badge (top-right) ------------------------------------
    const bestG = el("g", {}, textL);
    setOpacity(bestG, 0);
    el("rect", {
      x: 940, y: 52, width: 280, height: 64, rx: 10,
      fill: "#111722", stroke: C.green, "stroke-width": 2,
    }, bestG);
    txt("best_len =", {
      x: 962, y: 84, "font-size": 22, fill: C.grey,
      "dominant-baseline": "central",
    }, bestG);
    scene.bestVal = txt("0", {
      x: 1196, y: 84, "font-size": 28, fill: C.green,
      "text-anchor": "end", "dominant-baseline": "central",
    }, bestG);
    scene.bestBadge = bestG;

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

      const chTxt = txt(s[i] === " " ? "␣" : s[i], {
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

    // -- last_seen dictionary row -----------------------------------------
    const uniq = sim.uniqueChars;
    const mapY = 362;
    scene.mapLabel = txt("last_seen :", {
      x: 110, y: mapY, "font-size": 21, fill: C.grey,
      "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.mapLabel, 0);

    const badgeW = 92;
    const badgeGap = 12;
    const mapStartX = 245;
    uniq.forEach((ch, idx) => {
      const bx = mapStartX + idx * (badgeW + badgeGap);
      const g = el("g", {}, chipsL);
      setOpacity(g, 0);
      const rect = el("rect", {
        x: bx, y: mapY - 22, width: badgeW, height: 44, rx: 8,
        fill: "#111722", stroke: C.slate, "stroke-width": 1.8,
      }, g);
      const label = txt(`'${ch === " " ? "␣" : ch}': -`, {
        x: bx + badgeW / 2, y: mapY, "font-size": 18, fill: C.grey,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);
      scene.mapBadges[ch] = { g, rect, label, ch };
    });

    // -- per-step equations + action notes --------------------------------
    sim.steps.forEach(st => {
      const dispCh = st.ch === " " ? "␣" : st.ch;
      const eq = el("text", {
        x: STAGE_W / 2, y: 452, "font-size": 26, fill: C.white,
        "text-anchor": "middle",
      }, textL);
      el("tspan", { fill: C.gold }, eq).textContent = `right = ${st.right} ('${dispCh}')`;
      if (st.collision) {
        el("tspan", { fill: C.red }, eq).textContent =
          `   →   seen at ${st.prevIdx} ≥ left (${st.leftBefore}) : jump left → ${st.leftAfter}`;
      } else {
        el("tspan", { fill: C.grey }, eq).textContent =
          `   →   window [${st.leftAfter}..${st.right}] = "${st.winStr}" (len ${st.winLen})`;
      }
      scene.eqs.push(eq);

      const act = txt(st.actionText, {
        x: STAGE_W / 2, y: 498, "font-size": 22,
        fill: st.isNewBest ? C.green : (st.collision ? C.blue : C.grey),
        "text-anchor": "middle",
      }, textL);
      scene.actions.push(act);
    });

    // -- final banner -----------------------------------------------------
    const bY = 595;
    scene.bannerBox = el("rect", {
      x: 250, y: bY - 36, width: 780, height: 70, rx: 12,
      fill: "#13261B", stroke: C.green, "stroke-width": 2.5,
      filter: "url(#glow-green)",
    }, resultL);
    setOpacity(scene.bannerBox, 0);

    scene.bannerText = txt(
      `return ${sim.bestLen}   (longest unique substring "${sim.bestSub}" at [${sim.bestL}..${sim.bestR}])`,
      {
        x: STAGE_W / 2, y: bY, "font-size": 27, fill: C.green,
        "text-anchor": "middle", "dominant-baseline": "central",
      },
      resultL
    );

    scene.complexity = txt(
      "Each index visited at most twice · O(n) time · O(min(n, Σ)) space",
      { x: STAGE_W / 2, y: 668, "font-size": 20, fill: C.grey, "text-anchor": "middle" },
      resultL
    );

    // -- reset ------------------------------------------------------------
    scene.reset = () => {
      setOpacity(scene.title, 0);
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.bestBadge, 0);
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
      for (const k of Object.keys(scene.mapBadges)) {
        const b = scene.mapBadges[k];
        setOpacity(b.g, 0);
        b.rect.setAttribute("stroke", C.slate);
        b.label.setAttribute("fill", C.grey);
        b.label.textContent = `'${b.ch === " " ? "␣" : b.ch}': -`;
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

    const styleWindow = (l, r, collideIdx = -1) => {
      scene.cells.forEach((c, idx) => {
        if (idx === collideIdx) {
          c.box.setAttribute("stroke", C.red);
          c.box.setAttribute("fill", "#2C1418");
        } else if (idx >= l && idx <= r) {
          c.box.setAttribute("stroke", C.green);
          c.box.setAttribute("fill", "#15281E");
        } else {
          c.box.setAttribute("stroke", C.cellStroke);
          c.box.setAttribute("fill", C.cellBg);
        }
      });
    };

    // 1. Title + cells + dictionary badges
    tl.line(1);
    tl.add(0.75, wTitle);
    tl.add(0.45, u => setOpacity(scene.subtitle, easeOut(u)));
    tl.line([2, 3, 4]);
    tl.add(0.65, u => {
      setOpacity(scene.bestBadge, easeOut(u));
      setOpacity(scene.mapLabel, easeOut(u));
      scene.cells.forEach((c, i) => {
        const start = i * 0.05;
        const p = clamp((u - start) / Math.max(0.25, 1 - start), 0, 1);
        setOpacity(c.g, easeOut(p));
      });
      Object.values(scene.mapBadges).forEach(b => setOpacity(b.g, easeOut(u)));
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

      // Move right pointer & expand window to right
      tl.line(5);
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
          styleWindow(st.leftBefore, st.right, st.collision ? st.prevIdx : -1);
        }
      });

      // Write primary observation / collision notice
      tl.line(6);
      tl.add(0.55, wEqs[idx]);

      // Slide left pointer if collision, update last_seen badge & best_len
      tl.line(st.collision ? 7 : [8, 9]);
      tl.add(0.5, wActs[idx]);
      tl.line([8, 9]);
      tl.add(0.35, u => {
        const e = easeInOut(u);
        if (st.collision) {
          setTranslate(scene.leftPtr, lerp(cLeftBefore.cx, cLeftAfter.cx, e), ptrY);
          const wLeft = lerp(cLeftBefore.x, cLeftAfter.x, e) - 6;
          const wRight = cRight.x + cRight.w + 6;
          scene.winBox.setAttribute("x", wLeft);
          scene.winBox.setAttribute("width", Math.max(16, wRight - wLeft));
        }
        if (u > 0.5) {
          styleWindow(st.leftAfter, st.right, -1);
          const badge = scene.mapBadges[st.ch];
          if (badge) {
            badge.rect.setAttribute("stroke", C.gold);
            badge.label.setAttribute("fill", C.white);
            badge.label.textContent = `'${st.ch === " " ? "␣" : st.ch}': ${st.right}`;
          }
          if (st.isNewBest) {
            scene.bestVal.textContent = String(st.bestAfter);
          }
        }
      });

      prevEq = scene.eqs[idx];
      prevAct = scene.actions[idx];
    });

    // Highlight winning substring & clear last step text
    const lastEq = prevEq;
    const lastAct = prevAct;
    tl.line(10);
    tl.add(0.45, u => {
      const e = easeOut(u);
      if (lastEq) setOpacity(lastEq, 1 - e);
      if (lastAct) setOpacity(lastAct, 1 - e);
      if (u > 0.5 && scene.cells.length > 0) {
        const cL = scene.cells[sim.bestL];
        const cR = scene.cells[sim.bestR];
        scene.winBox.setAttribute("x", cL.x - 6);
        scene.winBox.setAttribute("width", cR.x + cR.w - cL.x + 12);
        styleWindow(sim.bestL, sim.bestR, -1);
      }
    });

    tl.add(0.3, u => setOpacity(scene.bannerBox, easeOut(u)));
    tl.add(0.55, wBanner);
    tl.add(0.65, wComplex);
    tl.wait(0.6);
  },
};

function simulate(s) {
  const lastSeen = {};
  const uniqueChars = [];
  for (const ch of s) {
    if (!uniqueChars.includes(ch)) uniqueChars.push(ch);
  }

  let left = 0;
  let bestLen = 0;
  let bestL = 0;
  let bestR = 0;
  const steps = [];

  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    const leftBefore = left;
    const prevIdx = Object.prototype.hasOwnProperty.call(lastSeen, ch) ? lastSeen[ch] : -1;
    const collision = prevIdx >= left;

    if (collision) {
      left = prevIdx + 1;
    }
    lastSeen[ch] = right;

    const winLen = right - left + 1;
    const winStr = s.slice(left, right + 1);
    let isNewBest = false;
    if (winLen > bestLen) {
      bestLen = winLen;
      bestL = left;
      bestR = right;
      isNewBest = true;
    }

    let actionText = "";
    if (collision) {
      actionText = `shrunk window to [${left}..${right}] ("${winStr}", len ${winLen}) · update last_seen['${ch}'] = ${right}`;
    } else if (isNewBest) {
      actionText = `new longest unique window! best_len = ${bestLen} ("${winStr}")`;
    } else {
      actionText = `len ${winLen} ≤ best_len (${bestLen}) · record last_seen['${ch}'] = ${right}`;
    }

    steps.push({
      right,
      ch,
      leftBefore,
      leftAfter: left,
      prevIdx,
      collision,
      winLen,
      winStr,
      isNewBest,
      bestAfter: bestLen,
      actionText,
    });
  }

  return {
    steps,
    uniqueChars,
    bestLen,
    bestL,
    bestR,
    bestSub: s.slice(bestL, bestR + 1),
  };
}
