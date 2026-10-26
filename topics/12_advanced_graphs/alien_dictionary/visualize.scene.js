/* Alien Dictionary — animated constraint + topological-sort scene.
 *
 * Adjacent words give one ordering constraint: their first differing letter
 * must come before the other. After collecting those directed edges, Kahn's
 * algorithm repeatedly pops the lexicographically smallest zero-indegree
 * letter. A cycle (or a word that is a prefix of an earlier word) means the
 * dictionary is impossible and the answer is "".
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Alien Dictionary",
    subtitle: "first differing letter → edge · Kahn's topological sort",
    inputs: [
      {
        id: "words",
        label: "words",
        type: "text",
        default: "wrt, wrf, er, ett, rftt",
        width: "wide",
      },
    ],
    legend: [
      { color: "#F0AC5F", text: "first differing letter" },
      { color: "#58C4DD", text: "zero indegree / queue" },
      { color: "#83C167", text: "added to the order" },
      { color: "#FC6255", text: "cycle / impossible" },
    ],
  },

  code: [
    "def alien_order(words: List[str]) -> str:",
    "    letters = set(''.join(words))",
    "    graph = defaultdict(set)",
    "    indegree = {ch: 0 for ch in letters}",
    "    for first, second in zip(words, words[1:]):",
    "        for a, b in zip(first, second):",
    "            if a != b:",
    "                if b not in graph[a]:",
    "                    graph[a].add(b)",
    "                    indegree[b] += 1",
    "                break",
    "        else:",
    "            if len(first) > len(second):",
    "                return ''",
    "    queue = deque(sorted(ch for ch in letters if indegree[ch] == 0))",
    "    order: List[str] = []",
    "    while queue:",
    "        node = queue.popleft()",
    "        order.append(node)",
    "        for nxt in sorted(graph[node]):",
    "            indegree[nxt] -= 1",
    "            if indegree[nxt] == 0:",
    "                queue.append(nxt)",
    "    if len(order) != len(letters):",
    "        return ''",
    "    return ''.join(order)",
  ],

  read(values) {
    const raw = String(values.words || "").trim();
    if (!raw) return null;
    const words = raw.split(/[\s,]+/).filter(Boolean).map(w => w.toLowerCase());
    if (words.length < 1 || words.length > 6) return null;
    if (!words.every(w => /^[a-z]{1,6}$/.test(w))) return null;
    const letters = new Set(words.join(""));
    if (letters.size > 8) return null;
    return { words };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || !Array.isArray(args[0])) return null;
    const words = args[0].map(w => String(w).toLowerCase());
    if (words.length < 1 || words.length > 6) return null;
    if (!words.every(w => /^[a-z]{1,6}$/.test(w))) return null;
    if (new Set(words.join("")).size > 8) return null;
    return { words: words.join(", ") };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, STAGE_W } = ctx;
    const { words } = params;
    const sim = simulateAlien(words);
    const letters = sim.letters;
    const m = letters.length;

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-red", C.red);

    const marker = el("marker", {
      id: "alien-arrow", viewBox: "0 0 10 10", refX: 9, refY: 5,
      markerWidth: 6, markerHeight: 6, orient: "auto-start-reverse",
    }, ctx.defs);
    el("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: C.grey }, marker);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const arcsL = ctx.layer("arcs");
    const resultL = ctx.layer("result");

    const scene = {
      words, sim, letters, m, wordRows: [], nodes: {}, edgeMap: {},
      indegRows: {}, _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title ---------------------------------------------------------
    scene.title = txt("Alien Dictionary", {
      x: 64, y: 64, "font-size": 42, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    scene.subtitle = txt(
      words.length + " words   ·   " + letters.length + " letters   ·   derive the alphabet order",
      { x: 64, y: 101, "font-size": 18, fill: C.grey },
      textL
    );
    setOpacity(scene.subtitle, 0);

    // ---- words panel ---------------------------------------------------
    const wX = 44, wY = 132, wW = 650, wH = 250;
    scene.wordsPanel = el("g", {}, chipsL);
    el("rect", {
      x: wX, y: wY, width: wW, height: wH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.wordsPanel);
    setOpacity(scene.wordsPanel, 0);
    scene.wordsTitle = txt("adjacent words → first difference", {
      x: wX + 20, y: wY + 28, "font-size": 16, fill: C.blue,
    }, textL);
    setOpacity(scene.wordsTitle, 0);

    const rowTop = wY + 52;
    const rowGap = 29;
    const letterW = 23;
    const letterGap = 3;
    words.forEach((word, idx) => {
      const y = rowTop + idx * rowGap;
      const g = el("g", {}, chipsL);
      const bg = el("rect", {
        x: wX + 14, y: y - 5, width: wW - 28, height: rowGap - 3, rx: 6,
        fill: "none", stroke: "none",
      }, g);
      const label = txt("w" + idx, {
        x: wX + 26, y: y + 10, "font-size": 12, fill: C.grey,
      }, g);
      const lettersG = [];
      for (let j = 0; j < word.length; j++) {
        const lx = wX + 90 + j * (letterW + letterGap);
        const rect = el("rect", {
          x: lx, y: y, width: letterW, height: 23, rx: 4,
          fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.4,
        }, g);
        const t = txt(word[j], {
          x: lx + letterW / 2, y: y + 11.5, "text-anchor": "middle",
          "dominant-baseline": "central", "font-size": 14, fill: C.white,
        }, g);
        lettersG.push({ rect, t, ch: word[j] });
      }
      setOpacity(g, 0);
      scene.wordRows.push({ g, bg, label, letters: lettersG, word });
    });

    scene.compareText = txt("", {
      x: wX + 20, y: wY + wH - 16, "font-size": 13, fill: C.grey,
    }, textL);
    setOpacity(scene.compareText, 0);

    // ---- graph panel ---------------------------------------------------
    const gX = 44, gY = 386, gW = 650, gH = 210;
    scene.graphPanel = el("g", {}, chipsL);
    el("rect", {
      x: gX, y: gY, width: gW, height: gH, rx: 14,
      fill: "#0b1019", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.graphPanel);
    setOpacity(scene.graphPanel, 0);
    scene.graphTitle = txt("constraint graph", {
      x: gX + 20, y: gY + 26, "font-size": 16, fill: C.gold,
    }, textL);
    setOpacity(scene.graphTitle, 0);
    scene.graphHint = txt("arrow a → b means a comes before b", {
      x: gX + gW - 20, y: gY + 26, "text-anchor": "end",
      "font-size": 12, fill: C.grey,
    }, textL);
    setOpacity(scene.graphHint, 0);

    const cx = gX + gW / 2;
    const cy = gY + 112;
    const radius = m <= 5 ? 74 : 77;
    const nodeR = m > 6 ? 14 : 16;
    const positions = {};
    letters.forEach((ch, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(1, m);
      positions[ch] = {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      };
    });

    // all possible directed edges, hidden until a constraint activates one
    letters.forEach(a => {
      letters.forEach(b => {
        if (a === b) return;
        const pa = positions[a], pb = positions[b];
        const dx = pb.x - pa.x, dy = pb.y - pa.y;
        const len = Math.max(1, Math.hypot(dx, dy));
        const ux = dx / len, uy = dy / len;
        const sx = pa.x + ux * (nodeR + 2);
        const sy = pa.y + uy * (nodeR + 2);
        const ex = pb.x - ux * (nodeR + 5);
        const ey = pb.y - uy * (nodeR + 5);
        const ctrlX = (sx + ex) / 2 - uy * 24;
        const ctrlY = (sy + ey) / 2 + ux * 24;
        const g = el("g", {}, arcsL);
        const path = el("path", {
          d: "M " + sx + " " + sy + " Q " + ctrlX + " " + ctrlY + " " + ex + " " + ey,
          fill: "none", stroke: C.grey, "stroke-width": 2,
          "marker-end": "url(#alien-arrow)",
        }, g);
        setOpacity(g, 0);
        scene.edgeMap[a + ">" + b] = { g, path, a, b };
      });
    });

    letters.forEach(ch => {
      const pos = positions[ch];
      const g = el("g", {}, chipsL);
      const halo = el("circle", {
        cx: pos.x, cy: pos.y, r: nodeR + 7,
        fill: "none", stroke: C.gold, "stroke-width": 3,
        filter: "url(#glow-gold)",
      }, g);
      setOpacity(halo, 0);
      const circle = el("circle", {
        cx: pos.x, cy: pos.y, r: nodeR,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, g);
      const label = txt(ch, {
        x: pos.x, y: pos.y + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": 16, fill: C.white,
      }, g);
      setOpacity(g, 0);
      scene.nodes[ch] = { g, halo, circle, label, pos };
    });

    // ---- right panel: indegree / queue / order -------------------------
    const rX = 714, rY = 132, rW = 530, rH = 464;
    scene.sidePanel = el("g", {}, chipsL);
    el("rect", {
      x: rX, y: rY, width: rW, height: rH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.sidePanel);
    setOpacity(scene.sidePanel, 0);
    scene.sideTitle = txt("indegree table", {
      x: rX + 20, y: rY + 29, "font-size": 17, fill: C.green,
    }, textL);
    setOpacity(scene.sideTitle, 0);
    txt("letter", {
      x: rX + 26, y: rY + 57, "font-size": 12, fill: C.grey,
    }, textL);
    txt("indegree", {
      x: rX + rW - 34, y: rY + 57, "text-anchor": "end",
      "font-size": 12, fill: C.grey,
    }, textL);

    const indegTop = rY + 74;
    const indegGap = 26;
    letters.forEach((ch, i) => {
      const y = indegTop + i * indegGap;
      const g = el("g", {}, textL);
      const bg = el("rect", {
        x: rX + 16, y: y - 14, width: rW - 32, height: indegGap - 4, rx: 5,
        fill: "none", stroke: "none",
      }, g);
      const letter = txt(ch, {
        x: rX + 28, y, "font-size": 15, fill: C.white,
      }, g);
      const value = txt("0", {
        x: rX + rW - 34, y, "text-anchor": "end", "font-size": 15, fill: C.blue,
      }, g);
      const zero = txt("", {
        x: rX + 62, y, "font-size": 11, fill: C.gold,
      }, g);
      setOpacity(g, 0);
      scene.indegRows[ch] = { g, bg, letter, value, zero };
    });

    scene.queueLabel = txt("Kahn queue", {
      x: rX + 24, y: rY + 334, "font-size": 14, fill: C.gold,
    }, textL);
    setOpacity(scene.queueLabel, 0);
    scene.queueText = txt("", {
      x: rX + 24, y: rY + 360, "font-size": 18, fill: C.gold,
    }, textL);
    setOpacity(scene.queueText, 0);

    scene.orderLabel = txt("order", {
      x: rX + 24, y: rY + 398, "font-size": 14, fill: C.green,
    }, textL);
    setOpacity(scene.orderLabel, 0);
    scene.orderText = txt("", {
      x: rX + 24, y: rY + 427, "font-size": 23, fill: C.green,
      "letter-spacing": 3,
    }, textL);
    setOpacity(scene.orderText, 0);

    // ---- status + result ----------------------------------------------
    scene.status = txt("", {
      x: 64, y: 620, "font-size": 19, fill: C.gold,
    }, textL);
    setOpacity(scene.status, 0);
    scene.resultBox = el("rect", {
      x: 290, y: 644, width: 700, height: 56, rx: 12,
      fill: "#111a16", stroke: C.green, "stroke-width": 2.2,
      filter: "url(#glow-green)",
    }, resultL);
    setOpacity(scene.resultBox, 0);
    scene.result = txt("", {
      x: STAGE_W / 2, y: 672, "text-anchor": "middle",
      "dominant-baseline": "central", "font-size": 28, fill: C.green,
    }, resultL);
    scene.note = txt("", {
      x: STAGE_W / 2, y: 711, "text-anchor": "middle",
      "font-size": 13, fill: C.grey,
    }, resultL);

    // ---- baseline ------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.wordsPanel, scene.wordsTitle,
                          scene.compareText, scene.graphPanel, scene.graphTitle,
                          scene.graphHint, scene.sidePanel, scene.sideTitle,
                          scene.queueLabel, scene.queueText, scene.orderLabel,
                          scene.orderText, scene.status, scene.resultBox,
                          scene.note]) {
        setOpacity(node, 0);
      }
      for (const row of scene.wordRows) {
        setOpacity(row.g, 0);
        row.bg.setAttribute("fill", "none");
        row.bg.setAttribute("stroke", "none");
        for (const l of row.letters) {
          l.rect.setAttribute("fill", C.chipFill);
          l.rect.setAttribute("stroke", C.greyDark);
          l.rect.setAttribute("stroke-width", "1.4");
          l.t.setAttribute("fill", C.white);
        }
      }
      scene.compareText.textContent = "";
      for (const key in scene.edgeMap) {
        setOpacity(scene.edgeMap[key].g, 0);
        scene.edgeMap[key].path.setAttribute("stroke", C.grey);
        scene.edgeMap[key].path.setAttribute("stroke-width", "2");
      }
      for (const ch in scene.nodes) {
        setOpacity(scene.nodes[ch].g, 0);
        setOpacity(scene.nodes[ch].halo, 0);
        scene.nodes[ch].circle.setAttribute("fill", C.chipFill);
        scene.nodes[ch].circle.setAttribute("stroke", C.greyDark);
        scene.nodes[ch].label.setAttribute("fill", C.white);
      }
      for (const ch in scene.indegRows) {
        const row = scene.indegRows[ch];
        setOpacity(row.g, 0);
        row.bg.setAttribute("fill", "none");
        row.bg.setAttribute("stroke", "none");
        row.value.textContent = "0";
        row.value.setAttribute("fill", C.blue);
        row.zero.textContent = "";
        row.letter.setAttribute("fill", C.white);
      }
      scene.queueText.textContent = "";
      scene.orderText.textContent = "";
      scene.status.textContent = "";
      scene.result.textContent = "";
      scene.note.textContent = "";
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity } = ctx;
    const { sim, words, letters } = scene;
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

    const styleWords = (pairIndex, aIndex, bIndex) => {
      tl.add(0.3, u => {
        scene.wordRows.forEach((row, idx) => {
          const active = pairIndex >= 0 && (idx === pairIndex || idx === pairIndex + 1);
          row.bg.setAttribute("fill", active ? "#241E14" : "none");
          row.bg.setAttribute("stroke", active ? C.gold : "none");
          for (const l of row.letters) {
            l.rect.setAttribute("fill", C.chipFill);
            l.rect.setAttribute("stroke", C.greyDark);
            l.rect.setAttribute("stroke-width", "1.4");
            l.t.setAttribute("fill", C.white);
          }
        });
        if (pairIndex >= 0) {
          const first = scene.wordRows[pairIndex];
          const second = scene.wordRows[pairIndex + 1];
          const shared = Math.min(first.letters.length, second.letters.length);
          for (let j = 0; j < shared; j++) {
            if (j === aIndex) {
              first.letters[j].rect.setAttribute("fill", "#2a2214");
              first.letters[j].rect.setAttribute("stroke", C.gold);
              first.letters[j].rect.setAttribute("stroke-width", "2.4");
              first.letters[j].t.setAttribute("fill", C.gold);
              second.letters[j].rect.setAttribute("fill", "#241417");
              second.letters[j].rect.setAttribute("stroke", C.red);
              second.letters[j].rect.setAttribute("stroke-width", "2.4");
              second.letters[j].t.setAttribute("fill", C.red);
            } else if (first.letters[j].ch === second.letters[j].ch) {
              first.letters[j].t.setAttribute("fill", C.grey);
              second.letters[j].t.setAttribute("fill", C.grey);
            }
          }
        }
      }, easeOut);
    };

    const apply = (snap, activeNode, activeEdge, pairIndex, aIndex, bIndex) => {
      tl.add(0.35, u => {
        const edgeSet = new Set(snap.edges.map(e => e[0] + ">" + e[1]));
        for (const key in scene.edgeMap) {
          const edge = scene.edgeMap[key];
          const visible = edgeSet.has(key);
          setOpacity(edge.g, visible ? 1 : 0);
          const hot = key === activeEdge;
          edge.path.setAttribute("stroke", hot ? C.gold : "#6b7684");
          edge.path.setAttribute("stroke-width", hot ? 3.4 : 2);
        }
        const settled = new Set(snap.order || []);
        const inQueue = new Set(snap.queue || []);
        for (const ch in scene.nodes) {
          const node = scene.nodes[ch];
          const isActive = ch === activeNode;
          const isQueued = inQueue.has(ch);
          const isSettled = settled.has(ch);
          node.circle.setAttribute("fill", isActive ? "#2a2214" : (isSettled ? "#17251a" : C.chipFill));
          node.circle.setAttribute("stroke", isActive ? C.gold : (isSettled ? C.green : (isQueued ? C.blue : C.greyDark)));
          node.label.setAttribute("fill", isActive ? C.gold : (isSettled ? C.green : C.white));
          setOpacity(node.halo, isActive ? u : 0);
        }
        for (const ch in scene.indegRows) {
          const row = scene.indegRows[ch];
          const value = snap.indegree[ch] === undefined ? 0 : snap.indegree[ch];
          row.value.textContent = String(value);
          row.value.setAttribute("fill", value === 0 ? C.gold : C.blue);
          row.letter.setAttribute("fill", settled.has(ch) ? C.green : C.white);
          row.bg.setAttribute("fill", ch === activeNode ? "#241E14" : (settled.has(ch) ? "#13211a" : "none"));
          row.bg.setAttribute("stroke", ch === activeNode ? C.gold : "none");
          row.zero.textContent = value === 0 && !settled.has(ch) ? "ready" : "";
          setOpacity(row.g, 1);
        }
        scene.queueText.textContent = (snap.queue || []).length ? snap.queue.join("  →  ") : "empty";
        scene.orderText.textContent = (snap.order || []).join(" ") || "—";
      }, easeOut);
      styleWords(pairIndex, aIndex, bIndex);
    };

    // ---- intro ---------------------------------------------------------
    tl.line(1);
    tl.add(0.65, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    tl.line([2, 3, 4]);
    tl.add(0.28, u => {
      setOpacity(scene.wordsPanel, u);
      setOpacity(scene.wordsTitle, u);
      setOpacity(scene.compareText, u);
      setOpacity(scene.graphPanel, u);
      setOpacity(scene.graphTitle, u);
      setOpacity(scene.graphHint, u);
      setOpacity(scene.sidePanel, u);
      setOpacity(scene.sideTitle, u);
      setOpacity(scene.queueLabel, u);
      setOpacity(scene.orderLabel, u);
    }, easeOut);
    for (const row of scene.wordRows) {
      tl.add(0.12, u => setOpacity(row.g, u), easeOut);
      tl.wait(0.015);
    }
    for (const ch in scene.nodes) {
      tl.add(0.1, u => setOpacity(scene.nodes[ch].g, u), easeOut);
    }
    for (const ch in scene.indegRows) {
      tl.add(0.05, u => setOpacity(scene.indegRows[ch].g, u), easeOut);
    }
    const emptySnap = {
      edges: [], indegree: Object.fromEntries(letters.map(ch => [ch, 0])),
      queue: [], order: [],
    };
    apply(emptySnap, null, null, -1, -1, -1);
    status("collect letters, then compare each adjacent pair until the first difference", C.blue, true);
    tl.wait(0.2);

    // ---- constraint derivation ----------------------------------------
    for (const ev of sim.pairEvents) {
      tl.line([5, 6, 7]);
      styleWords(ev.index, -1, -1);
      status("compare w" + ev.index + " \"" + ev.first + "\" with w" + (ev.index + 1) + " \"" + ev.second + "\"", C.white);
      if (ev.prefix) {
        status("all shared letters match, but the second word is shorter  →  impossible", C.red, true);
        scene.compareText.textContent = ev.first + "  vs  " + ev.second + "   ·   prefix violation";
        tl.wait(0.6);
        break;
      }
      if (ev.a === null) {
        status("no difference inside the shared prefix  →  no new constraint", C.grey);
        scene.compareText.textContent = ev.first + "  vs  " + ev.second + "   ·   identical prefix";
        tl.wait(0.2);
        continue;
      }
      tl.line([8, 9, 10, 11, 12]);
      styleWords(ev.index, ev.aIndex, ev.bIndex);
      scene.compareText.textContent = ev.first + "  vs  " + ev.second + "   ·   first difference  " +
        ev.a + "  →  " + ev.b + (ev.added ? "   (new edge)" : "   (already known)");
      if (ev.added) {
        status(ev.a + " must come before " + ev.b + "  →  add edge " + ev.a + " → " + ev.b, C.gold, true);
        apply(ev.snapshot, null, ev.a + ">" + ev.b, ev.index, ev.aIndex, ev.bIndex);
        tl.add(0.35, u => {
          const edge = scene.edgeMap[ev.a + ">" + ev.b];
          if (edge) edge.path.setAttribute("stroke", C.gold);
        }, easeOut);
      } else {
        status(ev.a + " → " + ev.b + " is already in the graph  ·  indegree unchanged", C.grey);
      }
      tl.wait(0.22);
    }

    const impossible = sim.impossible;
    if (impossible) {
      tl.line(13);
      status("cannot build a valid alphabet  →  return \"\"", C.red, true);
      tl.add(0.4, u => {
        scene.resultBox.setAttribute("fill", "#1d1416");
        scene.resultBox.setAttribute("stroke", C.red);
        scene.resultBox.setAttribute("filter", "url(#glow-red)");
        setOpacity(scene.resultBox, u);
      }, easeOut);
      scene.result.textContent = "return \"\"";
      scene.result.setAttribute("fill", C.red);
      tl.add(0.5, scene.writer(scene.result), ease.linear);
      scene.note.textContent = sim.reason || "a cycle / prefix violation makes the order impossible";
      tl.add(0.35, scene.writer(scene.note), ease.linear);
      tl.wait(1.0);
      return tl.finish();
    }

    // ---- Kahn's algorithm ---------------------------------------------
    tl.line([14, 15]);
    apply(sim.initialTopo, null, null, -1, -1, -1);
    status("initialize the queue with every zero-indegree letter, sorted: " +
      sim.initialTopo.queue.join(" "), C.blue, true);
    tl.wait(0.25);

    sim.topoEvents.forEach(ev => {
      tl.line([16, 17, 18]);
      status("pop " + ev.node + "  →  append to order  ·  queue: " +
        (ev.queueAfter.length ? ev.queueAfter.join(" ") : "empty"), C.gold, true);
      apply(ev.snapshot, ev.node, ev.activeEdge, -1, -1, -1);
      tl.line([19, 20, 21]);
      if (ev.released.length) {
        status("decrement indegree of " + ev.released.join(", ") + "  →  newly ready", C.green);
      } else {
        status("no new letter became ready", C.grey);
      }
      tl.wait(0.18);
    });

    tl.line([22, 23]);
    const answer = sim.result;
    if (!answer) {
      status("the order is shorter than the alphabet  →  a cycle remains  →  return \"\"", C.red, true);
      tl.add(0.4, u => {
        scene.resultBox.setAttribute("fill", "#1d1416");
        scene.resultBox.setAttribute("stroke", C.red);
        scene.resultBox.setAttribute("filter", "url(#glow-red)");
        setOpacity(scene.resultBox, u);
      }, easeOut);
      scene.result.textContent = "return \"\"";
      scene.result.setAttribute("fill", C.red);
      tl.add(0.5, scene.writer(scene.result), ease.linear);
      scene.note.textContent = "a cycle means no consistent alphabet";
      tl.add(0.35, scene.writer(scene.note), ease.linear);
    } else {
      status("all " + letters.length + " letters ordered  →  " + answer, C.green, true);
      tl.add(0.4, u => setOpacity(scene.resultBox, u), easeOut);
      scene.result.textContent = "return \"" + answer + "\"";
      tl.add(0.55, scene.writer(scene.result), ease.linear);
      scene.note.textContent = "any valid topological order is accepted by the checker";
      tl.add(0.35, scene.writer(scene.note), ease.linear);
    }
    tl.wait(1.1);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Simulation: derive constraints then run Kahn's algorithm.
 * ------------------------------------------------------------------ */
function simulateAlien(words) {
  const letters = [...new Set(words.join(""))].sort();
  const graph = {};
  const indegree = {};
  for (const ch of letters) {
    graph[ch] = new Set();
    indegree[ch] = 0;
  }

  const pairEvents = [];
  let prefixViolation = false;
  let impossible = false;
  let reason = "";

  const edgeList = () => {
    const out = [];
    for (const a of letters) {
      for (const b of [...graph[a]].sort()) out.push([a, b]);
    }
    return out;
  };
  const indegCopy = () => {
    const copy = {};
    for (const ch of letters) copy[ch] = indegree[ch];
    return copy;
  };

  for (let index = 0; index + 1 < words.length; index++) {
    const first = words[index];
    const second = words[index + 1];
    let a = null, b = null, aIndex = -1, bIndex = -1;
    const shared = Math.min(first.length, second.length);
    for (let j = 0; j < shared; j++) {
      if (first[j] !== second[j]) {
        a = first[j];
        b = second[j];
        aIndex = j;
        bIndex = j;
        break;
      }
    }
    if (a === null) {
      if (first.length > second.length) {
        prefixViolation = true;
        impossible = true;
        reason = "word \"" + first + "\" is longer than the next word \"" + second + "\" but shares its whole prefix";
      }
      pairEvents.push({
        index, first, second, a: null, b: null, aIndex: -1, bIndex: -1,
        added: false, prefix: impossible,
        snapshot: { edges: edgeList(), indegree: indegCopy() },
      });
      continue;
    }
    let added = false;
    if (!graph[a].has(b)) {
      graph[a].add(b);
      indegree[b]++;
      added = true;
    }
    pairEvents.push({
      index, first, second, a, b, aIndex, bIndex, added, prefix: false,
      snapshot: { edges: edgeList(), indegree: indegCopy() },
    });
  }

  const initialQueue = letters.filter(ch => indegree[ch] === 0).sort();
  const initialTopo = {
    edges: edgeList(), indegree: indegCopy(),
    queue: initialQueue.slice(), order: [],
  };
  const topoEvents = [];
  const queue = initialQueue.slice();
  const order = [];

  while (queue.length) {
    const node = queue.shift();
    order.push(node);
    const released = [];
    const activeEdges = [];
    for (const nxt of [...graph[node]].sort()) {
      indegree[nxt]--;
      activeEdges.push(node + ">" + nxt);
      if (indegree[nxt] === 0) {
        queue.push(nxt);
        released.push(nxt);
      }
    }
    // keep the lexicographic order used by the solution
    queue.sort();
    topoEvents.push({
      node,
      released,
      queueAfter: queue.slice(),
      activeEdge: activeEdges.length === 1 ? activeEdges[0] : activeEdges[0],
      snapshot: {
        edges: edgeList(), indegree: indegCopy(),
        queue: queue.slice(), order: order.slice(),
      },
    });
  }

  const result = order.length === letters.length ? order.join("") : "";
  if (!result && !impossible) {
    impossible = true;
    reason = "the queue emptied before every letter was ordered — a cycle remains";
  }

  return {
    letters, pairEvents, initialTopo, topoEvents,
    result, impossible, reason,
  };
}
