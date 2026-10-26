/* Combination Sum II — animated backtracking walkthrough scene.
 *
 * Candidates are sorted once.  A call records an exact hit, skips a duplicate
 * sibling, prunes values larger than the remaining target, or chooses a value
 * and recurses with index + 1 so every copy is used at most once.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Combination Sum II",
    subtitle: "sorted candidates · each copy used once · skip duplicate siblings · prune large values",
    inputs: [
      {
        id: "candidates",
        label: "candidates",
        type: "text",
        default: "2, 3, 6, 7",
        width: "wide",
      },
      { id: "target", label: "target", type: "number", default: 7 },
    ],
    legend: [
      { color: "#58C4DD", text: "candidate" },
      { color: "#F0AC5F", text: "chosen / remaining" },
      { color: "#83C167", text: "exact combination" },
      { color: "#FC6255", text: "duplicate / pruned branch" },
    ],
  },

  code: [
    "def combination_sum2(candidates: List[int], target: int) -> List[List[int]]:",
    "    candidates.sort()                       # equal values become adjacent",
    "    result: List[List[int]] = []",
    "    path: List[int] = []",
    "    def backtrack(start: int, remaining: int) -> None:",
    "        if remaining == 0:",
    "            result.append(path[:])",
    "            return",
    "        for index in range(start, len(candidates)):",
    "            if index > start and candidates[index] == candidates[index - 1]:",
    "                continue                    # skip duplicate siblings",
    "            value = candidates[index]",
    "            if value > remaining:",
    "                break                       # sorted -> nothing later fits",
    "            path.append(value)              # choose",
    "            backtrack(index + 1, remaining - value)   # recurse, no reuse",
    "            path.pop()                      # un-choose",
    "    backtrack(0, target)",
    "    return result",
  ],

  read(values) {
    const raw = String(values.candidates || "").trim();
    if (!raw) return null;
    const candidates = raw.split(/[\s,]+/).filter(Boolean).map(Number);
    const target = Number(values.target);
    if (candidates.length < 1 || candidates.length > 8) return null;
    if (!candidates.every(v => Number.isInteger(v) && v > 0 && v <= 99)) return null;
    if (!Number.isInteger(target) || target < 1 || target > 99) return null;
    return { candidates: candidates.slice().sort((a, b) => a - b), target };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || args.length !== 2 || !Array.isArray(args[0])) return null;
    const candidates = args[0].map(Number);
    const target = Number(args[1]);
    if (candidates.length < 1 || candidates.length > 8) return null;
    if (!candidates.every(Number.isInteger) || !Number.isInteger(target)) return null;
    return {
      candidates: candidates.slice().sort((a, b) => a - b).join(", "),
      target: String(target),
    };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const { candidates, target } = params;
    const sim = simulateCombinationSumII(candidates, target);
    const n = candidates.length;
    const maxDepth = Math.max(1, sim.maxDepth);
    const maxResults = sim.results.length;

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-red", C.red);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const arcsL = ctx.layer("arcs");
    const resultL = ctx.layer("result");

    const scene = {
      candidates, target, sim, ctx, chips: [], pathChips: [], resultTexts: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title ---------------------------------------------------------
    scene.title = txt("Combination Sum II", {
      x: 64, y: 62, "font-size": 40, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    const sub = el("text", { x: 64, y: 98, "font-size": 18, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "candidates = ";
    el("tspan", { fill: C.white }, sub).textContent = "[" + candidates.join(", ") + "]";
    el("tspan", {}, sub).textContent = "     target = ";
    el("tspan", { fill: C.gold }, sub).textContent = String(target);
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // ---- candidate chips ----------------------------------------------
    const gap = n > 5 ? 7 : 12;
    const chipW = clamp((1120 - gap * (n - 1)) / n, 48, 92);
    const chipH = 54;
    const totalW = n * chipW + (n - 1) * gap;
    const startX = STAGE_W / 2 - totalW / 2;
    const chipTop = 132;
    const chipFont = clamp(chipW * 0.38, 15, 28);

    candidates.forEach((value, i) => {
      const x = startX + i * (chipW + gap);
      const g = el("g", { transform: "translate(" + x + " " + chipTop + ")" }, chipsL);
      const enter = el("g", {}, g);
      const rect = el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx: 10,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, enter);
      const t = txt(String(value), {
        x: chipW / 2, y: chipH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": chipFont, fill: C.white,
      }, enter);
      const idx = txt("i=" + i, {
        x: chipW / 2, y: -10, "text-anchor": "middle", "font-size": 11, fill: C.grey,
      }, enter);
      const ring = el("rect", {
        x: -3, y: -3, width: chipW + 6, height: chipH + 6, rx: 12,
        fill: "none", stroke: C.gold, "stroke-width": 2.5, filter: "url(#glow-gold)",
      }, enter);
      setOpacity(enter, 0);
      setOpacity(ring, 0);
      scene.chips.push({ i, value, g, enter, rect, t, idx, ring });
    });

    // ---- path panel ----------------------------------------------------
    const pX = 48, pY = 230, pW = 610, pH = 330;
    scene.pathPanel = el("g", {}, chipsL);
    el("rect", {
      x: pX, y: pY, width: pW, height: pH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.pathPanel);
    setOpacity(scene.pathPanel, 0);
    scene.pathTitle = txt("current combination", {
      x: pX + 20, y: pY + 30, "font-size": 18, fill: C.blue,
    }, textL);
    setOpacity(scene.pathTitle, 0);

    const pathGap = 7;
    const pathW = clamp((pW - 40 - pathGap * (maxDepth - 1)) / maxDepth, 42, 110);
    const pathTotal = maxDepth * pathW + (maxDepth - 1) * pathGap;
    const pathStart = pX + pW / 2 - pathTotal / 2;
    const pathY = pY + 76;
    const pathH = 50;
    const pathFont = clamp(pathW * 0.34, 13, 22);
    for (let i = 0; i < maxDepth; i++) {
      const x = pathStart + i * (pathW + pathGap);
      const g = el("g", { transform: "translate(" + x + " " + pathY + ")" }, chipsL);
      const rect = el("rect", {
        x: 0, y: 0, width: pathW, height: pathH, rx: 9,
        fill: "#17251a", stroke: C.green, "stroke-width": 2,
      }, g);
      const t = txt("", {
        x: pathW / 2, y: pathH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": pathFont, fill: C.green,
      }, g);
      setOpacity(g, 0);
      scene.pathChips.push({ g, rect, t, x });
    }
    scene.emptyPath = txt("path = []", {
      x: pX + pW / 2, y: pathY + pathH / 2 + 1, "text-anchor": "middle",
      "dominant-baseline": "central", "font-size": 18, fill: C.grey,
    }, textL);
    setOpacity(scene.emptyPath, 0);

    scene.meta = txt("backtrack(start = 0, remaining = " + target + ")", {
      x: pX + 22, y: pY + 163, "font-size": 16, fill: C.gold,
    }, textL);
    setOpacity(scene.meta, 0);

    // remaining gauge
    scene.remainingLabel = txt("remaining target", {
      x: pX + 22, y: pY + 199, "font-size": 13, fill: C.grey,
    }, textL);
    scene.remainingValue = txt("remaining = " + target, {
      x: pX + 22, y: pY + 228, "font-size": 24, fill: C.gold,
    }, textL);
    const barX = pX + 22, barY = pY + 244, barW = pW - 44, barH = 15;
    scene.barBg = el("rect", {
      x: barX, y: barY, width: barW, height: barH, rx: 7,
      fill: "#1a2230", stroke: C.greyDark, "stroke-width": 1,
    }, chipsL);
    scene.bar = el("rect", {
      x: barX, y: barY, width: barW, height: barH, rx: 7,
      fill: C.gold,
    }, chipsL);
    for (const node of [scene.remainingLabel, scene.remainingValue]) setOpacity(node, 0);
    setOpacity(scene.barBg, 0);
    setOpacity(scene.bar, 0);
    scene.barW = barW;
    scene.barX = barX;
    scene.barY = barY;

    scene.note = txt("no reuse: recurse with index + 1 so this copy cannot be chosen again", {
      x: pX + 22, y: pY + 286, "font-size": 14, fill: C.grey,
    }, textL);
    setOpacity(scene.note, 0);

    // ---- result panel --------------------------------------------------
    const rX = 680, rY = 230, rW = 552, rH = 330;
    scene.resultPanel = el("g", {}, chipsL);
    el("rect", {
      x: rX, y: rY, width: rW, height: rH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.resultPanel);
    setOpacity(scene.resultPanel, 0);
    scene.resultTitle = txt("results (0)", {
      x: rX + 20, y: rY + 30, "font-size": 18, fill: C.green,
    }, textL);
    setOpacity(scene.resultTitle, 0);

    const cols = maxResults <= 4 ? 1 : 2;
    const rows = Math.max(1, Math.ceil(maxResults / cols));
    const rowH = clamp((rH - 80) / rows, 22, 34);
    const colW = (rW - 40) / cols;
    for (let i = 0; i < maxResults; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const t = txt("", {
        x: rX + 22 + col * colW,
        y: rY + 82 + row * rowH,
        "font-size": maxResults > 8 ? 12 : 13.5,
        fill: C.green,
      }, textL);
      setOpacity(t, 0);
      scene.resultTexts.push(t);
    }
    scene.resultNote = txt("", {
      x: rX + 20, y: rY + rH - 16, "font-size": 12, fill: C.grey,
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

    // ---- reset ---------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.pathPanel, scene.pathTitle,
                          scene.emptyPath, scene.meta, scene.remainingLabel,
                          scene.remainingValue, scene.barBg, scene.bar, scene.note,
                          scene.resultPanel, scene.resultTitle, scene.resultNote,
                          scene.status, scene.detail, scene.result]) {
        setOpacity(node, 0);
      }
      for (const chip of scene.chips) {
        setOpacity(chip.enter, 0);
        setOpacity(chip.ring, 0);
        chip.rect.setAttribute("fill", C.chipFill);
        chip.rect.setAttribute("stroke", C.greyDark);
        chip.t.setAttribute("fill", C.white);
      }
      for (const chip of scene.pathChips) setOpacity(chip.g, 0);
      for (const t of scene.resultTexts) {
        t.textContent = "";
        setOpacity(t, 0);
      }
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.result.textContent = "";
      scene.meta.textContent = "backtrack(start = 0, remaining = " + target + ")";
      scene.remainingValue.textContent = "remaining = " + target;
      scene.resultTitle.textContent = "results (0)";
      scene.resultNote.textContent = "";
      scene.bar.setAttribute("width", "0");
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity } = ctx;
    const { candidates, target, sim } = scene;
    const easeOut = ease.outCubic;

    scene.reset();

    const status = (text, color, det, hold) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || C.gold);
        setOpacity(scene.status, 1);
        if (det !== undefined) {
          scene.detail.textContent = det;
          setOpacity(scene.detail, 1);
        }
      });
      if (hold === false) tl.log(text, color || C.gold, { hold: false });
      else tl.log(text, color || C.gold);
    };

    const setPath = (path, picked) => {
      tl.add(0.2, u => {
        for (let i = 0; i < scene.pathChips.length; i++) {
          const chip = scene.pathChips[i];
          if (i < path.length) {
            chip.t.textContent = String(path[i]);
            setOpacity(chip.g, i === path.length - 1 ? u : 1);
            chip.rect.setAttribute("stroke", i === path.length - 1 ? C.gold : C.green);
            chip.rect.setAttribute("fill", i === path.length - 1 ? "#262015" : "#17251a");
            chip.t.setAttribute("fill", i === path.length - 1 ? C.gold : C.green);
          } else {
            setOpacity(chip.g, 0);
          }
        }
        setOpacity(scene.emptyPath, path.length ? 0 : u);
        for (const chip of scene.chips) {
          const inPath = picked.includes(chip.i);
          if (inPath) {
            chip.rect.setAttribute("fill", "#17251a");
            chip.rect.setAttribute("stroke", C.green);
            chip.t.setAttribute("fill", C.green);
          } else {
            chip.rect.setAttribute("fill", C.chipFill);
            chip.rect.setAttribute("stroke", C.greyDark);
            chip.t.setAttribute("fill", C.white);
          }
        }
      }, easeOut);
    };

    const setCurrent = (index, conflict) => {
      tl.add(0.01, () => {
        for (const chip of scene.chips) {
          setOpacity(chip.ring, chip.i === index ? 1 : 0);
          if (chip.i === index) chip.ring.setAttribute("stroke", conflict ? C.red : C.gold);
        }
      });
    };

    const setDuplicate = index => {
      tl.add(0.01, () => {
        for (const chip of scene.chips) {
          const on = chip.i === index || chip.i === index - 1;
          setOpacity(chip.ring, on ? 1 : 0);
          if (on) chip.ring.setAttribute("stroke", C.red);
        }
      });
    };

    const setRemaining = (remaining, total) => {
      tl.add(0.01, () => {
        scene.remainingValue.textContent = "remaining = " + remaining;
        scene.remainingValue.setAttribute("fill", remaining === 0 ? C.green : C.gold);
        scene.bar.setAttribute("fill", remaining === 0 ? C.green : C.gold);
        scene.bar.setAttribute("width", String(scene.barW * Math.max(0, Math.min(1, remaining / total))));
      });
    };

    const setResults = (results, highlightLast) => {
      tl.add(0.01, () => {
        scene.resultTitle.textContent = "results (" + results.length + ")";
        for (let i = 0; i < scene.resultTexts.length; i++) {
          const t = scene.resultTexts[i];
          if (i < results.length) {
            t.textContent = "[" + results[i].join(", ") + "]";
            t.setAttribute("fill", highlightLast && i === results.length - 1 ? C.gold : C.green);
            setOpacity(t, 1);
          } else {
            t.textContent = "";
            setOpacity(t, 0);
          }
        }
        scene.resultNote.textContent = results.length
          ? "each exact hit is unique because duplicate siblings are skipped"
          : "";
        setOpacity(scene.resultNote, 1);
      });
    };

    // ---- intro ---------------------------------------------------------
    tl.line([1, 2, 3, 4, 5]);
    tl.add(0.55, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    for (const chip of scene.chips) tl.add(0.14, u => setOpacity(chip.enter, u), easeOut);
    for (const node of [scene.pathPanel, scene.pathTitle, scene.meta,
                        scene.remainingLabel, scene.remainingValue, scene.barBg,
                        scene.bar, scene.note, scene.resultPanel, scene.resultTitle,
                        scene.emptyPath, scene.resultNote]) {
      tl.add(0.18, u => setOpacity(node, u), easeOut);
    }
    status("sort the candidates, then start with an empty path and remaining = " + target, C.blue,
      "sorting exposes duplicate siblings and makes the value > remaining break safe");
    setPath([], []);
    setRemaining(target, target);
    tl.wait(0.1);

    // ---- events --------------------------------------------------------
    for (const ev of sim.events) {
      if (ev.kind === "add") {
        tl.line([6, 7, 8]);
        setPath(ev.path, ev.picked);
        setCurrent(null);
        setRemaining(0, target);
        setResults(ev.results, true);
        status("remaining == 0  ·  record [" + ev.path.join(", ") + "]", C.green,
          "an exact hit is a complete combination; return to the caller", false);
      } else if (ev.kind === "skip") {
        tl.line([9, 10, 11]);
        setDuplicate(ev.index);
        status("candidates[" + ev.index + "] == candidates[" + (ev.index - 1) + "]  →  continue", C.red,
          "this value already opened the same branch at this level; skip the duplicate sibling", false);
      } else if (ev.kind === "choose") {
        tl.line([9, 12, 15, 16]);
        setCurrent(ev.index);
        setPath(ev.path, ev.picked);
        setRemaining(ev.remaining, target);
        status("choose " + candidates[ev.index] + "  →  remaining " + ev.remaining, C.gold,
          "recurse with index + 1, so this exact copy is used at most once", false);
      } else if (ev.kind === "prune") {
        tl.line([12, 13, 14]);
        setCurrent(ev.index, true);
        status(candidates[ev.index] + " > remaining " + ev.remaining + "  →  break", C.red,
          "the candidates are sorted, so every later value is too large as well", false);
      } else if (ev.kind === "unchoose") {
        tl.line(17);
        setPath(ev.path, ev.picked);
        setCurrent(null);
        setRemaining(ev.remaining, target);
        status("un-choose " + candidates[ev.index] + "  →  remaining " + ev.remaining, C.red,
          "pop the value and let the loop try the next candidate", false);
      } else if (ev.kind === "done") {
        tl.line([18, 19]);
        setResults(ev.results, false);
        status("return all " + ev.results.length + " combinations", C.green,
          "the search is complete; duplicates never created a repeated result", false);
      }
      tl.wait(0.22);
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
 * Simulation.
 * ------------------------------------------------------------------ */

function simulateCombinationSumII(candidates, target) {
  const events = [];
  const results = [];
  const path = [];
  const picked = [];
  let maxDepth = 1;

  const snapshot = (kind, line, extra) => {
    maxDepth = Math.max(maxDepth, path.length);
    events.push({
      kind, line,
      path: path.slice(),
      picked: picked.slice(),
      results: results.map(r => r.slice()),
      ...(extra || {}),
    });
  };

  const backtrack = (start, remaining) => {
    if (remaining === 0) {
      results.push(path.slice());
      snapshot("add", [6, 7, 8], { remaining: 0 });
      return;
    }
    for (let index = start; index < candidates.length; index++) {
      if (index > start && candidates[index] === candidates[index - 1]) {
        snapshot("skip", [9, 10, 11], { start, index, remaining });
        continue;
      }
      const value = candidates[index];
      if (value > remaining) {
        snapshot("prune", [12, 13, 14], { index, value, remaining });
        break;
      }
      path.push(value);
      picked.push(index);
      snapshot("choose", [9, 12, 15, 16], { index, value, remaining: remaining - value });
      backtrack(index + 1, remaining - value);
      path.pop();
      picked.pop();
      snapshot("unchoose", 17, { index, value, remaining });
    }
  };

  backtrack(0, target);
  snapshot("done", [18, 19], { remaining: 0 });
  return { events, results, maxDepth };
}
