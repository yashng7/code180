/* Word Search — animated backtracking walkthrough scene.
 *
 * The grid is scanned row by row for the first letter.  Every match marks the
 * cell with "#", recurses into its four neighbours, and restores the letter on
 * the way back out so sibling paths can reuse the cell.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Word Search",
    subtitle: "scan every start · match one character per step · mark '#' while the path is active",
    inputs: [
      {
        id: "board",
        label: "board (rows: A B C / D E F)",
        type: "text",
        default: "A B C E / S F C S / A D E E",
        width: "wide",
      },
      { id: "word", label: "word", type: "text", default: "ABCCED" },
    ],
    legend: [
      { color: "#58C4DD", text: "scan / candidate" },
      { color: "#F0AC5F", text: "current cell" },
      { color: "#83C167", text: "matched path" },
      { color: "#FC6255", text: "mismatch / restore" },
    ],
  },

  code: [
    "def exist(board: List[List[str]], word: str) -> bool:",
    "    rows, cols = len(board), len(board[0])",
    "    def backtrack(row: int, col: int, index: int) -> bool:",
    "        if index == len(word):",
    "            return True                     # matched every character",
    "        if not (0 <= row < rows and 0 <= col < cols):",
    "            return False",
    "        if board[row][col] != word[index]:",
    "            return False                    # wrong char or already visited",
    "        board[row][col] = \"#\"               # choose: mark visited",
    "        found = (",
    "            backtrack(row + 1, col, index + 1)",
    "            or backtrack(row - 1, col, index + 1)",
    "            or backtrack(row, col + 1, index + 1)",
    "            or backtrack(row, col - 1, index + 1)",
    "        )",
    "        board[row][col] = word[index]       # un-choose: restore",
    "        return found",
    "    for row in range(rows):",
    "        for col in range(cols):",
    "            if backtrack(row, col, 0):",
    "                return True",
    "    return False",
  ],

  read(values) {
    const rawBoard = String(values.board || "").trim();
    const word = String(values.word || "").trim();
    if (!rawBoard || !word || word.length > 10) return null;
    const rows = rawBoard.split(/[\/;]+/).map(row => row.trim()).filter(Boolean);
    if (!rows.length || rows.length > 5) return null;
    const board = rows.map(row => {
      const spaced = row.split(/[\s,]+/).filter(Boolean);
      return spaced.length > 1 ? spaced : Array.from(row);
    });
    if (!board.every(row => row.length >= 1 && row.length <= 5)) return null;
    const cols = board[0].length;
    if (!board.every(row => row.length === cols)) return null;
    if (!board.every(row => row.every(ch => /^[A-Za-z]$/.test(ch)))) return null;
    return { board, word };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || args.length !== 2) return null;
    const [board, word] = args;
    if (!Array.isArray(board) || board.length < 1 || board.length > 5) return null;
    if (!board.every(row => Array.isArray(row))) return null;
    if (typeof word !== "string" || !word || word.length > 10) return null;
    return {
      board: board.map(row => row.map(ch => String(ch)).join(" ")).join(" / "),
      word,
    };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, STAGE_W } = ctx;
    const { board, word } = params;
    const sim = simulateWordSearch(board, word);
    const rows = board.length;
    const cols = board[0].length;
    const wordLen = word.length;

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
      board, word, sim, ctx, cells: [], wordCells: [], pathChips: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title ---------------------------------------------------------
    scene.title = txt("Word Search", {
      x: 64, y: 62, "font-size": 40, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    const sub = el("text", { x: 64, y: 98, "font-size": 18, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "board = ";
    el("tspan", { fill: C.white }, sub).textContent = rows + " × " + cols;
    el("tspan", {}, sub).textContent = "     word = ";
    el("tspan", { fill: C.gold }, sub).textContent = "\"" + word + "\"";
    el("tspan", { fill: C.grey }, sub).textContent = "     four directions, no cell reuse";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // ---- board ---------------------------------------------------------
    const cell = clamp(Math.min(440 / cols, 340 / rows), 50, 88);
    const boardW = cols * cell;
    const boardH = rows * cell;
    const boardX = 64 + (470 - boardW) / 2;
    const boardY = 142 + (340 - boardH) / 2;
    const boardFont = clamp(cell * 0.42, 18, 32);

    scene.boardLabel = txt("board", {
      x: boardX, y: boardY - 16, "font-size": 13, fill: C.grey,
    }, textL);
    setOpacity(scene.boardLabel, 0);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = boardX + c * cell;
        const y = boardY + r * cell;
        const g = el("g", { transform: "translate(" + x + " " + y + ")" }, chipsL);
        const enter = el("g", {}, g);
        const rect = el("rect", {
          x: 2, y: 2, width: cell - 4, height: cell - 4, rx: 8,
          fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
        }, enter);
        const t = txt(board[r][c], {
          x: cell / 2, y: cell / 2 + 1, "text-anchor": "middle",
          "dominant-baseline": "central", "font-size": boardFont, fill: C.white,
        }, enter);
        const badge = txt("#", {
          x: cell - 12, y: 16, "text-anchor": "middle", "font-size": 13,
          fill: C.gold, "font-weight": 700,
        }, enter);
        const pos = txt(r + "," + c, {
          x: cell - 9, y: cell - 8, "text-anchor": "end", "font-size": 9, fill: C.grey,
        }, enter);
        setOpacity(enter, 0);
        setOpacity(badge, 0);
        scene.cells.push({ r, c, value: board[r][c], g, enter, rect, t, badge, pos });
      }
    }

    // ---- word strip ----------------------------------------------------
    const wordPanelX = 560;
    scene.wordLabel = txt("word", {
      x: wordPanelX, y: 142, "font-size": 13, fill: C.grey,
    }, textL);
    setOpacity(scene.wordLabel, 0);

    const wGap = wordLen > 7 ? 5 : 8;
    const wW = clamp((640 - wGap * (wordLen - 1)) / wordLen, 26, 56);
    const wH = 50;
    const wFont = clamp(wW * 0.46, 14, 25);
    for (let i = 0; i < wordLen; i++) {
      const x = wordPanelX + i * (wW + wGap);
      const g = el("g", { transform: "translate(" + x + " 158)" }, chipsL);
      const rect = el("rect", {
        x: 0, y: 0, width: wW, height: wH, rx: 8,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, g);
      const t = txt(word[i], {
        x: wW / 2, y: wH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": wFont, fill: C.white,
      }, g);
      const idx = txt("i=" + i, {
        x: wW / 2, y: -7, "text-anchor": "middle", "font-size": 9, fill: C.grey,
      }, g);
      setOpacity(g, 0);
      scene.wordCells.push({ i, g, rect, t, idx });
    }

    scene.meta = txt("index = 0", {
      x: wordPanelX, y: 250, "font-size": 17, fill: C.gold,
    }, textL);
    setOpacity(scene.meta, 0);

    // ---- path panel ----------------------------------------------------
    const pX = 560, pY = 280, pW = 656, pH = 255;
    scene.pathPanel = el("g", {}, chipsL);
    el("rect", {
      x: pX, y: pY, width: pW, height: pH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.pathPanel);
    setOpacity(scene.pathPanel, 0);

    scene.pathTitle = txt("current path", {
      x: pX + 20, y: pY + 28, "font-size": 18, fill: C.blue,
    }, textL);
    setOpacity(scene.pathTitle, 0);

    const perRow = wordLen <= 6 ? wordLen : 5;
    const pathGap = 8;
    const chipW = clamp((pW - 40 - pathGap * (perRow - 1)) / perRow, 44, 104);
    const chipH = 58;
    const chipFont = clamp(chipW * 0.38, 13, 23);
    for (let i = 0; i < wordLen; i++) {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const x = pX + 20 + col * (chipW + pathGap);
      const y = pY + 55 + row * 78;
      const g = el("g", { transform: "translate(" + x + " " + y + ")" }, chipsL);
      const rect = el("rect", {
        x: 0, y: 0, width: chipW, height: chipH, rx: 8,
        fill: "#17251a", stroke: C.green, "stroke-width": 2,
      }, g);
      const t = txt("", {
        x: chipW / 2, y: 22, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": chipFont, fill: C.green,
      }, g);
      const pos = txt("", {
        x: chipW / 2, y: 45, "text-anchor": "middle", "font-size": 9, fill: C.grey,
      }, g);
      setOpacity(g, 0);
      scene.pathChips.push({ i, g, rect, t, pos });
    }
    scene.emptyPath = txt("path = []", {
      x: pX + pW / 2, y: pY + 100, "text-anchor": "middle",
      "font-size": 18, fill: C.grey,
    }, textL);
    setOpacity(scene.emptyPath, 0);

    scene.note = txt("cells on the active path contain '#'; every return restores the letter", {
      x: pX + 20, y: pY + pH - 18, "font-size": 13, fill: C.grey,
    }, textL);
    setOpacity(scene.note, 0);

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

    // ---- shared state helpers -----------------------------------------
    const paintCell = (cellNode, mode) => {
      const states = {
        base: [C.chipFill, C.greyDark, C.white],
        path: ["#17251a", C.green, C.green],
        current: ["#262015", C.gold, C.gold],
        scan: ["#132a38", C.blue, C.blue],
        miss: ["#2a1515", C.red, C.red],
      };
      const state = states[mode] || states.base;
      cellNode.rect.setAttribute("fill", state[0]);
      cellNode.rect.setAttribute("stroke", state[1]);
      cellNode.t.setAttribute("fill", state[2]);
      cellNode.pos.setAttribute("fill", mode === "base" ? C.grey : state[1]);
      setOpacity(cellNode.badge, mode === "path" || mode === "current" ? 1 : 0);
      cellNode.badge.setAttribute("fill", mode === "current" ? C.gold : C.green);
    };

    const boardKey = node => node.r + "," + node.c;
    scene.setBoard = (path, current, scan, miss) => {
      const onPath = new Set(path.map(p => p[0] + "," + p[1]));
      const curKey = current ? current[0] + "," + current[1] : null;
      const scanKey = scan ? scan[0] + "," + scan[1] : null;
      const missKey = miss ? miss[0] + "," + miss[1] : null;
      for (const node of scene.cells) {
        const key = boardKey(node);
        let mode = "base";
        if (onPath.has(key)) mode = key === curKey ? "current" : "path";
        else if (key === missKey) mode = "miss";
        else if (key === scanKey) mode = "scan";
        paintCell(node, mode);
      }
    };

    scene.setWordIndex = (index, color) => {
      for (const node of scene.wordCells) {
        if (node.i < index) {
          node.rect.setAttribute("fill", "#17251a");
          node.rect.setAttribute("stroke", C.green);
          node.t.setAttribute("fill", C.green);
        } else if (node.i === index) {
          node.rect.setAttribute("fill", color === C.red ? "#2a1515" : "#262015");
          node.rect.setAttribute("stroke", color || C.gold);
          node.t.setAttribute("fill", color || C.gold);
        } else {
          node.rect.setAttribute("fill", C.chipFill);
          node.rect.setAttribute("stroke", C.greyDark);
          node.t.setAttribute("fill", C.white);
        }
      }
    };

    scene.setPath = path => {
      for (const chip of scene.pathChips) {
        if (chip.i < path.length) {
          const [r, c] = path[chip.i];
          const last = chip.i === path.length - 1;
          chip.t.textContent = board[r][c];
          chip.pos.textContent = "(" + r + "," + c + ")";
          chip.rect.setAttribute("fill", last ? "#262015" : "#17251a");
          chip.rect.setAttribute("stroke", last ? C.gold : C.green);
          chip.t.setAttribute("fill", last ? C.gold : C.green);
          setOpacity(chip.g, 1);
        } else {
          chip.t.textContent = "";
          chip.pos.textContent = "";
          setOpacity(chip.g, 0);
        }
      }
      setOpacity(scene.emptyPath, path.length ? 0 : 1);
    };

    // ---- reset ---------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.boardLabel, scene.wordLabel,
                          scene.meta, scene.pathPanel, scene.pathTitle,
                          scene.emptyPath, scene.note, scene.status, scene.detail,
                          scene.result]) {
        setOpacity(node, 0);
      }
      for (const node of scene.wordCells) setOpacity(node.g, 0);
      for (const node of scene.cells) {
        setOpacity(node.enter, 0);
        paintCell(node, "base");
      }
      for (const chip of scene.pathChips) {
        chip.t.textContent = "";
        chip.pos.textContent = "";
        setOpacity(chip.g, 0);
      }
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.result.textContent = "";
      scene.meta.textContent = "index = 0";
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity } = ctx;
    const { word, sim } = scene;
    const easeOut = ease.outCubic;
    const wordLen = word.length;

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

    const setWordIndex = (index, color) => {
      tl.add(0.01, () => {
        scene.setWordIndex(index, color);
        scene.meta.textContent = "index = " + index + " / " + wordLen;
      });
    };

    // ---- intro ---------------------------------------------------------
    tl.line([1, 2, 3]);
    tl.add(0.55, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    for (let r = 0; r < scene.board.length; r++) {
      for (const cell of scene.cells.filter(c => c.r === r)) {
        tl.add(0.06, u => setOpacity(cell.enter, u), easeOut);
      }
    }
    for (const node of [scene.boardLabel, scene.wordLabel]) {
      tl.add(0.18, u => setOpacity(node, u), easeOut);
    }
    for (const node of scene.wordCells) tl.add(0.09, u => setOpacity(node.g, u), easeOut);
    for (const node of [scene.pathPanel, scene.pathTitle, scene.emptyPath,
                        scene.note, scene.meta]) {
      tl.add(0.16, u => setOpacity(node, u), easeOut);
    }
    status("scan starts row by row · look for word[0] = '" + word[0] + "'", C.blue,
      "backtrack returns False immediately when the character does not match", true);
    scene.setPath([]);
    scene.setBoard([], null, null, null);
    scene.setWordIndex(0, C.gold);
    tl.wait(0.1);

    // ---- events --------------------------------------------------------
    for (const ev of sim.events) {
      if (ev.kind === "start") {
        tl.line([19, 20, 21]);
        scene.setPath([]);
        scene.setBoard([], null, [ev.row, ev.col], null);
        setWordIndex(0, C.blue);
        status("try starting at (" + ev.row + "," + ev.col + ")", C.blue,
          "the outer loops do not skip cells: every start is a fresh search", false);
      } else if (ev.kind === "oob") {
        tl.line([6, 7]);
        status("(" + ev.row + "," + ev.col + ") is outside the board → False", C.grey,
          "the bounds check runs before touching board[row][col]", false);
      } else if (ev.kind === "miss") {
        tl.line([8, 9]);
        const reason = ev.visited
          ? "this cell is already marked '#' (visited)"
          : "'" + (ev.value || "?") + "' does not match word[" + ev.index + "] = '" + word[ev.index] + "'";
        scene.setBoard(ev.path, null, null, [ev.row, ev.col]);
        setWordIndex(ev.index, C.red);
        status("reject (" + ev.row + "," + ev.col + ") · " + reason, C.red,
          "board[row][col] != word[index] → return False", false);
      } else if (ev.kind === "choose") {
        tl.line([10, 11, 12, 13, 14, 15, 16]);
        scene.setPath(ev.path);
        scene.setBoard(ev.path, [ev.row, ev.col], null, null);
        setWordIndex(ev.index + 1, C.gold);
        status("match '" + word[ev.index] + "' at (" + ev.row + "," + ev.col + ") · mark '#' and recurse",
          C.gold,
          "explore down, up, right, left with index + 1", true);
      } else if (ev.kind === "unchoose") {
        tl.line([17, 18]);
        scene.setPath(ev.path);
        scene.setBoard(ev.path, null, null, null);
        setWordIndex(ev.index, C.gold);
        status("restore '" + word[ev.index] + "' at (" + ev.row + "," + ev.col + ") · un-choose",
          C.red,
          "the cell is available to a different branch now", true);
      } else if (ev.kind === "found") {
        tl.line([4, 5]);
        scene.setPath(ev.path);
        scene.setBoard(ev.path, null, null, null);
        setWordIndex(wordLen, C.green);
        status("index == len(word) → True", C.green,
          "the whole word was matched by one connected path", true);
      } else if (ev.kind === "attempt_fail") {
        tl.line([19, 20, 21]);
        scene.setPath([]);
        scene.setBoard([], null, [ev.row, ev.col], null);
        setWordIndex(0, C.gold);
        status("start (" + ev.row + "," + ev.col + ") exhausted → next start", C.grey,
          "backtracking explored every reachable branch from this cell", false);
      } else if (ev.kind === "done") {
        tl.line(ev.result ? [22] : [23]);
        if (ev.result) {
          scene.setPath(ev.path);
          scene.setBoard(ev.path, null, null, null);
          setWordIndex(wordLen, C.green);
        } else {
          scene.setPath([]);
          scene.setBoard([], null, null, null);
          setWordIndex(0, C.grey);
        }
        status(ev.result ? "return True" : "return False", ev.result ? C.green : C.red,
          ev.result ? "a path spelling the word exists" : "every start cell and branch failed", true);
      }
      tl.wait(0.04);
    }

    // ---- final answer --------------------------------------------------
    tl.add(0.01, () => {
      scene.result.textContent = "found = " + sim.result;
      scene.result.setAttribute("fill", sim.result ? C.green : C.red);
      setOpacity(scene.result, 1);
    });
    tl.add(0.5, u => setOpacity(scene.result, u), easeOut);
    tl.log("found = " + sim.result, sim.result ? C.green : C.red);
    tl.wait(0.8);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Simulation.
 * ------------------------------------------------------------------ */

function simulateWordSearch(board, word) {
  const rows = board.length;
  const cols = board[0].length;
  const events = [];
  const path = [];
  const visited = Array.from({ length: rows }, () => new Array(cols).fill(false));
  let result = false;

  const snapshot = (kind, extra) => {
    events.push({
      kind,
      path: path.map(([r, c]) => [r, c]),
      ...(extra || {}),
    });
  };

  const backtrack = (row, col, index) => {
    if (index === word.length) {
      result = true;
      snapshot("found", { row, col, index });
      return true;
    }
    if (!(row >= 0 && row < rows && col >= 0 && col < cols)) {
      snapshot("oob", { row, col, index });
      return false;
    }
    const value = board[row][col];
    if (visited[row][col] || value !== word[index]) {
      snapshot("miss", { row, col, index, value, visited: visited[row][col] });
      return false;
    }

    visited[row][col] = true;
    path.push([row, col]);
    snapshot("choose", { row, col, index, value });

    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dr, dc] of dirs) {
      if (backtrack(row + dr, col + dc, index + 1)) return true;
    }

    path.pop();
    visited[row][col] = false;
    snapshot("unchoose", { row, col, index, value });
    return false;
  };

  outer:
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      snapshot("start", { row, col });
      if (backtrack(row, col, 0)) break outer;
      snapshot("attempt_fail", { row, col });
    }
  }

  snapshot("done", { result });
  return { events, result, path: path.map(([r, c]) => [r, c]) };
}
