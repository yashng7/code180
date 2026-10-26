/* Burst Balloons — interval DP over a padded balloon row.
 *
 * The key reversal: choose which balloon in an interval bursts LAST.  Its left
 * and right neighbours are then fixed, and the two remaining sides are
 * independent sub-intervals.  The stage keeps the balloons, the interval band,
 * and the upper-triangular dp table in view together.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Burst Balloons",
    subtitle: "choose the last balloon in each interval · left and right sides become independent",
    inputs: [
      { id: "nums", label: "balloons (comma separated)", type: "text", default: "3, 1, 5, 8", width: "wide" },
    ],
    legend: [
      { color: "#58C4DD", text: "interval boundaries" },
      { color: "#F0AC5F", text: "last balloon k" },
      { color: "#5CD0B3", text: "sub-interval parents" },
      { color: "#83C167", text: "best interval value" },
    ],
  },

  code: [
    "def max_coins(nums: List[int]) -> int:",
    "    \"\"\"Return the maximum coins obtainable by bursting all balloons.\"\"\"",
    "    arr = [1] + nums + [1]",
    "    n = len(arr)",
    "    dp = [[0] * n for _ in range(n)]",
    "    for length in range(2, n):              # interval width (open boundaries)",
    "        for left in range(0, n - length):",
    "            right = left + length",
    "            for k in range(left + 1, right):  # k is the last balloon burst",
    "                coins = (",
    "                    arr[left] * arr[k] * arr[right]",
    "                    + dp[left][k]",
    "                    + dp[k][right]",
    "                )",
    "                if coins > dp[left][right]:",
    "                    dp[left][right] = coins",
    "    return dp[0][n - 1]",
  ],

  read(values) {
    const nums = parseNumberList(values.nums);
    if (!nums || nums.length > 5) return null;
    if (nums.some(v => !Number.isInteger(v) || v < 0 || v > 99)) return null;
    return { nums };
  },

  fromArgs(args) {
    if (!Array.isArray(args) || args.length !== 1 || !Array.isArray(args[0])) return null;
    const nums = args[0].map(Number);
    if (nums.length > 5) return null;
    if (nums.some(v => !Number.isInteger(v) || v < 0 || v > 99)) return null;
    return { nums: nums.join(", ") };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, STAGE_W } = ctx;
    const nums = params.nums;
    const sim = simulateBurst(nums);
    const arr = sim.arr, n = arr.length;

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
    ctx.glow("glow-gold", C.gold);
    ctx.glow("glow-teal", C.teal);
    ctx.glow("glow-green", C.green);

    const writable = ctx.makeWritable();
    const textL = ctx.layer("text");
    const chipsL = ctx.layer("chips");
    const resultL = ctx.layer("result");

    const scene = { nums, arr, n, sim, cells: [], balloons: [], _writers: [] };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    scene.title = txt("Burst Balloons", {
      x: 64, y: 64, "font-size": 40, fill: C.white, "letter-spacing": 0.5,
    }, textL);
    scene.subtitle = txt("pad both ends with 1 · pick the last burst in each interval · O(n³)", {
      x: 64, y: 101, "font-size": 18, fill: C.grey,
    }, textL);
    setOpacity(scene.subtitle, 0);

    // ---- left panel ----------------------------------------------------
    const pX = 40, pY = 132, pW = 712, pH = 470;
    scene.panel = el("g", {}, chipsL);
    el("rect", {
      x: pX, y: pY, width: pW, height: pH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.panel);
    setOpacity(scene.panel, 0);
    scene.panelTitle = txt("padded balloons · interval dp", {
      x: pX + 20, y: pY + 28, "font-size": 16, fill: C.blue,
    }, textL);
    setOpacity(scene.panelTitle, 0);

    const cellW = clamp(555 / n, 34, 74);
    const cellH = clamp(292 / n, 22, 42);
    const gridW = n * cellW, gridH = n * cellH;
    const gridX = pX + (pW - gridW) / 2;
    const gridTop = pY + 146;
    const balloonY = pY + 90;
    const radius = clamp(cellW * 0.27, 12, 21);
    scene.grid = { cellW, cellH, gridX, gridTop, balloonY, radius };

    // interval band behind balloons
    scene.band = el("rect", {
      x: gridX, y: balloonY - radius - 8, width: 0, height: 2 * radius + 16,
      rx: 16, fill: C.blue, opacity: 0.10, stroke: C.blue,
      "stroke-width": 1.4, "stroke-dasharray": "5 4",
    }, chipsL);
    setOpacity(scene.band, 0);

    scene.labels = el("g", {}, textL);
    setOpacity(scene.labels, 0);
    for (let i = 0; i < n; i++) {
      txt(String(i), {
        x: gridX + i * cellW + cellW / 2, y: gridTop - 8,
        "text-anchor": "middle", "font-size": 10, fill: C.grey,
      }, scene.labels);
      txt(String(i), {
        x: gridX - 12, y: gridTop + i * cellH + cellH / 2,
        "text-anchor": "end", "dominant-baseline": "central",
        "font-size": 10, fill: C.grey,
      }, scene.labels);
    }

    // balloons sit directly above their padded index column
    for (let i = 0; i < n; i++) {
      const cx = gridX + i * cellW + cellW / 2;
      const virtual = i === 0 || i === n - 1;
      const g = el("g", {}, chipsL);
      const ball = el("circle", {
        cx, cy: balloonY, r: radius,
        fill: virtual ? "#10151d" : C.chipFill,
        stroke: virtual ? C.greyDark : C.blue,
        "stroke-width": virtual ? 1.4 : 1.8,
        "stroke-dasharray": virtual ? "3 3" : "",
      }, g);
      const label = txt(String(arr[i]), {
        x: cx, y: balloonY + 1, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": radius > 16 ? 14 : 11,
        fill: virtual ? C.grey : C.white,
      }, g);
      const knot = el("path", {
        d: "M " + (cx - 3) + " " + (balloonY + radius) +
          " L " + (cx + 3) + " " + (balloonY + radius) +
          " L " + cx + " " + (balloonY + radius + 6) + " Z",
        fill: virtual ? C.greyDark : C.blue, opacity: 0.8,
      }, g);
      setOpacity(g, 0);
      scene.balloons.push({ i, g, ball, label, knot, cx, virtual });
    }

    // dp table cells
    for (let left = 0; left < n; left++) {
      for (let right = 0; right < n; right++) {
        const x = gridX + right * cellW;
        const y = gridTop + left * cellH;
        const g = el("g", {}, chipsL);
        const usable = right > left;
        const rect = el("rect", {
          x: x + 1.5, y: y + 1.5, width: cellW - 3, height: cellH - 3, rx: 4,
          fill: usable ? C.chipFill : "#0a0e14",
          stroke: usable ? C.greyDark : "#121923",
          "stroke-width": 1.2,
        }, g);
        const label = txt("", {
          x: x + cellW / 2, y: y + cellH / 2 + 1,
          "text-anchor": "middle", "dominant-baseline": "central",
          "font-size": clamp(Math.min(cellW, cellH) * 0.38, 9, 15),
          fill: C.white,
        }, g);
        setOpacity(g, 0);
        scene.cells.push({ left, right, g, rect, label, usable });
      }
    }

    // ---- right panel ---------------------------------------------------
    const rX = 776, rY = 132, rW = 440, rH = 470;
    scene.side = el("g", {}, chipsL);
    el("rect", {
      x: rX, y: rY, width: rW, height: rH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.side);
    setOpacity(scene.side, 0);
    scene.sideTitle = txt("interval recurrence", {
      x: rX + 20, y: rY + 28, "font-size": 16, fill: C.gold,
    }, textL);
    setOpacity(scene.sideTitle, 0);

    const statics = [
      ["dp[L][R] = best coins for the open interval (L, R)", C.white],
      ["last k:  arr[L] * arr[k] * arr[R]", C.gold],
      ["         + dp[L][k] + dp[k][R]", C.teal],
      ["sub-intervals are already solved", C.grey],
    ];
    for (let i = 0; i < statics.length; i++) {
      txt(statics[i][0], {
        x: rX + 20, y: rY + 68 + i * 25, "font-size": 12.5, fill: statics[i][1],
      }, textL);
    }

    scene.intervalText = txt("—", {
      x: rX + 20, y: rY + 190, "font-size": 20, fill: C.blue,
    }, textL);
    scene.kText = txt("", {
      x: rX + 20, y: rY + 226, "font-size": 14, fill: C.gold,
    }, textL);
    scene.formula = txt("", {
      x: rX + 20, y: rY + 264, "font-size": 12.5, fill: C.white,
    }, textL);
    scene.formula2 = txt("", {
      x: rX + 20, y: rY + 290, "font-size": 12.5, fill: C.teal,
    }, textL);
    scene.candidateLabel = txt("candidate coins", {
      x: rX + 20, y: rY + 330, "font-size": 12, fill: C.grey,
    }, textL);
    scene.candidate = txt("—", {
      x: rX + 20, y: rY + 374, "font-size": 38, fill: C.green,
    }, textL);
    scene.best = txt("", {
      x: rX + 20, y: rY + 416, "font-size": 14, fill: C.white,
    }, textL);
    scene.answer = txt("", {
      x: rX + 20, y: rY + 448, "font-size": 13, fill: C.green,
    }, textL);
    for (const node of [scene.intervalText, scene.kText, scene.formula,
                        scene.formula2, scene.candidateLabel, scene.candidate,
                        scene.best, scene.answer]) setOpacity(node, 0);

    scene.status = txt("", { x: 64, y: 622, "font-size": 18, fill: C.gold }, textL);
    scene.detail = txt("", { x: 64, y: 648, "font-size": 13, fill: C.grey }, textL);
    scene.resultBox = el("rect", {
      x: 340, y: 664, width: 600, height: 44, rx: 10,
      fill: "#111a16", stroke: C.green, "stroke-width": 2.2,
      filter: "url(#glow-green)",
    }, resultL);
    scene.result = txt("", {
      x: STAGE_W / 2, y: 686, "text-anchor": "middle",
      "dominant-baseline": "central", "font-size": 25, fill: C.green,
    }, resultL);
    scene.note = txt("", {
      x: STAGE_W / 2, y: 715, "text-anchor": "middle", "font-size": 11, fill: C.grey,
    }, resultL);
    for (const node of [scene.resultBox, scene.result, scene.note]) setOpacity(node, 0);
    for (const node of [scene.status, scene.detail]) setOpacity(node, 0);

    // ---- state paint ---------------------------------------------------
    scene.showStep = (index, u) => {
      const step = index >= 0 ? sim.steps[index] : null;
      const computed = step ? step.computed : sim.finalComputed;
      const dp = step ? step.dp : sim.finalDp;
      for (const cell of scene.cells) {
        if (!cell.usable) {
          cell.label.textContent = "";
          setOpacity(cell.g, 1);
          continue;
        }
        const isCurrent = step && cell.left === step.left && cell.right === step.right;
        const isLeftParent = step && cell.left === step.left && cell.right === step.k;
        const isRightParent = step && cell.left === step.k && cell.right === step.right;
        const revealed = !!computed[cell.left][cell.right];
        cell.label.textContent = revealed ? String(dp[cell.left][cell.right]) : "";
        let fill = C.chipFill, stroke = C.greyDark, width = 1.2, color = C.white;
        if (isLeftParent) { fill = "#101b26"; stroke = C.blue; width = 1.8; }
        if (isRightParent) { fill = "#10211e"; stroke = C.teal; width = 1.8; }
        if (isCurrent) {
          fill = "#2a2214"; stroke = C.gold; width = 2.6; color = C.gold;
        }
        cell.rect.setAttribute("fill", fill);
        cell.rect.setAttribute("stroke", stroke);
        cell.rect.setAttribute("stroke-width", String(width));
        cell.label.setAttribute("fill", color);
        setOpacity(cell.g, isCurrent ? u : 1);
      }

      // balloon + interval band
      if (step) {
        const x1 = scene.balloons[step.left].cx;
        const x2 = scene.balloons[step.right].cx;
        scene.band.setAttribute("x", String(x1));
        scene.band.setAttribute("width", String(Math.max(1, x2 - x1)));
        setOpacity(scene.band, 1);
      } else {
        setOpacity(scene.band, 0);
      }
      for (const balloon of scene.balloons) {
        let stroke = balloon.virtual ? C.greyDark : C.blue;
        let fill = balloon.virtual ? "#10151d" : C.chipFill;
        let width = balloon.virtual ? 1.4 : 1.8;
        if (step && balloon.i === step.left) { stroke = C.blue; width = 3; }
        if (step && balloon.i === step.right) { stroke = C.blue; width = 3; }
        if (step && balloon.i === step.k) { stroke = C.gold; fill = "#2a2214"; width = 3.4; }
        balloon.ball.setAttribute("stroke", stroke);
        balloon.ball.setAttribute("fill", fill);
        balloon.ball.setAttribute("stroke-width", String(width));
        balloon.label.setAttribute("fill",
          step && balloon.i === step.k ? C.gold : balloon.virtual ? C.grey : C.white);
        setOpacity(balloon.g, step && balloon.i === step.k ? u : 1);
      }

      if (step) {
        scene.intervalText.textContent = "interval (" + step.left + ", " + step.right + ")";
        scene.kText.textContent = "last balloon k = " + step.k + "   ·   value " + arr[step.k];
        scene.formula.textContent = arr[step.left] + " × " + arr[step.k] + " × " +
          arr[step.right] + " + dp[" + step.left + "][" + step.k + "] " +
          dp[step.left][step.k];
        scene.formula2.textContent = "+ dp[" + step.k + "][" + step.right + "] " +
          dp[step.k][step.right];
        scene.candidate.textContent = String(step.coins);
        scene.candidate.setAttribute("fill", step.updated ? C.green : C.grey);
        scene.best.textContent = "best for this interval = " + step.bestAfter;
      } else {
        scene.intervalText.textContent = "—";
        scene.kText.textContent = "";
        scene.formula.textContent = "";
        scene.formula2.textContent = "";
        scene.candidate.textContent = "—";
        scene.best.textContent = "";
      }
    };

    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.panel, scene.panelTitle,
                          scene.labels, scene.side, scene.sideTitle,
                          scene.intervalText, scene.kText, scene.formula,
                          scene.formula2, scene.candidateLabel, scene.candidate,
                          scene.best, scene.answer, scene.status, scene.detail,
                          scene.resultBox, scene.result, scene.note]) {
        if (node) setOpacity(node, 0);
      }
      for (const cell of scene.cells) {
        setOpacity(cell.g, 0);
        cell.label.textContent = "";
        cell.rect.setAttribute("fill", cell.usable ? C.chipFill : "#0a0e14");
        cell.rect.setAttribute("stroke", cell.usable ? C.greyDark : "#121923");
        cell.rect.setAttribute("stroke-width", "1.2");
        cell.label.setAttribute("fill", C.white);
      }
      for (const balloon of scene.balloons) {
        setOpacity(balloon.g, 0);
        balloon.ball.setAttribute("fill", balloon.virtual ? "#10151d" : C.chipFill);
        balloon.ball.setAttribute("stroke", balloon.virtual ? C.greyDark : C.blue);
        balloon.ball.setAttribute("stroke-width", balloon.virtual ? "1.4" : "1.8");
        balloon.label.setAttribute("fill", balloon.virtual ? C.grey : C.white);
      }
      setOpacity(scene.band, 0);
      scene.intervalText.textContent = "—";
      scene.kText.textContent = "";
      scene.formula.textContent = "";
      scene.formula2.textContent = "";
      scene.candidate.textContent = "—";
      scene.best.textContent = "";
      scene.answer.textContent = "";
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.result.textContent = "";
      scene.note.textContent = "";
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity } = ctx;
    const { sim, arr, n } = scene;
    const easeOut = ease.outCubic;

    scene.reset();
    const status = (text, color, detail, log) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || C.gold);
        setOpacity(scene.status, 1);
        if (detail !== undefined) {
          scene.detail.textContent = detail || "";
          if (detail) setOpacity(scene.detail, 1);
        }
      });
      if (log) tl.log(text, color || C.gold, { hold: false });
    };

    tl.line([1, 2, 3, 4, 5]);
    tl.add(0.55, scene.writer(scene.title), easeOut);
    tl.add(0.32, u => setOpacity(scene.subtitle, u), easeOut);
    tl.add(0.28, u => {
      setOpacity(scene.panel, u); setOpacity(scene.panelTitle, u);
      setOpacity(scene.labels, u); setOpacity(scene.side, u);
      setOpacity(scene.sideTitle, u); setOpacity(scene.intervalText, u);
      setOpacity(scene.kText, u); setOpacity(scene.formula, u);
      setOpacity(scene.formula2, u); setOpacity(scene.candidateLabel, u);
      setOpacity(scene.candidate, u); setOpacity(scene.best, u);
      setOpacity(scene.answer, u);
    }, easeOut);
    for (const balloon of scene.balloons) {
      tl.add(0.05, u => setOpacity(balloon.g, u), easeOut);
    }
    for (const cell of scene.cells) {
      tl.add(0.012, u => setOpacity(cell.g, u), easeOut);
    }
    status("pad the row with virtual value-1 balloons at both ends", C.blue,
      "for an interval (L, R), decide which balloon k is burst last", true);
    tl.wait(0.12);

    for (let index = 0; index < sim.steps.length; index++) {
      const step = sim.steps[index];
      tl.line(step.updated
        ? [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
        : [6, 7, 8, 9, 10, 11, 12, 13, 14]);
      status("length " + step.length + " · interval (" + step.left + ", " + step.right +
        ") · k = " + step.k, step.updated ? C.green : C.gold,
        "candidate " + step.coins + (step.updated
          ? "  →  new best " + step.bestAfter
          : "  ·  best stays " + step.bestAfter), true);
      tl.add(0.01, () => {
        scene.intervalText.textContent = "interval (" + step.left + ", " + step.right + ")";
        scene.kText.textContent = "last balloon k = " + step.k + "   ·   value " + arr[step.k];
        scene.candidate.textContent = String(step.coins);
        scene.candidate.setAttribute("fill", step.updated ? C.green : C.grey);
        scene.best.textContent = "best for this interval = " + step.bestAfter;
        scene.answer.textContent = "";
      });
      tl.add(0.22, u => scene.showStep(index, u), easeOut);
      tl.wait(0.02);
    }

    tl.line([17]);
    tl.add(0.01, () => {
      scene.showStep(-1, 1);
      const cell = scene.cells.find(cell => cell.left === 0 && cell.right === n - 1);
      if (cell) {
        cell.rect.setAttribute("fill", "#10211e");
        cell.rect.setAttribute("stroke", C.green);
        cell.rect.setAttribute("stroke-width", "3");
        cell.label.textContent = String(sim.answer);
        cell.label.setAttribute("fill", C.green);
      }
      scene.intervalText.textContent = "interval (0, " + (n - 1) + ")";
      scene.kText.textContent = "all balloons burst";
      scene.best.textContent = "best = " + sim.answer;
      scene.candidate.textContent = String(sim.answer);
      scene.candidate.setAttribute("fill", C.green);
      scene.answer.textContent = "answer dp[0][" + (n - 1) + "] = " + sim.answer;
    });
    const orderText = sim.order.length ? sim.order.join(" → ") : "no balloons";
    status("all intervals solved → " + sim.answer + " coins", C.green,
      "one optimal last-burst order: " + orderText, true);
    tl.add(0.01, () => {
      scene.result.textContent = "return " + sim.answer;
      scene.note.textContent = "optimal burst order " + orderText +
        " · " + n + " padded positions including two virtual 1s";
    });
    tl.add(0.35, u => {
      setOpacity(scene.resultBox, u);
      setOpacity(scene.result, u);
      setOpacity(scene.note, u);
    }, easeOut);
    tl.wait(0.8);
    return tl.finish();
  },
};

function parseNumberList(raw) {
  const text = String(raw == null ? "" : raw).trim();
  if (!text) return [];
  const parts = text.split(/[\s,]+/).filter(Boolean);
  const nums = [];
  for (const part of parts) {
    if (!/^-?\d+$/.test(part)) return null;
    nums.push(Number(part));
  }
  return nums;
}

function simulateBurst(nums) {
  const arr = [1].concat(nums, [1]);
  const n = arr.length;
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));
  const dp0 = dp.map(row => row.slice());
  const bestK = Array.from({ length: n }, () => new Array(n).fill(-1));
  const computed = Array.from({ length: n }, () => new Array(n).fill(false));
  const initialComputed = computed.map(row => row.slice());
  const steps = [];
  let best = 0;

  for (let length = 2; length < n; length++) {
    for (let left = 0; left < n - length; left++) {
      const right = left + length;
      computed[left][right] = true;
      let intervalBest = 0;
      for (let k = left + 1; k < right; k++) {
        const coins = arr[left] * arr[k] * arr[right] +
          dp[left][k] + dp[k][right];
        const updated = coins > intervalBest;
        if (updated) {
          intervalBest = coins;
          dp[left][right] = coins;
          bestK[left][right] = k;
          best = Math.max(best, coins);
        }
        steps.push({
          length, left, right, k, coins, updated,
          bestAfter: intervalBest,
          dp: dp.map(row => row.slice()),
          computed: computed.map(row => row.slice()),
        });
      }
    }
  }

  const order = [];
  const collect = (left, right) => {
    if (right - left <= 1) return;
    const k = bestK[left][right];
    if (k < 0) return;
    collect(left, k);
    collect(k, right);
    order.push(arr[k]);
  };
  collect(0, n - 1);

  return {
    arr, n, dp0, initialComputed, steps,
    finalDp: dp.map(row => row.slice()),
    finalComputed: computed.map(row => row.slice()),
    answer: dp[0][n - 1], best, order, bestK,
  };
}
