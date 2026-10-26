/* Reconstruct Itinerary — animated Eulerian-path walkthrough scene.
 *
 * The tickets are grouped into reverse-sorted adjacency lists. Hierholzer's
 * algorithm walks from JFK, always popping the smallest unused destination
 * onto the stack; only when a city has no unused ticket left does it move the
 * city onto the post-order route. Reversing that route is the itinerary.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Reconstruct Itinerary",
    subtitle: "Hierholzer · sorted adjacency lists · O(E log E)",
    inputs: [
      {
        id: "tickets",
        label: "tickets",
        type: "text",
        default: "JFK->MUC; MUC->LHR; LHR->SFO; SFO->SJC",
        width: "wide",
      },
    ],
    legend: [
      { color: "#58C4DD", text: "unused ticket" },
      { color: "#F0AC5F", text: "stack / current city" },
      { color: "#83C167", text: "post-order route" },
      { color: "#FC6255", text: "consumed ticket" },
    ],
  },

  code: [
    "def find_itinerary(tickets: List[List[str]]) -> List[str]:",
    "    graph: Dict[str, List[str]] = defaultdict(list)",
    "    for src, dst in tickets:",
    "        graph[src].append(dst)",
    "    for src in graph:",
    "        graph[src].sort(reverse=True)",
    "    route: List[str] = []",
    '    stack: List[str] = ["JFK"]',
    "    while stack:",
    "        node = stack[-1]",
    "        if graph[node]:",
    "            stack.append(graph[node].pop())",
    "        else:",
    "            route.append(stack.pop())",
    "    route.reverse()",
    "    return route",
  ],

  read(values) {
    const raw = String(values.tickets || "").trim();
    if (!raw) return null;
    const tickets = [];
    for (const part of raw.split(/[;\n]+/)) {
      const piece = part.trim();
      if (!piece) continue;
      const m = piece.split(/\s*(?:->|→|=>)\s*/);
      if (m.length !== 2) return null;
      const from = m[0].trim().toUpperCase();
      const to = m[1].trim().toUpperCase();
      if (!/^[A-Z]{2,4}$/.test(from) || !/^[A-Z]{2,4}$/.test(to)) return null;
      tickets.push([from, to]);
    }
    if (tickets.length < 1 || tickets.length > 7) return null;
    return { tickets };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || !Array.isArray(args[0])) return null;
    const tickets = [];
    for (const pair of args[0]) {
      if (!Array.isArray(pair) || pair.length !== 2) return null;
      const from = String(pair[0]).toUpperCase();
      const to = String(pair[1]).toUpperCase();
      if (!/^[A-Z]{2,4}$/.test(from) || !/^[A-Z]{2,4}$/.test(to)) return null;
      tickets.push([from, to]);
    }
    if (tickets.length < 1 || tickets.length > 7) return null;
    return { tickets: tickets.map(p => p[0] + "->" + p[1]).join("; ") };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, STAGE_W } = ctx;
    const { tickets } = params;
    const sim = simulateItinerary(tickets);
    const sources = sim.sources;
    const maxStack = sim.maxStack;
    const maxRoute = sim.maxRoute;

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-red", C.red);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const resultL = ctx.layer("result");

    const scene = {
      tickets, sim, sources, adjRows: [], stackRows: [], routeRows: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title ---------------------------------------------------------
    scene.title = txt("Reconstruct Itinerary", {
      x: 64, y: 64, "font-size": 40, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    scene.subtitle = txt(
      tickets.length + " tickets   ·   start at JFK   ·   use every ticket exactly once",
      { x: 64, y: 101, "font-size": 18, fill: C.grey },
      textL
    );
    setOpacity(scene.subtitle, 0);

    // ---- adjacency panel ----------------------------------------------
    const aX = 48, aY = 136, aW = 540, aH = 422;
    scene.adjPanel = el("g", {}, chipsL);
    el("rect", {
      x: aX, y: aY, width: aW, height: aH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.adjPanel);
    setOpacity(scene.adjPanel, 0);
    scene.adjTitle = txt("adjacency lists · reverse-sorted", {
      x: aX + 20, y: aY + 31, "font-size": 18, fill: C.blue,
    }, textL);
    setOpacity(scene.adjTitle, 0);
    scene.adjHint = txt("pop() takes the last chip = smallest destination", {
      x: aX + 20, y: aY + aH - 18, "font-size": 13, fill: C.grey,
    }, textL);
    setOpacity(scene.adjHint, 0);

    const maxDest = Math.max(1, ...sources.map(src => sim.lists[src].length));
    const rowGap = Math.min(58, 334 / Math.max(1, sources.length));
    const rowTop = aY + 58;
    const chipGap = 9;
    const chipW = clamp((aW - 138 - chipGap * (maxDest - 1)) / maxDest, 42, 64);
    const chipH = 34;
    sources.forEach((src, rowIdx) => {
      const y = rowTop + rowIdx * rowGap;
      const g = el("g", {}, chipsL);
      setOpacity(g, 0);
      const badge = el("rect", {
        x: aX + 20, y, width: 62, height: 36, rx: 8,
        fill: "#142636", stroke: C.blue, "stroke-width": 1.6,
      }, g);
      const badgeTxt = txt(src, {
        x: aX + 51, y: y + 18, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": 16, fill: C.blue,
      }, g);
      txt("→", {
        x: aX + 96, y: y + 18, "font-size": 15, fill: C.grey,
        "dominant-baseline": "central",
      }, g);

      const chips = [];
      sim.lists[src].forEach((dst, chipIdx) => {
        const cx = aX + 118 + chipIdx * (chipW + chipGap);
        const cg = el("g", {}, g);
        const rect = el("rect", {
          x: cx, y: y + 1, width: chipW, height: chipH, rx: 7,
          fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.6,
        }, cg);
        const label = txt(dst, {
          x: cx + chipW / 2, y: y + 18, "text-anchor": "middle",
          "dominant-baseline": "central",
          "font-size": clamp(chipW * 0.24, 10, 15), fill: C.white,
        }, cg);
        chips.push({ g: cg, rect, label, dst });
      });
      scene.adjRows.push({ src, g, badge, badgeTxt, chips, y });
    });

    // ---- stack panel ---------------------------------------------------
    const sX = 608, sY = 136, sW = 300, sH = 422;
    scene.stackPanel = el("g", {}, chipsL);
    el("rect", {
      x: sX, y: sY, width: sW, height: sH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.stackPanel);
    setOpacity(scene.stackPanel, 0);
    scene.stackTitle = txt("stack", {
      x: sX + 20, y: sY + 31, "font-size": 18, fill: C.gold,
    }, textL);
    setOpacity(scene.stackTitle, 0);
    scene.stackHint = txt("top = last item", {
      x: sX + sW - 20, y: sY + 31, "text-anchor": "end",
      "font-size": 13, fill: C.grey,
    }, textL);
    setOpacity(scene.stackHint, 0);

    for (let i = 0; i < maxStack; i++) {
      const y = sY + 58 + i * 43;
      const g = el("g", {}, chipsL);
      const rect = el("rect", {
        x: sX + 20, y, width: sW - 40, height: 34, rx: 8,
        fill: "#1d1810", stroke: C.gold, "stroke-width": 1.6,
      }, g);
      const idx = txt(String(i), {
        x: sX + 36, y: y + 17, "font-size": 12, fill: C.grey,
        "dominant-baseline": "central",
      }, g);
      const label = txt("", {
        x: sX + 70, y: y + 17, "font-size": 17, fill: C.gold,
        "dominant-baseline": "central",
      }, g);
      setOpacity(g, 0);
      scene.stackRows.push({ g, rect, idx, label });
    }

    // ---- route panel ---------------------------------------------------
    const rX = 928, rY = 136, rW = 304, rH = 422;
    scene.routePanel = el("g", {}, chipsL);
    el("rect", {
      x: rX, y: rY, width: rW, height: rH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.routePanel);
    setOpacity(scene.routePanel, 0);
    scene.routeTitle = txt("post-order route", {
      x: rX + 20, y: rY + 31, "font-size": 18, fill: C.green,
    }, textL);
    setOpacity(scene.routeTitle, 0);
    scene.routeHint = txt("dead end → append, then pop", {
      x: rX + 20, y: rY + 53, "font-size": 12, fill: C.grey,
    }, textL);
    setOpacity(scene.routeHint, 0);

    for (let i = 0; i < maxRoute; i++) {
      const y = rY + 76 + i * 41;
      const g = el("g", {}, chipsL);
      const rect = el("rect", {
        x: rX + 20, y, width: rW - 40, height: 32, rx: 7,
        fill: "#17251a", stroke: C.green, "stroke-width": 1.5,
      }, g);
      const label = txt("", {
        x: rX + 38, y: y + 16, "font-size": 16, fill: C.green,
        "dominant-baseline": "central",
      }, g);
      setOpacity(g, 0);
      scene.routeRows.push({ g, rect, label });
    }

    // ---- status + result ----------------------------------------------
    scene.status = txt("", {
      x: 64, y: 600, "font-size": 20, fill: C.gold,
    }, textL);
    setOpacity(scene.status, 0);
    scene.resultBox = el("rect", {
      x: 64, y: 628, width: 1152, height: 62, rx: 12,
      fill: "#111a16", stroke: C.green, "stroke-width": 2.2,
      filter: "url(#glow-green)",
    }, resultL);
    setOpacity(scene.resultBox, 0);
    scene.result = txt("", {
      x: STAGE_W / 2, y: 659, "text-anchor": "middle",
      "dominant-baseline": "central", "font-size": 24, fill: C.green,
    }, resultL);
    scene.resultLabel = txt("itinerary", {
      x: 84, y: 659, "dominant-baseline": "central",
      "font-size": 14, fill: C.grey,
    }, resultL);
    setOpacity(scene.resultLabel, 0);

    // ---- baseline ------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.adjPanel, scene.adjTitle,
                          scene.adjHint, scene.stackPanel, scene.stackTitle,
                          scene.stackHint, scene.routePanel, scene.routeTitle,
                          scene.routeHint, scene.status, scene.resultBox,
                          scene.resultLabel]) {
        setOpacity(node, 0);
      }
      for (const row of scene.adjRows) {
        setOpacity(row.g, 0);
        row.badge.setAttribute("fill", "#142636");
        row.badge.setAttribute("stroke", C.blue);
        row.badgeTxt.setAttribute("fill", C.blue);
        for (const chip of row.chips) {
          chip.g.style.opacity = "1";
          chip.rect.setAttribute("fill", C.chipFill);
          chip.rect.setAttribute("stroke", C.greyDark);
          chip.label.setAttribute("fill", C.white);
        }
      }
      for (const row of scene.stackRows) {
        setOpacity(row.g, 0);
        row.label.textContent = "";
      }
      for (const row of scene.routeRows) {
        setOpacity(row.g, 0);
        row.label.textContent = "";
      }
      scene.status.textContent = "";
      scene.result.textContent = "";
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity } = ctx;
    const { sim, sources } = scene;
    const easeOut = ease.outCubic;
    const easeInOut = ease.inOutSine;

    scene.reset();

    const status = (text, color) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || C.gold);
        setOpacity(scene.status, 1);
      });
      tl.log(text, color || C.gold);
    };

    const apply = snapshot => {
      tl.add(0.28, u => {
        const e = easeInOut(u);
        // adjacency chips
        for (const row of scene.adjRows) {
          const used = snapshot.used[row.src] || [];
          row.chips.forEach((chip, i) => {
            const spent = used[i];
            chip.rect.setAttribute("fill", spent ? "#241417" : C.chipFill);
            chip.rect.setAttribute("stroke", spent ? C.red : C.greyDark);
            chip.label.setAttribute("fill", spent ? C.red : C.white);
            setOpacity(chip.g, spent ? 0.55 : 1);
          });
          const active = sim.events[snapshot.eventIndex] &&
            sim.events[snapshot.eventIndex].from === row.src;
          row.badge.setAttribute("fill", active ? "#241E14" : "#142636");
          row.badge.setAttribute("stroke", active ? C.gold : C.blue);
          row.badgeTxt.setAttribute("fill", active ? C.gold : C.blue);
        }
        // stack
        scene.stackRows.forEach((row, i) => {
          if (i < snapshot.stack.length) {
            row.label.textContent = snapshot.stack[i];
            setOpacity(row.g, i === snapshot.stack.length - 1 ? 1 : 0.75 * e + 0.25);
            row.rect.setAttribute("stroke", i === snapshot.stack.length - 1 ? C.gold : "#7a633f");
            row.label.setAttribute("fill", i === snapshot.stack.length - 1 ? C.gold : C.white);
          } else {
            setOpacity(row.g, 0);
          }
        });
        // route
        scene.routeRows.forEach((row, i) => {
          if (i < snapshot.route.length) {
            row.label.textContent = snapshot.route[i];
            setOpacity(row.g, u);
          } else {
            setOpacity(row.g, 0);
          }
        });
      }, easeOut);
    };

    // ---- intro ---------------------------------------------------------
    tl.line(1);
    tl.add(0.65, scene.writer(scene.title), easeOut);
    tl.add(0.4, u => setOpacity(scene.subtitle, u), easeOut);
    tl.line([2, 3, 4]);
    for (const node of [scene.adjPanel, scene.adjTitle, scene.adjHint,
                        scene.stackPanel, scene.stackTitle, scene.stackHint,
                        scene.routePanel, scene.routeTitle, scene.routeHint]) {
      tl.add(0.2, u => setOpacity(node, u), easeOut);
    }
    for (const row of scene.adjRows) {
      tl.add(0.16, u => setOpacity(row.g, u), easeOut);
      tl.wait(0.03);
    }
    tl.line([5, 6]);
    status("sort every adjacency list descending so pop() yields the smallest destination", C.blue);
    const initial = {
      stack: ["JFK"], route: [], used: sim.emptyUsed(), eventIndex: -1,
    };
    apply(initial);
    tl.wait(0.2);

    // ---- Hierholzer events --------------------------------------------
    sim.events.forEach((ev, i) => {
      const snap = ev.snapshot;
      snap.eventIndex = i;
      if (ev.kind === "push") {
        tl.line([10, 11, 12]);
        apply(snap);
        status("pop " + sim.lists[ev.from][ev.chip] + " and push it from " + ev.from + " → " + ev.to, C.gold);
        tl.add(0.18, u => {
          const row = scene.adjRows.find(r => r.src === ev.from);
          if (!row) return;
          const chip = row.chips[ev.chip];
          if (chip) chip.rect.setAttribute("stroke", C.red);
        });
      } else if (ev.kind === "pop") {
        tl.line([13, 14]);
        apply(snap);
        status(ev.node + " has no unused ticket left  →  pop to route", C.green);
        tl.add(0.25, u => {
          const row = scene.stackRows[snap.stack.length];
          if (row) setOpacity(row.g, 1 - u);
        });
      }
      tl.wait(0.14);
    });

    // ---- reverse and finish -------------------------------------------
    tl.line([15, 16]);
    status("reverse the post-order route  →  " + sim.result.join(" → "), C.green);
    tl.add(0.45, u => {
      let resultText = "";
      for (let i = 0; i < sim.result.length; i++) {
        resultText += (i ? "  →  " : "") + sim.result[i];
      }
      scene.result.textContent = resultText;
      setOpacity(scene.resultBox, u);
      setOpacity(scene.resultLabel, u);
    }, easeOut);
    tl.add(0.5, scene.writer(scene.result), ease.linear);
    tl.wait(1.2);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Simulation: exact Hierholzer trace with per-event snapshots.
 * ------------------------------------------------------------------ */
function simulateItinerary(tickets) {
  const graph = {};
  for (const [from, to] of tickets) {
    if (!graph[from]) graph[from] = [];
    graph[from].push(to);
  }
  const sources = Object.keys(graph).sort();
  const lists = {};
  for (const src of sources) lists[src] = graph[src].slice().sort().reverse();

  const used = {};
  for (const src of sources) used[src] = lists[src].map(() => false);

  const empty = () => {
    const copy = {};
    for (const src of sources) copy[src] = used[src].map(() => false);
    return copy;
  };

  const cloneUsed = () => {
    const copy = {};
    for (const src of sources) copy[src] = used[src].slice();
    return copy;
  };

  const stack = ["JFK"];
  const route = [];
  const events = [];
  let maxStack = 1;
  let maxRoute = 0;

  const snapshot = () => ({
    stack: stack.slice(),
    route: route.slice(),
    used: cloneUsed(),
  });

  while (stack.length) {
    const node = stack[stack.length - 1];
    const list = lists[node] || [];
    let chip = -1;
    for (let i = 0; i < list.length; i++) {
      if (!used[node][i]) { chip = i; break; }
    }
    if (chip >= 0) {
      const dst = list[chip];
      used[node][chip] = true;
      stack.push(dst);
      maxStack = Math.max(maxStack, stack.length);
      events.push({
        kind: "push", from: node, to: dst, chip,
        snapshot: snapshot(),
      });
    } else {
      stack.pop();
      route.push(node);
      maxRoute = Math.max(maxRoute, route.length);
      events.push({ kind: "pop", node, snapshot: snapshot() });
    }
  }

  const result = route.slice().reverse();
  return {
    sources, lists, events, result, maxStack, maxRoute,
    emptyUsed: empty,
  };
}
