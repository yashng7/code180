/* Palindrome Partitioning — animated backtracking walkthrough scene.
 *
 * At each start index the algorithm tries every possible end.  A substring is
 * kept only when it reads the same forwards and backwards; each accepted piece
 * is appended, the search continues after it, and the piece is popped again.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Palindrome Partitioning",
    subtitle: "try every end · keep palindromic pieces · a split that reaches len(s) is one result",
    inputs: [
      { id: "s", label: "s", type: "text", default: "aab", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "candidate substring" },
      { color: "#F0AC5F", text: "current piece" },
      { color: "#83C167", text: "palindrome / result" },
      { color: "#FC6255", text: "not a palindrome" },
    ],
  },

  code: [
    "def partition(s: str) -> List[List[str]]:",
    "    result: List[List[str]] = []",
    "    path: List[str] = []",
    "    def is_palindrome(left: int, right: int) -> bool:",
    "        while left < right:",
    "            if s[left] != s[right]:",
    "                return False",
    "            left += 1",
    "            right -= 1",
    "        return True",
    "    def backtrack(start: int) -> None:",
    "        if start == len(s):",
    "            result.append(path[:])          # a complete partition",
    "            return",
    "        for end in range(start, len(s)):",
    "            if not is_palindrome(start, end):",
    "                continue                    # prune: non-palindromic prefix",
    "            path.append(s[start:end + 1])   # choose",
    "            backtrack(end + 1)              # recurse",
    "            path.pop()                      # un-choose",
    "    backtrack(0)",
    "    return result",
  ],

  read(values) {
    const s = String(values.s == null ? "" : values.s);
    if (s.length > 10) return null;
    if (!/^[A-Za-z0-9]*$/.test(s)) return null;
    return { s };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || args.length !== 1 || typeof args[0] !== "string") return null;
    if (args[0].length > 10) return null;
    return { s: args[0] };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, STAGE_W } = ctx;
    const { s } = params;
    const sim = simulatePartition(s);
    const n = s.length;
    const maxResults = Math.max(1, sim.results.length);

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
      s, sim, ctx, cells: [], pathChips: [], resultTexts: [], cuts: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title ---------------------------------------------------------
    scene.title = txt("Palindrome Partitioning", {
      x: 64, y: 62, "font-size": 40, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    const sub = el("text", { x: 64, y: 98, "font-size": 18, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "s = ";
    el("tspan", { fill: C.white }, sub).textContent = "\"" + s + "\"";
    el("tspan", { fill: C.gold }, sub).textContent = "     every piece must read the same in both directions";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // ---- string strip --------------------------------------------------
    const gap = n > 8 ? 5 : 8;
    const cell = n
      ? clamp((1080 - gap * (n - 1)) / n, 42, 76)
      : 76;
    const stripW = n ? n * cell + (n - 1) * gap : 0;
    const stripX = STAGE_W / 2 - stripW / 2;
    const stripY = 158;
    const stripH = 64;
    const cellFont = clamp(cell * 0.42, 16, 30);

    scene.stripLabel = txt("s", {
      x: stripX, y: stripY - 14, "font-size": 13, fill: C.grey,
    }, textL);
    setOpacity(scene.stripLabel, 0);

    for (let i = 0; i < n; i++) {
      const x = stripX + i * (cell + gap);
      const g = el("g", { transform: "translate(" + x + " " + stripY + ")" }, chipsL);
      const rect = el("rect", {
        x: 0, y: 0, width: cell, height: stripH, rx: 8,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, g);
      const t = txt(s[i], {
        x: cell / 2, y: stripH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": cellFont, fill: C.white,
      }, g);
      const idx = txt(String(i), {
        x: cell / 2, y: stripH + 16, "text-anchor": "middle", "font-size": 10, fill: C.grey,
      }, g);
      setOpacity(g, 0);
      scene.cells.push({ i, g, rect, t, idx });
    }

    if (!n) {
      scene.emptyString = txt("s = \"\"  ·  the empty string is already one partition", {
        x: STAGE_W / 2, y: stripY + 35, "text-anchor": "middle",
        "font-size": 21, fill: C.grey,
      }, textL);
      setOpacity(scene.emptyString, 0);
    }

    const cutX = b => {
      if (!n) return stripX;
      if (b >= n) return stripX + n * cell + (n - 1) * gap + gap / 2;
      return stripX + b * (cell + gap) - gap / 2;
    };
    for (let b = 0; b <= n; b++) {
      const cut = el("line", {
        x1: cutX(b), y1: stripY - 13, x2: cutX(b), y2: stripY + stripH + 13,
        stroke: C.gold, "stroke-width": 3.2, "stroke-linecap": "round",
        filter: "url(#glow-gold)",
      }, chipsL);
      setOpacity(cut, 0);
      scene.cuts.push({ b, cut });
    }

    // ---- meta / palindrome check callout ------------------------------
    scene.meta = txt("start = 0", {
      x: 64, y: 265, "font-size": 17, fill: C.blue,
    }, textL);
    setOpacity(scene.meta, 0);
    scene.check = txt("", {
      x: 64, y: 296, "font-size": 16, fill: C.grey,
    }, textL);
    setOpacity(scene.check, 0);

    // ---- current partition panel --------------------------------------
    const pX = 64, pY = 322, pW = 560, pH = 232;
    scene.pathPanel = el("g", {}, chipsL);
    el("rect", {
      x: pX, y: pY, width: pW, height: pH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.pathPanel);
    setOpacity(scene.pathPanel, 0);
    scene.pathTitle = txt("current partition", {
      x: pX + 20, y: pY + 28, "font-size": 18, fill: C.blue,
    }, textL);
    setOpacity(scene.pathTitle, 0);

    const perRow = 4;
    const pieceGap = 8;
    const pieceW = clamp((pW - 40 - pieceGap * (perRow - 1)) / perRow, 70, 122);
    const pieceH = 48;
    const pieceFont = clamp(pieceW * 0.24, 12, 19);
    const pieceSlots = Math.max(1, Math.min(n, 10));
    for (let i = 0; i < pieceSlots; i++) {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const x = pX + 20 + col * (pieceW + pieceGap);
      const y = pY + 52 + row * 60;
      const g = el("g", { transform: "translate(" + x + " " + y + ")" }, chipsL);
      const rect = el("rect", {
        x: 0, y: 0, width: pieceW, height: pieceH, rx: 8,
        fill: "#17251a", stroke: C.green, "stroke-width": 2,
      }, g);
      const t = txt("", {
        x: pieceW / 2, y: 19, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": pieceFont, fill: C.green,
      }, g);
      const span = txt("", {
        x: pieceW / 2, y: 37, "text-anchor": "middle", "font-size": 9, fill: C.grey,
      }, g);
      setOpacity(g, 0);
      scene.pathChips.push({ i, g, rect, t, span });
    }
    scene.emptyPath = txt("path = []", {
      x: pX + pW / 2, y: pY + 106, "text-anchor": "middle",
      "font-size": 18, fill: C.grey,
    }, textL);
    setOpacity(scene.emptyPath, 0);
    scene.note = txt("gold cuts separate the pieces; every piece is a palindrome", {
      x: pX + 20, y: pY + pH - 16, "font-size": 12, fill: C.grey,
    }, textL);
    setOpacity(scene.note, 0);

    // ---- results panel -------------------------------------------------
    const rX = 650, rY = 322, rW = 566, rH = 232;
    scene.resultPanel = el("g", {}, chipsL);
    el("rect", {
      x: rX, y: rY, width: rW, height: rH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.resultPanel);
    setOpacity(scene.resultPanel, 0);
    scene.resultTitle = txt("partitions (0)", {
      x: rX + 20, y: rY + 28, "font-size": 18, fill: C.green,
    }, textL);
    setOpacity(scene.resultTitle, 0);

    const visibleResults = Math.min(maxResults, 9);
    for (let i = 0; i < visibleResults; i++) {
      const t = txt("", {
        x: rX + 22, y: rY + 58 + i * 19, "font-size": 12.5, fill: C.green,
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

    // ---- state helpers -------------------------------------------------
    scene.setSegment = (start, end, state) => {
      const colors = {
        check: ["#132a38", C.blue, C.blue],
        pal: ["#17251a", C.green, C.green],
        bad: ["#2a1515", C.red, C.red],
      };
      const paint = colors[state] || null;
      for (const node of scene.cells) {
        const active = paint && node.i >= start && node.i <= end;
        node.rect.setAttribute("fill", active ? paint[0] : C.chipFill);
        node.rect.setAttribute("stroke", active ? paint[1] : C.greyDark);
        node.t.setAttribute("fill", active ? paint[2] : C.white);
        node.idx.setAttribute("fill", active ? paint[1] : C.grey);
      }
    };

    scene.setPath = (pieces, currentIndex) => {
      for (const chip of scene.pathChips) {
        const piece = pieces[chip.i];
        if (piece) {
          const last = chip.i === pieces.length - 1;
          chip.t.textContent = "\"" + piece.text + "\"";
          chip.span.textContent = "s[" + piece.start + ".." + piece.end + "]";
          chip.rect.setAttribute("fill", last ? "#262015" : "#17251a");
          chip.rect.setAttribute("stroke", last ? C.gold : C.green);
          chip.t.setAttribute("fill", last ? C.gold : C.green);
          setOpacity(chip.g, 1);
        } else {
          chip.t.textContent = "";
          chip.span.textContent = "";
          setOpacity(chip.g, 0);
        }
      }
      setOpacity(scene.emptyPath, pieces.length ? 0 : 1);

      const boundaries = new Set(pieces.map(p => p.end + 1));
      for (const item of scene.cuts) {
        setOpacity(item.cut, boundaries.has(item.b) && item.b > 0 ? 1 : 0);
      }
      if (currentIndex != null && scene.cells[currentIndex]) {
        scene.cells[currentIndex].idx.setAttribute("fill", C.gold);
      }
    };

    scene.setResults = (results, highlightLast) => {
      scene.resultTitle.textContent = "partitions (" + results.length + ")";
      for (let i = 0; i < scene.resultTexts.length; i++) {
        const t = scene.resultTexts[i];
        if (i < results.length) {
          t.textContent = "[" + results[i].map(p => "\"" + p + "\"").join(", ") + "]";
          t.setAttribute("fill", highlightLast && i === results.length - 1 ? C.gold : C.green);
          setOpacity(t, 1);
        } else {
          t.textContent = "";
          setOpacity(t, 0);
        }
      }
      const extra = results.length - scene.resultTexts.length;
      scene.resultNote.textContent = extra > 0
        ? "+ " + extra + " more complete partitions"
        : (results.length ? "each complete path is one valid split" : "");
      setOpacity(scene.resultNote, results.length ? 1 : 0);
    };

    // ---- reset ---------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.stripLabel, scene.emptyString,
                          scene.meta, scene.check, scene.pathPanel, scene.pathTitle,
                          scene.emptyPath, scene.note, scene.resultPanel,
                          scene.resultTitle, scene.resultNote, scene.status,
                          scene.detail, scene.result]) {
        if (node) setOpacity(node, 0);
      }
      for (const node of scene.cells) {
        setOpacity(node.g, 0);
        node.rect.setAttribute("fill", C.chipFill);
        node.rect.setAttribute("stroke", C.greyDark);
        node.t.setAttribute("fill", C.white);
        node.idx.setAttribute("fill", C.grey);
      }
      for (const item of scene.cuts) setOpacity(item.cut, 0);
      for (const chip of scene.pathChips) {
        chip.t.textContent = "";
        chip.span.textContent = "";
        setOpacity(chip.g, 0);
      }
      for (const t of scene.resultTexts) {
        t.textContent = "";
        setOpacity(t, 0);
      }
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.result.textContent = "";
      scene.check.textContent = "";
      scene.meta.textContent = "start = 0";
      scene.resultTitle.textContent = "partitions (0)";
      scene.resultNote.textContent = "";
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity } = ctx;
    const { s, sim } = scene;
    const easeOut = ease.outCubic;
    const n = s.length;

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

    const setSegment = (start, end, state) => {
      tl.add(0.01, () => scene.setSegment(start, end, state));
    };

    const setCheck = (text, color) => {
      tl.add(0.01, () => {
        scene.check.textContent = text;
        scene.check.setAttribute("fill", color || C.grey);
        setOpacity(scene.check, 1);
      });
    };

    const setResults = (results, highlightLast) => {
      tl.add(0.01, () => scene.setResults(results, highlightLast));
    };

    // ---- intro ---------------------------------------------------------
    tl.line([1, 2, 3, 11]);
    tl.add(0.55, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    for (const node of scene.cells) tl.add(0.08, u => setOpacity(node.g, u), easeOut);
    if (scene.emptyString) tl.add(0.3, u => setOpacity(scene.emptyString, u), easeOut);
    for (const node of [scene.stripLabel, scene.meta, scene.check, scene.pathPanel,
                        scene.pathTitle, scene.emptyPath, scene.note,
                        scene.resultPanel, scene.resultTitle, scene.resultNote]) {
      tl.add(0.15, u => setOpacity(node, u), easeOut);
    }
    scene.setPath([], null);
    scene.setSegment(0, n - 1, "none");
    status("start with backtrack(0) and an empty path", C.blue,
      "each call chooses the next piece and recurses after it", true);
    tl.wait(0.1);

    // ---- events --------------------------------------------------------
    for (const ev of sim.events) {
      if (ev.kind === "enter") {
        tl.line([11, 12, 15]);
        tl.add(0.01, () => {
          scene.meta.textContent = "start = " + ev.start;
        });
        setSegment(ev.start, n - 1, "none");
        setCheck("", C.grey);
        status("backtrack(start = " + ev.start + ")", C.blue,
          ev.start === n ? "start == len(s): no characters left" : "try every end from start to len(s) - 1", false);
      } else if (ev.kind === "check") {
        tl.line([4, 5, 6, 7, 8, 9, 10, 15, 16]);
        setSegment(ev.start, ev.end, ev.pal ? "pal" : "bad");
        const label = "s[" + ev.start + ".." + ev.end + "] = \"" + ev.text + "\"";
        setCheck(label + (ev.pal ? "  ✓ palindrome" : "  ✗ not a palindrome"),
          ev.pal ? C.green : C.red);
        status("check " + label, ev.pal ? C.green : C.red,
          ev.pal ? "both ends match all the way to the centre" : "one mismatch is enough to reject this end", false);
      } else if (ev.kind === "choose") {
        tl.line([17, 18, 19]);
        scene.setPath(ev.pieces, ev.end + 1);
        setSegment(ev.start, ev.end, "pal");
        setCheck("\"" + ev.text + "\" is palindrome  →  append it", C.green);
        status("choose \"" + ev.text + "\"  →  next start = " + (ev.end + 1), C.gold,
          "the chosen piece stays in the path while the suffix is solved", true);
      } else if (ev.kind === "unchoose") {
        tl.line(20);
        scene.setPath(ev.pieces, ev.start);
        setSegment(ev.start, ev.end, "bad");
        setCheck("pop \"" + ev.text + "\"  →  try the next end", C.red);
        status("un-choose \"" + ev.text + "\"", C.red,
          "remove the piece before the loop tries a longer substring", true);
      } else if (ev.kind === "complete") {
        tl.line([24, 25, 26]);
        scene.setPath(ev.pieces, null);
        setResults(ev.results, true);
        const shown = ev.path.length ? ev.path.map(p => "\"" + p + "\"").join(", ") : "[]";
        status("start == len(s)  →  record [" + shown + "]", C.green,
          "every character belongs to exactly one palindromic piece", true);
      } else if (ev.kind === "return") {
        tl.line(15);
        setSegment(0, n - 1, "none");
        setCheck("", C.grey);
        status("return from start = " + ev.start, C.grey,
          "all ends have been tried at this level", false);
      }
      tl.wait(0.03);
    }

    // ---- final answer --------------------------------------------------
    tl.add(0.01, () => {
      scene.result.textContent = "return " + sim.results.length +
        (sim.results.length === 1 ? " partition" : " partitions");
      setOpacity(scene.result, 1);
    });
    tl.add(0.5, u => setOpacity(scene.result, u), easeOut);
    tl.log("return " + sim.results.length + " partitions", C.green);
    tl.wait(0.8);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Simulation.
 * ------------------------------------------------------------------ */

function simulatePartition(s) {
  const events = [];
  const results = [];
  const path = [];
  const pieces = [];
  const n = s.length;

  const snapshot = (kind, extra) => {
    events.push({
      kind,
      path: path.slice(),
      pieces: pieces.map(p => ({ start: p.start, end: p.end, text: p.text })),
      ...(extra || {}),
    });
  };

  const isPalindrome = (left, right) => {
    while (left < right) {
      if (s[left] !== s[right]) return false;
      left++;
      right--;
    }
    return true;
  };

  const backtrack = start => {
    snapshot("enter", { start });
    if (start === n) {
      results.push(path.slice());
      snapshot("complete", { start, results: results.map(r => r.slice()) });
      return;
    }
    for (let end = start; end < n; end++) {
      const pal = isPalindrome(start, end);
      const text = s.slice(start, end + 1);
      snapshot("check", { start, end, pal, text });
      if (!pal) continue;

      path.push(text);
      pieces.push({ start, end, text });
      snapshot("choose", { start, end, text });

      backtrack(end + 1);

      path.pop();
      pieces.pop();
      snapshot("unchoose", { start, end, text });
    }
    snapshot("return", { start });
  };

  backtrack(0);
  return { events, results };
}
