/* Valid Parentheses — animated walkthrough scene (3Blue1Brown style).
 *
 * Scan the bracket string `s` left to right. Opening brackets `(`, `[`, `{`
 * push onto the stack. Closing brackets `)`, `]`, `}` check the top of the
 * stack: if it matches the corresponding opener, pop the pair in green;
 * otherwise report a mismatch in red. At the end, the string is valid iff
 * the stack is completely empty.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Valid Parentheses",
    subtitle: "stack of open brackets · match & pop on close · O(n) time · O(n) space",
    inputs: [
      { id: "s", label: "s", type: "text", default: "({[]})", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "push opening bracket" },
      { color: "#F0AC5F", text: "current character" },
      { color: "#83C167", text: "matched pair popped" },
      { color: "#FC6255", text: "mismatch / unclosed" },
    ],
  },

  code: [
    "def is_valid(s: str) -> bool:",
    "    pairs: Dict[str, str] = {\")\": \"(\", \"]\": \"[\", \"}\": \"{\"}",
    "    stack: list[str] = []",
    "    for char in s:",
    "        if char in pairs:",
    "            if not stack or stack.pop() != pairs[char]:",
    "                return False",
    "        else:",
    "            stack.append(char)",
    "    return not stack",
  ],

  read(values) {
    const s = (values.s || "").trim();
    if (s.length < 1 || s.length > 14) return null;
    if (!/^[()[\]{}]+$/.test(s)) return null;
    return { s };
  },

  fromArgs(args) {
    if (Array.isArray(args) && typeof args[0] === "string") {
      const s = args[0].trim();
      if (s.length >= 1 && s.length <= 14 && /^[()[\]{}]+$/.test(s)) {
        return { s };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const { s } = params;
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
      cells: [], stackSlots: [], eqs: [], actions: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title + subtitle -------------------------------------------------
    scene.title = txt("Valid Parentheses", {
      x: 64, y: 72, "font-size": 44, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    const sub = el("text", { x: 64, y: 110, "font-size": 22, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = 's = "';
    el("tspan", { fill: C.white }, sub).textContent = s;
    el("tspan", {}, sub).textContent = '"';
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- input string cells -----------------------------------------------
    const rowY = 220;
    const cellW = clamp(Math.floor(960 / n) - 8, 52, 74);
    const cellH = 68;
    const pitch = cellW + 8;
    const totalW = n * pitch - 8;
    const startX = STAGE_W / 2 - totalW / 2;

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
        x: cx, y: rowY, "font-size": 30, fill: C.white,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);

      const idxTxt = txt(String(i), {
        x: cx, y: rowY + cellH / 2 + 22, "font-size": 15, fill: C.grey,
        "text-anchor": "middle",
      }, g);

      scene.cells.push({ g, box, chTxt, idxTxt, x, cx, w: cellW, ch: s[i] });
    }

    // -- cursor pointer ---------------------------------------------------
    const ptrG = el("g", {}, ptrL);
    setOpacity(ptrG, 0);
    el("polygon", {
      points: "-9,-16 9,-16 0,-2",
      fill: C.gold, filter: "url(#glow-gold)",
    }, ptrG);
    txt("i", {
      x: 0, y: -24, "font-size": 18, fill: C.gold, "text-anchor": "middle",
    }, ptrG);
    scene.cursorPtr = ptrG;

    // -- stack tray row ---------------------------------------------------
    const stY = 358;
    scene.stackLabel = txt("stack (bottom → top) :", {
      x: 110, y: stY, "font-size": 21, fill: C.grey,
      "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.stackLabel, 0);

    scene.emptyLabel = txt("[ empty ]", {
      x: 365, y: stY, "font-size": 20, fill: C.dim,
      "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.emptyLabel, 0);

    const slotW = 64;
    const slotGap = 10;
    const stStartX = 350;
    for (let k = 0; k < n; k++) {
      const bx = stStartX + k * (slotW + slotGap);
      const g = el("g", {}, arcsL);
      setOpacity(g, 0);
      const rect = el("rect", {
        x: bx, y: stY - 26, width: slotW, height: 52, rx: 8,
        fill: "#142636", stroke: C.blue, "stroke-width": 2.2,
      }, g);
      const label = txt("", {
        x: bx + slotW / 2, y: stY, "font-size": 26, fill: C.white,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);
      scene.stackSlots.push({ g, rect, label });
    }

    // -- per-step equation + action notes ---------------------------------
    sim.steps.forEach(st => {
      const eq = el("text", {
        x: STAGE_W / 2, y: 452, "font-size": 26, fill: C.white,
        "text-anchor": "middle",
      }, textL);
      el("tspan", { fill: C.gold }, eq).textContent = `s[${st.i}] = '${st.ch}'`;
      if (st.kind === "push") {
        el("tspan", { fill: C.blue }, eq).textContent =
          `   →   opening bracket : push '${st.ch}' onto stack`;
      } else if (st.kind === "match") {
        el("tspan", { fill: C.green }, eq).textContent =
          `   →   closing bracket matches top '${st.topBefore}' : pop()`;
      } else {
        el("tspan", { fill: C.red }, eq).textContent =
          st.topBefore === null
            ? `   →   closing '${st.ch}' on empty stack : mismatch!`
            : `   →   expected '${st.expected}' for '${st.ch}', but top is '${st.topBefore}'!`;
      }
      scene.eqs.push(eq);

      const act = txt(st.actionText, {
        x: STAGE_W / 2, y: 498, "font-size": 22,
        fill: st.kind === "mismatch" ? C.red : (st.kind === "match" ? C.green : C.grey),
        "text-anchor": "middle",
      }, textL);
      scene.actions.push(act);
    });

    // -- final banner -----------------------------------------------------
    const bY = 595;
    const ok = sim.valid;
    scene.bannerBox = el("rect", {
      x: 240, y: bY - 36, width: 800, height: 70, rx: 12,
      fill: ok ? "#13261B" : "#2A1417",
      stroke: ok ? C.green : C.red, "stroke-width": 2.5,
      filter: ok ? "url(#glow-green)" : "url(#glow-red)",
    }, resultL);
    setOpacity(scene.bannerBox, 0);

    scene.bannerText = txt(sim.bannerMsg, {
      x: STAGE_W / 2, y: bY, "font-size": 26, fill: ok ? C.green : C.red,
      "text-anchor": "middle", "dominant-baseline": "central",
    }, resultL);

    scene.complexity = txt(
      "Every bracket pushed and popped at most once · O(n) time · O(n) space",
      { x: STAGE_W / 2, y: 668, "font-size": 20, fill: C.grey, "text-anchor": "middle" },
      resultL
    );

    // -- reset ------------------------------------------------------------
    scene.reset = () => {
      setOpacity(scene.title, 0);
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.cursorPtr, 0);
      setOpacity(scene.stackLabel, 0);
      setOpacity(scene.emptyLabel, 0);
      setOpacity(scene.bannerBox, 0);
      if (scene.cells[0]) {
        setTranslate(scene.cursorPtr, scene.cells[0].cx, rowY - cellH / 2 - 10);
      }
      for (const c of scene.cells) {
        setOpacity(c.g, 0);
        c.box.setAttribute("fill", C.cellBg);
        c.box.setAttribute("stroke", C.cellStroke);
      }
      for (const sl of scene.stackSlots) {
        setOpacity(sl.g, 0);
        sl.rect.setAttribute("stroke", C.blue);
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
    const ptrY = 220 - 34 - 10;

    const wTitle = scene.writer(scene.title);
    const wEqs = scene.eqs.map(scene.writer);
    const wActs = scene.actions.map(scene.writer);
    const wBanner = scene.writer(scene.bannerText);
    const wComplex = scene.writer(scene.complexity);

    scene.reset();

    const renderStack = (arr, highlightTopColor) => {
      setOpacity(scene.emptyLabel, arr.length === 0 ? 1 : 0);
      scene.stackSlots.forEach((sl, idx) => {
        if (idx < arr.length) {
          sl.label.textContent = arr[idx];
          const isTop = idx === arr.length - 1;
          sl.rect.setAttribute("stroke", isTop && highlightTopColor ? highlightTopColor : C.blue);
          setOpacity(sl.g, 1);
        } else {
          setOpacity(sl.g, 0);
        }
      });
    };

    // 1. Title + subtitle + cells reveal
    tl.line(1);
    tl.add(0.75, wTitle);
    tl.add(0.45, u => setOpacity(scene.subtitle, easeOut(u)));
    tl.line([2, 3]);
    tl.add(0.65, u => {
      setOpacity(scene.stackLabel, easeOut(u));
      setOpacity(scene.emptyLabel, easeOut(u));
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

      tl.line(4);
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

      if (st.kind === "push") {
        tl.line([5, 8]);
        tl.add(0.52, wEqs[idx]);
        tl.line(9);
        tl.add(0.48, wActs[idx]);
      } else if (st.kind === "match") {
        tl.line([5, 6]);
        tl.add(0.52, wEqs[idx]);
        tl.add(0.48, wActs[idx]);
      } else {
        tl.line([5, 6]);
        tl.add(0.52, wEqs[idx]);
        tl.line(7);
        tl.add(0.48, wActs[idx]);
      }

      tl.add(0.32, u => {
        if (u > 0.4) {
          if (st.kind === "push") {
            cCur.box.setAttribute("stroke", C.blue);
            cCur.box.setAttribute("fill", "#142636");
            renderStack(st.stackAfter, C.blue);
          } else if (st.kind === "match") {
            cCur.box.setAttribute("stroke", C.green);
            cCur.box.setAttribute("fill", "#15281E");
            if (st.matchedIdx >= 0) {
              scene.cells[st.matchedIdx].box.setAttribute("stroke", C.green);
              scene.cells[st.matchedIdx].box.setAttribute("fill", "#15281E");
            }
            renderStack(st.stackAfter, C.green);
          } else {
            cCur.box.setAttribute("stroke", C.red);
            cCur.box.setAttribute("fill", "#2C1418");
            renderStack(st.stackAfter, C.red);
          }
        }
      });

      prevEq = scene.eqs[idx];
      prevAct = scene.actions[idx];
    });

    const failed = sim.steps.some(st => st.kind === "mismatch");
    if (!failed) tl.line(10);

    const lastEq = prevEq;
    const lastAct = prevAct;
    tl.add(0.4, u => {
      const e = easeOut(u);
      if (lastEq) setOpacity(lastEq, 1 - e);
      if (lastAct) setOpacity(lastAct, 1 - e);
      setOpacity(scene.cursorPtr, 1 - e);
    });

    tl.add(0.3, u => setOpacity(scene.bannerBox, easeOut(u)));
    tl.add(0.55, wBanner);
    tl.add(0.65, wComplex);
    tl.wait(0.6);
  },
};

function simulate(s) {
  const pairs = { ")": "(", "]": "[", "}": "{" };
  const stack = [];
  const idxStack = [];
  const steps = [];

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (Object.prototype.hasOwnProperty.call(pairs, ch)) {
      const expected = pairs[ch];
      const topBefore = stack.length > 0 ? stack[stack.length - 1] : null;
      if (topBefore === expected) {
        stack.pop();
        const matchedIdx = idxStack.pop();
        steps.push({
          i,
          ch,
          kind: "match",
          expected,
          topBefore,
          matchedIdx,
          stackAfter: stack.slice(),
          actionText: `matched '${topBefore}${ch}' (indices ${matchedIdx} & ${i}) · stack depth now ${stack.length}`,
        });
      } else {
        steps.push({
          i,
          ch,
          kind: "mismatch",
          expected,
          topBefore,
          matchedIdx: -1,
          stackAfter: stack.slice(),
          actionText: topBefore === null
            ? `cannot close '${ch}' because stack is empty → return False`
            : `top '${topBefore}' does not match '${ch}' → return False`,
        });
        return {
          steps,
          valid: false,
          bannerMsg: `return False   (mismatch at index ${i}: '${ch}')`,
        };
      }
    } else {
      stack.push(ch);
      idxStack.push(i);
      steps.push({
        i,
        ch,
        kind: "push",
        expected: null,
        topBefore: null,
        matchedIdx: -1,
        stackAfter: stack.slice(),
        actionText: `stack = [${stack.map(x => `'${x}'`).join(", ")}] (depth ${stack.length})`,
      });
    }
  }

  const valid = stack.length === 0;
  const bannerMsg = valid
    ? `return True   (all ${s.length / 2} bracket pair(s) matched & stack is empty)`
    : `return False   (${stack.length} unclosed bracket(s) remain on stack: [${stack.join(", ")}])`;

  return { steps, valid, bannerMsg };
}
