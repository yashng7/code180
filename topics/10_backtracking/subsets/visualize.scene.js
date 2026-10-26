/* Subsets — animated backtracking walkthrough scene.
 *
 * Every recursive call is a valid subset, so the scene starts by recording the
 * current path, then loops over the remaining indices: choose one value,
 * recurse with the next start, and un-choose before trying the next sibling.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Subsets",
    subtitle: "every node of the recursion tree is a subset · choose → recurse → un-choose",
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
      { color: "#58C4DD", text: "available value" },
      { color: "#F0AC5F", text: "chosen / current index" },
      { color: "#83C167", text: "recorded subset" },
      { color: "#FC6255", text: "un-choose" },
    ],
  },

  code: [
    "def subsets(nums: List[int]) -> List[List[int]]:",
    "    result: List[List[int]] = []",
    "    path: List[int] = []",
    "    def backtrack(start: int) -> None:",
    "        result.append(path[:])              # every node of the tree is a subset",
    "        for index in range(start, len(nums)):",
    "            path.append(nums[index])        # choose",
    "            backtrack(index + 1)            # recurse",
    "            path.pop()                      # un-choose",
    "    backtrack(0)",
    "    return result",
  ],

  read(values) {
    const raw = String(values.nums || "").trim();
    const nums = raw ? raw.split(/[\s,]+/).filter(Boolean).map(Number) : [];
    if (nums.length > 6) return null;
    if (!nums.every(v => Number.isInteger(v) && Math.abs(v) <= 99)) return null;
    return { nums };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || args.length !== 1 || !Array.isArray(args[0])) return null;
    const nums = args[0].map(Number);
    if (nums.length > 6 || !nums.every(Number.isInteger)) return null;
    return { nums: nums.join(", ") };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const { nums } = params;
    const sim = simulateSubsets(nums);
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
      nums, sim, ctx, chips: [], pathChips: [], resultTexts: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title ---------------------------------------------------------
    scene.title = txt("Subsets", {
      x: 64, y: 62, "font-size": 40, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    const sub = el("text", { x: 64, y: 98, "font-size": 18, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "nums = ";
    el("tspan", { fill: C.white }, sub).textContent = "[" + nums.join(", ") + "]";
    el("tspan", { fill: C.gold }, sub).textContent = "     every subset is a node of the recursion tree";
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
      scene.chips.push({ i, value, g, enter, rect, t, idx, ring, cx: x + chipW / 2 });
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
    scene.pathTitle = txt("current path", {
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

    scene.meta = txt("backtrack(start = 0)", {
      x: pX + 22, y: pY + 163, "font-size": 16, fill: C.gold,
    }, textL);
    setOpacity(scene.meta, 0);
    scene.note = txt("each call records its own path, then branches on later indices", {
      x: pX + 22, y: pY + 205, "font-size": 14, fill: C.grey,
    }, textL);
    setOpacity(scene.note, 0);
    scene.treeHint = txt("recursion tree  ·  root = []  ·  children add one later value", {
      x: pX + 22, y: pY + 245, "font-size": 13, fill: C.grey,
    }, textL);
    setOpacity(scene.treeHint, 0);

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

    const cols = maxResults <= 4 ? 1 : maxResults <= 16 ? 2 : 4;
    const rows = Math.max(1, Math.ceil(maxResults / cols));
    const rowH = clamp((rH - 74) / rows, 18, 30);
    const colW = (rW - 40) / cols;
    for (let i = 0; i < maxResults; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const t = txt("", {
        x: rX + 22 + col * colW,
        y: rY + 78 + row * rowH,
        "font-size": maxResults > 20 ? 12 : 13.5,
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
    setOpacity(scene.status, 0);
    setOpacity(scene.detail, 0);
    setOpacity(scene.result, 0);

    // ---- reset ---------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.pathPanel, scene.pathTitle,
                          scene.emptyPath, scene.meta, scene.note, scene.treeHint,
                          scene.resultPanel, scene.resultTitle, scene.status,
                          scene.detail, scene.result, scene.resultNote]) {
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
      for (const t of scene.resultTexts) {
        t.textContent = "";
        setOpacity(t, 0);
      }
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.result.textContent = "";
      scene.meta.textContent = "backtrack(start = 0)";
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

    const status = (text, color, det) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || C.gold);
        setOpacity(scene.status, 1);
        if (det !== undefined) {
          scene.detail.textContent = det;
          setOpacity(scene.detail, 1);
        }
      });
      tl.log(text, color || C.gold);
    };

    const setPath = (path, picked) => {
      tl.add(0.22, u => {
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

    const setCurrent = index => {
      tl.add(0.01, () => {
        for (const chip of scene.chips) {
          setOpacity(chip.ring, chip.i === index ? 1 : 0);
          if (chip.i === index) chip.ring.setAttribute("stroke", C.gold);
        }
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
          ? "each recursive call contributes exactly one subset"
          : "";
        setOpacity(scene.resultNote, 1);
      });
    };

    // ---- intro ---------------------------------------------------------
    tl.line([1, 2, 3, 4]);
    tl.add(0.55, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    for (const chip of scene.chips) tl.add(0.14, u => setOpacity(chip.enter, u), easeOut);
    if (scene.emptyInput) tl.add(0.2, u => setOpacity(scene.emptyInput, u), easeOut);
    for (const node of [scene.pathPanel, scene.pathTitle, scene.meta, scene.note,
                        scene.treeHint, scene.resultPanel, scene.resultTitle,
                        scene.emptyPath, scene.resultNote]) {
      tl.add(0.18, u => setOpacity(node, u), easeOut);
    }
    status("start with backtrack(0) and an empty path", C.blue,
      "result.append(path[:]) records the empty subset immediately");
    setPath([], []);
    tl.wait(0.1);

    // ---- events --------------------------------------------------------
    for (const ev of sim.events) {
      if (ev.kind === "add") {
        tl.line(5);
        setResults(ev.results, true);
        setPath(ev.path, ev.picked);
        status("record path " + (ev.path.length ? "[" + ev.path.join(", ") + "]" : "[]"), C.green,
          "every node of the recursion tree is a valid subset");
      } else if (ev.kind === "choose") {
        tl.line([6, 7, 8]);
        setCurrent(ev.index);
        setPath(ev.path, ev.picked);
        status("choose nums[" + ev.index + "] = " + nums[ev.index] + "  →  recurse", C.gold,
          "start the next call at index " + (ev.index + 1) + " so later values are considered only once");
      } else if (ev.kind === "unchoose") {
        tl.line(9);
        setPath(ev.path, ev.picked);
        setCurrent(null);
        status("un-choose " + nums[ev.index] + "  →  path.pop()", C.red,
          "the sibling branch can now try the next index");
      } else if (ev.kind === "done") {
        tl.line([10, 11]);
        setResults(ev.results, false);
        status("return all " + ev.results.length + " subsets", C.green,
          "the recursion has visited every node exactly once");
      }
      tl.wait(0.06);
    }

    // ---- final answer --------------------------------------------------
    tl.add(0.01, () => {
      scene.result.textContent = "return " + sim.results.length + (sim.results.length === 1 ? " subset" : " subsets");
      setOpacity(scene.result, 1);
    });
    tl.add(0.5, u => setOpacity(scene.result, u), easeOut);
    tl.log("return " + sim.results.length + " subsets", C.green);
    tl.wait(0.8);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Simulation.
 * ------------------------------------------------------------------ */

function simulateSubsets(nums) {
  const events = [];
  const results = [];
  const path = [];
  const picked = [];
  let maxDepth = 0;

  const snapshot = (kind, line, status, detail, extra) => {
    maxDepth = Math.max(maxDepth, path.length);
    events.push({
      kind, line, status, detail,
      path: path.slice(),
      picked: picked.slice(),
      results: results.map(r => r.slice()),
      ...(extra || {}),
    });
  };

  const backtrack = start => {
    results.push(path.slice());
    snapshot("add", 5, "", "", { start });
    for (let index = start; index < nums.length; index++) {
      path.push(nums[index]);
      picked.push(index);
      snapshot("choose", [7, 8], "", "", { start, index });
      backtrack(index + 1);
      path.pop();
      picked.pop();
      snapshot("unchoose", 9, "", "", { start, index });
    }
  };

  backtrack(0);
  snapshot("done", [10, 11], "", "", {});
  return { events, results, maxDepth };
}
