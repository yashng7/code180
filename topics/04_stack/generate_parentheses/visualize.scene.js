/* Generate Parentheses — animated walkthrough scene (3Blue1Brown style).
 *
 * Build valid length-2n bracket strings via backtracking with a prefix stack:
 *   - Push '(' whenever `opened < n`
 *   - Push ')' whenever `closed < opened`
 *   - Emit `current` into `result` when `len(current) == 2n`
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Generate Parentheses",
    subtitle: "prefix stack backtracking · open < n & close < open · Catalan C_n",
    inputs: [
      { id: "n", label: "n (pairs)", type: "number", default: 3, min: 1, max: 3 },
    ],
    legend: [
      { color: "#58C4DD", text: "open '(' (opened < n)" },
      { color: "#F0AC5F", text: "close ')' (closed < opened)" },
      { color: "#83C167", text: "completed well-formed string" },
    ],
  },

  code: [
    "def generate_parenthesis(n: int) -> List[str]:",
    "    result: List[str] = []",
    "    def backtrack(current: str, opened: int, closed: int) -> None:",
    "        if len(current) == 2 * n:",
    "            result.append(current)",
    "            return",
    "        if opened < n:",
    "            backtrack(current + \"(\", opened + 1, closed)",
    "        if closed < opened:",
    "            backtrack(current + \")\", opened, closed + 1)",
    "    backtrack(\"\", 0, 0)",
    "    return result",
  ],

  read(values) {
    const n = Number(values.n);
    if (!Number.isInteger(n) || n < 1 || n > 3) return null;
    return { n };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Number.isInteger(args[0])) {
      const n = clampNum(args[0], 1, 3);
      return { n };
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, STAGE_W } = ctx;
    const { n } = params;
    const len = 2 * n;
    const sim = simulate(n);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const arcsL = ctx.layer("arcs");
    const chipsL = ctx.layer("chips");
    const resultL = ctx.layer("result");

    const scene = {
      n, sim, ctx,
      prefixSlots: [], outChips: [], eqs: [], actions: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title + subtitle -------------------------------------------------
    scene.title = txt("Generate Parentheses", {
      x: 64, y: 72, "font-size": 44, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    const sub = el("text", { x: 64, y: 110, "font-size": 22, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = `n = ${n} pairs   →   length 2n = ${len}   (`;
    el("tspan", { fill: C.green }, sub).textContent = `${sim.results.length} Catalan string(s)`;
    el("tspan", {}, sub).textContent = ")";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- top-right counters badge (opened / closed) -----------------------
    const countG = el("g", {}, textL);
    setOpacity(countG, 0);
    el("rect", {
      x: 860, y: 50, width: 360, height: 66, rx: 10,
      fill: "#111722", stroke: C.blue, "stroke-width": 2,
    }, countG);
    txt("opened:", { x: 882, y: 83, "font-size": 20, fill: C.grey, "dominant-baseline": "central" }, countG);
    scene.openVal = txt(`0/${n}`, { x: 1015, y: 83, "font-size": 24, fill: C.blue, "text-anchor": "end", "dominant-baseline": "central" }, countG);
    txt("closed:", { x: 1048, y: 83, "font-size": 20, fill: C.grey, "dominant-baseline": "central" }, countG);
    scene.closeVal = txt(`0/${n}`, { x: 1196, y: 83, "font-size": 24, fill: C.gold, "text-anchor": "end", "dominant-baseline": "central" }, countG);
    scene.countBadge = countG;

    // -- active prefix stack row (y=225) ----------------------------------
    const rowY = 225;
    const slotW = 74;
    const slotH = 70;
    const pitch = slotW + 10;
    const totalW = len * pitch - 10;
    const startX = STAGE_W / 2 - totalW / 2;

    scene.prefixLabel = txt("prefix stack :", {
      x: startX - 155, y: rowY, "font-size": 21, fill: C.grey,
      "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.prefixLabel, 0);

    for (let i = 0; i < len; i++) {
      const x = startX + i * pitch;
      const cx = x + slotW / 2;
      const g = el("g", {}, chipsL);
      setOpacity(g, 0);

      const box = el("rect", {
        x, y: rowY - slotH / 2, width: slotW, height: slotH, rx: 8,
        fill: C.cellBg, stroke: C.cellStroke, "stroke-width": 2,
      }, g);

      const chTxt = txt("", {
        x: cx, y: rowY, "font-size": 30, fill: C.white,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);

      const idxTxt = txt(String(i), {
        x: cx, y: rowY + slotH / 2 + 22, "font-size": 15, fill: C.grey,
        "text-anchor": "middle",
      }, g);

      scene.prefixSlots.push({ g, box, chTxt, idxTxt, x, cx });
    }

    // -- emitted results row (y=360) --------------------------------------
    const outY = 360;
    scene.outLabel = txt("result :", {
      x: 110, y: outY, "font-size": 21, fill: C.grey,
      "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.outLabel, 0);

    const chipW = clamp(Math.floor(940 / Math.max(1, sim.results.length)) - 12, 110, 155);
    const chipGap = 14;
    const outStartX = 220;
    sim.results.forEach((str, idx) => {
      const ox = outStartX + idx * (chipW + chipGap);
      const g = el("g", {}, arcsL);
      setOpacity(g, 0);
      el("rect", {
        x: ox, y: outY - 24, width: chipW, height: 48, rx: 8,
        fill: "#13261B", stroke: C.green, "stroke-width": 2,
      }, g);
      txt(`"${str}"`, {
        x: ox + chipW / 2, y: outY, "font-size": 21, fill: C.green,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);
      scene.outChips.push(g);
    });

    // -- per-step equation & action notes ---------------------------------
    sim.steps.forEach(st => {
      const eq = el("text", {
        x: STAGE_W / 2, y: 452, "font-size": 25, fill: C.white,
        "text-anchor": "middle",
      }, textL);
      el("tspan", { fill: C.grey }, eq).textContent = `prefix = `;
      el("tspan", { fill: st.isLeaf ? C.green : C.white }, eq).textContent = `"${st.prefix}"`;
      el("tspan", { fill: C.grey }, eq).textContent =
        `   (opened = ${st.opened}/${n},  closed = ${st.closed}/${st.opened})`;
      scene.eqs.push(eq);

      const act = txt(st.actionText, {
        x: STAGE_W / 2, y: 498, "font-size": 22,
        fill: st.isLeaf ? C.green : (st.choice === "(" ? C.blue : C.gold),
        "text-anchor": "middle",
      }, textL);
      scene.actions.push(act);
    });

    // -- final banner -----------------------------------------------------
    const bY = 595;
    scene.bannerBox = el("rect", {
      x: 190, y: bY - 36, width: 900, height: 70, rx: 12,
      fill: "#13261B", stroke: C.green, "stroke-width": 2.5,
      filter: "url(#glow-green)",
    }, resultL);
    setOpacity(scene.bannerBox, 0);

    scene.bannerText = txt(
      `return [${sim.results.map(r => `"${r}"`).join(", ")}]`,
      {
        x: STAGE_W / 2, y: bY, "font-size": 24, fill: C.green,
        "text-anchor": "middle", "dominant-baseline": "central",
      },
      resultL
    );

    scene.complexity = txt(
      "Only valid prefixes explored · O(4^n / √n) time · O(n) recursion stack space",
      { x: STAGE_W / 2, y: 668, "font-size": 20, fill: C.grey, "text-anchor": "middle" },
      resultL
    );

    // -- reset ------------------------------------------------------------
    scene.reset = () => {
      setOpacity(scene.title, 0);
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.countBadge, 0);
      scene.openVal.textContent = `0/${n}`;
      scene.closeVal.textContent = `0/${n}`;
      setOpacity(scene.prefixLabel, 0);
      setOpacity(scene.outLabel, 0);
      setOpacity(scene.bannerBox, 0);
      for (const sl of scene.prefixSlots) {
        setOpacity(sl.g, 0);
        sl.box.setAttribute("fill", C.cellBg);
        sl.box.setAttribute("stroke", C.cellStroke);
        sl.chTxt.textContent = "";
      }
      for (const oc of scene.outChips) {
        setOpacity(oc, 0);
      }
      for (const w of scene._writers) w.reset();
    };

    return scene;
  },

  buildTimeline(scene, tl) {
    const { ctx, sim, n } = scene;
    const { C, ease, clamp, setOpacity } = ctx;
    const easeOut = ease.outCubic;

    const wTitle = scene.writer(scene.title);
    const wEqs = scene.eqs.map(scene.writer);
    const wActs = scene.actions.map(scene.writer);
    const wBanner = scene.writer(scene.bannerText);
    const wComplex = scene.writer(scene.complexity);

    scene.reset();

    const applyPrefix = (prefix, isLeaf) => {
      scene.prefixSlots.forEach((sl, idx) => {
        if (idx < prefix.length) {
          const ch = prefix[idx];
          sl.chTxt.textContent = ch;
          if (isLeaf) {
            sl.box.setAttribute("stroke", C.green);
            sl.box.setAttribute("fill", "#15281E");
            sl.chTxt.setAttribute("fill", C.green);
          } else if (ch === "(") {
            sl.box.setAttribute("stroke", C.blue);
            sl.box.setAttribute("fill", "#142636");
            sl.chTxt.setAttribute("fill", C.white);
          } else {
            sl.box.setAttribute("stroke", C.gold);
            sl.box.setAttribute("fill", "#262015");
            sl.chTxt.setAttribute("fill", C.gold);
          }
        } else {
          sl.chTxt.textContent = "";
          sl.box.setAttribute("stroke", C.cellStroke);
          sl.box.setAttribute("fill", C.cellBg);
        }
      });
    };

    // 1. Title + subtitle + empty prefix slots
    tl.line(1);
    tl.add(0.75, wTitle);
    tl.add(0.45, u => setOpacity(scene.subtitle, easeOut(u)));
    tl.line([2, 3]);
    tl.add(0.65, u => {
      setOpacity(scene.countBadge, easeOut(u));
      setOpacity(scene.prefixLabel, easeOut(u));
      setOpacity(scene.outLabel, easeOut(u));
      scene.prefixSlots.forEach((sl, i) => {
        const start = i * 0.05;
        const p = clamp((u - start) / Math.max(0.25, 1 - start), 0, 1);
        setOpacity(sl.g, easeOut(p));
      });
    });
    tl.wait(0.2);
    tl.line(11);

    let prevEq = null;
    let prevAct = null;

    sim.steps.forEach((st, idx) => {
      const fadingEq = prevEq;
      const fadingAct = prevAct;

      tl.line(4);
      tl.add(0.32, u => {
        const e = easeOut(u);
        if (fadingEq) setOpacity(fadingEq, 1 - e);
        if (fadingAct) setOpacity(fadingAct, 1 - e);
        if (u > 0.4) {
          applyPrefix(st.prefix, st.isLeaf);
          scene.openVal.textContent = `${st.opened}/${n}`;
          scene.closeVal.textContent = `${st.closed}/${n}`;
        }
      });

      tl.line(st.isLeaf ? 5 : (st.choice === "(" ? 7 : 9));
      tl.add(0.45, wEqs[idx]);
      tl.line(st.isLeaf ? 6 : (st.choice === "(" ? 8 : 10));
      tl.add(0.42, wActs[idx]);

      if (st.isLeaf && scene.outChips[st.outIdx]) {
        tl.add(0.28, u => setOpacity(scene.outChips[st.outIdx], easeOut(u)));
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
    });

    tl.line(12);
    tl.add(0.3, u => setOpacity(scene.bannerBox, easeOut(u)));
    tl.add(0.55, wBanner);
    tl.add(0.65, wComplex);
    tl.wait(0.6);
  },
};

function clampNum(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function simulate(n) {
  const results = [];
  const steps = [];

  function backtrack(current, opened, closed, choice) {
    const isLeaf = current.length === 2 * n;
    if (isLeaf) {
      const outIdx = results.length;
      results.push(current);
      steps.push({
        prefix: current,
        opened,
        closed,
        choice,
        isLeaf: true,
        outIdx,
        actionText: `length == ${2 * n} → emit "${current}" (result #${outIdx + 1}) & backtrack`,
      });
      return;
    }

    if (current.length > 0) {
      const canOpen = opened < n;
      const canClose = closed < opened;
      const nextOpts = [];
      if (canOpen) nextOpts.push("'('");
      if (canClose) nextOpts.push("')'");
      steps.push({
        prefix: current,
        opened,
        closed,
        choice,
        isLeaf: false,
        outIdx: -1,
        actionText: `pushed '${choice}' · valid next choices: ${nextOpts.join(" or ")}`,
      });
    }

    if (opened < n) {
      backtrack(current + "(", opened + 1, closed, "(");
    }
    if (closed < opened) {
      backtrack(current + ")", opened, closed + 1, ")");
    }
  }

  backtrack("", 0, 0, "");
  return { steps, results };
}
