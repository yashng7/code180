/* Min Stack — animated walkthrough scene (3Blue1Brown style).
 *
 * Show the operation sequence across the top and two synchronized horizontal
 * stacks below: `_stack` (main values, blue) and `_mins` (running minimums at
 * each depth, green). Every `push(v)` pushes `v` onto `_stack` and
 * `min(v, _mins[-1])` onto `_mins`; every `pop()` pops both in lockstep so
 * `getMin()` is always an O(1) peek of `_mins[-1]`.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Min Stack",
    subtitle: "parallel minimums stack · O(1) push, pop, top, getMin · O(n) space",
    inputs: [
      {
        id: "ops",
        label: "operations",
        type: "text",
        default: "push(-2), push(0), push(-3), getMin(), pop(), top(), getMin()",
        width: "wide",
      },
    ],
    legend: [
      { color: "#58C4DD", text: "_stack (values)" },
      { color: "#83C167", text: "_mins (running minimums)" },
      { color: "#F0AC5F", text: "active operation" },
      { color: "#5CD0B3", text: "O(1) query result" },
    ],
  },

  code: [
    "class MinStack:",
    "    def __init__(self) -> None:",
    "        self._stack: list[int] = []",
    "        self._mins: list[int] = []",
    "    def push(self, val: int) -> None:",
    "        self._stack.append(val)",
    "        if self._mins:",
    "            self._mins.append(min(val, self._mins[-1]))",
    "        else:",
    "            self._mins.append(val)",
    "    def pop(self) -> None:",
    "        self._stack.pop()",
    "        self._mins.pop()",
    "    def top(self) -> int:",
    "        return self._stack[-1]",
    "    def getMin(self) -> int:",
    "        return self._mins[-1]",
  ],

  read(values) {
    const raw = (values.ops || "").trim();
    if (!raw) return null;
    const parts = raw.split(/\s*,\s*/).filter(Boolean);
    if (parts.length < 1 || parts.length > 11) return null;
    const cmds = [];
    for (const p of parts) {
      let m = p.match(/^push\(\s*(-?\d+)\s*\)$/i);
      if (m) {
        cmds.push({ op: "push", val: Number(m[1]), label: `push(${m[1]})` });
        continue;
      }
      if (/^pop\(\s*\)$/i.test(p)) {
        cmds.push({ op: "pop", val: null, label: "pop()" });
        continue;
      }
      if (/^top\(\s*\)$/i.test(p)) {
        cmds.push({ op: "top", val: null, label: "top()" });
        continue;
      }
      if (/^getmin\(\s*\)$/i.test(p)) {
        cmds.push({ op: "getMin", val: null, label: "getMin()" });
        continue;
      }
      return null;
    }
    return { cmds };
  },

  fromArgs(args) {
    const spec = Array.isArray(args) ? args[0] : args;
    if (spec && Array.isArray(spec.ops) && Array.isArray(spec.vals)) {
      const tokens = [];
      for (let i = 0; i < spec.ops.length; i++) {
        const op = spec.ops[i];
        const v = spec.vals[i] || [];
        if (op === "MinStack") continue;
        if (op === "push") tokens.push(`push(${v[0]})`);
        else if (op === "pop") tokens.push("pop()");
        else if (op === "top") tokens.push("top()");
        else if (op === "getMin") tokens.push("getMin()");
      }
      if (tokens.length >= 1 && tokens.length <= 11) {
        return { ops: tokens.join(", ") };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const { cmds } = params;
    const n = cmds.length;
    const sim = simulate(cmds);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-teal", C.teal);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const arcsL = ctx.layer("arcs");
    const chipsL = ctx.layer("chips");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = {
      cmds, sim, ctx,
      opCells: [], mainSlots: [], minSlots: [], eqs: [], actions: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title + subtitle -------------------------------------------------
    scene.title = txt("Min Stack", {
      x: 64, y: 72, "font-size": 44, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    const sub = txt(
      "Parallel _stack & _mins keep getMin() at O(1) even after pops",
      { x: 64, y: 110, "font-size": 21, fill: C.grey },
      textL
    );
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- operation ribbon -------------------------------------------------
    const opY = 195;
    const opW = clamp(Math.floor(1080 / n) - 8, 86, 132);
    const opH = 54;
    const pitch = opW + 8;
    const totalW = n * pitch - 8;
    const startX = STAGE_W / 2 - totalW / 2;

    for (let i = 0; i < n; i++) {
      const x = startX + i * pitch;
      const cx = x + opW / 2;
      const g = el("g", {}, chipsL);
      setOpacity(g, 0);

      const box = el("rect", {
        x, y: opY - opH / 2, width: opW, height: opH, rx: 8,
        fill: C.cellBg, stroke: C.cellStroke, "stroke-width": 2,
      }, g);

      const lbl = txt(cmds[i].label, {
        x: cx, y: opY, "font-size": 18, fill: C.white,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);

      const retTxt = txt("", {
        x: cx, y: opY + opH / 2 + 20, "font-size": 16, fill: C.teal,
        "text-anchor": "middle",
      }, g);

      scene.opCells.push({ g, box, lbl, retTxt, x, cx, w: opW });
    }

    // -- pointer over active operation -----------------------------------
    const ptrG = el("g", {}, ptrL);
    setOpacity(ptrG, 0);
    el("polygon", {
      points: "-8,-14 8,-14 0,-2",
      fill: C.gold, filter: "url(#glow-gold)",
    }, ptrG);
    scene.opPtr = ptrG;

    // -- parallel stacks: _stack (y=305) and _mins (y=375) ----------------
    const mainY = 305;
    const minY = 375;
    scene.mainLabel = txt("_stack (values) :", {
      x: 110, y: mainY, "font-size": 21, fill: C.blue,
      "dominant-baseline": "central",
    }, textL);
    scene.minLabel = txt("_mins  (min ≤ i) :", {
      x: 110, y: minY, "font-size": 21, fill: C.green,
      "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.mainLabel, 0);
    setOpacity(scene.minLabel, 0);

    const slotW = 78;
    const slotGap = 12;
    const stStartX = 320;
    for (let k = 0; k < n; k++) {
      const bx = stStartX + k * (slotW + slotGap);

      const gMain = el("g", {}, arcsL);
      setOpacity(gMain, 0);
      const rMain = el("rect", {
        x: bx, y: mainY - 24, width: slotW, height: 48, rx: 8,
        fill: "#142636", stroke: C.blue, "stroke-width": 2,
      }, gMain);
      const tMain = txt("", {
        x: bx + slotW / 2, y: mainY, "font-size": 22, fill: C.white,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, gMain);
      scene.mainSlots.push({ g: gMain, rect: rMain, label: tMain });

      const gMin = el("g", {}, arcsL);
      setOpacity(gMin, 0);
      const rMin = el("rect", {
        x: bx, y: minY - 24, width: slotW, height: 48, rx: 8,
        fill: "#15281E", stroke: C.green, "stroke-width": 2,
      }, gMin);
      const tMin = txt("", {
        x: bx + slotW / 2, y: minY, "font-size": 22, fill: C.green,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, gMin);
      scene.minSlots.push({ g: gMin, rect: rMin, label: tMin });
    }

    // -- per-step equation & action notes ---------------------------------
    sim.steps.forEach(st => {
      const eq = el("text", {
        x: STAGE_W / 2, y: 458, "font-size": 26, fill: C.white,
        "text-anchor": "middle",
      }, textL);
      el("tspan", { fill: C.gold }, eq).textContent = st.label;
      el("tspan", { fill: C.grey }, eq).textContent = `   →   `;
      el("tspan", { fill: st.op === "getMin" ? C.green : C.white }, eq).textContent = st.formula;
      scene.eqs.push(eq);

      const act = txt(st.actionText, {
        x: STAGE_W / 2, y: 502, "font-size": 22,
        fill: st.op === "getMin" || st.op === "top" ? C.teal : C.grey,
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

    const outStr = sim.outputs.map(v => (v === null ? "null" : String(v))).join(", ");
    scene.bannerText = txt(`outputs = [${outStr}]`, {
      x: STAGE_W / 2, y: bY, "font-size": 25, fill: C.green,
      "text-anchor": "middle", "dominant-baseline": "central",
    }, resultL);

    scene.complexity = txt(
      "Both stacks push & pop in lockstep · O(1) time per operation · O(n) space",
      { x: STAGE_W / 2, y: 668, "font-size": 20, fill: C.grey, "text-anchor": "middle" },
      resultL
    );

    // -- reset ------------------------------------------------------------
    scene.reset = () => {
      setOpacity(scene.title, 0);
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.opPtr, 0);
      setOpacity(scene.mainLabel, 0);
      setOpacity(scene.minLabel, 0);
      setOpacity(scene.bannerBox, 0);
      if (scene.opCells[0]) {
        setTranslate(scene.opPtr, scene.opCells[0].cx, opY - opH / 2 - 6);
      }
      for (const c of scene.opCells) {
        setOpacity(c.g, 0);
        c.box.setAttribute("fill", C.cellBg);
        c.box.setAttribute("stroke", C.cellStroke);
        c.retTxt.textContent = "";
      }
      for (const sl of scene.mainSlots) {
        setOpacity(sl.g, 0);
        sl.label.textContent = "";
      }
      for (const sl of scene.minSlots) {
        setOpacity(sl.g, 0);
        sl.label.textContent = "";
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
    const ptrY = 195 - 27 - 6;

    const wTitle = scene.writer(scene.title);
    const wEqs = scene.eqs.map(scene.writer);
    const wActs = scene.actions.map(scene.writer);
    const wBanner = scene.writer(scene.bannerText);
    const wComplex = scene.writer(scene.complexity);

    scene.reset();

    const renderStacks = (mainArr, minArr) => {
      scene.mainSlots.forEach((sl, idx) => {
        if (idx < mainArr.length) {
          sl.label.textContent = String(mainArr[idx]);
          setOpacity(sl.g, 1);
        } else {
          setOpacity(sl.g, 0);
        }
      });
      scene.minSlots.forEach((sl, idx) => {
        if (idx < minArr.length) {
          sl.label.textContent = String(minArr[idx]);
          setOpacity(sl.g, 1);
        } else {
          setOpacity(sl.g, 0);
        }
      });
    };

    // 1. Title + subtitle + operations reveal
    tl.line(1);
    tl.add(0.75, wTitle);
    tl.add(0.45, u => setOpacity(scene.subtitle, easeOut(u)));
    tl.line([2, 3, 4]);
    tl.add(0.65, u => {
      setOpacity(scene.mainLabel, easeOut(u));
      setOpacity(scene.minLabel, easeOut(u));
      scene.opCells.forEach((c, i) => {
        const start = i * 0.05;
        const p = clamp((u - start) / Math.max(0.25, 1 - start), 0, 1);
        setOpacity(c.g, easeOut(p));
      });
    });
    tl.wait(0.2);

    let prevEq = null;
    let prevAct = null;
    const methodLine = { push: 5, pop: 11, top: 14, getMin: 16 };

    sim.steps.forEach((st, idx) => {
      const cCur = scene.opCells[idx];
      const cPrev = idx === 0 ? cCur : scene.opCells[idx - 1];
      const fadingEq = prevEq;
      const fadingAct = prevAct;

      tl.line(methodLine[st.op]);
      tl.add(0.42, u => {
        const e = easeInOut(u);
        if (fadingEq) setOpacity(fadingEq, 1 - e);
        if (fadingAct) setOpacity(fadingAct, 1 - e);
        setTranslate(scene.opPtr, lerp(cPrev.cx, cCur.cx, e), ptrY);
        setOpacity(scene.opPtr, 1);
        if (u > 0.5) {
          cCur.box.setAttribute("stroke", C.gold);
          cCur.box.setAttribute("fill", "#262015");
        }
      });

      if (st.op === "push") {
        tl.line([6, 7]);
        tl.add(0.52, wEqs[idx]);
        tl.line(st.minsAfter.length === 1 ? [9, 10] : 8);
        tl.add(0.48, wActs[idx]);
      } else if (st.op === "pop") {
        tl.line([12, 13]);
        tl.add(0.52, wEqs[idx]);
        tl.add(0.48, wActs[idx]);
      } else {
        tl.line(st.op === "top" ? 15 : 17);
        tl.add(0.52, wEqs[idx]);
        tl.add(0.48, wActs[idx]);
      }

      tl.add(0.32, u => {
        if (u > 0.4) {
          renderStacks(st.stackAfter, st.minsAfter);
          if (st.ret !== null) {
            cCur.retTxt.textContent = `→ ${st.ret}`;
            cCur.box.setAttribute("stroke", C.teal);
          } else {
            cCur.box.setAttribute("stroke", C.blue);
          }
          cCur.box.setAttribute("fill", C.cellBg);
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
      setOpacity(scene.opPtr, 1 - e);
    });

    tl.add(0.3, u => setOpacity(scene.bannerBox, easeOut(u)));
    tl.add(0.55, wBanner);
    tl.add(0.65, wComplex);
    tl.wait(0.6);
  },
};

function simulate(cmds) {
  const stack = [];
  const mins = [];
  const outputs = [];
  const steps = [];

  for (let i = 0; i < cmds.length; i++) {
    const { op, val, label } = cmds[i];
    let ret = null;
    let formula = "";
    let actionText = "";

    if (op === "push") {
      const prevMin = mins.length > 0 ? mins[mins.length - 1] : val;
      const newMin = Math.min(val, prevMin);
      stack.push(val);
      mins.push(newMin);
      formula = `_stack.push(${val}),  _mins.push(min(${val}, ${prevMin}) = ${newMin})`;
      actionText = `depth = ${stack.length} · current minimum at top of _mins is ${newMin}`;
    } else if (op === "pop") {
      if (stack.length > 0) {
        const pv = stack.pop();
        const pm = mins.pop();
        formula = `pop _stack (${pv}) & pop _mins (${pm})`;
        actionText = mins.length > 0
          ? `previous minimum ${mins[mins.length - 1]} automatically restored at top of _mins!`
          : `both stacks are now empty`;
      } else {
        formula = "stack empty (no-op)";
        actionText = "nothing to pop";
      }
    } else if (op === "top") {
      ret = stack.length > 0 ? stack[stack.length - 1] : 0;
      formula = `return _stack[-1] = ${ret}`;
      actionText = `O(1) peek at top of _stack → ${ret}`;
    } else if (op === "getMin") {
      ret = mins.length > 0 ? mins[mins.length - 1] : 0;
      formula = `return _mins[-1] = ${ret}`;
      actionText = `O(1) peek at top of _mins → ${ret}`;
    }

    outputs.push(ret);
    steps.push({
      i,
      op,
      label,
      ret,
      formula,
      actionText,
      stackAfter: stack.slice(),
      minsAfter: mins.slice(),
    });
  }

  return { steps, outputs };
}
