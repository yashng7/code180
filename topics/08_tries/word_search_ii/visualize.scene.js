/* Implement Trie (Prefix Tree) — animated walkthrough scene.
 *
 * A character-labelled prefix tree grows operation by operation.  Each
 * insert follows (or creates) one edge per character and finally marks the
 * terminal node; search and startsWith walk the same edges, then differ only
 * in whether they require `is_end`.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

/* ------------------------------------------------------------------ *
 * Tiny trie model + layout helpers (kept local so the generated page is
 * completely self-contained).
 * ------------------------------------------------------------------ */

function trieMakeNode(ch, parent) {
  return {
    ch: ch,
    parent: parent || null,
    children: Object.create(null),
    depth: parent ? parent.depth + 1 : 0,
    isEnd: false,
    edge: null,
    endVisible: false,
  };
}

function trieWalk(root, word) {
  let node = root;
  const path = [root];
  for (const ch of word) {
    if (!node.children[ch]) {
      return { found: false, node: node, path: path, missing: ch };
    }
    node = node.children[ch];
    path.push(node);
  }
  return { found: true, node: node, path: path, missing: null };
}

function trieLayout(root, opts) {
  const nodes = [];
  let leaf = 0;
  const gapX = opts.gapX || 120;

  function assign(n) {
    nodes.push(n);
    const keys = Object.keys(n.children).sort();
    if (!keys.length) {
      n._rawX = leaf * gapX;
      leaf++;
    } else {
      for (const k of keys) assign(n.children[k]);
      let sum = 0;
      for (const k of keys) sum += n.children[k]._rawX;
      n._rawX = sum / keys.length;
    }
  }
  assign(root);

  const minX = Math.min(...nodes.map(n => n._rawX));
  const maxX = Math.max(...nodes.map(n => n._rawX));
  const span = maxX - minX;
  const r = opts.r || 15;
  const avail = opts.w - 2 * r;
  const scale = span > 0 ? Math.min(1, avail / span) : 1;
  const center = (minX + maxX) / 2;
  const maxDepth = Math.max(0, ...nodes.map(n => n.depth));
  const gapY = opts.gapY || (maxDepth ? Math.min(54, (opts.h - 2 * r) / maxDepth) : 0);

  for (const n of nodes) {
    n.x = opts.x + opts.w / 2 + (n._rawX - center) * scale;
    n.y = opts.y + n.depth * gapY;
  }
  return { nodes, r, gapY, scale, maxDepth };
}

function trieAddTree(scene, root, opts) {
  const { el, txt, C, setOpacity, setScaleAt } = scene.ctx;
  const layout = trieLayout(root, opts);
  const r = layout.r;
  const edges = [];
  const nodes = [];
  const byModel = new Map();
  const edgeByChild = new Map();
  const font = opts.font || Math.max(9, Math.min(16, r * 0.78));

  for (const n of layout.nodes) {
    if (!n.parent) continue;
    const p = n.parent;
    const line = el("line", {
      x1: p.x, y1: p.y + r - 1, x2: n.x, y2: n.y - r + 1,
      stroke: C.greyDark, "stroke-width": 2.4,
    }, scene.layers.arcs);
    setOpacity(line, 0);

    let labelG = null, labelBg = null, labelText = null;
    if (opts.edgeLabels) {
      const mx = (p.x + n.x) / 2;
      const my = (p.y + n.y) / 2;
      labelG = el("g", { transform: "translate(" + mx + " " + my + ")" }, scene.layers.chips);
      labelBg = el("rect", {
        x: -9, y: -9, width: 18, height: 18, rx: 5,
        fill: C.stage, stroke: C.greyDark, "stroke-width": 1.2,
      }, labelG);
      labelText = txt(n.ch, {
        x: 0, y: 1, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": 12, fill: C.white,
      }, labelG);
      setOpacity(labelG, 0);
    }

    const edge = { line, labelG, labelBg, labelText, parent: p, child: n };
    edges.push(edge);
    edgeByChild.set(n, edge);
    n.edge = edge;
  }

  for (const n of layout.nodes) {
    const g = el("g", { transform: "translate(" + n.x + " " + n.y + ")" }, scene.layers.chips);
    const enter = el("g", {}, g);
    const scale = el("g", {}, enter);
    const circle = el("circle", {
      cx: 0, cy: 0, r: r, fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2.2,
    }, scale);

    let label = null;
    if (opts.nodeLabels) {
      label = txt(n.ch, {
        x: 0, y: 1, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": font, fill: C.white,
      }, scale);
    } else if (!n.parent) {
      label = txt("root", {
        x: 0, y: 1, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": 9, fill: C.white,
      }, scale);
    } else {
      el("circle", { cx: 0, cy: 0, r: 2.2, fill: C.greyDark }, scale);
    }

    const ring = el("circle", {
      cx: 0, cy: 0, r: r + 4, fill: "none", stroke: C.gold, "stroke-width": 2.6,
    }, scale);
    const dot = el("circle", {
      cx: r * 0.72, cy: r * 0.72, r: 3.2, fill: C.gold, stroke: C.stage, "stroke-width": 1,
    }, scale);

    setOpacity(enter, 0);
    setOpacity(ring, 0);
    setOpacity(dot, 0);

    const node = {
      model: n, g, enter, scale, circle, label, ring, dot,
      x: n.x, y: n.y, r,
    };
    nodes.push(node);
    byModel.set(n, node);
  }

  scene.registerReset(() => {
    for (const node of nodes) {
      setOpacity(node.enter, 0);
      setScaleAt(node.scale, 0, 0, 1);
      setOpacity(node.ring, 0);
      setOpacity(node.dot, 0);
      node.circle.setAttribute("fill", C.chipFill);
      node.circle.setAttribute("stroke", C.greyDark);
      node.circle.setAttribute("stroke-width", "2.2");
      if (node.label) node.label.setAttribute("fill", C.white);
      node.model.endVisible = false;
      node.model.found = false;
    }
    for (const edge of edges) {
      setOpacity(edge.line, 0);
      edge.line.setAttribute("stroke", C.greyDark);
      edge.line.setAttribute("stroke-width", "2.4");
      if (edge.labelG) {
        setOpacity(edge.labelG, 0);
        edge.labelBg.setAttribute("stroke", C.greyDark);
        edge.labelText.setAttribute("fill", C.white);
      }
    }
  });

  return { root, nodes, edges, byModel, edgeByChild, layout, r };
}

function trieRevealEdge(scene, tl, edge, dur) {
  const { ease, setOpacity } = scene.ctx;
  tl.add(dur || 0.12, u => {
    setOpacity(edge.line, u);
    if (edge.labelG) setOpacity(edge.labelG, u);
  }, ease.outCubic);
}

function trieRevealNode(scene, tl, node, dur) {
  const { ease, setOpacity } = scene.ctx;
  tl.add(dur || 0.18, u => {
    setOpacity(node.enter, Math.min(1, u * 2));
    node.scale.setAttribute("transform", "scale(" + (0.7 + 0.3 * u) + ")");
  }, ease.outCubic);
}

function trieResetLook(scene, tree) {
  const { C, setOpacity } = scene.ctx;
  for (const node of tree.nodes) {
    node.circle.setAttribute("fill", C.chipFill);
    node.circle.setAttribute("stroke", C.greyDark);
    node.circle.setAttribute("stroke-width", "2.2");
    if (node.label) node.label.setAttribute("fill", C.white);
    const ringColor = node.model.found ? C.green : C.gold;
    node.ring.setAttribute("stroke", ringColor);
    setOpacity(node.ring, node.model.endVisible ? 1 : 0);
    node.dot.setAttribute("fill", ringColor);
    setOpacity(node.dot, node.model.endVisible ? 1 : 0);
  }
  for (const edge of tree.edges) {
    edge.line.setAttribute("stroke", C.greyDark);
    edge.line.setAttribute("stroke-width", "2.4");
    if (edge.labelG) {
      edge.labelBg.setAttribute("stroke", C.greyDark);
      edge.labelText.setAttribute("fill", C.white);
    }
  }
}

function trieHighlightPath(scene, tl, tree, path, current, color) {
  const { C, setOpacity } = scene.ctx;
  tl.add(0.01, () => {
    trieResetLook(scene, tree);
    const active = color || C.blue;
    for (const n of path) {
      const node = tree.byModel.get(n);
      if (!node) continue;
      node.circle.setAttribute("stroke", active);
      node.circle.setAttribute("stroke-width", "3.2");
      node.circle.setAttribute("fill", "#132a38");
      if (node.label) node.label.setAttribute("fill", active);
      if (n.parent) {
        const edge = tree.edgeByChild.get(n);
        if (edge) {
          edge.line.setAttribute("stroke", active);
          edge.line.setAttribute("stroke-width", "3.4");
          if (edge.labelText) edge.labelText.setAttribute("fill", active);
          if (edge.labelBg) edge.labelBg.setAttribute("stroke", active);
        }
      }
    }
    if (current) {
      const node = tree.byModel.get(current);
      if (node) {
        node.circle.setAttribute("stroke", C.gold);
        node.circle.setAttribute("fill", "#2a2115");
        node.circle.setAttribute("stroke-width", "3.6");
        if (node.label) node.label.setAttribute("fill", C.gold);
      }
    }
  });
}

function trieMarkEnd(scene, tl, tree, model, color) {
  const { C, setOpacity } = scene.ctx;
  tl.add(0.01, () => {
    model.endVisible = true;
    const node = tree.byModel.get(model);
    if (!node) return;
    node.ring.setAttribute("stroke", color || C.gold);
    setOpacity(node.ring, 1);
    node.dot.setAttribute("fill", color || C.gold);
    setOpacity(node.dot, 1);
    if (node.label) node.label.setAttribute("fill", color || C.gold);
  });
}

function wsMarkFound(scene, tl, tree, model) {
  const { C, setOpacity } = scene.ctx;
  tl.add(0.01, () => {
    model.found = true;
    model.endVisible = true;
    const node = tree.byModel.get(model);
    if (!node) return;
    node.ring.setAttribute("stroke", C.green);
    setOpacity(node.ring, 1);
    node.dot.setAttribute("fill", C.green);
    setOpacity(node.dot, 1);
    if (node.label) node.label.setAttribute("fill", C.green);
  });
}

function trieMarkMissing(scene, tl, tree, parentModel, ch) {
  const { C, setOpacity } = scene.ctx;
  tl.add(0.01, () => {
    const node = tree.byModel.get(parentModel);
    if (node) {
      node.circle.setAttribute("stroke", C.red);
      node.circle.setAttribute("fill", "#2d1718");
      node.circle.setAttribute("stroke-width", "3.4");
      if (node.label) node.label.setAttribute("fill", C.red);
    }
  });
}

function trieMarkResult(scene, tl, tree, model, color) {
  const { C, setOpacity } = scene.ctx;
  tl.add(0.01, () => {
    const node = tree.byModel.get(model);
    if (!node) return;
    node.circle.setAttribute("stroke", color || C.green);
    node.circle.setAttribute("fill", "#17251a");
    node.circle.setAttribute("stroke-width", "3.6");
    if (node.label) node.label.setAttribute("fill", color || C.green);
    if (model.endVisible) {
      node.ring.setAttribute("stroke", color || C.green);
      setOpacity(node.ring, 1);
      node.dot.setAttribute("fill", color || C.green);
      setOpacity(node.dot, 1);
    }
  });
}

/* ------------------------------------------------------------------ *
 * Word Search II helpers: compact trie, board styling, path selection.
 * ------------------------------------------------------------------ */

function wsMakeNode(ch, parent) {
  return {
    ch: ch,
    parent: parent || null,
    children: Object.create(null),
    depth: parent ? parent.depth + 1 : 0,
    word: null,
    src: null,
    endVisible: false,
    found: false,
  };
}

function wsBuildTrie(words) {
  const root = wsMakeNode("∅", null);
  for (const word of words) {
    let node = root;
    for (const ch of word) {
      if (!node.children[ch]) node.children[ch] = wsMakeNode(ch, node);
      node = node.children[ch];
    }
    node.word = word;
  }
  return root;
}

function wsClone(src, parent) {
  const node = wsMakeNode(src.ch, parent);
  node.src = src;
  node.word = src.word;
  for (const ch of Object.keys(src.children)) {
    node.children[ch] = wsClone(src.children[ch], node);
  }
  return node;
}

function wsAllNodes(root) {
  const out = [];
  (function walk(n) {
    out.push(n);
    for (const ch of Object.keys(n.children)) walk(n.children[ch]);
  })(root);
  return out;
}

function wsMaxDepth(root) {
  let max = 0;
  (function walk(n, d) {
    max = Math.max(max, d);
    for (const ch of Object.keys(n.children)) walk(n.children[ch], d + 1);
  })(root, 0);
  return max;
}

function wsPathPrefix(a, b) {
  if (a.length > b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].r !== b[i].r || a[i].c !== b[i].c) return false;
  }
  return true;
}

function wsSelectPaths(cell) {
  const finds = cell.finds
    .map((f, order) => Object.assign({}, f, { order }))
    .sort((a, b) => (b.path.length - a.path.length) || (a.order - b.order));
  const kept = [];
  for (const f of finds) {
    let host = null;
    for (const k of kept) {
      if (wsPathPrefix(f.path, k.path)) { host = k; break; }
    }
    if (host) host.finds.push(f);
    else kept.push({ path: f.path, finds: [f], order: f.order });
  }
  for (const k of kept) {
    k.finds.sort((a, b) => (a.path.length - b.path.length) || (a.order - b.order));
  }
  kept.sort((a, b) => a.order - b.order);
  return kept;
}

function wsBoardReset(scene) {
  const { C, setOpacity } = scene.ctx;
  for (const cell of scene.cells) {
    cell.rect.setAttribute("fill", C.chipFill);
    cell.rect.setAttribute("stroke", C.greyDark);
    cell.rect.setAttribute("stroke-width", "2");
    cell.t.setAttribute("fill", C.white);
  }
  setOpacity(scene.cursor, 0);
}

function wsCellStyle(scene, cell, fill, stroke, textFill) {
  const { C } = scene.ctx;
  cell.rect.setAttribute("fill", fill || C.chipFill);
  cell.rect.setAttribute("stroke", stroke || C.greyDark);
  cell.rect.setAttribute("stroke-width", "2.8");
  cell.t.setAttribute("fill", textFill || C.white);
}

function wsCursorTo(scene, cell, color) {
  const { C, setOpacity, setTranslate } = scene.ctx;
  setTranslate(scene.cursor, cell.x, cell.y);
  scene.cursorRect.setAttribute("stroke", color || C.gold);
  setOpacity(scene.cursor, 1);
}

function wsMarkWordChip(scene, word) {
  const { C } = scene.ctx;
  const chip = scene.wordChipByWord.get(word);
  if (!chip) return;
  chip.rect.setAttribute("fill", "#17251a");
  chip.rect.setAttribute("stroke", C.green);
  chip.t.setAttribute("fill", C.green);
}

/* ------------------------------------------------------------------ *
 * Scene
 * ------------------------------------------------------------------ */

const SCENE = {
  meta: {
    title: "Word Search II",
    subtitle: "trie + pruned board DFS · find every dictionary word · O(m·n·4·3^(L-1)) worst case",
    inputs: [
      {
        id: "board",
        label: "board (rows joined by /)",
        type: "text",
        default: "oaan/etae/ihkr/iflv",
        width: "wide",
      },
      {
        id: "words",
        label: "words (comma separated)",
        type: "text",
        default: "oath, pea, eat, rain",
        width: "wide",
      },
    ],
    legend: [
      { color: "#58C4DD", text: "DFS board path" },
      { color: "#F0AC5F", text: "current cell / trie node" },
      { color: "#83C167", text: "word found" },
      { color: "#FC6255", text: "prefix pruned" },
    ],
  },

  code: [
    "class _TrieNode:",
    "    __slots__ = (\"children\", \"word\")",
    "    def __init__(self) -> None:",
    "        self.children: dict[str, \"_TrieNode\"] = {}",
    "        self.word: str | None = None",
    "def find_words(board: List[List[str]], words: List[str]) -> List[str]:",
    "    root = _TrieNode()",
    "    for word in words:",
    "        node = root",
    "        for ch in word:",
    "            if ch not in node.children:",
    "                node.children[ch] = _TrieNode()",
    "            node = node.children[ch]",
    "        node.word = word                       # terminal marker",
    "    rows = len(board)",
    "    cols = len(board[0]) if rows else 0",
    "    result: List[str] = []",
    "    def dfs(r: int, c: int, parent: _TrieNode) -> None:",
    "        ch = board[r][c]",
    "        node = parent.children.get(ch)",
    "        if node is None:                       # no word has this prefix",
    "            return",
    "        if node.word is not None:              # completed a word",
    "            result.append(node.word)",
    "            node.word = None                   # never report it twice",
    "        board[r][c] = \"#\"                      # mark the cell as used",
    "        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):",
    "            nr, nc = r + dr, c + dc",
    "            if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] != \"#\":",
    "                dfs(nr, nc, node)",
    "        board[r][c] = ch                       # restore for other paths",
    "        if not node.children:                  # prune exhausted branch",
    "            del parent.children[ch]",
    "    for r in range(rows):",
    "        for c in range(cols):",
    "            dfs(r, c, root)",
    "    return result",
  ],

  read(values) {
    const rawBoard = String(values.board || "").trim();
    const rawWords = String(values.words || "").trim();
    if (!rawBoard || !rawWords) return null;
    const rows = rawBoard
      .split(/[\/\n]+/)
      .map(line => line.replace(/\s+/g, ""))
      .filter(line => line.length > 0);
    if (rows.length < 1 || rows.length > 6) return null;
    const cols = rows[0].length;
    if (cols < 1 || cols > 6) return null;
    if (!rows.every(row => row.length === cols && /^[A-Za-z]+$/.test(row))) return null;
    if (rows.length * cols > 36) return null;
    const words = rawWords.split(/\s*,\s*/).filter(Boolean);
    if (words.length < 1 || words.length > 20) return null;
    if (!words.every(w => /^[A-Za-z]+$/.test(w) && w.length <= 12)) return null;
    return { grid: rows.map(row => row.split("")), words };
  },

  fromArgs(args) {
    let board = null, words = null;
    if (Array.isArray(args) && args.length >= 2) {
      board = args[0];
      words = args[1];
    } else if (args && Array.isArray(args.board) && Array.isArray(args.words)) {
      board = args.board;
      words = args.words;
    }
    if (!Array.isArray(board) || !Array.isArray(words)) return null;
    const rows = board.map(row => Array.isArray(row) ? row.join("") : String(row));
    if (!rows.length) return null;
    return {
      board: rows.join("/"),
      words: words.map(w => String(w)).join(", "),
    };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const grid = params.grid;
    const words = params.words;
    const sim = simulateWordSearch(grid, words);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-red", C.red);
    ctx.glow("glow-purple", C.purple);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = {
      ctx, grid, words, sim,
      layers: { text: textL, chips: chipsL, pointer: ptrL, result: resultL },
      cells: [], cellsByRC: [], wordChips: [], wordChipByWord: new Map(),
      _writers: [], _resets: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };
    scene.registerReset = fn => { scene._resets.push(fn); };

    scene.title = txt("Word Search II", {
      x: 64, y: 60, "font-size": 38, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    scene.subtitle = txt(
      "Build a trie of the dictionary, then DFS from every board cell and prune prefixes that leave the trie",
      { x: 64, y: 94, "font-size": 17, fill: C.grey },
      textL
    );
    setOpacity(scene.subtitle, 0);

    // --- dictionary word ribbon -----------------------------------------
    scene.wordsLabel = txt("words", {
      x: 64, y: 113, "font-size": 13, fill: C.grey, "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.wordsLabel, 0);

    const uniqueWords = [...new Set(words)];
    const widths = uniqueWords.map(w => Math.max(30, w.length * 7.5 + 14));
    const gap = 6;
    const rawTotal = widths.reduce((s, w) => s + w, 0) + gap * Math.max(0, uniqueWords.length - 1);
    const scale = rawTotal > 1140 ? 1140 / rawTotal : 1;
    let wx = 64 + (1140 - rawTotal * scale) / 2;
    for (let i = 0; i < uniqueWords.length; i++) {
      const word = uniqueWords[i];
      const w = widths[i] * scale;
      const g = el("g", { transform: "translate(" + wx + " 122)" }, chipsL);
      setOpacity(g, 0);
      const rect = el("rect", {
        x: 0, y: 0, width: w, height: 24, rx: 6,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.5,
      }, g);
      const t = txt(word, {
        x: w / 2, y: 13, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": clamp(11 * scale, 8, 11), fill: C.white,
      }, g);
      const chip = { word, g, rect, t };
      scene.wordChips.push(chip);
      scene.wordChipByWord.set(word, chip);
      wx += w + gap * scale;
    }

    // --- board -----------------------------------------------------------
    const rows = grid.length;
    const cols = grid[0].length;
    const boardRegion = { x: 70, y: 178, w: 470, h: 348 };
    const cellGap = 8;
    const cellSize = Math.max(
      24,
      Math.min(
        84,
        Math.floor((boardRegion.w - (cols - 1) * cellGap) / cols),
        Math.floor((boardRegion.h - (rows - 1) * cellGap) / rows)
      )
    );
    const boardW = cols * cellSize + (cols - 1) * cellGap;
    const boardH = rows * cellSize + (rows - 1) * cellGap;
    const boardX = boardRegion.x + (boardRegion.w - boardW) / 2;
    const boardY = boardRegion.y + (boardRegion.h - boardH) / 2;

    scene.boardLabel = txt("board", {
      x: 70, y: 168, "font-size": 13, fill: C.grey, "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.boardLabel, 0);

    for (let r = 0; r < rows; r++) {
      scene.cellsByRC[r] = [];
      for (let c = 0; c < cols; c++) {
        const x = boardX + c * (cellSize + cellGap);
        const y = boardY + r * (cellSize + cellGap);
        const g = el("g", { transform: "translate(" + x + " " + y + ")" }, chipsL);
        setOpacity(g, 0);
        const rect = el("rect", {
          x: 0, y: 0, width: cellSize, height: cellSize, rx: 8,
          fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
        }, g);
        const t = txt(grid[r][c], {
          x: cellSize / 2, y: cellSize / 2 + 1, "text-anchor": "middle",
          "dominant-baseline": "central", "font-size": clamp(cellSize * 0.42, 14, 34),
          fill: C.white,
        }, g);
        const cell = { r, c, ch: grid[r][c], g, rect, t, x, y, w: cellSize, h: cellSize };
        scene.cells.push(cell);
        scene.cellsByRC[r][c] = cell;
      }
    }

    // --- trie ------------------------------------------------------------
    scene.trieLabel = txt("trie", {
      x: 580, y: 168, "font-size": 13, fill: C.grey, "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.trieLabel, 0);

    const trieRegion = { x: 580, y: 178, w: 640, h: 348 };
    const trieR = 11;
    const maxDepth = wsMaxDepth(sim.initial);
    const gapY = Math.min(34, (trieRegion.h - 2 * trieR) / Math.max(1, maxDepth));
    const trieY = trieRegion.y + Math.max(0, (trieRegion.h - maxDepth * gapY) / 2);
    scene.tree = trieAddTree(scene, sim.initial, {
      x: trieRegion.x, y: trieY, w: trieRegion.w, h: trieRegion.h,
      r: trieR, gapX: 44, gapY: gapY, nodeLabels: true, edgeLabels: false, font: 10,
    });

    // --- board cursor ----------------------------------------------------
    scene.cursor = el("g", {}, ptrL);
    setOpacity(scene.cursor, 0);
    scene.cursorRect = el("rect", {
      x: 0, y: 0, width: cellSize, height: cellSize, rx: 8,
      fill: "none", stroke: C.gold, "stroke-width": 3, filter: "url(#glow-gold)",
    }, scene.cursor);
    setTranslate(scene.cursor, boardX, boardY);

    // --- bottom narration ------------------------------------------------
    scene.status = txt("", {
      x: 64, y: 590, "font-size": 19, fill: C.gold,
    }, textL);
    scene.detail = txt("", {
      x: 64, y: 620, "font-size": 15, fill: C.grey,
    }, textL);
    scene.result = txt("", {
      x: 64, y: 660, "font-size": 18, fill: C.green,
    }, resultL);
    scene.complexity = txt(
      "Each DFS call consumes one board cell; a prefix that leaves the trie is pruned immediately",
      { x: 64, y: 695, "font-size": 13, fill: C.grey },
      resultL
    );
    setOpacity(scene.status, 0);
    setOpacity(scene.detail, 0);
    setOpacity(scene.result, 0);
    setOpacity(scene.complexity, 0);

    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const fn of scene._resets) fn();
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.wordsLabel, 0);
      setOpacity(scene.boardLabel, 0);
      setOpacity(scene.trieLabel, 0);
      setOpacity(scene.status, 0);
      setOpacity(scene.detail, 0);
      setOpacity(scene.result, 0);
      setOpacity(scene.complexity, 0);
      setOpacity(scene.cursor, 0);
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.result.textContent = "";
      wsBoardReset(scene);
      for (const cell of scene.cells) setOpacity(cell.g, 0);
      for (const chip of scene.wordChips) {
        setOpacity(chip.g, 0);
        chip.rect.setAttribute("fill", C.chipFill);
        chip.rect.setAttribute("stroke", C.greyDark);
        chip.t.setAttribute("fill", C.white);
      }
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity } = ctx;
    const { sim, tree } = scene;
    const easeOut = ease.outCubic;

    scene.reset();

    const status = (text, color, hold) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || C.gold);
        setOpacity(scene.status, 1);
      });
      tl.log(text, color || C.gold, hold === false ? { hold: false } : undefined);
    };
    const detail = text => {
      tl.add(0.01, () => {
        scene.detail.textContent = text;
        setOpacity(scene.detail, 1);
      });
    };
    const markWordFound = word => {
      tl.add(0.01, () => wsMarkWordChip(scene, word));
    };
    const showPath = (path, upto, current, foundSet) => {
      tl.add(0.01, () => {
        wsBoardReset(scene);
        for (let i = 0; i < upto; i++) {
          const step = path[i];
          const cell = scene.cellsByRC[step.r][step.c];
          if (foundSet && foundSet.has(i)) wsCellStyle(scene, cell, "#17251a", C.green, C.green);
          else wsCellStyle(scene, cell, "#132a38", C.blue, C.white);
        }
        if (current) {
          const cell = scene.cellsByRC[current.r][current.c];
          const found = foundSet && foundSet.has(upto - 1);
          wsCellStyle(scene, cell, found ? "#17251a" : "#2a2115", found ? C.green : C.gold, found ? C.green : C.gold);
          wsCursorTo(scene, cell, found ? C.green : C.gold);
        } else {
          setOpacity(scene.cursor, 0);
        }
      });
    };

    // --- title -----------------------------------------------------------
    tl.line([1, 2, 3, 4, 5]);
    tl.add(0.65, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, easeOut(u)), easeOut);

    // --- reveal board + dictionary words --------------------------------
    tl.add(0.45, u => {
      setOpacity(scene.wordsLabel, easeOut(u));
      setOpacity(scene.boardLabel, easeOut(u));
      scene.wordChips.forEach((chip, i) => {
        const start = i * 0.025;
        const p = ctx.clamp((u - start) / Math.max(0.3, 1 - start), 0, 1);
        setOpacity(chip.g, easeOut(p));
      });
    }, easeOut);
    tl.add(0.55, u => {
      scene.cells.forEach((cell, i) => {
        const start = i * 0.018;
        const p = ctx.clamp((u - start) / Math.max(0.35, 1 - start), 0, 1);
        setOpacity(cell.g, easeOut(p));
      });
    }, easeOut);
    status("board has " + scene.cells.length + " cells · dictionary has " + scene.words.length + " words", C.blue, false);
    tl.wait(0.4);

    // --- build the trie --------------------------------------------------
    tl.line([6, 7]);
    status("root = _TrieNode()", C.blue, false);
    trieRevealNode(scene, tl, tree.byModel.get(sim.initial), 0.28);
    tl.line([8, 9, 10, 11, 12, 13, 14]);
    status("insert every word: one trie edge per character, terminal node stores the word", C.blue, false);
    tl.add(0.01, () => setOpacity(scene.trieLabel, 1));
    for (const edge of tree.edges) trieRevealEdge(scene, tl, edge, 0.06);
    for (const node of tree.nodes) {
      if (node.model === sim.initial) continue;
      trieRevealNode(scene, tl, node, 0.08);
    }
    for (const node of wsAllNodes(sim.initial)) {
      if (node.word !== null) trieMarkEnd(scene, tl, tree, node, C.gold);
    }
    tl.wait(0.2);

    tl.line([15, 16, 17]);
    status("rows = " + scene.grid.length + " · cols = " + scene.grid[0].length + " · result = []", C.blue, false);
    detail("terminal nodes are gold; they store the complete dictionary word");
    tl.wait(0.35);

    // --- search from every cell -----------------------------------------
    let missBudget = 8;
    let pathBudget = 12;

    const animateWordPath = (cell, entry) => {
      const foundSet = new Set(entry.finds.map(f => f.path.length - 1));
      const foundByDepth = new Map(entry.finds.map(f => [f.path.length - 1, f]));
      for (let i = 0; i < entry.path.length; i++) {
        const step = entry.path[i];
        const isFound = foundByDepth.has(i);
        const prefix = entry.path.slice(0, i + 1).map(s => s.ch).join("");
        const pathModels = [sim.initial].concat(entry.path.slice(0, i + 1).map(s => s.nodeSrc));
        const foundModels = entry.finds
          .filter(f => f.path.length <= i + 1)
          .map(f => f.terminalSrc);

        tl.line([18, 19, 20]);
        tl.line(23);
        if (isFound) tl.line([24, 25]);
        tl.line(26);
        showPath(entry.path, i + 1, step, foundSet);
        trieHighlightPath(scene, tl, tree, pathModels, step.nodeSrc, C.blue);
        for (const m of foundModels) wsMarkFound(scene, tl, tree, m);

        if (isFound) {
          const f = foundByDepth.get(i);
          markWordFound(f.word);
          status("found \"" + f.word + "\"  →  result.append(...) and clear the word marker", C.green, false);
          detail("board path \"" + prefix + "\" reaches a terminal trie node");
        } else {
          status("dfs(" + step.r + "," + step.c + ") '" + step.ch + "'  ·  prefix \"" + prefix + "\"", C.blue, false);
          detail("the board path and trie path agree, so keep exploring");
        }
        if (i + 1 < entry.path.length) tl.line([27, 28, 29, 30]);
        tl.wait(0.05);
      }

      tl.line(31);
      status("backtrack: restore board[r][c] = '" + entry.path[entry.path.length - 1].ch + "'", C.grey, false);
      const last = entry.path[entry.path.length - 1].nodeSrc;
      if (last.children && Object.keys(last.children).length === 0) {
        tl.line([32, 33]);
        status("node has no children  →  delete it from parent.children", C.gold, false);
      }
      tl.add(0.01, () => {
        wsBoardReset(scene);
        trieResetLook(scene, tree);
      });
      tl.wait(0.08);
    };

    const animateMiss = (cell, miss) => {
      const parentModel = miss.path.length
        ? miss.path[miss.path.length - 1].nodeSrc
        : sim.initial;
      if (miss.path.length) {
        const pathModels = [sim.initial].concat(miss.path.map(s => s.nodeSrc));
        tl.line([18, 19, 20]);
        tl.line(26);
        showPath(miss.path, miss.path.length, miss.path[miss.path.length - 1], null);
        trieHighlightPath(scene, tl, tree, pathModels, parentModel, C.blue);
        tl.line([27, 28, 29, 30]);
        status("follow the board path \"" + miss.path.map(s => s.ch).join("") + "\" into the trie", C.blue, false);
        tl.wait(0.05);
      }
      tl.line([18, 19, 20]);
      tl.line([21, 22]);
      tl.add(0.01, () => {
        const mc = scene.cellsByRC[miss.r][miss.c];
        wsCellStyle(scene, mc, "#2d1718", C.red, C.red);
        wsCursorTo(scene, mc, C.red);
      });
      trieMarkMissing(scene, tl, tree, parentModel, miss.ch);
      status("no trie child '" + miss.ch + "'  →  return immediately", C.red, false);
      detail("this whole branch is pruned before visiting any more cells");
      tl.line(31);
      tl.add(0.01, () => {
        wsBoardReset(scene);
        trieResetLook(scene, tree);
      });
      tl.wait(0.08);
    };

    for (const cell of sim.cells) {
      tl.line([34, 35, 36]);
      tl.add(0.01, () => {
        wsBoardReset(scene);
        wsCursorTo(scene, scene.cellsByRC[cell.r][cell.c], C.gold);
        trieResetLook(scene, tree);
      });
      status("start cell (" + cell.r + "," + cell.c + ") = '" + cell.ch + "'", C.blue, false);

      const entries = wsSelectPaths(cell);
      let animated = false;
      for (const entry of entries) {
        if (pathBudget <= 0) break;
        pathBudget--;
        animated = true;
        animateWordPath(cell, entry);
      }

      if (!animated && cell.miss && missBudget > 0) {
        missBudget--;
        animated = true;
        animateMiss(cell, cell.miss);
      }

      if (!animated) {
        status("cell (" + cell.r + "," + cell.c + "): no new word from this start", C.grey, false);
        detail("remaining branches were already pruned by the trie");
      }

      tl.add(0.01, () => {
        wsBoardReset(scene);
        trieResetLook(scene, tree);
      });
      tl.wait(0.08);
    }

    // --- final result ----------------------------------------------------
    tl.line(37);
    const outStr = sim.result.length ? sim.result.join(", ") : "";
    tl.add(0.01, () => {
      scene.result.textContent = "found = [" + outStr + "]";
      scene.result.setAttribute("fill", C.green);
      setOpacity(scene.cursor, 0);
    });
    tl.add(0.45, u => {
      setOpacity(scene.result, u);
      setOpacity(scene.complexity, u);
    }, easeOut);
    tl.log("found = [" + outStr + "]", C.green);
    tl.wait(0.75);
    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Simulation: run the real algorithm and keep selected DFS paths.
 * ------------------------------------------------------------------ */

function simulateWordSearch(grid, words) {
  const initial = wsBuildTrie(words);
  const simRoot = wsClone(initial, null);
  const board = grid.map(row => row.slice());
  const rows = board.length;
  const cols = rows ? board[0].length : 0;
  const result = [];
  const cells = [];

  function dfs(r, c, parent, path, cell) {
    cell.calls++;
    const ch = board[r][c];
    const node = parent.children[ch];
    if (!node) {
      const miss = { path: path.slice(), r, c, ch, parentSrc: parent.src };
      if (!cell.miss || miss.path.length < cell.miss.path.length) cell.miss = miss;
      return;
    }

    path.push({ r, c, ch, nodeSrc: node.src });
    if (node.word !== null) {
      cell.finds.push({ word: node.word, path: path.slice(), terminalSrc: node.src });
      result.push(node.word);
      node.word = null;
    }

    board[r][c] = "#";
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] !== "#") {
        dfs(nr, nc, node, path, cell);
      }
    }
    board[r][c] = ch;

    if (!Object.keys(node.children).length) {
      cell.prunes++;
      delete parent.children[ch];
    }
    path.pop();
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = { r, c, ch: grid[r][c], finds: [], miss: null, calls: 0, prunes: 0 };
      dfs(r, c, simRoot, [], cell);
      cells.push(cell);
    }
  }

  return { initial, result, cells };
}
