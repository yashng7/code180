/* Car Fleet — animated walkthrough scene (3Blue1Brown style).
 *
 * Sort cars by starting position descending (closest to `target` first).
 * Process each car and compute its solo arrival time `t = (target - pos) / speed`:
 *   - If `t > fleet_time` (the fleet ahead), it cannot catch up → starts a new
 *     fleet and becomes the new bottleneck (`fleet_time = t`).
 *   - If `t <= fleet_time`, it catches up to the slower fleet ahead and merges.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Car Fleet",
    subtitle: "sort by position desc + monotonic fleet arrival times · O(n log n) time",
    inputs: [
      { id: "target", label: "target", type: "number", default: 12, min: 1, max: 1000 },
      { id: "position", label: "position", type: "text", default: "10, 8, 0, 5, 3", width: "wide" },
      { id: "speed", label: "speed", type: "text", default: "2, 4, 1, 1, 3", width: "wide" },
    ],
    legend: [
      { color: "#F0AC5F", text: "car being evaluated" },
      { color: "#83C167", text: "new fleet leader (t > fleet_time)" },
      { color: "#58C4DD", text: "merges into fleet ahead (t ≤ fleet_time)" },
    ],
  },

  code: [
    "def car_fleet(target: int, position: List[int], speed: List[int]) -> int:",
    "    cars = sorted(zip(position, speed), reverse=True)",
    "    fleets = 0",
    "    fleet_time = 0.0",
    "    for pos, spd in cars:",
    "        time = (target - pos) / spd",
    "        if time > fleet_time:",
    "            fleets += 1",
    "            fleet_time = time",
    "    return fleets",
  ],

  read(values) {
    const target = Number(values.target);
    const posRaw = (values.position || "").trim();
    const spdRaw = (values.speed || "").trim();
    if (!posRaw || !spdRaw || !Number.isInteger(target) || target <= 0) return null;
    const position = posRaw.split(/[\s,]+/).filter(Boolean).map(Number);
    const speed = spdRaw.split(/[\s,]+/).filter(Boolean).map(Number);
    if (position.length < 1 || position.length > 10) return null;
    if (position.length !== speed.length) return null;
    if (!position.every(p => Number.isInteger(p) && p >= 0 && p < target)) return null;
    if (!speed.every(s => Number.isInteger(s) && s > 0)) return null;
    return { target, position, speed };
  },

  fromArgs(args) {
    if (Array.isArray(args) && args.length >= 3
        && Number.isInteger(args[0]) && Array.isArray(args[1]) && Array.isArray(args[2])) {
      const target = args[0];
      const position = args[1].map(Number);
      const speed = args[2].map(Number);
      if (position.length >= 1 && position.length <= 10 && position.length === speed.length) {
        return {
          target,
          position: position.join(", "),
          speed: speed.join(", "),
        };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const { target, position, speed } = params;
    const sim = simulate(target, position, speed);
    const n = sim.cars.length;

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const arcsL = ctx.layer("arcs");
    const chipsL = ctx.layer("chips");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = {
      target, position, speed, sim, ctx,
      carCards: [], fleetSlots: [], eqs: [], actions: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title + subtitle -------------------------------------------------
    scene.title = txt("Car Fleet", {
      x: 64, y: 72, "font-size": 44, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    const sub = el("text", { x: 64, y: 110, "font-size": 21, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = `target = `;
    el("tspan", { fill: C.gold }, sub).textContent = String(target);
    el("tspan", {}, sub).textContent = `   ·   cars sorted by position descending (closest to target first)`;
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- top-right fleet scoreboard ---------------------------------------
    const scoreG = el("g", {}, textL);
    setOpacity(scoreG, 0);
    el("rect", {
      x: 880, y: 50, width: 340, height: 66, rx: 10,
      fill: "#111722", stroke: C.green, "stroke-width": 2,
    }, scoreG);
    txt("fleets:", { x: 902, y: 83, "font-size": 20, fill: C.grey, "dominant-baseline": "central" }, scoreG);
    scene.fleetCountVal = txt("0", { x: 1005, y: 83, "font-size": 26, fill: C.green, "text-anchor": "end", "dominant-baseline": "central" }, scoreG);
    txt("lead t:", { x: 1040, y: 83, "font-size": 20, fill: C.grey, "dominant-baseline": "central" }, scoreG);
    scene.leadTimeVal = txt("0", { x: 1198, y: 83, "font-size": 24, fill: C.gold, "text-anchor": "end", "dominant-baseline": "central" }, scoreG);
    scene.scoreBadge = scoreG;

    // -- sorted cars row (y=220) ------------------------------------------
    const rowY = 220;
    const cardW = clamp(Math.floor(980 / n) - 10, 86, 134);
    const cardH = 82;
    const pitch = cardW + 10;
    const totalW = n * pitch - 10;
    const startX = STAGE_W / 2 - totalW / 2;

    for (let i = 0; i < n; i++) {
      const car = sim.cars[i];
      const x = startX + i * pitch;
      const cx = x + cardW / 2;
      const g = el("g", {}, chipsL);
      setOpacity(g, 0);

      const box = el("rect", {
        x, y: rowY - cardH / 2, width: cardW, height: cardH, rx: 10,
        fill: C.cellBg, stroke: C.cellStroke, "stroke-width": 2,
      }, g);

      txt(`pos=${car.pos}`, {
        x: cx, y: rowY - 20, "font-size": 18, fill: C.white,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);

      txt(`spd=${car.spd}`, {
        x: cx, y: rowY + 3, "font-size": 16, fill: C.grey,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);

      const tTxt = txt(`t=${car.tStr}`, {
        x: cx, y: rowY + 25, "font-size": 17, fill: C.gold,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);

      scene.carCards.push({ g, box, tTxt, x, cx, w: cardW });
    }

    // -- cursor pointer ---------------------------------------------------
    const ptrG = el("g", {}, ptrL);
    setOpacity(ptrG, 0);
    el("polygon", {
      points: "-8,-14 8,-14 0,-2",
      fill: C.gold, filter: "url(#glow-gold)",
    }, ptrG);
    scene.cursorPtr = ptrG;

    // -- fleet arrival stack row (y=360) ----------------------------------
    const stY = 360;
    scene.stackLabel = txt("fleet stack (arrival times) :", {
      x: 84, y: stY, "font-size": 20, fill: C.grey,
      "dominant-baseline": "central",
    }, textL);
    setOpacity(scene.stackLabel, 0);

    const slotW = 112;
    const slotGap = 12;
    const stStartX = 345;
    for (let k = 0; k < n; k++) {
      const bx = stStartX + k * (slotW + slotGap);
      const g = el("g", {}, arcsL);
      setOpacity(g, 0);
      const rect = el("rect", {
        x: bx, y: stY - 24, width: slotW, height: 48, rx: 8,
        fill: "#15281E", stroke: C.green, "stroke-width": 2.2,
      }, g);
      const label = txt("", {
        x: bx + slotW / 2, y: stY, "font-size": 19, fill: C.green,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);
      scene.fleetSlots.push({ g, rect, label });
    }

    // -- per-step equation & action notes ---------------------------------
    sim.steps.forEach(st => {
      const eq = el("text", {
        x: STAGE_W / 2, y: 452, "font-size": 25, fill: C.white,
        "text-anchor": "middle",
      }, textL);
      el("tspan", { fill: C.gold }, eq).textContent =
        `car @ pos ${st.pos} (spd ${st.spd}) :  t = (${target} − ${st.pos}) / ${st.spd} = ${st.tStr}`;
      el("tspan", { fill: st.newFleet ? C.green : C.blue }, eq).textContent =
        st.newFleet
          ? `  >  fleet_time (${st.leadBeforeStr})`
          : `  ≤  fleet_time (${st.leadBeforeStr})`;
      scene.eqs.push(eq);

      const act = txt(st.actionText, {
        x: STAGE_W / 2, y: 498, "font-size": 22,
        fill: st.newFleet ? C.green : C.blue,
        "text-anchor": "middle",
      }, textL);
      scene.actions.push(act);
    });

    // -- final banner -----------------------------------------------------
    const bY = 595;
    scene.bannerBox = el("rect", {
      x: 240, y: bY - 36, width: 800, height: 70, rx: 12,
      fill: "#13261B", stroke: C.green, "stroke-width": 2.5,
      filter: "url(#glow-green)",
    }, resultL);
    setOpacity(scene.bannerBox, 0);

    scene.bannerText = txt(
      `return ${sim.fleets}   (${sim.fleets} distinct car fleet(s) arrive at target ${target})`,
      {
        x: STAGE_W / 2, y: bY, "font-size": 26, fill: C.green,
        "text-anchor": "middle", "dominant-baseline": "central",
      },
      resultL
    );

    scene.complexity = txt(
      "Sort by position + single linear sweep · O(n log n) time · O(n) space",
      { x: STAGE_W / 2, y: 668, "font-size": 20, fill: C.grey, "text-anchor": "middle" },
      resultL
    );

    // -- reset ------------------------------------------------------------
    scene.reset = () => {
      setOpacity(scene.title, 0);
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.scoreBadge, 0);
      scene.fleetCountVal.textContent = "0";
      scene.leadTimeVal.textContent = "0";
      setOpacity(scene.cursorPtr, 0);
      setOpacity(scene.stackLabel, 0);
      setOpacity(scene.bannerBox, 0);
      if (scene.carCards[0]) {
        setTranslate(scene.cursorPtr, scene.carCards[0].cx, rowY - cardH / 2 - 8);
      }
      for (const c of scene.carCards) {
        setOpacity(c.g, 0);
        c.box.setAttribute("fill", C.cellBg);
        c.box.setAttribute("stroke", C.cellStroke);
      }
      for (const sl of scene.fleetSlots) {
        setOpacity(sl.g, 0);
        sl.label.textContent = "";
      }
      for (const w of scene._writers) w.reset();
    };

    return scene;
  },

  buildTimeline(scene, tl) {
    const { ctx, sim } = scene;
    const { C, ease, clamp, setOpacity, setTranslate } = ctx;
    const easeOut = ease.outCubic;
    const easeInOut = ease.inOutSine;
    const lerp = (a, b, t) => a + (b - a) * t;
    const ptrY = 220 - 41 - 8;

    const wTitle = scene.writer(scene.title);
    const wEqs = scene.eqs.map(scene.writer);
    const wActs = scene.actions.map(scene.writer);
    const wBanner = scene.writer(scene.bannerText);
    const wComplex = scene.writer(scene.complexity);

    scene.reset();

    const renderFleets = fleetTimes => {
      scene.fleetSlots.forEach((sl, idx) => {
        if (idx < fleetTimes.length) {
          sl.label.textContent = `F${idx + 1}: t=${fleetTimes[idx]}`;
          setOpacity(sl.g, 1);
        } else {
          setOpacity(sl.g, 0);
        }
      });
    };

    // 1. Title + subtitle + sorted car cards
    tl.line(1);
    tl.add(0.75, wTitle);
    tl.add(0.45, u => setOpacity(scene.subtitle, easeOut(u)));
    tl.line(2);
    tl.add(0.65, u => {
      setOpacity(scene.scoreBadge, easeOut(u));
      setOpacity(scene.stackLabel, easeOut(u));
      scene.carCards.forEach((c, i) => {
        const start = i * 0.06;
        const p = clamp((u - start) / Math.max(0.25, 1 - start), 0, 1);
        setOpacity(c.g, easeOut(p));
      });
    });
    tl.line([3, 4]);
    tl.wait(0.2);

    let prevEq = null;
    let prevAct = null;

    sim.steps.forEach((st, idx) => {
      const cCur = scene.carCards[idx];
      const cPrev = idx === 0 ? cCur : scene.carCards[idx - 1];
      const fadingEq = prevEq;
      const fadingAct = prevAct;

      tl.line(5);
      tl.add(0.42, u => {
        const e = easeInOut(u);
        if (fadingEq) setOpacity(fadingEq, 1 - e);
        if (fadingAct) setOpacity(fadingAct, 1 - e);
        setTranslate(scene.cursorPtr, lerp(cPrev.cx, cCur.cx, e), ptrY);
        setOpacity(scene.cursorPtr, 1);
        if (u > 0.5) {
          cCur.box.setAttribute("stroke", C.gold);
          cCur.box.setAttribute("fill", "#262015");
        }
      });

      tl.line(6);
      tl.add(0.52, wEqs[idx]);
      tl.line(7);
      tl.add(0.48, wActs[idx]);

      tl.line(st.newFleet ? [8, 9] : 7);
      tl.add(0.32, u => {
        if (u > 0.4) {
          cCur.box.setAttribute("stroke", st.newFleet ? C.green : C.blue);
          cCur.box.setAttribute("fill", st.newFleet ? "#15281E" : "#142636");
          scene.fleetCountVal.textContent = String(st.fleetsAfter);
          scene.leadTimeVal.textContent = st.leadAfterStr;
          renderFleets(st.fleetListAfter);
        }
      });

      prevEq = scene.eqs[idx];
      prevAct = scene.actions[idx];
    });

    const lastEq = prevEq;
    const lastAct = prevAct;
    tl.add(0.4, u => {
      const e = easeOut(u);
      if (lastEq) setOpacity(lastEq, 1 - e);
      if (lastAct) setOpacity(lastAct, 1 - e);
      setOpacity(scene.cursorPtr, 1 - e);
    });

    tl.line(10);
    tl.add(0.3, u => setOpacity(scene.bannerBox, easeOut(u)));
    tl.add(0.55, wBanner);
    tl.add(0.65, wComplex);
    tl.wait(0.6);
  },
};

function fmtEta(t) {
  return Number.isInteger(t) ? `${t}s` : `${Number(t.toFixed(2))}s`;
}

function simulate(target, position, speed) {
  const cars = position
    .map((pos, i) => {
      const spd = speed[i];
      const time = (target - pos) / spd;
      return { pos, spd, time, tStr: fmtEta(time) };
    })
    .sort((a, b) => b.pos - a.pos);

  let fleets = 0;
  let fleetTime = 0;
  const fleetList = [];
  const steps = [];

  for (let i = 0; i < cars.length; i++) {
    const { pos, spd, time, tStr } = cars[i];
    const leadBeforeStr = fmtEta(fleetTime);
    const newFleet = time > fleetTime;

    if (newFleet) {
      fleets += 1;
      fleetTime = time;
      fleetList.push(tStr);
    }

    const leadAfterStr = fmtEta(fleetTime);
    const actionText = newFleet
      ? `slower than fleet ahead → forms new Fleet #${fleets} with arrival time ${tStr}`
      : `catches up to Fleet #${fleets} ahead (capped at ${leadAfterStr}) → merges without new fleet`;

    steps.push({
      i,
      pos,
      spd,
      time,
      tStr,
      leadBeforeStr,
      leadAfterStr,
      newFleet,
      fleetsAfter: fleets,
      fleetListAfter: fleetList.slice(),
      actionText,
    });
  }

  return { cars, steps, fleets };
}
