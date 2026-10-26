/* Encode and Decode Strings — animated walkthrough scene (3Blue1Brown style).
 *
 * Two acts. Act 1 (encode) turns the input word chips into the encoded string
 * "<len>#<word>..." left to right, writing each length prefix then its payload.
 * Act 2 (decode) walks a scanner along the encoded string: it reads the length
 * digits, the '#', then slices out exactly <len> characters, emitting each
 * recovered word. The finale shows the round trip matching the input.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Encode and Decode Strings",
    subtitle: "length-prefixed <len>#<data> · O(n)",
    inputs: [
      { id: "strs", label: "strs", type: "text", default: "neet, code, love", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "length prefix" },
      { color: "#5CD0B3", text: "payload" },
      { color: "#F0AC5F", text: "scanner" },
    ],
  },

  code: [
    "def encode(strs: List[str]) -> str:",
    "    return \"\".join(f\"{len(s)}#{s}\" for s in strs)",
    "def decode(data: str) -> List[str]:",
    "    result: List[str] = []",
    "    i = 0",
    "    while i < len(data):",
    "        j = data.index(\"#\", i)",
    "        length = int(data[i:j])",
    "        result.append(data[j + 1: j + 1 + length])",
    "        i = j + 1 + length",
    "    return result",
  ],

  read(values) {
    const raw = (values.strs || "").trim();
    const words = raw === "" ? [] : raw.split(",").map(s => s.trim());
    if (words.length > 6) return null;
    if (words.some(w => w.length > 14)) return null;
    return { words };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const words = args[0].map(String);
      if (words.length <= 6 && words.every(w => w.length <= 14)) {
        return { strs: words.join(", ") };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, setScaleAt, STAGE_W } = ctx;
    const words = params.words;
    const sim = simulate(words);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-teal", C.teal);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = { words, sim, ctx, inChips: [], elems: [], decChips: [], _writers: [] };
    scene.writer = node => { const w = writable(node); scene._writers.push(w); return w; };

    // ---- fixed layout ----
    const inputTop = 196, chipH = 52;
    const encTop = 334, encH = 52;
    const decTop = 556;
    const resultY = 666;

    // ---- title + subtitle ----
    scene.title = txt("Encode and Decode Strings", {
      x: 64, y: 72, "font-size": 40, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    const sub = el("text", { x: 64, y: 108, "font-size": 20, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "strs = ";
    el("tspan", { fill: C.white }, sub).textContent =
      "[" + words.map(w => JSON.stringify(w)).join(", ") + "]";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // ---- captions + row labels ----
    const label = (str, y, fill) => {
      const t = txt(str, { x: 96, y, "font-size": 20, fill: fill || C.grey }, textL);
      setOpacity(t, 0);
      return t;
    };
    scene.encCaption = label("①  encode   ·   write  <len>#<data>  for each word", 148, C.blue);
    scene.inputLabel = label("input   strs", inputTop - 12);
    scene.encLabel = label("encoded", encTop - 12);
    scene.decCaption = label("②  decode   ·   read <len>, '#', then slice <len> chars", 470, C.teal);
    scene.decLabel = label("decoded   (recovered)", decTop - 12);
    scene.status = txt("", {
      x: STAGE_W / 2, y: 508, "text-anchor": "middle", "font-size": 20, fill: C.gold,
    }, textL);
    setOpacity(scene.status, 0);

    // ---- chip layout (input and decoded share it, so columns line up) ----
    const n = words.length;
    const gap = 16;
    const chipW = n ? clamp((1000 - gap * (n - 1)) / n, 80, 210) : 210;
    const totalW = n ? n * chipW + (n - 1) * gap : 0;
    const startX = STAGE_W / 2 - totalW / 2;
    const chipFont = clamp(chipW * 0.26, 15, 30);
    const rx = 12;
    scene.chipW = chipW;
    scene.chipH = chipH;

    const mkChip = (w, i, x, top, idleFill) => {
      const pos = el("g", { transform: "translate(" + x + " " + top + ")" }, chipsL);
      const enter = el("g", {}, pos);
      const scale = el("g", {}, enter);
      const cx = chipW / 2, cy = chipH / 2;
      el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, scale);
      const shown = w === "" ? "∅" : w;
      const mk = fill => txt(shown, {
        x: cx, y: cy + 1, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": chipFont, fill,
      }, scale);
      const idle = mk(idleFill), blue = mk(C.blue), teal = mk(C.teal);
      setOpacity(blue, 0); setOpacity(teal, 0);
      const hlBlue = el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx, fill: "none",
        stroke: C.blue, "stroke-width": 3, filter: "url(#glow-blue)",
      }, scale);
      const hlTeal = el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx, fill: "none",
        stroke: C.teal, "stroke-width": 3, filter: "url(#glow-teal)",
      }, scale);
      setOpacity(hlBlue, 0); setOpacity(hlTeal, 0);
      txt(String(i), { x: cx, y: -15, "text-anchor": "middle", "font-size": 15, fill: C.grey }, enter);
      setOpacity(enter, 0);
      return {
        i, word: w, pos, enter, scale, cx, cy, gx: x + cx,
        textIdle: idle, textBlue: blue, textTeal: teal, hlBlue, hlTeal,
      };
    };

    words.forEach((w, i) => {
      const x = startX + i * (chipW + gap);
      scene.inChips.push(mkChip(w, i, x, inputTop, C.white));
    });
    words.forEach((w, i) => {
      const x = startX + i * (chipW + gap);
      scene.decChips.push(mkChip(w, i, x, decTop, C.teal));
    });

    if (!n) {
      scene.emptyInput = txt("(empty list)", {
        x: STAGE_W / 2, y: inputTop + chipH / 2 + 6, "text-anchor": "middle", "font-size": 20, fill: C.grey,
      }, textL);
      scene.emptyDecoded = txt("[]", {
        x: STAGE_W / 2, y: decTop + chipH / 2 + 6, "text-anchor": "middle", "font-size": 20, fill: C.grey,
      }, textL);
      setOpacity(scene.emptyInput, 0); setOpacity(scene.emptyDecoded, 0);
    }

    // ---- encoded character cells ----
    const nChars = sim.chars.length;
    const cellGap = 4;
    const cellW = nChars ? clamp((1120 - cellGap * (nChars - 1)) / nChars, 22, 40) : 40;
    const cellH = encH;
    const totalEncW = nChars ? nChars * cellW + (nChars - 1) * cellGap : 0;
    const encStartX = STAGE_W / 2 - totalEncW / 2;
    const cellFont = clamp(cellW * 0.62, 15, 24);
    scene.cellW = cellW; scene.cellGap = cellGap; scene.encTop = encTop; scene.encH = cellH;
    scene.cellCenter = i => encStartX + i * (cellW + cellGap) + cellW / 2;

    sim.chars.forEach((c, i) => {
      const x = encStartX + i * (cellW + cellGap);
      const pos = el("g", { transform: "translate(" + x + " " + encTop + ")" }, chipsL);
      const enter = el("g", {}, pos);
      const scale = el("g", {}, enter);
      const cx = cellW / 2, cy = cellH / 2, crx = 8;
      el("rect", {
        x: 0, y: 0, width: cellW, height: cellH, rx: crx,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.5,
      }, scale);
      const mk = fill => txt(c.ch, {
        x: cx, y: cy + 1, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": cellFont, fill,
      }, scale);
      const idle = mk(C.white), blue = mk(C.blue), green = mk(C.teal), gold = mk(C.gold);
      setOpacity(blue, 0); setOpacity(green, 0); setOpacity(gold, 0);
      const hlGold = el("rect", {
        x: 0, y: 0, width: cellW, height: cellH, rx: crx, fill: "none",
        stroke: C.gold, "stroke-width": 2.5, filter: "url(#glow-gold)",
      }, scale);
      setOpacity(hlGold, 0);
      setOpacity(enter, 0);
      scene.elems.push({
        i, ch: c.ch, role: c.role, wi: c.wi, pos, enter, scale, cx, cy,
        textIdle: idle, textBlue: blue, textGreen: green, textGold: gold, hlGold,
      });
    });

    if (!nChars) {
      scene.emptyEncoded = txt('""   (empty string)', {
        x: STAGE_W / 2, y: encTop + cellH / 2 + 6, "text-anchor": "middle", "font-size": 20, fill: C.grey,
      }, textL);
      setOpacity(scene.emptyEncoded, 0);
    }

    // ---- scanner / write caret (points up from just below the cells) ----
    const caret = el("g", {}, ptrL);
    el("path", { d: "M 0 0 L -11 19 L 11 19 Z", fill: C.gold, filter: "url(#glow-gold)" }, caret);
    const careLabel = txt("i = 0", {
      x: 0, y: 40, "text-anchor": "middle", "font-size": 16, fill: C.grey,
    }, caret);
    setOpacity(caret, 0);
    scene.caret = caret; scene.caretLabel = careLabel;
    scene.caretY = encTop + cellH + 8;
    scene.caretX = scene.cellCenter(0);
    setTranslate(caret, scene.caretX, scene.caretY);

    // ---- result + underline ----
    scene.result = txt("decode(encode(strs)) == strs   ✓", {
      x: STAGE_W / 2, y: resultY, "text-anchor": "middle", "font-size": 30, fill: C.green,
    }, resultL);
    setOpacity(scene.result, 0);
    const rule = el("line", {
      x1: STAGE_W / 2 - 215, y1: resultY + 20, x2: STAGE_W / 2 + 215, y2: resultY + 20,
      stroke: C.green, "stroke-width": 4, "stroke-linecap": "round",
    }, resultL);
    rule.setAttribute("stroke-dasharray", String(rule.getTotalLength()));
    rule.setAttribute("stroke-dashoffset", String(rule.getTotalLength()));
    scene.resultRule = rule;
    scene.ruleLen = rule.getTotalLength();

    // ---- baseline (every timeline render replays from here) ----
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.encCaption, scene.inputLabel, scene.encLabel,
                          scene.decCaption, scene.decLabel, scene.status]) setOpacity(node, 0);
      scene.status.textContent = "";
      for (const key of ["emptyInput", "emptyEncoded", "emptyDecoded"]) {
        if (scene[key]) setOpacity(scene[key], 0);
      }
      for (const chip of scene.inChips.concat(scene.decChips)) {
        setOpacity(chip.enter, 0);
        chip.enter.setAttribute("transform", "translate(0 0)");
        setScaleAt(chip.scale, chip.cx, chip.cy, 1);
        setOpacity(chip.textIdle, 1);
        setOpacity(chip.textBlue, 0);
        setOpacity(chip.textTeal, 0);
        setOpacity(chip.hlBlue, 0);
        setOpacity(chip.hlTeal, 0);
      }
      for (const cell of scene.elems) {
        setOpacity(cell.enter, 0);
        cell.enter.setAttribute("transform", "translate(0 0)");
        setScaleAt(cell.scale, cell.cx, cell.cy, 1);
        setOpacity(cell.textIdle, 1);
        setOpacity(cell.textBlue, 0);
        setOpacity(cell.textGreen, 0);
        setOpacity(cell.textGold, 0);
        setOpacity(cell.hlGold, 0);
      }
      setOpacity(scene.caret, 0);
      scene.caretLabel.textContent = "i = 0";
      setTranslate(scene.caret, scene.cellCenter(0), scene.caretY);
      setOpacity(scene.result, 0);
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt } = ctx;
    const sim = scene.sim;
    const caret = scene.caret, caretY = scene.caretY;
    // A consumed char keeps its encode colour: blue for the prefix, teal for the payload.
    const baseOf = cell => (cell.role === "prefix" ? cell.textBlue : cell.textGreen);

    const moveCaret = (idx, dur, easeFn) => {
      const fromX = scene.caretX, toX = scene.cellCenter(idx);
      scene.caretX = toX;
      tl.add(dur, u => {
        setTranslate(caret, fromX + (toX - fromX) * u, caretY);
        if (u > 0.001) scene.caretLabel.textContent = "i = " + idx;
      }, easeFn || ease.inOutSine);
    };

    // ---------- intro ----------
    tl.line(1);
    tl.add(0.6, scene.writer(scene.title), ease.outCubic);
    tl.add(0.4, u => setOpacity(scene.subtitle, u), ease.outCubic);
    tl.add(0.35, u => setOpacity(scene.encCaption, u), ease.outCubic);
    tl.add(0.3, u => setOpacity(scene.inputLabel, u), ease.outCubic);
    scene.inChips.forEach(chip => {
      tl.add(0.34, u => {
        setOpacity(chip.enter, u);
        chip.enter.setAttribute("transform", "translate(0 " + (1 - u) * 16 + ")");
      }, ease.outCubic);
      tl.wait(0.06);
    });
    if (scene.emptyInput) tl.add(0.35, u => setOpacity(scene.emptyInput, u), ease.outCubic);
    tl.add(0.3, u => setOpacity(scene.encLabel, u), ease.outCubic);

    // ---------- empty list: nothing to encode ----------
    if (sim.chars.length === 0) {
      tl.line(2);
      if (scene.emptyEncoded) tl.add(0.4, u => setOpacity(scene.emptyEncoded, u), ease.outCubic);
      tl.line([3, 4, 5]);
      tl.add(0.35, u => setOpacity(scene.decCaption, u), ease.outCubic);
      tl.add(0.35, u => setOpacity(scene.decLabel, u), ease.outCubic);
      tl.line(6);
      if (scene.emptyDecoded) tl.add(0.4, u => setOpacity(scene.emptyDecoded, u), ease.outCubic);
      tl.add(0.4, u => {
        setOpacity(scene.status, u);
        if (u > 0.001) scene.status.textContent = '[]  →  ""  →  []';
      }, ease.outCubic);
      tl.log('[]  →  ""  →  []', ctx.C.gold);
      tl.line(11);
      tl.add(0.7, scene.writer(scene.result), ease.linear);
      tl.add(0.5, u => scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u))), ease.outCubic);
      tl.wait(1.3);
      return tl.finish();
    }

    // ---------- act 1: encode ----------
    tl.add(0.3, u => setOpacity(scene.caret, u), ease.outCubic);
    sim.segs.forEach(seg => {
      const chip = scene.inChips[seg.wi];

      tl.line(2);
      tl.add(0.26, u => {
        setOpacity(chip.textIdle, 1 - u);
        setOpacity(chip.textBlue, u);
        setOpacity(chip.hlBlue, u);
      }, ease.outCubic);

      // write the length prefix: digits then '#'
      moveCaret(seg.start, 0.34);
      for (let k = seg.start; k <= seg.hashAt; k++) {
        const cell = scene.elems[k];
        tl.add(0.16, u => {
          setOpacity(cell.enter, Math.min(1, u * 1.7));
          setScaleAt(cell.scale, cell.cx, cell.cy, 0.62 + 0.38 * u);
          setOpacity(cell.textIdle, 1 - u);
          setOpacity(cell.textBlue, u);
        }, ease.outCubic);
      }

      // write the payload
      moveCaret(seg.payloadStart, 0.2);
      for (let k = seg.payloadStart; k < seg.end; k++) {
        const cell = scene.elems[k];
        tl.add(0.16, u => {
          setOpacity(cell.enter, Math.min(1, u * 1.7));
          setScaleAt(cell.scale, cell.cx, cell.cy, 0.62 + 0.38 * u);
          setOpacity(cell.textIdle, 1 - u);
          setOpacity(cell.textGreen, u);
        }, ease.outCubic);
      }
      moveCaret(seg.end, 0.22);

      tl.add(0.3, u => {
        setOpacity(chip.textBlue, 1 - u);
        setOpacity(chip.hlBlue, 1 - u);
        setOpacity(chip.textTeal, u);
        setOpacity(chip.hlTeal, u);
        setOpacity(chip.textIdle, 0);
      }, ease.outCubic);
      tl.log('encode "' + seg.word + '"  →  "' + seg.prefix + seg.word + '"', ctx.C.blue);
      tl.wait(0.12);
    });

    // ---------- act 2: decode ----------
    tl.line([3, 4, 5]);
    tl.add(0.35, u => setOpacity(scene.decCaption, u), ease.outCubic);
    tl.add(0.35, u => setOpacity(scene.decLabel, u), ease.outCubic);
    tl.add(0.35, u => setOpacity(scene.status, u), ease.outCubic);

    sim.segs.forEach(seg => {
      const out = scene.decChips[seg.wi];
      const charsWord = seg.len === 1 ? "char" : "chars";

      // read the length digits
      tl.line(6);
      moveCaret(seg.start, 0.34);
      tl.line(7);
      tl.add(0.28, u => {
        if (u > 0.001) scene.status.textContent = 'read length digits "' + seg.len + '"  →  ' + seg.len;
      }, ease.linear);
      tl.log('read length digits "' + seg.len + '"  →  ' + seg.len, ctx.C.gold);
      tl.line(8);
      for (let k = seg.start; k < seg.hashAt; k++) {
        const cell = scene.elems[k];
        tl.add(0.16, u => {
          setOpacity(cell.textGold, u);
          setOpacity(baseOf(cell), 1 - u);
        }, ease.linear);
      }

      // read the '#' separator
      moveCaret(seg.hashAt, 0.2);
      tl.add(0.25, u => {
        const cell = scene.elems[seg.hashAt];
        setOpacity(cell.textGold, u);
        setOpacity(baseOf(cell), 1 - u);
        setOpacity(cell.hlGold, Math.sin(Math.PI * u));
      }, ease.linear);
      tl.add(0.26, u => {
        if (u > 0.001) scene.status.textContent = "read the '#' separator";
      }, ease.linear);
      tl.log("read the '#' separator", ctx.C.gold);

      // slice exactly len characters
      moveCaret(seg.payloadStart, 0.2);
      tl.line(9);
      tl.add(0.28, u => {
        if (u > 0.001) scene.status.textContent = "slice " + seg.len + " " + charsWord + '  →  "' + seg.word + '"';
      }, ease.linear);
      tl.log("slice " + seg.len + " " + charsWord + '  →  "' + seg.word + '"', ctx.C.gold);
      for (let k = seg.payloadStart; k < seg.end; k++) {
        const cell = scene.elems[k];
        tl.add(0.15, u => {
          setOpacity(cell.textGold, u);
          setOpacity(baseOf(cell), 1 - u);
          setOpacity(cell.hlGold, Math.sin(Math.PI * u));
        }, ease.linear);
      }

      // emit the recovered word
      moveCaret(seg.end, 0.24);
      tl.add(0.5, u => {
        setOpacity(out.enter, Math.min(1, u * 1.4));
        setScaleAt(out.scale, out.cx, out.cy, Math.max(0.01, u));
      }, ease.outBack);

      // retire the consumed span (prefix dims, payload keeps its teal)
      tl.line(10);
      tl.add(0.3, u => {
        for (let k = seg.start; k < seg.end; k++) {
          const cell = scene.elems[k];
          setOpacity(cell.textGold, 1 - u);
          const settled = cell.role === "payload" ? 0.55 : 0.35;
          setOpacity(baseOf(cell), cell.role === "payload" ? 0.55 * u : 0);
          setOpacity(cell.textIdle, settled * u);
        }
        setOpacity(scene.elems[seg.hashAt].hlGold, 1 - u);
      }, ease.outCubic);
    });

    // ---------- finale: the round trip matches the input ----------
    tl.line(11);
    tl.add(0.3, u => setOpacity(scene.caret, 1 - u), ease.outCubic);
    tl.add(0.35, u => {
      if (u > 0.001) scene.status.textContent = "round trip complete  ·  decode(encode(strs)) == strs";
    }, ease.linear);
    tl.log("round trip complete  ·  decode(encode(strs)) == strs", ctx.C.gold);
    tl.add(0.65, u => {
      const s = 1 + 0.05 * Math.sin(Math.PI * u);
      for (const c of scene.inChips.concat(scene.decChips)) setScaleAt(c.scale, c.cx, c.cy, s);
    }, ease.linear);
    tl.add(0.7, scene.writer(scene.result), ease.linear);
    tl.add(0.5, u => scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u))), ease.outCubic);
    tl.wait(1.6);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model: the frames the animation narrates.
 * ------------------------------------------------------------------ */
function simulate(words) {
  const chars = [];
  const segs = [];
  let idx = 0;
  words.forEach((w, wi) => {
    const prefix = String(w.length) + "#";
    const start = idx;
    for (const ch of prefix) chars.push({ ch, role: "prefix", wi });
    idx += prefix.length;
    const hashAt = start + prefix.length - 1;
    const payloadStart = idx;
    for (const ch of w) chars.push({ ch, role: "payload", wi });
    idx += w.length;
    segs.push({ wi, word: w, len: w.length, prefix, start, hashAt, payloadStart, end: idx });
  });
  return { chars, segs, encoded: chars.map(c => c.ch).join("") };
}
