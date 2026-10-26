/* Group Anagrams — animated walkthrough scene (3Blue1Brown style).
 *
 * Words sit in a row as chips. For each word its letters sort into the
 * canonical key (written under the chip), a bucket appears for that key, and
 * the chip drops into it. The finale reveals the grouped result.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Group Anagrams",
    subtitle: "sorted-letter key · hash map · O(n · k log k)",
    inputs: [
      { id: "strs", label: "strs", type: "text",
        default: "eat, tea, tan, ate, nat, bat", width: "wide" },
    ],
    legend: [
      { color: "#F0AC5F", text: "sorting key" },
      { color: "#5CD0B3", text: "bucket" },
      { color: "#83C167", text: "grouped" },
    ],
  },

  code: [
    "def group_anagrams(strs: List[str]) -> List[List[str]]:",
    "    groups: dict[str, List[str]] = defaultdict(list)",
    "    for word in strs:",
    "        key = \"\".join(sorted(word))",
    "        groups[key].append(word)",
    "    return list(groups.values())",
  ],

  read(values) {
    const raw = (values.strs || "").trim();
    if (!raw) return null;

    const words = [];
    for (let token of raw.split(",")) {
      token = token.trim();
      if (!token) continue;
      let quoted = false;
      const first = token[0], last = token[token.length - 1];
      if (token.length >= 2 && ((first === '"' && last === '"') ||
                                (first === "'" && last === "'"))) {
        token = token.slice(1, -1);
        quoted = true;
      }
      if (!token && !quoted) continue;      // skip stray/trailing commas
      words.push(token);
    }
    if (words.length < 1 || words.length > 8) return null;
    return { strs: words };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || !Array.isArray(args[0])) return null;
    const words = args[0].slice(0, 8).map(String);
    if (!words.length) return { strs: "" };
    // Empty strings are shown as "" so `read` can recover them.
    return { strs: words.map(w => (w === "" ? '""' : w)).join(", ") };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, setScaleAt, STAGE_W } = ctx;
    const strs = params.strs;
    const n = strs.length;
    const sim = simulate(strs);
    const g = sim.order.length;

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-teal", C.teal);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const trayL = ctx.layer("bg");       // trays sit under the chips
    const resultL = ctx.layer("result");

    const scene = { strs, sim, ctx, chips: [], trays: [], trayByKey: new Map(), _writers: [] };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // --- title + subtitle --------------------------------------------
    scene.title = txt("Group Anagrams", {
      x: 64, y: 70, "font-size": 42, fill: C.white, "letter-spacing": 1,
    }, textL);
    const sub = el("text", { x: 64, y: 104, "font-size": 20, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "strs = ";
    el("tspan", { fill: C.white }, sub).textContent =
      "[" + strs.map(w => JSON.stringify(w)).join(", ") + "]";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // --- word chips (top row) ----------------------------------------
    const maxLen = Math.max(1, ...strs.map(w => w.length));
    const topChipW = clamp(maxLen * 24 + 30, 56, 150);
    const topChipH = 58;
    const topY = 150;
    const gap = 18;
    const totalW = n * topChipW + (n - 1) * gap;
    const startX = STAGE_W / 2 - totalW / 2;
    const wordFont = clamp(topChipW * 0.34, 12, 30);

    strs.forEach((word, i) => {
      const x = startX + i * (topChipW + gap);
      const pos = el("g", { transform: "translate(" + x + " " + topY + ")" }, chipsL);
      const scaleG = el("g", {}, pos);
      const cx = topChipW / 2, cy = topChipH / 2;
      const rx = Math.min(14, topChipW * 0.28);
      el("rect", {
        x: 0, y: 0, width: topChipW, height: topChipH, rx,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, scaleG);
      const wordText = txt(word, {
        x: cx, y: cy + 1, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": wordFont, fill: C.white,
      }, scaleG);
      const hlBlue = el("rect", {
        x: 0, y: 0, width: topChipW, height: topChipH, rx, fill: "none",
        stroke: C.blue, "stroke-width": 3, filter: "url(#glow-blue)",
      }, scaleG);
      const hlGreen = el("rect", {
        x: 0, y: 0, width: topChipW, height: topChipH, rx, fill: "none",
        stroke: C.green, "stroke-width": 3, filter: "url(#glow-green)",
      }, scaleG);
      setOpacity(hlBlue, 0);
      setOpacity(hlGreen, 0);

      // key letters under the chip, one node per sorting step
      const keyG = el("g", {}, pos);
      const keyNodes = sortSteps(word).map(step => {
        const node = el("text", {
          x: cx, y: topChipH + 30, "text-anchor": "middle", "font-size": 23,
        }, keyG);
        if (!step.letters.length) {
          const s = el("tspan", { fill: C.grey }, node);
          s.textContent = "∅";
        } else {
          step.letters.forEach((ch, idx) => {
            const s = el("tspan", { fill: idx <= step.upto ? C.green : C.gold }, node);
            s.textContent = ch;
          });
        }
        setOpacity(node, 0);
        return node;
      });

      scene.chips.push({
        i, word, x, y: topY, w: topChipW, h: topChipH, cx, cy,
        pos, scaleG, wordText, hlBlue, hlGreen, keyG, keyNodes, target: null,
      });
    });

    // --- bucket trays (one per distinct key) --------------------------
    const gapT = 26;
    const colW = clamp((1120 - gapT * (g - 1)) / g, 120, 420);
    const totalT = g * colW + (g - 1) * gapT;
    const startT = STAGE_W / 2 - totalT / 2;
    const trayTop = 366, trayH = 176;
    const slotCenterY = trayTop + 116;

    sim.order.forEach((key, t) => {
      const x = startT + t * (colW + gapT);
      const grp = el("g", { transform: "translate(" + x + " " + trayTop + ")" }, trayL);
      el("rect", {
        x: 0, y: 0, width: colW, height: trayH, rx: 16,
        fill: "#101722", stroke: C.greyDark, "stroke-width": 2,
      }, grp);
      const head = txt(key === "" ? "∅" : key, {
        x: colW / 2, y: 42, "text-anchor": "middle", "font-size": 26,
        fill: C.teal, "letter-spacing": 2,
      }, grp);
      el("line", {
        x1: 18, y1: 58, x2: colW - 18, y2: 58,
        stroke: C.greyDark, "stroke-width": 2,
      }, grp);
      setOpacity(grp, 0);
      const tray = { key, t, grp, head, x, colW, slotCenterY };
      scene.trays.push(tray);
      scene.trayByKey.set(key, tray);
    });

    // --- where each chip lands (target slots inside its tray) ---------
    const slotGap = 14;
    sim.order.forEach(key => {
      const tray = scene.trayByKey.get(key);
      const members = sim.groups.get(key);
      const m = members.length;
      let sc = 0.66;
      const need = m * topChipW * sc + (m - 1) * slotGap;
      if (need > colW - 28) sc = (colW - 28 - (m - 1) * slotGap) / (m * topChipW);
      sc = clamp(sc, 0.3, 0.8);
      members.forEach((wi, s) => {
        const pitch = topChipW * sc + slotGap;
        scene.chips[wi].target = {
          tx: tray.x + colW / 2 + (s - (m - 1) / 2) * pitch,
          ty: slotCenterY,
          sc,
        };
      });
    });

    // --- caption + status lines --------------------------------------
    scene.caption = txt("buckets · one per sorted key", {
      x: STAGE_W / 2, y: 348, "text-anchor": "middle", "font-size": 18, fill: C.grey,
    }, textL);
    setOpacity(scene.caption, 0);

    scene.statuses = [];
    const statusY = 312;
    const mkStatus = (str, fill) => {
      const node = txt(str, {
        x: STAGE_W / 2, y: statusY, "text-anchor": "middle", "font-size": 21,
        fill: fill || C.grey,
      }, textL);
      setOpacity(node, 0);
      scene.statuses.push(node);
      return node;
    };
    scene.statusIntro = mkStatus(
      "key each word by its sorted letters, then drop it into its bucket");
    scene.statusSort = strs.map((w, i) =>
      mkStatus('sort "' + w + '" → key "' + sim.keys[i] + '"', C.gold));
    scene.statusDrop = strs.map((w, i) =>
      mkStatus('drop "' + w + '" into bucket [' + sim.keys[i] + ']', C.teal));
    scene.statusFinal = mkStatus("all words grouped by their key", C.green);

    // --- result banner -----------------------------------------------
    const groupsText = sim.order.map(k =>
      "[" + sim.groups.get(k).map(wi => JSON.stringify(strs[wi])).join(", ") + "]"
    ).join(", ");
    scene.result = txt("return [" + groupsText + "]", {
      x: STAGE_W / 2, y: 634, "text-anchor": "middle", "font-size": 25, fill: C.green,
    }, resultL);
    setOpacity(scene.result, 0);
    const rule = el("line", {
      x1: STAGE_W / 2 - 300, y1: 656, x2: STAGE_W / 2 + 300, y2: 656,
      stroke: C.green, "stroke-width": 3, "stroke-linecap": "round",
    }, resultL);
    const ruleLen = rule.getTotalLength();
    rule.setAttribute("stroke-dasharray", String(ruleLen));
    rule.setAttribute("stroke-dashoffset", String(ruleLen));
    scene.resultRule = rule;
    scene.ruleLen = ruleLen;

    // --- baseline: the timeline replays from here on every render -----
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.caption, 0);
      for (const chip of scene.chips) {
        setOpacity(chip.pos, 1);
        setTranslate(chip.pos, chip.x, chip.y);
        setScaleAt(chip.scaleG, chip.cx, chip.cy, 1);
        setOpacity(chip.wordText, 1);
        setOpacity(chip.hlBlue, 0);
        setOpacity(chip.hlGreen, 0);
        setOpacity(chip.keyG, 1);
        for (const node of chip.keyNodes) setOpacity(node, 0);
      }
      for (const tray of scene.trays) setOpacity(tray.grp, 0);
      for (const node of scene.statuses) setOpacity(node, 0);
      setOpacity(scene.result, 0);
      scene.resultRule.setAttribute("stroke-dashoffset", String(scene.ruleLen));
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { ease, setOpacity, setTranslate, setScaleAt, clamp } = ctx;
    const { sim } = scene;

    // reveal = fade-in + left→right write-on, so writer nodes stay visible
    const reveal = (node, dur, easeFn) => {
      const w = scene.writer(node);
      const apply = u => { setOpacity(node, clamp(u * 1.7, 0, 1)); w(u); };
      apply.node = node;  // log this line to the narration transcript
      tl.add(dur, apply, easeFn || ease.linear);
    };

    // --- intro --------------------------------------------------------
    tl.line(1);
    reveal(scene.title, 0.6, ease.outCubic);
    tl.add(0.4, u => setOpacity(scene.subtitle, u), ease.outCubic);
    tl.wait(0.1);
    scene.chips.forEach(chip => {
      tl.add(0.35, u => {
        setOpacity(chip.pos, u);
        setTranslate(chip.pos, chip.x, chip.y + (1 - u) * 16);
      }, ease.outCubic);
      tl.wait(0.06);
    });
    tl.line(2);
    tl.add(0.4, u => setOpacity(scene.caption, u), ease.outCubic);
    reveal(scene.statusIntro, 0.5);

    let prevStatus = scene.statusIntro;

    // --- one word at a time -------------------------------------------
    scene.chips.forEach((chip, i) => {
      const key = sim.keys[i];
      const tray = scene.trayByKey.get(key);
      const isFirst = sim.groups.get(key)[0] === i;

      // focus the chip
      tl.line(3);
      tl.add(0.3, u => setOpacity(chip.hlBlue, u), ease.outCubic);
      tl.add(0.45, u => setScaleAt(chip.scaleG, chip.cx, chip.cy,
                                   1 + 0.05 * Math.sin(Math.PI * u)), ease.linear);
      tl.wait(0.05);

      // sort the letters into the key, written under the chip
      tl.line(4);
      const fading1 = prevStatus;
      tl.add(0.25, u => setOpacity(fading1, 1 - u), ease.outCubic);
      reveal(scene.statusSort[i], 0.32);
      tl.add(0.2, u => setOpacity(chip.keyG, u), ease.outCubic);
      chip.keyNodes.forEach((node, si) => {
        if (si === 0) {
          tl.add(0.32, u => setOpacity(node, u), ease.outCubic);
        } else {
          tl.add(0.3, u => {
            setOpacity(chip.keyNodes[si - 1], 1 - u);
            setOpacity(node, u);
          }, ease.outCubic);
          tl.add(0.18, u => setScaleAt(chip.scaleG, chip.cx, chip.cy,
                                       1 + 0.035 * Math.sin(Math.PI * u)), ease.linear);
        }
      });
      prevStatus = scene.statusSort[i];

      // the bucket for this key appears on its first word
      tl.line(5);
      if (isFirst) tl.add(0.4, u => setOpacity(tray.grp, u), ease.outCubic);

      const fading2 = prevStatus;
      tl.add(0.2, u => setOpacity(fading2, 1 - u), ease.outCubic);
      reveal(scene.statusDrop[i], 0.3);
      prevStatus = scene.statusDrop[i];

      // stop glowing blue, glow green; hide the key row
      tl.add(0.25, u => {
        setOpacity(chip.keyG, 1 - u);
        setOpacity(chip.hlBlue, 1 - u);
        setOpacity(chip.hlGreen, u);
      }, ease.outCubic);

      // drop the chip into its bucket
      const tgt = chip.target;
      const txp = tgt.tx - chip.w / 2, typ = tgt.ty - chip.h / 2;
      tl.add(0.85, u => {
        setTranslate(chip.pos, chip.x + (txp - chip.x) * u,
                     chip.y + (typ - chip.y) * u);
        setScaleAt(chip.scaleG, chip.cx, chip.cy, 1 + (tgt.sc - 1) * u);
      }, ease.inOutSine);
      tl.add(0.35, u => setScaleAt(chip.scaleG, chip.cx, chip.cy,
                                   tgt.sc * (1 + 0.09 * Math.sin(Math.PI * u))), ease.linear);
      tl.wait(0.08);
    });

    // --- finale: grouped result ---------------------------------------
    tl.line(6);
    const fadingFinal = prevStatus;
    tl.add(0.3, u => setOpacity(fadingFinal, 1 - u), ease.outCubic);
    reveal(scene.statusFinal, 0.4);
    reveal(scene.result, 0.9);
    tl.add(0.5, u => {
      scene.resultRule.setAttribute("stroke-dashoffset",
                                    String(scene.ruleLen * (1 - u)));
    }, ease.outCubic);
    tl.wait(1.6);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Pure algorithm model: the steps the animation narrates.
 * ------------------------------------------------------------------ */

function simulate(strs) {
  const order = [];
  const groups = new Map();
  const keys = [];
  for (let i = 0; i < strs.length; i++) {
    const key = strs[i].split("").sort().join("");
    keys.push(key);
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key).push(i);
  }
  return { order, groups, keys };
}

function sortSteps(word) {
  const letters = word.split("");
  const steps = [{ letters: letters.slice(), upto: -1 }];
  for (let j = 0; j < letters.length; j++) {
    let m = j;
    for (let k = j + 1; k < letters.length; k++) {
      if (letters[k] < letters[m]) m = k;
    }
    if (m !== j) {
      const t = letters[j]; letters[j] = letters[m]; letters[m] = t;
    }
    steps.push({ letters: letters.slice(), upto: j });
  }
  return steps;
}
