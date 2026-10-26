/* N-Queens — animated backtracking walkthrough scene.
 *
 * One queen is placed per row.  A column is rejected when its column, r + c
 * diagonal or r - c anti-diagonal is already occupied; a full board is copied
 * into the results, then the last queen is lifted again.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "N-Queens",
    subtitle: "one queen per row · reject attacked columns · row == n records a board",
    inputs: [
      { id: "n", label: "n", type: "number", default: 4 },
    ],
    legend: [
      { color: "#58C4DD", text: "current row" },
      { color: "#F0AC5F", text: "queen / candidate" },
      { color: "#83C167", text: "complete board" },
      { color: "#FC6255", text: "attacked cell" },
    ],
  },

  code: [
    "def solve_n_queens(n: int) -> List[List[str]]:",
    "    result: List[List[str]] = []",
    "    cols: set[int] = set()          # occupied columns",
    "    diag: set[int] = set()          # occupied r + c diagonals",
    "    anti: set[int] = set()          # occupied r - c diagonals",
    "    queens: List[int] = []          # queens[row] = column of the queen in that row",
    "    def backtrack(row: int) -> None:",
    "        if row == n:",
    "            result.append(",
    "                [\".\" * col + \"Q\" + \".\" * (n - 1 - col) for col in queens]",
    "            )",
    "            return",
    "        for col in range(n):",
    "            if col in cols or (row + col) in diag or (row - col) in anti:",
    "                continue                # attacked -> prune this branch",
    "            cols.add(col)               # choose",
    "            diag.add(row + col)",
    "            anti.add(row - col)",
    "            queens.append(col)",
    "            backtrack(row + 1)          # recurse",
    "            queens.pop()                # un-choose",
    "            cols.remove(col)",
    "            diag.remove(row + col)",
    "            anti.remove(row - col)",
    "    backtrack(0)",
    "    return result",
  ],

  read(values) {
    const n = Number(values.n);
    if (!Number.isInteger(n) || n < 1 || n > 6) return null;
    return { n };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || args.length !== 1) return null;
    const n = Number(args[0]);
    if (!Number.isInteger(n) || n < 1 || n > 6) return null;
    return { n: String(n) };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, STAGE_W } = ctx;
    const { n } = params;
    const sim = simulateNQueens(n);
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
      n, sim, ctx, cells: [], miniBoards: [], resultTexts: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title ---------------------------------------------------------
    scene.title = txt("N-Queens", {
      x: 64, y: 62, "font-size": 40, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    const sub = el("text", { x: 64, y: 98, "font-size": 18, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "n = ";
    el("tspan", { fill: C.white }, sub).textContent = String(n);
    el("tspan", { fill: C.gold }, sub).textContent = "     place one queen per row · no shared column or diagonal";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // ---- board ---------------------------------------------------------
    const cell = clamp(380 / n, 40, 84);
    const boardW = n * cell;
    const boardH = n * cell;
    const boardX = 64 + (440 - boardW) / 2;
    const boardY = 150 + (350 - boardH) / 2;
    const queenFont = clamp(cell * 0.54, 19, 40);

    scene.boardLabel = txt("board", {
      x: boardX, y: boardY - 16, "font-size": 13, fill: C.grey,
    }, textL);
    scene.rowLabel = txt("row = 0", {
      x: boardX + boardW / 2, y: boardY + boardH + 22, "text-anchor": "middle",
      "font-size": 14, fill: C.blue,
    }, textL);
    setOpacity(scene.boardLabel, 0);
    setOpacity(scene.rowLabel, 0);

    for (let c = 0; c < n; c++) {
      const t = txt(String(c), {
        x: boardX + c * cell + cell / 2, y: boardY - 9,
        "text-anchor": "middle", "font-size": 10, fill: C.grey,
      }, textL);
      setOpacity(t, 0);
      scene.cells.push({ label: t });
    }
    for (let r = 0; r < n; r++) {
      const t = txt(String(r), {
        x: boardX - 12, y: boardY + r * cell + cell / 2 + 1,
        "text-anchor": "end", "dominant-baseline": "central",
        "font-size": 10, fill: C.grey,
      }, textL);
      setOpacity(t, 0);
      scene.cells.push({ label: t });
    }

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const x = boardX + c * cell;
        const y = boardY + r * cell;
        const g = el("g", { transform: "translate(" + x + " " + y + ")" }, chipsL);
        const enter = el("g", {}, g);
        const baseFill = (r + c) % 2 === 0 ? "#161d27" : "#10151d";
        const rect = el("rect", {
          x: 1, y: 1, width: cell - 2, height: cell - 2,
          fill: baseFill, stroke: "#263246", "stroke-width": 1.2,
        }, enter);
        const q = txt("Q", {
          x: cell / 2, y: cell / 2 + 1, "text-anchor": "middle",
          "dominant-baseline": "central", "font-size": queenFont,
          fill: C.gold, "font-weight": 700,
        }, enter);
        const ring = el("rect", {
          x: 2, y: 2, width: cell - 4, height: cell - 4,
          fill: "none", stroke: C.gold, "stroke-width": 3,
          filter: "url(#glow-gold)",
        }, enter);
        setOpacity(enter, 0);
        setOpacity(q, 0);
        setOpacity(ring, 0);
        scene.cells.push({ r, c, baseFill, g, enter, rect, q, ring });
      }
    }

    // ---- state panel ---------------------------------------------------
    const sX = 520, sY = 140, sW = 696, sH = 162;
    scene.statePanel = el("g", {}, chipsL);
    el("rect", {
      x: sX, y: sY, width: sW, height: sH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.statePanel);
    setOpacity(scene.statePanel, 0);

    scene.rowText = txt("row = 0 / " + n, {
      x: sX + 20, y: sY + 30, "font-size": 19, fill: C.gold,
    }, textL);
    scene.candidateText = txt("searching", {
      x: sX + 220, y: sY + 30, "font-size": 14, fill: C.grey,
    }, textL);
    scene.colsText = txt("cols = {}", {
      x: sX + 20, y: sY + 62, "font-size": 14, fill: C.blue,
    }, textL);
    scene.diagText = txt("r + c = {}", {
      x: sX + 20, y: sY + 90, "font-size": 14, fill: C.green,
    }, textL);
    scene.antiText = txt("r − c = {}", {
      x: sX + 20, y: sY + 118, "font-size": 14, fill: C.purple,
    }, textL);
    scene.noteText = txt("a square is attacked when its column, r+c or r−c is already occupied", {
      x: sX + 20, y: sY + 146, "font-size": 12, fill: C.grey,
    }, textL);
    for (const node of [scene.rowText, scene.candidateText, scene.colsText,
                        scene.diagText, scene.antiText, scene.noteText]) {
      setOpacity(node, 0);
    }

    // ---- results panel -------------------------------------------------
    const rX = 520, rY = 318, rW = 696, rH = 242;
    scene.resultPanel = el("g", {}, chipsL);
    el("rect", {
      x: rX, y: rY, width: rW, height: rH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.resultPanel);
    setOpacity(scene.resultPanel, 0);
    scene.resultTitle = txt("solutions (0)", {
      x: rX + 20, y: rY + 28, "font-size": 18, fill: C.green,
    }, textL);
    setOpacity(scene.resultTitle, 0);

    const miniCell = clamp(86 / n, 12, 25);
    const miniCount = Math.min(maxResults, 8);
    for (let i = 0; i < miniCount; i++) {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const mx = rX + 26 + col * 166;
      const my = rY + 48 + row * 98;
      const g = el("g", { transform: "translate(" + mx + " " + my + ")" }, chipsL);
      const label = txt("#" + (i + 1), {
        x: 0, y: -5, "font-size": 9, fill: C.grey,
      }, g);
      const board = el("g", { transform: "translate(0 2)" }, g);
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          el("rect", {
            x: c * miniCell, y: r * miniCell, width: miniCell - 0.7, height: miniCell - 0.7,
            fill: (r + c) % 2 === 0 ? "#1b2433" : "#121822",
            stroke: "#263246", "stroke-width": 0.5,
          }, board);
        }
        const qc = sim.results[i][r];
        txt("Q", {
          x: qc * miniCell + miniCell / 2, y: r * miniCell + miniCell / 2 + 0.5,
          "text-anchor": "middle", "dominant-baseline": "central",
          "font-size": clamp(miniCell * 0.72, 7, 17), fill: C.gold,
        }, board);
      }
      setOpacity(g, 0);
      scene.miniBoards.push({ i, g, label });
    }

    scene.resultNote = txt("", {
      x: rX + 250, y: rY + 25, "font-size": 11, fill: C.grey,
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
    const setText = (node, text, color) => {
      node.textContent = text;
      if (color) node.setAttribute("fill", color);
      setOpacity(node, 1);
    };

    scene.setBoard = (queens, row, candidate, conflict) => {
      const occupied = new Set();
      queens.forEach((qc, qr) => {
        occupied.add(qc);
        occupied.add(qr + qc);
        occupied.add(qr - qc);
      });
      for (const node of scene.cells) {
        if (node.label) continue;
        const { r, c, baseFill } = node;
        const attacked = occupied.has(c) || occupied.has(r + c) || occupied.has(r - c);
        let fill = baseFill, stroke = "#263246", width = "1.2";
        if (attacked) {
          fill = "#241417";
          stroke = "#4a2628";
        }
        if (r === row) {
          stroke = C.blue;
          width = "2";
        }
        if (candidate && candidate[0] === r && candidate[1] === c) {
          fill = conflict ? "#2a1515" : "#262015";
          stroke = conflict ? C.red : C.gold;
          width = "2.4";
        }
        node.rect.setAttribute("fill", fill);
        node.rect.setAttribute("stroke", stroke);
        node.rect.setAttribute("stroke-width", width);
        node.q.style.opacity = "0";
        node.ring.style.opacity = "0";
      }
      queens.forEach((qc, qr) => {
        const node = scene.cells.find(x => !x.label && x.r === qr && x.c === qc);
        if (!node) return;
        node.rect.setAttribute("fill", "#2a2115");
        node.rect.setAttribute("stroke", C.gold);
        node.rect.setAttribute("stroke-width", "2");
        setOpacity(node.q, 1);
      });
      if (candidate) {
        const node = scene.cells.find(x => !x.label && x.r === candidate[0] && x.c === candidate[1]);
        if (node) {
          node.ring.setAttribute("stroke", conflict ? C.red : C.gold);
          setOpacity(node.ring, 1);
        }
      }
      scene.rowLabel.textContent = "row = " + row + " / " + n;
      scene.rowText.textContent = "row = " + row + " / " + n;
    };

    scene.setSets = (queens, row) => {
      const cols = [], diag = [], anti = [];
      queens.forEach((qc, qr) => {
        cols.push(qc);
        diag.push(qr + qc);
        anti.push(qr - qc);
      });
      cols.sort((a, b) => a - b);
      diag.sort((a, b) => a - b);
      anti.sort((a, b) => a - b);
      const fmt = arr => arr.length ? "{" + arr.join(", ") + "}" : "{}";
      scene.colsText.textContent = "cols = " + fmt(cols);
      scene.diagText.textContent = "r + c = " + fmt(diag);
      scene.antiText.textContent = "r − c = " + fmt(anti);
      scene.noteText.textContent = "row " + row + " · one placement decision per row";
    };

    scene.setResults = (results, highlightLast) => {
      scene.resultTitle.textContent = "solutions (" + results.length + ")";
      for (const mini of scene.miniBoards) {
        setOpacity(mini.g, mini.i < results.length ? 1 : 0);
      }
      const extra = results.length - scene.miniBoards.length;
      scene.resultNote.textContent = results.length === 0
        ? "no complete board has been recorded yet"
        : (extra > 0
          ? "showing the first " + scene.miniBoards.length + " boards · + " + extra + " more"
          : "each board has exactly one queen in every row and column");
      setOpacity(scene.resultNote, 1);
    };

    // ---- reset ---------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.boardLabel, scene.rowLabel,
                          scene.statePanel, scene.rowText, scene.candidateText,
                          scene.colsText, scene.diagText, scene.antiText,
                          scene.noteText, scene.resultPanel, scene.resultTitle,
                          scene.resultNote, scene.status, scene.detail,
                          scene.result]) {
        setOpacity(node, 0);
      }
      for (const node of scene.cells) {
        if (node.label) {
          setOpacity(node.label, 0);
          continue;
        }
        setOpacity(node.enter, 0);
        setOpacity(node.q, 0);
        setOpacity(node.ring, 0);
        node.rect.setAttribute("fill", node.baseFill);
        node.rect.setAttribute("stroke", "#263246");
        node.rect.setAttribute("stroke-width", "1.2");
      }
      for (const mini of scene.miniBoards) setOpacity(mini.g, 0);
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.result.textContent = "";
      scene.rowText.textContent = "row = 0 / " + n;
      scene.rowLabel.textContent = "row = 0";
      scene.candidateText.textContent = "searching";
      scene.colsText.textContent = "cols = {}";
      scene.diagText.textContent = "r + c = {}";
      scene.antiText.textContent = "r − c = {}";
      scene.noteText.textContent = "";
      scene.resultTitle.textContent = "solutions (0)";
      scene.resultNote.textContent = "";
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity } = ctx;
    const { n, sim } = scene;
    const easeOut = ease.outCubic;

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

    const setCandidateText = text => {
      tl.add(0.01, () => {
        scene.candidateText.textContent = text;
        setOpacity(scene.candidateText, 1);
      });
    };

    const setBoard = (queens, row, candidate, conflict) => {
      tl.add(0.01, () => {
        scene.setBoard(queens, row, candidate, conflict);
        scene.setSets(queens, row);
      });
    };

    const setResults = results => {
      tl.add(0.01, () => scene.setResults(results, true));
    };

    // ---- intro ---------------------------------------------------------
    tl.line([1, 2, 3, 4, 5, 6]);
    tl.add(0.55, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    for (const node of scene.cells) {
      if (node.label) tl.add(0.015, u => setOpacity(node.label, u), easeOut);
      else tl.add(0.018, u => setOpacity(node.enter, u), easeOut);
    }
    for (const node of [scene.boardLabel, scene.rowLabel, scene.statePanel,
                        scene.rowText, scene.candidateText, scene.colsText,
                        scene.diagText, scene.antiText, scene.noteText,
                        scene.resultPanel, scene.resultTitle, scene.resultNote]) {
      tl.add(0.14, u => setOpacity(node, u), easeOut);
    }
    setBoard([], 0, null, false);
    status("start with backtrack(0) and an empty set of queens", C.blue,
      "the board is filled one row at a time", true);
    tl.wait(0.1);

    // ---- events --------------------------------------------------------
    for (const ev of sim.events) {
      if (ev.kind === "enter") {
        tl.line([7, 8, 13]);
        setBoard(ev.queens, ev.row, null, false);
        setCandidateText("row " + ev.row + " · try each column");
        status("backtrack(row = " + ev.row + ")", C.blue,
          ev.row === n ? "row == n: the board is complete" : "decide the queen column for this row", false);
      } else if (ev.kind === "attack") {
        tl.line([14, 15]);
        setBoard(ev.queens, ev.row, [ev.row, ev.col], true);
        setCandidateText("col " + ev.col + " blocked by " + ev.reason);
        status("(" + ev.row + "," + ev.col + ") attacked by " + ev.reason + " → continue", C.red,
          "prune this column before placing a queen", false);
      } else if (ev.kind === "choose") {
        tl.line([16, 17, 18, 19, 20]);
        setBoard(ev.queens, ev.row, [ev.row, ev.col], false);
        setCandidateText("queen at (" + ev.row + "," + ev.col + ")");
        status("place a queen at (" + ev.row + "," + ev.col + ")  →  recurse", C.gold,
          "mark column " + ev.col + ", diagonal " + (ev.row + ev.col) +
          " and anti-diagonal " + (ev.row - ev.col), true);
      } else if (ev.kind === "unchoose") {
        tl.line([21, 22, 23, 24]);
        setBoard(ev.queens, ev.row, [ev.row, ev.col], true);
        setCandidateText("remove (" + ev.row + "," + ev.col + ")");
        status("remove the queen at (" + ev.row + "," + ev.col + ")  →  next column", C.red,
          "un-choose every set entry before trying the sibling", false);
      } else if (ev.kind === "complete") {
        tl.line([8, 9, 10, 11, 12]);
        setBoard(ev.queens, ev.row, null, false);
        setResults(ev.results);
        setCandidateText("row == n · solution " + ev.results.length);
        status("row == n  →  record solution #" + ev.results.length, C.green,
          "n queens, no shared column or diagonal", true);
      } else if (ev.kind === "return") {
        tl.line(13);
        setBoard(ev.queens, ev.row, null, false);
        setCandidateText("row " + ev.row + " exhausted");
        status("return from row " + ev.row, C.grey,
          "every column in this row has been tried", false);
      }
      tl.wait(0.03);
    }

    // ---- final answer --------------------------------------------------
    tl.add(0.01, () => {
      scene.result.textContent = "return " + sim.results.length +
        (sim.results.length === 1 ? " solution" : " solutions");
      setOpacity(scene.result, 1);
    });
    tl.add(0.5, u => setOpacity(scene.result, u), easeOut);
    tl.log("return " + sim.results.length + " solutions", C.green);
    tl.wait(0.8);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Simulation.
 * ------------------------------------------------------------------ */

function simulateNQueens(n) {
  const events = [];
  const results = [];
  const queens = [];
  const cols = new Set();
  const diag = new Set();
  const anti = new Set();

  const snapshot = (kind, extra) => {
    events.push({
      kind,
      queens: queens.slice(),
      ...(extra || {}),
    });
  };

  const backtrack = row => {
    snapshot("enter", { row });
    if (row === n) {
      results.push(queens.slice());
      snapshot("complete", { row, results: results.map(board => board.slice()) });
      return;
    }
    for (let col = 0; col < n; col++) {
      let reason = null;
      if (cols.has(col)) reason = "column " + col;
      else if (diag.has(row + col)) reason = "diagonal " + (row + col);
      else if (anti.has(row - col)) reason = "anti-diagonal " + (row - col);
      if (reason) {
        snapshot("attack", { row, col, reason });
        continue;
      }

      cols.add(col);
      diag.add(row + col);
      anti.add(row - col);
      queens.push(col);
      snapshot("choose", { row, col });

      backtrack(row + 1);

      queens.pop();
      cols.delete(col);
      diag.delete(row + col);
      anti.delete(row - col);
      snapshot("unchoose", { row, col });
    }
    snapshot("return", { row });
  };

  backtrack(0);
  return { events, results };
}
