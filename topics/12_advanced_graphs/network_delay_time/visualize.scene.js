/* Network Delay Time — animated Dijkstra scene.
 *
 * Signal starts at node k with distance 0. A min-heap always pops the closest
 * unprocessed node, then relaxes every outgoing edge: if d + w beats dist[v],
 * the signal reaches v earlier and v re-enters the heap. The answer is the
 * largest final distance (or -1 when some node stays at infinity).
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Network Delay Time",
    subtitle: "Dijkstra · min-heap frontier · O(E log V)",
    inputs: [
      {
        id: "times",
        label: "times (u,v,w)",
        type: "text",
        default: "2,1,1; 2,3,1; 3,4,1",
        width: "wide",
      },
      { id: "n", label: "n", type: "number", default: 4 },
      { id: "k", label: "k", type: "number", default: 2 },
    ],
    legend: [
      { color: "#58C4DD", text: "current node" },
      { color: "#F0AC5F", text: "frontier / heap" },
      { color: "#83C167", text: "settled distance" },
      { color: "#FC6255", text: "stale heap entry" },
    ],
  },

  code: [
    "def network_delay_time(times: List[List[int]], n: int, k: int) -> int:",
    "    graph: Dict[int, List[Tuple[int, int]]] = defaultdict(list)",
    "    for src, dst, weight in times:",
    "        graph[src].append((dst, weight))",
    "    INF = float('inf')",
    "    dist = [INF] * (n + 1)",
    "    dist[k] = 0",
    "    heap: List[Tuple[int, int]] = [(0, k)]",
    "    while heap:",
    "        d, node = heapq.heappop(heap)",
    "        if d > dist[node]:              # stale entry",
    "            continue",
    "        for nxt, weight in graph[node]:",
    "            if d + weight < dist[nxt]:",
    "                dist[nxt] = d + weight",
    "                heapq.heappush(heap, (dist[nxt], nxt))",
    "    answer = max(dist[1:])",
    "    return -1 if answer == INF else int(answer)",
  ],

  read(values) {
    const raw = String(values.times || "").trim();
    const n = Number(values.n);
    const k = Number(values.k);
    if (!Number.isInteger(n) || n < 1 || n > 8) return null;
    if (!Number.isInteger(k) || k < 1 || k > n) return null;

    const times = [];
    if (raw) {
      for (const part of raw.split(/[;\n]+/)) {
        const piece = part.trim();
        if (!piece) continue;
        const nums = piece.split(/[\s,]+/).filter(Boolean).map(Number);
        if (nums.length !== 3 || !nums.every(Number.isInteger)) return null;
        const [u, v, w] = nums;
        if (u < 1 || u > n || v < 1 || v > n) return null;
        if (w < 0 || w > 999) return null;
        times.push([u, v, w]);
      }
    }
    if (times.length > 16) return null;
    return { times, n, k };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || args.length < 3) return null;
    const times = args[0];
    const n = Number(args[1]);
    const k = Number(args[2]);
    if (!Array.isArray(times) || !Number.isInteger(n) || !Number.isInteger(k)) return null;
    if (n < 1 || n > 8 || k < 1 || k > n) return null;
    const rows = [];
    for (const edge of times) {
      if (!Array.isArray(edge) || edge.length !== 3) return null;
      const [u, v, w] = edge.map(Number);
      if (![u, v, w].every(Number.isInteger)) return null;
      if (u < 1 || u > n || v < 1 || v > n || w < 0) return null;
      rows.push(u + "," + v + "," + w);
    }
    return { times: rows.join("; "), n, k };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const { times, n, k } = params;
    const sim = simulateDelay(times, n, k);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-red", C.red);

    // arrow marker for directed edges
    const marker = el("marker", {
      id: "edge-arrow", viewBox: "0 0 10 10", refX: 9, refY: 5,
      markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
    }, ctx.defs);
    el("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: C.grey }, marker);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const arcsL = ctx.layer("arcs");
    const resultL = ctx.layer("result");

    const scene = {
      times, n, k, sim, nodes: [], edges: [], rows: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title ---------------------------------------------------------
    scene.title = txt("Network Delay Time", {
      x: 64, y: 64, "font-size": 42, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    scene.subtitle = txt(
      "signal from node " + k + "   ·   " + times.length + " directed calls   ·   shortest arrival time for every node",
      { x: 64, y: 101, "font-size": 18, fill: C.grey },
      textL
    );
    setOpacity(scene.subtitle, 0);

    // ---- graph panel ---------------------------------------------------
    const gX = 40, gY = 132, gW = 720, gH = 480;
    scene.graphPanel = el("g", {}, chipsL);
    el("rect", {
      x: gX, y: gY, width: gW, height: gH, rx: 14,
      fill: "#0b1019", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.graphPanel);
    setOpacity(scene.graphPanel, 0);
    scene.graphTitle = txt("directed network", {
      x: gX + 20, y: gY + 28, "font-size": 16, fill: C.blue,
    }, textL);
    setOpacity(scene.graphTitle, 0);

    const cx = gX + gW / 2;
    const cy = gY + gH / 2 + 8;
    const ringR = n <= 2 ? 80 : (n <= 4 ? 145 : 190);
    const positions = {};
    for (let i = 1; i <= n; i++) {
      const angle = -Math.PI / 2 + (2 * Math.PI * (i - 1)) / n;
      positions[i] = {
        x: cx + Math.cos(angle) * ringR,
        y: cy + Math.sin(angle) * ringR,
      };
    }
    const nodeR = n > 6 ? 18 : 22;

    // edge geometry + labels
    times.forEach(([u, v, w], idx) => {
      const a = positions[u];
      const b = positions[v];
      const g = el("g", {}, arcsL);
      let line;
      if (u === v) {
        // small self-loop above the node
        line = el("path", {
          d: "M " + (a.x - 14) + " " + (a.y - nodeR) +
             " C " + (a.x - 34) + " " + (a.y - 66) +
             ", " + (a.x + 34) + " " + (a.y - 66) +
             ", " + (a.x + 14) + " " + (a.y - nodeR),
          fill: "none", stroke: C.grey, "stroke-width": 2,
          "marker-end": "url(#edge-arrow)",
        }, g);
      } else {
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.max(1, Math.hypot(dx, dy));
        const ux = dx / len, uy = dy / len;
        const sx = a.x + ux * (nodeR + 2);
        const sy = a.y + uy * (nodeR + 2);
        const ex = b.x - ux * (nodeR + 6);
        const ey = b.y - uy * (nodeR + 6);
        line = el("line", {
          x1: sx, y1: sy, x2: ex, y2: ey,
          stroke: C.grey, "stroke-width": 2,
          "marker-end": "url(#edge-arrow)",
        }, g);
      }
      const mx = (a.x + b.x) / 2 - (u === v ? 0 : 12);
      const my = (a.y + b.y) / 2 - 10 - (idx % 2) * 3;
      const label = txt(String(w), {
        x: mx, y: my, "text-anchor": "middle",
        "font-size": 13, fill: C.gold,
        stroke: "#0b1019", "stroke-width": 4, "paint-order": "stroke",
      }, g);
      setOpacity(g, 0);
      scene.edges.push({ g, line, label, u, v, w });
    });

    // nodes
    for (let i = 1; i <= n; i++) {
      const pos = positions[i];
      const g = el("g", {}, chipsL);
      const halo = el("circle", {
        cx: pos.x, cy: pos.y, r: nodeR + 8,
        fill: "none", stroke: C.gold, "stroke-width": 3,
        filter: "url(#glow-gold)",
      }, g);
      setOpacity(halo, 0);
      const circle = el("circle", {
        cx: pos.x, cy: pos.y, r: nodeR,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, g);
      const label = txt(String(i), {
        x: pos.x, y: pos.y + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": 18, fill: C.white,
      }, g);
      const dist = txt("∞", {
        x: pos.x, y: pos.y + nodeR + 18, "text-anchor": "middle",
        "font-size": 13, fill: C.blue,
      }, g);
      setOpacity(g, 0);
      scene.nodes.push({ i, pos, g, halo, circle, label, dist, radius: nodeR });
    }

    // ---- distance panel ------------------------------------------------
    const dX = 780, dY = 132, dW = 464, dH = 480;
    scene.distPanel = el("g", {}, chipsL);
    el("rect", {
      x: dX, y: dY, width: dW, height: dH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.distPanel);
    setOpacity(scene.distPanel, 0);
    scene.distTitle = txt("dist from k = " + k, {
      x: dX + 20, y: dY + 31, "font-size": 18, fill: C.blue,
    }, textL);
    setOpacity(scene.distTitle, 0);
    scene.distHint = txt("settled ✓   ·   heap ordered by distance", {
      x: dX + 20, y: dY + 54, "font-size": 12, fill: C.grey,
    }, textL);
    setOpacity(scene.distHint, 0);

    const distCol = dX + 250;
    const stateCol = dX + dW - 24;
    txt("node", {
      x: dX + 26, y: dY + 82, "font-size": 12, fill: C.grey,
    }, textL);
    txt("distance", {
      x: distCol, y: dY + 82, "text-anchor": "end", "font-size": 12, fill: C.grey,
    }, textL);
    txt("state", {
      x: stateCol, y: dY + 82, "text-anchor": "end", "font-size": 12, fill: C.grey,
    }, textL);

    const rowH = n > 6 ? 32 : 36;
    const rowsTop = dY + 98;
    for (let i = 1; i <= n; i++) {
      const y = rowsTop + (i - 1) * rowH;
      const g = el("g", {}, textL);
      const bg = el("rect", {
        x: dX + 14, y: y - 15, width: dW - 28, height: rowH - 5, rx: 6,
        fill: "none", stroke: "none",
      }, g);
      const node = txt(String(i), {
        x: dX + 30, y, "font-size": 15, fill: C.white,
      }, g);
      const dist = txt("∞", {
        x: distCol, y, "text-anchor": "end", "font-size": 15, fill: C.blue,
      }, g);
      const state = txt("frontier", {
        x: stateCol, y, "text-anchor": "end", "font-size": 12, fill: C.gold,
      }, g);
      setOpacity(g, 0);
      scene.rows.push({ g, bg, node, dist, state, i });
    }

    const heapY = rowsTop + n * rowH + 28;
    scene.heapLabel = txt("min-heap  (d, node)", {
      x: dX + 22, y: heapY, "font-size": 14, fill: C.gold,
    }, textL);
    setOpacity(scene.heapLabel, 0);
    scene.heapText = txt("[(0, " + k + ")]", {
      x: dX + 22, y: heapY + 27, "font-size": 14, fill: C.white,
    }, textL);
    setOpacity(scene.heapText, 0);

    // ---- status + result ----------------------------------------------
    scene.status = txt("", {
      x: 64, y: 606, "font-size": 19, fill: C.gold,
    }, textL);
    setOpacity(scene.status, 0);
    scene.resultBox = el("rect", {
      x: 340, y: 636, width: 600, height: 58, rx: 12,
      fill: "#111a16", stroke: C.green, "stroke-width": 2.2,
      filter: "url(#glow-green)",
    }, resultL);
    setOpacity(scene.resultBox, 0);
    scene.result = txt("", {
      x: STAGE_W / 2, y: 665, "text-anchor": "middle",
      "dominant-baseline": "central", "font-size": 28, fill: C.green,
    }, resultL);
    scene.note = txt("", {
      x: STAGE_W / 2, y: 707, "text-anchor": "middle",
      "font-size": 14, fill: C.grey,
    }, resultL);

    // ---- baseline ------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.graphPanel, scene.graphTitle,
                          scene.distPanel, scene.distTitle, scene.distHint,
                          scene.status, scene.resultBox, scene.result, scene.note,
                          scene.heapLabel, scene.heapText]) {
        setOpacity(node, 0);
      }
      for (const edge of scene.edges) {
        setOpacity(edge.g, 0);
        edge.line.setAttribute("stroke", C.grey);
        edge.line.setAttribute("stroke-width", "2");
        edge.label.setAttribute("fill", C.gold);
      }
      for (const node of scene.nodes) {
        setOpacity(node.g, 0);
        setOpacity(node.halo, 0);
        node.circle.setAttribute("fill", C.chipFill);
        node.circle.setAttribute("stroke", C.greyDark);
        node.label.setAttribute("fill", C.white);
        node.dist.textContent = "∞";
        node.dist.setAttribute("fill", C.blue);
      }
      for (const row of scene.rows) {
        setOpacity(row.g, 0);
        row.bg.setAttribute("fill", "none");
        row.bg.setAttribute("stroke", "none");
        row.node.setAttribute("fill", C.white);
        row.dist.textContent = "∞";
        row.dist.setAttribute("fill", C.blue);
        row.state.textContent = "unreached";
        row.state.setAttribute("fill", C.grey);
      }
      scene.status.textContent = "";
      scene.result.textContent = "";
      scene.note.textContent = "";
      scene.heapText.textContent = "[(0, " + k + ")]";
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity } = ctx;
    const { sim, n, k, times } = scene;
    const easeOut = ease.outCubic;

    scene.reset();

    const status = (text, color) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || C.gold);
        setOpacity(scene.status, 1);
      });
      tl.log(text, color || C.gold);
    };

    const apply = (snap, activeNode, activeEdge) => {
      tl.add(0.35, u => {
        const e = easeOut(u);
        for (const node of scene.nodes) {
          const d = snap.dist[node.i];
          const isActive = node.i === activeNode;
          const settled = snap.settled[node.i];
          node.circle.setAttribute("fill", isActive ? "#2a2214" : (settled ? "#17251a" : C.chipFill));
          node.circle.setAttribute("stroke", isActive ? C.gold : (settled ? C.green : C.greyDark));
          node.label.setAttribute("fill", isActive ? C.gold : (settled ? C.green : C.white));
          node.dist.textContent = d === Infinity ? "∞" : String(d);
          node.dist.setAttribute("fill", d === Infinity ? C.grey : (isActive ? C.gold : C.green));
          setOpacity(node.halo, isActive ? e : 0);
        }
        scene.edges.forEach((edge, idx) => {
          const hot = idx === activeEdge;
          const used = snap.usedEdges[idx];
          edge.line.setAttribute("stroke", hot ? C.blue : (used ? "#3f6b52" : C.grey));
          edge.line.setAttribute("stroke-width", hot ? 3 : 2);
          edge.label.setAttribute("fill", hot ? C.white : C.gold);
          setOpacity(edge.g, hot ? 1 : 0.8);
        });
        for (const row of scene.rows) {
          const d = snap.dist[row.i];
          const isActive = row.i === activeNode;
          const settled = snap.settled[row.i];
          row.bg.setAttribute("fill", isActive ? "#241E14" : (settled ? "#13211a" : "none"));
          row.bg.setAttribute("stroke", isActive ? C.gold : "none");
          row.node.setAttribute("fill", isActive ? C.gold : (settled ? C.green : C.white));
          row.dist.textContent = d === Infinity ? "∞" : String(d);
          row.dist.setAttribute("fill", d === Infinity ? C.grey : (d === 0 ? C.blue : C.green));
          row.state.textContent = settled ? "settled ✓" : (d === Infinity ? "unreached" : "frontier");
          row.state.setAttribute("fill", settled ? C.green : (d === Infinity ? C.grey : C.gold));
          setOpacity(row.g, 1);
        }
        const shown = snap.heap.slice(0, 6)
          .map(item => "(" + item.d + ", " + item.node + ")").join(", ");
        scene.heapText.textContent = "[" + shown + (snap.heap.length > 6 ? ", …" : "") + "]";
        setOpacity(scene.heapText, 1);
      }, ease.outCubic);
    };

    // ---- intro ---------------------------------------------------------
    tl.line(1);
    tl.add(0.65, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    tl.line([2, 3, 4]);
    tl.add(0.3, u => {
      setOpacity(scene.graphPanel, u);
      setOpacity(scene.graphTitle, u);
      setOpacity(scene.distPanel, u);
      setOpacity(scene.distTitle, u);
      setOpacity(scene.distHint, u);
      setOpacity(scene.heapLabel, u);
    }, easeOut);
    for (const edge of scene.edges) {
      tl.add(0.12, u => setOpacity(edge.g, u), easeOut);
    }
    for (const node of scene.nodes) {
      tl.add(0.13, u => setOpacity(node.g, u), easeOut);
      tl.wait(0.02);
    }
    for (const row of scene.rows) {
      tl.add(0.06, u => setOpacity(row.g, u), easeOut);
    }
    status("start at node " + k + ": dist[" + k + "] = 0, all other distances are ∞", C.blue);
    apply(sim.initial, -1, -1);
    tl.wait(0.25);

    // ---- Dijkstra events ----------------------------------------------
    sim.events.forEach(ev => {
      if (ev.kind === "pop") {
        tl.line([9, 10]);
        if (ev.stale) {
          status("pop (" + ev.d + ", " + ev.node + ")  ·  stale (dist is " + ev.current + ")  →  skip", C.red);
          apply(ev.snapshot, ev.node, -1);
        } else {
          tl.line(11);
          status("pop (" + ev.d + ", " + ev.node + ")  ·  settle node " + ev.node, C.gold);
          apply(ev.snapshot, ev.node, -1);
        }
      } else {
        tl.line([12, 13]);
        if (ev.accepted) {
          status("edge " + ev.u + " → " + ev.v + ": " + ev.d + " + " + ev.w +
            " = " + ev.newDist + "  <  " + (ev.oldDist === Infinity ? "∞" : ev.oldDist) +
            "  →  update", C.green);
          tl.line([14, 15]);
        } else {
          status("edge " + ev.u + " → " + ev.v + ": " + ev.d + " + " + ev.w +
            " = " + ev.newDist + "  ≥  dist[" + ev.v + "]  →  no update", C.grey);
        }
        apply(ev.snapshot, ev.u, ev.edge);
      }
      tl.wait(0.1);
    });

    // ---- answer --------------------------------------------------------
    tl.line(16);
    tl.line(17);
    const reachable = n - (sim.unreachable || 0);
    if (sim.answer === null) {
      status("max(dist) is still ∞  →  some node never receives the signal", C.red);
      tl.add(0.4, u => {
        scene.resultBox.setAttribute("fill", "#1d1416");
        scene.resultBox.setAttribute("stroke", C.red);
        scene.resultBox.setAttribute("filter", "url(#glow-red)");
        setOpacity(scene.resultBox, u);
      }, easeOut);
      scene.result.textContent = "return -1";
      scene.result.setAttribute("fill", C.red);
      tl.add(0.5, scene.writer(scene.result), ease.linear);
    } else {
      status("every node settled  ·  max(" + k + "…arrivals) = " + sim.answer, C.green);
      tl.add(0.4, u => {
        scene.resultBox.setAttribute("fill", "#111a16");
        scene.resultBox.setAttribute("stroke", C.green);
        scene.resultBox.setAttribute("filter", "url(#glow-green)");
        setOpacity(scene.resultBox, u);
      }, easeOut);
      scene.result.textContent = "return " + sim.answer;
      scene.result.setAttribute("fill", C.green);
      tl.add(0.55, scene.writer(scene.result), ease.linear);
      scene.note.textContent = reachable + " of " + n + " nodes reached   ·   farthest signal time = " + sim.answer;
      tl.add(0.4, scene.writer(scene.note), ease.linear);
    }
    tl.wait(1.1);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Simulation: Dijkstra with snapshots after every heap pop / relaxation.
 * ------------------------------------------------------------------ */
function simulateDelay(times, n, k) {
  const graph = {};
  for (let i = 1; i <= n; i++) graph[i] = [];
  times.forEach(([u, v, w], idx) => graph[u].push({ v, w, idx }));
  for (let i = 1; i <= n; i++) graph[i].sort((a, b) => a.v - b.v);

  const dist = new Array(n + 1).fill(Infinity);
  const settled = new Array(n + 1).fill(false);
  const usedEdges = new Array(times.length).fill(false);
  dist[k] = 0;

  let heap = [{ d: 0, node: k }];
  const sortHeap = () => heap.sort((a, b) => (a.d - b.d) || (a.node - b.node));
  const snapshot = () => ({
    dist: dist.slice(),
    settled: settled.slice(),
    usedEdges: usedEdges.slice(),
    heap: heap.map(item => ({ d: item.d, node: item.node })),
  });

  const initial = snapshot();
  const events = [];

  while (heap.length) {
    sortHeap();
    const top = heap.shift();
    const stale = top.d > dist[top.node];
    if (!stale) settled[top.node] = true;
    events.push({
      kind: "pop", d: top.d, node: top.node, stale,
      current: dist[top.node], snapshot: snapshot(),
    });
    if (stale) continue;

    for (const edge of graph[top.node]) {
      const newDist = top.d + edge.w;
      const oldDist = dist[edge.v];
      const accepted = newDist < oldDist;
      if (accepted) {
        dist[edge.v] = newDist;
        heap.push({ d: newDist, node: edge.v });
        usedEdges[edge.idx] = true;
      }
      events.push({
        kind: "relax", u: top.node, v: edge.v, w: edge.w,
        d: top.d, newDist, oldDist, accepted, edge: edge.idx,
        snapshot: snapshot(),
      });
    }
  }

  let answer = 0;
  let unreachable = 0;
  for (let i = 1; i <= n; i++) {
    if (dist[i] === Infinity) unreachable++;
    else answer = Math.max(answer, dist[i]);
  }

  return {
    initial, events, dist,
    answer: unreachable ? null : answer,
    unreachable,
  };
}
