/* Valid Anagram — animated walkthrough scene (3Blue1Brown style).
 *
 * Show `s` and `t` as rows of letter chips, check the lengths, then build a
 * shared 26-slot (a-z) count strip out of `s` and cancel it down, one letter
 * at a time, as we walk `t`. The first slot to go negative (or all-zero at the
 * end) is the answer.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Valid Anagram",
    subtitle: "two counts · O(n)",
    inputs: [
      { id: "s", label: "s", type: "text", default: "anagram", width: "wide" },
      { id: "t", label: "t", type: "text", default: "nagaram", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "s" },
      { color: "#F0AC5F", text: "t" },
      { color: "#5CD0B3", text: "positive count" },
      { color: "#FC6255", text: "negative" },
    ],
  },

  code: [
    "def is_anagram(s: str, t: str) -> bool:",
    "    if len(s) != len(t):",
    "        return False",
    "    count: dict[str, int] = {}",
    "    for ch in s:",
    "        count[ch] = count.get(ch, 0) + 1",
    "    for ch in t:",
    "        if count.get(ch, 0) == 0:",
    "            return False",
    "        count[ch] -= 1",
    "    return True",
  ],

  read(values) {
    const s = values.s == null ? "" : String(values.s);
    const t = values.t == null ? "" : String(values.t);
    if (!/^[a-z]*$/.test(s) || !/^[a-z]*$/.test(t)) return null;
    if (s.length > 14 || t.length > 14) return null;
    return { s, t };
  },

  fromArgs(args) {
    if (Array.isArray(args) && args.length >= 2) {
      return { s: String(args[0]), t: String(args[1]) };
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setScaleAt, STAGE_W } = ctx;
    const s = params.s;
    const t = params.t;
    const sim = simulate(s, t);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-red", C.red);
    ctx.glow("glow-green", C.green);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const resultL = ctx.layer("result");

    const scene = { s, t, sim, ctx, sChips: [], tChips: [], slots: {}, notes: [] };
    scene._writers = [];
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // title + subtitle
    scene.title = txt("Valid Anagram", {
      x: 64, y: 80, "font-size": 46, fill: C.white, "letter-spacing": 1,
    }, textL);
    const sub = el("text", { x: 64, y: 120, "font-size": 23, fill: C.grey }, textL);
    el("tspan", { fill: C.blue }, sub).textContent = 's = "' + s + '"';
    el("tspan", {}, sub).textContent = "      ";
    el("tspan", { fill: C.gold }, sub).textContent = 't = "' + t + '"';
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- one row of letter chips -------------------------------------------
    const CHIP_MAXW = 900;

    function buildRow(which, str, top, accent) {
      const n = str.length;
      const label = txt(which, {
        x: 64, y: top + 42, "font-size": 30, fill: accent, "font-weight": "bold",
      }, textL);
      setOpacity(label, 0);
      const chips = [];

      if (n === 0) {
        const pos = el("g", { transform: "translate(" + (STAGE_W / 2 - 70) + " " + top + ")" }, chipsL);
        const enter = el("g", {}, pos);
        el("rect", {
          x: 0, y: 0, width: 140, height: 72, rx: 14, fill: "none",
          stroke: C.greyDark, "stroke-width": 2, "stroke-dasharray": "7 7",
        }, enter);
        txt("∅ empty", {
          x: 70, y: 44, "text-anchor": "middle", "font-size": 22, fill: C.grey,
        }, enter);
        setOpacity(enter, 0);
        chips.push({
          enter, scale: enter, cx: 70, cy: 36, gx: STAGE_W / 2,
          idle: null, accent: null, red: null, hlAccent: null, hlRed: null,
        });
        return { chips, label };
      }

      const gap = n > 10 ? 10 : 16;
      const chipW = clamp((CHIP_MAXW - gap * (n - 1)) / n, 38, 76);
      const chipH = 72;
      const totalW = n * chipW + (n - 1) * gap;
      const startX = STAGE_W / 2 - totalW / 2;
      const fontSize = clamp(chipW * 0.46, 16, 36);

      for (let i = 0; i < n; i++) {
        const x = startX + i * (chipW + gap);
        const pos = el("g", { transform: "translate(" + x + " " + top + ")" }, chipsL);
        const enter = el("g", {}, pos);
        const scale = el("g", {}, enter);
        const cx = chipW / 2, cy = chipH / 2;
        const rx = Math.min(14, chipW * 0.28);
        el("rect", {
          x: 0, y: 0, width: chipW, height: chipH, rx,
          fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
        }, scale);
        const mk = fill => txt(str[i], {
          x: cx, y: cy + 1, "text-anchor": "middle", "dominant-baseline": "central",
          "font-size": fontSize, fill,
        }, scale);
        const idle = mk(C.white);
        const acc = mk(accent);
        const red = mk(C.red);
        setOpacity(acc, 0);
        setOpacity(red, 0);
        const hlAccent = el("rect", {
          x: 0, y: 0, width: chipW, height: chipH, rx, fill: "none",
          stroke: accent, "stroke-width": 3, filter: "url(#" + (accent === C.blue ? "glow-blue" : "glow-gold") + ")",
        }, scale);
        const hlRed = el("rect", {
          x: 0, y: 0, width: chipW, height: chipH, rx, fill: "none",
          stroke: C.red, "stroke-width": 3.5, filter: "url(#glow-red)",
        }, scale);
        setOpacity(hlAccent, 0);
        setOpacity(hlRed, 0);
        setOpacity(enter, 0);
        chips.push({
          enter, scale, cx, cy, gx: x + cx,
          idle, accent: acc, red, hlAccent, hlRed,
        });
      }
      return { chips, label };
    }

    const sRow = buildRow("s", s, 176, C.blue);
    const tRow = buildRow("t", t, 272, C.gold);
    scene.sChips = sRow.chips;
    scene.sLabel = sRow.label;
    scene.tChips = tRow.chips;
    scene.tLabel = tRow.label;

    // -- length-check line -------------------------------------------------
    const lenText = el("text", {
      x: STAGE_W / 2, y: 404, "text-anchor": "middle", "font-size": 24,
      fill: sim.lenEqual ? C.teal : C.red,
    }, textL);
    el("tspan", { fill: C.grey }, lenText).textContent = "length check:  ";
    el("tspan", { fill: C.blue }, lenText).textContent = "len(s) = " + s.length;
    el("tspan", { fill: C.grey }, lenText).textContent = sim.lenEqual ? "  =  " : "  ≠  ";
    el("tspan", { fill: C.gold }, lenText).textContent = "len(t) = " + t.length;
    el("tspan", { fill: sim.lenEqual ? C.green : C.red }, lenText).textContent =
      sim.lenEqual ? "   ✓" : "   ✗ different lengths";
    scene.lengthLine = lenText;
    setOpacity(lenText, 0);
    // -- shared 26-slot (a-z) count strip ----------------------------------
    scene.stripCaption = txt("counts from s   (cancel one per letter of t)", {
      x: STAGE_W / 2, y: 452, "text-anchor": "middle", "font-size": 20, fill: C.grey,
    }, textL);
    setOpacity(scene.stripCaption, 0);

    const slotW = 40, slotGap = 4, stripTop = 468, stripH = 64;
    const stripTotal = 26 * slotW + 25 * slotGap;
    const stripStart = STAGE_W / 2 - stripTotal / 2;
    for (let i = 0; i < 26; i++) {
      const ch = String.fromCharCode(97 + i);
      const x = stripStart + i * (slotW + slotGap);
      const pos = el("g", { transform: "translate(" + x + " " + stripTop + ")" }, chipsL);
      const scale = el("g", {}, pos);
      el("rect", {
        x: 0, y: 0, width: slotW, height: stripH, rx: 9,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.6,
      }, scale);
      txt(ch, {
        x: slotW / 2, y: 19, "text-anchor": "middle", "font-size": 15, fill: C.grey,
      }, scale);
      const val = txt("0", {
        x: slotW / 2, y: 47, "text-anchor": "middle", "font-size": 24, fill: C.grey,
      }, scale);
      const flash = el("rect", {
        x: 0, y: 0, width: slotW, height: stripH, rx: 9, fill: "none",
        stroke: C.gold, "stroke-width": 3, filter: "url(#glow-gold)",
      }, scale);
      const neg = el("rect", {
        x: 0, y: 0, width: slotW, height: stripH, rx: 9, fill: "none",
        stroke: C.red, "stroke-width": 3.2, filter: "url(#glow-red)",
      }, scale);
      setOpacity(flash, 0);
      setOpacity(neg, 0);
      scene.slots[ch] = { ch, scale, cx: slotW / 2, cy: stripH / 2, val, flash, neg };
    }

    // -- narration lines (one node per step, revealed in turn) -------------
    function mkNote(str, fill) {
      const node = txt(str, {
        x: STAGE_W / 2, y: 596, "text-anchor": "middle", "font-size": 22,
        fill: fill || C.grey,
      }, textL);
      setOpacity(node, 0);
      scene.notes.push(node);
      return node;
    }

    scene.introNote = mkNote("anagram means equal letter counts", C.grey);
    scene.sNotes = sim.sSteps.map(step => mkNote(
      "s[" + step.i + "] = '" + step.ch + "'  →  count['" + step.ch + "'] = " + step.value,
      C.blue));
    scene.tNotes = sim.tSteps.map(step => mkNote(
      "t[" + step.j + "] = '" + step.ch + "'  →  count['" + step.ch + "'] -= 1  →  " + step.value,
      step.value < 0 ? C.red : C.gold));
    let finalStr, finalFill;
    if (!sim.lenEqual) {
      finalStr = "lengths differ → not an anagram";
      finalFill = C.red;
    } else if (sim.verdict) {
      finalStr = "every slot is back to 0  ✓";
      finalFill = C.green;
    } else {
      finalStr = "count['" + sim.negativeChar + "'] went negative → not an anagram";
      finalFill = C.red;
    }
    scene.finalNote = mkNote(finalStr, finalFill);

    // -- verdict + underline -----------------------------------------------
    scene.result = txt(sim.verdict ? "return True" : "return False", {
      x: STAGE_W / 2, y: 668, "text-anchor": "middle", "font-size": 42,
      fill: sim.verdict ? C.green : C.red,
    }, resultL);
    const rule = el("line", {
      x1: STAGE_W / 2 - 150, y1: 688, x2: STAGE_W / 2 + 150, y2: 688,
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
      setOpacity(scene.sLabel, 0);
      setOpacity(scene.tLabel, 0);
      setOpacity(scene.lengthLine, 0);
      setOpacity(scene.stripCaption, 0);
      for (const chip of scene.sChips.concat(scene.tChips)) {
        setOpacity(chip.enter, 0);
        setScaleAt(chip.scale, chip.cx, chip.cy, 1);
        if (chip.idle) setOpacity(chip.idle, 1);
        if (chip.accent) setOpacity(chip.accent, 0);
        if (chip.red) setOpacity(chip.red, 0);
        if (chip.hlAccent) setOpacity(chip.hlAccent, 0);
        if (chip.hlRed) setOpacity(chip.hlRed, 0);
      }
      for (const key in scene.slots) {
        const sl = scene.slots[key];
        setOpacity(sl.flash, 0);
        setOpacity(sl.neg, 0);
        sl.val.textContent = "0";
        sl.val.setAttribute("fill", C.grey);
        setScaleAt(sl.scale, sl.cx, sl.cy, 1);
      }
      for (const note of scene.notes) setOpacity(note, 0);
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },
  buildTimeline(scene, tl, ctx) {
    const { ease, C, setOpacity, setScaleAt } = ctx;
    const { sim } = scene;

    tl.line(1);
    tl.add(0.6, scene.writer(scene.title), ease.outCubic);
    tl.add(0.4, u => setOpacity(scene.subtitle, u), ease.outCubic);

    const revealRow = (chips, label) => {
      tl.add(0.3, u => setOpacity(label, u), ease.outCubic);
      chips.forEach(chip => {
        tl.add(0.26, u => {
          setOpacity(chip.enter, u);
          chip.enter.setAttribute("transform", "translate(0 " + (1 - u) * 14 + ")");
        }, ease.outCubic);
        tl.wait(0.05);
      });
    };
    revealRow(scene.sChips, scene.sLabel);
    revealRow(scene.tChips, scene.tLabel);

    tl.line(2);
    tl.add(0.5, scene.writer(scene.lengthLine), ease.linear);

    let prevNote = null;
    const note = (node, dur) => {
      const fadingNote = prevNote;
      if (fadingNote) tl.add(0.14, u => setOpacity(fadingNote, 1 - u), ease.outCubic);
      tl.add(dur, scene.writer(node), ease.linear);
      prevNote = node;
    };

    // --- lengths differ: the answer is immediate --------------------------
    if (!sim.lenEqual) {
      tl.line(3);
      tl.add(0.4, u => {
        for (const chip of scene.sChips.concat(scene.tChips)) {
          setOpacity(chip.enter, 1 - 0.5 * u);
        }
      }, ease.outCubic);
      note(scene.finalNote, 0.5);
      tl.add(0.6, scene.writer(scene.result), ease.linear);
      tl.add(0.4, u => {
        scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u)));
      }, ease.outCubic);
      tl.wait(1.2);
      return tl.finish();
    }

    // --- build the count strip from s (count up) --------------------------
    note(scene.introNote, 0.5);
    tl.line(4);
    tl.add(0.35, u => setOpacity(scene.stripCaption, u), ease.outCubic);

    let prevSChip = null;
    sim.sSteps.forEach((step, i) => {
      const chip = scene.sChips[step.i];
      const slot = scene.slots[step.ch];
      const oldVal = step.value - 1, newVal = step.value;
      tl.line(5);
      const fadingS = prevSChip;
      if (fadingS) {
        tl.add(0.2, u => {
          setOpacity(fadingS.accent, 1 - u);
          setOpacity(fadingS.hlAccent, 1 - u);
        }, ease.outCubic);
      }
      tl.add(0.26, u => {
        setOpacity(chip.idle, 1 - u);
        setOpacity(chip.accent, u);
        setOpacity(chip.hlAccent, u);
      }, ease.outCubic);
      tl.line(6);
      note(scene.sNotes[i], 0.42);
      tl.add(0.38, u => {
        slot.val.textContent = String(Math.round(oldVal + (newVal - oldVal) * u));
        slot.val.setAttribute("fill", newVal > 0 ? C.teal : C.grey);
        setOpacity(slot.flash, Math.sin(Math.PI * u));
        setScaleAt(slot.scale, slot.cx, slot.cy, 1 + 0.07 * Math.sin(Math.PI * u));
      }, ease.linear);
      prevSChip = chip;
    });

    // --- walk t, cancelling the strip (count down) ------------------------
    const lastSChip = prevSChip;
    if (lastSChip) {
      tl.add(0.2, u => {
        setOpacity(lastSChip.accent, 1 - u);
        setOpacity(lastSChip.hlAccent, 1 - u);
      }, ease.outCubic);
    }

    let prevTChip = null;
    sim.tSteps.forEach((step, j) => {
      const chip = scene.tChips[step.j];
      const slot = scene.slots[step.ch];
      const oldVal = step.value + 1, newVal = step.value;
      const neg = newVal < 0;
      tl.line(7);
      const fadingT = prevTChip;
      if (fadingT) {
        tl.add(0.2, u => {
          setOpacity(fadingT.accent, 1 - u);
          setOpacity(fadingT.hlAccent, 1 - u);
        }, ease.outCubic);
      }
      tl.add(0.26, u => {
        setOpacity(chip.idle, 1 - u);
        setOpacity(chip.accent, u);
        setOpacity(chip.hlAccent, u);
      }, ease.outCubic);
      tl.line(8);
      note(scene.tNotes[j], 0.42);
      tl.line(neg ? 9 : 10);
      tl.add(0.38, u => {
        slot.val.textContent = String(Math.round(oldVal + (newVal - oldVal) * u));
        slot.val.setAttribute("fill", neg ? C.red : (newVal > 0 ? C.teal : C.grey));
        setOpacity(slot.flash, Math.sin(Math.PI * u));
        setOpacity(slot.neg, neg ? u : 0);
        setScaleAt(slot.scale, slot.cx, slot.cy, 1 + 0.07 * Math.sin(Math.PI * u));
      }, ease.linear);
      if (neg) {
        tl.add(0.34, u => {
          setOpacity(chip.idle, 1 - u);
          setOpacity(chip.accent, 1 - u);
          setOpacity(chip.hlAccent, 1 - u);
          setOpacity(chip.red, u);
          setOpacity(chip.hlRed, u);
        }, ease.outCubic);
      }
      prevTChip = chip;
    });

    // --- verdict ----------------------------------------------------------
    tl.line(sim.lenEqual && sim.verdict ? 11 : 9);
    note(scene.finalNote, 0.5);
    tl.add(0.6, scene.writer(scene.result), ease.linear);
    tl.add(0.4, u => {
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u)));
    }, ease.outCubic);
    tl.wait(1.4);
    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model: the steps the animation narrates.
 * ------------------------------------------------------------------ */

function simulate(s, t) {
  const counts = {};
  for (let i = 0; i < 26; i++) counts[String.fromCharCode(97 + i)] = 0;

  const sSteps = [];
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch in counts) counts[ch] += 1;
    sSteps.push({ i, ch, value: counts[ch] });
  }

  const lenEqual = s.length === t.length;
  const tSteps = [];
  let negativeAt = -1, negativeChar = null;
  if (lenEqual) {
    for (let j = 0; j < t.length; j++) {
      const ch = t[j];
      let value = null;
      if (ch in counts) {
        counts[ch] -= 1;
        value = counts[ch];
        if (value < 0 && negativeAt < 0) {
          negativeAt = j;
          negativeChar = ch;
        }
      }
      tSteps.push({ j, ch, value });
      if (negativeAt >= 0) break;
    }
  }

  const verdict = lenEqual && negativeAt < 0;
  return { counts, sSteps, tSteps, negativeAt, negativeChar, lenEqual, verdict };
}
