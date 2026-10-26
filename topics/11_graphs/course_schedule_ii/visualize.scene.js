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
const SCENE = {
  meta: {
    title: "Course Schedule II",
    subtitle: "Kahn's algorithm · repeatedly take indegree-0 courses · a cycle leaves courses behind",
    inputs: [
      { id: "num_courses", label: "courses", type: "number", default: 4, min: 0, max: 8 },
      { id: "prerequisites", label: "prerequisites (JSON [course, prereq])", type: "text", default: "[[1,0],[2,0],[3,1],[3,2]]", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "course" },
      { color: "#F0AC5F", text: "ready queue" },
      { color: "#83C167", text: "taken" },
      { color: "#FC6255", text: "remaining in cycle" },
    ],
  },

  code: [
    "def find_order(num_courses: int, prerequisites: List[List[int]]) -> List[int]:",
    "    graph: List[List[int]] = [[] for _ in range(num_courses)]",
    "    indegree = [0] * num_courses",
    "    for course, prereq in prerequisites:",
    "        graph[prereq].append(course)   # prereq -> course",
    "        indegree[course] += 1",
    "    queue = deque(c for c in range(num_courses) if indegree[c] == 0)",
    "    order: List[int] = []",
    "    while queue:",
    "        node = queue.popleft()",
    "        order.append(node)",
    "        for nxt in graph[node]:",
    "            indegree[nxt] -= 1",
    "            if indegree[nxt] == 0:",
    "                queue.append(nxt)",
    "    return order if len(order) == num_courses else []",
  ],

  read(values) {
    const n = Number(values.num_courses);
    if (!Number.isInteger(n) || n < 0 || n > 8) return null;
    let prereqs;
    try {
      prereqs = JSON.parse(String(values.prerequisites || "").trim());
    } catch (_) {
      return null;
    }
    if (!Array.isArray(prereqs) || !prereqs.every(e => Array.isArray(e) && e.length === 2)) return null;
    if (!prereqs.every(e => e.every(v => Number.isInteger(v) && v >= 0 && v < n))) return null;
    return { n, prereqs };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || args.length !== 2) return null;
    return {
      num_courses: String(args[0]),
      prerequisites: JSON.stringify(args[1]),
    };
  },

  buildScene(params, ctx) {
    const { C, setOpacity } = ctx;
    const scene = {};
    kBase(ctx, scene);
    kHeader(ctx, scene, "Course Schedule II",
      "Kahn's algorithm · append each taken course to the topological order");
    const { n, prereqs } = params;
    const sim = kKahnSim(n, prereqs);
    scene.n = n;
    scene.prereqs = prereqs;
    scene.sim = sim;

    kPanel(ctx, scene, 40, 128, 700, 452, "prerequisite graph", C.blue);
    const nodes = [];
    for (let i = 0; i < n; i++) nodes.push({ id: String(i), label: String(i), badge: 0 });
    const graph = kGraph(ctx, scene, {
      nodes,
      edges: uniquePrereqEdges(prereqs),
      x: 55, y: 158, w: 670, h: 400, r: 29,
    });
    scene.graph = graph;

    kPanel(ctx, scene, 760, 128, 472, 452, "Kahn state", C.green);
    const stats = kLines(ctx, scene, {
      x: 784, y: 188, max: 7, lineH: 34, font: 14, color: C.white,
    });
    scene.stats = stats;
    const note = ctx.txt("Only indegree-0 courses enter the queue. Consuming a course releases its dependents.", {
      x: 784, y: 500, "font-size": 12, fill: C.grey,
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
    const { sim, graph, stats, prereqs, n } = scene;
    const edges = uniquePrereqEdges(prereqs);
    const edgeKey = e => e.u + "|" + e.v;

    scene.reset();
    kIntro(scene, tl);
    tl.line([1, 2, 3, 4, 5, 6]);
    kSay(scene, tl, "build the directed graph and indegree array", C.blue,
      "edge prereq → course means the prerequisite must be taken first");
    graph.apply(tl, {}, {}, {}, null);
    stats.set(tl, ["indegree = [" + Array(n).fill(0).join(", ") + "]", "queue = []", "taken = 0", "order = []", "answer = ?"]);

    for (const ev of sim.events) {
      const takenSet = new Set(ev.order);
      const queueSet = new Set(ev.queue);
      const states = {};
      for (let i = 0; i < n; i++) {
        const id = String(i);
        states[id] = {
          fill: takenSet.has(i) ? "#17251a" : queueSet.has(i) ? "#2a2115" : "#17384a",
          stroke: takenSet.has(i) ? C.green : queueSet.has(i) ? C.gold : C.blue,
          text: takenSet.has(i) ? C.green : queueSet.has(i) ? C.gold : C.blue,
          ring: ev.node === i,
        };
      }
      const edgeStates = {};
      for (const e of edges) {
        const activeEdge = ev.kind === "dec" && e.u === String(ev.node) && e.v === String(ev.nxt);
        edgeStates[edgeKey(e)] = {
          stroke: activeEdge ? C.gold : C.greyDark,
          arrow: activeEdge ? C.gold : C.greyDark,
          strokeWidth: activeEdge ? 4 : 2.2,
        };
      }
      const badges = {};
      for (let i = 0; i < n; i++) badges[String(i)] = ev.indegree[i];
      graph.apply(tl, states, edgeStates, badges, null);

      if (ev.kind === "init") {
        stats.set(tl, [
          "indegree = [" + ev.indegree.join(", ") + "]",
          "queue = []",
          "taken = 0",
          "order = []",
          "answer = ?",
        ]);
      } else if (ev.kind === "seed") {
        tl.line([7, 8]);
        stats.set(tl, [
          "indegree = [" + ev.indegree.join(", ") + "]",
          "queue = [" + ev.queue.join(", ") + "]",
          "taken = 0",
          "order = []",
          "answer = ?",
        ]);
        kSay(scene, tl, "seed the queue with every indegree-0 course", C.gold,
          "these courses have no remaining prerequisites", false);
      } else if (ev.kind === "pop") {
        tl.line([9, 10, 11]);
        stats.set(tl, [
          "indegree = [" + ev.indegree.join(", ") + "]",
          "queue = [" + ev.queue.join(", ") + "]",
          "taken = " + ev.taken,
          "node = " + ev.node,
          "order = [" + ev.order.join(", ") + "]",
        ]);
        kSay(scene, tl, "take course " + ev.node + " · taken = " + ev.taken, C.green,
          "remove it from the queue and release each dependent", false);
      } else if (ev.kind === "dec") {
        tl.line([12, 13, 14]);
        stats.set(tl, [
          "indegree = [" + ev.indegree.join(", ") + "]",
          "queue = [" + ev.queue.join(", ") + "]",
          "taken = " + ev.taken,
          "edge = " + ev.node + " → " + ev.nxt,
          "order = [" + ev.order.join(", ") + "]",
        ]);
        kSay(scene, tl, "edge " + ev.node + " → " + ev.nxt + " · indegree " +
          ev.nxt + " becomes " + ev.indegree[ev.nxt], ev.zero ? C.green : C.blue,
          ev.zero ? "zero indegree releases it into the queue" : "still blocked by another prerequisite", false);
        if (ev.zero) tl.wait(0.04);
      } else if (ev.kind === "enqueue") {
        tl.line(15);
        stats.set(tl, [
          "indegree = [" + ev.indegree.join(", ") + "]",
          "queue = [" + ev.queue.join(", ") + "]",
          "taken = " + ev.taken,
          "enqueue = " + ev.nxt,
          "order = [" + ev.order.join(", ") + "]",
        ]);
        kSay(scene, tl, "enqueue course " + ev.nxt, C.gold,
          "all prerequisites are now complete", false);
      } else if (ev.kind === "done") {
        tl.line(16);
        stats.set(tl, [
          "indegree = [" + ev.indegree.join(", ") + "]",
          "queue = []",
          "taken = " + ev.taken + " / " + n,
          "order = [" + ev.order.join(", ") + "]",
          "answer = [" + (ev.result ? ev.order.join(", ") : "") + "]",
        ]);
        kSay(scene, tl, ev.result ? "valid order recorded: [" + ev.order.join(", ") + "]" : "cycle detected · return []", ev.result ? C.green : C.red,
          "the order is valid only when every course was appended", false);
      }
      tl.wait(0.12);
    }

    const answer = sim.result ? "[" + sim.order.join(", ") + "]" : "[]";
    return kFinish(scene, tl, "return " + answer, sim.result ? C.green : C.red);
  },
};

function uniquePrereqEdges(prereqs) {
  const seen = new Set();
  const out = [];
  for (const [course, prereq] of prereqs) {
    const key = prereq + "|" + course;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ u: String(prereq), v: String(course), directed: true });
  }
  return out;
}
