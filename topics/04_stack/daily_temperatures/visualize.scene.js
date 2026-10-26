/* Daily Temperatures — animated walkthrough scene (3Blue1Brown style).
 *
 * Maintain a monotonic decreasing stack of day indices awaiting a warmer day.
 * When `temperatures[day]` is warmer than the top of the stack (`prev`), pop
 * `prev` and record `answer[prev] = day - prev`. Then push `day` onto the stack.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Daily Temperatures",
    subtitle: "monotonic decreasing stack of indices · O(n) time · O(n) space",
    inputs: [
      { id: "temperatures", label: "temperatures", type: "text", default: "73, 74, 75, 71, 69, 72, 76, 73", width: "wide" },
    ],
    legend: [
      { color: "#F0AC5F", text: "current day cursor" },
      { color: "#58C4DD", text: "waiting on monotonic stack" },
      { color: "#83C167", text: "resolved wait (day - prev)" },
    ],
  },

  code: [
    "def daily_temperatures(temperatures: List[int]) -> List[int]:",
    "    n = len(temperatures)",
    "    answer = [0] * n",
    "    stack: list[int] = []",
    "    for day, temp in enumerate(temperatures):",
    "        while stack and temperatures[stack[-1]] < temp:",
    "            previous = stack.pop()",
    "            answer[previous] = day - previous",
    "        stack.append(day)",
    "    return answer",
  ],

  read(values) {
    const raw = (values.temperatures || "").trim();
    if (!raw) return null;
    const temperatures = raw.split(/[\s,]+/).filter(Boolean).map(Number);
    if (temperatures.length < 1 || temperatures.length > 12) return null;
    if (!temperatures.every(v => Number.isInteger(v) && v >= 0 && v <= 200)) return null;
    return { temperatures };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const temperatures = args[0].map(Number);
      if (temperatures.length >= 1 && temperatures.length <= 12
          && temperatures.every(v => Number.isInteger(v))) {
        return { temperatures: temperatures.join(", ") };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const { temperatures } = params;
    const n = temperatures.length;
    const sim = simulate(temperatures);

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
      temperatures, sim, ctx,
      cells: [], ansCells: [], stackSlots: [], eqs: [], actions: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title + subtitle -------------------------------------------------
    scene.title = txt("Daily Temperatures", {
      x: 64, y: 72, "font-size": 44, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    const sub = el("text", { x: 64, y: 110, "font-size": 22, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "temperatures = [";
    el("tspan", { fill: C.white }, sub).textContent = temperatures.join(", ");
    el("tspan", {}, sub).textContent = "]";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- temperatures row (y=200) + answer row (y=290) --------------------
    const rowY = 200;
    const ansY = 290;
    const cellW = clamp(Math.floor(940 / n) - 8, 56, 78);
    const cellH = 60;
    const pitch = cellW + 8;
    const totalW = n * pitch - 8;
    const startX = STAGE_W / 2 - totalW / 2 + 40;

    scene.tempLabel = txt("temps :", {
      x: startX - 95, y: rowY, "font-size": 20, fill: C.grey,
      "dominant-baseline": "central",
    }, textL);
    scene.ansLabel = txt("answer :", {
      x: startX - 95, y: ansY, "font-size": 20, fill: C.grey,
      "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.tempLabel, 0);
    setOpacity(scene.ansLabel, 0);

    for (let i = 0; i < n; i++) {
      const x = startX + i * pitch;
      const cx = x + cellW / 2;

      const g = el("g", {}, chipsL);
      setOpacity(g, 0);
      const box = el("rect", {
        x, y: rowY - cellH / 2, width: cellW, height: cellH, rx: 8,
        fill: C.cellBg, stroke: C.cellStroke, "stroke-width": 2,
      }, g);
      const valTxt = txt(`${temperatures[i]}°`, {
        x: cx, y: rowY, "font-size": 23, fill: C.white,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);
      const idxTxt = txt(`d${i}`, {
        x: cx, y: rowY - cellH / 2 - 12, "font-size": 14, fill: C.grey,
        "text-anchor": "middle",
      }, g);
      scene.cells.push({ g, box, valTxt, idxTxt, x, cx, w: cellW });

      const ag = el("g", {}, chipsL);
      setOpacity(ag, 0);
      const abox = el("rect", {
        x, y: ansY - 24, width: cellW, height: 48, rx: 8,
        fill: "#111722", stroke: C.slate, "stroke-width": 1.8,
      }, ag);
      const aval = txt("0", {
        x: cx, y: ansY, "font-size": 22, fill: C.dim,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, ag);
      scene.ansCells.push({ g: ag, box: abox, valTxt: aval });
    }

    // -- cursor pointer ---------------------------------------------------
    const ptrG = el("g", {}, ptrL);
    setOpacity(ptrG, 0);
    el("polygon", {
      points: "-8,-14 8,-14 0,-2",
      fill: C.gold, filter: "url(#glow-gold)",
    }, ptrG);
    scene.cursorPtr = ptrG;

    // -- monotonic stack row (y=375) --------------------------------------
    const stY = 375;
    scene.stackLabel = txt("decreasing stack (day:temp) :", {
      x: 78, y: stY, "font-size": 20, fill: C.grey,
      "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.stackLabel, 0);

    const slotW = 88;
    const slotGap = 10;
    const stStartX = 350;
    for (let k = 0; k < n; k++) {
      const bx = stStartX + k * (slotW + slotGap);
      const g = el("g", {}, arcsL);
      setOpacity(g, 0);
      const rect = el("rect", {
        x: bx, y: stY - 22, width: slotW, height: 44, rx: 8,
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
        x: STAGE_W / 2, y: 454, "font-size": 25, fill: C.white,
        "text-anchor": "middle",
      }, textL);
      el("tspan", { fill: C.gold }, eq).textContent = `day ${st.day} (${st.temp}°)`;
      if (st.resolved.length > 0) {
        const resDesc = st.resolved
          .map(r => `d${r.prev}(${r.prevTemp}°) → wait ${r.wait}`)
          .join(",  ");
        el("tspan", { fill: C.green }, eq).textContent = `   ·   warmer! pop & resolve: ${resDesc}`;
      } else {
        el("tspan", { fill: C.grey }, eq).textContent =
          st.topBefore !== null
            ? `   ≤   stack top d${st.topBefore}(${temperatures[st.topBefore]}°)   ·   no pops`
            : `   ·   stack empty`;
      }
      scene.eqs.push(eq);

      const act = txt(st.actionText, {
        x: STAGE_W / 2, y: 498, "font-size": 22,
        fill: st.resolved.length > 0 ? C.green : C.blue,
        "text-anchor": "middle",
      }, textL);
      scene.actions.push(act);
    });

    // -- final banner -----------------------------------------------------
    const bY = 595;
    scene.bannerBox = el("rect", {
      x: 220, y: bY - 36, width: 840, height: 70, rx: 12,
      fill: "#13261B", stroke: C.green, "stroke-width": 2.5,
      filter: "url(#glow-green)",
    }, resultL);
    setOpacity(scene.bannerBox, 0);

    scene.bannerText = txt(
      `return [${sim.answer.join(", ")}]`,
      {
        x: STAGE_W / 2, y: bY, "font-size": 28, fill: C.green,
        "text-anchor": "middle", "dominant-baseline": "central",
      },
      resultL
    );

    scene.complexity = txt(
      "Each day pushed & popped at most once · O(n) time · O(n) stack space",
      { x: STAGE_W / 2, y: 668, "font-size": 20, fill: C.grey, "text-anchor": "middle" },
      resultL
    );

    // -- reset ------------------------------------------------------------
    scene.reset = () => {
      setOpacity(scene.title, 0);
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.tempLabel, 0);
      setOpacity(scene.ansLabel, 0);
      setOpacity(scene.stackLabel, 0);
      setOpacity(scene.cursorPtr, 0);
      setOpacity(scene.bannerBox, 0);
      if (scene.cells[0]) {
        setTranslate(scene.cursorPtr, scene.cells[0].cx, rowY - cellH / 2 - 22);
      }
      for (const c of scene.cells) {
        setOpacity(c.g, 0);
        c.box.setAttribute("fill", C.cellBg);
        c.box.setAttribute("stroke", C.cellStroke);
      }
      for (const a of scene.ansCells) {
        setOpacity(a.g, 0);
        a.box.setAttribute("stroke", C.slate);
        a.box.setAttribute("fill", "#111722");
        a.valTxt.setAttribute("fill", C.dim);
        a.valTxt.textContent = "0";
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
    const { ctx, sim, temperatures } = scene;
    const { C, ease, clamp, setOpacity, setTranslate } = ctx;
    const easeOut = ease.outCubic;
    const easeInOut = ease.inOutSine;
    const lerp = (a, b, t) => a + (b - a) * t;
    const ptrY = 200 - 30 - 22;

    const wTitle = scene.writer(scene.title);
    const wEqs = scene.eqs.map(scene.writer);
    const wActs = scene.actions.map(scene.writer);
    const wBanner = scene.writer(scene.bannerText);
    const wComplex = scene.writer(scene.complexity);

    scene.reset();

    const renderStack = stArr => {
      scene.stackSlots.forEach((sl, idx) => {
        if (idx < stArr.length) {
          const d = stArr[idx];
          sl.label.textContent = `d${d}:${temperatures[d]}°`;
          setOpacity(sl.g, 1);
        } else {
          setOpacity(sl.g, 0);
        }
      });
    };

    const styleDays = (stArr, resolvedSet, curDay) => {
      const waitSet = new Set(stArr);
      scene.cells.forEach((c, idx) => {
        if (idx === curDay) {
          c.box.setAttribute("stroke", C.gold);
          c.box.setAttribute("fill", "#262015");
        } else if (resolvedSet.has(idx)) {
          c.box.setAttribute("stroke", C.green);
          c.box.setAttribute("fill", "#15281E");
        } else if (waitSet.has(idx)) {
          c.box.setAttribute("stroke", C.blue);
          c.box.setAttribute("fill", "#142636");
        } else {
          c.box.setAttribute("stroke", C.cellStroke);
          c.box.setAttribute("fill", C.cellBg);
        }
      });
    };

    // 1. Title + subtitle + cells reveal
    tl.line(1);
    tl.add(0.75, wTitle);
    tl.add(0.45, u => setOpacity(scene.subtitle, easeOut(u)));
    tl.line([2, 3, 4]);
    tl.add(0.65, u => {
      setOpacity(scene.tempLabel, easeOut(u));
      setOpacity(scene.ansLabel, easeOut(u));
      setOpacity(scene.stackLabel, easeOut(u));
      scene.cells.forEach((c, i) => {
        const start = i * 0.05;
        const p = clamp((u - start) / Math.max(0.25, 1 - start), 0, 1);
        setOpacity(c.g, easeOut(p));
        setOpacity(scene.ansCells[i].g, easeOut(p));
      });
    });
    tl.wait(0.2);

    let prevEq = null;
    let prevAct = null;
    const resolvedEver = new Set();

    sim.steps.forEach((st, idx) => {
      const cCur = scene.cells[st.day];
      const cPrev = idx === 0 ? cCur : scene.cells[sim.steps[idx - 1].day];
      const fadingEq = prevEq;
      const fadingAct = prevAct;

      tl.line(5);
      tl.add(0.42, u => {
        const e = easeInOut(u);
        if (fadingEq) setOpacity(fadingEq, 1 - e);
        if (fadingAct) setOpacity(fadingAct, 1 - e);
        setTranslate(scene.cursorPtr, lerp(cPrev.cx, cCur.cx, e), ptrY);
        setOpacity(scene.cursorPtr, 1);
        if (u > 0.5) {
          cCur.box.setAttribute("stroke", C.gold);
          cCur.box.setAttribute("fill", "#262015");
        }
      });

      tl.line(st.resolved.length > 0 ? [6, 7, 8] : 6);
      tl.add(0.52, wEqs[idx]);
      tl.line(st.resolved.length > 0 ? [8, 9] : 9);
      tl.add(0.48, wActs[idx]);

      tl.add(0.32, u => {
        if (u > 0.4) {
          for (const r of st.resolved) {
            resolvedEver.add(r.prev);
            const ac = scene.ansCells[r.prev];
            ac.valTxt.textContent = String(r.wait);
            ac.valTxt.setAttribute("fill", C.green);
            ac.box.setAttribute("stroke", C.green);
            ac.box.setAttribute("fill", "#13261B");
          }
          renderStack(st.stackAfter);
          styleDays(st.stackAfter, resolvedEver, -1);
        }
      });

      prevEq = scene.eqs[idx];
      prevAct = scene.actions[idx];
    });

    const lastEq = prevEq;
    const lastAct = prevAct;
    tl.add(0.4, u => {
      const e = easeOut(u);
      if (lastEq) setOpacity(lastEq, 1 - e);
      if (lastAct) setOpacity(lastAct, 1 - e);
      setOpacity(scene.cursorPtr, 1 - e);
    });

    tl.line(10);
    tl.add(0.3, u => setOpacity(scene.bannerBox, easeOut(u)));
    tl.add(0.55, wBanner);
    tl.add(0.65, wComplex);
    tl.wait(0.6);
  },
};

function simulate(temperatures) {
  const n = temperatures.length;
  const answer = new Array(n).fill(0);
  const stack = [];
  const steps = [];

  for (let day = 0; day < n; day++) {
    const temp = temperatures[day];
    const topBefore = stack.length > 0 ? stack[stack.length - 1] : null;
    const resolved = [];

    while (stack.length > 0 && temperatures[stack[stack.length - 1]] < temp) {
      const prev = stack.pop();
      const wait = day - prev;
      answer[prev] = wait;
      resolved.push({ prev, prevTemp: temperatures[prev], wait });
    }

    stack.push(day);
    const stackAfter = stack.slice();

    const actionText = resolved.length > 0
      ? `updated ${resolved.map(r => `answer[${r.prev}] = ${r.wait}`).join(", ")} · push d${day}:${temp}°`
      : `push d${day}:${temp}° onto decreasing stack (stack depth = ${stack.length})`;

    steps.push({
      day,
      temp,
      topBefore,
      resolved,
      stackAfter,
      actionText,
    });
  }

  return { steps, answer };
}
