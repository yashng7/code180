/* Min Cost to Connect All Points — animated Prim's algorithm scene.
 *
 * Every point is a node; edges are Manhattan distances. Prim grows one tree:
 * pick the unused point with the cheapest connecting edge, add that edge, then
 * relax the distance from the new tree point to every remaining point. Solid
 * gold edges are in the MST, dashed blue edges are the current frontier.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Min Cost to Connect All Points",
    subtitle: "Prim's MST · Manhattan distance · O(n²)",
    inputs: [
      {
        id: "points",
        label: "points",
        type: "text",
        default: "0,0; 2,2; 3,10; 5,2; 7,0",
        width: "wide",
      },
    ],
    legend: [
      { color: "#58C4DD", text: "unused point / frontier edge" },
      { color: "#F0AC5F", text: "selected point" },
      { color: "#83C167", text: "in the MST" },
      { color: "#FC6255", text: "new cheapest edge" },
    ],
  },

  code: [
    "def min_cost_connect_points(points: List[List[int]]) -> int:",
    "    n = len(points)",
    "    best = [inf] * n",
    "    best[0] = 0",
    "    used = [False] * n",
    "    total = 0",
    "    for _ in range(n):",
    "        node = -1",
    "        for i in range(n):",
    "            if not used[i] and (node == -1 or best[i] < best[node]):",
    "                node = i",
    "        used[node] = True",
    "        total += best[node]",
    "        for i in range(n):",
    "            if not used[i]:",
    "                dist = abs(points[node][0] - points[i][0]) + abs(points[node][1] - points[i][1])",
    "                if dist < best[i]:",
    "                    best[i] = dist",
    "    return total",
  ],

  read(values) {
    const raw = String(values.points || "").trim();
    if (!raw) return null;

    let points;
    try {
      if (raw.startsWith("[")) {
        points = JSON.parse(raw);
      } else {
        points = raw
          .split(/[;\n]+/)
          .map(row => row.trim())
          .filter(Boolean)
          .map(row => row.split(/[\s,]+/).filter(Boolean).map(Number));
      }
    } catch (err) {
      return null;
    }

    if (!Array.isArray(points) || points.length < 1 || points.length > 9) return null;
    if (!points.every(p => Array.isArray(p) && p.length === 2)) return null;
    if (!points.flat().every(v => Number.isInteger(v) && Math.abs(v) <= 99)) return null;
    return { points: points.map(p => [Number(p[0]), Number(p[1])]) };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || !Array.isArray(args[0])) return null;
    const points = [];
    for (const p of args[0]) {
      if (!Array.isArray(p) || p.length !== 2) return null;
      const x = Number(p[0]);
      const y = Number(p[1]);
      if (!Number.isInteger(x) || !Number.isInteger(y)) return null;
      points.push([x, y]);
    }
    if (points.length < 1 || points.length > 9) return null;
    return { points: points.map(p => p.join(",")).join("; ") };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const { points } = params;
    const n = points.length;
    const sim = simulatePrim(points);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-red", C.red);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const arcsL = ctx.layer("arcs");
    const resultL = ctx.layer("result");

    const scene = {
      points, n, sim, nodes: [], edgeGroups: [], frontier: [], tableRows: [],
      _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title ---------------------------------------------------------
    scene.title = txt("Min Cost to Connect All Points", {
      x: 64, y: 64, "font-size": 39, fill: C.white, "letter-spacing": 0.3,
    }, textL);
    scene.subtitle = txt(
      n + " points   ·   connect everything with the cheapest tree   ·   Manhattan distance",
      { x: 64, y: 101, "font-size": 18, fill: C.grey },
      textL
    );
    setOpacity(scene.subtitle, 0);

    // ---- plane panel ---------------------------------------------------
    const pX = 44, pY = 132, pW = 748, pH = 468;
    scene.plane = el("g", {}, chipsL);
    el("rect", {
      x: pX, y: pY, width: pW, height: pH, rx: 14,
      fill: "#0b1019", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.plane);
    // faint grid
    for (let i = 1; i < 8; i++) {
      el("line", {
        x1: pX + 18, y1: pY + (pH / 8) * i,
        x2: pX + pW - 18, y2: pY + (pH / 8) * i,
        stroke: "#141c28", "stroke-width": 1,
      }, scene.plane);
    }
    for (let i = 1; i < 8; i++) {
      el("line", {
        x1: pX + (pW / 8) * i, y1: pY + 18,
        x2: pX + (pW / 8) * i, y2: pY + pH - 18,
        stroke: "#141c28", "stroke-width": 1,
      }, scene.plane);
    }
    setOpacity(scene.plane, 0);
    scene.planeTitle = txt("Manhattan plane", {
      x: pX + 20, y: pY + 28, "font-size": 16, fill: C.blue,
    }, textL);
    setOpacity(scene.planeTitle, 0);

    // project coordinates into the plane
    const xs = points.map(p => p[0]);
    const ys = points.map(p => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);
    const inX = pX + 74, inY = pY + 52, inW = pW - 148, inH = pH - 104;
    const padX = minX === maxX ? 0 : spanX * 0.1;
    const padY = minY === maxY ? 0 : spanY * 0.1;
    const loX = minX - padX, hiX = maxX + padX;
    const loY = minY - padY, hiY = maxY + padY;
    const project = (x, y) => ({
      x: inX + ((x - loX) / Math.max(1e-9, hiX - loX)) * inW,
      y: inY + inH - ((y - loY) / Math.max(1e-9, hiY - loY)) * inH,
    });

    // group duplicate coordinates so their labels never sit on top of each other
    const groups = {};
    points.forEach((p, i) => {
      const key = p[0] + "," + p[1];
      (groups[key] || (groups[key] = [])).push(i);
    });
    const display = points.map(() => ({ x: 0, y: 0 }));
    for (const key in groups) {
      const ids = groups[key];
      const base = project(Number(key.split(",")[0]), Number(key.split(",")[1]));
      if (ids.length === 1) {
        display[ids[0]] = base;
      } else {
        ids.forEach((id, k) => {
          const angle = (-Math.PI / 2) + (2 * Math.PI * k) / ids.length;
          display[id] = {
            x: base.x + Math.cos(angle) * 22,
            y: base.y + Math.sin(angle) * 22,
          };
        });
      }
    }

    // ---- frontier (dashed candidate) edges -----------------------------
    for (let i = 0; i < n; i++) {
      const g = el("g", {}, arcsL);
      const line = el("line", {
        x1: 0, y1: 0, x2: 0, y2: 0,
        stroke: "#2f4d5e", "stroke-width": 1.8, "stroke-dasharray": "5 6",
      }, g);
      setOpacity(g, 0);
      scene.frontier.push({ g, line });
    }

    // ---- MST edge slots ------------------------------------------------
    for (let i = 0; i < n; i++) {
      const g = el("g", {}, arcsL);
      const line = el("line", {
        x1: 0, y1: 0, x2: 0, y2: 0,
        stroke: C.gold, "stroke-width": 3.2, "stroke-linecap": "round",
        filter: "url(#glow-gold)",
      }, g);
      const label = txt("", {
        x: 0, y: 0, "text-anchor": "middle", "font-size": 13, fill: C.gold,
      }, g);
      setOpacity(g, 0);
      scene.edgeGroups.push({ g, line, label });
    }

    // ---- points --------------------------------------------------------
    const nodeRadius = n > 7 ? 8 : 10;
    points.forEach((p, i) => {
      const d = display[i];
      const g = el("g", {}, chipsL);
      const halo = el("circle", {
        cx: d.x, cy: d.y, r: nodeRadius + 8,
        fill: "none", stroke: C.gold, "stroke-width": 3,
        filter: "url(#glow-gold)",
      }, g);
      setOpacity(halo, 0);
      const circle = el("circle", {
        cx: d.x, cy: d.y, r: nodeRadius,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, g);
      const label = txt(String(i), {
        x: d.x, y: d.y + 1, "text-anchor": "middle",
        "dominant-baseline": "central",
        "font-size": clamp(n > 7 ? 9 : 11, 9, 12), fill: C.white,
      }, g);
      const coord = txt("(" + p[0] + "," + p[1] + ")", {
        x: d.x, y: d.y + nodeRadius + 17, "text-anchor": "middle",
        "font-size": 10.5, fill: C.grey,
      }, g);
      setOpacity(g, 0);
      scene.nodes.push({ i, p, d, g, halo, circle, label, coord });
    });

    // ---- right panel: Prim table --------------------------------------
    const tX = 812, tY = 132, tW = 424, tH = 468;
    scene.tablePanel = el("g", {}, chipsL);
    el("rect", {
      x: tX, y: tY, width: tW, height: tH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.tablePanel);
    setOpacity(scene.tablePanel, 0);
    scene.tableTitle = txt("Prim frontier", {
      x: tX + 20, y: tY + 31, "font-size": 18, fill: C.gold,
    }, textL);
    setOpacity(scene.tableTitle, 0);
    txt("i", {
      x: tX + 26, y: tY + 64, "font-size": 12, fill: C.grey,
    }, textL);
    txt("point", {
      x: tX + 62, y: tY + 64, "font-size": 12, fill: C.grey,
    }, textL);
    txt("best edge", {
      x: tX + 214, y: tY + 64, "text-anchor": "end", "font-size": 12, fill: C.grey,
    }, textL);
    txt("via", {
      x: tX + 260, y: tY + 64, "font-size": 12, fill: C.grey,
    }, textL);

    const rowH = n > 7 ? 31 : 36;
    const rowsTop = tY + 82;
    points.forEach((p, i) => {
      const y = rowsTop + i * rowH;
      const g = el("g", {}, textL);
      const bg = el("rect", {
        x: tX + 14, y: y - 15, width: tW - 28, height: rowH - 5, rx: 6,
        fill: "none", stroke: "none",
      }, g);
      const idx = txt(String(i), {
        x: tX + 26, y, "font-size": 15, fill: C.blue,
      }, g);
      const point = txt("(" + p[0] + ", " + p[1] + ")", {
        x: tX + 62, y, "font-size": 14, fill: C.white,
      }, g);
      const best = txt("∞", {
        x: tX + 214, y, "text-anchor": "end", "font-size": 15, fill: C.green,
      }, g);
      const via = txt("—", {
        x: tX + 260, y, "font-size": 14, fill: C.grey,
      }, g);
      const check = txt("", {
        x: tX + tW - 32, y, "font-size": 14, fill: C.green,
      }, g);
      setOpacity(g, 0);
      scene.tableRows.push({ g, bg, idx, point, best, via, check });
    });

    scene.total = txt("total = 0", {
      x: tX + 22, y: tY + tH - 24, "font-size": 21, fill: C.green,
    }, textL);
    setOpacity(scene.total, 0);
    scene.totalNote = txt("sum of the edges added so far", {
      x: tX + 210, y: tY + tH - 24, "font-size": 12, fill: C.grey,
    }, textL);
    setOpacity(scene.totalNote, 0);

    // ---- status + result ----------------------------------------------
    scene.status = txt("", {
      x: 64, y: 618, "font-size": 20, fill: C.gold,
    }, textL);
    setOpacity(scene.status, 0);
    scene.resultBox = el("rect", {
      x: 340, y: 638, width: 600, height: 54, rx: 12,
      fill: "#111a16", stroke: C.green, "stroke-width": 2.2,
      filter: "url(#glow-green)",
    }, resultL);
    setOpacity(scene.resultBox, 0);
    scene.result = txt("", {
      x: STAGE_W / 2, y: 665, "text-anchor": "middle",
      "dominant-baseline": "central", "font-size": 27, fill: C.green,
    }, resultL);
    scene.complexity = txt("O(n²) time   ·   O(n) extra space", {
      x: STAGE_W / 2, y: 708, "text-anchor": "middle",
      "font-size": 15, fill: C.grey,
    }, resultL);

    // ---- baseline ------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.plane, scene.planeTitle,
                          scene.tablePanel, scene.tableTitle, scene.status,
                          scene.resultBox, scene.complexity, scene.total,
                          scene.totalNote]) {
        setOpacity(node, 0);
      }
      for (const row of scene.tableRows) {
        setOpacity(row.g, 0);
        row.bg.setAttribute("fill", "none");
        row.bg.setAttribute("stroke", "none");
        row.best.textContent = "∞";
        row.best.setAttribute("fill", C.green);
        row.via.textContent = "—";
        row.via.setAttribute("fill", C.grey);
        row.idx.setAttribute("fill", C.blue);
        row.point.setAttribute("fill", C.white);
        row.check.textContent = "";
      }
      for (const node of scene.nodes) {
        setOpacity(node.g, 0);
        setOpacity(node.halo, 0);
        node.circle.setAttribute("fill", C.chipFill);
        node.circle.setAttribute("stroke", C.greyDark);
        node.label.setAttribute("fill", C.white);
        node.coord.setAttribute("fill", C.grey);
      }
      for (const f of scene.frontier) setOpacity(f.g, 0);
      for (const e of scene.edgeGroups) {
        setOpacity(e.g, 0);
        e.label.textContent = "";
      }
      scene.status.textContent = "";
      scene.result.textContent = "";
      scene.total.textContent = "total = 0";
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity, setTranslate } = ctx;
    const { sim, n, points } = scene;
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

    const apply = (snap, selected) => {
      tl.add(0.45, u => {
        const e = easeOut(u);
        // points
        for (const node of scene.nodes) {
          const isUsed = snap.used[node.i];
          const isSel = node.i === selected;
          node.circle.setAttribute("fill", isSel ? "#2a2214" : (isUsed ? "#17251a" : C.chipFill));
          node.circle.setAttribute("stroke", isSel ? C.gold : (isUsed ? C.green : C.greyDark));
          node.label.setAttribute("fill", isSel ? C.gold : (isUsed ? C.green : C.white));
          setOpacity(node.halo, isSel ? e : 0);
        }
        // frontier dashed edges
        for (let i = 0; i < n; i++) {
          const f = scene.frontier[i];
          if (!snap.used[i] && snap.parent[i] >= 0 && i !== selected) {
            const from = scene.nodes[snap.parent[i]].d;
            const to = scene.nodes[i].d;
            f.line.setAttribute("x1", from.x);
            f.line.setAttribute("y1", from.y);
            f.line.setAttribute("x2", to.x);
            f.line.setAttribute("y2", to.y);
            setOpacity(f.g, 0.8);
          } else {
            setOpacity(f.g, 0);
          }
        }
        // MST edges
        for (let i = 0; i < n; i++) {
          const edge = scene.edgeGroups[i];
          if (snap.used[i] && snap.parent[i] >= 0) {
            const from = scene.nodes[snap.parent[i]].d;
            const to = scene.nodes[i].d;
            edge.line.setAttribute("x1", from.x);
            edge.line.setAttribute("y1", from.y);
            edge.line.setAttribute("x2", to.x);
            edge.line.setAttribute("y2", to.y);
            const mx = (from.x + to.x) / 2;
            const my = (from.y + to.y) / 2;
            edge.label.setAttribute("x", mx + 8);
            edge.label.setAttribute("y", my - 8);
            edge.label.textContent = String(sim.edgeCost[i]);
            setOpacity(edge.g, 1);
          } else {
            setOpacity(edge.g, 0);
          }
        }
        // table
        for (let i = 0; i < n; i++) {
          const row = scene.tableRows[i];
          const isSel = i === selected;
          row.bg.setAttribute("fill", isSel ? "#241E14" : (snap.used[i] ? "#13211a" : "none"));
          row.bg.setAttribute("stroke", isSel ? C.gold : "none");
          row.best.textContent = snap.best[i] === Infinity ? "∞" : String(snap.best[i]);
          row.best.setAttribute("fill", snap.used[i] ? C.green : (snap.best[i] === Infinity ? C.grey : C.blue));
          row.via.textContent = snap.parent[i] >= 0 ? "node " + snap.parent[i] : "—";
          row.via.setAttribute("fill", snap.parent[i] >= 0 ? C.white : C.grey);
          row.idx.setAttribute("fill", isSel ? C.gold : (snap.used[i] ? C.green : C.blue));
          row.check.textContent = snap.used[i] ? "✓" : "";
          setOpacity(row.g, 1);
        }
        scene.total.textContent = "total = " + snap.total;
        setOpacity(scene.total, 1);
        setOpacity(scene.totalNote, 1);
      }, ease.outCubic);
    };

    // ---- intro ---------------------------------------------------------
    tl.line(1);
    tl.add(0.65, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    tl.line([2, 3, 4, 5, 6]);
    tl.add(0.3, u => {
      setOpacity(scene.plane, u);
      setOpacity(scene.planeTitle, u);
      setOpacity(scene.tablePanel, u);
      setOpacity(scene.tableTitle, u);
    }, easeOut);
    for (const node of scene.nodes) {
      tl.add(0.14, u => setOpacity(node.g, u), easeOut);
      tl.wait(0.025);
    }
    for (const row of scene.tableRows) {
      tl.add(0.08, u => setOpacity(row.g, u), easeOut);
    }
    status("start the tree at point 0; best[0] = 0 and every other best starts at ∞", C.blue);
    const initial = sim.snapshots[0];
    apply(initial, -1);
    tl.wait(0.25);

    // ---- Prim iterations ----------------------------------------------
    sim.steps.forEach((step, si) => {
      const snap = sim.snapshots[si + 1];
      tl.line([8, 9, 10, 11, 12]);
      const picked = snap.best[step.node];
      status("pick unused node " + step.node + " with the cheapest edge = " + picked, C.gold);
      apply(snap, step.node);
      tl.add(0.4, u => {
        const node = scene.nodes[step.node];
        node.circle.setAttribute("stroke", C.gold);
      }, easeOut);

      if (step.parent >= 0) {
        tl.line([13, 14]);
        status("attach (" + points[step.node].join(", ") + ") to node " + step.parent +
          "  ·  edge costs " + picked + "  ·  total = " + snap.total, C.green);
      } else {
        tl.line(14);
        status("node 0 is the root; no edge is added", C.green);
      }
      if (step.changes.length) {
        tl.line(15);
        const parts = step.changes.map(ch => "best[" + ch.i + "] = " + ch.dist);
        status("relax the frontier: " + parts.join(", "), C.blue);
      } else {
        tl.line(15);
        status("no frontier distance improves", C.grey);
      }
      tl.wait(0.18);
    });

    // ---- final ---------------------------------------------------------
    tl.line(16);
    status("all " + n + " points are in one tree  →  return " + sim.total, C.green);
    tl.add(0.4, u => setOpacity(scene.resultBox, u), easeOut);
    scene.result.textContent = "return " + sim.total;
    tl.add(0.55, schematicWriter(scene, scene.result), ease.linear);
    tl.add(0.4, schematicWriter(scene, scene.complexity), ease.linear);
    tl.wait(1.1);

    return tl.finish();
  },
};

function schematicWriter(scene, node) {
  return scene.writer(node);
}

/* ------------------------------------------------------------------ *
 * Simulation: Prim's algorithm with one snapshot per iteration.
 * ------------------------------------------------------------------ */
function simulatePrim(points) {
  const n = points.length;
  const best = new Array(n).fill(Infinity);
  const parent = new Array(n).fill(-1);
  const used = new Array(n).fill(false);
  best[0] = 0;

  const snapshots = [{
    best: best.slice(), parent: parent.slice(), used: used.slice(), total: 0,
  }];
  const steps = [];
  let total = 0;

  for (let it = 0; it < n; it++) {
    let node = -1;
    for (let i = 0; i < n; i++) {
      if (!used[i] && (node === -1 || best[i] < best[node])) node = i;
    }
    used[node] = true;
    total += best[node];

    const changes = [];
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      const dist = Math.abs(points[node][0] - points[i][0]) +
        Math.abs(points[node][1] - points[i][1]);
      if (dist < best[i]) {
        best[i] = dist;
        parent[i] = node;
        changes.push({ i, dist });
      }
    }

    steps.push({ node, parent: parent[node], changes, total });
    snapshots.push({
      best: best.slice(), parent: parent.slice(), used: used.slice(), total,
    });
  }

  const edgeCost = new Array(n).fill(0);
  for (let i = 0; i < n; i++) edgeCost[i] = best[i];

  return { steps, snapshots, total, edgeCost };
}
