/* Best Time to Buy and Sell Stock — animated walkthrough scene (3Blue1Brown style).
 *
 * Plot daily prices as connected points and vertical stems. Track the lowest
 * buy price seen so far (`buy` in blue) while sweeping `sell` (gold) left to
 * right. When `prices[sell] < prices[buy]`, slide the `buy` anchor to the new
 * valley; otherwise measure the vertical profit spread `prices[sell] - prices[buy]`
 * and lock in a green champion span whenever a new maximum profit is reached.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Best Time to Buy and Sell Stock",
    subtitle: "sliding window / running minimum · O(n) time · O(1) space",
    inputs: [
      { id: "prices", label: "prices", type: "text", default: "7, 1, 5, 3, 6, 4", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "buy (lowest so far)" },
      { color: "#F0AC5F", text: "sell (current day)" },
      { color: "#83C167", text: "best profit trade" },
      { color: "#FC6255", text: "new lower valley" },
    ],
  },

  code: [
    "def max_profit(prices: List[int]) -> int:",
    "    left = 0",
    "    best = 0",
    "    for right in range(1, len(prices)):",
    "        if prices[right] < prices[left]:",
    "            left = right",
    "        else:",
    "            best = max(best, prices[right] - prices[left])",
    "    return best",
  ],

  read(values) {
    const raw = (values.prices || "").trim();
    if (!raw) return null;
    const prices = raw.split(/[\s,]+/).filter(Boolean).map(Number);
    if (prices.length < 1 || prices.length > 14) return null;
    if (!prices.every(v => Number.isInteger(v) && v >= 0)) return null;
    return { prices };
  },

  fromArgs(args) {
    if (Array.isArray(args) && Array.isArray(args[0])) {
      const prices = args[0].map(Number);
      if (prices.length >= 1 && prices.length <= 14
          && prices.every(v => Number.isInteger(v) && v >= 0)) {
        return { prices: prices.join(", ") };
      }
    }
    return null;
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const prices = params.prices;
    const n = prices.length;
    const sim = simulate(prices);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-green", C.green);
    ctx.glow("glow-red", C.red);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const arcsL = ctx.layer("arcs");
    const chipsL = ctx.layer("chips");
    const ptrL = ctx.layer("pointer");
    const resultL = ctx.layer("result");

    const scene = {
      prices, sim, ctx,
      nodes: [], eqs: [], actions: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // -- title + subtitle -------------------------------------------------
    scene.title = txt("Best Time to Buy and Sell Stock", {
      x: 64, y: 74, "font-size": 44, fill: C.white, "letter-spacing": 1,
    }, textL);
    const sub = el("text", { x: 64, y: 112, "font-size": 22, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "prices = ";
    el("tspan", { fill: C.white }, sub).textContent = "[" + prices.join(", ") + "]";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // -- chart geometry ---------------------------------------------------
    const baseY = 362;
    const maxH = 180;
    const peak = Math.max(1, ...prices);
    const spanW = n === 1 ? 0 : clamp((n - 1) * 92, 340, 1000);
    const stepX = n === 1 ? 0 : spanW / (n - 1);
    const startX = STAGE_W / 2 - spanW / 2;
    const yOf = p => baseY - (p / peak) * maxH;

    scene.baseY = baseY;
    scene.yOf = yOf;

    // -- baseline axis ----------------------------------------------------
    scene.axisLine = el("line", {
      x1: startX - 44, y1: baseY, x2: startX + spanW + 44, y2: baseY,
      stroke: C.slate, "stroke-width": 2,
    }, arcsL);
    setOpacity(scene.axisLine, 0);

    // -- best trade shaded box + dashed buy level -------------------------
    scene.bestBox = el("rect", {
      x: startX, y: baseY, width: 0, height: 0, rx: 6,
      fill: C.green, "fill-opacity": 0.14,
      stroke: C.green, "stroke-width": 2, "stroke-dasharray": "6 4",
    }, arcsL);
    setOpacity(scene.bestBox, 0);

    scene.curSpread = el("line", {
      x1: startX, y1: baseY, x2: startX, y2: baseY,
      stroke: C.gold, "stroke-width": 3, "stroke-dasharray": "5 4",
    }, arcsL);
    setOpacity(scene.curSpread, 0);

    scene.buyLevel = el("line", {
      x1: startX, y1: baseY, x2: startX, y2: baseY,
      stroke: C.blue, "stroke-width": 2, "stroke-dasharray": "4 4",
    }, arcsL);
    setOpacity(scene.buyLevel, 0);

    // -- polyline connecting prices ---------------------------------------
    const pts = prices.map((p, i) => `${(startX + i * stepX).toFixed(1)},${yOf(p).toFixed(1)}`).join(" ");
    scene.poly = el("polyline", {
      points: pts, fill: "none",
      stroke: C.dim, "stroke-width": 2.5, "stroke-linecap": "round", "stroke-linejoin": "round",
    }, arcsL);
    setOpacity(scene.poly, 0);

    // -- daily price stems & circles --------------------------------------
    for (let i = 0; i < n; i++) {
      const cx = startX + i * stepX;
      const cy = yOf(prices[i]);
      const g = el("g", {}, chipsL);
      setOpacity(g, 0);

      const stem = el("line", {
        x1: cx, y1: cy, x2: cx, y2: baseY,
        stroke: C.slate, "stroke-width": 2,
      }, g);

      const dot = el("circle", {
        cx, cy, r: 16,
        fill: C.cellBg, stroke: C.cellStroke, "stroke-width": 2.5,
      }, g);

      const val = txt(String(prices[i]), {
        x: cx, y: cy, "font-size": 17, fill: C.white,
        "text-anchor": "middle", "dominant-baseline": "central",
      }, g);

      const idx = txt(`d${i}`, {
        x: cx, y: baseY + 24, "font-size": 16, fill: C.grey,
        "text-anchor": "middle",
      }, g);

      scene.nodes.push({ g, stem, dot, val, idx, cx, cy, price: prices[i] });
    }

    // -- buy & sell pointers ----------------------------------------------
    const mkPtr = (label, color, glowId, dy) => {
      const g = el("g", {}, ptrL);
      setOpacity(g, 0);
      el("polygon", {
        points: "-9,-18 9,-18 0,-4",
        fill: color, filter: `url(#${glowId})`,
      }, g);
      txt(label, {
        x: 0, y: dy, "font-size": 18, fill: color,
        "text-anchor": "middle",
      }, g);
      return g;
    };
    scene.buyPtr = mkPtr("buy", C.blue, "glow-blue", -26);
    scene.sellPtr = mkPtr("sell", C.gold, "glow-gold", -46);

    // -- best profit badge (top-right) ------------------------------------
    const bestG = el("g", {}, textL);
    setOpacity(bestG, 0);
    el("rect", {
      x: 920, y: 52, width: 300, height: 64, rx: 10,
      fill: "#111722", stroke: C.green, "stroke-width": 2,
    }, bestG);
    txt("max_profit =", {
      x: 942, y: 84, "font-size": 22, fill: C.grey,
      "dominant-baseline": "central",
    }, bestG);
    scene.bestVal = txt("0", {
      x: 1196, y: 84, "font-size": 28, fill: C.green,
      "text-anchor": "end", "dominant-baseline": "central",
    }, bestG);
    scene.bestBadge = bestG;

    // -- step equations + action lines ------------------------------------
    sim.steps.forEach(st => {
      const eq = el("text", {
        x: STAGE_W / 2, y: 445, "font-size": 27, fill: C.white,
        "text-anchor": "middle",
      }, textL);
      el("tspan", { fill: C.gold }, eq).textContent = `day ${st.i} (price ${st.price})`;
      el("tspan", { fill: C.grey }, eq).textContent = `  vs  `;
      el("tspan", { fill: C.blue }, eq).textContent = `buy @ d${st.buyBefore} (price ${st.buyPriceBefore})`;
      if (!st.newValley) {
        el("tspan", { fill: C.grey }, eq).textContent = `   →   profit = ${st.price} − ${st.buyPriceBefore} = `;
        el("tspan", { fill: st.isNewBest ? C.green : C.white }, eq).textContent = String(st.profit);
      }
      scene.eqs.push(eq);

      const act = txt(st.actionText, {
        x: STAGE_W / 2, y: 492, "font-size": 23,
        fill: st.newValley ? C.red : (st.isNewBest ? C.green : C.grey),
        "text-anchor": "middle",
      }, textL);
      scene.actions.push(act);
    });

    // -- final banner -----------------------------------------------------
    const bY = 595;
    scene.bannerBox = el("rect", {
      x: 250, y: bY - 36, width: 780, height: 70, rx: 12,
      fill: "#13261B", stroke: C.green, "stroke-width": 2.5,
      filter: "url(#glow-green)",
    }, resultL);
    setOpacity(scene.bannerBox, 0);

    const bannerText = sim.bestProfit > 0
      ? `return ${sim.bestProfit}   (buy d${sim.bestBuy} @ ${prices[sim.bestBuy]}, sell d${sim.bestSell} @ ${prices[sim.bestSell]})`
      : `return 0   (no profitable trade possible)`;
    scene.bannerText = txt(bannerText, {
      x: STAGE_W / 2, y: bY, "font-size": 28, fill: C.green,
      "text-anchor": "middle", "dominant-baseline": "central",
    }, resultL);

    scene.complexity = txt(
      "Single pass tracking min buy price · O(n) time · O(1) extra space",
      { x: STAGE_W / 2, y: 668, "font-size": 20, fill: C.grey, "text-anchor": "middle" },
      resultL
    );

    // -- reset ------------------------------------------------------------
    scene.reset = () => {
      const { easeOut, lerp } = ctx;
      setOpacity(scene.title, 0);
      setOpacity(scene.subtitle, 0);
      setOpacity(scene.axisLine, 0);
      setOpacity(scene.poly, 0);
      setOpacity(scene.bestBox, 0);
      setOpacity(scene.curSpread, 0);
      setOpacity(scene.buyLevel, 0);
      setOpacity(scene.buyPtr, 0);
      setOpacity(scene.sellPtr, 0);
      setOpacity(scene.bestBadge, 0);
      scene.bestVal.textContent = "0";
      setOpacity(scene.bannerBox, 0);
      if (scene.nodes[0]) {
        setTranslate(scene.buyPtr, scene.nodes[0].cx, scene.nodes[0].cy - 14);
        setTranslate(scene.sellPtr, scene.nodes[0].cx, scene.nodes[0].cy - 14);
      }
      for (const nd of scene.nodes) {
        setOpacity(nd.g, 0);
        nd.dot.setAttribute("fill", C.cellBg);
        nd.dot.setAttribute("stroke", C.cellStroke);
        nd.stem.setAttribute("stroke", C.slate);
      }
      for (const w of scene._writers) w.reset();
      void easeOut; void lerp;
    };

    return scene;
  },

  buildTimeline(scene, tl) {
    const { ctx, sim, prices } = scene;
    const { C, ease, clamp, setOpacity, setTranslate } = ctx;
    const easeOut = ease.outCubic;
    const easeInOut = ease.inOutSine;
    const lerp = (a, b, t) => a + (b - a) * t;

    const wTitle = scene.writer(scene.title);
    const wEqs = scene.eqs.map(scene.writer);
    const wActs = scene.actions.map(scene.writer);
    const wBanner = scene.writer(scene.bannerText);
    const wComplex = scene.writer(scene.complexity);

    scene.reset();

    // 1. Title + subtitle + price chart reveal
    tl.line(1);
    tl.add(0.75, wTitle);
    tl.add(0.45, u => setOpacity(scene.subtitle, easeOut(u)));
    tl.line([2, 3]);
    tl.add(0.65, u => {
      setOpacity(scene.axisLine, easeOut(u));
      setOpacity(scene.poly, easeOut(u));
      scene.nodes.forEach((nd, i) => {
        const start = i * 0.06;
        const p = clamp((u - start) / Math.max(0.25, 1 - start), 0, 1);
        setOpacity(nd.g, easeOut(p));
      });
      setOpacity(scene.bestBadge, easeOut(u));
    });
    tl.wait(0.2);

    // Initialize day 0 as initial buy anchor
    const d0 = scene.nodes[0];
    tl.add(0.5, u => {
      const e = easeOut(u);
      setTranslate(scene.buyPtr, d0.cx, d0.cy - 14);
      setOpacity(scene.buyPtr, e);
      d0.dot.setAttribute("stroke", C.blue);
      d0.dot.setAttribute("fill", "#142838");
      scene.buyLevel.setAttribute("x1", d0.cx);
      scene.buyLevel.setAttribute("y1", d0.cy);
      scene.buyLevel.setAttribute("x2", d0.cx);
      scene.buyLevel.setAttribute("y2", d0.cy);
      setOpacity(scene.buyLevel, e * 0.75);
    });
    tl.wait(0.2);

    let prevEq = null;
    let prevAct = null;

    sim.steps.forEach((st, idx) => {
      const nd = scene.nodes[st.i];
      const buyBeforeNd = scene.nodes[st.buyBefore];
      const prevSellNd = idx === 0 ? scene.nodes[0] : scene.nodes[sim.steps[idx - 1].i];
      const fadingEq = prevEq;
      const fadingAct = prevAct;

      // Move sell pointer to day i
      tl.line(4);
      tl.add(0.45, u => {
        const e = easeInOut(u);
        if (fadingEq) setOpacity(fadingEq, 1 - e);
        if (fadingAct) setOpacity(fadingAct, 1 - e);
        setTranslate(
          scene.sellPtr,
          lerp(prevSellNd.cx, nd.cx, e),
          lerp(prevSellNd.cy - 14, nd.cy - 14, e)
        );
        setOpacity(scene.sellPtr, 1);
        scene.buyLevel.setAttribute("x1", buyBeforeNd.cx);
        scene.buyLevel.setAttribute("y1", buyBeforeNd.cy);
        scene.buyLevel.setAttribute("x2", lerp(prevSellNd.cx, nd.cx, e));
        scene.buyLevel.setAttribute("y2", buyBeforeNd.cy);
        if (u > 0.5) {
          nd.dot.setAttribute("stroke", C.gold);
        }
      });

      // Write comparison equation
      tl.line(5);
      tl.add(0.55, wEqs[idx]);
      tl.line(st.newValley ? 6 : 8);
      if (!st.newValley) {
        tl.add(0.25, u => {
          scene.curSpread.setAttribute("x1", nd.cx);
          scene.curSpread.setAttribute("x2", nd.cx);
          scene.curSpread.setAttribute("y1", buyBeforeNd.cy);
          scene.curSpread.setAttribute("y2", lerp(buyBeforeNd.cy, nd.cy, easeOut(u)));
          setOpacity(scene.curSpread, 0.9);
        });
      }

      // Write action & update buy pointer or best trade box
      tl.add(0.5, wActs[idx]);
      tl.add(0.4, u => {
        const e = easeInOut(u);
        if (st.newValley) {
          setTranslate(
            scene.buyPtr,
            lerp(buyBeforeNd.cx, nd.cx, e),
            lerp(buyBeforeNd.cy - 14, nd.cy - 14, e)
          );
          if (u > 0.5) {
            buyBeforeNd.dot.setAttribute("stroke", C.cellStroke);
            buyBeforeNd.dot.setAttribute("fill", C.cellBg);
            nd.dot.setAttribute("stroke", C.blue);
            nd.dot.setAttribute("fill", "#142838");
            scene.buyLevel.setAttribute("x1", nd.cx);
            scene.buyLevel.setAttribute("y1", nd.cy);
            scene.buyLevel.setAttribute("x2", nd.cx);
            scene.buyLevel.setAttribute("y2", nd.cy);
          }
        } else if (st.isNewBest && u > 0.4) {
          scene.bestVal.textContent = String(st.bestAfter);
          const bNd = scene.nodes[st.bestBuyAfter];
          const sNd = scene.nodes[st.bestSellAfter];
          scene.bestBox.setAttribute("x", bNd.cx);
          scene.bestBox.setAttribute("y", sNd.cy);
          scene.bestBox.setAttribute("width", Math.max(4, sNd.cx - bNd.cx));
          scene.bestBox.setAttribute("height", Math.max(4, bNd.cy - sNd.cy));
          setOpacity(scene.bestBox, 1);
        }
      });

      // Reset non-buy dot stroke before next step
      tl.add(0.2, u => {
        setOpacity(scene.curSpread, 1 - easeOut(u));
        if (u > 0.8 && st.i !== st.buyAfter) {
          nd.dot.setAttribute("stroke", C.cellStroke);
          nd.dot.setAttribute("fill", C.cellBg);
        }
      });

      prevEq = scene.eqs[idx];
      prevAct = scene.actions[idx];
    });

    // Clear last step text
    const lastEq = prevEq;
    const lastAct = prevAct;
    tl.add(0.4, u => {
      const e = easeOut(u);
      if (lastEq) setOpacity(lastEq, 1 - e);
      if (lastAct) setOpacity(lastAct, 1 - e);
      setOpacity(scene.sellPtr, 1 - e);
      if (u > 0.5 && sim.bestProfit > 0) {
        scene.nodes[sim.bestBuy].dot.setAttribute("stroke", C.green);
        scene.nodes[sim.bestBuy].dot.setAttribute("fill", "#162E22");
        scene.nodes[sim.bestSell].dot.setAttribute("stroke", C.green);
        scene.nodes[sim.bestSell].dot.setAttribute("fill", "#162E22");
      }
    });

    // Final banner + complexity
    tl.line(9);
    tl.add(0.3, u => setOpacity(scene.bannerBox, easeOut(u)));
    tl.add(0.55, wBanner);
    tl.add(0.65, wComplex);
    tl.wait(0.6);

    void prices;
  },
};

function simulate(prices) {
  const steps = [];
  let buyIdx = 0;
  let bestProfit = 0;
  let bestBuy = 0;
  let bestSell = 0;

  for (let i = 1; i < prices.length; i++) {
    const price = prices[i];
    const buyBefore = buyIdx;
    const buyPriceBefore = prices[buyIdx];
    const newValley = price < buyPriceBefore;
    let profit = 0;
    let isNewBest = false;
    let actionText = "";

    if (newValley) {
      buyIdx = i;
      actionText = `${price} < ${buyPriceBefore}  →  cheaper buy day found! Slide buy to d${i}`;
    } else {
      profit = price - buyPriceBefore;
      if (profit > bestProfit) {
        bestProfit = profit;
        bestBuy = buyBefore;
        bestSell = i;
        isNewBest = true;
        actionText = `profit ${profit} beats max_profit → update max_profit = ${bestProfit} (d${bestBuy} → d${bestSell})`;
      } else {
        actionText = `profit ${profit} ≤ max_profit (${bestProfit}) → keep current best`;
      }
    }

    steps.push({
      i,
      price,
      buyBefore,
      buyPriceBefore,
      buyAfter: buyIdx,
      newValley,
      profit,
      isNewBest,
      bestAfter: bestProfit,
      bestBuyAfter: bestBuy,
      bestSellAfter: bestSell,
      actionText,
    });
  }

  return { steps, bestProfit, bestBuy, bestSell };
}
