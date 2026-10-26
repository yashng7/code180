/* Time Based Key-Value Store — animated walkthrough scene (3Blue1Brown style).
 *
 * A design problem. The operation strip across the top is replayed in order:
 * TimeMap(), set(foo, bar, 1), get(foo, 1), get(foo, 3), set(foo, bar2, 4),
 * get(foo, 4), get(foo, 5). Each key owns an append-only list of
 * (timestamp, value) pairs. A get binary-searches that list for the rightmost
 * timestamp <= the query, keeping the best value seen so far.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Time Based Key-Value Store",
    subtitle: "per-key timestamp list · get = rightmost timestamp ≤ query · O(log n)",
    inputs: [
      {
        id: "ops",
        label: "operations",
        type: "text",
        default: "TimeMap(), set(foo, bar, 1), get(foo, 1), get(foo, 3), set(foo, bar2, 4), get(foo, 4), get(foo, 5)",
        width: "wide",
      },
    ],
    legend: [
      { color: "#58C4DD", text: "set / append" },
      { color: "#F0AC5F", text: "mid timestamp" },
      { color: "#5CD0B3", text: "current result" },
      { color: "#B58CD6", text: "hi" },
    ],
  },

  code: [
    "class TimeMap:",
    '    """Append-only store; timestamps arrive strictly increasing per key."""',
    "",
    "    def __init__(self) -> None:",
    "        self._store: Dict[str, List[Tuple[int, str]]] = {}",
    "",
    "    def set(self, key: str, value: str, timestamp: int) -> None:",
    "        self._store.setdefault(key, []).append((timestamp, value))",
    "",
    "    def get(self, key: str, timestamp: int) -> str:",
    "        entries = self._store.get(key)",
    "        if not entries:",
    '            return ""',
    "        # Largest timestamp <= query: rightmost entry that is not too new.",
    "        lo, hi = 0, len(entries) - 1",
    '        result = ""',
    "        while lo <= hi:",
    "            mid = (lo + hi) // 2",
    "            if entries[mid][0] <= timestamp:",
    "                result = entries[mid][1]",
    "                lo = mid + 1          # look for something even closer",
    "            else:",
    "                hi = mid - 1",
    "        return result",
  ],

  read(values) {
    const raw = (values.ops || "").trim();
    if (!raw) return null;
    const parts = splitOps(raw);
    if (parts.length < 1 || parts.length > 11) return null;

    const cmds = [];
    let seenInit = false;
    for (const part of parts) {
      if (/^TimeMap\(\s*\)$/i.test(part)) {
        if (seenInit || cmds.length > 0) return null;
        seenInit = true;
        cmds.push({ op: "init", label: "TimeMap()" });
        continue;
      }

      let m = part.match(/^set\(\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*(-?\d+)\s*\)$/i);
      if (m) {
        const key = cleanToken(m[1]);
        const value = cleanToken(m[2]);
        const timestamp = Number(m[3]);
        if (!validToken(key) || !validToken(value)) return null;
        if (!Number.isInteger(timestamp) || timestamp < 0) return null;
        cmds.push({
          op: "set", key, value, timestamp,
          label: "set(" + key + ", " + value + ", " + timestamp + ")",
        });
        continue;
      }

      m = part.match(/^get\(\s*([^,]+?)\s*,\s*(-?\d+)\s*\)$/i);
      if (m) {
        const key = cleanToken(m[1]);
        const timestamp = Number(m[2]);
        if (!validToken(key)) return null;
        if (!Number.isInteger(timestamp) || timestamp < 0) return null;
        cmds.push({
          op: "get", key, timestamp,
          label: "get(" + key + ", " + timestamp + ")",
        });
        continue;
      }
      return null;
    }

    const keys = new Set();
    for (const cmd of cmds) if (cmd.key) keys.add(cmd.key);
    if (keys.size > 6) return null;
    return { cmds };
  },

  fromArgs(args) {
    const spec = Array.isArray(args) ? args[0] : args;
    if (!spec || !Array.isArray(spec.ops) || !Array.isArray(spec.vals)) return null;
    const tokens = [];
    for (let i = 0; i < spec.ops.length; i++) {
      const op = spec.ops[i];
      const v = spec.vals[i] || [];
      if (op === "TimeMap") {
        tokens.push("TimeMap()");
      } else if (op === "set") {
        if (v.length < 3) return null;
        tokens.push("set(" + v[0] + ", " + v[1] + ", " + v[2] + ")");
      } else if (op === "get") {
        if (v.length < 2) return null;
        tokens.push("get(" + v[0] + ", " + v[1] + ")");
      } else {
        return null;
      }
    }
    if (!tokens.length || tokens.length > 11) return null;
    return { ops: tokens.join(", ") };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const { cmds } = params;
    const n = cmds.length;
    const sim = simulate(cmds);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-teal", C.teal);
    ctx.glow("glow-purple", C.purple);
    ctx.glow("glow-green", C.green);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = {
      cmds, sim, ctx, opCells: [], keyRows: [], searchChips: [],
      _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title + subtitle ------------------------------------------------
    scene.title = txt("Time Based Key-Value Store", {
      x: 64, y: 60, "font-size": 40, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    scene.subtitle = txt(
      "set appends (timestamp, value); get finds the rightmost timestamp ≤ query",
      { x: 64, y: 94, "font-size": 18, fill: C.grey },
      textL
    );
    setOpacity(scene.subtitle, 0);

    // ---- operation strip -------------------------------------------------
    const opY = 150;
    const opH = 46;
    const opW = clamp(Math.floor(1080 / n) - 8, 80, 128);
    const pitch = opW + 8;
    const totalW = n * pitch - 8;
    const startX = STAGE_W / 2 - totalW / 2;

    for (let i = 0; i < n; i++) {
      const x = startX + i * pitch;
      const cx = x + opW / 2;
      const g = el("g", {}, chipsL);
      setOpacity(g, 0);
      const box = el("rect", {
        x, y: opY - opH / 2, width: opW, height: opH, rx: 8,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, g);
      const short = cmds[i].label.replace(/,\s*/g, ",");
      const font = clamp(Math.min(16, (opW - 10) / Math.max(6, short.length * 0.54)), 9, 16);
      const lbl = txt(short, {
        x: cx, y: opY, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": font, fill: C.white,
      }, g);
      const retTxt = txt("", {
        x: cx, y: opY + opH / 2 + 16, "text-anchor": "middle",
        "font-size": 12, fill: C.teal,
      }, g);
      scene.opCells.push({ g, box, lbl, retTxt, x, cx, w: opW });
    }

    const opPtr = el("g", {}, ptrL);
    el("polygon", {
      points: "-8,-14 8,-14 0,-2", fill: C.gold, filter: "url(#glow-gold)",
    }, opPtr);
    setOpacity(opPtr, 0);
    scene.opPtr = opPtr;
    scene.opPtrY = opY - opH / 2 - 6;
    setTranslate(opPtr, scene.opCells[0].cx, scene.opPtrY);

    // ---- store label -----------------------------------------------------
    scene.storeLabel = el("text", { x: 96, y: 218, "font-size": 16 }, textL);
    const storeName = el("tspan", { fill: C.blue }, scene.storeLabel);
    storeName.textContent = "self._store";
    const storeDesc = el("tspan", { fill: C.grey }, scene.storeLabel);
    storeDesc.textContent = "   key → [(timestamp, value)]";
    setOpacity(scene.storeLabel, 0);

    // ---- store rows ------------------------------------------------------
    const keys = sim.keys;
    const maxEntries = Math.max(1, ...keys.map(k => sim.finalStore[k].length));
    const entryGap = 8;
    const entryW = clamp((1000 - entryGap * (maxEntries - 1)) / maxEntries, 84, 190);
    const entriesX = 226;
    const keyW = 108;
    const rowGap = clamp(180 / Math.max(keys.length, 1), 30, 52);
    const chipH = Math.min(38, rowGap - 8);
    const keyFont = 15;
    const entryFont = clamp(entryW * 0.12, 10, 15);

    scene.keyRows = keys.map((key, ki) => {
      const rowY = 242 + ki * rowGap;
      const g = el("g", {}, chipsL);
      setOpacity(g, 0);
      const keyRect = el("rect", {
        x: 96, y: rowY, width: keyW, height: chipH, rx: 8,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.8,
      }, g);
      const keyText = txt(key, {
        x: 96 + keyW / 2, y: rowY + chipH / 2 + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": keyFont, fill: C.white,
      }, g);

      const entries = sim.finalStore[key].map((entry, ei) => {
        const x = entriesX + ei * (entryW + entryGap);
        const eg = el("g", {}, g);
        setOpacity(eg, 0);
        const rect = el("rect", {
          x, y: rowY, width: entryW, height: chipH, rx: 8,
          fill: "#121a24", stroke: C.greyDark, "stroke-width": 1.4,
        }, eg);
        const text = el("text", {
          x: x + entryW / 2, y: rowY + chipH / 2 + 1, "text-anchor": "middle",
          "dominant-baseline": "central", "font-size": entryFont,
        }, eg);
        const tSpan = el("tspan", { fill: C.gold }, text);
        tSpan.textContent = "t=" + entry.t;
        const sep = el("tspan", { fill: C.grey }, text);
        sep.textContent = "  ·  ";
        const vSpan = el("tspan", { fill: C.white }, text);
        vSpan.textContent = entry.value;
        return { g: eg, rect, text, tSpan, vSpan, entry };
      });

      return { key, g, keyRect, keyText, entries, rowY };
    });

    // ---- search section --------------------------------------------------
    const searchLabelY = 452;
    const searchTop = 474;
    const searchH = 54;
    const searchGap = 12;
    const maxSlots = Math.max(1, ...keys.map(k => sim.finalStore[k].length));
    const searchW = clamp((760 - searchGap * (maxSlots - 1)) / maxSlots, 58, 180);
    const searchTotal = maxSlots * searchW + (maxSlots - 1) * searchGap;
    const originX = STAGE_W / 2 - searchTotal / 2;
    scene.searchGroupOriginX = originX;
    scene.searchTop = searchTop;
    scene.searchH = searchH;
    scene.searchW = searchW;
    scene.searchGap = searchGap;

    scene.searchLabel = txt("", {
      x: 96, y: searchLabelY, "font-size": 18, fill: C.gold,
    }, textL);
    setOpacity(scene.searchLabel, 0);

    const searchGroup = el("g", {}, chipsL);
    setOpacity(searchGroup, 0);
    setTranslate(searchGroup, originX, searchTop);
    scene.searchGroup = searchGroup;

    for (let i = 0; i < maxSlots; i++) {
      const x = i * (searchW + searchGap);
      const g = el("g", { transform: "translate(" + x + " 0)" }, searchGroup);
      setOpacity(g, 0);
      const rect = el("rect", {
        x: 0, y: 0, width: searchW, height: searchH, rx: 10,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, g);
      const tText = txt("", {
        x: searchW / 2, y: 19, "text-anchor": "middle",
        "font-size": clamp(searchW * 0.09, 10, 13), fill: C.gold,
      }, g);
      const vText = txt("", {
        x: searchW / 2, y: 40, "text-anchor": "middle",
        "font-size": clamp(searchW * 0.14, 10, 19), fill: C.white,
      }, g);
      const midRing = el("rect", {
        x: 0, y: 0, width: searchW, height: searchH, rx: 10, fill: "none",
        stroke: C.gold, "stroke-width": 3, filter: "url(#glow-gold)",
      }, g);
      setOpacity(midRing, 0);
      const resultRing = el("rect", {
        x: 0, y: 0, width: searchW, height: searchH, rx: 10, fill: "none",
        stroke: C.teal, "stroke-width": 3, filter: "url(#glow-teal)",
      }, g);
      setOpacity(resultRing, 0);
      scene.searchChips.push({ g, rect, tText, vText, midRing, resultRing });
    }

    const searchCenter = i => i * (searchW + searchGap) + searchW / 2;
    const mkSearchTick = (color, glowId) => {
      const g = el("g", {}, searchGroup);
      el("path", {
        d: "M -5 10 L 5 10 L 0 0 Z", fill: color, filter: "url(#" + glowId + ")",
      }, g);
      setOpacity(g, 0);
      return g;
    };
    scene.searchTickLo = mkSearchTick(C.blue, "glow-blue");
    scene.searchTickMid = mkSearchTick(C.gold, "glow-gold");
    scene.searchTickHi = mkSearchTick(C.purple, "glow-purple");
    setTranslate(scene.searchTickLo, searchCenter(0) - 6, searchH + 2);
    setTranslate(scene.searchTickMid, searchCenter(0), searchH + 2);
    setTranslate(scene.searchTickHi, searchCenter(0) + 6, searchH + 2);

    scene.emptySearch = txt("", {
      x: STAGE_W / 2, y: 500, "text-anchor": "middle",
      "font-size": 20, fill: C.grey,
    }, textL);
    setOpacity(scene.emptySearch, 0);

    // ---- marker read-out line -------------------------------------------
    scene.markerLine = el("text", {
      x: STAGE_W / 2, y: 566, "text-anchor": "middle", "font-size": 16,
    }, textL);
    const addPart = (str, fill) => {
      const t = el("tspan", fill ? { fill } : {}, scene.markerLine);
      t.textContent = str;
      return t;
    };
    addPart("lo ", C.grey);
    scene.markerLo = addPart("0", C.blue);
    addPart("   ·   ", C.grey);
    addPart("mid ", C.grey);
    scene.markerMid = addPart("—", C.gold);
    addPart("   ·   ", C.grey);
    addPart("hi ", C.grey);
    scene.markerHi = addPart("0", C.purple);
    addPart("   ·   result = ", C.grey);
    scene.markerResult = addPart('""', C.teal);
    setOpacity(scene.markerLine, 0);

    // ---- status line -----------------------------------------------------
    scene.status = txt("", {
      x: STAGE_W / 2, y: 598, "text-anchor": "middle",
      "font-size": 19, fill: C.gold,
    }, textL);
    setOpacity(scene.status, 0);

    // ---- final outputs ---------------------------------------------------
    const outStr = "[" + sim.outputs
      .map(v => (v === null ? "null" : JSON.stringify(v)))
      .join(", ") + "]";
    scene.outputsBox = el("rect", {
      x: STAGE_W / 2 - 460, y: 626, width: 920, height: 46, rx: 10,
      fill: "#111a16", stroke: C.green, "stroke-width": 1.8,
      filter: "url(#glow-green)",
    }, resultL);
    setOpacity(scene.outputsBox, 0);
    scene.outputs = txt("outputs = " + outStr, {
      x: STAGE_W / 2, y: 649, "text-anchor": "middle",
      "dominant-baseline": "central",
      "font-size": clamp(900 / Math.max(20, outStr.length * 0.62), 12, 17),
      fill: C.green,
    }, resultL);
    scene.complexity = txt(
      "set appends in O(1) amortized   ·   get binary-searches timestamps in O(log n)",
      { x: STAGE_W / 2, y: 696, "text-anchor": "middle", "font-size": 14, fill: C.grey },
      resultL
    );

    // ---- baseline --------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.storeLabel, 0);
      setOpacity(scene.opPtr, 0);
      setTranslate(scene.opPtr, scene.opCells[0].cx, scene.opPtrY);

      for (const c of scene.opCells) {
        setOpacity(c.g, 0);
        c.box.setAttribute("fill", C.chipFill);
        c.box.setAttribute("stroke", C.greyDark);
        c.retTxt.textContent = "";
        c.retTxt.setAttribute("fill", C.teal);
      }

      for (const row of scene.keyRows) {
        setOpacity(row.g, 0);
        row.keyRect.setAttribute("fill", C.chipFill);
        row.keyRect.setAttribute("stroke", C.greyDark);
        for (const e of row.entries) setOpacity(e.g, 0);
      }

      setOpacity(scene.searchLabel, 0);
      scene.searchLabel.textContent = "";
      setOpacity(scene.searchGroup, 0);
      setTranslate(scene.searchGroup, originX, searchTop);
      for (const chip of scene.searchChips) {
        setOpacity(chip.g, 0);
        setOpacity(chip.midRing, 0);
        setOpacity(chip.resultRing, 0);
        chip.tText.textContent = "";
        chip.vText.textContent = "";
        chip.tText.setAttribute("fill", C.gold);
        chip.vText.setAttribute("fill", C.white);
      }
      setTranslate(scene.searchTickLo, searchCenter(0) - 6, searchH + 2);
      setTranslate(scene.searchTickMid, searchCenter(0), searchH + 2);
      setTranslate(scene.searchTickHi, searchCenter(0) + 6, searchH + 2);
      setOpacity(scene.searchTickLo, 0);
      setOpacity(scene.searchTickMid, 0);
      setOpacity(scene.searchTickHi, 0);

      setOpacity(scene.emptySearch, 0);
      scene.emptySearch.textContent = "";

      setOpacity(scene.markerLine, 0);
      scene.markerLo.textContent = "0";
      scene.markerMid.textContent = "—";
      scene.markerHi.textContent = "0";
      scene.markerResult.textContent = '""';

      scene.status.textContent = "";
      setOpacity(scene.status, 0);
      setOpacity(scene.outputsBox, 0);
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, C } = ctx;
    const { sim } = scene;
    const { searchW, searchGap, searchH, searchTop } = scene;
    const searchCenter = i => i * (searchW + searchGap) + searchW / 2;

    const setStatus = (text, fill) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", fill);
      });
    };

    const highlightKey = key => {
      tl.add(0.01, () => {
        for (const row of scene.keyRows) {
          const on = row.key === key;
          row.keyRect.setAttribute("fill", on ? "#262015" : C.chipFill);
          row.keyRect.setAttribute("stroke", on ? C.gold : C.greyDark);
        }
      });
    };

    const prepareSearch = step => {
      const entries = step.entries;
      const count = entries.length;
      tl.add(0.01, () => {
        scene.searchLabel.textContent =
          step.label + "   ·   entries for " + JSON.stringify(step.key);
        scene.searchLabel.setAttribute("fill", C.gold);

        scene.searchChips.forEach((chip, i) => {
          if (i < count) {
            chip.tText.textContent = "t = " + entries[i].t;
            chip.vText.textContent = entries[i].value;
            chip.tText.setAttribute("fill", C.gold);
            chip.vText.setAttribute("fill", C.white);
            setOpacity(chip.midRing, 0);
            setOpacity(chip.resultRing, 0);
            setOpacity(chip.g, 1);
          } else {
            setOpacity(chip.g, 0);
          }
        });

        const offset = (scene.searchChips.length - count) * (searchW + searchGap) / 2;
        setTranslate(scene.searchGroup, scene.searchGroupOriginX + offset, searchTop);

        setTranslate(scene.searchTickLo, searchCenter(0) - 6, searchH + 2);
        setTranslate(scene.searchTickHi, searchCenter(count - 1) + 6, searchH + 2);
        setTranslate(scene.searchTickMid, searchCenter(0), searchH + 2);
        setOpacity(scene.searchTickLo, 1);
        setOpacity(scene.searchTickHi, 1);
        setOpacity(scene.searchTickMid, 0);

        scene.markerLo.textContent = "0";
        scene.markerHi.textContent = String(count - 1);
        scene.markerMid.textContent = "—";
        scene.markerResult.textContent = '""';

        setOpacity(scene.emptySearch, 0);
      });
      tl.add(0.3, u => {
        setOpacity(scene.searchLabel, u);
        setOpacity(scene.searchGroup, u);
        setOpacity(scene.markerLine, u);
      }, ease.outCubic);
    };

    const prepareSearchEmpty = step => {
      tl.add(0.01, () => {
        scene.searchLabel.textContent = step.label;
        scene.searchLabel.setAttribute("fill", C.gold);
        scene.emptySearch.textContent =
          "(no entries for " + JSON.stringify(step.key) + ")";
        setOpacity(scene.searchGroup, 0);
        setOpacity(scene.markerLine, 0);
        setOpacity(scene.emptySearch, 0);
      });
      tl.add(0.3, u => {
        setOpacity(scene.searchLabel, u);
        setOpacity(scene.emptySearch, u);
      }, ease.outCubic);
    };

    const hideSearch = hasEntries => {
      tl.add(0.25, u => {
        setOpacity(scene.searchLabel, 1 - u);
        if (hasEntries) {
          setOpacity(scene.searchGroup, 1 - u);
          setOpacity(scene.markerLine, 1 - u);
        } else {
          setOpacity(scene.emptySearch, 1 - u);
        }
      }, ease.outCubic);
    };

    scene.reset();

    // ---- intro -----------------------------------------------------------
    tl.line(1);
    tl.add(0.7, scene.writer(scene.title), ease.outCubic);
    tl.add(0.4, u => setOpacity(scene.subtitle, u), ease.outCubic);

    scene.opCells.forEach(cell => {
      tl.add(0.2, u => setOpacity(cell.g, u), ease.outCubic);
      tl.wait(0.02);
    });
    tl.add(0.35, u => {
      setOpacity(scene.storeLabel, u);
      setOpacity(scene.opPtr, u);
    }, ease.outCubic);
    setStatus("apply the operations in order; every set appends to its key's list", C.grey);
    tl.add(0.3, u => setOpacity(scene.status, u), ease.outCubic);
    tl.log("TimeMap: operations run in order, sets append (timestamp, value)", C.gold);

    // ---- replay the operation sequence ----------------------------------
    sim.steps.forEach((step, idx) => {
      const cell = scene.opCells[idx];
      const prevCell = idx === 0 ? cell : scene.opCells[idx - 1];

      tl.line(step.op === "init" ? 4 : (step.op === "set" ? 7 : 10));
      tl.add(0.35, u => {
        setTranslate(scene.opPtr, prevCell.cx + (cell.cx - prevCell.cx) * u, scene.opPtrY);
        setOpacity(scene.opPtr, 1);
        if (u > 0.5) {
          for (const c of scene.opCells) {
            c.box.setAttribute("fill", C.chipFill);
            c.box.setAttribute("stroke", C.greyDark);
          }
          cell.box.setAttribute("fill", "#262015");
          cell.box.setAttribute("stroke", C.gold);
        }
      }, ease.inOutSine);

      if (step.op === "init") {
        tl.line(4);
        setStatus("__init__: create an empty store", C.blue);
        tl.line(5);
        setStatus("self._store = {}   →   no keys yet", C.blue);
        tl.add(0.01, () => {
          cell.retTxt.textContent = "→ null";
          cell.retTxt.setAttribute("fill", C.grey);
        });
        tl.log("TimeMap()  →  self._store = {}", C.blue);
        tl.wait(0.3);
        return;
      }

      if (step.op === "set") {
        tl.line(7);
        setStatus("set(" + step.key + ", " + step.value + ", " + step.timestamp + ")", C.blue);
        tl.line(8);
        highlightKey(step.key);

        const row = scene.keyRows.find(r => r.key === step.key);
        if (step.isNewKey) {
          tl.add(0.4, u => setOpacity(row.g, u), ease.outCubic);
        }
        const entryCount = step.entriesAfter[step.key].length;
        const slot = row.entries[entryCount - 1];
        tl.add(0.4, u => setOpacity(slot.g, u), ease.outBack);
        setStatus(
          "self._store[" + JSON.stringify(step.key) + "].append((" +
          step.timestamp + ", " + JSON.stringify(step.value) + "))",
          C.blue
        );
        setStatus(
          JSON.stringify(step.key) + " now has " + entryCount +
          (entryCount === 1 ? " entry" : " entries") +
          "   ·   latest t=" + step.timestamp,
          C.grey
        );
        tl.add(0.01, () => {
          cell.retTxt.textContent = "→ null";
          cell.retTxt.setAttribute("fill", C.grey);
        });
        tl.log(
          "set(" + step.key + ", " + step.value + ", " + step.timestamp + ")  →  append",
          C.blue
        );
        tl.wait(0.3);
        return;
      }

      // ---- get -----------------------------------------------------------
      tl.line(10);
      setStatus("get(" + step.key + ", " + step.timestamp + ")", C.gold);
      tl.line(11);
      setStatus(
        "entries = self._store.get(" + JSON.stringify(step.key) + ")  →  " +
        (step.hasEntries ? step.entries.length + " entries" : "None"),
        C.white
      );
      highlightKey(step.key);

      if (!step.hasEntries) {
        prepareSearchEmpty(step);
        tl.line(12);
        setStatus("if not entries:  True   (unknown key)", C.red);
        tl.line(13);
        setStatus('return ""', C.teal);
        tl.add(0.01, () => {
          cell.retTxt.textContent = '→ ""';
          cell.retTxt.setAttribute("fill", C.teal);
        });
        tl.log(
          "get(" + step.key + ", " + step.timestamp + ')  →  ""   (unknown key)',
          C.teal
        );
        tl.wait(0.45);
        hideSearch(false);
        tl.wait(0.15);
        return;
      }

      prepareSearch(step);
      tl.line(12);
      setStatus("if not entries:  False   (" + step.entries.length + " entries)", C.white);
      tl.line(15);
      setStatus("lo, hi = 0, " + (step.entries.length - 1), C.white);
      tl.line(16);
      setStatus('result = ""', C.teal);

      let prevMid = -1;
      step.trace.forEach((tr, ti) => {
        tl.line(17);
        setStatus("while " + tr.lo + " <= " + tr.hi + "  ✓", C.gold);
        tl.wait(0.1);

        tl.line(18);
        setStatus("mid = (" + tr.lo + " + " + tr.hi + ") // 2 = " + tr.mid, C.gold);
        tl.add(0.01, () => {
          scene.markerMid.textContent = String(tr.mid);
          for (const chip of scene.searchChips) setOpacity(chip.midRing, 0);
          setOpacity(scene.searchChips[tr.mid].midRing, 1);
        });
        if (ti === 0) {
          tl.add(0.3, u => {
            setOpacity(scene.searchTickMid, u);
            setTranslate(scene.searchTickMid, searchCenter(tr.mid), searchH + 2);
          }, ease.outCubic);
        } else {
          const from = searchCenter(prevMid);
          const to = searchCenter(tr.mid);
          tl.add(0.4, u => setTranslate(scene.searchTickMid, from + (to - from) * u, searchH + 2), ease.inOutSine);
        }

        tl.line(19);
        setStatus(
          "entries[" + tr.mid + "].timestamp = " + tr.t + " <= " +
          step.timestamp + " ?  " + (tr.ok ? "yes" : "no"),
          tr.ok ? C.teal : C.red
        );
        tl.add(0.01, () => {
          scene.searchChips[tr.mid].tText.setAttribute("fill", tr.ok ? C.teal : C.red);
        });
        tl.wait(0.12);

        if (tr.ok) {
          tl.line(20);
          setStatus(
            "result = entries[" + tr.mid + "][1] = " + JSON.stringify(tr.value),
            C.teal
          );
          tl.add(0.01, () => {
            scene.markerResult.textContent = JSON.stringify(tr.value);
            for (const chip of scene.searchChips) setOpacity(chip.resultRing, 0);
            setOpacity(scene.searchChips[tr.mid].resultRing, 1);
          });
          tl.line(21);
          setStatus(
            "lo = mid + 1 = " + tr.newLo + "   (look for something even closer)",
            C.blue
          );
          if (tr.newLo < step.entries.length) {
            const from = searchCenter(tr.lo);
            const to = searchCenter(tr.newLo);
            tl.add(0.4, u => setTranslate(scene.searchTickLo, from + (to - from) * u - 6, searchH + 2), ease.inOutSine);
          } else {
            tl.add(0.3, u => setOpacity(scene.searchTickLo, 1 - u), ease.outCubic);
          }
          tl.add(0.01, () => { scene.markerLo.textContent = String(tr.newLo); });
        } else {
          tl.line([22, 23]);
          setStatus(
            "hi = mid - 1 = " + tr.newHi + "   (this entry is too new)",
            C.purple
          );
          if (tr.newHi >= 0) {
            const from = searchCenter(tr.hi);
            const to = searchCenter(tr.newHi);
            tl.add(0.4, u => setTranslate(scene.searchTickHi, from + (to - from) * u + 6, searchH + 2), ease.inOutSine);
          } else {
            tl.add(0.3, u => setOpacity(scene.searchTickHi, 1 - u), ease.outCubic);
          }
          tl.add(0.01, () => { scene.markerHi.textContent = String(tr.newHi); });
        }
        prevMid = tr.mid;
        tl.wait(0.12);
      });

      tl.line(17);
      setStatus(
        "while " + step.endLo + " <= " + step.endHi + "  ✗  →  loop ends",
        C.red
      );
      tl.line(24);
      setStatus("return result = " + JSON.stringify(step.result), C.teal);
      tl.add(0.01, () => {
        cell.retTxt.textContent = "→ " + JSON.stringify(step.result);
        cell.retTxt.setAttribute("fill", C.teal);
      });
      tl.log(
        "get(" + step.key + ", " + step.timestamp + ")  →  " +
        JSON.stringify(step.result),
        C.teal
      );
      tl.wait(0.45);
      hideSearch(true);
      tl.wait(0.15);
    });

    // ---- finale ----------------------------------------------------------
    tl.add(0.3, u => {
      setOpacity(scene.opPtr, 1 - u);
      for (const row of scene.keyRows) {
        row.keyRect.setAttribute("fill", C.chipFill);
        row.keyRect.setAttribute("stroke", C.greyDark);
      }
    }, ease.outCubic);
    tl.add(0.35, u => setOpacity(scene.outputsBox, u), ease.outCubic);
    tl.add(0.6, scene.writer(scene.outputs), ease.linear);
    tl.add(0.5, scene.writer(scene.complexity), ease.linear);
    tl.wait(0.6);
  },
};

/* ------------------------------------------------------------------ *
 * Input parsing helpers.
 * ------------------------------------------------------------------ */

function splitOps(raw) {
  const out = [];
  let depth = 0;
  let cur = "";
  for (const ch of raw) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}

function cleanToken(s) {
  s = String(s).trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

function validToken(s) {
  return typeof s === "string" && s.length >= 1 && s.length <= 10 &&
    /^[A-Za-z0-9_\-]+$/.test(s);
}

/* ------------------------------------------------------------------ *
 * Pure algorithm model: one frame per operation, with a binary-search
 * trace for every get.
 * ------------------------------------------------------------------ */

function snapshotStore(store) {
  const out = {};
  for (const [key, entries] of store) {
    out[key] = entries.map(e => ({ t: e.t, value: e.value }));
  }
  return out;
}

function simulate(cmds) {
  const store = new Map();
  const keys = [];
  const steps = [];
  const outputs = [];

  for (let i = 0; i < cmds.length; i++) {
    const cmd = cmds[i];

    if (cmd.op === "init") {
      steps.push({
        i, op: "init", label: cmd.label, ret: null,
        keysAfter: keys.slice(), entriesAfter: snapshotStore(store),
      });
      outputs.push(null);
      continue;
    }

    if (cmd.op === "set") {
      const isNewKey = !store.has(cmd.key);
      if (isNewKey) {
        store.set(cmd.key, []);
        keys.push(cmd.key);
      }
      store.get(cmd.key).push({ t: cmd.timestamp, value: cmd.value });
      steps.push({
        i, op: "set", label: cmd.label,
        key: cmd.key, value: cmd.value, timestamp: cmd.timestamp,
        ret: null, isNewKey,
        keysAfter: keys.slice(),
        entriesAfter: snapshotStore(store),
      });
      outputs.push(null);
      continue;
    }

    // get
    const entries = (store.get(cmd.key) || []).map(e => ({ t: e.t, value: e.value }));
    const trace = [];
    let lo = 0;
    let hi = entries.length - 1;
    let result = "";

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const entry = entries[mid];
      const ok = entry.t <= cmd.timestamp;
      trace.push({
        lo, hi, mid, t: entry.t, value: entry.value, ok,
        resultBefore: result,
        resultAfter: ok ? entry.value : result,
        newLo: ok ? mid + 1 : lo,
        newHi: ok ? hi : mid - 1,
      });
      if (ok) {
        result = entry.value;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    steps.push({
      i, op: "get", label: cmd.label,
      key: cmd.key, timestamp: cmd.timestamp,
      entries, trace, result, ret: result,
      hasEntries: entries.length > 0,
      endLo: lo, endHi: hi,
      keysAfter: keys.slice(),
    });
    outputs.push(result);
  }

  return { steps, keys, outputs, finalStore: snapshotStore(store) };
}
