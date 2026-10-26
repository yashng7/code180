/* Permutation in String — animated walkthrough scene (3Blue1Brown style).
 *
 * Slide a fixed-width window of length `len(s1)` across `s2`. Maintain live
 * character counts for the active window alongside the target `s1` counts and
 * the `matches / 26` counter. As soon as all 26 character frequencies align,
 * the window is a permutation of `s1`.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Permutation in String",
    subtitle: "fixed-size sliding window · 26-bucket match count · O(n) time · O(1) space",
    inputs: [
      { id: "s1", label: "s1 (pattern)", type: "text", default: "ab", width: "narrow" },
      { id: "s2", label: "s2 (text)", type: "text", default: "eidbaooo", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "target s1 counts" },
      { color: "#F0AC5F", text: "sliding window of size |s1|" },
      { color: "#83C167", text: "frequency matched" },
      { color: "#FC6255", text: "frequency mismatch" },
    ],
  },

  code: [
    "def check_inclusion(s1: str, s2: str) -> bool:",
    "    if len(s1) > len(s2):",
    "        return False",
    "    if not s1:",
    "        return True",
    "    need = [0] * 26",
    "    window = [0] * 26",
    "    for ch in s1:",
    "        need[ord(ch) - ord(\"a\")] += 1",
    "    size = len(s1)",
    "    for right, ch in enumerate(s2):",
    "        window[ord(ch) - ord(\"a\")] += 1",
    "        if right >= size:",
    "            window[ord(s2[right - size]) - ord(\"a\")] -= 1",
    "        if window == need:",
    "            return True",
    "    return False",
  ],

  read(values) {
    const s1 = (values.s1 || "").trim().toLowerCase();
    const s2 = (values.s2 || "").trim().toLowerCase();
    if (!s1 || !s2 || s1.length > 10 || s2.length > 14) return null;
    if (!/^[a-z]+$/.test(s1) || !/^[a-z]+$/.test(s2)) return null;
    return { s1, s2 };
  },

  fromArgs(args) {
    if (Array.isArray(args) && typeof args[0] === "string" && typeof args[1] === "string") {
      const s1 = args[0].toLowerCase();
      const s2 = args[1].toLowerCase();
      if (s1.length >= 1 && s1.length <= 10 && s2.length >= 1 && s2.length <= 14) {
        return { s1, s2 };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, STAGE_W } = ctx;
    const { s1, s2 } = params;
    const sim = simulate(s1, s2);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-red", C.red);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const arcsL = ctx.layer("arcs");
    const chipsL = ctx.layer("chips");
    const resultL = ctx.layer("result");

    const scene = {
      s1, s2, sim, ctx,
      cells: [], buckets: {}, eqs: [], actions: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title + subtitle -------------------------------------------------
    scene.title = txt("Permutation in String", {
      x: 64, y: 72, "font-size": 42, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    const sub = el("text", { x: 64, y: 110, "font-size": 22, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = 's1 = "';
    el("tspan", { fill: C.blue }, sub).textContent = s1;
    el("tspan", {}, sub).textContent = `" (len ${s1.length}),   s2 = "`;
    el("tspan", { fill: C.white }, sub).textContent = s2;
    el("tspan", {}, sub).textContent = '"';
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- top-right matches / 26 badge -------------------------------------
    const matchG = el("g", {}, textL);
    setOpacity(matchG, 0);
    scene.matchRect = el("rect", {
      x: 920, y: 50, width: 300, height: 66, rx: 10,
      fill: "#111722", stroke: C.gold, "stroke-width": 2,
    }, matchG);
    txt("matches :", {
      x: 942, y: 83, "font-size": 22, fill: C.grey, "dominant-baseline": "central",
    }, matchG);
    scene.matchVal = txt("0 / 26", {
      x: 1196, y: 83, "font-size": 26, fill: C.gold,
      "text-anchor": "end", "dominant-baseline": "central",
    }, matchG);
    scene.matchBadge = matchG;

    // -- s2 array row -----------------------------------------------------
    const n = s2.length;
    const rowY = 225;
    const cellW = clamp(Math.floor(960 / n) - 8, 52, 74);
    const cellH = 68;
    const pitch = cellW + 8;
    const totalW = n * pitch - 8;
    const startX = STAGE_W / 2 - totalW / 2;

    const winSpanW = Math.min(s1.length, n) * pitch - 8;
    scene.winBox = el("rect", {
      x: startX - 6, y: rowY - cellH / 2 - 8,
      width: winSpanW + 12, height: cellH + 16, rx: 12,
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

      const chTxt = txt(s2[i], {
        x: cx, y: rowY, "font-size": 28, fill: C.white,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);

      const idxTxt = txt(String(i), {
        x: cx, y: rowY + cellH / 2 + 22, "font-size": 16, fill: C.grey,
        "text-anchor": "middle",
      }, g);

      scene.cells.push({ g, box, chTxt, idxTxt, x, cx, w: cellW, ch: s2[i] });
    }

    // -- frequency comparison row (win / s1) ------------------------------
    const uniq = sim.displayChars;
    const mapY = 358;
    scene.mapLabel = txt("win / s1 :", {
      x: 92, y: mapY, "font-size": 21, fill: C.grey,
      "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.mapLabel, 0);

    const badgeW = clamp(Math.floor(940 / Math.max(1, uniq.length)) - 10, 84, 114);
    const badgeGap = 10;
    const mapStartX = 215;
    uniq.forEach((ch, idx) => {
      const bx = mapStartX + idx * (badgeW + badgeGap);
      const g = el("g", {}, chipsL);
      setOpacity(g, 0);
      const rect = el("rect", {
        x: bx, y: mapY - 24, width: badgeW, height: 48, rx: 8,
        fill: "#111722", stroke: C.slate, "stroke-width": 1.8,
      }, g);
      const need = sim.s1Map[ch] || 0;
      const label = txt(`'${ch}': 0/${need}`, {
        x: bx + badgeW / 2, y: mapY, "font-size": 18, fill: C.grey,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);
      scene.buckets[ch] = { g, rect, label, ch, need };
    });

    // -- per-step equation + action notes ---------------------------------
    sim.steps.forEach(st => {
      const eq = el("text", {
        x: STAGE_W / 2, y: 452, "font-size": 26, fill: C.white,
        "text-anchor": "middle",
      }, textL);
      if (st.kind === "short") {
        el("tspan", { fill: C.red }, eq).textContent =
          `|s1| (${s1.length}) > |s2| (${s2.length})  →  no window of length ${s1.length} fits`;
      } else if (st.kind === "init") {
        el("tspan", { fill: C.gold }, eq).textContent = `initial window [0..${st.r}] = "${st.winStr}"`;
        el("tspan", { fill: C.grey }, eq).textContent = `   →   matches = `;
        el("tspan", { fill: st.matched ? C.green : C.white }, eq).textContent = `${st.matches} / 26`;
      } else {
        el("tspan", { fill: C.red }, eq).textContent = `−'${st.leaveCh}'@${st.l - 1}`;
        el("tspan", { fill: C.grey }, eq).textContent = ` , `;
        el("tspan", { fill: C.gold }, eq).textContent = `+'${st.enterCh}'@${st.r}`;
        el("tspan", { fill: C.grey }, eq).textContent = `   →   window [${st.l}..${st.r}] = "${st.winStr}"   (`;
        el("tspan", { fill: st.matched ? C.green : C.white }, eq).textContent = `${st.matches} / 26`;
        el("tspan", { fill: C.grey }, eq).textContent = `)`;
      }
      scene.eqs.push(eq);

      const act = txt(st.actionText, {
        x: STAGE_W / 2, y: 498, "font-size": 22,
        fill: st.matched ? C.green : C.grey,
        "text-anchor": "middle",
      }, textL);
      scene.actions.push(act);
    });

    // -- final banner -----------------------------------------------------
    const bY = 595;
    const ok = sim.found;
    scene.bannerBox = el("rect", {
      x: 240, y: bY - 36, width: 800, height: 70, rx: 12,
      fill: ok ? "#13261B" : "#2A1417",
      stroke: ok ? C.green : C.red, "stroke-width": 2.5,
      filter: ok ? "url(#glow-green)" : "url(#glow-red)",
    }, resultL);
    setOpacity(scene.bannerBox, 0);

    const bannerMsg = ok
      ? `return True   (window [${sim.matchL}..${sim.matchR}] "${s2.slice(sim.matchL, sim.matchR + 1)}" is a permutation of "${s1}")`
      : `return False   (no window of length ${s1.length} matches "${s1}")`;
    scene.bannerText = txt(bannerMsg, {
      x: STAGE_W / 2, y: bY, "font-size": 25, fill: ok ? C.green : C.red,
      "text-anchor": "middle", "dominant-baseline": "central",
    }, resultL);

    scene.complexity = txt(
      "O(1) bucket updates per slide · O(|s1| + |s2|) time · O(1) space (26 letters)",
      { x: STAGE_W / 2, y: 668, "font-size": 20, fill: C.grey, "text-anchor": "middle" },
      resultL
    );

    // -- reset ------------------------------------------------------------
    scene.reset = () => {
      setOpacity(scene.title, 0);
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.matchBadge, 0);
      scene.matchVal.textContent = "0 / 26";
      scene.matchVal.setAttribute("fill", C.gold);
      scene.matchRect.setAttribute("stroke", C.gold);
      setOpacity(scene.winBox, 0);
      setOpacity(scene.mapLabel, 0);
      setOpacity(scene.bannerBox, 0);
      for (const c of scene.cells) {
        setOpacity(c.g, 0);
        c.box.setAttribute("fill", C.cellBg);
        c.box.setAttribute("stroke", C.cellStroke);
      }
      for (const ch of Object.keys(scene.buckets)) {
        const b = scene.buckets[ch];
        setOpacity(b.g, 0);
        b.rect.setAttribute("stroke", C.slate);
        b.label.setAttribute("fill", C.grey);
        b.label.textContent = `'${ch}': 0/${b.need}`;
      }
      for (const w of scene._writers) w.reset();
    };

    return scene;
  },

  buildTimeline(scene, tl) {
    const { ctx, sim } = scene;
    const { C, ease, clamp, setOpacity } = ctx;
    const easeOut = ease.outCubic;
    const easeInOut = ease.inOutSine;
    const lerp = (a, b, t) => a + (b - a) * t;

    const wTitle = scene.writer(scene.title);
    const wEqs = scene.eqs.map(scene.writer);
    const wActs = scene.actions.map(scene.writer);
    const wBanner = scene.writer(scene.bannerText);
    const wComplex = scene.writer(scene.complexity);
    const shortCircuit = sim.steps.length > 0 && sim.steps[0].kind === "short";

    scene.reset();

    const applyWinCounts = (winMap, matches, matched) => {
      scene.matchVal.textContent = `${matches} / 26`;
      scene.matchVal.setAttribute("fill", matched ? C.green : C.gold);
      scene.matchRect.setAttribute("stroke", matched ? C.green : C.gold);
      for (const ch of Object.keys(scene.buckets)) {
        const b = scene.buckets[ch];
        const wv = winMap[ch] || 0;
        b.label.textContent = `'${ch}': ${wv}/${b.need}`;
        if (wv === b.need) {
          b.rect.setAttribute("stroke", b.need > 0 ? C.green : C.slate);
          b.label.setAttribute("fill", b.need > 0 ? C.green : C.grey);
        } else {
          b.rect.setAttribute("stroke", C.red);
          b.label.setAttribute("fill", C.white);
        }
      }
    };

    const styleCells = (l, r, matched) => {
      scene.winBox.setAttribute("stroke", matched ? C.green : C.gold);
      scene.winBox.setAttribute("fill", matched ? C.green : C.gold);
      scene.cells.forEach((c, idx) => {
        if (idx >= l && idx <= r) {
          c.box.setAttribute("stroke", matched ? C.green : C.gold);
          c.box.setAttribute("fill", matched ? "#15281E" : "#262015");
        } else {
          c.box.setAttribute("stroke", C.cellStroke);
          c.box.setAttribute("fill", C.cellBg);
        }
      });
    };

    // 1. Title + subtitle + array + frequency buckets
    tl.line(1);
    tl.add(0.75, wTitle);
    tl.add(0.45, u => setOpacity(scene.subtitle, easeOut(u)));
    tl.line(shortCircuit ? 2 : [2, 4, 6, 7, 8, 9, 10]);
    tl.add(0.65, u => {
      setOpacity(scene.matchBadge, easeOut(u));
      setOpacity(scene.mapLabel, easeOut(u));
      scene.cells.forEach((c, i) => {
        const start = i * 0.05;
        const p = clamp((u - start) / Math.max(0.25, 1 - start), 0, 1);
        setOpacity(c.g, easeOut(p));
      });
      Object.values(scene.buckets).forEach(b => setOpacity(b.g, easeOut(u)));
    });
    tl.wait(0.2);

    let prevEq = null;
    let prevAct = null;

    sim.steps.forEach((st, idx) => {
      const fadingEq = prevEq;
      const fadingAct = prevAct;

      if (st.kind === "short") {
        tl.line([2, 3]);
        tl.add(0.55, wEqs[idx]);
        tl.add(0.45, wActs[idx]);
      } else {
        const cL = scene.cells[st.l];
        const cR = scene.cells[st.r];
        const prevL = idx === 0 ? cL : scene.cells[sim.steps[idx - 1].l];

        tl.line(11);
        tl.add(0.45, u => {
          const e = easeInOut(u);
          if (fadingEq) setOpacity(fadingEq, 1 - e);
          if (fadingAct) setOpacity(fadingAct, 1 - e);
          const wx = lerp(prevL.x, cL.x, e) - 6;
          const ww = cR.x + cR.w - cL.x + 12;
          scene.winBox.setAttribute("x", wx);
          scene.winBox.setAttribute("width", ww);
          setOpacity(scene.winBox, 1);
          if (u > 0.5) {
            styleCells(st.l, st.r, st.matched);
            applyWinCounts(st.winMap, st.matches, st.matched);
          }
        });

        tl.line([12, 13, 14]);
        tl.add(0.55, wEqs[idx]);
        tl.line(15);
        tl.add(0.45, wActs[idx]);
      }

      prevEq = scene.eqs[idx];
      prevAct = scene.actions[idx];
    });

    const lastEq = prevEq;
    const lastAct = prevAct;
    tl.line(shortCircuit ? 3 : (sim.found ? 16 : 17));
    tl.add(0.4, u => {
      const e = easeOut(u);
      if (lastEq) setOpacity(lastEq, 1 - e);
      if (lastAct) setOpacity(lastAct, 1 - e);
    });

    tl.add(0.3, u => setOpacity(scene.bannerBox, easeOut(u)));
    tl.add(0.55, wBanner);
    tl.add(0.65, wComplex);
    tl.wait(0.6);
  },
};

function simulate(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const s1Map = {};
  for (const ch of s1) s1Map[ch] = (s1Map[ch] || 0) + 1;

  const displayChars = [];
  for (const ch of s1 + s2) {
    if (!displayChars.includes(ch)) displayChars.push(ch);
  }
  displayChars.sort();

  const steps = [];
  if (m > n) {
    steps.push({
      kind: "short",
      matched: false,
      actionText: "s1 is longer than s2 → impossible to form a permutation",
    });
    return { steps, s1Map, displayChars, found: false, matchL: -1, matchR: -1 };
  }

  const s1Counts = new Array(26).fill(0);
  const winCounts = new Array(26).fill(0);
  const codeA = "a".charCodeAt(0);

  for (let i = 0; i < m; i++) {
    s1Counts[s1.charCodeAt(i) - codeA] += 1;
    winCounts[s2.charCodeAt(i) - codeA] += 1;
  }

  const snapshotMap = () => {
    const out = {};
    for (const ch of displayChars) {
      out[ch] = winCounts[ch.charCodeAt(0) - codeA];
    }
    return out;
  };

  let matches = 0;
  for (let b = 0; b < 26; b++) {
    if (s1Counts[b] === winCounts[b]) matches += 1;
  }

  steps.push({
    kind: "init",
    l: 0,
    r: m - 1,
    winStr: s2.slice(0, m),
    winMap: snapshotMap(),
    matches,
    matched: matches === 26,
    actionText: matches === 26
      ? `all 26 buckets match! "${s2.slice(0, m)}" is a permutation of "${s1}"`
      : `${26 - matches} bucket(s) differ → slide window right by 1`,
  });

  if (matches === 26) {
    return { steps, s1Map, displayChars, found: true, matchL: 0, matchR: m - 1 };
  }

  for (let right = m; right < n; right++) {
    const enterCh = s2[right];
    const leaveCh = s2[right - m];
    const enterIdx = enterCh.charCodeAt(0) - codeA;
    const leaveIdx = leaveCh.charCodeAt(0) - codeA;

    winCounts[enterIdx] += 1;
    if (winCounts[enterIdx] === s1Counts[enterIdx]) matches += 1;
    else if (winCounts[enterIdx] === s1Counts[enterIdx] + 1) matches -= 1;

    winCounts[leaveIdx] -= 1;
    if (winCounts[leaveIdx] === s1Counts[leaveIdx]) matches += 1;
    else if (winCounts[leaveIdx] === s1Counts[leaveIdx] - 1) matches -= 1;

    const l = right - m + 1;
    const matched = matches === 26;
    const winStr = s2.slice(l, right + 1);
    steps.push({
      kind: "slide",
      l,
      r: right,
      enterCh,
      leaveCh,
      winStr,
      winMap: snapshotMap(),
      matches,
      matched,
      actionText: matched
        ? `all 26 buckets match! "${winStr}" at [${l}..${right}] is a permutation of "${s1}"`
        : `${26 - matches} bucket(s) differ → continue sliding`,
    });

    if (matched) {
      return { steps, s1Map, displayChars, found: true, matchL: l, matchR: right };
    }
  }

  return { steps, s1Map, displayChars, found: false, matchL: -1, matchR: -1 };
}
