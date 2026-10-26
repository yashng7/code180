/* Sliding Window Maximum — animated walkthrough scene (3Blue1Brown style).
 *
 * Slide a window of width `k` across `nums` while maintaining a monotonic
 * decreasing deque `dq` of indices. At each step `i`:
 *   1. Evict `dq[0]` if it fell out of the window (`dq[0] <= i - k`).
 *   2. Pop smaller/equal elements from the back (`nums[dq[-1]] <= nums[i]`).
 *   3. Push `i` onto the back; `nums[dq[0]]` is the window maximum.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Sliding Window Maximum",
    subtitle: "monotonic decreasing deque of indices · O(n) time · O(k) space",
    inputs: [
      { id: "nums", label: "nums", type: "text", default: "1, 3, -1, -3, 5, 3, 6, 7", width: "wide" },
      { id: "k", label: "k", type: "number", default: 3, min: 1, max: 12 },
    ],
    legend: [
      { color: "#F0AC5F", text: "active window of size k" },
      { color: "#83C167", text: "deque front (window max)" },
      { color: "#58C4DD", text: "other candidates in deque" },
      { color: "#FC6255", text: "evicted / popped smaller" },
    ],
  },

  code: [
    "def max_sliding_window(nums: List[int], k: int) -> List[int]:",
    "    dq: deque[int] = deque()",
    "    result: List[int] = []",
    "    for right, value in enumerate(nums):",
    "        while dq and nums[dq[-1]] <= value:",
    "            dq.pop()",
    "        dq.append(right)",
    "        if dq[0] <= right - k:",
    "            dq.popleft()",
    "        if right >= k - 1:",
    "            result.append(nums[dq[0]])",
    "    return result",
  ],

  read(values) {
    const raw = (values.nums || "").trim();
    const k = Number(values.k);
    if (!raw) return null;
    const nums = raw.split(/[\s,]+/).filter(Boolean).map(Number);
    if (nums.length < 1 || nums.length > 13) return null;
    if (!nums.every(v => Number.isInteger(v))) return null;
    if (!Number.isInteger(k) || k < 1 || k > nums.length) return null;
    return { nums, k };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0]) && Number.isInteger(args[1])) {
      const nums = args[0].map(Number);
      const k = args[1];
      if (nums.length >= 1 && nums.length <= 13 && k >= 1 && k <= nums.length) {
        return { nums: nums.join(", "), k };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, STAGE_W } = ctx;
    const { nums, k } = params;
    const n = nums.length;
    const sim = simulate(nums, k);

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
      nums, k, sim, ctx,
      cells: [], dqSlots: [], outChips: [], eqs: [], actions: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title + subtitle -------------------------------------------------
    scene.title = txt("Sliding Window Maximum", {
      x: 64, y: 72, "font-size": 42, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    const sub = el("text", { x: 64, y: 110, "font-size": 22, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "nums = [";
    el("tspan", { fill: C.white }, sub).textContent = nums.join(", ");
    el("tspan", {}, sub).textContent = "],   k = ";
    el("tspan", { fill: C.gold }, sub).textContent = String(k);
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- nums array row ---------------------------------------------------
    const rowY = 215;
    const cellW = clamp(Math.floor(980 / n) - 8, 52, 74);
    const cellH = 66;
    const pitch = cellW + 8;
    const totalW = n * pitch - 8;
    const startX = STAGE_W / 2 - totalW / 2;

    scene.winBox = el("rect", {
      x: startX - 6, y: rowY - cellH / 2 - 8,
      width: cellW + 12, height: cellH + 16, rx: 12,
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

      const valTxt = txt(String(nums[i]), {
        x: cx, y: rowY, "font-size": 26, fill: C.white,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);

      const idxTxt = txt(String(i), {
        x: cx, y: rowY + cellH / 2 + 22, "font-size": 15, fill: C.grey,
        "text-anchor": "middle",
      }, g);

      scene.cells.push({ g, box, valTxt, idxTxt, x, cx, w: cellW, val: nums[i] });
    }

    // -- monotonic deque display + output row -----------------------------
    const dqY = 348;
    scene.dqLabel = txt("deque (idx:val) :", {
      x: 74, y: dqY, "font-size": 20, fill: C.grey,
      "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.dqLabel, 0);

    const slotW = 86;
    const slotGap = 10;
    const dqStartX = 248;
    for (let s = 0; s < Math.min(k, 8); s++) {
      const bx = dqStartX + s * (slotW + slotGap);
      const g = el("g", {}, chipsL);
      setOpacity(g, 0);
      const rect = el("rect", {
        x: bx, y: dqY - 22, width: slotW, height: 44, rx: 8,
        fill: "#111722", stroke: s === 0 ? C.green : C.blue, "stroke-width": 2,
      }, g);
      const label = txt("", {
        x: bx + slotW / 2, y: dqY, "font-size": 18,
        fill: s === 0 ? C.green : C.white,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);
      scene.dqSlots.push({ g, rect, label });
    }

    // -- output maxima row (right side of y=348) --------------------------
    scene.outLabel = txt("output :", {
      x: 740, y: dqY, "font-size": 20, fill: C.grey,
      "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.outLabel, 0);

    const outCount = sim.result.length;
    const outW = clamp(Math.floor(380 / Math.max(1, outCount)) - 6, 38, 54);
    const outGap = 6;
    const outStartX = 830;
    sim.result.forEach((v, idx) => {
      const ox = outStartX + idx * (outW + outGap);
      const g = el("g", {}, chipsL);
      setOpacity(g, 0);
      el("rect", {
        x: ox, y: dqY - 22, width: outW, height: 44, rx: 7,
        fill: "#13261B", stroke: C.green, "stroke-width": 2,
      }, g);
      txt(String(v), {
        x: ox + outW / 2, y: dqY, "font-size": 20, fill: C.green,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);
      scene.outChips.push(g);
    });

    // -- per-step equation & action notes ---------------------------------
    sim.steps.forEach(st => {
      const eq = el("text", {
        x: STAGE_W / 2, y: 448, "font-size": 25, fill: C.white,
        "text-anchor": "middle",
      }, textL);
      el("tspan", { fill: C.gold }, eq).textContent = `i = ${st.i} (val ${st.val})`;
      if (st.evictedFront !== null) {
        el("tspan", { fill: C.red }, eq).textContent = `  · evict expired idx ${st.evictedFront}`;
      }
      if (st.poppedBack.length > 0) {
        el("tspan", { fill: C.red }, eq).textContent =
          `  · pop smaller [${st.poppedBack.map(idx => `${idx}:${nums[idx]}`).join(", ")}]`;
      }
      el("tspan", { fill: C.blue }, eq).textContent = `  · push ${st.i}:${st.val}`;
      scene.eqs.push(eq);

      const act = txt(st.actionText, {
        x: STAGE_W / 2, y: 495, "font-size": 22,
        fill: st.hasOutput ? C.green : C.grey,
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
      `return [${sim.result.join(", ")}]`,
      {
        x: STAGE_W / 2, y: bY, "font-size": 28, fill: C.green,
        "text-anchor": "middle", "dominant-baseline": "central",
      },
      resultL
    );

    scene.complexity = txt(
      "Each index pushed & popped at most once · O(n) time · O(k) deque space",
      { x: STAGE_W / 2, y: 668, "font-size": 20, fill: C.grey, "text-anchor": "middle" },
      resultL
    );

    // -- reset ------------------------------------------------------------
    scene.reset = () => {
      setOpacity(scene.title, 0);
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.winBox, 0);
      setOpacity(scene.dqLabel, 0);
      setOpacity(scene.outLabel, 0);
      setOpacity(scene.bannerBox, 0);
      for (const c of scene.cells) {
        setOpacity(c.g, 0);
        c.box.setAttribute("fill", C.cellBg);
        c.box.setAttribute("stroke", C.cellStroke);
      }
      for (const sl of scene.dqSlots) {
        setOpacity(sl.g, 0);
        sl.label.textContent = "";
      }
      for (const oc of scene.outChips) {
        setOpacity(oc, 0);
      }
      for (const w of scene._writers) w.reset();
    };

    return scene;
  },

  buildTimeline(scene, tl) {
    const { ctx, sim, nums } = scene;
    const { C, ease, clamp, setOpacity } = ctx;
    const easeOut = ease.outCubic;
    const easeInOut = ease.inOutSine;
    const lerp = (a, b, t) => a + (b - a) * t;

    const wTitle = scene.writer(scene.title);
    const wEqs = scene.eqs.map(scene.writer);
    const wActs = scene.actions.map(scene.writer);
    const wBanner = scene.writer(scene.bannerText);
    const wComplex = scene.writer(scene.complexity);

    scene.reset();

    const renderDeque = dq => {
      scene.dqSlots.forEach((sl, sIdx) => {
        if (sIdx < dq.length) {
          const idx = dq[sIdx];
          sl.label.textContent = `${idx}:${nums[idx]}`;
          setOpacity(sl.g, 1);
        } else {
          setOpacity(sl.g, 0);
        }
      });
    };

    const styleCells = (winL, winR, dq) => {
      const frontIdx = dq.length > 0 ? dq[0] : -1;
      const inDq = new Set(dq);
      scene.cells.forEach((c, idx) => {
        if (idx === frontIdx) {
          c.box.setAttribute("stroke", C.green);
          c.box.setAttribute("fill", "#15281E");
        } else if (inDq.has(idx)) {
          c.box.setAttribute("stroke", C.blue);
          c.box.setAttribute("fill", "#142636");
        } else if (idx >= winL && idx <= winR) {
          c.box.setAttribute("stroke", C.gold);
          c.box.setAttribute("fill", "#241E14");
        } else {
          c.box.setAttribute("stroke", C.cellStroke);
          c.box.setAttribute("fill", C.cellBg);
        }
      });
    };

    // 1. Title + subtitle + array reveal
    tl.line(1);
    tl.add(0.75, wTitle);
    tl.add(0.45, u => setOpacity(scene.subtitle, easeOut(u)));
    tl.line([2, 3]);
    tl.add(0.65, u => {
      setOpacity(scene.dqLabel, easeOut(u));
      setOpacity(scene.outLabel, easeOut(u));
      scene.cells.forEach((c, i) => {
        const start = i * 0.05;
        const p = clamp((u - start) / Math.max(0.25, 1 - start), 0, 1);
        setOpacity(c.g, easeOut(p));
      });
    });
    tl.wait(0.2);

    let prevEq = null;
    let prevAct = null;

    sim.steps.forEach((st, idx) => {
      const prevSt = idx === 0 ? { winL: 0, winR: 0 } : sim.steps[idx - 1];
      const cPrevL = scene.cells[prevSt.winL];
      const cPrevR = scene.cells[prevSt.winR];
      const cL = scene.cells[st.winL];
      const cR = scene.cells[st.winR];
      const fadingEq = prevEq;
      const fadingAct = prevAct;

      // Slide window frame & update deque
      tl.line(4);
      tl.add(0.45, u => {
        const e = easeInOut(u);
        if (fadingEq) setOpacity(fadingEq, 1 - e);
        if (fadingAct) setOpacity(fadingAct, 1 - e);
        const wx = lerp(cPrevL.x, cL.x, e) - 6;
        const ww = lerp(cPrevR.x + cPrevR.w, cR.x + cR.w, e) - wx + 6;
        scene.winBox.setAttribute("x", wx);
        scene.winBox.setAttribute("width", Math.max(16, ww));
        setOpacity(scene.winBox, 1);
        if (u > 0.5) {
          renderDeque(st.dqAfter);
          styleCells(st.winL, st.winR, st.dqAfter);
        }
      });

      // Write deque maintenance equation
      tl.line([5, 6, 7]);
      tl.add(0.55, wEqs[idx]);

      // Write output / status note + reveal output chip if window full
      tl.line([8, 9, 10]);
      tl.add(0.45, wActs[idx]);
      if (st.hasOutput && scene.outChips[st.outIdx]) {
        tl.line(11);
        tl.add(0.25, u => setOpacity(scene.outChips[st.outIdx], easeOut(u)));
      }

      prevEq = scene.eqs[idx];
      prevAct = scene.actions[idx];
    });

    const lastEq = prevEq;
    const lastAct = prevAct;
    tl.line(12);
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

function simulate(nums, k) {
  const dq = [];
  const result = [];
  const steps = [];

  for (let i = 0; i < nums.length; i++) {
    const val = nums[i];
    const winL = Math.max(0, i - k + 1);
    const winR = i;

    let evictedFront = null;
    if (dq.length > 0 && dq[0] <= i - k) {
      evictedFront = dq.shift();
    }

    const poppedBack = [];
    while (dq.length > 0 && nums[dq[dq.length - 1]] <= val) {
      poppedBack.push(dq.pop());
    }

    dq.push(i);
    const dqAfter = dq.slice();
    const hasOutput = i >= k - 1;
    let outIdx = -1;
    let maxVal = nums[dq[0]];

    if (hasOutput) {
      outIdx = result.length;
      result.push(maxVal);
    }

    const actionText = hasOutput
      ? `window [${i - k + 1}..${i}] full → front of deque idx ${dq[0]} gives max = ${maxVal}`
      : `warming up window (${i + 1}/${k} elements) · front candidate is ${nums[dq[0]]}`;

    steps.push({
      i,
      val,
      winL,
      winR,
      evictedFront,
      poppedBack,
      dqAfter,
      hasOutput,
      outIdx,
      maxVal,
      actionText,
    });
  }

  return { steps, result };
}
