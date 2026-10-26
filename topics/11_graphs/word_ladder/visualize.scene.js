/* Shared Topic 11 scene kit.
 *
 * These helpers are inlined into every Topic 11 scene so each generated page
 * stays completely self-contained.  They only cover presentation scaffolding;
 * every algorithm, simulation and timeline remains in the problem scene.
 */
"use strict";

function kClamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function kHeader(ctx, scene, title, subtitle) {
  const { txt, C, setOpacity, STAGE_W } = ctx;
  scene.title = txt(title, {
    x: 64, y: 62, "font-size": 40, fill: C.white, "letter-spacing": 0.4,
  }, scene.layers.text);
  scene.titleWriter = ctx.makeWritable()(scene.title);
  scene.writers.push(scene.titleWriter);
  scene.subtitle = txt(subtitle, {
    x: 64, y: 98, "font-size": 17, fill: C.grey,
  }, scene.layers.text);
  setOpacity(scene.subtitle, 0);
  scene.hideNodes.push(scene.subtitle);
}

function kBase(ctx, scene) {
  scene.ctx = ctx;
  scene.layers = {
    arcs: ctx.layer("arcs"),
    chips: ctx.layer("chips"),
    text: ctx.layer("text"),
    result: ctx.layer("result"),
  };
  scene.hideNodes = [];
  scene.introNodes = [];
  scene.writers = [];
  scene.resetters = [];
  scene.reset = () => {
    for (const w of scene.writers) w.reset();
    for (const node of scene.hideNodes) ctx.setOpacity(node, 0);
    for (const fn of scene.resetters) fn();
  };
}

function kPanel(ctx, scene, x, y, w, h, title, color, opts) {
  const { el, txt, C, setOpacity } = ctx;
  const o = opts || {};
  const g = el("g", {}, scene.layers.chips);
  const rect = el("rect", {
    x, y, width: w, height: h, rx: 14,
    fill: o.fill || "#0f141c",
    stroke: o.stroke || C.greyDark,
    "stroke-width": o.strokeWidth || 1.5,
  }, g);
  setOpacity(g, 0);
  scene.hideNodes.push(g);
  scene.introNodes.push(g);
  let titleNode = null;
  if (title) {
    titleNode = txt(title, {
      x: x + 20, y: y + 30, "font-size": 18, fill: color || C.blue,
    }, scene.layers.text);
    setOpacity(titleNode, 0);
    scene.hideNodes.push(titleNode);
    scene.introNodes.push(titleNode);
  }
  return { g, rect, title: titleNode, x, y, w, h };
}

function kGrid(ctx, scene, grid, opts) {
  const { el, txt, C, setOpacity } = ctx;
  const o = opts || {};
  const rows = grid.length;
  const cols = grid[0].length;
  const maxCell = o.maxCell || 58;
  const cell = Math.min(maxCell, (o.w - 34) / cols, (o.h - 54) / rows);
  const bw = cell * cols;
  const bh = cell * rows;
  const x0 = o.x + (o.w - bw) / 2;
  const y0 = o.y + (o.h - bh) / 2 + (o.label ? 8 : 0);
  const board = el("g", {}, scene.layers.chips);
  setOpacity(board, 0);
  scene.hideNodes.push(board);
  scene.introNodes.push(board);
  const cells = [];
  const font = kClamp(cell * 0.36, 9, 24);
  const gap = Math.min(3, Math.max(1.5, cell * 0.04));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = x0 + c * cell;
      const y = y0 + r * cell;
      const g = el("g", {}, board);
      const rect = el("rect", {
        x: x + gap / 2, y: y + gap / 2,
        width: cell - gap, height: cell - gap, rx: Math.min(8, cell * 0.18),
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.6,
      }, g);
      const t = txt("", {
        x: x + cell / 2, y: y + cell / 2 + 1,
        "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": font, fill: C.white,
      }, g);
      cells.push({ r, c, x, y, cx: x + cell / 2, cy: y + cell / 2, g, rect, t });
    }
  }
  if (o.label) {
    const labels = el("g", {}, scene.layers.text);
    setOpacity(labels, 0);
    scene.hideNodes.push(labels);
    scene.introNodes.push(labels);
    for (let c = 0; c < cols; c++) {
      const t = txt(String(c), {
        x: x0 + c * cell + cell / 2, y: y0 - 8,
        "text-anchor": "middle", "font-size": 10, fill: C.grey,
      }, labels);
      setOpacity(t, 0.8);
    }
    for (let r = 0; r < rows; r++) {
      const t = txt(String(r), {
        x: x0 - 10, y: y0 + r * cell + cell / 2 + 1,
        "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": 10, fill: C.grey,
      }, labels);
      setOpacity(t, 0.8);
    }
  }
  const cursor = el("rect", {
    x: 0, y: 0, width: cell - gap, height: cell - gap,
    rx: Math.min(8, cell * 0.18), fill: "none", stroke: C.gold,
    "stroke-width": 3, filter: "url(#glow-gold)",
  }, board);
  setOpacity(cursor, 0);

  let styleFn = o.style || ((v) => ({
    fill: C.chipFill, stroke: C.greyDark, text: C.white,
  }));
  let displayFn = o.display || ((v) => String(v));

  const applyNow = (snapshot, extra, active) => {
    for (const cell of cells) {
      const value = snapshot ? snapshot[cell.r][cell.c] : grid[cell.r][cell.c];
      const st = styleFn(value, cell.r, cell.c, extra || {}, cell) || {};
      cell.t.textContent = displayFn(value, cell.r, cell.c, extra || {});
      cell.rect.setAttribute("fill", st.fill || C.chipFill);
      cell.rect.setAttribute("stroke", st.stroke || C.greyDark);
      cell.rect.setAttribute("stroke-width", String(st.strokeWidth || 1.6));
      cell.t.setAttribute("fill", st.text || C.white);
      setOpacity(cell.g, st.opacity === undefined ? 1 : st.opacity);
    }
    if (active && active[0] >= 0) {
      const x = x0 + active[1] * cell;
      const y = y0 + active[0] * cell;
      cursor.setAttribute("x", String(x + gap / 2));
      cursor.setAttribute("y", String(y + gap / 2));
      cursor.setAttribute("stroke", (extra && extra.cursorColor) || C.gold);
      setOpacity(cursor, 1);
    } else {
      setOpacity(cursor, 0);
    }
  };

  const apply = (tl, snapshot, extra, active) => {
    tl.add(0.01, () => applyNow(snapshot, extra, active));
  };

  const reset = () => {
    applyNow(grid, {}, null);
    setOpacity(board, 0);
  };
  reset();
  scene.resetters.push(reset);

  return {
    rows, cols, cell, x0, y0, cells, board, cursor,
    apply, applyNow, reset,
    setStyle(fn) { styleFn = fn; },
    setDisplay(fn) { displayFn = fn; },
    cellAt(r, c) { return cells[r * cols + c]; },
  };
}

function kLines(ctx, scene, opts) {
  const { txt, C, setOpacity } = ctx;
  const o = opts || {};
  const nodes = [];
  const max = o.max || 8;
  const lineH = o.lineH || 26;
  const font = o.font || 14;
  for (let i = 0; i < max; i++) {
    const node = txt("", {
      x: o.x, y: o.y + i * lineH,
      "font-size": font, fill: o.color || C.white,
      "font-family": o.mono ? "ui-monospace, monospace" : undefined,
    }, scene.layers.text);
    setOpacity(node, 0);
    nodes.push(node);
  }
  return {
    nodes,
    set(tl, lines, color) {
      tl.add(0.01, () => {
        for (let i = 0; i < nodes.length; i++) {
          const line = lines[i];
          nodes[i].textContent = line === undefined ? "" : String(line);
          nodes[i].setAttribute("fill", color || o.color || C.white);
          setOpacity(nodes[i], line === undefined || line === "" ? 0 : 1);
        }
      });
    },
    reset() {
      for (const n of nodes) { n.textContent = ""; setOpacity(n, 0); }
    },
  };
}

function kGraph(ctx, scene, opts) {
  const { el, txt, C, setOpacity } = ctx;
  const o = opts || {};
  const nodesIn = o.nodes || [];
  const edgesIn = o.edges || [];
  const n = nodesIn.length;
  const r = o.r || kClamp(Math.min(o.w, o.h) / (Math.max(3, Math.sqrt(Math.max(1, n))) * 3.0), 18, 30);
  const graphG = el("g", {}, scene.layers.chips);
  setOpacity(graphG, 0);
  scene.hideNodes.push(graphG);
  scene.introNodes.push(graphG);
  const cx = o.x + o.w / 2;
  const cy = o.y + o.h / 2;
  const rx = Math.max(0, o.w / 2 - r - (o.padX || 18));
  const ry = Math.max(0, o.h / 2 - r - (o.padY || 18));
  const positions = new Map();
  nodesIn.forEach((node, i) => {
    let x, y;
    if (node.x !== undefined) { x = node.x; y = node.y; }
    else if (o.layout === "row") {
      x = o.x + o.w * (i + 0.5) / Math.max(1, n);
      y = cy;
    } else if (o.layout === "column") {
      x = cx;
      y = o.y + o.h * (i + 0.5) / Math.max(1, n);
    } else if (n === 1) {
      x = cx; y = cy;
    } else {
      const a = -Math.PI / 2 + 2 * Math.PI * i / n;
      x = cx + rx * Math.cos(a);
      y = cy + ry * Math.sin(a);
    }
    positions.set(node.id, { x, y });
  });

  const edgeMap = new Map();
  const edgeNodes = [];
  for (const edge of edgesIn) {
    const a = positions.get(edge.u);
    const b = positions.get(edge.v);
    if (!a || !b) continue;
    let x1 = a.x, y1 = a.y, x2 = b.x, y2 = b.y;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    x1 += ux * (r + 2); y1 += uy * (r + 2);
    x2 -= ux * (r + 2); y2 -= uy * (r + 2);
    const line = el("line", {
      x1, y1, x2, y2, stroke: C.greyDark, "stroke-width": 2.2,
    }, scene.layers.arcs);
    setOpacity(line, 0);
    let arrow = null;
    if (edge.directed) {
      const bx = x2 - ux * 9, by = y2 - uy * 9;
      const px = -uy * 5, py = ux * 5;
      arrow = el("polygon", {
        points: `${x2},${y2} ${bx + px},${by + py} ${bx - px},${by - py}`,
        fill: C.greyDark,
      }, scene.layers.arcs);
      setOpacity(arrow, 0);
    }
    const key = edge.u + "|" + edge.v;
    const keyR = edge.v + "|" + edge.u;
    const item = { edge, line, arrow, key, keyR };
    edgeMap.set(key, item);
    if (!edge.directed) edgeMap.set(keyR, item);
    edgeNodes.push(item);
  }

  const nodeMap = new Map();
  const nodeNodes = [];
  const font = o.font || kClamp(r * 0.72, 10, 22);
  for (const node of nodesIn) {
    const p = positions.get(node.id);
    const g = el("g", { transform: `translate(${p.x} ${p.y})` }, graphG);
    const circle = el("circle", {
      cx: 0, cy: 0, r, fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2.2,
    }, g);
    const ring = el("circle", {
      cx: 0, cy: 0, r: r + 4, fill: "none", stroke: C.gold,
      "stroke-width": 2.6, filter: "url(#glow-gold)",
    }, g);
    const label = txt(String(node.label === undefined ? node.id : node.label), {
      x: 0, y: 1, "text-anchor": "middle", "dominant-baseline": "central",
      "font-size": font, fill: C.white,
    }, g);
    let badge = null;
    if (node.badge !== undefined) {
      badge = txt(String(node.badge), {
        x: 0, y: r + 14, "text-anchor": "middle", "font-size": 10, fill: C.grey,
      }, g);
    }
    setOpacity(ring, 0);
    const item = { node, g, circle, ring, label, badge, x: p.x, y: p.y, r };
    nodeMap.set(node.id, item);
    nodeNodes.push(item);
  }

  const reset = () => {
    for (const item of nodeNodes) {
      setOpacity(item.g, 1);
      item.circle.setAttribute("fill", C.chipFill);
      item.circle.setAttribute("stroke", C.greyDark);
      item.circle.setAttribute("stroke-width", "2.2");
      item.label.setAttribute("fill", C.white);
      setOpacity(item.ring, 0);
      if (item.badge) { item.badge.setAttribute("fill", C.grey); item.badge.textContent = String(item.node.badge === undefined ? "" : item.node.badge); }
    }
    for (const item of edgeNodes) {
      setOpacity(item.line, 1);
      item.line.setAttribute("stroke", C.greyDark);
      item.line.setAttribute("stroke-width", "2.2");
      setOpacity(item.line, 0);
      if (item.arrow) { item.arrow.setAttribute("fill", C.greyDark); setOpacity(item.arrow, 0); }
    }
  };
  reset();
  scene.resetters.push(reset);

  const apply = (tl, states, edgeStates, badges, active) => {
    tl.add(0.01, () => {
      const stMap = states || {};
      for (const item of nodeNodes) {
        const s = stMap[item.node.id] || {};
        setOpacity(item.g, s.opacity === undefined ? 1 : s.opacity);
        item.circle.setAttribute("fill", s.fill || C.chipFill);
        item.circle.setAttribute("stroke", s.stroke || C.greyDark);
        item.circle.setAttribute("stroke-width", String(s.strokeWidth || 2.2));
        item.label.setAttribute("fill", s.text || C.white);
        setOpacity(item.ring, s.ring ? 1 : 0);
        if (s.ring) item.ring.setAttribute("stroke", s.ringColor || C.gold);
        if (item.badge) {
          item.badge.textContent = badges && badges[item.node.id] !== undefined
            ? String(badges[item.node.id]) : String(item.node.badge === undefined ? "" : item.node.badge);
          item.badge.setAttribute("fill", s.badgeColor || C.grey);
        }
      }
      const esMap = edgeStates || {};
      for (const item of edgeNodes) {
        const s = esMap[item.key] || esMap[item.keyR] || {};
        item.line.setAttribute("stroke", s.stroke || C.greyDark);
        item.line.setAttribute("stroke-width", String(s.strokeWidth || 2.2));
        setOpacity(item.line, s.opacity === undefined ? 1 : s.opacity);
        if (item.arrow) {
          item.arrow.setAttribute("fill", s.arrow || s.stroke || C.greyDark);
          setOpacity(item.arrow, s.opacity === undefined ? 1 : s.opacity);
        }
      }
    });
  };

  return {
    nodes: nodeNodes, edges: edgeNodes, positions, r,
    node(id) { return nodeMap.get(id); },
    edge(u, v) { return edgeMap.get(u + "|" + v) || edgeMap.get(v + "|" + u); },
    apply, reset,
  };
}

function kSay(scene, tl, text, color, detail, hold) {
  const { C, setOpacity } = scene.ctx;
  tl.add(0.01, () => {
    scene.status.textContent = text;
    scene.status.setAttribute("fill", color || C.gold);
    setOpacity(scene.status, 1);
    if (detail !== undefined) {
      scene.detail.textContent = detail;
      scene.detail.setAttribute("fill", C.grey);
      setOpacity(scene.detail, 1);
    }
  });
  if (hold === false) tl.log(text, color || C.gold, { hold: false });
  else tl.log(text, color || C.gold);
}

function kNarration(ctx, scene) {
  const { txt, C, setOpacity } = ctx;
  scene.status = txt("", {
    x: 64, y: 598, "font-size": 20, fill: C.gold,
  }, scene.layers.text);
  scene.detail = txt("", {
    x: 64, y: 626, "font-size": 15, fill: C.grey,
  }, scene.layers.text);
  scene.result = txt("", {
    x: ctx.STAGE_W / 2, y: 688, "text-anchor": "middle",
    "font-size": 25, fill: C.green,
  }, scene.layers.result);
  for (const node of [scene.status, scene.detail, scene.result]) {
    setOpacity(node, 0);
    scene.hideNodes.push(node);
  }
}

function kIntro(scene, tl) {
  const { ease, setOpacity } = scene.ctx;
  tl.add(0.55, scene.titleWriter, ease.outCubic);
  tl.add(0.35, u => setOpacity(scene.subtitle, u), ease.outCubic);
  for (const node of scene.introNodes) {
    tl.add(0.12, u => setOpacity(node, u), ease.outCubic);
  }
}

function kFinish(scene, tl, text, color) {
  const { ease, setOpacity, C } = scene.ctx;
  tl.add(0.01, () => {
    scene.result.textContent = text;
    scene.result.setAttribute("fill", color || C.green);
    setOpacity(scene.result, 1);
  });
  tl.add(0.5, u => setOpacity(scene.result, u), ease.outCubic);
  tl.log(text, color || C.green);
  tl.wait(0.8);
  return tl.finish();
}

function kParseGrid(raw, mode) {
  let text = String(raw || "").trim();
  if (!text) return null;
  if (text[0] === "[") {
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data) || !data.length || !Array.isArray(data[0])) return null;
      const rows = data.map(row => row.map(v => String(v)));
      if (!rows.every(row => row.length === rows[0].length)) return null;
      return rows;
    } catch (_) {
      return null;
    }
  }
  const lines = text.split(/[\/\n]+/).map(line => line.trim()).filter(Boolean);
  if (!lines.length) return null;
  const rows = lines.map(line => {
    if (mode === "chars") return line.replace(/\s+/g, "").split("");
    return line.split(/[,\s]+/).filter(Boolean);
  });
  if (!rows.length || !rows[0].length) return null;
  if (!rows.every(row => row.length === rows[0].length)) return null;
  return rows;
}

function kParseNumberRows(raw) {
  const rows = kParseGrid(raw, "tokens");
  if (!rows) return null;
  const out = rows.map(row => row.map(v => Number(v)));
  if (!out.every(row => row.every(Number.isFinite))) return null;
  return out;
}

function kParseEdges(raw) {
  let text = String(raw || "").trim();
  if (!text) return [];
  if (text[0] === "[") {
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) return null;
      if (!data.every(e => Array.isArray(e) && e.length >= 2)) return null;
      return data.map(e => e.slice(0, 2).map(Number));
    } catch (_) { return null; }
  }
  const lines = text.split(/[;\n]+/).map(s => s.trim()).filter(Boolean);
  const out = [];
  for (const line of lines) {
    const parts = line.replace(/[\[\]()]/g, "").split(/[,\s]+/).filter(Boolean).map(Number);
    if (parts.length < 2 || !parts.slice(0, 2).every(Number.isFinite)) return null;
    out.push([parts[0], parts[1]]);
  }
  return out;
}

/* Kahn topological-sort simulation shared by the two Course Schedule scenes.
 * The caller maps generic event kinds to its own code-line numbers. */
function kKahnSim(n, prerequisites) {
  const graph = Array.from({ length: n }, () => []);
  const indegree = Array(n).fill(0);
  for (const pair of prerequisites) {
    const course = pair[0];
    const prereq = pair[1];
    graph[prereq].push(course);
    indegree[course] += 1;
  }
  const events = [];
  let queue = [];
  let taken = 0;
  let order = [];
  const snapshot = (kind, extra) => {
    events.push({
      kind,
      graph: graph.map(row => row.slice()),
      indegree: indegree.slice(),
      queue: queue.slice(),
      taken,
      order: order.slice(),
      ...(extra || {}),
    });
  };
  snapshot("init");
  for (let c = 0; c < n; c++) if (indegree[c] === 0) queue.push(c);
  snapshot("seed");
  while (queue.length) {
    const node = queue.shift();
    taken += 1;
    order.push(node);
    snapshot("pop", { node });
    for (const nxt of graph[node]) {
      indegree[nxt] -= 1;
      const zero = indegree[nxt] === 0;
      snapshot("dec", { node, nxt, zero });
      if (zero) {
        queue.push(nxt);
        snapshot("enqueue", { node, nxt });
      }
    }
  }
  snapshot("done", { result: taken === n });
  return { events, result: taken === n, order, graph };
}

/* Union-find simulation shared by the three DSU graph scenes. */
function kDSUSim(n, edges, opts) {
  const o = opts || {};
  const parent = Array.from({ length: n }, (_, i) => i);
  const rank = Array(n).fill(0);
  const events = [];
  let components = n;
  let cycleEdge = null;
  const find = x => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const snapshot = (kind, extra) => {
    events.push({
      kind,
      parent: parent.slice(),
      rank: rank.slice(),
      components,
      cycleEdge: cycleEdge ? cycleEdge.slice() : null,
      ...(extra || {}),
    });
  };
  snapshot("init");
  if (o.checkEdgeCount && edges.length !== n - 1) {
    snapshot("badcount", { expected: n - 1, actual: edges.length });
    snapshot("done", { result: false });
    return { events, parent, rank, components, cycleEdge, result: false };
  }
  for (const edge of edges) {
    const [u, v] = edge;
    snapshot("edge", { edge: [u, v] });
    let ra = find(u);
    let rb = find(v);
    snapshot("find", { edge: [u, v], ra, rb });
    if (ra === rb) {
      cycleEdge = [u, v];
      snapshot("cycle", { edge: [u, v], ra, rb });
      if (o.stopOnCycle) break;
      continue;
    }
    if (rank[ra] < rank[rb]) {
      const tmp = ra; ra = rb; rb = tmp;
    }
    parent[rb] = ra;
    if (rank[ra] === rank[rb]) rank[ra] += 1;
    components -= 1;
    snapshot("union", { edge: [u, v], ra, rb });
  }
  let result;
  if (o.mode === "redundant") result = cycleEdge || [];
  else if (o.mode === "validTree") result = !cycleEdge;
  else result = components;
  snapshot("done", { result });
  return { events, parent, rank, components, cycleEdge, result };
}
const SCENE = {
  meta: {
    title: "Word Ladder",
    subtitle: "BFS over one-letter transformations · each level adds one word · first hit is the shortest",
    inputs: [
      { id: "begin_word", label: "begin word", type: "text", default: "hit", width: "narrow" },
      { id: "end_word", label: "end word", type: "text", default: "cog", width: "narrow" },
      { id: "word_list", label: "word list JSON", type: "text", default: "[\"hot\",\"dot\",\"dog\",\"lot\",\"log\",\"cog\"]", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "discovered word" },
      { color: "#F0AC5F", text: "current / frontier" },
      { color: "#83C167", text: "shortest path / end" },
    ],
  },

  code: [
    "def ladder_length(begin_word: str, end_word: str, word_list: List[str]) -> int:",
    "    words = set(word_list)",
    "    if end_word not in words:",
    "        return 0",
    "    alphabet = \"abcdefghijklmnopqrstuvwxyz\"",
    "    queue = deque([begin_word])",
    "    visited = {begin_word}",
    "    steps = 1",
    "    while queue:",
    "        for _ in range(len(queue)):          # process one BFS level",
    "            word = queue.popleft()",
    "            if word == end_word:",
    "                return steps",
    "            for i in range(len(word)):",
    "                for ch in alphabet:",
    "                    if ch == word[i]:",
    "                        continue",
    "                    nxt = word[:i] + ch + word[i + 1:]",
    "                    if nxt in words and nxt not in visited:",
    "                        visited.add(nxt)",
    "                        queue.append(nxt)",
    "        steps += 1",
    "    return 0",
  ],

  read(values) {
    const begin = String(values.begin_word || "").trim();
    const end = String(values.end_word || "").trim();
    if (!begin || !end || begin.length > 8 || end.length > 8) return null;
    let words;
    try {
      const raw = String(values.word_list || "").trim();
      if (raw.startsWith("[")) words = JSON.parse(raw);
      else words = raw.split(/[,\s]+/).filter(Boolean);
    } catch (_) {
      return null;
    }
    if (!Array.isArray(words) || !words.every(w => typeof w === "string" && w.length <= 8)) return null;
    return { begin, end, words };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || args.length !== 3) return null;
    return {
      begin_word: String(args[0]),
      end_word: String(args[1]),
      word_list: JSON.stringify(args[2]),
    };
  },

  buildScene(params, ctx) {
    const { C, setOpacity } = ctx;
    const scene = {};
    kBase(ctx, scene);
    kHeader(ctx, scene, "Word Ladder",
      "one letter changes per edge · BFS expands a whole level before adding one step");
    const sim = simulateLadder(params.begin, params.end, params.words);
    scene.begin = params.begin;
    scene.end = params.end;
    scene.words = params.words;
    scene.sim = sim;

    kPanel(ctx, scene, 40, 128, 760, 452, "ladder graph", C.blue);
    const groups = {};
    for (const word of sim.visited) {
      const level = sim.depth[word] || 0;
      (groups[level] = groups[level] || []).push(word);
    }
    const levels = Object.keys(groups).map(Number).sort((a, b) => a - b);
    const maxLevel = levels.length ? levels[levels.length - 1] : 0;
    const yStep = maxLevel ? Math.min(82, 330 / maxLevel) : 0;
    const nodes = [];
    for (const level of levels) {
      const words = groups[level];
      for (let i = 0; i < words.length; i++) {
        nodes.push({
          id: words[i],
          label: words[i],
          x: 55 + 730 * (i + 0.5) / words.length,
          y: maxLevel === 0 ? 340 : 185 + level * yStep,
        });
      }
    }
    const treeEdges = [];
    for (const word of sim.visited) {
      const parent = sim.parent[word];
      if (parent) treeEdges.push({ u: parent, v: word, directed: true });
    }
    const graph = kGraph(ctx, scene, {
      nodes, edges: treeEdges,
      x: 55, y: 155, w: 730, h: 390, r: 29, font: 14,
    });
    scene.graph = graph;
    const hideGraph = () => {
      for (const item of graph.nodes) setOpacity(item.g, 0);
      for (const item of graph.edges) {
        setOpacity(item.line, 0);
        if (item.arrow) setOpacity(item.arrow, 0);
      }
    };
    hideGraph();
    scene.resetters.push(hideGraph);

    kPanel(ctx, scene, 820, 128, 412, 452, "BFS frontier", C.green);
    const stats = kLines(ctx, scene, {
      x: 844, y: 188, max: 5, lineH: 29, font: 13, color: C.white,
    });
    scene.stats = stats;
    const bankTitle = ctx.txt("word bank", {
      x: 844, y: 350, "font-size": 14, fill: C.green,
    }, scene.layers.text);
    setOpacity(bankTitle, 0);
    scene.hideNodes.push(bankTitle);
    scene.introNodes.push(bankTitle);
    const bank = kLines(ctx, scene, {
      x: 844, y: 378, max: 9, lineH: 18, font: 12, color: C.grey, mono: true,
    });
    scene.bank = bank;
    const note = ctx.txt("A word is queued when first discovered; re-discovering it would only make a longer ladder.", {
      x: 844, y: 552, "font-size": 10, fill: C.grey,
    }, scene.layers.text);
    setOpacity(note, 0);
    scene.hideNodes.push(note);
    scene.introNodes.push(note);
    scene.note = note;

    kNarration(ctx, scene);
    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C } = ctx;
    const { sim, graph, stats, bank, begin, end, words } = scene;
    const treeEdges = [];
    for (const word of sim.visited) {
      const parent = sim.parent[word];
      if (parent) treeEdges.push({ u: parent, v: word, directed: true });
    }
    const edgeKey = e => e.u + "|" + e.v;

    scene.reset();
    kIntro(scene, tl);
    tl.line([1, 2, 3, 4, 5, 6, 7, 8]);
    kSay(scene, tl, "begin BFS at '" + begin + "' with steps = 1", C.blue,
      "only words in the list are allowed as intermediate rungs");
    stats.set(tl, ["steps = 1", "level = 1", "queue = [" + begin + "]", "current = -", "visited = 1"]);
    bank.set(tl, wordBankLines(words, end, new Set([begin]), begin));

    for (const ev of sim.events) {
      const visited = new Set(ev.visited || [begin]);
      const pathSet = new Set();
      if (ev.path) {
        for (let i = 1; i < ev.path.length; i++) pathSet.add(ev.path[i - 1] + "|" + ev.path[i]);
      }
      const states = {};
      for (const word of sim.visited) {
        if (!visited.has(word)) {
          states[word] = { opacity: 0 };
          continue;
        }
        const onPath = pathSet.has(word) || (ev.path && ev.path.includes(word));
        states[word] = {
          opacity: 1,
          fill: onPath ? "#17251a" : "#17384a",
          stroke: onPath ? C.green : C.blue,
          text: onPath ? C.green : C.blue,
          ring: ev.word === word || ev.current === word,
        };
      }
      const edgeStates = {};
      for (const e of treeEdges) {
        const key = edgeKey(e);
        const visible = visited.has(e.v);
        const onPath = pathSet.has(key);
        const active = ev.kind === "discover" && ev.word === e.u && ev.newWord === e.v;
        edgeStates[key] = {
          opacity: visible ? 1 : 0,
          stroke: onPath ? C.green : active ? C.gold : C.greyDark,
          arrow: onPath ? C.green : active ? C.gold : C.greyDark,
          strokeWidth: onPath || active ? 3.6 : 2.2,
        };
      }
      graph.apply(tl, states, edgeStates, null, null);

      if (ev.kind === "missing") {
        tl.line([3, 4]);
        stats.set(tl, ["steps = 0", "level = -", "queue = []", "current = -", "visited = 1"]);
        bank.set(tl, wordBankLines(words, end, visited, begin));
        kSay(scene, tl, "'" + end + "' is absent from the word list → return 0", C.red,
          "the target must be present as an allowed word", false);
      } else if (ev.kind === "level") {
        tl.line([9, 10]);
        stats.set(tl, ["steps = " + ev.steps, "level = " + ev.steps, "queue = [" + ev.queue.join(", ") + "]", "current = -", "visited = " + ev.visited.length]);
        bank.set(tl, wordBankLines(words, end, visited, begin));
        kSay(scene, tl, "start BFS level " + ev.steps + " with " + ev.queue.length + " word" + (ev.queue.length === 1 ? "" : "s"), C.gold,
          "every word in this queue is exactly steps-1 transformations from begin", false);
      } else if (ev.kind === "pop") {
        tl.line([11, 12]);
        stats.set(tl, ["steps = " + ev.steps, "level = " + ev.steps, "queue = [" + ev.queue.join(", ") + "]", "current = " + ev.word, "visited = " + ev.visited.length]);
        bank.set(tl, wordBankLines(words, end, visited, begin));
        kSay(scene, tl, "pop '" + ev.word + "'", C.blue,
          "if it is the end word, the current step count is optimal", false);
      } else if (ev.kind === "discover") {
        tl.line([14, 15, 16, 17, 18, 19, 20, 21]);
        stats.set(tl, ["steps = " + ev.steps, "level = " + ev.steps, "queue = [" + ev.queue.join(", ") + "]", "new = " + ev.newWord, "visited = " + ev.visited.length]);
        bank.set(tl, wordBankLines(words, end, visited, begin));
        kSay(scene, tl, "'" + ev.word + "' → '" + ev.newWord + "' (one letter)", C.green,
          "queue the new word once; its depth is one more than its parent", false);
      } else if (ev.kind === "found") {
        tl.line(13);
        stats.set(tl, ["steps = " + ev.steps, "level = " + ev.steps, "queue = []", "current = " + ev.word, "visited = " + ev.visited.length]);
        bank.set(tl, wordBankLines(words, end, visited, begin));
        kSay(scene, tl, "reached '" + end + "' in " + ev.steps + " words", C.green,
          "return the level count immediately", false);
      } else if (ev.kind === "step") {
        tl.line(22);
        stats.set(tl, ["steps = " + ev.steps, "level = " + ev.steps, "queue = [" + ev.queue.join(", ") + "]", "current = -", "visited = " + ev.visited.length]);
        bank.set(tl, wordBankLines(words, end, visited, begin));
        kSay(scene, tl, "finish level · steps becomes " + ev.steps, C.gold,
          "the next queue holds words discovered during this level", false);
      } else if (ev.kind === "done") {
        tl.line(23);
        stats.set(tl, ["steps = 0", "level = -", "queue = []", "current = -", "visited = " + ev.visited.length]);
        bank.set(tl, wordBankLines(words, end, visited, begin));
        kSay(scene, tl, "queue exhausted with no path → return 0", C.red,
          "the word graph is disconnected", false);
      }
      tl.wait(0.16);
    }

    return kFinish(scene, tl, "return " + sim.result, sim.result ? C.green : C.red);
  },
};

function wordBankLines(words, end, visited, begin) {
  const seen = new Set();
  const lines = [];
  for (const word of words) {
    if (seen.has(word)) continue;
    seen.add(word);
    const mark = visited.has(word) ? "✓" : "·";
    const tag = word === end ? "  end" : word === begin ? "  begin" : "";
    lines.push(mark + " " + word + tag);
    if (lines.length >= 9) break;
  }
  if (!seen.has(end)) lines.push("✕ " + end + "  missing");
  return lines.slice(0, 9);
}

function simulateLadder(begin, end, wordList) {
  const words = [...new Set(wordList)];
  const allowed = new Set(words);
  const events = [];
  const visited = new Set([begin]);
  const parent = {};
  const depth = { [begin]: 0 };
  let queue = [begin];
  let steps = 1;
  const base = extra => ({
    visited: [...visited],
    queue: queue.slice(),
    steps,
    depth: { ...depth },
    parent: { ...parent },
    ...(extra || {}),
  });

  if (!allowed.has(end)) {
    events.push({ kind: "missing", ...base({ word: null, current: null }) });
    return { events, result: 0, visited: [...visited], depth, parent, path: [] };
  }

  events.push({ kind: "init", ...base({ word: null, current: null }) });
  while (queue.length) {
    events.push({ kind: "level", ...base({ word: null, current: null }) });
    const levelSize = queue.length;
    for (let k = 0; k < levelSize; k++) {
      const word = queue.shift();
      events.push({ kind: "pop", ...base({ word, current: word }) });
      if (word === end) {
        const path = [];
        let cur = end;
        while (cur !== undefined) {
          path.push(cur);
          cur = parent[cur];
        }
        path.reverse();
        events.push({ kind: "found", ...base({ word, current: word, path, result: steps }) });
        return { events, result: steps, visited: [...visited], depth, parent, path };
      }
      for (const candidate of words) {
        if (visited.has(candidate)) continue;
        if (!oneLetterApart(word, candidate)) continue;
        visited.add(candidate);
        parent[candidate] = word;
        depth[candidate] = steps;
        queue.push(candidate);
        events.push({ kind: "discover", ...base({ word, newWord: candidate, current: word }) });
      }
    }
    steps += 1;
    events.push({ kind: "step", ...base({ word: null, current: null }) });
  }
  events.push({ kind: "done", ...base({ result: 0, word: null, current: null }) });
  return { events, result: 0, visited: [...visited], depth, parent, path: [] };
}

function oneLetterApart(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diff += 1;
    if (diff > 1) return false;
  }
  return diff === 1;
}
