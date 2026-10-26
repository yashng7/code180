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
 * Scene
 * ------------------------------------------------------------------ */

const SCENE = {
  meta: {
    title: "Implement Trie (Prefix Tree)",
    subtitle: "prefix tree · one edge per character · O(L) per operation",
    inputs: [
      {
        id: "ops",
        label: "operations",
        type: "text",
        default: "Trie(), insert(apple), search(apple), search(app), startsWith(app), insert(app), search(app)",
        width: "wide",
      },
    ],
    legend: [
      { color: "#58C4DD", text: "walked path" },
      { color: "#F0AC5F", text: "current node / is_end" },
      { color: "#83C167", text: "query True" },
      { color: "#FC6255", text: "query False" },
    ],
  },

  code: [
    "class Trie:",
    "    def __init__(self) -> None:",
    "        self.children: dict[str, \"Trie\"] = {}",
    "        self.is_end: bool = False",
    "    def insert(self, word: str) -> None:",
    "        node = self",
    "        for ch in word:",
    "            if ch not in node.children:",
    "                node.children[ch] = Trie()",
    "            node = node.children[ch]",
    "        node.is_end = True",
    "    def _walk(self, prefix: str) -> \"Trie | None\":",
    "        node = self",
    "        for ch in prefix:",
    "            if ch not in node.children:",
    "                return None",
    "            node = node.children[ch]",
    "        return node",
    "    def search(self, word: str) -> bool:",
    "        node = self._walk(word)",
    "        return node is not None and node.is_end",
    "    def startsWith(self, prefix: str) -> bool:",
    "        return self._walk(prefix) is not None",
  ],

  read(values) {
    const raw = String(values.ops || "").trim();
    if (!raw) return null;
    const parts = raw.split(/\s*,\s*/).filter(Boolean);
    if (parts.length < 1 || parts.length > 12) return null;
    const ops = [];
    for (const p of parts) {
      if (/^(?:Trie|Trie\(\s*\))$/i.test(p)) {
        ops.push({ op: "init", word: null, label: "Trie()" });
        continue;
      }
      let m = p.match(/^insert\(\s*([A-Za-z]+)\s*\)$/i);
      if (m) {
        ops.push({ op: "insert", word: m[1], label: "insert(" + m[1] + ")" });
        continue;
      }
      m = p.match(/^search\(\s*([A-Za-z]+)\s*\)$/i);
      if (m) {
        ops.push({ op: "search", word: m[1], label: "search(" + m[1] + ")" });
        continue;
      }
      m = p.match(/^startsWith\(\s*([A-Za-z]+)\s*\)$/i);
      if (m) {
        ops.push({ op: "startsWith", word: m[1], label: "startsWith(" + m[1] + ")" });
        continue;
      }
      return null;
    }
    if (ops[0].op !== "init") ops.unshift({ op: "init", word: null, label: "Trie()" });
    if (ops.length > 12) return null;
    return { ops };
  },

  fromArgs(args) {
    const spec = Array.isArray(args) ? args[0] : args;
    if (!spec || !Array.isArray(spec.ops) || !Array.isArray(spec.vals)) return null;
    const tokens = [];
    for (let i = 0; i < spec.ops.length; i++) {
      const op = spec.ops[i];
      const v = spec.vals[i] || [];
      if (op === "Trie") tokens.push("Trie()");
      else if (op === "insert" || op === "search" || op === "startsWith") {
        if (!v.length) return null;
        tokens.push(op + "(" + v[0] + ")");
      } else return null;
    }
    if (tokens.length < 1 || tokens.length > 12) return null;
    return { ops: tokens.join(", ") };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const ops = params.ops;
    const sim = simulateTrie(ops);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-red", C.red);
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
      opCells: [], wordChips: [], wordLabel: null,
      _writers: [], _resets: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };
    scene.registerReset = fn => { scene._resets.push(fn); };

    scene.title = txt("Implement Trie (Prefix Tree)", {
      x: 64, y: 62, "font-size": 38, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    scene.subtitle = txt(
      "Insert grows one edge per character · search needs is_end · startsWith only needs the prefix node",
      { x: 64, y: 96, "font-size": 18, fill: C.grey },
      textL
    );
    setOpacity(scene.subtitle, 0);

    // --- operation ribbon ------------------------------------------------
    const opY = 145;
    const opH = 40;
    const n = ops.length;
    const opW = clamp(Math.floor(1080 / n) - 8, 76, 132);
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

    // --- current word / pattern chips ------------------------------------
    const maxLen = Math.max(0, ...ops.filter(o => o.word).map(o => o.word.length));
    scene.wordLabel = txt("word", {
      x: 64, y: 214, "font-size": 15, fill: C.grey, "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.wordLabel, 0);
    for (let i = 0; i < maxLen; i++) {
      const x = 132 + i * 36;
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
      scene.wordChips.push({ g, rect, t });
    }

    // --- trie ------------------------------------------------------------
    scene.tree = trieAddTree(scene, sim.root, {
      x: 70, y: 260, w: 1140, h: 312, r: 15,
      gapX: 160, gapY: 52, edgeLabels: true,
    });

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
      setOpacity(scene.wordLabel, 0);
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.result.textContent = "";
      scene.wordLabel.textContent = "word";
      for (const c of scene.opCells) {
        setOpacity(c.g, 0);
        c.box.setAttribute("fill", C.chipFill);
        c.box.setAttribute("stroke", C.greyDark);
        c.retTxt.textContent = "";
      }
      for (const chip of scene.wordChips) {
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

    const status = (text, color) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || C.gold);
        setOpacity(scene.status, 1);
      });
      tl.log(text, color || C.gold);
    };
    const detail = text => {
      tl.add(0.01, () => {
        scene.detail.textContent = text;
        setOpacity(scene.detail, 1);
      });
    };
    const setWord = (word, color) => {
      tl.add(0.01, () => {
        setOpacity(scene.wordLabel, 1);
        scene.wordLabel.textContent = "word";
        for (let i = 0; i < scene.wordChips.length; i++) {
          const chip = scene.wordChips[i];
          if (i < word.length) {
            chip.t.textContent = word[i];
            chip.rect.setAttribute("fill", C.chipFill);
            chip.rect.setAttribute("stroke", color || C.greyDark);
            chip.t.setAttribute("fill", color || C.white);
            setOpacity(chip.g, 1);
          } else {
            setOpacity(chip.g, 0);
          }
        }
      });
    };
    const chipState = (i, color, fill) => {
      tl.add(0.01, () => {
        const chip = scene.wordChips[i];
        if (!chip) return;
        chip.rect.setAttribute("stroke", color || C.greyDark);
        chip.rect.setAttribute("fill", fill || C.chipFill);
        chip.t.setAttribute("fill", color || C.white);
      });
    };
    const clearChips = () => {
      tl.add(0.01, () => {
        for (const chip of scene.wordChips) {
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

    // --- title -----------------------------------------------------------
    tl.line(1);
    tl.add(0.65, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, easeOut(u)), easeOut);

    // --- operation ribbon ------------------------------------------------
    tl.add(0.55, u => {
      scene.opCells.forEach((c, i) => {
        const start = i * 0.05;
        const p = ctx.clamp((u - start) / Math.max(0.3, 1 - start), 0, 1);
        setOpacity(c.g, easeOut(p));
      });
    }, easeOut);
    tl.wait(0.2);

    // --- __init__ + empty root ------------------------------------------
    tl.line([2, 3, 4]);
    trieRevealNode(scene, tl, tree.byModel.get(sim.root), 0.3);
    status("Trie() creates an empty root: children = {} and is_end = False", C.blue);
    detail("the root represents the empty prefix");
    tl.wait(0.15);

    let prevCell = scene.opCells[0];

    for (let si = 0; si < ops.length; si++) {
      const op = ops[si];
      if (op.op === "init") continue;
      const step = sim.steps[si];
      const cell = scene.opCells[si];

      activeOp(si, prevCell);
      clearChips();
      setWord(step.word, C.grey);
      trieResetLook(scene, tree);
      tl.wait(0.12);

      if (op.op === "insert") {
        tl.line(5);
        status("insert(\"" + step.word + "\")", C.blue);
        tl.line(6);
        detail("start at the root and follow the word one character at a time");
        let current = sim.root;
        trieHighlightPath(scene, tl, tree, [sim.root], sim.root, C.blue);

        for (let ci = 0; ci < step.word.length; ci++) {
          const ch = step.word[ci];
          tl.line(7);
          const existing = current.children[ch];
          const wasCreated = step.created.indexOf(existing) >= 0;
          if (wasCreated) {
            tl.line(8);
            status("'" + ch + "' is missing under prefix \"" + step.word.slice(0, ci) + "\"  →  create a new node", C.gold);
            tl.line(9);
            const edge = tree.edgeByChild.get(existing);
            if (edge) trieRevealEdge(scene, tl, edge, 0.2);
            trieRevealNode(scene, tl, tree.byModel.get(existing), 0.22);
            tl.line(10);
            trieHighlightPath(scene, tl, tree, step.path.slice(0, ci + 2), existing, C.gold);
            detail("new node for prefix \"" + step.word.slice(0, ci + 1) + "\"");
          } else {
            tl.line(10);
            trieHighlightPath(scene, tl, tree, step.path.slice(0, ci + 2), existing, C.blue);
            status("follow the existing '" + ch + "' edge  →  prefix \"" + step.word.slice(0, ci + 1) + "\"", C.blue);
          }
          chipState(ci, C.blue, "#132a38");
          current = existing;
          tl.wait(0.08);
        }

        tl.line(11);
        trieMarkEnd(scene, tl, tree, step.terminal, C.gold);
        trieMarkResult(scene, tl, tree, step.terminal, C.gold);
        if (step.already) {
          status("set is_end = True  →  \"" + step.word + "\" was already present", C.gold);
          detail("duplicate insert is idempotent: no new nodes were created");
        } else {
          status("set is_end = True  →  \"" + step.word + "\" is now a complete word", C.gold);
          detail("the terminal marker is what makes search(\"" + step.word + "\") return True");
        }
        returnValue(si, null);
      } else if (op.op === "search" || op.op === "startsWith") {
        const isSearch = op.op === "search";
        if (isSearch) tl.line(19); else tl.line(22);
        status((isSearch ? "search" : "startsWith") + "(\"" + step.word + "\")", C.blue);
        if (isSearch) tl.line(20); else tl.line(22);
        tl.line([12, 13]);
        detail("_walk starts at the root and follows each character");
        let current = sim.root;
        trieHighlightPath(scene, tl, tree, [sim.root], sim.root, C.blue);

        let failed = false;
        for (let ci = 0; ci < step.word.length; ci++) {
          const ch = step.word[ci];
          tl.line(14);
          if (step.missing && step.missing.ch === ch) {
            tl.line([15, 16]);
            failed = true;
            chipState(ci, C.red, "#2d1718");
            trieMarkMissing(scene, tl, tree, current, ch);
            status("no '" + ch + "' child under prefix \"" + step.word.slice(0, ci) + "\"  →  return None", C.red);
            detail("the prefix is not in the trie, so the whole query is False");
            break;
          }
          const next = current.children[ch];
          tl.line(17);
          trieHighlightPath(scene, tl, tree, step.path.slice(0, ci + 2), next, C.blue);
          chipState(ci, C.blue, "#132a38");
          status("follow '" + ch + "'  →  prefix \"" + step.word.slice(0, ci + 1) + "\"", C.blue);
          current = next;
          tl.wait(0.06);
        }

        if (!failed) {
          tl.line(18);
          if (isSearch) {
            tl.line(21);
            if (step.ret) {
              trieMarkResult(scene, tl, tree, step.terminal, C.green);
              status("node found and is_end = True  →  search(\"" + step.word + "\") = True", C.green);
              detail("exact word match: the terminal marker is set");
            } else {
              trieMarkResult(scene, tl, tree, step.terminal, C.red);
              status("node found but is_end = False  →  search(\"" + step.word + "\") = False", C.red);
              detail("\"" + step.word + "\" is only a prefix of a longer word");
            }
          } else {
            tl.line(23);
            trieMarkResult(scene, tl, tree, step.terminal, C.green);
            status("prefix node exists  →  startsWith(\"" + step.word + "\") = True", C.green);
            detail("startsWith does not care whether the node is terminal");
          }
        } else if (isSearch) {
          tl.line(21);
          status("_walk returned None  →  search(\"" + step.word + "\") = False", C.red);
          detail("the exact word cannot be in the trie without its prefix");
        } else {
          tl.line(23);
          status("_walk returned None  →  startsWith(\"" + step.word + "\") = False", C.red);
          detail("no inserted word has this prefix");
        }
        returnValue(si, step.ret);
      }

      prevCell = cell;
      tl.wait(0.18);
    }

    // --- final output ----------------------------------------------------
    tl.add(0.35, u => {
      trieResetLook(scene, tree);
      setOpacity(scene.opPtr, 1 - u);
      setOpacity(scene.wordLabel, 1 - u);
      for (const chip of scene.wordChips) setOpacity(chip.g, 1 - u);
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
 * Simulation
 * ------------------------------------------------------------------ */

function simulateTrie(ops) {
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
    if (op.op === "insert") {
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
      steps.push({ op: "insert", word: op.word, path, created, terminal: node, already, ret: null });
      outputs.push(null);
    } else {
      const walked = trieWalk(root, op.word);
      const ret = op.op === "search"
        ? (walked.found && walked.node.isEnd)
        : walked.found;
      steps.push({
        op: op.op,
        word: op.word,
        path: walked.path,
        missing: walked.found ? null : { parent: walked.node, ch: walked.missing },
        terminal: walked.found ? walked.node : null,
        ret,
      });
      outputs.push(ret);
    }
  }
  return { root, steps, outputs };
}
