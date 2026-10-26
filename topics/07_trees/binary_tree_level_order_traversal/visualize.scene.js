/* Shared tree-scene helpers. Kept dependency-free so each generated scene
 * remains a single self-contained file. */

function treeParse(raw) {
  const s = String(raw == null ? "" : raw).trim();
  if (!s || s === "[]" || s === "null" || s === "None") return [];
  let body = s;
  if (body.startsWith("[") && body.endsWith("]")) body = body.slice(1, -1);
  if (!body.trim()) return [];
  const tokens = body.split(/[\s,]+/).filter(Boolean);
  const vals = [];
  for (const t of tokens) {
    if (t === "null" || t === "None" || t === "N" || t === "#") vals.push(null);
    else {
      const v = Number(t);
      if (!Number.isInteger(v)) return null;
      vals.push(v);
    }
  }
  if (vals.length > 31) return null;
  return vals;
}

function treeFormat(vals) {
  if (!vals || !vals.length) return "empty";
  return vals.map(v => v === null ? "null" : String(v)).join(", ");
}

function treeBuild(vals) {
  if (!vals || !vals.length || vals[0] === null) return null;
  const root = { val: vals[0], left: null, right: null, parent: null, depth: 0 };
  const q = [root];
  let i = 1;
  while (q.length && i < vals.length) {
    const n = q.shift();
    if (i < vals.length) {
      const v = vals[i++];
      if (v !== null) {
        n.left = { val: v, left: null, right: null, parent: n, depth: n.depth + 1 };
        q.push(n.left);
      }
    }
    if (i < vals.length) {
      const v = vals[i++];
      if (v !== null) {
        n.right = { val: v, left: null, right: null, parent: n, depth: n.depth + 1 };
        q.push(n.right);
      }
    }
  }
  return root;
}

function treeInorder(root) {
  const out = [];
  (function walk(n) { if (!n) return; walk(n.left); out.push(n); walk(n.right); })(root);
  return out;
}

function treePreorder(root) {
  const out = [];
  (function walk(n) { if (!n) return; out.push(n); walk(n.left); walk(n.right); })(root);
  return out;
}

function treePostorder(root) {
  const out = [];
  (function walk(n) { if (!n) return; walk(n.left); walk(n.right); out.push(n); })(root);
  return out;
}

function treeHeight(root) {
  if (!root) return 0;
  return 1 + Math.max(treeHeight(root.left), treeHeight(root.right));
}

function treeToList(root) {
  if (!root) return [];
  const out = [];
  const q = [root];
  while (q.length) {
    const n = q.shift();
    if (!n) { out.push(null); continue; }
    out.push(n.val);
    q.push(n.left);
    q.push(n.right);
  }
  while (out.length && out[out.length - 1] === null) out.pop();
  return out;
}

function treeFind(root, val) {
  let found = null;
  (function walk(n) {
    if (!n || found) return;
    if (n.val === val) found = n;
    walk(n.left);
    walk(n.right);
  })(root);
  return found;
}

function treeMirror(root) {
  if (!root) return null;
  const n = {
    val: root.val,
    left: treeMirror(root.right),
    right: treeMirror(root.left),
    parent: null,
    depth: 0,
  };
  if (n.left) n.left.parent = n;
  if (n.right) n.right.parent = n;
  return n;
}

function treeClone(root) {
  if (!root) return null;
  const n = {
    val: root.val,
    left: treeClone(root.left),
    right: treeClone(root.right),
    parent: null,
    depth: 0,
  };
  if (n.left) n.left.parent = n;
  if (n.right) n.right.parent = n;
  return n;
}

function treeSetDepth(root, depth) {
  if (!root) return;
  root.depth = depth || 0;
  treeSetDepth(root.left, root.depth + 1);
  treeSetDepth(root.right, root.depth + 1);
}

function treeLayout(root, opts) {
  const nodes = treeInorder(root);
  const count = nodes.length;
  const levels = treeHeight(root);
  const r = opts.r || 24;
  const regionX = opts.x;
  const regionY = opts.y;
  const regionW = opts.w;
  const regionH = opts.h;
  const maxGapX = opts.maxGapX || 120;
  const maxGapY = opts.maxGapY || 110;
  const gapX = count > 1 ? Math.min(maxGapX, (regionW - 2 * r) / (count - 1)) : 0;
  const gapY = levels > 1 ? Math.min(maxGapY, (regionH - 2 * r) / (levels - 1)) : 0;
  const totalW = gapX * (count - 1);
  const startX = regionX + (regionW - totalW) / 2;
  nodes.forEach((n, i) => {
    n.order = i;
    n.x = count === 1 ? regionX + regionW / 2 : startX + i * gapX;
    n.y = levels === 1 ? regionY + regionH / 2 : regionY + n.depth * gapY;
  });
  return { nodes, gapX, gapY, r, levels };
}

function treeSceneBase(ctx, opts) {
  const { el, txt, C, clamp, setOpacity } = ctx;
  ctx.backdrop();
  ctx.glow("glow-blue", C.blue);
  ctx.glow("glow-green", C.green);
  ctx.glow("glow-gold", C.gold);
  ctx.glow("glow-red", C.red);
  ctx.glow("glow-purple", C.purple);
  ctx.glow("glow-teal", C.teal);

  const writable = ctx.makeWritable();
  const layers = {
    bg: ctx.layer("bg"),
    arcs: ctx.layer("arcs"),
    chips: ctx.layer("chips"),
    pointer: ctx.layer("pointer"),
    text: ctx.layer("text"),
    result: ctx.layer("result"),
  };

  const scene = {
    ctx, layers, _writers: [], _resets: [], _panels: [],
    title: txt(opts.title, {
      x: 64, y: 64,
      "font-size": clamp(1180 / Math.max(18, opts.title.length * 0.58), 30, 40),
      fill: C.white, "letter-spacing": 0.4,
    }, layers.text),
    subtitle: txt(opts.subtitle || "", {
      x: 64, y: 100, "font-size": 20, fill: C.grey,
    }, layers.text),
    status: txt("", {
      x: 64, y: opts.statusY || 600, "font-size": 19, fill: C.gold,
    }, layers.text),
    detail: txt("", {
      x: 64, y: opts.detailY || 632, "font-size": 17, fill: C.grey,
    }, layers.text),
    result: txt("", {
      x: 64, y: opts.resultY || 676, "font-size": 24, fill: C.green,
    }, layers.text),
  };
  setOpacity(scene.subtitle, 0);
  setOpacity(scene.status, 0);
  setOpacity(scene.detail, 0);
  setOpacity(scene.result, 0);

  scene.writer = node => {
    const w = writable(node);
    scene._writers.push(w);
    return w;
  };
  scene.registerReset = fn => { scene._resets.push(fn); };
  scene.reset = () => {
    for (const w of scene._writers) w.reset();
    for (const fn of scene._resets) fn();
    setOpacity(scene.subtitle, 0);
    setOpacity(scene.status, 0);
    setOpacity(scene.detail, 0);
    setOpacity(scene.result, 0);
    scene.status.textContent = "";
    scene.detail.textContent = "";
    scene.result.textContent = "";
    if (scene.emptyLabel) setOpacity(scene.emptyLabel, 0);
    if (scene.resultRule) scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen || 0));
  };
  return scene;
}

function treeAddTree(scene, root, opts) {
  const { el, txt, C, setOpacity, setScaleAt } = scene.ctx;
  const layout = treeLayout(root, opts);
  const r = layout.r;
  const font = opts.font || Math.max(12, Math.min(22, r * 0.82));
  const edgeList = [];
  const nodeList = [];
  const byModel = new Map();
  const edgeByChild = new Map();

  for (const n of layout.nodes) {
    if (!n.parent) continue;
    const p = n.parent;
    const line = el("line", {
      x1: p.x, y1: p.y + r - 1, x2: n.x, y2: n.y - r + 1,
      stroke: C.greyDark, "stroke-width": 2.4,
    }, scene.layers.arcs);
    setOpacity(line, 0);
    const edge = { line, parent: p, child: n };
    edgeList.push(edge);
    edgeByChild.set(n, edge);
  }

  for (const n of layout.nodes) {
    const g = el("g", { transform: "translate(" + n.x + " " + n.y + ")" }, scene.layers.chips);
    const enter = el("g", {}, g);
    const scale = el("g", {}, enter);
    const circle = el("circle", {
      cx: 0, cy: 0, r: r, fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2.2,
    }, scale);
    const value = txt(String(n.val), {
      x: 0, y: 1, "text-anchor": "middle", "dominant-baseline": "central",
      "font-size": font, fill: C.white,
    }, scale);
    const ring = el("circle", {
      cx: 0, cy: 0, r: r + 4, fill: "none", stroke: C.gold, "stroke-width": 3.4,
    }, scale);
    const badgeG = el("g", { transform: "translate(0 " + (r + 16) + ")" }, scale);
    const badgeBg = el("rect", {
      x: -20, y: -9, width: 40, height: 18, rx: 8,
      fill: "#0b111b", stroke: C.gold, "stroke-width": 1.4,
    }, badgeG);
    const badge = txt("", {
      x: 0, y: 4, "text-anchor": "middle", "font-size": opts.badgeFont || 11,
      fill: C.gold,
    }, badgeG);
    setOpacity(enter, 0);
    setOpacity(ring, 0);
    setOpacity(badgeG, 0);
    const node = {
      model: n, g, enter, scale, circle, value, ring, badgeG, badgeBg, badge,
      x: n.x, y: n.y, r,
    };
    nodeList.push(node);
    byModel.set(n, node);
  }

  scene.registerReset(() => {
    for (const node of nodeList) {
      setOpacity(node.enter, 0);
      setScaleAt(node.scale, 0, 0, 1);
      setOpacity(node.ring, 0);
      setOpacity(node.badgeG, 0);
      node.value.setAttribute("fill", C.white);
      node.badge.textContent = "";
      node.badgeBg.setAttribute("width", "0");
    }
    for (const edge of edgeList) {
      setOpacity(edge.line, 0);
      edge.line.setAttribute("stroke", C.greyDark);
      edge.line.setAttribute("stroke-width", "2.4");
    }
  });

  return { root, nodes: nodeList, edges: edgeList, byModel, edgeByChild, layout, r };
}

function treeAddChips(scene, values, opts) {
  const { el, txt, C, clamp, setOpacity, setScaleAt } = scene.ctx;
  const chips = [];
  const n = values.length;
  const w = opts.w || 62;
  const h = opts.h || 50;
  const gap = opts.gap == null ? 8 : opts.gap;
  const total = n * w + Math.max(0, n - 1) * gap;
  const startX = opts.x + (opts.wTotal || opts.total || total) / 2 - total / 2;
  const font = opts.font || clamp(w * 0.34, 13, 22);
  for (let i = 0; i < n; i++) {
    const x = startX + i * (w + gap);
    const g = el("g", { transform: "translate(" + x + " " + opts.y + ")" }, scene.layers.chips);
    const enter = el("g", {}, g);
    const scale = el("g", {}, enter);
    el("rect", {
      x: 0, y: 0, width: w, height: h, rx: 9,
      fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.8,
    }, scale);
    const text = txt(String(values[i]), {
      x: w / 2, y: h / 2 + 1, "text-anchor": "middle", "dominant-baseline": "central",
      "font-size": font, fill: C.white,
    }, scale);
    const ring = el("rect", {
      x: -2, y: -2, width: w + 4, height: h + 4, rx: 10, fill: "none",
      stroke: C.gold, "stroke-width": 2.6,
    }, scale);
    const idx = txt(String(i), {
      x: w / 2, y: -10, "text-anchor": "middle", "font-size": 11, fill: C.grey,
    }, enter);
    setOpacity(enter, 0);
    setOpacity(ring, 0);
    const chip = { i, value: values[i], g, enter, scale, text, ring, idx, x, cx: x + w / 2, w, h };
    chips.push(chip);
  }
  scene.registerReset(() => {
    for (const chip of chips) {
      setOpacity(chip.enter, 0);
      setScaleAt(chip.scale, 0, 0, 1);
      setOpacity(chip.ring, 0);
      chip.text.setAttribute("fill", C.white);
    }
  });
  return chips;
}

function treeAddPanel(scene, opts) {
  const { el, txt, C, setOpacity } = scene.ctx;
  const g = el("g", { transform: "translate(" + opts.x + " " + opts.y + ")" }, scene.layers.text);
  const rect = el("rect", {
    x: 0, y: 0, width: opts.w, height: opts.h, rx: 12,
    fill: "#0b111b", stroke: C.greyDark, "stroke-width": 1.6,
  }, g);
  const title = txt(opts.title || "", {
    x: 18, y: 27, "font-size": 15, fill: C.grey,
  }, g);
  const rows = [];
  const maxRows = opts.rows || 6;
  for (let i = 0; i < maxRows; i++) {
    rows.push(txt("", {
      x: 18, y: 56 + i * (opts.rowGap || 28), "font-size": opts.rowFont || 16,
      fill: C.white,
    }, g));
  }
  setOpacity(rect, 0);
  setOpacity(title, 0);
  for (const row of rows) setOpacity(row, 0);
  scene.registerReset(() => {
    setOpacity(rect, 0);
    setOpacity(title, 0);
    for (const row of rows) { setOpacity(row, 0); row.textContent = ""; }
  });
  return { g, rect, title, rows };
}

function treeStatus(scene, tl, text, color) {
  const C = scene.ctx.C;
  tl.add(0.01, () => {
    scene.status.textContent = text;
    scene.status.setAttribute("fill", color || C.gold);
    scene.ctx.setOpacity(scene.status, 1);
  });
  tl.log(text, color || C.gold);
}

function treeDetail(scene, tl, text) {
  tl.add(0.01, () => {
    scene.detail.textContent = text;
    scene.ctx.setOpacity(scene.detail, 1);
  });
}

function treeBadge(scene, tl, node, text, color) {
  const C = scene.ctx.C;
  tl.add(0.01, () => {
    node.badge.textContent = text;
    node.badge.setAttribute("fill", color || C.gold);
    node.badgeBg.setAttribute("stroke", color || C.gold);
    const w = Math.max(26, text.length * 7 + 10);
    node.badgeBg.setAttribute("width", String(w));
    node.badgeBg.setAttribute("x", String(-w / 2));
    scene.ctx.setOpacity(node.badgeG, 1);
  });
}

function treeRing(scene, tl, node, color, opacity) {
  const C = scene.ctx.C;
  tl.add(0.01, () => {
    node.ring.setAttribute("stroke", color || C.blue);
    scene.ctx.setOpacity(node.ring, opacity == null ? 1 : opacity);
  });
}

function treeEdgeStyle(scene, tl, edge, color, width) {
  const C = scene.ctx.C;
  tl.add(0.01, () => {
    edge.line.setAttribute("stroke", color || C.greyDark);
    edge.line.setAttribute("stroke-width", String(width || 2.4));
  });
}

function treeRevealNode(scene, tl, node, dur) {
  const { ease, setOpacity } = scene.ctx;
  tl.add(dur || 0.18, u => {
    setOpacity(node.enter, Math.min(1, u * 2));
    node.scale.setAttribute("transform", "scale(" + (0.72 + 0.28 * u) + ")");
  }, ease.outCubic);
}

function treeRevealEdge(scene, tl, edge, dur) {
  tl.add(dur || 0.12, u => scene.ctx.setOpacity(edge.line, u), scene.ctx.ease.outCubic);
}

function treeRevealTree(scene, tl, tree, nodeDur, edgeDur) {
  for (const edge of tree.edges) treeRevealEdge(scene, tl, edge, edgeDur || 0.08);
  for (const node of tree.nodes) treeRevealNode(scene, tl, node, nodeDur || 0.15);
  tl.wait(0.15);
}

function treeSetResult(scene, tl, text, color) {
  const C = scene.ctx.C;
  const { setOpacity, ease } = scene.ctx;
  tl.add(0.01, () => {
    scene.result.textContent = text;
    scene.result.setAttribute("fill", color || C.green);
  });
  tl.add(0.4, u => setOpacity(scene.result, u), ease.outCubic);
  tl.log(text, color || C.green);
}

function treeChipReveal(scene, tl, chip, dur) {
  const { ease, setOpacity } = scene.ctx;
  tl.add(dur || 0.14, u => {
    setOpacity(chip.enter, Math.min(1, u * 2));
    chip.scale.setAttribute("transform", "scale(" + (0.76 + 0.24 * u) + ")");
  }, ease.outCubic);
}

function treeChipStyle(scene, tl, chip, fill, ringColor) {
  const C = scene.ctx.C;
  tl.add(0.01, () => {
    chip.text.setAttribute("fill", fill || C.white);
    if (ringColor) {
      chip.ring.setAttribute("stroke", ringColor);
      scene.ctx.setOpacity(chip.ring, 1);
    } else {
      scene.ctx.setOpacity(chip.ring, 0);
    }
  });
}

function treePanelShow(scene, tl, panel, dur) {
  const { ease, setOpacity } = scene.ctx;
  tl.add(dur || 0.3, u => {
    setOpacity(panel.rect, u);
    setOpacity(panel.title, u);
  }, ease.outCubic);
}

function treePanelRow(scene, tl, panel, index, text, color) {
  const C = scene.ctx.C;
  tl.add(0.01, () => {
    const row = panel.rows[index];
    row.textContent = text;
    row.setAttribute("fill", color || C.white);
    scene.ctx.setOpacity(row, 1);
  });
}

const SCENE = {
  meta: {
    title: "Binary Tree Level Order Traversal",
    subtitle: "BFS with a queue · process one level at a time · O(n)",
    inputs: [
      { id: "root", label: "root", type: "text", default: "3, 9, 20, null, null, 15, 7", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "current node" },
      { color: "#F0AC5F", text: "queued child" },
      { color: "#83C167", text: "completed level" },
    ],
  },

  code: [
    "def level_order(root: List[Optional[int]]) -> List[List[int]]:",
    "    node = build_tree(root)",
    "    levels: List[List[int]] = []",
    "    if node is None:",
    "        return levels",
    "    queue = deque([node])",
    "    while queue:",
    "        level: List[int] = []",
    "        for _ in range(len(queue)):     # width of the current level",
    "            current = queue.popleft()",
    "            level.append(current.val)",
    "            if current.left is not None:",
    "                queue.append(current.left)",
    "            if current.right is not None:",
    "                queue.append(current.right)",
    "        levels.append(level)",
    "    return levels",
  ],

  read(values) {
    const vals = treeParse(values.root);
    if (!vals) return null;
    return { values: vals };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || !Array.isArray(args[0])) return null;
    const vals = args[0].map(v => v === null ? null : Number(v));
    if (vals.length > 31 || !vals.every(v => v === null || Number.isInteger(v))) return null;
    return { root: vals.length ? vals.map(v => v === null ? "null" : String(v)).join(", ") : "" };
  },

  buildScene(params, ctx) {
    const { txt, C, setOpacity } = ctx;
    const root = treeBuild(params.values);
    const scene = treeSceneBase(ctx, {
      title: "Binary Tree Level Order Traversal",
      subtitle: "a FIFO queue keeps the next level in left-to-right order",
      statusY: 616, detailY: 648, resultY: 684,
    });
    scene.root = root;
    scene.tree = treeAddTree(scene, root, {
      x: 50, y: 140, w: 780, h: 350, r: 25, maxGapX: 92, maxGapY: 96,
    });
    scene.panel = treeAddPanel(scene, {
      x: 870, y: 150, w: 350, h: 300, title: "levels", rows: 6, rowGap: 36,
    });
    scene.queueTitle = txt("queue (front → back)", {
      x: 64, y: 548, "font-size": 14, fill: C.grey,
    }, scene.layers.text);
    scene.queueText = txt("queue = []", {
      x: 64, y: 574, "font-size": 17, fill: C.blue,
    }, scene.layers.text);
    setOpacity(scene.queueTitle, 0);
    setOpacity(scene.queueText, 0);
    scene.registerReset(() => {
      setOpacity(scene.queueTitle, 0);
      setOpacity(scene.queueText, 0);
      scene.queueText.textContent = "queue = []";
    });
    if (!root) {
      scene.emptyLabel = txt("root = None", {
        x: 440, y: 320, "text-anchor": "middle", "font-size": 26, fill: C.grey,
      }, scene.layers.text);
      setOpacity(scene.emptyLabel, 0);
    }
    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity } = ctx;
    const { C } = ctx;
    scene.reset();

    const setQueue = arr => {
      tl.add(0.01, () => {
        scene.queueText.textContent = "queue = [" + arr.map(n => n.val).join(", ") + "]";
      });
    };

    tl.line(1);
    tl.add(0.6, scene.writer(scene.title), ease.outCubic);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), ease.outCubic);
    treeStatus(scene, tl, "seed the queue with the root", C.blue);
    treePanelShow(scene, tl, scene.panel);
    tl.add(0.3, u => {
      setOpacity(scene.queueTitle, u);
      setOpacity(scene.queueText, u);
    }, ease.outCubic);

    if (!scene.root) {
      tl.line(2);
      tl.line(3);
      tl.line(4);
      treeStatus(scene, tl, "root is None   →   no levels", C.grey);
      tl.line(5);
      tl.add(0.35, u => setOpacity(scene.emptyLabel, u), ease.outCubic);
      treePanelRow(scene, tl, scene.panel, 0, "[]", C.grey);
      tl.line(17);
      treeSetResult(scene, tl, "levels = []", C.green);
      tl.wait(0.6);
      return tl.finish();
    }

    treeRevealTree(scene, tl, scene.tree);
    tl.line(2);
    tl.line(3);
    tl.line(6);
    tl.add(0.01, () => { scene.queueText.textContent = "queue = [" + scene.root.val + "]"; });
    treeStatus(scene, tl, "queue = [" + scene.root.val + "]", C.blue);

    const levels = [];
    let q = [scene.root];
    while (q.length) {
      const size = q.length;
      const level = [];
      const frames = [];
      for (let i = 0; i < size; i++) {
        const current = q.shift();
        level.push(current);
        if (current.left) q.push(current.left);
        if (current.right) q.push(current.right);
        frames.push({ current, queue: q.slice() });
      }
      levels.push({ nodes: level, frames });
    }

    for (let li = 0; li < levels.length; li++) {
      const level = levels[li];
      tl.line(7);
      tl.line(8);
      tl.line(9);
      treeStatus(scene, tl, "process level " + li + " with " + level.nodes.length + " node(s)", C.gold);
      const values = [];
      for (const frame of level.frames) {
        const vis = scene.tree.byModel.get(frame.current);
        tl.line(10);
        treeRing(scene, tl, vis, C.blue, 1);
        treeStatus(scene, tl, "popleft " + frame.current.val, C.blue);
        tl.line(11);
        values.push(frame.current.val);
        treeBadge(scene, tl, vis, "L" + li, C.gold);
        tl.add(0.01, () => vis.value.setAttribute("fill", C.gold));
        setQueue(frame.queue);
        if (frame.current.left) {
          tl.line(12);
          const edge = scene.tree.edgeByChild.get(frame.current.left);
          if (edge) treeEdgeStyle(scene, tl, edge, C.blue, 3.2);
          tl.line(13);
          treeStatus(scene, tl, "enqueue left child " + frame.current.left.val, C.blue);
        } else {
          tl.line(12);
          treeDetail(scene, tl, "left child is None");
        }
        if (frame.current.right) {
          tl.line(14);
          const edge = scene.tree.edgeByChild.get(frame.current.right);
          if (edge) treeEdgeStyle(scene, tl, edge, C.blue, 3.2);
          tl.line(15);
          treeStatus(scene, tl, "enqueue right child " + frame.current.right.val, C.blue);
        } else {
          tl.line(14);
          treeDetail(scene, tl, "right child is None");
        }
        treeRing(scene, tl, vis, C.gold, 0);
        tl.wait(0.08);
      }
      tl.line(16);
      treePanelRow(scene, tl, scene.panel, li, "L" + li + ": [" + values.join(", ") + "]", C.green);
      treeStatus(scene, tl, "level " + li + " complete   →   [" + values.join(", ") + "]", C.green);
      tl.wait(0.15);
    }

    tl.line(17);
    const text = "[" + levels.map(l => "[" + l.nodes.map(n => n.val).join(", ") + "]").join(", ") + "]";
    treeStatus(scene, tl, "queue is empty   →   all levels collected", C.green);
    treeSetResult(scene, tl, "levels = " + text, C.green);
    tl.wait(0.7);
    return tl.finish();
  },
};
