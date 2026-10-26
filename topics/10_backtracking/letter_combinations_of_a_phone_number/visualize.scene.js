/* Letter Combinations of a Phone Number — animated backtracking scene.
 *
 * Every digit contributes its own small alphabet.  The recursion walks the
 * digit positions left to right, choosing one letter per position; a path that
 * reaches len(digits) is one complete combination.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Letter Combinations of a Phone Number",
    subtitle: "one digit per position · 2–4 choices per digit · a full path is one combination",
    inputs: [
      { id: "digits", label: "digits (2–9)", type: "text", default: "23", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "available letter" },
      { color: "#F0AC5F", text: "current choice" },
      { color: "#83C167", text: "chosen / complete" },
      { color: "#FC6255", text: "un-choose" },
    ],
  },

  code: [
    "def letter_combinations(digits: str) -> List[str]:",
    "    if not digits:",
    "        return []                           # official convention: no digits -> []",
    "    result: List[str] = []",
    "    path: List[str] = []",
    "    def backtrack(index: int) -> None:",
    "        if index == len(digits):",
    "            result.append(\"\".join(path))    # a complete combination",
    "            return",
    "        for ch in _DIGITS[digits[index]]:",
    "            path.append(ch)                 # choose",
    "            backtrack(index + 1)            # recurse",
    "            path.pop()                      # un-choose",
    "    backtrack(0)",
    "    return result",
  ],

  read(values) {
    const digits = String(values.digits == null ? "" : values.digits).replace(/[\s,]+/g, "");
    if (digits.length > 4) return null;
    if (!/^[2-9]*$/.test(digits)) return null;
    return { digits };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || args.length !== 1 || typeof args[0] !== "string") return null;
    if (args[0].length > 4 || !/^[2-9]*$/.test(args[0])) return null;
    return { digits: args[0] };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, STAGE_W } = ctx;
    const { digits } = params;
    const sim = simulateLetterCombinations(digits);
    const k = digits.length;
    const maxResults = sim.results.length;

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-red", C.red);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const resultL = ctx.layer("result");

    const scene = {
      digits, sim, ctx, columns: [], pathChips: [], resultTexts: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title ---------------------------------------------------------
    scene.title = txt("Letter Combinations", {
      x: 64, y: 62, "font-size": 40, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    const sub = el("text", { x: 64, y: 98, "font-size": 18, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "digits = ";
    el("tspan", { fill: C.white }, sub).textContent = "\"" + digits + "\"";
    el("tspan", { fill: C.gold }, sub).textContent =
      digits ? "     " + digits.length + " positions · walk one letter per position" : "     no digits";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // ---- digit columns -------------------------------------------------
    const areaX = 64, areaW = 620;
    const gap = k > 2 ? 14 : 22;
    const colW = k ? clamp((areaW - gap * (k - 1)) / k, 96, 168) : 168;
    const totalW = k ? k * colW + (k - 1) * gap : 0;
    const startX = areaX + (areaW - totalW) / 2;
    const digitTop = 140;
    const letterTop = 215;
    const letterH = 36;
    const letterGap = 7;

    for (let i = 0; i < k; i++) {
      const cx = startX + i * (colW + gap) + colW / 2;
      const g = el("g", {}, chipsL);
      const label = txt("pos " + i, {
        x: cx, y: 128, "text-anchor": "middle", "font-size": 10, fill: C.grey,
      }, g);
      const digitW = 54, digitH = 52;
      const digitRect = el("rect", {
        x: cx - digitW / 2, y: digitTop, width: digitW, height: digitH, rx: 10,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, g);
      const digitText = txt(digits[i], {
        x: cx, y: digitTop + digitH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": 25, fill: C.white,
      }, g);
      setOpacity(g, 0);

      const letters = [];
      const alphabet = PHONE_DIGITS[digits[i]];
      const lW = clamp(colW * 0.74, 72, 126);
      alphabet.split("").forEach((ch, j) => {
        const y = letterTop + j * (letterH + letterGap);
        const lg = el("g", { transform: "translate(" + (cx - lW / 2) + " " + y + ")" }, chipsL);
        const rect = el("rect", {
          x: 0, y: 0, width: lW, height: letterH, rx: 7,
          fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.8,
        }, lg);
        const t = txt(ch, {
          x: lW / 2, y: letterH / 2 + 1, "text-anchor": "middle",
          "dominant-baseline": "central", "font-size": 18, fill: C.blue,
        }, lg);
        setOpacity(lg, 0);
        letters.push({ ch, g: lg, rect, t });
      });

      scene.columns.push({
        i, digit: digits[i], cx, lW, g, label, digitRect, digitText, letters,
      });
    }

    if (!k) {
      scene.emptyInput = txt("digits = \"\"  →  return [] immediately", {
        x: areaX + areaW / 2, y: 235, "text-anchor": "middle",
        "font-size": 22, fill: C.grey,
      }, textL);
      setOpacity(scene.emptyInput, 0);
    }

    // ---- current combination panel ------------------------------------
    const pX = 64, pY = 400, pW = 620, pH = 125;
    scene.pathPanel = el("g", {}, chipsL);
    el("rect", {
      x: pX, y: pY, width: pW, height: pH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.pathPanel);
    setOpacity(scene.pathPanel, 0);
    scene.pathTitle = txt("current combination", {
      x: pX + 20, y: pY + 26, "font-size": 17, fill: C.blue,
    }, textL);
    setOpacity(scene.pathTitle, 0);

    const slotGap = 8;
    const slotW = k ? clamp((pW - 40 - slotGap * (k - 1)) / k, 66, 140) : 140;
    const slotTotal = k ? k * slotW + (k - 1) * slotGap : 0;
    const slotStart = pX + pW / 2 - slotTotal / 2;
    for (let i = 0; i < k; i++) {
      const x = slotStart + i * (slotW + slotGap);
      const g = el("g", { transform: "translate(" + x + " " + (pY + 50) + ")" }, chipsL);
      const rect = el("rect", {
        x: 0, y: 0, width: slotW, height: 46, rx: 8,
        fill: "#17251a", stroke: C.green, "stroke-width": 2,
      }, g);
      const t = txt("·", {
        x: slotW / 2, y: 24, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": 20, fill: C.grey,
      }, g);
      setOpacity(g, 0);
      scene.pathChips.push({ i, g, rect, t });
    }
    scene.pathNote = txt("", {
      x: pX + 20, y: pY + pH - 12, "font-size": 11, fill: C.grey,
    }, textL);
    setOpacity(scene.pathNote, 0);

    // ---- results panel -------------------------------------------------
    const rX = 720, rY = 140, rW = 496, rH = 420;
    scene.resultPanel = el("g", {}, chipsL);
    el("rect", {
      x: rX, y: rY, width: rW, height: rH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.resultPanel);
    setOpacity(scene.resultPanel, 0);
    scene.resultTitle = txt("combinations (0)", {
      x: rX + 20, y: rY + 30, "font-size": 18, fill: C.green,
    }, textL);
    setOpacity(scene.resultTitle, 0);

    const cols = 4;
    const rows = 4;
    const colWr = (rW - 40) / cols;
    const rowHr = 78;
    for (let i = 0; i < Math.min(maxResults, 16); i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const t = txt("", {
        x: rX + 22 + col * colWr,
        y: rY + 68 + row * rowHr,
        "font-size": maxResults > 9 ? 13 : 15, fill: C.green,
      }, textL);
      setOpacity(t, 0);
      scene.resultTexts.push(t);
    }
    scene.resultNote = txt("", {
      x: rX + 20, y: rY + rH - 18, "font-size": 12, fill: C.grey,
    }, textL);
    setOpacity(scene.resultNote, 0);

    // ---- narration -----------------------------------------------------
    scene.status = txt("", {
      x: 64, y: 600, "font-size": 20, fill: C.gold,
    }, textL);
    scene.detail = txt("", {
      x: 64, y: 630, "font-size": 16, fill: C.grey,
    }, textL);
    scene.result = txt("", {
      x: STAGE_W / 2, y: 690, "text-anchor": "middle",
      "font-size": 26, fill: C.green,
    }, resultL);
    for (const node of [scene.status, scene.detail, scene.result]) setOpacity(node, 0);

    // ---- state helpers -------------------------------------------------
    scene.setPath = (path, currentIndex, currentLetter, rejected) => {
      for (const col of scene.columns) {
        for (const letter of col.letters) {
          const chosen = path[col.i] === letter.ch;
          const current = col.i === currentIndex && letter.ch === currentLetter;
          let fill = C.chipFill, stroke = C.greyDark, text = C.blue;
          if (chosen) {
            fill = "#17251a";
            stroke = C.green;
            text = C.green;
          }
          if (current) {
            fill = rejected ? "#2a1515" : "#262015";
            stroke = rejected ? C.red : C.gold;
            text = rejected ? C.red : C.gold;
          }
          letter.rect.setAttribute("fill", fill);
          letter.rect.setAttribute("stroke", stroke);
          letter.t.setAttribute("fill", text);
        }
        col.digitRect.setAttribute("fill", col.i === currentIndex ? "#262015" : C.chipFill);
        col.digitRect.setAttribute("stroke", col.i === currentIndex ? C.gold : C.greyDark);
        col.digitText.setAttribute("fill", col.i === currentIndex ? C.gold : C.white);
      }
      for (const chip of scene.pathChips) {
        if (chip.i < path.length) {
          const last = chip.i === path.length - 1;
          chip.t.textContent = path[chip.i];
          chip.t.setAttribute("fill", last ? C.gold : C.green);
          chip.rect.setAttribute("fill", last ? "#262015" : "#17251a");
          chip.rect.setAttribute("stroke", last ? C.gold : C.green);
          setOpacity(chip.g, 1);
        } else {
          chip.t.textContent = "·";
          chip.t.setAttribute("fill", C.grey);
          chip.rect.setAttribute("fill", C.chipFill);
          chip.rect.setAttribute("stroke", C.greyDark);
          setOpacity(chip.g, 1);
        }
      }
      scene.pathNote.textContent = path.length
        ? "path = \"" + path.join("") + "\"   (" + path.length + " / " + k + " positions)"
        : "path = \"\"   (0 / " + k + " positions)";
    };

    scene.setResults = (results, highlightLast) => {
      scene.resultTitle.textContent = "combinations (" + results.length + ")";
      for (let i = 0; i < scene.resultTexts.length; i++) {
        const t = scene.resultTexts[i];
        if (i < results.length) {
          t.textContent = "\"" + results[i] + "\"";
          t.setAttribute("fill", highlightLast && i === results.length - 1 ? C.gold : C.green);
          setOpacity(t, 1);
        } else {
          t.textContent = "";
          setOpacity(t, 0);
        }
      }
      const extra = results.length - scene.resultTexts.length;
      scene.resultNote.textContent = extra > 0
        ? "+ " + extra + " more combinations"
        : (results.length ? "each complete path spells one combination" : "");
      setOpacity(scene.resultNote, results.length ? 1 : 0);
    };

    // ---- reset ---------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.emptyInput, scene.pathPanel,
                          scene.pathTitle, scene.pathNote, scene.resultPanel,
                          scene.resultTitle, scene.resultNote, scene.status,
                          scene.detail, scene.result]) {
        if (node) setOpacity(node, 0);
      }
      for (const col of scene.columns) {
        setOpacity(col.g, 0);
        for (const letter of col.letters) setOpacity(letter.g, 0);
      }
      for (const chip of scene.pathChips) {
        chip.t.textContent = "·";
        chip.t.setAttribute("fill", C.grey);
        chip.rect.setAttribute("fill", C.chipFill);
        chip.rect.setAttribute("stroke", C.greyDark);
        setOpacity(chip.g, 0);
      }
      for (const t of scene.resultTexts) {
        t.textContent = "";
        setOpacity(t, 0);
      }
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.result.textContent = "";
      scene.pathNote.textContent = "";
      scene.resultTitle.textContent = "combinations (0)";
      scene.resultNote.textContent = "";
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity } = ctx;
    const { digits, sim } = scene;
    const easeOut = ease.outCubic;
    const k = digits.length;

    scene.reset();

    const status = (text, color, det, log) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || C.gold);
        setOpacity(scene.status, 1);
        if (det !== undefined) {
          scene.detail.textContent = det;
          setOpacity(scene.detail, 1);
        }
      });
      if (log !== false) tl.log(text, color || C.gold, { hold: false });
    };

    const setPath = (path, currentIndex, currentLetter, rejected) => {
      tl.add(0.01, () => scene.setPath(path, currentIndex, currentLetter, rejected));
    };

    const setResults = (results, highlightLast) => {
      tl.add(0.01, () => scene.setResults(results, highlightLast));
    };

    // ---- intro ---------------------------------------------------------
    tl.line([1, 2, 3]);
    tl.add(0.55, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    for (const col of scene.columns) {
      tl.add(0.12, u => setOpacity(col.g, u), easeOut);
      for (const letter of col.letters) {
        tl.add(0.04, u => setOpacity(letter.g, u), easeOut);
      }
    }
    if (scene.emptyInput) tl.add(0.3, u => setOpacity(scene.emptyInput, u), easeOut);
    for (const node of [scene.pathPanel, scene.pathTitle, scene.pathNote,
                        scene.resultPanel, scene.resultTitle, scene.resultNote]) {
      tl.add(0.15, u => setOpacity(node, u), easeOut);
    }

    if (!k) {
      status("digits == \"\"  →  return []", C.red,
        "the official convention treats an empty digit string as no combinations", true);
      tl.line([2, 3]);
      scene.setPath([], 0, null, false);
      tl.wait(0.2);
    } else {
      status("start with backtrack(0) and an empty path", C.blue,
        "one digit is consumed per recursion level", true);
      scene.setPath([], 0, null, false);
      tl.wait(0.1);

      // ---- events ------------------------------------------------------
      for (const ev of sim.events) {
        if (ev.kind === "enter") {
          tl.line([6, 7, 10]);
          setPath(ev.path, ev.index, null, false);
          status("backtrack(index = " + ev.index + ")", C.blue,
            "digit '" + digits[ev.index] + "' offers " +
            PHONE_DIGITS[digits[ev.index]].split("").map(ch => "'" + ch + "'").join(", "), false);
        } else if (ev.kind === "choose") {
          tl.line([10, 11, 12]);
          setPath(ev.path, ev.index, ev.ch, false);
          status("choose '" + ev.ch + "' for digit " + digits[ev.index] +
            "  →  path " + ev.path.length + " / " + k, C.gold,
            "recurse at the next digit position", true);
        } else if (ev.kind === "complete") {
          tl.line([7, 8, 9]);
          setPath(ev.path, null, null, false);
          setResults(ev.results, true);
          status("index == len(digits)  →  record \"" + ev.result + "\"", C.green,
            "one letter was chosen for every position", true);
        } else if (ev.kind === "unchoose") {
          tl.line([13]);
          setPath(ev.path, ev.index, ev.ch, true);
          status("un-choose '" + ev.ch + "'  →  try the next letter", C.red,
            "pop the letter before moving to its sibling", true);
        } else if (ev.kind === "return") {
          tl.line(10);
          setPath(ev.path, ev.index, null, false);
          status("return from index " + ev.index, C.grey,
            "all letters for this digit have been tried", false);
        }
        tl.wait(0.03);
      }
    }

    // ---- final answer --------------------------------------------------
    tl.add(0.01, () => {
      scene.result.textContent = "return " + sim.results.length +
        (sim.results.length === 1 ? " combination" : " combinations");
      setOpacity(scene.result, 1);
    });
    tl.add(0.5, u => setOpacity(scene.result, u), easeOut);
    tl.log("return " + sim.results.length + " combinations", C.green);
    tl.wait(0.8);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Phone keypad + simulation.
 * ------------------------------------------------------------------ */

const PHONE_DIGITS = {
  "2": "abc", "3": "def", "4": "ghi", "5": "jkl",
  "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz",
};

function simulateLetterCombinations(digits) {
  const events = [];
  const results = [];
  const path = [];

  if (!digits) return { events, results };

  const snapshot = (kind, extra) => {
    events.push({ kind, path: path.slice(), ...(extra || {}) });
  };

  const backtrack = index => {
    if (index === digits.length) {
      const result = path.join("");
      results.push(result);
      snapshot("complete", { index, result, results: results.slice() });
      return;
    }
    snapshot("enter", { index });
    for (const ch of PHONE_DIGITS[digits[index]]) {
      path.push(ch);
      snapshot("choose", { index, ch });
      backtrack(index + 1);
      path.pop();
      snapshot("unchoose", { index, ch });
    }
    snapshot("return", { index });
  };

  backtrack(0);
  return { events, results };
}
