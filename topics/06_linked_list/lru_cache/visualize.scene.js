/* LRU Cache — animated walkthrough scene (3Blue1Brown style).
 *
 * A design problem. The operation strip across the top is replayed in order.
 * The hash map on the left stores key → node, while the doubly linked list on
 * the right keeps recency order: `_head.next` is the least recent and
 * `_tail.prev` is the most recent. get/put move a node to the MRU end; a put
 * beyond capacity evicts the LRU node.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "LRU Cache",
    subtitle: "hash map + doubly linked list · get/put in O(1) · evict least recent",
    inputs: [
      {
        id: "ops",
        label: "operations",
        type: "text",
        default: "LRUCache(2), put(1, 1), put(2, 2), get(1), put(3, 3), get(2), put(4, 4), get(1), get(3), get(4)",
        width: "wide",
      },
    ],
    legend: [
      { color: "#58C4DD", text: "hash map / next" },
      { color: "#B58CD6", text: "prev pointer" },
      { color: "#F0AC5F", text: "active operation" },
      { color: "#83C167", text: "hit / returned value" },
      { color: "#FC6255", text: "evicted LRU" },
    ],
  },

  code: [
    "class _Node:",
    "    __slots__ = (\"key\", \"value\", \"prev\", \"next\")",
    "    def __init__(self, key: int = 0, value: int = 0) -> None:",
    "        self.key = key",
    "        self.value = value",
    "        self.prev: Optional[\"_Node\"] = None",
    "        self.next: Optional[\"_Node\"] = None",
    "class LRUCache:",
    "    def __init__(self, capacity: int) -> None:",
    "        self.capacity = capacity",
    "        self._map: Dict[int, _Node] = {}",
    "        self._head = _Node()",
    "        self._tail = _Node()",
    "        self._head.next = self._tail",
    "        self._tail.prev = self._head",
    "    def _remove(self, node: _Node) -> None:",
    "        node.prev.next = node.next",
    "        node.next.prev = node.prev",
    "    def _add(self, node: _Node) -> None:",
    "        last = self._tail.prev",
    "        last.next = node",
    "        node.prev = last",
    "        node.next = self._tail",
    "        self._tail.prev = node",
    "    def get(self, key: int) -> int:",
    "        node = self._map.get(key)",
    "        if node is None:",
    "            return -1",
    "        self._remove(node)",
    "        self._add(node)",
    "        return node.value",
    "    def put(self, key: int, value: int) -> None:",
    "        existing = self._map.get(key)",
    "        if existing is not None:",
    "            self._remove(existing)",
    "        node = _Node(key, value)",
    "        self._map[key] = node",
    "        self._add(node)",
    "        if len(self._map) > self.capacity:",
    "            lru = self._head.next",
    "            self._remove(lru)",
    "            del self._map[lru.key]",
  ],

  read(values) {
    const raw = (values.ops || "").trim();
    if (!raw) return null;
    const tokens = splitTopLevel(raw);
    const ops = [];
    for (const token of tokens) {
      const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)$/.exec(token.trim());
      if (!m) return null;
      const name = m[1];
      const inner = m[2].trim();
      const args = inner ? splitTopLevel(inner).map(s => Number(s.trim())) : [];
      if (!args.every(Number.isInteger)) return null;
      if (name === "LRUCache") {
        if (args.length !== 1 || args[0] < 1 || args[0] > 4) return null;
      } else if (name === "get") {
        if (args.length !== 1) return null;
      } else if (name === "put") {
        if (args.length !== 2) return null;
      } else {
        return null;
      }
      ops.push({ name, args });
    }
    if (!ops.length || ops[0].name !== "LRUCache" || ops.length > 10) return null;
    return { ops };
  },

  fromArgs(args) {
    let payload = null;
    if (args && !Array.isArray(args) && typeof args === "object" && args.ops) payload = args;
    else if (Array.isArray(args) && args[0] && !Array.isArray(args[0]) && args[0].ops) payload = args[0];
    if (!payload || !Array.isArray(payload.ops) || !Array.isArray(payload.vals)) return null;
    if (payload.ops.length !== payload.vals.length || payload.ops.length > 10) return null;
    const parts = [];
    for (let i = 0; i < payload.ops.length; i++) {
      const name = payload.ops[i];
      const vals = payload.vals[i];
      if (!Array.isArray(vals)) return null;
      if (!vals.every(v => Number.isInteger(Number(v)))) return null;
      parts.push(name + "(" + vals.map(v => String(Number(v))).join(", ") + ")");
    }
    return { ops: parts.join(", ") };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, setScaleAt, STAGE_W } = ctx;
    const ops = params.ops;
    const sim = simulate(ops);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-purple", C.purple);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-red", C.red);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const arcsL = ctx.layer("arcs");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = {
      ops, sim, ctx, opChips: [], retTexts: [], mapRows: [], keyNodes: new Map(),
      boundaries: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title -----------------------------------------------------------
    scene.title = txt("LRU Cache", {
      x: 64, y: 62, "font-size": 44, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    const sub = el("text", { x: 64, y: 96, "font-size": 20, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "capacity = ";
    el("tspan", { fill: C.gold }, sub).textContent = String(sim.capacity);
    el("tspan", {}, sub).textContent = "     LRU → ... → MRU";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- operation strip -------------------------------------------------
    const opCount = ops.length;
    const opGap = 8;
    const opW = clamp((1160 - opGap * (opCount - 1)) / opCount, 76, 112);
    const opTotal = opCount * opW + (opCount - 1) * opGap;
    const opStart = STAGE_W / 2 - opTotal / 2;
    const opY = 118, opH = 40;
    scene.opStart = opStart;
    scene.opW = opW;
    scene.opY = opY;
    scene.opH = opH;

    ops.forEach((op, i) => {
      const x = opStart + i * (opW + opGap);
      const g = el("g", { transform: "translate(" + x + " " + opY + ")" }, chipsL);
      const rect = el("rect", {
        x: 0, y: 0, width: opW, height: opH, rx: 8,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.6,
      }, g);
      const label = op.name + "(" + op.args.join(", ") + ")";
      const t = txt(label, {
        x: opW / 2, y: opH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": clamp(opW * 0.105, 9.5, 12.5),
        fill: C.grey,
      }, g);
      setOpacity(g, 0);
      scene.opChips.push({ g, rect, t, i, op });
      const ret = txt("", {
        x: x + opW / 2, y: opY + opH + 27, "text-anchor": "middle",
        "font-size": 13, fill: C.grey,
      }, textL);
      setOpacity(ret, 0);
      scene.retTexts.push(ret);
    });

    // -- map panel -------------------------------------------------------
    const mapX = 64, mapY = 246, mapW = 380, mapH = 192;
    const mapPanel = el("g", {}, chipsL);
    el("rect", {
      x: mapX, y: mapY, width: mapW, height: mapH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, mapPanel);
    scene.mapTitle = txt("_map  ·  key → node", {
      x: mapX + 18, y: mapY + 27, "font-size": 17, fill: C.blue,
    }, textL);
    setOpacity(mapPanel, 0);
    setOpacity(scene.mapTitle, 0);
    scene.mapPanel = mapPanel;
    scene.mapEmpty = txt("empty", {
      x: mapX + 18, y: mapY + 58, "font-size": 18, fill: C.grey,
    }, textL);
    setOpacity(scene.mapEmpty, 0);
    for (let i = 0; i < 4; i++) {
      const t = txt("", {
        x: mapX + 18, y: mapY + 58 + i * 30, "font-size": 17, fill: C.white,
      }, textL);
      setOpacity(t, 0);
      scene.mapRows.push(t);
    }

    // -- list panel ------------------------------------------------------
    const panelX = 470, panelY = 246, panelW = 744, panelH = 192;
    const listPanel = el("g", {}, chipsL);
    el("rect", {
      x: panelX, y: panelY, width: panelW, height: panelH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, listPanel);
    scene.listTitle = txt("doubly linked list  ·  _head.next = LRU  ·  _tail.prev = MRU", {
      x: panelX + 18, y: panelY + 27, "font-size": 16, fill: C.purple,
    }, textL);
    setOpacity(listPanel, 0);
    setOpacity(scene.listTitle, 0);
    scene.listPanel = listPanel;

    const cap = sim.capacity;
    const headX = 500, headW = 64;
    const tailX = 1148, tailW = 64;
    const innerLeft = headX + headW + 30;
    const innerRight = tailX - 30;
    const slotGap = cap > 2 ? 24 : 28;
    const slotW = clamp((innerRight - innerLeft - slotGap * (cap - 1)) / cap, 78, 140);
    const slotsTotal = cap * slotW + (cap - 1) * slotGap;
    const slotStart = innerLeft + (innerRight - innerLeft - slotsTotal) / 2;
    const slotX = i => slotStart + i * (slotW + slotGap);
    const nodeTop = 320, nodeH = 76;
    scene.slotW = slotW;
    scene.slotX = slotX;
    scene.nodeTop = nodeTop;
    scene.nodeH = nodeH;

    const sentinel = (x, label, letter) => {
      const g = el("g", { transform: "translate(" + x + " " + nodeTop + ")" }, chipsL);
      el("rect", {
        x: 0, y: 0, width: headW, height: nodeH, rx: 10,
        fill: "#181a1f", stroke: C.gold, "stroke-width": 1.8,
        "stroke-dasharray": "6 4",
      }, g);
      txt(letter, {
        x: headW / 2, y: nodeH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": 24, fill: C.gold,
      }, g);
      txt(label, {
        x: headW / 2, y: -12, "text-anchor": "middle", "font-size": 14, fill: C.gold,
      }, g);
      setOpacity(g, 0);
      return g;
    };
    scene.headNode = sentinel(headX, "head", "H");
    scene.tailNode = sentinel(tailX, "tail", "T");

    // -- key nodes -------------------------------------------------------
    const keys = [];
    for (const op of ops) {
      if (op.name === "put" && !keys.includes(op.args[0])) keys.push(op.args[0]);
    }
    for (const key of keys) {
      const g = el("g", { transform: "translate(" + slotX(0) + " " + nodeTop + ")" }, chipsL);
      const box = el("rect", {
        x: 0, y: 0, width: slotW, height: nodeH, rx: 10,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, g);
      const keyText = txt("k=" + key, {
        x: slotW / 2, y: 24, "text-anchor": "middle", "font-size": 14, fill: C.gold,
      }, g);
      const valText = txt("v=?", {
        x: slotW / 2, y: 51, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": 22, fill: C.white,
      }, g);
      const ring = el("rect", {
        x: 0, y: 0, width: slotW, height: nodeH, rx: 10, fill: "none",
        stroke: C.gold, "stroke-width": 3.4, filter: "url(#glow-gold)",
      }, g);
      const redRing = el("rect", {
        x: 0, y: 0, width: slotW, height: nodeH, rx: 10, fill: "none",
        stroke: C.red, "stroke-width": 3.4, filter: "url(#glow-red)",
      }, g);
      setOpacity(g, 0);
      setOpacity(ring, 0);
      setOpacity(redRing, 0);
      scene.keyNodes.set(key, {
        key, g, box, keyText, valText, ring, redRing,
        x: slotX(0), slot: -1, active: false,
      });
    }

    // -- boundary arrows -------------------------------------------------
    const boundaryY1 = nodeTop + 28, boundaryY2 = nodeTop + 51;
    const mkArrow = (x1, x2, y, color) => {
      const g = el("g", {}, arcsL);
      const dir = x2 > x1 ? 1 : -1;
      const head = x2 - dir * 9;
      el("line", {
        x1, y1: y, x2: head, y2: y, stroke: color, "stroke-width": 2.2,
        "stroke-linecap": "round",
      }, g);
      el("polygon", {
        points: head + "," + (y - 5.5) + " " + head + "," + (y + 5.5) + " " + x2 + "," + y,
        fill: color,
      }, g);
      setOpacity(g, 0);
      return g;
    };
    for (let i = 0; i <= cap; i++) {
      const leftEdge = i === 0 ? headX + headW : slotX(i - 1) + slotW;
      const rightEdge = i === cap ? tailX : slotX(i);
      const rightArrow = mkArrow(leftEdge + 4, rightEdge - 4, boundaryY1, C.blue);
      const leftArrow = mkArrow(rightEdge - 4, leftEdge + 4, boundaryY2, C.purple);
      scene.boundaries.push({ rightArrow, leftArrow, i });
    }
    // Empty list still has head.next = tail.
    const emptyG = el("g", {}, arcsL);
    const emptyY = nodeTop + nodeH / 2;
    el("line", {
      x1: headX + headW + 6, y1: emptyY, x2: tailX - 10, y2: emptyY,
      stroke: C.gold, "stroke-width": 2, "stroke-dasharray": "7 5",
    }, emptyG);
    el("polygon", {
      points: (tailX - 10) + "," + (emptyY - 6) + " " + (tailX - 10) + "," + (emptyY + 6) + " " + tailX + "," + emptyY,
      fill: C.gold,
    }, emptyG);
    setOpacity(emptyG, 0);
    scene.emptyLink = emptyG;

    // -- LRU / MRU labels ------------------------------------------------
    scene.lruLabel = txt("LRU", {
      x: slotX(0), y: 300, "text-anchor": "middle", "font-size": 14, fill: C.red,
    }, textL);
    scene.mruLabel = txt("MRU", {
      x: slotX(cap - 1), y: 300, "text-anchor": "middle", "font-size": 14, fill: C.green,
    }, textL);
    setOpacity(scene.lruLabel, 0);
    setOpacity(scene.mruLabel, 0);

    // -- status + final returns -----------------------------------------
    scene.status = txt("", {
      x: STAGE_W / 2, y: 470, "text-anchor": "middle", "font-size": 21, fill: C.gold,
    }, textL);
    scene.detail = txt("", {
      x: STAGE_W / 2, y: 504, "text-anchor": "middle", "font-size": 17, fill: C.grey,
    }, textL);
    setOpacity(scene.status, 0);
    setOpacity(scene.detail, 0);

    scene.result = txt("returns = " + JSON.stringify(sim.returns), {
      x: STAGE_W / 2, y: 568, "text-anchor": "middle", "font-size": 18, fill: C.green,
    }, resultL);
    const rule = el("line", {
      x1: STAGE_W / 2 - 330, y1: 590, x2: STAGE_W / 2 + 330, y2: 590,
      stroke: C.green, "stroke-width": 3.5, "stroke-linecap": "round",
    }, resultL);
    const ruleLen = rule.getTotalLength();
    rule.setAttribute("stroke-dasharray", String(ruleLen));
    rule.setAttribute("stroke-dashoffset", String(ruleLen));
    scene.resultRule = rule;
    scene.ruleLen = ruleLen;

    // -- reset -----------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.mapTitle, scene.listTitle, scene.mapEmpty,
                          scene.status, scene.detail, scene.lruLabel, scene.mruLabel]) setOpacity(node, 0);
      scene.status.textContent = "";
      scene.detail.textContent = "";
      setOpacity(scene.mapPanel, 0);
      setOpacity(scene.listPanel, 0);
      setOpacity(scene.headNode, 0);
      setOpacity(scene.tailNode, 0);
      setOpacity(scene.emptyLink, 0);
      for (const chip of scene.opChips) {
        setOpacity(chip.g, 0);
        chip.rect.setAttribute("fill", C.chipFill);
        chip.rect.setAttribute("stroke", C.greyDark);
        chip.t.setAttribute("fill", C.grey);
      }
      for (const ret of scene.retTexts) {
        setOpacity(ret, 0);
        ret.textContent = "";
      }
      for (const row of scene.mapRows) {
        setOpacity(row, 0);
        row.textContent = "";
      }
      for (const node of scene.keyNodes.values()) {
        setOpacity(node.g, 0);
        setTranslate(node.g, slotX(0), nodeTop);
        node.x = slotX(0);
        node.slot = -1;
        node.active = false;
        setOpacity(node.ring, 0);
        setOpacity(node.redRing, 0);
        node.valText.textContent = "v=?";
        node.valText.setAttribute("fill", C.white);
        node.box.setAttribute("stroke", C.greyDark);
        node.box.setAttribute("fill", C.chipFill);
      }
      for (const b of scene.boundaries) {
        setOpacity(b.rightArrow, 0);
        setOpacity(b.leftArrow, 0);
      }
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt } = ctx;
    const { ops, sim } = scene;
    const cap = sim.capacity;
    const slotX = scene.slotX;
    const nodeTop = scene.nodeTop;

    scene.reset();

    const status = (text, color) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || ctx.C.gold);
      });
      tl.log(text, color || ctx.C.gold);
    };
    const detail = text => {
      tl.add(0.01, () => { scene.detail.textContent = text; });
    };
    const setActiveChip = index => {
      for (const chip of scene.opChips) {
        const on = chip.i === index;
        chip.rect.setAttribute("fill", on ? "#262015" : ctx.C.chipFill);
        chip.rect.setAttribute("stroke", on ? ctx.C.gold : ctx.C.greyDark);
        chip.t.setAttribute("fill", on ? ctx.C.white : ctx.C.grey);
      }
    };
    const setMap = entries => {
      const sorted = entries.slice().sort((a, b) => a[0] - b[0]);
      for (let i = 0; i < scene.mapRows.length; i++) {
        const row = scene.mapRows[i];
        if (i < sorted.length) {
          row.textContent = "key " + sorted[i][0] + "   →   value " + sorted[i][1];
          row.setAttribute("fill", ctx.C.white);
          setOpacity(row, 1);
        } else {
          row.textContent = "";
          setOpacity(row, 0);
        }
      }
      setOpacity(scene.mapEmpty, sorted.length ? 0 : 1);
    };
    const highlightMap = key => {
      for (const row of scene.mapRows) row.setAttribute("fill", ctx.C.white);
      // The rows are sorted by key; find the row whose text starts with this key.
      for (const row of scene.mapRows) {
        if (row.textContent.indexOf("key " + key + " ") === 0) row.setAttribute("fill", ctx.C.gold);
      }
    };
    const setReturns = index => {
      const r = scene.sim.returns[index];
      const t = scene.retTexts[index];
      tl.add(0.01, () => {
        t.textContent = r === null ? "null" : String(r);
        t.setAttribute("fill", r === null ? ctx.C.grey : (r === -1 ? ctx.C.red : ctx.C.green));
      });
      tl.add(0.2, u => setOpacity(t, u), ease.outCubic);
    };
    const moveNode = (node, x, dur) => {
      const from = node.x;
      tl.add(dur || 0.38, u => {
        setOpacity(node.g, 1);
        setTranslate(node.g, from + (x - from) * u, nodeTop);
      }, ease.inOutSine);
      node.x = x;
    };
    const revealNode = (node, x, dur) => {
      node.x = x;
      setTranslate(node.g, x, nodeTop);
      tl.add(dur || 0.4, u => {
        setOpacity(node.g, Math.min(1, u * 2.2));
      }, ease.outCubic);
    };
    const hideNode = (node, dur) => {
      tl.add(dur || 0.35, u => setOpacity(node.g, 1 - u), ease.outCubic);
    };
    const updateArrows = (m, dur) => {
      tl.add(dur || 0.3, u => {
        for (const b of scene.boundaries) {
          const on = b.i <= m;
          setOpacity(b.rightArrow, on ? u : 0);
          setOpacity(b.leftArrow, on ? u : 0);
        }
        setOpacity(scene.emptyLink, m === 0 ? u : 0);
        setOpacity(scene.lruLabel, m > 0 ? u : 0);
        setOpacity(scene.mruLabel, m > 0 ? u : 0);
        if (m > 0) {
          const lx = m === 1 ? slotX(0) - 38 : slotX(0);
          const mx = m === 1 ? slotX(0) + 38 : slotX(m - 1);
          scene.lruLabel.setAttribute("x", String(lx));
          scene.mruLabel.setAttribute("x", String(mx));
          scene.lruLabel.setAttribute("y", "300");
          scene.mruLabel.setAttribute("y", "300");
        }
      }, ease.outCubic);
    };
    const applyState = (step, dur) => {
      const before = step.beforeOrder;
      const after = step.afterOrder;
      // Update map rows first.
      tl.add(0.01, () => setMap(step.afterMap));

      const evicted = before
        .filter(key => !after.includes(key))
        .map(key => scene.keyNodes.get(key))
        .filter(Boolean);
      const moving = [];
      after.forEach((key, slot) => {
        const node = scene.keyNodes.get(key);
        if (!node) return;
        if (!node.active || node.slot !== slot) {
          moving.push({ node, slot, wasActive: node.active });
        }
      });

      // Fade out nodes that are leaving or changing slots.  Repositioning only
      // after the fade avoids two boxes crossing through the same text point.
      const fadeOut = moving.filter(m => m.wasActive).map(m => m.node).concat(evicted);
      if (fadeOut.length) {
        tl.add(0.22, u => {
          for (const node of fadeOut) setOpacity(node.g, 1 - u);
        }, ease.outCubic);
      }
      tl.add(0.01, () => {
        for (const node of evicted) {
          setOpacity(node.g, 0);
          node.active = false;
          node.slot = -1;
        }
        for (const m of moving) {
          const node = m.node;
          const x = slotX(m.slot);
          setOpacity(node.g, 0);
          node.active = true;
          node.slot = m.slot;
          node.x = x;
          setTranslate(node.g, x, nodeTop);
        }
        for (const [key, value] of step.afterMap) {
          const node = scene.keyNodes.get(key);
          if (!node) continue;
          node.valText.textContent = "v=" + value;
          node.valText.setAttribute("fill", ctx.C.white);
        }
      });
      if (moving.length) {
        tl.add(0.3, u => {
          for (const m of moving) setOpacity(m.node.g, u);
        }, ease.outCubic);
      }
      updateArrows(after.length, 0.25);
    };
    const highlightKey = (key, color) => {
      for (const node of scene.keyNodes.values()) {
        setOpacity(node.ring, 0);
        setOpacity(node.redRing, 0);
      }
      const node = scene.keyNodes.get(key);
      if (node) {
        node.ring.setAttribute("stroke", color || ctx.C.gold);
        setOpacity(node.ring, 1);
      }
    };
    const clearHighlight = () => {
      for (const node of scene.keyNodes.values()) {
        setOpacity(node.ring, 0);
        setOpacity(node.redRing, 0);
      }
    };

    // -- intro -----------------------------------------------------------
    tl.line([1, 2]);
    tl.add(0.65, scene.writer(scene.title), ease.outCubic);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), ease.outCubic);
    for (const chip of scene.opChips) {
      tl.add(0.12, u => setOpacity(chip.g, u), ease.outCubic);
    }
    status("replay the operation strip left to right", ctx.C.gold);
    tl.add(0.25, u => setOpacity(scene.status, u), ease.outCubic);

    // -- sentinels + panels ---------------------------------------------
    tl.line([8, 9, 10, 11]);
    status("LRUCache(capacity): empty map + two sentinels", ctx.C.blue);
    tl.add(0.3, u => {
      setOpacity(scene.mapPanel, u);
      setOpacity(scene.mapTitle, u);
      setOpacity(scene.listPanel, u);
      setOpacity(scene.listTitle, u);
      setOpacity(scene.headNode, u);
      setOpacity(scene.tailNode, u);
    }, ease.outCubic);
    tl.line([12, 13, 14, 15]);
    tl.add(0.01, () => setMap([]));
    updateArrows(0, 0.35);
    detail("head.next = tail and tail.prev = head when empty");

    // -- operations ------------------------------------------------------
    sim.steps.forEach((step, si) => {
      tl.add(0.01, () => setActiveChip(si));
      tl.wait(0.1);
      if (step.kind === "init") {
        setReturns(si);
        status("LRUCache(" + step.capacity + ") initialized", ctx.C.blue);
        detail("capacity = " + step.capacity);
        return;
      }

      if (step.kind === "get") {
        tl.line(25);
        status("get(" + step.key + "): look up the key in _map", ctx.C.gold);
        tl.line(26);
        tl.add(0.01, () => highlightMap(step.key));
        tl.line(27);
        if (!step.hit) {
          tl.line(28);
          status("node is None   →   return -1", ctx.C.red);
          setReturns(si);
          detail("cache miss; recency order unchanged");
          tl.wait(0.2);
          return;
        }
        tl.line(29);
        status("node found   →   unlink it from its old position", ctx.C.blue);
        tl.add(0.01, () => highlightKey(step.key, ctx.C.blue));
        tl.line([16, 17, 18]);
        tl.line(30);
        status("_add(node)   →   move it right before the tail", ctx.C.green);
        tl.line([19, 20, 21, 22, 23, 24]);
        applyState(step, 0.45);
        tl.line(31);
        status("return node.value = " + step.returnValue, ctx.C.green);
        setReturns(si);
        detail("get refreshes recency: key " + step.key + " becomes MRU");
        tl.add(0.01, () => clearHighlight());
        tl.wait(0.2);
        return;
      }

      // put
      tl.line(32);
      status("put(" + step.key + ", " + step.value + ")", ctx.C.gold);
      tl.line(33);
      tl.add(0.01, () => highlightMap(step.key));
      tl.line(34);
      if (step.existing) {
        status("existing key   →   remove the old node first", ctx.C.blue);
        tl.line([16, 17, 18]);
        tl.line([35, 36, 37, 38]);
        status("create/update the node, then _add it at MRU", ctx.C.green);
        tl.line([3, 4, 5, 6, 7]);
        applyState(step, 0.45);
        setReturns(si);
        detail("value updated and key " + step.key + " becomes MRU");
        tl.line(39);
        status("len(_map) = " + step.afterMap.length + " ≤ capacity   →   no eviction", ctx.C.grey);
        tl.add(0.01, () => clearHighlight());
        tl.wait(0.2);
        return;
      }

      status("new key   →   create a _Node and insert at MRU", ctx.C.green);
      tl.line([36, 37, 38]);
      tl.line([3, 4, 5, 6, 7]);
      tl.line(39);
      if (step.evicted !== null) {
        status("over capacity   →   evict the least-recently-used node", ctx.C.red);
        tl.line([40, 41]);
        tl.line([16, 17, 18]);
        tl.line(42);
        const evictedNode = scene.keyNodes.get(step.evicted);
        if (evictedNode) tl.add(0.01, () => setOpacity(evictedNode.redRing, 1));
        detail("evict key " + step.evicted + " from both the list and the map");
      } else {
        status("len(_map) = " + step.afterMap.length + " ≤ capacity   →   keep everything", ctx.C.grey);
        detail("cache is still within capacity");
      }
      applyState(step, 0.5);
      setReturns(si);
      tl.add(0.01, () => clearHighlight());
      tl.wait(0.2);
    });

    // -- final returns ---------------------------------------------------
    status("all operations complete   →   return the recorded results", ctx.C.green);
    tl.add(0.3, u => {
      setOpacity(scene.status, 1 - u);
      setOpacity(scene.detail, 1 - u);
      for (const chip of scene.opChips) {
        chip.rect.setAttribute("fill", ctx.C.chipFill);
        chip.rect.setAttribute("stroke", ctx.C.greyDark);
        chip.t.setAttribute("fill", ctx.C.grey);
      }
    }, ease.outCubic);
    tl.add(0.55, scene.writer(scene.result), ease.linear);
    tl.add(0.4, u => scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen * (1 - u))), ease.outCubic);
    tl.log("returns = " + JSON.stringify(sim.returns), ctx.C.green);
    tl.wait(0.7);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Parsing and pure simulation.
 * ------------------------------------------------------------------ */

function splitTopLevel(raw) {
  const parts = [];
  let depth = 0, start = 0;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0) {
      parts.push(raw.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(raw.slice(start));
  return parts.map(s => s.trim()).filter(Boolean);
}

function simulate(ops) {
  const steps = [];
  const returns = [];
  let capacity = 0;
  const map = new Map();
  let order = [];

  const snapshot = () => ({
    order: order.slice(),
    map: [...map.entries()].map(([k, v]) => [k, v]),
  });

  ops.forEach((op, index) => {
    const before = snapshot();
    let evicted = null, existing = false, hit = false, returnValue = null, key = null, value = null;

    if (op.name === "LRUCache") {
      capacity = op.args[0];
      steps.push({
        kind: "init", index, capacity, beforeOrder: before.order, afterOrder: order.slice(),
        beforeMap: before.map, afterMap: [...map.entries()].map(([k, v]) => [k, v]),
        evicted, existing, hit, returnValue,
      });
      returns.push(null);
      return;
    }

    if (op.name === "get") {
      key = op.args[0];
      hit = map.has(key);
      if (hit) {
        returnValue = map.get(key);
        order = order.filter(k => k !== key);
        order.push(key);
      } else {
        returnValue = -1;
      }
      const after = snapshot();
      steps.push({
        kind: "get", index, key, beforeOrder: before.order, afterOrder: after.order,
        beforeMap: before.map, afterMap: after.map, evicted, existing, hit, returnValue,
      });
      returns.push(returnValue);
      return;
    }

    key = op.args[0];
    value = op.args[1];
    existing = map.has(key);
    if (existing) {
      map.set(key, value);
      order = order.filter(k => k !== key);
      order.push(key);
    } else {
      map.set(key, value);
      order.push(key);
      if (order.length > capacity) {
        evicted = order.shift();
        map.delete(evicted);
      }
    }
    const after = snapshot();
    steps.push({
      kind: "put", index, key, value, beforeOrder: before.order, afterOrder: after.order,
      beforeMap: before.map, afterMap: after.map, evicted, existing, hit: false, returnValue: null,
    });
    returns.push(null);
  });

  return { capacity, steps, returns };
}
