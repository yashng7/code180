/* Permutations — animated backtracking walkthrough scene.
 *
 * A permutation is a full path through the decision tree.  At every level we
 * scan the input, skip values already used, mark the chosen index, recurse, and
 * then clear both the path entry and the used flag.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Permutations",
    subtitle: "choose an unused value for each position · used flags prevent reuse · undo on return",
    inputs: [
      {
        id: "nums",
        label: "nums",
        type: "text",
        default: "1, 2, 3",
        width: "wide",
      },
    ],
    legend: [
      { color: "#58C4DD", text: "unused value" },
      { color: "#F0AC5F", text: "current choice" },
      { color: "#83C167", text: "used / in path" },
      { color: "#FC6255", text: "un-choose" },
    ],
  },

  code: [
    "def permute(nums: List[int]) -> List[List[int]]:",
    "    result: List[List[int]] = []",
    "    path: List[int] = []",
    "    used = [False] * len(nums)",
    "    def backtrack() -> None:",
    "        if len(path) == len(nums):",
    "            result.append(path[:])          # a full permutation",
    "            return",
    "        for index in range(len(nums)):",
    "            if used[index]:",
    "                continue",
    "            used[index] = True              # choose",
    "            path.append(nums[index])",
    "            backtrack()                     # recurse",
    "            path.pop()                      # un-choose",
    "            used[index] = False",
    "    backtrack()",
    "    return result",
  ],

  read(values) {
    const raw = String(values.nums || "").trim();
    const nums = raw ? raw.split(/[\s,]+/).filter(Boolean).map(Number) : [];
    if (nums.length > 4) return null;
    if (!nums.every(v => Number.isInteger(v) && Math.abs(v) <= 99)) return null;
    return { nums };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || args.length !== 1 || !Array.isArray(args[0])) return null;
    const nums = args[0].map(Number);
    if (nums.length > 4 || !nums.every(Number.isInteger)) return null;
    return { nums: nums.join(", ") };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, STAGE_W } = ctx;
    const { nums } = params;
    const sim = simulatePermutations(nums);
    const n = nums.length;
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
      nums, sim, ctx, chips: [], pathChips: [], usedChips: [], resultTexts: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title ---------------------------------------------------------
    scene.title = txt("Permutations", {
      x: 64, y: 62, "font-size": 40, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    const sub = el("text", { x: 64, y: 98, "font-size": 18, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "nums = ";
    el("tspan", { fill: C.white }, sub).textContent = "[" + nums.join(", ") + "]";
    el("tspan", { fill: C.gold }, sub).textContent = "     order matters · use every value exactly once";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // ---- input chips ---------------------------------------------------
    const gap = n > 5 ? 7 : 12;
    const chipW = n ? clamp((1120 - gap * (n - 1)) / n, 50, 92) : 92;
    const chipH = 54;
    const totalW = n ? n * chipW + (n - 1) * gap : 0;
    const startX = STAGE_W / 2 - totalW / 2;
    const chipTop = 132;
    const chipFont = clamp(chipW * 0.38, 15, 28);

    nums.forEach((value, i) => {
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

    if (!n) {
      scene.emptyInput = txt("nums = []", {
        x: STAGE_W / 2, y: chipTop + 28, "text-anchor": "middle",
        "font-size": 20, fill: C.grey,
      }, textL);
      setOpacity(scene.emptyInput, 0);
    }

    // ---- path panel ----------------------------------------------------
    const pX = 48, pY = 230, pW = 610, pH = 330;
    scene.pathPanel = el("g", {}, chipsL);
    el("rect", {
      x: pX, y: pY, width: pW, height: pH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.pathPanel);
    setOpacity(scene.pathPanel, 0);
    scene.pathTitle = txt("current permutation", {
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

    scene.meta = txt("path length 0 / " + n + "     used = [" + new Array(n).fill("F").join(", ") + "]", {
      x: pX + 22, y: pY + 163, "font-size": 16, fill: C.gold,
    }, textL);
    setOpacity(scene.meta, 0);
    scene.note = txt("a full path of length n is one permutation", {
      x: pX + 22, y: pY + 204, "font-size": 14, fill: C.grey,
    }, textL);
    setOpacity(scene.note, 0);

    // used flags
    const usedY = pY + 245;
    scene.usedTitle = txt("used flags", {
      x: pX + 22, y: usedY - 14, "font-size": 13, fill: C.grey,
    }, textL);
    setOpacity(scene.usedTitle, 0);
    const usedW = n ? clamp((pW - 60 - 8 * (n - 1)) / n, 44, 78) : 44;
    for (let i = 0; i < n; i++) {
      const x = pX + 22 + i * (usedW + 8);
      const g = el("g", { transform: "translate(" + x + " " + usedY + ")" }, chipsL);
      const rect = el("rect", {
        x: 0, y: 0, width: usedW, height: 38, rx: 7,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.8,
      }, g);
      const t = txt("F", {
        x: usedW / 2, y: 20, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": 15, fill: C.blue,
      }, g);
      const lab = txt("i=" + i, {
        x: usedW / 2, y: -8, "text-anchor": "middle", "font-size": 9, fill: C.grey,
      }, g);
      setOpacity(g, 0);
      scene.usedChips.push({ i, g, rect, t, lab });
    }

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

    const cols = maxResults <= 4 ? 1 : maxResults <= 8 ? 2 : 4;
    const rows = Math.max(1, Math.ceil(maxResults / cols));
    const rowH = clamp((rH - 80) / rows, 18, 30);
    const colW = (rW - 40) / cols;
    for (let i = 0; i < maxResults; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const t = txt("", {
        x: rX + 22 + col * colW,
        y: rY + 82 + row * rowH,
        "font-size": maxResults > 16 ? 12 : 13.5,
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
                          scene.emptyPath, scene.meta, scene.note, scene.usedTitle,
                          scene.resultPanel, scene.resultTitle, scene.resultNote,
                          scene.status, scene.detail, scene.result]) {
        setOpacity(node, 0);
      }
      if (scene.emptyInput) setOpacity(scene.emptyInput, 0);
      for (const chip of scene.chips) {
        setOpacity(chip.enter, 0);
        setOpacity(chip.ring, 0);
        chip.rect.setAttribute("fill", C.chipFill);
        chip.rect.setAttribute("stroke", C.greyDark);
        chip.t.setAttribute("fill", C.white);
      }
      for (const chip of scene.pathChips) setOpacity(chip.g, 0);
      for (const chip of scene.usedChips) {
        setOpacity(chip.g, 0);
        chip.t.textContent = "F";
        chip.t.setAttribute("fill", C.blue);
        chip.rect.setAttribute("fill", C.chipFill);
        chip.rect.setAttribute("stroke", C.greyDark);
      }
      for (const t of scene.resultTexts) {
        t.textContent = "";
        setOpacity(t, 0);
      }
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.result.textContent = "";
      scene.meta.textContent = "path length 0 / " + n + "     used = [" + new Array(n).fill("F").join(", ") + "]";
      scene.resultTitle.textContent = "results (0)";
      scene.resultNote.textContent = "";
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity } = ctx;
    const { nums, sim } = scene;
    const easeOut = ease.outCubic;
    const n = nums.length;

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

    const setPath = (path, used) => {
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
          const on = used[chip.i];
          const inPath = path.length && path[path.length - 1] === chip.value;
          if (on) {
            chip.rect.setAttribute("fill", "#17251a");
            chip.rect.setAttribute("stroke", C.green);
            chip.t.setAttribute("fill", C.green);
          } else {
            chip.rect.setAttribute("fill", C.chipFill);
            chip.rect.setAttribute("stroke", C.greyDark);
            chip.t.setAttribute("fill", C.white);
          }
          if (inPath) chip.rect.setAttribute("stroke", C.gold);
        }
        for (const chip of scene.usedChips) {
          chip.t.textContent = used[chip.i] ? "T" : "F";
          chip.t.setAttribute("fill", used[chip.i] ? C.green : C.blue);
          chip.rect.setAttribute("fill", used[chip.i] ? "#17251a" : C.chipFill);
          chip.rect.setAttribute("stroke", used[chip.i] ? C.green : C.greyDark);
        }
        scene.meta.textContent = "path length " + path.length + " / " + n + "     used = [" +
          used.map(v => v ? "T" : "F").join(", ") + "]";
      }, easeOut);
    };

    const setCurrent = index => {
      tl.add(0.01, () => {
        for (const chip of scene.chips) {
          setOpacity(chip.ring, chip.i === index ? 1 : 0);
          if (chip.i === index) chip.ring.setAttribute("stroke", C.gold);
        }
        for (const chip of scene.usedChips) chip.rect.setAttribute("stroke", chip.i === index ? C.gold : (chip.t.textContent === "T" ? C.green : C.greyDark));
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
        scene.resultNote.textContent = results.length ? "each full path is one permutation" : "";
        setOpacity(scene.resultNote, 1);
      });
    };

    // ---- intro ---------------------------------------------------------
    tl.line([1, 2, 3, 4, 5]);
    tl.add(0.55, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    for (const chip of scene.chips) tl.add(0.14, u => setOpacity(chip.enter, u), easeOut);
    if (scene.emptyInput) tl.add(0.2, u => setOpacity(scene.emptyInput, u), easeOut);
    for (const node of [scene.pathPanel, scene.pathTitle, scene.meta, scene.note,
                        scene.usedTitle, scene.resultPanel, scene.resultTitle,
                        scene.emptyPath, scene.resultNote]) {
      tl.add(0.18, u => setOpacity(node, u), easeOut);
    }
    for (const chip of scene.usedChips) tl.add(0.1, u => setOpacity(chip.g, u), easeOut);
    status("start with an empty path and every used flag false", C.blue,
      "at each level try every index that is not used yet");
    setPath([], new Array(n).fill(false));
    tl.wait(0.1);

    // ---- events --------------------------------------------------------
    for (const ev of sim.events) {
      if (ev.kind === "add") {
        tl.line([6, 7, 8]);
        setPath(ev.path, ev.used);
        setResults(ev.results, true);
        status("path length == n  ·  record [" + ev.path.join(", ") + "]", C.green,
          "a full permutation has used every input value exactly once", false);
      } else if (ev.kind === "choose") {
        tl.line([9, 10, 11, 12, 13, 14]);
        setCurrent(ev.index);
        setPath(ev.path, ev.used);
        status("choose nums[" + ev.index + "] = " + nums[ev.index] + "  →  used[" + ev.index + "] = True", C.gold,
          "recurse to fill the next position; the other candidates remain available", false);
      } else if (ev.kind === "unchoose") {
        tl.line([15, 16]);
        setPath(ev.path, ev.used);
        setCurrent(null);
        status("un-choose " + nums[ev.index] + "  →  used[" + ev.index + "] = False", C.red,
          "the parent call can now try a different value in this position", false);
      } else if (ev.kind === "done") {
        tl.line([17, 18]);
        setResults(ev.results, false);
        status("return all " + ev.results.length + " permutations", C.green,
          "each leaf of the decision tree contributed one result", false);
      }
      tl.wait(ev.kind === "add" ? 0.28 : 0.2);
    }

    // ---- final answer --------------------------------------------------
    tl.add(0.01, () => {
      scene.result.textContent = "return " + sim.results.length +
        (sim.results.length === 1 ? " permutation" : " permutations");
      setOpacity(scene.result, 1);
    });
    tl.add(0.5, u => setOpacity(scene.result, u), easeOut);
    tl.log("return " + sim.results.length + " permutations", C.green);
    tl.wait(0.8);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Simulation.
 * ------------------------------------------------------------------ */

function simulatePermutations(nums) {
  const events = [];
  const results = [];
  const path = [];
  const used = new Array(nums.length).fill(false);
  const picked = [];
  let maxDepth = 0;

  const snapshot = (kind, line, extra) => {
    maxDepth = Math.max(maxDepth, path.length);
    events.push({
      kind, line,
      path: path.slice(),
      used: used.slice(),
      picked: picked.slice(),
      results: results.map(r => r.slice()),
      ...(extra || {}),
    });
  };

  const backtrack = () => {
    if (path.length === nums.length) {
      results.push(path.slice());
      snapshot("add", [6, 7, 8], {});
      return;
    }
    for (let index = 0; index < nums.length; index++) {
      if (used[index]) continue;
      used[index] = true;
      path.push(nums[index]);
      picked.push(index);
      snapshot("choose", [9, 10, 11, 12, 13, 14], { index });
      backtrack();
      path.pop();
      picked.pop();
      used[index] = false;
      snapshot("unchoose", [15, 16], { index });
    }
  };

  backtrack();
  snapshot("done", [17, 18], {});
  return { events, results, maxDepth };
}
