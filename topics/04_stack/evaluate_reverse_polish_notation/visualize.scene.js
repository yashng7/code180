/* Evaluate Reverse Polish Notation — animated walkthrough scene (3Blue1Brown style).
 *
 * Scan postfix `tokens` left to right. Push integer operands onto the stack.
 * Whenever an operator `+`, `-`, `*`, `/` arrives, pop the top two values `b`
 * (right) and `a` (left), evaluate `a op b` (truncating division toward zero),
 * and push the result back onto the stack.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Evaluate Reverse Polish Notation",
    subtitle: "postfix evaluation stack · pop b, a then push a op b · O(n) time · O(n) space",
    inputs: [
      { id: "tokens", label: "tokens", type: "text", default: "4, 13, 5, /, +", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "operand on stack" },
      { color: "#F0AC5F", text: "operator token" },
      { color: "#83C167", text: "newly computed result" },
    ],
  },

  code: [
    "def eval_rpn(tokens: List[str]) -> int:",
    "    stack: list[int] = []",
    "    for token in tokens:",
    "        if token == \"+\":",
    "            b, a = stack.pop(), stack.pop()",
    "            stack.append(a + b)",
    "        elif token == \"-\":",
    "            b, a = stack.pop(), stack.pop()",
    "            stack.append(a - b)",
    "        elif token == \"*\":",
    "            b, a = stack.pop(), stack.pop()",
    "            stack.append(a * b)",
    "        elif token == \"/\":",
    "            b, a = stack.pop(), stack.pop()",
    "            stack.append(int(a / b))",
    "        else:",
    "            stack.append(int(token))",
    "    return stack[-1]",
  ],

  read(values) {
    const raw = (values.tokens || "").trim();
    if (!raw) return null;
    const tokens = raw.split(/[\s,]+/).filter(Boolean).map(t => t.replace(/^["']|["']$/g, ""));
    if (tokens.length < 1 || tokens.length > 13) return null;
    if (!validateRpn(tokens)) return null;
    return { tokens };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const tokens = args[0].map(String);
      if (tokens.length >= 1 && tokens.length <= 13 && validateRpn(tokens)) {
        return { tokens: tokens.join(", ") };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const { tokens } = params;
    const n = tokens.length;
    const sim = simulate(tokens);

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
      tokens, sim, ctx,
      cells: [], stackSlots: [], eqs: [], actions: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title + subtitle -------------------------------------------------
    scene.title = txt("Evaluate Reverse Polish Notation", {
      x: 64, y: 72, "font-size": 40, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    const sub = el("text", { x: 64, y: 110, "font-size": 22, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "tokens = [";
    el("tspan", { fill: C.white }, sub).textContent = tokens.map(t => `"${t}"`).join(", ");
    el("tspan", {}, sub).textContent = "]";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- token array row --------------------------------------------------
    const rowY = 220;
    const cellW = clamp(Math.floor(980 / n) - 8, 54, 78);
    const cellH = 66;
    const pitch = cellW + 8;
    const totalW = n * pitch - 8;
    const startX = STAGE_W / 2 - totalW / 2;

    for (let i = 0; i < n; i++) {
      const x = startX + i * pitch;
      const cx = x + cellW / 2;
      const isOp = isOperator(tokens[i]);
      const g = el("g", {}, chipsL);
      setOpacity(g, 0);

      const box = el("rect", {
        x, y: rowY - cellH / 2, width: cellW, height: cellH, rx: 8,
        fill: C.cellBg, stroke: isOp ? C.gold : C.cellStroke, "stroke-width": 2,
      }, g);

      const chTxt = txt(tokens[i], {
        x: cx, y: rowY, "font-size": 26, fill: isOp ? C.gold : C.white,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);

      const idxTxt = txt(String(i), {
        x: cx, y: rowY + cellH / 2 + 22, "font-size": 15, fill: C.grey,
        "text-anchor": "middle",
      }, g);

      scene.cells.push({ g, box, chTxt, idxTxt, x, cx, w: cellW, tok: tokens[i], isOp });
    }

    // -- cursor pointer ---------------------------------------------------
    const ptrG = el("g", {}, ptrL);
    setOpacity(ptrG, 0);
    el("polygon", {
      points: "-9,-16 9,-16 0,-2",
      fill: C.gold, filter: "url(#glow-gold)",
    }, ptrG);
    txt("token", {
      x: 0, y: -24, "font-size": 17, fill: C.gold, "text-anchor": "middle",
    }, ptrG);
    scene.cursorPtr = ptrG;

    // -- operand stack row ------------------------------------------------
    const stY = 358;
    scene.stackLabel = txt("operand stack :", {
      x: 110, y: stY, "font-size": 21, fill: C.grey,
      "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.stackLabel, 0);

    const slotW = 78;
    const slotGap = 12;
    const stStartX = 295;
    for (let k = 0; k < n; k++) {
      const bx = stStartX + k * (slotW + slotGap);
      const g = el("g", {}, arcsL);
      setOpacity(g, 0);
      const rect = el("rect", {
        x: bx, y: stY - 25, width: slotW, height: 50, rx: 8,
        fill: "#142636", stroke: C.blue, "stroke-width": 2.2,
      }, g);
      const label = txt("", {
        x: bx + slotW / 2, y: stY, "font-size": 23, fill: C.white,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);
      scene.stackSlots.push({ g, rect, label });
    }

    // -- per-step equation & action notes ---------------------------------
    sim.steps.forEach(st => {
      const eq = el("text", {
        x: STAGE_W / 2, y: 452, "font-size": 26, fill: C.white,
        "text-anchor": "middle",
      }, textL);
      if (st.kind === "push") {
        el("tspan", { fill: C.blue }, eq).textContent = `token "${st.tok}"`;
        el("tspan", { fill: C.grey }, eq).textContent = `   →   push operand `;
        el("tspan", { fill: C.white }, eq).textContent = String(st.val);
      } else {
        el("tspan", { fill: C.gold }, eq).textContent = `operator "${st.tok}"`;
        el("tspan", { fill: C.grey }, eq).textContent =
          `   →   pop b = ${st.b}, a = ${st.a}   →   ${st.a} ${st.tok} ${st.b} = `;
        el("tspan", { fill: C.green }, eq).textContent = String(st.res);
      }
      scene.eqs.push(eq);

      const act = txt(st.actionText, {
        x: STAGE_W / 2, y: 498, "font-size": 22,
        fill: st.kind === "op" ? C.green : C.grey,
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
      `return ${sim.finalVal}   (single value remaining on stack)`,
      {
        x: STAGE_W / 2, y: bY, "font-size": 27, fill: C.green,
        "text-anchor": "middle", "dominant-baseline": "central",
      },
      resultL
    );

    scene.complexity = txt(
      "Single pass over postfix tokens · O(n) time · O(n) operand stack space",
      { x: STAGE_W / 2, y: 668, "font-size": 20, fill: C.grey, "text-anchor": "middle" },
      resultL
    );

    // -- reset ------------------------------------------------------------
    scene.reset = () => {
      setOpacity(scene.title, 0);
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.cursorPtr, 0);
      setOpacity(scene.stackLabel, 0);
      setOpacity(scene.bannerBox, 0);
      if (scene.cells[0]) {
        setTranslate(scene.cursorPtr, scene.cells[0].cx, rowY - cellH / 2 - 10);
      }
      for (const c of scene.cells) {
        setOpacity(c.g, 0);
        c.box.setAttribute("fill", C.cellBg);
        c.box.setAttribute("stroke", c.isOp ? C.gold : C.cellStroke);
      }
      for (const sl of scene.stackSlots) {
        setOpacity(sl.g, 0);
        sl.rect.setAttribute("stroke", C.blue);
        sl.rect.setAttribute("fill", "#142636");
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
    const ptrY = 220 - 33 - 10;

    const wTitle = scene.writer(scene.title);
    const wEqs = scene.eqs.map(scene.writer);
    const wActs = scene.actions.map(scene.writer);
    const wBanner = scene.writer(scene.bannerText);
    const wComplex = scene.writer(scene.complexity);

    scene.reset();

    const opLine = { "+": 4, "-": 7, "*": 10, "/": 13 };

    const renderStack = (arr, isComputedTop) => {
      scene.stackSlots.forEach((sl, idx) => {
        if (idx < arr.length) {
          sl.label.textContent = String(arr[idx]);
          const topComputed = isComputedTop && idx === arr.length - 1;
          sl.rect.setAttribute("stroke", topComputed ? C.green : C.blue);
          sl.rect.setAttribute("fill", topComputed ? "#15281E" : "#142636");
          setOpacity(sl.g, 1);
        } else {
          setOpacity(sl.g, 0);
        }
      });
    };

    // 1. Title + subtitle + token cells
    tl.line(1);
    tl.add(0.75, wTitle);
    tl.add(0.45, u => setOpacity(scene.subtitle, easeOut(u)));
    tl.line(2);
    tl.add(0.65, u => {
      setOpacity(scene.stackLabel, easeOut(u));
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
      const cCur = scene.cells[st.i];
      const cPrev = idx === 0 ? cCur : scene.cells[sim.steps[idx - 1].i];
      const fadingEq = prevEq;
      const fadingAct = prevAct;

      tl.line(3);
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

      const branchLine = st.kind === "op" ? opLine[st.tok] : -1;
      tl.line(branchLine >= 0
        ? [branchLine, branchLine + 1, branchLine + 2]
        : [4, 7, 10, 13, 16]);
      tl.add(0.52, wEqs[idx]);
      if (branchLine < 0) tl.line(17);
      tl.add(0.48, wActs[idx]);

      tl.add(0.32, u => {
        if (u > 0.4) {
          renderStack(st.stackAfter, st.kind === "op");
          cCur.box.setAttribute("stroke", st.kind === "op" ? C.green : C.blue);
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
      setOpacity(scene.cursorPtr, 1 - e);
    });

    tl.line(18);
    tl.add(0.3, u => setOpacity(scene.bannerBox, easeOut(u)));
    tl.add(0.55, wBanner);
    tl.add(0.65, wComplex);
    tl.wait(0.6);
  },
};

function isOperator(t) {
  return t === "+" || t === "-" || t === "*" || t === "/";
}

function validateRpn(tokens) {
  let depth = 0;
  for (const t of tokens) {
    if (isOperator(t)) {
      if (depth < 2) return false;
      depth -= 1;
    } else if (/^-?\d+$/.test(t)) {
      depth += 1;
    } else {
      return false;
    }
  }
  return depth === 1;
}

function simulate(tokens) {
  const stack = [];
  const steps = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (isOperator(tok)) {
      const b = stack.pop();
      const a = stack.pop();
      let res = 0;
      if (tok === "+") res = a + b;
      else if (tok === "-") res = a - b;
      else if (tok === "*") res = a * b;
      else if (tok === "/") res = Math.trunc(a / b);
      stack.push(res);

      steps.push({
        i,
        tok,
        kind: "op",
        a,
        b,
        res,
        stackAfter: stack.slice(),
        actionText: `push result ${res} → stack = [${stack.join(", ")}]`,
      });
    } else {
      const val = Number(tok);
      stack.push(val);
      steps.push({
        i,
        tok,
        kind: "push",
        val,
        stackAfter: stack.slice(),
        actionText: `stack = [${stack.join(", ")}]`,
      });
    }
  }

  return { steps, finalVal: stack[0] };
}
