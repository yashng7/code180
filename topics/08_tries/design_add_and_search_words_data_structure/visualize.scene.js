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
    node.ring.setAttribute("stroke", C.gold);
    setOpacity(node.ring, node.model.endVisible ? 1 : 0);
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
 * Wildcard-aware highlight: every child of a '.' node gets a purple ring.
 * ------------------------------------------------------------------ */

function trieHighlightBranches(scene, tl, tree, children, color) {
  const { C, setOpacity } = scene.ctx;
  tl.add(0.01, () => {
    trieResetLook(scene, tree);
    for (const child of children) {
      const node = tree.byModel.get(child);
      if (!node) continue;
      node.circle.setAttribute("stroke", color || C.purple);
      node.circle.setAttribute("fill", "#241a2e");
      node.circle.setAttribute("stroke-width", "3.2");
      if (node.label) node.label.setAttribute("fill", color || C.purple);
      const edge = tree.edgeByChild.get(child);
      if (edge) {
        edge.line.setAttribute("stroke", color || C.purple);
        edge.line.setAttribute("stroke-width", "3.4");
        if (edge.labelText) edge.labelText.setAttribute("fill", color || C.purple);
        if (edge.labelBg) edge.labelBg.setAttribute("stroke", color || C.purple);
      }
      node.ring.setAttribute("stroke", color || C.purple);
      setOpacity(node.ring, 1);
      node.dot.setAttribute("fill", color || C.purple);
      setOpacity(node.dot, 1);
    }
  });
}

/* ------------------------------------------------------------------ *
 * Scene
 * ------------------------------------------------------------------ */

const SCENE = {
  meta: {
    title: "Design Add and Search Words Data Structure",
    subtitle: "trie + wildcard DFS · '.' branches into every child · O(L) add, O(L·26^L) search",
    inputs: [
      {
        id: "ops",
        label: "operations",
        type: "text",
        default: "WordDictionary(), addWord(bad), addWord(dad), addWord(mad), search(pad), search(bad), search(.ad), search(b..)",
        width: "wide",
      },
    ],
    legend: [
      { color: "#58C4DD", text: "matched path" },
      { color: "#B58CD6", text: "wildcard branches" },
      { color: "#F0AC5F", text: "terminal is_end" },
      { color: "#83C167", text: "search True" },
      { color: "#FC6255", text: "search False" },
    ],
  },

  code: [
    "class WordDictionary:",
    "    def __init__(self) -> None:",
    "        self.children: dict[str, \"WordDictionary\"] = {}",
    "        self.is_end: bool = False",
    "    def addWord(self, word: str) -> None:",
    "        node = self",
    "        for ch in word:",
    "            if ch not in node.children:",
    "                node.children[ch] = WordDictionary()",
    "            node = node.children[ch]",
    "        node.is_end = True",
    "    def search(self, word: str) -> bool:",
    "        def dfs(node: \"WordDictionary\", index: int) -> bool:",
    "            if index == len(word):",
    "                return node.is_end",
    "            ch = word[index]",
    "            if ch == \".\":",
    "                return any(dfs(child, index + 1) for child in node.children.values())",
    "            child = node.children.get(ch)",
    "            return child is not None and dfs(child, index + 1)",
    "        return dfs(self, 0)",
  ],

  read(values) {
    const raw = String(values.ops || "").trim();
    if (!raw) return null;
    const parts = raw.split(/\s*,\s*/).filter(Boolean);
    if (parts.length < 1 || parts.length > 14) return null;
    const ops = [];
    for (const p of parts) {
      if (/^(?:WordDictionary|WordDictionary\(\s*\))$/i.test(p)) {
        ops.push({ op: "init", word: null, label: "WordDictionary()" });
        continue;
      }
      let m = p.match(/^addWord\(\s*([A-Za-z]+)\s*\)$/i);
      if (m) {
        ops.push({ op: "addWord", word: m[1], label: "addWord(" + m[1] + ")" });
        continue;
      }
      m = p.match(/^search\(\s*([A-Za-z.]+)\s*\)$/i);
      if (m) {
        ops.push({ op: "search", word: m[1], label: "search(" + m[1] + ")" });
        continue;
      }
      return null;
    }
    if (ops[0].op !== "init") ops.unshift({ op: "init", word: null, label: "WordDictionary()" });
    if (ops.length > 14) return null;
    return { ops };
  },

  fromArgs(args) {
    const spec = Array.isArray(args) ? args[0] : args;
    if (!spec || !Array.isArray(spec.ops) || !Array.isArray(spec.vals)) return null;
    const tokens = [];
    for (let i = 0; i < spec.ops.length; i++) {
      const op = spec.ops[i];
      const v = spec.vals[i] || [];
      if (op === "WordDictionary") tokens.push("WordDictionary()");
      else if (op === "addWord" || op === "search") {
        if (!v.length) return null;
        tokens.push(op + "(" + v[0] + ")");
      } else return null;
    }
    if (tokens.length < 1 || tokens.length > 14) return null;
    return { ops: tokens.join(", ") };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const ops = params.ops;
    const sim = simulateWordDictionary(ops);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-red", C.red);
    ctx.glow("glow-purple", C.purple);
    ctx.glow("glow-teal", C.teal);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const arcsL = ctx.layer("arcs");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = {
      ctx, ops, sim,
      layers: { text: textL, chips: chipsL, arcs: arcsL, pointer: ptrL, result: resultL },
      opCells: [], patternChips: [], patternLabel: null,
      traceRows: [], traceTitle: null, panelRect: null, _traceState: [],
      _writers: [], _resets: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };
    scene.registerReset = fn => { scene._resets.push(fn); };

    scene.title = txt("Design Add and Search Words Data Structure", {
      x: 64, y: 62, "font-size": 34, fill: C.white, "letter-spacing": 0.3,
    }, textL);
    scene.subtitle = txt(
      "Trie + DFS: letters follow one edge, '.' branches into every child until the pattern ends",
      { x: 64, y: 96, "font-size": 18, fill: C.grey },
      textL
    );
    setOpacity(scene.subtitle, 0);

    // --- operation ribbon ------------------------------------------------
    const opY = 145;
    const opH = 40;
    const n = ops.length;
    const opW = clamp(Math.floor(1080 / n) - 8, 72, 132);
    const pitch = opW + 8;
    const totalW = n * pitch - 8;
    const startX = STAGE_W / 2 - totalW / 2;

    for (let i = 0; i < n; i++) {
      const x = startX + i * pitch;
      const cx = x + opW / 2;
      const g = el("g", {}, chipsL);
      setOpacity(g, 0);
      const box = el("rect", {
        x, y: opY - opH / 2, width: opW, height: opH, rx: 8,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, g);
      const lbl = txt(ops[i].label, {
        x: cx, y: opY, "font-size": clamp(opW / Math.max(9, ops[i].label.length * 0.58), 8, 15),
        fill: C.white, "text-anchor": "middle", "dominant-baseline": "central",
      }, g);
      const retTxt = txt("", {
        x: cx, y: opY + opH / 2 + 18, "font-size": 15, fill: C.teal,
        "text-anchor": "middle",
      }, g);
      scene.opCells.push({ g, box, lbl, retTxt, x, cx, w: opW });
    }

    scene.opPtr = el("g", {}, ptrL);
    setOpacity(scene.opPtr, 0);
    el("polygon", {
      points: "-8,-13 8,-13 0,-2", fill: C.gold, filter: "url(#glow-gold)",
    }, scene.opPtr);
    setTranslate(scene.opPtr, scene.opCells[0].cx, opY - opH / 2 - 6);

    // --- current pattern chips ------------------------------------------
    const maxLen = Math.max(0, ...ops.filter(o => o.word).map(o => o.word.length));
    scene.patternLabel = txt("pattern", {
      x: 64, y: 214, "font-size": 15, fill: C.grey, "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.patternLabel, 0);
    for (let i = 0; i < maxLen; i++) {
      const x = 150 + i * 36;
      const g = el("g", { transform: "translate(" + x + " 199)" }, chipsL);
      setOpacity(g, 0);
      const rect = el("rect", {
        x: 0, y: 0, width: 30, height: 30, rx: 6,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.8,
      }, g);
      const t = txt("", {
        x: 15, y: 16, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": 16, fill: C.white,
      }, g);
      scene.patternChips.push({ g, rect, t });
    }

    // --- trie ------------------------------------------------------------
    scene.tree = trieAddTree(scene, sim.root, {
      x: 45, y: 260, w: 770, h: 300, r: 15,
      gapX: 130, gapY: 52, edgeLabels: true,
    });

    // --- live DFS trace panel -------------------------------------------
    const panelX = 850, panelY = 255, panelW = 370, panelH = 310;
    const panelG = el("g", {}, textL);
    const panelRect = el("rect", {
      x: panelX, y: panelY, width: panelW, height: panelH, rx: 12,
      fill: "#0b111b", stroke: C.greyDark, "stroke-width": 1.6,
    }, panelG);
    scene.panelRect = panelRect;
    setOpacity(panelRect, 0);
    scene.traceTitle = txt("search trace", {
      x: panelX + 18, y: panelY + 27, "font-size": 15, fill: C.grey,
    }, panelG);
    setOpacity(scene.traceTitle, 0);
    for (let i = 0; i < 8; i++) {
      const row = txt("", {
        x: panelX + 18, y: panelY + 58 + i * 30, "font-size": 13.5, fill: C.white,
      }, panelG);
      setOpacity(row, 0);
      scene.traceRows.push(row);
    }

    // --- bottom narration ------------------------------------------------
    scene.status = txt("", {
      x: 64, y: 625, "font-size": 19, fill: C.gold,
    }, textL);
    scene.detail = txt("", {
      x: 64, y: 655, "font-size": 16, fill: C.grey,
    }, textL);
    scene.result = txt("", {
      x: 64, y: 692, "font-size": 20, fill: C.green,
    }, resultL);
    setOpacity(scene.status, 0);
    setOpacity(scene.detail, 0);
    setOpacity(scene.result, 0);

    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const fn of scene._resets) fn();
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.status, 0);
      setOpacity(scene.detail, 0);
      setOpacity(scene.result, 0);
      setOpacity(scene.opPtr, 0);
      setOpacity(scene.patternLabel, 0);
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.result.textContent = "";
      scene.patternLabel.textContent = "pattern";
      scene._traceState = [];
      setOpacity(panelRect, 0);
      setOpacity(scene.traceTitle, 0);
      scene.traceTitle.textContent = "search trace";
      for (const row of scene.traceRows) {
        row.textContent = "";
        setOpacity(row, 0);
      }
      for (const c of scene.opCells) {
        setOpacity(c.g, 0);
        c.box.setAttribute("fill", C.chipFill);
        c.box.setAttribute("stroke", C.greyDark);
        c.retTxt.textContent = "";
      }
      for (const chip of scene.patternChips) {
        setOpacity(chip.g, 0);
        chip.rect.setAttribute("fill", C.chipFill);
        chip.rect.setAttribute("stroke", C.greyDark);
        chip.t.setAttribute("fill", C.white);
        chip.t.textContent = "";
      }
      if (scene.opCells[0]) setTranslate(scene.opPtr, scene.opCells[0].cx, opY - opH / 2 - 6);
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity, setTranslate } = ctx;
    const { ops, sim, tree } = scene;
    const easeOut = ease.outCubic;
    const lerp = (a, b, t) => a + (b - a) * t;
    const ptrY = 145 - 20 - 6;

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
    const pushTrace = (text, color) => {
      tl.add(0.01, () => {
        scene._traceState.push({ text, color: color || C.white });
        while (scene._traceState.length > 8) scene._traceState.shift();
        scene.traceRows.forEach((row, i) => {
          const e = scene._traceState[i];
          row.textContent = e ? e.text : "";
          row.setAttribute("fill", e ? e.color : C.white);
          setOpacity(row, e ? 1 : 0);
        });
      });
    };
    const clearTrace = (title) => {
      tl.add(0.01, () => {
        scene._traceState = [];
        scene.traceTitle.textContent = title || "search trace";
        setOpacity(scene.traceTitle, 1);
        for (const row of scene.traceRows) {
          row.textContent = "";
          setOpacity(row, 0);
        }
      });
      tl.add(0.25, u => {
        setOpacity(scene.panelRect, u);
        setOpacity(scene.traceTitle, u);
        for (const row of scene.traceRows) setOpacity(row, u * 0.9);
      }, easeOut);
    };
    const setPattern = (word, color) => {
      tl.add(0.01, () => {
        setOpacity(scene.patternLabel, 1);
        scene.patternLabel.textContent = "pattern";
        for (let i = 0; i < scene.patternChips.length; i++) {
          const chip = scene.patternChips[i];
          if (i < word.length) {
            chip.t.textContent = word[i];
            const wild = word[i] === ".";
            chip.rect.setAttribute("fill", wild ? "#241a2e" : C.chipFill);
            chip.rect.setAttribute("stroke", wild ? C.purple : (color || C.greyDark));
            chip.t.setAttribute("fill", wild ? C.purple : (color || C.white));
            setOpacity(chip.g, 1);
          } else {
            setOpacity(chip.g, 0);
          }
        }
      });
    };
    const chipState = (i, color, fill) => {
      tl.add(0.01, () => {
        const chip = scene.patternChips[i];
        if (!chip) return;
        chip.rect.setAttribute("stroke", color || C.greyDark);
        chip.rect.setAttribute("fill", fill || C.chipFill);
        chip.t.setAttribute("fill", color || C.white);
      });
    };
    const clearChips = () => {
      tl.add(0.01, () => {
        for (const chip of scene.patternChips) {
          chip.rect.setAttribute("stroke", C.greyDark);
          chip.rect.setAttribute("fill", C.chipFill);
          chip.t.setAttribute("fill", C.white);
        }
      });
    };
    const activeOp = (i, prev) => {
      tl.add(0.42, u => {
        const e = ease.inOutSine(u);
        setTranslate(scene.opPtr, lerp(prev.cx, scene.opCells[i].cx, e), ptrY);
        setOpacity(scene.opPtr, 1);
        if (u > 0.45) {
          if (prev !== scene.opCells[i]) {
            prev.box.setAttribute("fill", C.chipFill);
            prev.box.setAttribute("stroke", C.greyDark);
          }
          scene.opCells[i].box.setAttribute("fill", "#262015");
          scene.opCells[i].box.setAttribute("stroke", C.gold);
        }
      });
    };
    const returnValue = (i, value) => {
      tl.add(0.01, () => {
        const cell = scene.opCells[i];
        cell.retTxt.textContent = value === null ? "null" : String(value);
        cell.retTxt.setAttribute(
          "fill",
          value === null ? C.grey : (value ? C.green : C.red)
        );
      });
    };
    const prefixOf = node => {
      const chars = [];
      let cur = node;
      while (cur && cur.parent) {
        chars.push(cur.ch);
        cur = cur.parent;
      }
      return chars.reverse().join("");
    };

    // --- title -----------------------------------------------------------
    tl.line(1);
    tl.add(0.65, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, easeOut(u)), easeOut);

    // --- operation ribbon ------------------------------------------------
    tl.add(0.55, u => {
      scene.opCells.forEach((c, i) => {
        const start = i * 0.045;
        const p = ctx.clamp((u - start) / Math.max(0.3, 1 - start), 0, 1);
        setOpacity(c.g, easeOut(p));
      });
    }, easeOut);
    tl.wait(0.2);

    // --- __init__ --------------------------------------------------------
    tl.line([2, 3, 4]);
    trieRevealNode(scene, tl, tree.byModel.get(sim.root), 0.3);
    status("WordDictionary() creates an empty root with children = {} and is_end = False", C.blue);
    detail("addWord builds the trie; search will walk it with wildcard branching");
    tl.wait(0.15);

    let prevCell = scene.opCells[0];

    for (let si = 0; si < ops.length; si++) {
      const op = ops[si];
      if (op.op === "init") continue;
      const step = sim.steps[si];
      const cell = scene.opCells[si];

      activeOp(si, prevCell);
      clearChips();
      setPattern(step.word, C.grey);
      trieResetLook(scene, tree);
      tl.wait(0.12);

      if (op.op === "addWord") {
        tl.line(5);
        clearTrace("addWord(\"" + step.word + "\")");
        pushTrace("insert each character", C.grey);
        status("addWord(\"" + step.word + "\")", C.blue);
        tl.line(6);
        detail("follow existing edges and create any missing node");
        let current = sim.root;
        trieHighlightPath(scene, tl, tree, [sim.root], sim.root, C.blue);

        for (let ci = 0; ci < step.word.length; ci++) {
          const ch = step.word[ci];
          tl.line(7);
          const existing = current.children[ch];
          const wasCreated = step.created.indexOf(existing) >= 0;
          if (wasCreated) {
            tl.line(8);
            status("'" + ch + "' is missing  →  create a new node", C.gold);
            tl.line(9);
            const edge = tree.edgeByChild.get(existing);
            if (edge) trieRevealEdge(scene, tl, edge, 0.2);
            trieRevealNode(scene, tl, tree.byModel.get(existing), 0.22);
            tl.line(10);
            trieHighlightPath(scene, tl, tree, step.path.slice(0, ci + 2), existing, C.gold);
            detail("new node for prefix \"" + step.word.slice(0, ci + 1) + "\"");
            pushTrace("new node '" + ch + "'", C.gold);
          } else {
            tl.line(10);
            trieHighlightPath(scene, tl, tree, step.path.slice(0, ci + 2), existing, C.blue);
            status("follow the existing '" + ch + "' edge", C.blue);
            pushTrace("follow '" + ch + "'", C.blue);
          }
          chipState(ci, C.blue, "#132a38");
          current = existing;
          tl.wait(0.07);
        }

        tl.line(11);
        trieMarkEnd(scene, tl, tree, step.terminal, C.gold);
        trieMarkResult(scene, tl, tree, step.terminal, C.gold);
        pushTrace("is_end = True", C.gold);
        if (step.already) {
          status("set is_end = True  →  \"" + step.word + "\" was already stored", C.gold);
          detail("duplicate addWord is idempotent");
        } else {
          status("set is_end = True  →  \"" + step.word + "\" is stored", C.gold);
          detail("this terminal marker is what search must reach");
        }
        returnValue(si, null);
      } else {
        tl.line(12);
        clearTrace("search(\"" + step.word + "\")");
        status("search(\"" + step.word + "\")", C.blue);
        tl.line(21);
        tl.line([13, 14]);
        detail("dfs(node, index) walks the pattern from the root");
        trieHighlightPath(scene, tl, tree, [sim.root], sim.root, C.blue);

        for (const ev of step.events) {
          if (ev.type === "call") {
            tl.line([13, 14]);
            trieHighlightPath(scene, tl, tree, ev.path, ev.node, C.blue);
            const pre = prefixOf(ev.node) || "root";
            status("dfs(\"" + pre + "\", index " + ev.index + ")", C.blue, false);
            pushTrace("dfs(" + (pre === "root" ? "root" : '"' + pre + '"') + ", " + ev.index + ")", C.blue);
          } else if (ev.type === "end") {
            tl.line(14);
            tl.line(15);
            trieMarkResult(scene, tl, tree, ev.node, ev.result ? C.green : C.red);
            status(
              "index == len(pattern)  →  return is_end = " + ev.result,
              ev.result ? C.green : C.red,
              false
            );
            pushTrace("end → is_end=" + ev.result, ev.result ? C.green : C.red);
          } else if (ev.type === "wildcard") {
            tl.line(16);
            tl.line(17);
            trieHighlightBranches(scene, tl, tree, ev.children, C.purple);
            const names = ev.children.map(n => n.ch).join(", ");
            chipState(ev.index, C.purple, "#241a2e");
            status("'.' at index " + ev.index + "  →  branch into [" + (names || "no children") + "]", C.purple, false);
            pushTrace("'.' → [" + (names || "empty") + "]", C.purple);
          } else if (ev.type === "literal") {
            tl.line(16);
            tl.line(19);
            trieHighlightPath(scene, tl, tree, ev.path.concat([ev.child]), ev.child, C.blue);
            chipState(ev.index, C.blue, "#132a38");
            status("'" + ev.ch + "' at index " + ev.index + "  →  follow child", C.blue, false);
            pushTrace("'" + ev.ch + "' → child", C.blue);
          } else if (ev.type === "missing") {
            tl.line(19);
            tl.line(20);
            trieMarkMissing(scene, tl, tree, ev.node, ev.ch);
            chipState(ev.index, C.red, "#2d1718");
            status("no child '" + ev.ch + "' at index " + ev.index + "  →  False", C.red, false);
            pushTrace("'" + ev.ch + "' missing", C.red);
          } else if (ev.type === "branchResult") {
            tl.line(18);
            if (ev.result) trieMarkResult(scene, tl, tree, ev.child, C.green);
            status("branch '" + ev.child.ch + "' returned " + ev.result, ev.result ? C.green : C.grey, false);
            pushTrace("branch '" + ev.child.ch + "' → " + ev.result, ev.result ? C.green : C.grey);
          } else if (ev.type === "return") {
            if (ev.index === step.word.length) tl.line(15);
            else if (step.word[ev.index] === ".") tl.line(18);
            else tl.line(20);
            status("dfs at index " + ev.index + " returns " + ev.result, ev.result ? C.green : C.red, false);
            pushTrace("return " + ev.result, ev.result ? C.green : C.red);
          }
          tl.wait(0.04);
        }

        tl.add(0.01, () => {
          trieResetLook(scene, tree);
          for (let i = 0; i < step.word.length; i++) {
            const chip = scene.patternChips[i];
            if (!chip) continue;
            const col = step.ret ? C.green : C.red;
            chip.rect.setAttribute("stroke", col);
            chip.rect.setAttribute("fill", step.ret ? "#17251a" : "#2d1718");
            chip.t.setAttribute("fill", col);
          }
        });
        if (step.ret) {
          status("search(\"" + step.word + "\") = True", C.green);
          detail("some DFS branch reached a terminal node at the end of the pattern");
        } else {
          status("search(\"" + step.word + "\") = False", C.red);
          detail("no branch reached a terminal node at the end of the pattern");
        }
        returnValue(si, step.ret);
      }

      prevCell = cell;
      tl.wait(0.16);
    }

    // --- final output ----------------------------------------------------
    tl.add(0.35, u => {
      trieResetLook(scene, tree);
      setOpacity(scene.opPtr, 1 - u);
      setOpacity(scene.patternLabel, 1 - u);
      for (const chip of scene.patternChips) setOpacity(chip.g, 1 - u);
    }, easeOut);
    const outStr = sim.outputs.map(v => v === null ? "null" : String(v)).join(", ");
    tl.add(0.01, () => {
      scene.result.textContent = "outputs = [" + outStr + "]";
      scene.result.setAttribute("fill", C.green);
    });
    tl.add(0.45, u => setOpacity(scene.result, u), easeOut);
    tl.log("outputs = [" + outStr + "]", C.green);
    tl.wait(0.7);
    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Simulation + recursive search trace
 * ------------------------------------------------------------------ */

function traceWordSearch(root, word) {
  const events = [];
  function dfs(node, index, path) {
    events.push({ type: "call", node, index, path: path.slice() });
    if (index === word.length) {
      const result = node.isEnd;
      events.push({ type: "end", node, index, result });
      return result;
    }
    const ch = word[index];
    if (ch === ".") {
      const kids = Object.keys(node.children).sort().map(k => node.children[k]);
      events.push({ type: "wildcard", node, index, children: kids, path: path.slice() });
      for (const child of kids) {
        const result = dfs(child, index + 1, path.concat([child]));
        events.push({ type: "branchResult", node, index, child, result });
        if (result) {
          events.push({ type: "return", node, index, result: true });
          return true;
        }
      }
      events.push({ type: "return", node, index, result: false });
      return false;
    }
    const child = node.children[ch];
    if (!child) {
      events.push({ type: "missing", node, index, ch });
      events.push({ type: "return", node, index, result: false });
      return false;
    }
    events.push({ type: "literal", node, index, ch, child, path: path.slice() });
    const result = dfs(child, index + 1, path.concat([child]));
    events.push({ type: "return", node, index, result });
    return result;
  }
  const result = dfs(root, 0, [root]);
  return { events, result };
}

function simulateWordDictionary(ops) {
  const root = trieMakeNode("", null);
  const steps = [];
  const outputs = [];

  for (let si = 0; si < ops.length; si++) {
    const op = ops[si];
    if (op.op === "init") {
      steps.push({ op: "init" });
      outputs.push(null);
      continue;
    }
    if (op.op === "addWord") {
      let node = root;
      const path = [root];
      const created = [];
      for (const ch of op.word) {
        let child = node.children[ch];
        if (!child) {
          child = trieMakeNode(ch, node);
          node.children[ch] = child;
          created.push(child);
        }
        node = child;
        path.push(node);
      }
      const already = node.isEnd;
      if (!node.isEnd) node.isEnd = true;
      steps.push({ op: "addWord", word: op.word, path, created, terminal: node, already, ret: null });
      outputs.push(null);
    } else {
      const trace = traceWordSearch(root, op.word);
      steps.push({ op: "search", word: op.word, events: trace.events, ret: trace.result });
      outputs.push(trace.result);
    }
  }
  return { root, steps, outputs };
}
