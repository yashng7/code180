/* Cheapest Flights Within K Stops — animated Bellman-Ford scene.
 *
 * Each round relaxes every flight using the distances from the *previous*
 * round, so after round r only paths with at most r edges are represented.
 * The right panel shows the frozen `dist` row and the growing `next` row,
 * making the stop limit visible: an update in this round cannot be extended
 * again until the next round.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Cheapest Flights Within K Stops",
    subtitle: "Bellman-Ford by rounds · at most k+1 edges · O(k·E)",
    inputs: [
      {
        id: "flights",
        label: "flights (u,v,price)",
        type: "text",
        default: "0,1,100; 1,2,100; 2,0,100; 1,3,600; 2,3,200",
        width: "wide",
      },
      { id: "n", label: "n", type: "number", default: 4 },
      { id: "src", label: "src", type: "number", default: 0 },
      { id: "dst", label: "dst", type: "number", default: 3 },
      { id: "k", label: "k", type: "number", default: 1 },
    ],
    legend: [
      { color: "#58C4DD", text: "relaxed edge" },
      { color: "#F0AC5F", text: "improved `next` value" },
      { color: "#83C167", text: "cheapest known price" },
      { color: "#FC6255", text: "edge cannot improve" },
    ],
  },

  code: [
    "def find_cheapest_price(n: int, flights: List[List[int]],",
    "                       src: int, dst: int, k: int) -> int:",
    "    INF = float('inf')",
    "    dist = [INF] * n",
    "    dist[src] = 0",
    "    for _ in range(k + 1):",
    "        nxt = dist[:]",
    "        for u, v, price in flights:",
    "            if dist[u] != INF and dist[u] + price < nxt[v]:",
    "                nxt[v] = dist[u] + price",
    "        dist = nxt",
    "    return -1 if dist[dst] == INF else int(dist[dst])",
  ],

  read(values) {
    const n = Number(values.n);
    const src = Number(values.src);
    const dst = Number(values.dst);
    const k = Number(values.k);
    if (![n, src, dst, k].every(Number.isInteger)) return null;
    if (n < 1 || n > 8 || src < 0 || src >= n || dst < 0 || dst >= n || k < 0 || k > 8) return null;

    const raw = String(values.flights || "").trim();
    const flights = [];
    if (raw) {
      for (const part of raw.split(/[;\n]+/)) {
        const piece = part.trim();
        if (!piece) continue;
        const nums = piece.split(/[\s,]+/).filter(Boolean).map(Number);
        if (nums.length !== 3 || !nums.every(Number.isInteger)) return null;
        const [u, v, price] = nums;
        if (u < 0 || u >= n || v < 0 || v >= n) return null;
        if (price < 0 || price > 9999) return null;
        flights.push([u, v, price]);
      }
    }
    if (flights.length > 16) return null;
    return { flights, n, src, dst, k };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || args.length < 5) return null;
    const n = Number(args[0]);
    const flights = args[1];
    const src = Number(args[2]);
    const dst = Number(args[3]);
    const k = Number(args[4]);
    if (!Array.isArray(flights) || ![n, src, dst, k].every(Number.isInteger)) return null;
    if (n < 1 || n > 8 || src < 0 || src >= n || dst < 0 || dst >= n || k < 0 || k > 8) return null;
    const rows = [];
    for (const edge of flights) {
      if (!Array.isArray(edge) || edge.length !== 3) return null;
      const [u, v, price] = edge.map(Number);
      if (![u, v, price].every(Number.isInteger)) return null;
      if (u < 0 || u >= n || v < 0 || v >= n || price < 0) return null;
      rows.push(u + "," + v + "," + price);
    }
    return { flights: rows.join("; "), n, src, dst, k };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, STAGE_W } = ctx;
    const { flights, n, src, dst, k } = params;
    const sim = simulateFlights(flights, n, src, dst, k);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-red", C.red);

    const marker = el("marker", {
      id: "flight-arrow", viewBox: "0 0 10 10", refX: 9, refY: 5,
      markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
    }, ctx.defs);
    el("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: C.grey }, marker);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const arcsL = ctx.layer("arcs");
    const resultL = ctx.layer("result");

    const scene = {
      flights, n, src, dst, k, sim, nodes: [], edges: [], rows: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title ---------------------------------------------------------
    scene.title = txt("Cheapest Flights Within K Stops", {
      x: 64, y: 64, "font-size": 39, fill: C.white, "letter-spacing": 0.2,
    }, textL);
    scene.subtitle = txt(
      n + " cities   ·   " + src + " → " + dst + "   ·   at most k = " + k +
      " stop" + (k === 1 ? "" : "s") + "  (" + (k + 1) + " flights)",
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
    scene.graphTitle = txt("flight network", {
      x: gX + 20, y: gY + 28, "font-size": 16, fill: C.blue,
    }, textL);
    setOpacity(scene.graphTitle, 0);

    const cx = gX + gW / 2;
    const cy = gY + gH / 2 + 8;
    const ringR = n <= 2 ? 80 : (n <= 4 ? 142 : (n <= 6 ? 175 : 190));
    const positions = {};
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
      positions[i] = {
        x: cx + Math.cos(angle) * ringR,
        y: cy + Math.sin(angle) * ringR,
      };
    }
    const nodeR = n > 6 ? 18 : 22;

    flights.forEach(([u, v, price], idx) => {
      const a = positions[u], b = positions[v];
      const g = el("g", {}, arcsL);
      let line;
      if (u === v) {
        line = el("path", {
          d: "M " + (a.x - 14) + " " + (a.y - nodeR) +
             " C " + (a.x - 34) + " " + (a.y - 66) +
             ", " + (a.x + 34) + " " + (a.y - 66) +
             ", " + (a.x + 14) + " " + (a.y - nodeR),
          fill: "none", stroke: C.grey, "stroke-width": 2,
          "marker-end": "url(#flight-arrow)",
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
          "marker-end": "url(#flight-arrow)",
        }, g);
      }
      const mx = (a.x + b.x) / 2 - (u === v ? 0 : 10);
      const my = (a.y + b.y) / 2 - 9 - (idx % 2) * 3;
      const label = txt("$" + price, {
        x: mx, y: my, "text-anchor": "middle",
        "font-size": 13, fill: C.gold,
        stroke: "#0b1019", "stroke-width": 4, "paint-order": "stroke",
      }, g);
      setOpacity(g, 0);
      scene.edges.push({ g, line, label, u, v, price });
    });

    for (let i = 0; i < n; i++) {
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
      const tag = txt(i === src ? "src" : (i === dst ? "dst" : ""), {
        x: pos.x, y: pos.y + nodeR + 18, "text-anchor": "middle",
        "font-size": 12, fill: i === src ? C.blue : C.green,
      }, g);
      setOpacity(g, 0);
      scene.nodes.push({ i, pos, g, halo, circle, label, tag, radius: nodeR });
    }

    // ---- right panel ---------------------------------------------------
    const rX = 780, rY = 132, rW = 464, rH = 480;
    scene.sidePanel = el("g", {}, chipsL);
    el("rect", {
      x: rX, y: rY, width: rW, height: rH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.sidePanel);
    setOpacity(scene.sidePanel, 0);
    scene.roundTitle = txt("round 0 / " + (k + 1), {
      x: rX + 20, y: rY + 34, "font-size": 21, fill: C.gold,
    }, textL);
    setOpacity(scene.roundTitle, 0);
    scene.roundHint = txt("dist is frozen · next is being relaxed", {
      x: rX + 20, y: rY + 58, "font-size": 12, fill: C.grey,
    }, textL);
    setOpacity(scene.roundHint, 0);
    scene.roundNote = txt("start: dist[src] = 0", {
      x: rX + 20, y: rY + 82, "font-size": 12, fill: C.blue,
    }, textL);
    setOpacity(scene.roundNote, 0);

    txt("city", {
      x: rX + 26, y: rY + 112, "font-size": 12, fill: C.grey,
    }, textL);
    txt("dist (previous)", {
      x: rX + 178, y: rY + 112, "text-anchor": "end", "font-size": 12, fill: C.grey,
    }, textL);
    txt("next (this round)", {
      x: rX + rW - 34, y: rY + 112, "text-anchor": "end", "font-size": 12, fill: C.grey,
    }, textL);

    const rowH = n > 6 ? 33 : 37;
    const rowsTop = rY + 132;
    for (let i = 0; i < n; i++) {
      const y = rowsTop + i * rowH;
      const g = el("g", {}, textL);
      const bg = el("rect", {
        x: rX + 14, y: y - 15, width: rW - 28, height: rowH - 5, rx: 6,
        fill: "none", stroke: "none",
      }, g);
      const city = txt(String(i) + (i === src ? "  src" : (i === dst ? "  dst" : "")), {
        x: rX + 28, y, "font-size": 14, fill: i === src ? C.blue : (i === dst ? C.green : C.white),
      }, g);
      const dist = txt("∞", {
        x: rX + 178, y, "text-anchor": "end", "font-size": 14, fill: C.grey,
      }, g);
      const next = txt("∞", {
        x: rX + rW - 34, y, "text-anchor": "end", "font-size": 14, fill: C.blue,
      }, g);
      setOpacity(g, 0);
      scene.rows.push({ g, bg, city, dist, next, i });
    }

    scene.bottomNote = txt("", {
      x: rX + 20, y: rY + rH - 22, "font-size": 12, fill: C.grey,
    }, textL);
    setOpacity(scene.bottomNote, 0);

    // ---- status + result ----------------------------------------------
    scene.status = txt("", {
      x: 64, y: 608, "font-size": 19, fill: C.gold,
    }, textL);
    setOpacity(scene.status, 0);
    scene.resultBox = el("rect", {
      x: 310, y: 636, width: 660, height: 58, rx: 12,
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
      "font-size": 13, fill: C.grey,
    }, resultL);

    // ---- baseline ------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.graphPanel, scene.graphTitle,
                          scene.sidePanel, scene.roundTitle, scene.roundHint,
                          scene.roundNote, scene.bottomNote, scene.status,
                          scene.resultBox, scene.note]) {
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
      }
      for (const row of scene.rows) {
        setOpacity(row.g, 0);
        row.bg.setAttribute("fill", "none");
        row.bg.setAttribute("stroke", "none");
        row.dist.textContent = "∞";
        row.dist.setAttribute("fill", C.grey);
        row.next.textContent = "∞";
        row.next.setAttribute("fill", C.blue);
      }
      scene.roundTitle.textContent = "round 0 / " + (k + 1);
      scene.roundNote.textContent = "start: dist[src] = 0";
      scene.bottomNote.textContent = "";
      scene.status.textContent = "";
      scene.result.textContent = "";
      scene.note.textContent = "";
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity } = ctx;
    const { sim, n, src, dst, k, flights } = scene;
    const easeOut = ease.outCubic;

    scene.reset();

    const status = (text, color, log) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || C.gold);
        setOpacity(scene.status, 1);
      });
      if (log) tl.log(text, color || C.gold);
    };

    const fmt = v => (v === Infinity ? "∞" : String(v));

    const apply = (snap, activeNode, activeEdge, roundNo) => {
      tl.add(0.35, u => {
        for (const node of scene.nodes) {
          const isActive = node.i === activeNode;
          const hasNext = snap.next[node.i] !== Infinity;
          node.circle.setAttribute("fill", isActive ? "#2a2214" : (hasNext ? "#17251a" : C.chipFill));
          node.circle.setAttribute("stroke", isActive ? C.gold : (hasNext ? C.green : C.greyDark));
          node.label.setAttribute("fill", isActive ? C.gold : (hasNext ? C.green : C.white));
          setOpacity(node.halo, isActive ? u : 0);
        }
        scene.edges.forEach((edge, idx) => {
          const hot = idx === activeEdge;
          edge.line.setAttribute("stroke", hot ? C.blue : C.grey);
          edge.line.setAttribute("stroke-width", hot ? 3.2 : 2);
          edge.label.setAttribute("fill", hot ? C.white : C.gold);
          setOpacity(edge.g, hot ? 1 : 0.82);
        });
        for (const row of scene.rows) {
          const d = snap.dist[row.i];
          const nx = snap.next[row.i];
          const isActive = row.i === activeNode;
          row.bg.setAttribute("fill", isActive ? "#241E14" : "none");
          row.bg.setAttribute("stroke", isActive ? C.gold : "none");
          row.city.setAttribute("fill", isActive ? C.gold : (row.i === src ? C.blue : (row.i === dst ? C.green : C.white)));
          row.dist.textContent = fmt(d);
          row.dist.setAttribute("fill", d === Infinity ? C.grey : C.white);
          row.next.textContent = fmt(nx);
          row.next.setAttribute("fill", nx === Infinity ? C.grey : (nx < d ? C.gold : C.blue));
          setOpacity(row.g, 1);
        }
        scene.roundTitle.textContent = "round " + roundNo + " / " + (k + 1);
        setOpacity(scene.roundTitle, 1);
      }, ease.outCubic);
    };

    // ---- intro ---------------------------------------------------------
    tl.line(1);
    tl.add(0.65, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    tl.line([2, 3, 4, 5]);
    tl.add(0.3, u => {
      setOpacity(scene.graphPanel, u);
      setOpacity(scene.graphTitle, u);
      setOpacity(scene.sidePanel, u);
      setOpacity(scene.roundHint, u);
      setOpacity(scene.roundNote, u);
      setOpacity(scene.bottomNote, u);
    }, easeOut);
    for (const edge of scene.edges) {
      tl.add(0.1, u => setOpacity(edge.g, u), easeOut);
    }
    for (const node of scene.nodes) {
      tl.add(0.11, u => setOpacity(node.g, u), easeOut);
      tl.wait(0.015);
    }
    for (const row of scene.rows) {
      tl.add(0.05, u => setOpacity(row.g, u), easeOut);
    }
    status("start: dist[" + src + "] = 0, every other city is ∞", C.blue, true);
    apply(sim.initial, src, -1, 0);
    tl.wait(0.2);

    // ---- Bellman-Ford rounds ------------------------------------------
    sim.rounds.forEach(round => {
      tl.line(6);
      status("round " + round.no + ": copy dist into next; only paths with at most " +
        round.no + " edge" + (round.no === 1 ? "" : "s") + " are allowed", C.blue, true);
      apply(round.start, -1, -1, round.no);
      tl.wait(0.2);

      round.events.forEach(ev => {
        tl.line([7, 8]);
        if (ev.accepted) {
          status("flight " + ev.u + " → " + ev.v + " (" + ev.price + "): " +
            fmt(ev.distU) + " + " + ev.price + " = " + ev.newNext +
            "  <  " + fmt(ev.oldNext) + "  →  next[" + ev.v + "] improves", C.green);
          tl.line([9]);
        } else {
          const reason = ev.distU === Infinity ? "source price is ∞" :
            (ev.distU + ev.price) + " ≥ next[" + ev.v + "]";
          status("flight " + ev.u + " → " + ev.v + " (" + ev.price + "):  " + reason + "  →  no update", C.grey);
        }
        apply(ev.snapshot, ev.u, ev.idx, round.no);
        tl.wait(0.06);
      });

      tl.line(10);
      status("round " + round.no + " complete  ·  dist = next  ·  dist[" + dst + "] = " +
        fmt(round.end.next[dst]), C.gold, true);
      apply(round.end, -1, -1, round.no);
      tl.wait(0.25);
    });

    // ---- answer --------------------------------------------------------
    tl.line(11);
    const answer = sim.result;
    if (answer === null) {
      status("dist[" + dst + "] is still ∞  →  no route within " + k + " stops", C.red, true);
      tl.add(0.4, u => {
        scene.resultBox.setAttribute("fill", "#1d1416");
        scene.resultBox.setAttribute("stroke", C.red);
        scene.resultBox.setAttribute("filter", "url(#glow-red)");
        setOpacity(scene.resultBox, u);
      }, easeOut);
      scene.result.textContent = "return -1";
      scene.result.setAttribute("fill", C.red);
      tl.add(0.5, scene.writer(scene.result), ease.linear);
      scene.note.textContent = "destination " + dst + " was never reached";
      tl.add(0.35, scene.writer(scene.note), ease.linear);
    } else {
      status("cheapest price after " + (k + 1) + " relaxation round(s) is " + answer, C.green, true);
      tl.add(0.4, u => setOpacity(scene.resultBox, u), easeOut);
      scene.result.textContent = "return " + answer;
      tl.add(0.55, scene.writer(scene.result), ease.linear);
      scene.note.textContent = "route uses at most " + (k + 1) + " flight" +
        (k + 1 === 1 ? "" : "s") + "  ·  " + k + " stop" + (k === 1 ? "" : "s");
      tl.add(0.35, scene.writer(scene.note), ease.linear);
    }
    tl.wait(1.1);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Simulation: Bellman-Ford with snapshots after every edge relaxation.
 * ------------------------------------------------------------------ */
function simulateFlights(flights, n, src, dst, k) {
  const INF = Infinity;
  let dist = new Array(n).fill(INF);
  dist[src] = 0;
  const initial = { dist: dist.slice(), next: dist.slice() };

  const rounds = [];
  for (let round = 1; round <= k + 1; round++) {
    let next = dist.slice();
    const start = { dist: dist.slice(), next: next.slice() };
    const events = [];
    flights.forEach(([u, v, price], idx) => {
      const distU = dist[u];
      const oldNext = next[v];
      const accepted = distU !== INF && distU + price < oldNext;
      if (accepted) next[v] = distU + price;
      events.push({
        idx, u, v, price, distU, oldNext, accepted,
        newNext: distU === INF ? INF : distU + price,
        snapshot: { dist: dist.slice(), next: next.slice() },
      });
    });
    dist = next;
    rounds.push({
      no: round,
      start,
      events,
      end: { dist: dist.slice(), next: dist.slice() },
    });
  }

  const result = dist[dst] === INF ? null : dist[dst];
  return { initial, rounds, result, dist };
}
