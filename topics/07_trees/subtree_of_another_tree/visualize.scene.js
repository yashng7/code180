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
    title: "Subtree of Another Tree",
    subtitle: "scan every node in root · test exact equality against sub_root · O(n·m)",
    inputs: [
      { id: "root", label: "root", type: "text", default: "3, 4, 5, 1, 2", width: "wide" },
      { id: "sub", label: "sub_root", type: "text", default: "4, 1, 2", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "candidate in root" },
      { color: "#B58CD6", text: "sub_root" },
      { color: "#83C167", text: "exact match" },
      { color: "#FC6255", text: "mismatch" },
    ],
  },

  code: [
    "def is_subtree(root: List[Optional[int]], sub_root: List[Optional[int]]) -> bool:",
    "    def same(a, b):",
    "        if a is None and b is None:",
    "            return True",
    "        if a is None or b is None:",
    "            return False",
    "        return (",
    "            a.val == b.val",
    "            and same(a.left, b.left)",
    "            and same(a.right, b.right)",
    "        )",
    "    target = build_tree(sub_root)",
    "    def dfs(node):",
    "        if node is None:",
    "            return False",
    "        if same(node, target):",
    "            return True",
    "        return dfs(node.left) or dfs(node.right)",
    "    if target is None:          # an empty subtree is trivially contained",
    "        return True",
    "    return dfs(build_tree(root))",
  ],

  read(values) {
    const root = treeParse(values.root);
    const sub = treeParse(values.sub);
    if (!root || !sub) return null;
    return { root, sub };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || !Array.isArray(args[0]) || !Array.isArray(args[1])) return null;
    const root = args[0].map(v => v === null ? null : Number(v));
    const sub = args[1].map(v => v === null ? null : Number(v));
    if (root.length > 31 || sub.length > 31) return null;
    if (!root.every(v => v === null || Number.isInteger(v))) return null;
    if (!sub.every(v => v === null || Number.isInteger(v))) return null;
    const fmt = a => a.length ? a.map(v => v === null ? "null" : String(v)).join(", ") : "";
    return { root: fmt(root), sub: fmt(sub) };
  },

  buildScene(params, ctx) {
    const { txt, C, setOpacity } = ctx;
    const root = treeBuild(params.root);
    const target = treeBuild(params.sub);
    const scene = treeSceneBase(ctx, {
      title: "Subtree of Another Tree",
      subtitle: "at each candidate node, compare the whole candidate subtree with sub_root",
      statusY: 600, detailY: 632, resultY: 674,
    });
    scene.root = root;
    scene.target = target;
    scene.rootTree = treeAddTree(scene, root, {
      x: 20, y: 150, w: 700, h: 350, r: 22, maxGapX: 90, maxGapY: 92,
    });
    scene.subTree = treeAddTree(scene, target, {
      x: 800, y: 170, w: 440, h: 320, r: 20, maxGapX: 78, maxGapY: 86,
    });
    txt("root", { x: 370, y: 126, "text-anchor": "middle", "font-size": 20, fill: C.blue }, scene.layers.text);
    txt("sub_root", { x: 1020, y: 126, "text-anchor": "middle", "font-size": 20, fill: C.purple }, scene.layers.text);
    if (!root) {
      scene.rootEmpty = txt("root = None", {
        x: 370, y: 320, "text-anchor": "middle", "font-size": 24, fill: C.grey,
      }, scene.layers.text);
      setOpacity(scene.rootEmpty, 0);
    }
    if (!target) {
      scene.subEmpty = txt("sub_root = None", {
        x: 1020, y: 320, "text-anchor": "middle", "font-size": 24, fill: C.grey,
      }, scene.layers.text);
      setOpacity(scene.subEmpty, 0);
    }
    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity } = ctx;
    const { C } = ctx;
    scene.reset();

    tl.line(1);
    tl.add(0.6, scene.writer(scene.title), ease.outCubic);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), ease.outCubic);
    treeStatus(scene, tl, "first build sub_root, then scan root for a matching subtree", C.blue);

    treeRevealTree(scene, tl, scene.rootTree);
    treeRevealTree(scene, tl, scene.subTree);
    if (scene.rootEmpty) tl.add(0.3, u => setOpacity(scene.rootEmpty, u), ease.outCubic);
    if (scene.subEmpty) tl.add(0.3, u => setOpacity(scene.subEmpty, u), ease.outCubic);

    tl.line(2);
    tl.line(12);
    tl.line(13);

    if (!scene.target) {
      tl.line(19);
      tl.line(20);
      treeStatus(scene, tl, "sub_root is None   →   an empty tree is a subtree", C.green);
      treeSetResult(scene, tl, "is_subtree = true", C.green);
      tl.wait(0.6);
      return tl.finish();
    }

    if (!scene.root) {
      tl.line(21);
      tl.line(14);
      tl.line(15);
      treeStatus(scene, tl, "root is None   →   no candidate can match", C.red);
      treeSetResult(scene, tl, "is_subtree = false", C.red);
      tl.wait(0.6);
      return tl.finish();
    }

    const attempts = [];
    let found = false;
    function compare(a, b, frames) {
      if (!a && !b) {
        frames.push({ kind: "both-null", a, b });
        return true;
      }
      if (!a || !b) {
        frames.push({ kind: "one-null", a, b });
        return false;
      }
      const equal = a.val === b.val;
      frames.push({ kind: "values", a, b, equal });
      if (!equal) return false;
      return compare(a.left, b.left, frames) && compare(a.right, b.right, frames);
    }
    const candidates = treePreorder(scene.root);
    for (const candidate of candidates) {
      const frames = [];
      const match = compare(candidate, scene.target, frames);
      attempts.push({ candidate, frames, match });
      if (match) { found = true; break; }
    }

    function clearAttempt() {
      for (const vis of scene.rootTree.nodes) {
        treeRing(scene, tl, vis, C.blue, 0);
        tl.add(0.01, () => {
          vis.value.setAttribute("fill", C.white);
          setOpacity(vis.badgeG, 0);
        });
      }
      for (const vis of scene.subTree.nodes) {
        treeRing(scene, tl, vis, C.purple, 0);
        tl.add(0.01, () => {
          vis.value.setAttribute("fill", C.white);
          setOpacity(vis.badgeG, 0);
        });
      }
    }

    for (let ai = 0; ai < attempts.length; ai++) {
      const attempt = attempts[ai];
      clearAttempt();
      const cand = scene.rootTree.byModel.get(attempt.candidate);
      const targetRoot = scene.subTree.byModel.get(scene.target);
      tl.line(13);
      treeRing(scene, tl, cand, C.blue, 1);
      if (targetRoot) treeRing(scene, tl, targetRoot, C.purple, 1);
      treeStatus(scene, tl, "try candidate " + attempt.candidate.val, C.blue);
      tl.line(16);

      let failed = false;
      for (const frame of attempt.frames) {
        tl.line(2);
        if (frame.kind === "both-null") {
          tl.line(3);
          tl.line(4);
          treeDetail(scene, tl, "both candidate and sub_root are None   →   match");
          continue;
        }
        const av = frame.a ? scene.rootTree.byModel.get(frame.a) : null;
        const bv = frame.b ? scene.subTree.byModel.get(frame.b) : null;
        if (frame.kind === "one-null") {
          tl.line(5);
          tl.line(6);
          const vis = av || bv;
          if (vis) {
            treeRing(scene, tl, vis, C.red, 1);
            treeBadge(scene, tl, vis, "!", C.red);
            tl.add(0.01, () => vis.value.setAttribute("fill", C.red));
          }
          treeStatus(scene, tl, "one side is None   →   this candidate fails", C.red);
          failed = true;
          break;
        }
        tl.line(7);
        tl.line(8);
        treeRing(scene, tl, av, C.blue, 1);
        treeRing(scene, tl, bv, C.purple, 1);
        treeStatus(scene, tl, "compare " + frame.a.val + " with " + frame.b.val, C.blue);
        if (!frame.equal) {
          treeBadge(scene, tl, av, "!", C.red);
          treeBadge(scene, tl, bv, "!", C.red);
          tl.add(0.01, () => {
            av.value.setAttribute("fill", C.red);
            bv.value.setAttribute("fill", C.red);
          });
          treeStatus(scene, tl, frame.a.val + " != " + frame.b.val + "   →   candidate fails", C.red);
          failed = true;
          break;
        }
        treeBadge(scene, tl, av, "=", C.green);
        treeBadge(scene, tl, bv, "=", C.green);
        tl.add(0.01, () => {
          av.value.setAttribute("fill", C.green);
          bv.value.setAttribute("fill", C.green);
        });
        treeRing(scene, tl, av, C.green, 0);
        treeRing(scene, tl, bv, C.green, 0);
        treeDetail(scene, tl, "values match   →   compare children");
        tl.line(9);
        tl.line(10);
        tl.line(11);
        tl.wait(0.1);
      }

      if (attempt.match) {
        tl.line(16);
        tl.line(17);
        treeRing(scene, tl, cand, C.green, 1);
        treeBadge(scene, tl, cand, "match", C.green);
        treeStatus(scene, tl, "candidate " + attempt.candidate.val + " matches sub_root   →   true", C.green);
        treeSetResult(scene, tl, "is_subtree = true", C.green);
        tl.wait(0.5);
        break;
      }
      if (failed) {
        tl.line(18);
        treeStatus(scene, tl, "try the next candidate", C.grey);
        tl.wait(0.12);
      }
    }

    if (!found) {
      tl.line(18);
      tl.line(21);
      treeStatus(scene, tl, "no candidate matched sub_root   →   false", C.red);
      treeSetResult(scene, tl, "is_subtree = false", C.red);
    }
    tl.wait(0.7);
    return tl.finish();
  },
};
