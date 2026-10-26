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
    title: "Serialize and Deserialize Binary Tree",
    subtitle: "preorder with N sentinels · rebuild the same tree from the token stream · O(n)",
    inputs: [
      { id: "root", label: "root", type: "text", default: "1, 2, 3, null, null, 4, 5", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "serialize (preorder)" },
      { color: "#F0AC5F", text: "token stream" },
      { color: "#83C167", text: "deserialized tree" },
      { color: "#6b7684", text: "N sentinel" },
    ],
  },

  code: [
    "def _serialize(node) -> str:",
    "    if node is None:",
    "        return \"N\"",
    "    return f\"{node.val},{_serialize(node.left)},{_serialize(node.right)}\"",
    "def _deserialize(data: str):",
    "    tokens = iter(data.split(\",\"))",
    "    def helper():",
    "        token = next(tokens)",
    "        if token == \"N\":",
    "            return None",
    "        node = TreeNode(int(token))",
    "        node.left = helper()",
    "        node.right = helper()",
    "        return node",
    "    return helper()",
    "def serialize_and_deserialize(",
    "    root: List[Optional[int]]",
    ") -> List[Optional[int]]:",
    "    tree = build_tree(root)",
    "    return tree_to_list(_deserialize(_serialize(tree)))",
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
    const output = treeClone(root);
    if (output) treeSetDepth(output, 0);

    const tokens = [];
    const serEvents = [];
    function serialize(n) {
      if (!n) {
        tokens.push("N");
        serEvents.push({ kind: "null", tokenIndex: tokens.length - 1 });
        return;
      }
      tokens.push(String(n.val));
      serEvents.push({ kind: "value", node: n, tokenIndex: tokens.length - 1 });
      serialize(n.left);
      serialize(n.right);
    }
    serialize(root);

    const preorder = treePreorder(output);
    const tokenNode = new Map();
    let pi = 0;
    tokens.forEach((tok, i) => {
      if (tok !== "N") tokenNode.set(i, preorder[pi++]);
    });

    const scene = treeSceneBase(ctx, {
      title: "Serialize and Deserialize Binary Tree",
      subtitle: "serialize preorder, using N for every empty child, then read the tokens back",
      statusY: 620, detailY: 652, resultY: 688,
    });
    scene.root = root;
    scene.output = output;
    scene.tokens = tokens;
    scene.serEvents = serEvents;
    scene.tokenNode = tokenNode;
    scene.inTree = treeAddTree(scene, root, {
      x: 20, y: 140, w: 520, h: 320, r: 20, maxGapX: 80, maxGapY: 84,
    });
    scene.outTree = treeAddTree(scene, output, {
      x: 700, y: 140, w: 520, h: 320, r: 20, maxGapX: 80, maxGapY: 84,
    });
    txt("input tree", { x: 280, y: 124, "text-anchor": "middle", "font-size": 18, fill: C.blue }, scene.layers.text);
    txt("round-trip tree", { x: 960, y: 124, "text-anchor": "middle", "font-size": 18, fill: C.green }, scene.layers.text);
    txt("tokens", { x: 64, y: 512, "font-size": 15, fill: C.gold }, scene.layers.text);
    scene.chips = treeAddChips(scene, tokens, {
      x: 64, y: 540, w: 54, h: 38, gap: 6, total: 1150, font: 16,
    });
    if (!root) {
      scene.inEmpty = txt("root = None", {
        x: 280, y: 300, "text-anchor": "middle", "font-size": 24, fill: C.grey,
      }, scene.layers.text);
      scene.outEmpty = txt("result = []", {
        x: 960, y: 300, "text-anchor": "middle", "font-size": 24, fill: C.grey,
      }, scene.layers.text);
      setOpacity(scene.inEmpty, 0);
      setOpacity(scene.outEmpty, 0);
    }
    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity } = ctx;
    const { C } = ctx;
    scene.reset();

    const showChip = (index, color) => {
      const chip = scene.chips[index];
      if (!chip) return;
      treeChipReveal(scene, tl, chip, 0.12);
      treeChipStyle(scene, tl, chip, color, color);
    };

    tl.line(1);
    tl.add(0.6, scene.writer(scene.title), ease.outCubic);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), ease.outCubic);
    treeStatus(scene, tl, "serialize the input tree in preorder", C.blue);

    treeRevealTree(scene, tl, scene.inTree);
    if (scene.inEmpty) tl.add(0.3, u => setOpacity(scene.inEmpty, u), ease.outCubic);
    if (scene.outEmpty) tl.add(0.3, u => setOpacity(scene.outEmpty, u), ease.outCubic);

    for (const event of scene.serEvents) {
      tl.line(1);
      if (event.kind === "null") {
        tl.line(2);
        tl.line(3);
        treeStatus(scene, tl, "empty child   →   append N", C.grey);
        showChip(event.tokenIndex, C.grey);
      } else {
        const vis = scene.inTree.byModel.get(event.node);
        tl.line(4);
        treeRing(scene, tl, vis, C.blue, 1);
        treeBadge(scene, tl, vis, "visit", C.blue);
        treeStatus(scene, tl, "append " + event.node.val + ", then serialize its children", C.blue);
        showChip(event.tokenIndex, C.blue);
        treeRing(scene, tl, vis, C.blue, 0);
      }
      tl.wait(0.08);
    }

    tl.line(5);
    tl.line(6);
    tl.line(7);
    treeStatus(scene, tl, "now read the token stream from left to right", C.gold);
    for (const chip of scene.chips) treeChipStyle(scene, tl, chip, C.gold, C.gold);

    for (let i = 0; i < scene.tokens.length; i++) {
      const token = scene.tokens[i];
      const chip = scene.chips[i];
      tl.line(8);
      if (chip) treeChipStyle(scene, tl, chip, C.white, C.gold);
      tl.line(9);
      if (token === "N") {
        tl.line(10);
        treeStatus(scene, tl, "token N   →   None", C.grey);
      } else {
        tl.line(11);
        const model = scene.tokenNode.get(i);
        const vis = model ? scene.outTree.byModel.get(model) : null;
        if (vis) {
          treeRevealNode(scene, tl, vis, 0.18);
          treeBadge(scene, tl, vis, "node", C.green);
          tl.add(0.01, () => vis.value.setAttribute("fill", C.green));
          if (model.parent) {
            const edge = scene.outTree.edgeByChild.get(model);
            if (edge) treeRevealEdge(scene, tl, edge, 0.12);
          }
        }
        treeStatus(scene, tl, "token " + token + "   →   create node " + token, C.green);
        tl.line(12);
        tl.line(13);
        tl.line(14);
      }
      tl.wait(0.08);
    }

    tl.line(15);
    tl.line(16);
    tl.line(17);
    tl.line(18);
    tl.line(19);
    tl.line(20);
    const list = treeToList(scene.output);
    treeStatus(scene, tl, "the token stream is exhausted   →   the tree is rebuilt", C.green);
    treeSetResult(scene, tl, "tree = [" + list.map(v => v === null ? "null" : v).join(", ") + "]", C.green);
    tl.wait(0.7);
    return tl.finish();
  },
};
