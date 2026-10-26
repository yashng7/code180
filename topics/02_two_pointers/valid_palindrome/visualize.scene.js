/* Valid Palindrome — animated walkthrough scene (3Blue1Brown style).
 *
 * Draw the characters as a row of chips (punctuation and spaces dimmed), then
 * close two glowing pointers in from both ends, skipping everything that is not
 * a letter or digit. Each compared pair lights blue while we look, then green
 * when it matches or red when it does not — the first mismatch returns False,
 * and pointers that meet/cross return True.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Valid Palindrome",
    subtitle: "two pointers · O(n) time · O(1) space",
    inputs: [
      { id: "s", label: "s", type: "text", default: "A man, a plan, a canal: Panama", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "left pointer" },
      { color: "#F0AC5F", text: "right pointer" },
      { color: "#83C167", text: "match" },
      { color: "#FC6255", text: "mismatch" },
    ],
  },

  code: [
    "def is_palindrome(s: str) -> bool:",
    "    left, right = 0, len(s) - 1",
    "    while left < right:",
    "        while left < right and not s[left].isalnum():",
    "            left += 1",
    "        while left < right and not s[right].isalnum():",
    "            right -= 1",
    "        if s[left].lower() != s[right].lower():",
    "            return False",
    "        left += 1",
    "        right -= 1",
    "    return True",
  ],

  read(values) {
    const s = values.s == null ? "" : String(values.s);
    if (s.length > 40) return null;
    return { s };
  },

  fromArgs(args) {
    if (Array.isArray(args) && args.length >= 1 && typeof args[0] === "string") {
      return { s: args[0] };
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, setScaleAt, STAGE_W } = ctx;
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
    const chipsL = ctx.layer("chips");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = { s, sim, ctx, chips: [], notes: [], pairs: [], _writers: [] };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // title + subtitle
    scene.title = txt("Valid Palindrome", {
      x: 64, y: 80, "font-size": 46, fill: C.white, "letter-spacing": 1,
    }, textL);
    const sub = el("text", { x: 64, y: 122, "font-size": 23, fill: C.grey }, textL);
    el("tspan", { fill: C.grey }, sub).textContent = "s = ";
    el("tspan", { fill: C.white }, sub).textContent = '"' + s + '"';
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- layout ----------------------------------------------------------
    const chipTop = 238, chipH = 84, ptrY = chipTop + chipH + 8;
    scene.ptrY = ptrY;
    const display = ch => (ch === " " ? "␣" : ch);

    if (n === 0) {
      const pos = el("g", { transform: "translate(" + (STAGE_W / 2 - 92) + " " + chipTop + ")" }, chipsL);
      const enter = el("g", {}, pos);
      el("rect", {
        x: 0, y: 0, width: 184, height: chipH, rx: 14, fill: "none",
        stroke: C.greyDark, "stroke-width": 2, "stroke-dasharray": "7 7",
      }, enter);
      txt("∅  empty string", {
        x: 92, y: chipH / 2 + 8, "text-anchor": "middle", "font-size": 24, fill: C.grey,
      }, enter);
      setOpacity(enter, 0);
      scene.chips.push({
        empty: true, enter, scale: enter, cx: 92, cy: chipH / 2,
        gx: STAGE_W / 2,
        charIdle: null, charGreen: null, charRed: null,
        hlBlue: null, hlGreen: null, hlRed: null,
      });
    } else {
      const gap = n > 24 ? 5 : (n > 12 ? 7 : 13);
      const chipW = clamp((1112 - gap * (n - 1)) / n, 20, 84);
      const totalW = n * chipW + (n - 1) * gap;
      const startX = STAGE_W / 2 - totalW / 2;
      const fontSize = clamp(chipW * 0.5, 11, 38);
      scene.chipW = chipW;

      for (let i = 0; i < n; i++) {
        const x = startX + i * (chipW + gap);
        const pos = el("g", { transform: "translate(" + x + " " + chipTop + ")" }, chipsL);
        const enter = el("g", {}, pos);
        const scale = el("g", {}, enter);
        const cx = chipW / 2, cy = chipH / 2;
        const rx = Math.min(13, chipW * 0.3);
        el("rect", {
          x: 0, y: 0, width: chipW, height: chipH, rx,
          fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
        }, scale);
        const mk = fill => txt(display(s[i]), {
          x: cx, y: cy + 1, "text-anchor": "middle", "dominant-baseline": "central",
          "font-size": fontSize, fill,
        }, scale);
        const idle = mk(sim.alnum[i] ? C.white : C.grey);
        const green = mk(C.green);
        const red = mk(C.red);
        setOpacity(green, 0);
        setOpacity(red, 0);
        const hlBlue = el("rect", {
          x: 0, y: 0, width: chipW, height: chipH, rx, fill: "none",
          stroke: C.blue, "stroke-width": 3, filter: "url(#glow-blue)",
        }, scale);
        const hlGreen = el("rect", {
          x: 0, y: 0, width: chipW, height: chipH, rx, fill: "none",
          stroke: C.green, "stroke-width": 3.4, filter: "url(#glow-green)",
        }, scale);
        const hlRed = el("rect", {
          x: 0, y: 0, width: chipW, height: chipH, rx, fill: "none",
          stroke: C.red, "stroke-width": 3.6, filter: "url(#glow-red)",
        }, scale);
        setOpacity(hlBlue, 0);
        setOpacity(hlGreen, 0);
        setOpacity(hlRed, 0);
        txt(String(i), {
          x: cx, y: -14, "text-anchor": "middle", "font-size": 15, fill: C.grey,
        }, enter);
        setOpacity(enter, 0);
        scene.chips.push({
          empty: false, enter, scale, cx, cy, rx, gx: x + cx,
          charIdle: idle, charGreen: green, charRed: red,
          hlBlue, hlGreen, hlRed,
        });
      }
    }

    // -- pointers --------------------------------------------------------
    function buildPointer(color, glowId, label) {
      const g = el("g", {}, ptrL);
      el("path", { d: "M -9 12 L 0 -2 L 9 12 Z", fill: color, filter: "url(#" + glowId + ")" }, g);
      el("line", {
        x1: 0, y1: 12, x2: 0, y2: 36,
        stroke: color, "stroke-width": 3.5, "stroke-linecap": "round",
      }, g);
      txt(label, {
        x: 0, y: 60, "text-anchor": "middle", "font-size": 22,
        fill: color, "font-weight": "bold",
      }, g);
      setOpacity(g, 0);
      return { g };
    }
    scene.leftPtr = buildPointer(C.blue, "glow-blue", "l");
    scene.rightPtr = buildPointer(C.gold, "glow-gold", "r");

    // -- one narration / pair node per step ------------------------------
    const noteColor = kind => {
      if (kind === "match" || kind === "done") return C.green;
      if (kind === "mismatch") return C.red;
      if (kind === "skipL" || kind === "skipR") return C.grey;
      return C.white;
    };

    sim.steps.forEach(step => {
      scene.notes.push(txt(step.message, {
        x: STAGE_W / 2, y: 522, "text-anchor": "middle", "font-size": 24,
        fill: noteColor(step.kind),
      }, textL));

      if (step.pair) {
        const li = step.pair[0], ri = step.pair[1];
        const node = el("text", {
          x: STAGE_W / 2, y: 474, "text-anchor": "middle", "font-size": 26,
        }, textL);
        const part = (str, fill) => {
          const t = el("tspan", fill ? { fill } : {}, node);
          t.textContent = str;
        };
        part("s[" + li + "] = ", C.grey);
        part("'" + s[li] + "'", C.blue);
        part("   vs   ", C.grey);
        part("s[" + ri + "] = ", C.grey);
        part("'" + s[ri] + "'", C.gold);
        if (step.ok === true) part("    ✓", C.green);
        else if (step.ok === false) part("    ✗", C.red);
        setOpacity(node, 0);
        scene.pairs.push(node);
      } else {
        scene.pairs.push(null);
      }
    });

    // -- verdict + underline ---------------------------------------------
    scene.result = txt(sim.verdict ? "return True" : "return False", {
      x: STAGE_W / 2, y: 648, "text-anchor": "middle", "font-size": 42,
      fill: sim.verdict ? C.green : C.red,
    }, resultL);
    const rule = el("line", {
      x1: STAGE_W / 2 - 150, y1: 670, x2: STAGE_W / 2 + 150, y2: 670,
      stroke: sim.verdict ? C.green : C.red, "stroke-width": 4, "stroke-linecap": "round",
    }, resultL);
    const ruleLen = rule.getTotalLength();
    rule.setAttribute("stroke-dasharray", String(ruleLen));
    rule.setAttribute("stroke-dashoffset", String(ruleLen));
    scene.resultRule = rule;
    scene.ruleLen = ruleLen;

    // --- baseline state: the timeline replays from here on every render ---
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      setOpacity(scene.subtitle, 0);
      for (const chip of scene.chips) {
        setOpacity(chip.enter, 0);
        chip.enter.setAttribute("transform", "translate(0 0)");
        if (chip.scale !== chip.enter) setScaleAt(chip.scale, chip.cx, chip.cy, 1);
        if (chip.charIdle) setOpacity(chip.charIdle, 1);
        if (chip.charGreen) setOpacity(chip.charGreen, 0);
        if (chip.charRed) setOpacity(chip.charRed, 0);
        if (chip.hlBlue) setOpacity(chip.hlBlue, 0);
        if (chip.hlGreen) setOpacity(chip.hlGreen, 0);
        if (chip.hlRed) setOpacity(chip.hlRed, 0);
      }
      setOpacity(scene.leftPtr.g, 0);
      setOpacity(scene.rightPtr.g, 0);
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt } = ctx;
    const { sim } = scene;
    const n = sim.s.length;

    tl.line(1);
    tl.add(0.6, scene.writer(scene.title), ease.outCubic);
    tl.line(2);
    tl.add(0.4, u => setOpacity(scene.subtitle, u), ease.outCubic);

    // reveal the chips
    scene.chips.forEach(chip => {
      tl.add(0.24, u => {
        setOpacity(chip.enter, u);
        chip.enter.setAttribute("transform", "translate(0 " + (1 - u) * 16 + ")");
      }, ease.outCubic);
      tl.wait(0.04);
    });

    // --- empty string: the pointers meet before anything happens ---------
    if (n === 0) {
      tl.line(3);
      tl.add(0.4, u => setOpacity(scene.notes[0], u), ease.outCubic);
      tl.add(0.5, scene.writer(scene.notes[scene.notes.length - 1]), ease.linear);
      tl.line(12);
      tl.add(0.7, scene.writer(scene.result), ease.linear);
      tl.add(0.45, u => {
        scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u)));
      }, ease.outCubic);
      tl.wait(1.2);
      return tl.finish();
    }

    let prevNote = null, prevPair = null;

    sim.steps.forEach((step, si) => {
      const lc = scene.chips[step.l];
      const rc = scene.chips[step.r];
      const same = step.l === step.r;
      const lx = lc.gx - (same ? 11 : 0);
      const rx = rc.gx + (same ? 11 : 0);

      // pointers close in
      if (si === 0) {
        tl.add(0.5, u => {
          setOpacity(scene.leftPtr.g, u);
          setOpacity(scene.rightPtr.g, u);
          setTranslate(scene.leftPtr.g, lx, scene.ptrY);
          setTranslate(scene.rightPtr.g, rx, scene.ptrY);
        }, ease.outCubic);
      } else {
        const ped = sim.steps[si - 1];
        const plx = scene.chips[ped.l].gx;
        const prx = scene.chips[ped.r].gx;
        if (step.l !== ped.l) {
          tl.add(0.34, u => setTranslate(scene.leftPtr.g, plx + (lx - plx) * u, scene.ptrY), ease.inOutSine);
        }
        if (step.r !== ped.r) {
          tl.add(0.34, u => setTranslate(scene.rightPtr.g, prx + (rx - prx) * u, scene.ptrY), ease.inOutSine);
        }
      }

      // narration
      if (step.kind === "start" || step.kind === "done") tl.line(3);
      else if (step.kind === "skipL") tl.line(4);
      else if (step.kind === "skipR") tl.line(6);
      else if (step.kind === "compare") tl.line(8);
      const fadingNote = prevNote;
      if (fadingNote) tl.add(0.12, u => setOpacity(fadingNote, 1 - u), ease.outCubic);
      tl.add(0.42, scene.writer(scene.notes[si]), ease.linear);
      prevNote = scene.notes[si];

      const fadingPair = prevPair;
      if (fadingPair) tl.add(0.1, u => setOpacity(fadingPair, 1 - u), ease.outCubic);
      if (scene.pairs[si]) tl.add(0.4, scene.writer(scene.pairs[si]), ease.linear);
      prevPair = scene.pairs[si];

      // highlights for this step
      if (step.kind === "skipL" || step.kind === "skipR") {
        tl.line(step.kind === "skipL" ? 5 : 7);
        const chip = step.kind === "skipL" ? scene.chips[step.l] : scene.chips[step.r];
        tl.add(0.4, u => {
          setOpacity(chip.hlBlue, Math.sin(Math.PI * u));
          setScaleAt(chip.scale, chip.cx, chip.cy, 1 + 0.06 * Math.sin(Math.PI * u));
        }, ease.linear);
      } else if (step.pair) {
        const a = scene.chips[step.pair[0]];
        const b = scene.chips[step.pair[1]];
        if (step.ok === true) {
          tl.line([10, 11]);
          tl.add(0.34, u => {
            setOpacity(a.hlBlue, 1 - u); setOpacity(b.hlBlue, 1 - u);
            setOpacity(a.hlGreen, u); setOpacity(b.hlGreen, u);
            setOpacity(a.charIdle, 1 - u); setOpacity(b.charIdle, 1 - u);
            setOpacity(a.charGreen, u); setOpacity(b.charGreen, u);
          }, ease.outCubic);
          tl.add(0.45, u => {
            setScaleAt(a.scale, a.cx, a.cy, 1 + 0.06 * Math.sin(Math.PI * u));
            setScaleAt(b.scale, b.cx, b.cy, 1 + 0.06 * Math.sin(Math.PI * u));
          }, ease.linear);
          tl.line(3);
        } else if (step.ok === false) {
          tl.line(9);
          tl.add(0.34, u => {
            setOpacity(a.hlBlue, 1 - u); setOpacity(b.hlBlue, 1 - u);
            setOpacity(a.hlRed, u); setOpacity(b.hlRed, u);
            setOpacity(a.charIdle, 1 - u); setOpacity(b.charIdle, 1 - u);
            setOpacity(a.charRed, u); setOpacity(b.charRed, u);
          }, ease.outCubic);
          tl.add(0.45, u => {
            setScaleAt(a.scale, a.cx, a.cy, 1 + 0.07 * Math.sin(Math.PI * u));
            setScaleAt(b.scale, b.cx, b.cy, 1 + 0.07 * Math.sin(Math.PI * u));
          }, ease.linear);
        } else {
          tl.add(0.4, u => {
            setOpacity(a.hlBlue, u); setOpacity(b.hlBlue, u);
            setScaleAt(a.scale, a.cx, a.cy, 1 + 0.07 * Math.sin(Math.PI * u));
            setScaleAt(b.scale, b.cx, b.cy, 1 + 0.07 * Math.sin(Math.PI * u));
          }, ease.outCubic);
        }
      }

      // finale: the verdict
      if (step.kind === "mismatch" || step.kind === "done") {
        if (step.kind === "done") tl.line(12);
        tl.add(0.35, u => {
          for (const chip of scene.chips) setOpacity(chip.enter, 1 - 0.2 * u);
        }, ease.outCubic);
        tl.add(0.7, scene.writer(scene.result), ease.linear);
        tl.add(0.45, u => {
          scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u)));
        }, ease.outCubic);
        tl.wait(1.5);
      }
    });

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model: the steps the animation narrates.
 * ------------------------------------------------------------------ */

function simulate(s) {
  const n = s.length;
  const alnum = [];
  for (let i = 0; i < n; i++) alnum.push(/[0-9a-zA-Z]/.test(s[i]));

  const steps = [];
  const matched = new Set();
  let left = 0, right = n - 1;

  function push(kind, message, pair, ok) {
    steps.push({
      kind,
      l: left,
      r: right,
      pair: pair || null,
      ok: ok === undefined ? null : ok,
      message,
      matched: new Set(matched),
    });
  }

  push("start", "skip non-alphanumerics from both ends");

  while (left < right) {
    if (!alnum[left]) {
      push("skipL", "'" + s[left] + "' is not alphanumeric → l += 1");
      left += 1;
      continue;
    }
    if (!alnum[right]) {
      push("skipR", "'" + s[right] + "' is not alphanumeric → r -= 1");
      right -= 1;
      continue;
    }

    const a = s[left].toLowerCase();
    const b = s[right].toLowerCase();
    push("compare", "compare '" + a + "' vs '" + b + "'", [left, right]);
    if (a !== b) {
      push("mismatch", "'" + a + "' ≠ '" + b + "' → not a palindrome", [left, right], false);
      return { s, alnum, steps, verdict: false };
    }

    matched.add(left);
    matched.add(right);
    push("match", "'" + a + "' = '" + b + "' → match, step inward", [left, right], true);
    left += 1;
    right -= 1;
  }

  push("done", "pointers met / crossed → palindrome");
  return { s, alnum, steps, verdict: true };
}
