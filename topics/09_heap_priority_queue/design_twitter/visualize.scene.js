/* Design Twitter — animated walkthrough scene.
 *
 * A design problem.  The operation ribbon replays postTweet / getNewsFeed /
 * follow / unfollow.  Tweets are stored per user in posting order; getNewsFeed
 * seeds a max-heap with each author's newest tweet, then repeatedly pops the
 * newest and pushes that author's previous tweet.  The feed stops at 10.
 *
 * Built into visualize.html by:  python3 -m framework.viz.build <dir>
 */
"use strict";

const SCENE = {
  meta: {
    title: "Design Twitter",
    subtitle: "global clock · per-user tweet lists · k-way heap merge · 10-tweet feed",
    inputs: [
      {
        id: "ops",
        label: "operations",
        type: "text",
        default: "Twitter(), postTweet(1, 5), getNewsFeed(1), follow(1, 2), postTweet(2, 6), getNewsFeed(1), unfollow(1, 2), getNewsFeed(1)",
        width: "wide",
      },
    ],
    legend: [
      { color: "#58C4DD", text: "tweet / heap entry" },
      { color: "#F0AC5F", text: "newest candidate" },
      { color: "#83C167", text: "feed result" },
      { color: "#FC6255", text: "unfollowed" },
    ],
  },

  code: [
    "class Twitter:",
    "    \"\"\"A minimal Twitter: post, follow, unfollow, and view a 10-tweet feed.\"\"\"",
    "    def __init__(self) -> None:",
    "        self._time = 0                                   # global recency clock",
    "        self._tweets: Dict[int, List[Tuple[int, int]]] = defaultdict(list)",
    "        self._following: Dict[int, Set[int]] = defaultdict(set)",
    "    def postTweet(self, userId: int, tweetId: int) -> None:",
    "        self._time += 1",
    "        self._tweets[userId].append((self._time, tweetId))",
    "    def getNewsFeed(self, userId: int) -> List[int]:",
    "        users = self._following[userId] | {userId}",
    "        # Heap entries: (-time, tweetId, authorId, index_into_author's list)",
    "        heap: List[Tuple[int, int, int, int]] = []",
    "        for author in users:",
    "            tweets = self._tweets[author]",
    "            if tweets:",
    "                timestamp, tweet_id = tweets[-1]",
    "                heap.append((-timestamp, tweet_id, author, len(tweets) - 1))",
    "        heapq.heapify(heap)",
    "        feed: List[int] = []",
    "        while heap and len(feed) < 10:",
    "            _, tweet_id, author, index = heapq.heappop(heap)",
    "            feed.append(tweet_id)",
    "            if index > 0:                                # push the next-newest",
    "                timestamp, prev_id = self._tweets[author][index - 1]",
    "                heapq.heappush(heap, (-timestamp, prev_id, author, index - 1))",
    "        return feed",
    "    def follow(self, followerId: int, followeeId: int) -> None:",
    "        self._following[followerId].add(followeeId)",
    "    def unfollow(self, followerId: int, followeeId: int) -> None:",
    "        self._following[followerId].discard(followeeId)",
  ],

  read(values) {
    const raw = String(values.ops || "").trim();
    if (!raw) return null;
    const tokens = splitTopLevel(raw);
    const ops = [];
    for (const token of tokens) {
      const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)$/.exec(token.trim());
      if (!m) return null;
      const name = m[1];
      const inner = m[2].trim();
      if (name === "Twitter") {
        if (inner) return null;
        ops.push({ name });
      } else if (name === "postTweet" || name === "follow" || name === "unfollow") {
        const parts = splitTopLevel(inner).map(s => Number(s.trim()));
        if (parts.length !== 2 || !parts.every(Number.isInteger)) return null;
        ops.push({ name, a: parts[0], b: parts[1] });
      } else if (name === "getNewsFeed") {
        const parts = splitTopLevel(inner).map(s => Number(s.trim()));
        if (parts.length !== 1 || !parts.every(Number.isInteger)) return null;
        ops.push({ name, user: parts[0] });
      } else {
        return null;
      }
    }
    if (!ops.length || ops[0].name !== "Twitter" || ops.length > 14) return null;
    return { ops };
  },

  fromArgs(args) {
    let payload = null;
    if (args && !Array.isArray(args) && typeof args === "object" && args.ops) payload = args;
    else if (Array.isArray(args) && args[0] && !Array.isArray(args[0]) && args[0].ops) payload = args[0];
    if (!payload || !Array.isArray(payload.ops) || !Array.isArray(payload.vals)) return null;
    if (payload.ops.length !== payload.vals.length || payload.ops.length > 14) return null;
    const parts = [];
    for (let i = 0; i < payload.ops.length; i++) {
      const name = payload.ops[i];
      const vals = payload.vals[i] || [];
      if (name === "Twitter") parts.push("Twitter()");
      else if (name === "postTweet") {
        if (vals.length !== 2) return null;
        parts.push("postTweet(" + vals[0] + ", " + vals[1] + ")");
      } else if (name === "getNewsFeed") {
        if (vals.length !== 1) return null;
        parts.push("getNewsFeed(" + vals[0] + ")");
      } else if (name === "follow" || name === "unfollow") {
        if (vals.length !== 2) return null;
        parts.push(name + "(" + vals[0] + ", " + vals[1] + ")");
      } else {
        return null;
      }
    }
    return { ops: parts.join(", ") };
  },

  buildScene(params, ctx) {
    const { el, txt, C, clamp, setOpacity, setTranslate, STAGE_W } = ctx;
    const ops = params.ops;
    const sim = simulateTwitter(ops);
    const users = sim.allUsers;
    const pool = Math.max(1, sim.maxCandidates);

    ctx.backdrop();
    ctx.glow("glow-blue", C.blue);
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
      ops, sim, ctx, opCells: [], userRows: new Map(), tweetChips: new Map(),
      heapNodes: [], heapEdges: [], feedChips: [], _writers: [],
    };
    scene.writer = node => {
      const w = writable(node);
      scene._writers.push(w);
      return w;
    };

    // ---- title ---------------------------------------------------------
    scene.title = txt("Design Twitter", {
      x: 64, y: 62, "font-size": 40, fill: C.white, "letter-spacing": 0.4,
    }, textL);
    const sub = el("text", { x: 64, y: 96, "font-size": 18, fill: C.grey }, textL);
    el("tspan", {}, sub).textContent = "postTweet · getNewsFeed · follow · unfollow     ";
    el("tspan", { fill: C.gold }, sub).textContent = "feed = 10 newest tweets";
    scene.subtitle = sub;
    setOpacity(sub, 0);

    // ---- operation ribbon ---------------------------------------------
    const opY = 134, opH = 38;
    const nOps = ops.length;
    const opW = clamp(Math.floor(1100 / nOps) - 8, 70, 126);
    const opGap = 8;
    const totalW = nOps * opW + (nOps - 1) * opGap;
    const startX = STAGE_W / 2 - totalW / 2;
    scene.opY = opY;
    scene.opH = opH;

    ops.forEach((op, i) => {
      const x = startX + i * (opW + opGap);
      const g = el("g", {}, chipsL);
      setOpacity(g, 0);
      const rect = el("rect", {
        x, y: opY - opH / 2, width: opW, height: opH, rx: 8,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.8,
      }, g);
      const label = op.name === "postTweet" ? "postTweet(" + op.a + ", " + op.b + ")"
        : op.name === "follow" ? "follow(" + op.a + ", " + op.b + ")"
        : op.name === "unfollow" ? "unfollow(" + op.a + ", " + op.b + ")"
        : op.name === "getNewsFeed" ? "getNewsFeed(" + op.user + ")"
        : "Twitter()";
      const t = txt(label, {
        x: x + opW / 2, y: opY, "text-anchor": "middle",
        "dominant-baseline": "central",
        "font-size": clamp(opW / Math.max(9, label.length * 0.57), 7, 12.5),
        fill: C.grey,
      }, g);
      const ret = txt("", {
        x: x + opW / 2, y: opY + opH / 2 + 19, "text-anchor": "middle",
        "font-size": 13, fill: C.green,
      }, textL);
      setOpacity(ret, 0);
      scene.opCells.push({ i, op, g, rect, t, ret, cx: x + opW / 2 });
    });

    const ptr = el("g", {}, ptrL);
    el("polygon", { points: "-8,-12 8,-12 0,-1", fill: C.gold, filter: "url(#glow-gold)" }, ptr);
    setOpacity(ptr, 0);
    scene.opPtr = ptr;

    // ---- tweet panel ---------------------------------------------------
    const pX = 48, pY = 198, pW = 590, pH = 362;
    scene.tweetPanel = el("g", {}, chipsL);
    el("rect", {
      x: pX, y: pY, width: pW, height: pH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.tweetPanel);
    setOpacity(scene.tweetPanel, 0);
    scene.tweetTitle = txt("tweets[userId]  ·  oldest → newest", {
      x: pX + 20, y: pY + 30, "font-size": 18, fill: C.blue,
    }, textL);
    setOpacity(scene.tweetTitle, 0);

    const rowCount = Math.max(users.length, 1);
    const rowGap = rowCount <= 2 ? 70 : clamp((pH - 150) / (rowCount - 1), 30, 70);
    const rowStart = pY + 88;
    const maxTweets = Math.max(1, ...sim.tweetCounts);
    const chipGap = 4;
    const chipW = clamp((pW - 132 - chipGap * (maxTweets - 1)) / maxTweets, 23, 46);
    const chipH = clamp(rowGap - 28, 26, 42);
    const chipFont = clamp(chipW * 0.42, 10, 17);
    const showTime = rowGap >= 52;

    users.forEach((uid, ui) => {
      const rowY = rowStart + ui * rowGap;
      const g = el("g", {}, chipsL);
      setOpacity(g, 0);
      const label = txt("user " + uid, {
        x: pX + 20, y: rowY + chipH / 2 + 1, "font-size": 17, fill: C.white,
      }, g);
      const noTweets = txt("no tweets yet", {
        x: pX + 132, y: rowY + chipH / 2 + 1, "font-size": 13, fill: C.grey,
      }, g);
      setOpacity(noTweets, 0);
      const chips = [];
      const tweets = sim.finalTweets.get(uid) || [];
      tweets.forEach((tw, ti) => {
        const x = pX + 132 + ti * (chipW + chipGap);
        const cg = el("g", { transform: "translate(" + x + " " + rowY + ")" }, g);
        const enter = el("g", {}, cg);
        const rect = el("rect", {
          x: 0, y: 0, width: chipW, height: chipH, rx: 7,
          fill: C.chipFill, stroke: C.greyDark, "stroke-width": 1.8,
        }, enter);
        const idText = txt(String(tw.id), {
          x: chipW / 2, y: chipH / 2 + 1, "text-anchor": "middle",
          "dominant-baseline": "central", "font-size": chipFont, fill: C.white,
        }, enter);
        const timeText = showTime ? txt("t" + tw.time, {
          x: chipW / 2, y: -6, "text-anchor": "middle", "font-size": 8, fill: C.grey,
        }, enter) : null;
        const ring = el("rect", {
          x: -2.5, y: -2.5, width: chipW + 5, height: chipH + 5, rx: 9,
          fill: "none", stroke: C.gold, "stroke-width": 2.5, filter: "url(#glow-gold)",
        }, enter);
        setOpacity(enter, 0);
        setOpacity(ring, 0);
        chips.push({ ti, tw, cg, enter, rect, idText, timeText, ring, x, y: rowY });
      });
      scene.userRows.set(uid, { uid, rowY, g, label, noTweets, chips, visible: false });
      scene.tweetChips.set(uid, chips);
    });

    scene.followText = txt("following: —", {
      x: pX + 20, y: pY + pH - 22, "font-size": 13, fill: C.grey,
    }, textL);
    setOpacity(scene.followText, 0);

    // ---- feed panel ----------------------------------------------------
    const fX = 658, fY = 198, fW = 574, fH = 362;
    scene.feedPanel = el("g", {}, chipsL);
    el("rect", {
      x: fX, y: fY, width: fW, height: fH, rx: 14,
      fill: "#0f141c", stroke: C.greyDark, "stroke-width": 1.5,
    }, scene.feedPanel);
    setOpacity(scene.feedPanel, 0);
    scene.feedTitle = txt("news feed", {
      x: fX + 20, y: fY + 30, "font-size": 18, fill: C.gold,
    }, textL);
    setOpacity(scene.feedTitle, 0);

    scene.usersText = txt("", {
      x: fX + 20, y: fY + 58, "font-size": 14, fill: C.white,
    }, textL);
    setOpacity(scene.usersText, 0);
    scene.heapLabel = txt("heap of each author's newest tweet  ·  max-heap on −time", {
      x: fX + 20, y: fY + 84, "font-size": 13, fill: C.grey,
    }, textL);
    setOpacity(scene.heapLabel, 0);

    const treeLeft = fX + 24;
    const treeW = fW - 48;
    const nodeW = pool > 4 ? 112 : 132;
    const nodeH = 42;
    const nodeX = i => {
      const depth = Math.floor(Math.log2(i + 1));
      const first = Math.pow(2, depth) - 1;
      const slot = i - first;
      return treeLeft + ((slot + 0.5) / Math.pow(2, depth)) * treeW;
    };
    const nodeY = i => fY + 112 + Math.floor(Math.log2(i + 1)) * 46;

    for (let i = 0; i < pool; i++) {
      const x = nodeX(i), y = nodeY(i);
      const g = el("g", { transform: "translate(" + x + " " + y + ")" }, chipsL);
      const enter = el("g", {}, g);
      const rect = el("rect", {
        x: -nodeW / 2, y: -nodeH / 2, width: nodeW, height: nodeH, rx: 8,
        fill: C.chipFill, stroke: C.greyDark, "stroke-width": 2,
      }, enter);
      const line1 = txt("", {
        x: 0, y: -7, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": 10.5, fill: C.gold,
      }, enter);
      const line2 = txt("", {
        x: 0, y: 7, "text-anchor": "middle", "dominant-baseline": "central",
        "font-size": 10.5, fill: C.white,
      }, enter);
      const ring = el("rect", {
        x: -nodeW / 2 - 3, y: -nodeH / 2 - 3, width: nodeW + 6, height: nodeH + 6,
        rx: 10, fill: "none", stroke: C.gold, "stroke-width": 3,
        filter: "url(#glow-gold)",
      }, enter);
      setOpacity(enter, 0);
      setOpacity(ring, 0);
      scene.heapNodes.push({ i, x, y, g, enter, rect, line1, line2, ring });
    }

    for (let i = 1; i < pool; i++) {
      const p = Math.floor((i - 1) / 2);
      const line = el("line", {
        x1: nodeX(p), y1: nodeY(p) + nodeH / 2,
        x2: nodeX(i), y2: nodeY(i) - nodeH / 2,
        stroke: C.greyDark, "stroke-width": 2,
      }, arcsL);
      setOpacity(line, 0);
      scene.heapEdges.push({ i, p, line });
    }

    scene.feedLabel = txt("feed  ·  newest → oldest  ·  max 10", {
      x: fX + 20, y: fY + 278, "font-size": 13, fill: C.grey,
    }, textL);
    setOpacity(scene.feedLabel, 0);
    scene.feedText = txt("", {
      x: fX + 20, y: fY + 300, "font-size": 13, fill: C.green,
    }, textL);
    setOpacity(scene.feedText, 0);

    const feedGap = 5;
    const feedW = 40;
    for (let i = 0; i < 10; i++) {
      const x = fX + 24 + i * (feedW + feedGap);
      const g = el("g", { transform: "translate(" + x + " " + (fY + 316) + ")" }, chipsL);
      const rect = el("rect", {
        x: 0, y: 0, width: feedW, height: 26, rx: 6,
        fill: "#17251a", stroke: C.green, "stroke-width": 1.5,
      }, g);
      const t = txt("", {
        x: feedW / 2, y: 14, "text-anchor": "middle",
        "dominant-baseline": "central", "font-size": 12, fill: C.green,
      }, g);
      setOpacity(g, 0);
      scene.feedChips.push({ g, rect, t });
    }

    // ---- bottom narration ---------------------------------------------
    scene.status = txt("", {
      x: 64, y: 582, "font-size": 20, fill: C.gold,
    }, textL);
    scene.detail = txt("", {
      x: 64, y: 610, "font-size": 16, fill: C.grey,
    }, textL);
    scene.final = txt("", {
      x: STAGE_W / 2, y: 656, "text-anchor": "middle",
      "font-size": 13, fill: C.green,
    }, resultL);
    setOpacity(scene.status, 0);
    setOpacity(scene.detail, 0);
    setOpacity(scene.final, 0);

    // ---- reset ---------------------------------------------------------
    scene.reset = () => {
      for (const w of scene._writers) w.reset();
      for (const node of [scene.subtitle, scene.tweetPanel, scene.tweetTitle,
                          scene.followText, scene.feedPanel, scene.feedTitle,
                          scene.usersText, scene.heapLabel, scene.feedLabel,
                          scene.feedText, scene.status, scene.detail, scene.final]) {
        setOpacity(node, 0);
      }
      for (const cell of scene.opCells) {
        setOpacity(cell.g, 0);
        cell.rect.setAttribute("fill", C.chipFill);
        cell.rect.setAttribute("stroke", C.greyDark);
        cell.t.setAttribute("fill", C.grey);
        cell.ret.textContent = "";
        setOpacity(cell.ret, 0);
      }
      setOpacity(scene.opPtr, 0);
      for (const uid of users) {
        const row = scene.userRows.get(uid);
        setOpacity(row.g, 0);
        setOpacity(row.noTweets, 0);
        row.visible = false;
        for (const chip of row.chips) {
          setOpacity(chip.enter, 0);
          setOpacity(chip.ring, 0);
          chip.rect.setAttribute("fill", C.chipFill);
          chip.rect.setAttribute("stroke", C.greyDark);
          chip.idText.setAttribute("fill", C.white);
        }
      }
      for (const node of scene.heapNodes) {
        setOpacity(node.enter, 0);
        setOpacity(node.ring, 0);
        node.line1.textContent = "";
        node.line2.textContent = "";
        node.rect.setAttribute("fill", C.chipFill);
        node.rect.setAttribute("stroke", C.greyDark);
      }
      for (const e of scene.heapEdges) setOpacity(e.line, 0);
      for (const chip of scene.feedChips) {
        setOpacity(chip.g, 0);
        chip.t.textContent = "";
      }
      scene.followText.textContent = "following: —";
      scene.usersText.textContent = "";
      scene.feedText.textContent = "";
      scene.status.textContent = "";
      scene.detail.textContent = "";
      scene.final.textContent = "";
    };

    return scene;
  },

  buildTimeline(scene, tl, ctx) {
    const { C, ease, setOpacity, setTranslate } = ctx;
    const { ops, sim } = scene;
    const easeOut = ease.outCubic;

    scene.reset();

    const status = (text, color, det) => {
      tl.add(0.01, () => {
        scene.status.textContent = text;
        scene.status.setAttribute("fill", color || C.gold);
        setOpacity(scene.status, 1);
        if (det !== undefined) {
          scene.detail.textContent = det;
          setOpacity(scene.detail, 1);
        }
      });
      tl.log(text, color || C.gold);
    };
    const detail = text => {
      tl.add(0.01, () => {
        scene.detail.textContent = text;
        setOpacity(scene.detail, 1);
      });
    };
    const activeOp = (index, prevIndex) => {
      tl.add(0.3, u => {
        const e = ease.inOutSine(u);
        const from = prevIndex == null ? scene.opCells[0].cx : scene.opCells[prevIndex].cx;
        setTranslate(scene.opPtr, from + (scene.opCells[index].cx - from) * e,
          scene.opY - scene.opH / 2 - 5);
        setOpacity(scene.opPtr, 1);
        if (u > 0.45) {
          if (prevIndex != null) {
            const prev = scene.opCells[prevIndex];
            prev.rect.setAttribute("fill", C.chipFill);
            prev.rect.setAttribute("stroke", C.greyDark);
            prev.t.setAttribute("fill", C.grey);
          }
          scene.opCells[index].rect.setAttribute("fill", "#262015");
          scene.opCells[index].rect.setAttribute("stroke", C.gold);
          scene.opCells[index].t.setAttribute("fill", C.white);
        }
      });
    };

    const followingString = snap => {
      const keys = Object.keys(snap || {}).sort((a, b) => Number(a) - Number(b));
      const active = keys.filter(k => (snap[k] || []).length > 0);
      if (!active.length) return "following: —";
      return "following: " + active.map(k => k + " → {" + snap[k].join(", ") + "}").join("    ");
    };

    const showUser = uid => {
      const row = scene.userRows.get(uid);
      if (!row || row.visible) return;
      row.visible = true;
      tl.add(0.25, u => {
        setOpacity(row.g, u);
        setOpacity(row.noTweets, u);
      }, easeOut);
    };

    const revealTweet = (uid, index) => {
      const row = scene.userRows.get(uid);
      const chip = (scene.tweetChips.get(uid) || [])[index];
      if (!row || !chip) return;
      tl.add(0.28, u => {
        setOpacity(chip.enter, u);
        chip.rect.setAttribute("fill", "#17251a");
        chip.rect.setAttribute("stroke", C.green);
      }, easeOut);
      tl.add(0.01, () => setOpacity(row.noTweets, 0));
    };

    const clearTweetHighlights = () => {
      tl.add(0.01, () => {
        for (const uid of sim.allUsers) {
          for (const chip of scene.tweetChips.get(uid) || []) {
            chip.rect.setAttribute("fill", C.chipFill);
            chip.rect.setAttribute("stroke", C.greyDark);
            chip.idText.setAttribute("fill", C.white);
            setOpacity(chip.ring, 0);
          }
        }
      });
    };

    const setReturn = (index, value) => {
      tl.add(0.01, () => {
        const ret = scene.opCells[index].ret;
        if (value === null) {
          ret.textContent = "null";
          ret.setAttribute("fill", C.grey);
        } else if (Array.isArray(value)) {
          const short = value.length <= 4
            ? "[" + value.join(", ") + "]"
            : "[" + value[0] + "…" + value[value.length - 1] + "] (" + value.length + ")";
          ret.textContent = short;
          ret.setAttribute("font-size", short.length > 10 ? "11.5" : "13");
          ret.setAttribute("fill", C.green);
        } else {
          ret.textContent = String(value);
          ret.setAttribute("fill", C.green);
        }
        setOpacity(ret, 1);
      });
    };

    const applyHeap = (heap, marks, feedLen, feedArr, dur) => {
      tl.add(0.01, () => {
        for (let i = 0; i < scene.heapNodes.length; i++) {
          const node = scene.heapNodes[i];
          if (i < heap.length) {
            const e = heap[i];
            node.line1.textContent = "−t = " + e.key;
            node.line2.textContent = "#" + e.id + " · u" + e.author + " · i" + e.index;
            setOpacity(node.enter, 1);
            node.rect.setAttribute("fill", i === 0 ? "#262015" : C.chipFill);
            node.rect.setAttribute("stroke", i === 0 ? C.gold : C.greyDark);
          } else {
            setOpacity(node.enter, 0);
          }
          setOpacity(node.ring, 0);
        }
        for (const e of scene.heapEdges) {
          setOpacity(e.line, (e.i < heap.length && e.p < heap.length) ? 1 : 0);
        }
        for (const i of marks || []) {
          const node = scene.heapNodes[i];
          if (!node) continue;
          node.ring.setAttribute("stroke", C.gold);
          setOpacity(node.ring, 1);
        }

        for (const uid of sim.allUsers) {
          for (const chip of scene.tweetChips.get(uid) || []) setOpacity(chip.ring, 0);
        }
        for (const e of heap) {
          const chip = (scene.tweetChips.get(e.author) || [])[e.index];
          if (chip) {
            chip.ring.setAttribute("stroke", C.gold);
            setOpacity(chip.ring, 1);
          }
        }

        for (let i = 0; i < scene.feedChips.length; i++) {
          const chip = scene.feedChips[i];
          if (i < feedLen) {
            chip.t.textContent = String(feedArr[i]);
            setOpacity(chip.g, 1);
          } else {
            setOpacity(chip.g, 0);
          }
        }
        scene.feedText.textContent = feedLen
          ? "feed = [" + feedArr.slice(0, feedLen).join(", ") + "]"
          : "feed = []";
        setOpacity(scene.feedText, 1);
      });
      tl.add(dur || 0.18, u => {
        for (const node of scene.heapNodes) {
          const op = Number(node.ring.style.opacity) || 0;
          if (op > 0) setOpacity(node.ring, Math.max(0, 1 - u));
        }
      }, easeOut);
    };

    // ---- intro ---------------------------------------------------------
    tl.line([1, 2, 3, 4, 5, 6]);
    tl.add(0.55, scene.writer(scene.title), easeOut);
    tl.add(0.35, u => setOpacity(scene.subtitle, u), easeOut);
    for (const cell of scene.opCells) tl.add(0.1, u => setOpacity(cell.g, u), easeOut);
    for (const node of [scene.tweetPanel, scene.tweetTitle, scene.followText,
                        scene.feedPanel, scene.feedTitle, scene.usersText,
                        scene.heapLabel, scene.feedLabel, scene.feedText]) {
      tl.add(0.12, u => setOpacity(node, u), easeOut);
    }
    status("a global clock stamps every tweet; each user keeps a posting-ordered list", C.blue,
      "getNewsFeed will k-way merge the newest tweet of every visible author");
    scene.followText.textContent = "following: —";
    setReturn(0, null);
    tl.wait(0.1);

    let prevIndex = 0;
    for (let si = 1; si < ops.length; si++) {
      const op = ops[si];
      const step = sim.steps[si];
      activeOp(si, prevIndex);
      prevIndex = si;

      if (op.name === "postTweet") {
        showUser(op.a);
        tl.line(7);
        tl.line(8);
        status("postTweet(" + op.a + ", " + op.b + ")  ·  self._time += 1  →  t = " + step.time, C.blue,
          "append (t=" + step.time + ", tweet=" + op.b + ") to tweets[" + op.a + "]");
        tl.line(9);
        revealTweet(op.a, step.index);
        tl.add(0.01, () => {
          scene.followText.textContent = followingString(step.following);
          setOpacity(scene.followText, 1);
          scene.followText.setAttribute("fill", C.grey);
        });
        setReturn(si, null);
        tl.wait(0.08);
      } else if (op.name === "follow" || op.name === "unfollow") {
        showUser(op.a);
        showUser(op.b);
        const follow = op.name === "follow";
        if (follow) {
          tl.line(28);
          tl.line(29);
        } else {
          tl.line(30);
          tl.line(31);
        }
        status(op.name + "(" + op.a + ", " + op.b + ")" +
          (follow ? "  ·  following[" + op.a + "].add(" + op.b + ")" : "  ·  discard(" + op.b + ")"),
          follow ? C.green : C.red,
          follow ? "tweets by user " + op.b + " become visible in user " + op.a + "'s feed"
                 : "user " + op.b + " disappears from user " + op.a + "'s feed immediately");
        tl.add(0.01, () => {
          scene.followText.textContent = followingString(step.following);
          setOpacity(scene.followText, 1);
          scene.followText.setAttribute("fill", follow ? C.green : C.red);
        });
        setReturn(si, null);
        tl.wait(0.1);
      } else {
        // getNewsFeed
        showUser(op.user);
        for (const author of step.users) showUser(author);
        clearTweetHighlights();
        tl.line([10, 11]);
        status("getNewsFeed(" + op.user + ")  ·  users = following[" + op.user + "] ∪ {" + op.user + "}", C.blue,
          "authors: {" + step.users.join(", ") + "}");
        tl.add(0.01, () => {
          scene.usersText.textContent = "users = {" + step.users.join(", ") + "}";
          setOpacity(scene.usersText, 1);
          scene.followText.textContent = followingString(step.following);
          scene.followText.setAttribute("fill", C.grey);
          setOpacity(scene.followText, 1);
        });
        tl.line([12, 13, 14, 15, 16, 17, 18]);
        status("seed the heap with each author's newest tweet", C.blue,
          "entry = (-time, tweetId, authorId, index_into_author_list)");
        let first = true;
        let heapified = false;
        for (const ev of step.events) {
          if (ev.kind === "seed") {
            applyHeap(ev.heap, ev.marks, 0, step.feed, 0.22);
          } else if (ev.kind === "heapify") {
            if (first) {
              tl.line(19);
              status("heapify  ·  newest tweet becomes the max-heap root", C.teal,
                "the most negative time is the smallest tuple, hence the newest tweet");
              first = false;
            }
            applyHeap(ev.heap, ev.marks, ev.feedLen, step.feed, 0.16);
            if (!heapified) {
              tl.line(20);
              heapified = true;
            }
          } else if (ev.kind === "popSift" || ev.kind === "pop") {
            if (ev.kind === "popSift" && ev.first) {
              tl.line(21);
              tl.line(22);
              status("pop the newest entry  ·  #" + ev.popped.id + " from user " + ev.popped.author,
                C.gold, "heappop restores the heap after removing the root");
            } else if (ev.kind === "pop") {
              tl.line(23);
              status("append #" + ev.popped.id + " to the feed", C.green,
                "feed length is now " + ev.feedLen + " (cap 10)");
              const chip = (scene.tweetChips.get(ev.popped.author) || [])[ev.popped.index];
              if (chip) {
                tl.add(0.01, () => {
                  chip.rect.setAttribute("fill", "#17251a");
                  chip.rect.setAttribute("stroke", C.green);
                  chip.idText.setAttribute("fill", C.green);
                });
              }
            }
            applyHeap(ev.heap, ev.marks, ev.feedLen, step.feed, 0.16);
          } else if (ev.kind === "pushSift" || ev.kind === "push") {
            if (ev.kind === "pushSift" && ev.first) {
              tl.line(24);
              tl.line(25);
              tl.line(26);
              status("index > 0  ·  push the previous tweet of user " + ev.pushed.author,
                C.blue, "next-newest entry: #" + ev.pushed.id + " with time " + (-ev.pushed.key));
            } else if (ev.kind === "push") {
              tl.line(26);
              detail("heappush inserts #" + ev.pushed.id + " and sifts it into place");
            }
            applyHeap(ev.heap, ev.marks, ev.feedLen, step.feed, 0.16);
          }
        }
        tl.line(21);
        tl.line(27);
        status("return the feed  ·  " + (step.feed.length ? step.feed.join(", ") : "empty"), C.green,
          step.feed.length === 10 ? "stopped because the feed reached its 10-tweet cap"
            : "stopped because the heap is empty");
        tl.add(0.01, () => {
          scene.feedText.textContent = "return [" + step.feed.join(", ") + "]";
          setOpacity(scene.feedText, 1);
          for (let i = 0; i < scene.feedChips.length; i++) {
            if (i < step.feed.length) {
              scene.feedChips[i].t.textContent = String(step.feed[i]);
              setOpacity(scene.feedChips[i].g, 1);
            }
          }
        });
        setReturn(si, step.feed);
        tl.wait(0.12);
      }
    }

    // ---- summary -------------------------------------------------------
    tl.add(0.3, u => {
      setOpacity(scene.opPtr, 1 - u);
      setOpacity(scene.status, 1 - u);
      setOpacity(scene.detail, 1 - u);
    }, easeOut);
    const returnsStr = "returns = [" + sim.returns.map(v => {
      if (v === null) return "null";
      if (Array.isArray(v)) return "[" + v.join(", ") + "]";
      return String(v);
    }).join(", ") + "]";
    tl.add(0.01, () => {
      scene.final.textContent = returnsStr;
      setOpacity(scene.final, 1);
    });
    tl.add(0.45, u => setOpacity(scene.final, u), easeOut);
    tl.log(returnsStr, C.green);
    tl.wait(0.8);

    return tl.finish();
  },
};

/* ------------------------------------------------------------------ *
 * Parsing and simulation.
 * ------------------------------------------------------------------ */

function splitTopLevel(raw) {
  const parts = [];
  let depth = 0, start = 0;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") depth--;
    else if (ch === "," && depth === 0) {
      parts.push(raw.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(raw.slice(start));
  return parts.map(s => s.trim()).filter(Boolean);
}

function twitterClone(heap) {
  return heap.map(e => ({ key: e.key, id: e.id, author: e.author, index: e.index }));
}

function twitterCmp(a, b) {
  if (a.key !== b.key) return a.key - b.key;
  if (a.id !== b.id) return a.id - b.id;
  if (a.author !== b.author) return a.author - b.author;
  return a.index - b.index;
}

function twitterSiftDown(a, i, states) {
  const n = a.length;
  while (true) {
    let smallest = i;
    const l = 2 * i + 1, r = 2 * i + 2;
    if (l < n && twitterCmp(a[l], a[smallest]) < 0) smallest = l;
    if (r < n && twitterCmp(a[r], a[smallest]) < 0) smallest = r;
    if (smallest === i) break;
    const t = a[i]; a[i] = a[smallest]; a[smallest] = t;
    states.push({ heap: twitterClone(a), marks: [i, smallest] });
    i = smallest;
  }
}

function twitterSiftUp(a, i, states) {
  while (i > 0) {
    const p = Math.floor((i - 1) / 2);
    if (twitterCmp(a[i], a[p]) >= 0) break;
    const t = a[i]; a[i] = a[p]; a[p] = t;
    states.push({ heap: twitterClone(a), marks: [i, p] });
    i = p;
  }
}

function twitterHeapifyStates(a) {
  const states = [{ heap: twitterClone(a), marks: [] }];
  for (let i = Math.floor(a.length / 2) - 1; i >= 0; i--) twitterSiftDown(a, i, states);
  return states;
}

function twitterPushStates(a, value) {
  const states = [];
  a.push(value);
  states.push({ heap: twitterClone(a), marks: [a.length - 1] });
  twitterSiftUp(a, a.length - 1, states);
  return states;
}

function twitterPopStates(a) {
  const states = [];
  const out = a[0];
  const last = a.pop();
  if (a.length) {
    a[0] = last;
    states.push({ heap: twitterClone(a), marks: [0] });
    twitterSiftDown(a, 0, states);
  } else {
    states.push({ heap: twitterClone(a), marks: [] });
  }
  return { value: out, states };
}

function snapshotFollowing(following) {
  const out = {};
  for (const [user, set] of following) out[user] = [...set].sort((a, b) => a - b);
  return out;
}

function simulateTwitter(ops) {
  let time = 0;
  const tweets = new Map();
  const following = new Map();
  const usersSet = new Set();
  const steps = [{ kind: "init", following: {}, activeUsers: [] }];
  const returns = [null];
  let maxCandidates = 1;

  const ensureUser = uid => {
    usersSet.add(uid);
    if (!tweets.has(uid)) tweets.set(uid, []);
    if (!following.has(uid)) following.set(uid, new Set());
  };

  for (let i = 1; i < ops.length; i++) {
    const op = ops[i];
    if (op.name === "postTweet") {
      ensureUser(op.a);
      time++;
      const list = tweets.get(op.a);
      const index = list.length;
      list.push({ time, id: op.b });
      steps.push({
        kind: "post", user: op.a, tweetId: op.b, time, index,
        following: snapshotFollowing(following),
        activeUsers: [...usersSet].sort((a, b) => a - b),
      });
      returns.push(null);
    } else if (op.name === "follow" || op.name === "unfollow") {
      ensureUser(op.a);
      ensureUser(op.b);
      if (op.name === "follow") following.get(op.a).add(op.b);
      else following.get(op.a).delete(op.b);
      steps.push({
        kind: op.name, follower: op.a, followee: op.b,
        following: snapshotFollowing(following),
        activeUsers: [...usersSet].sort((a, b) => a - b),
      });
      returns.push(null);
    } else {
      ensureUser(op.user);
      const authors = [...(following.get(op.user) || new Set()), op.user];
      const unique = [...new Set(authors)].sort((a, b) => a - b);
      for (const a of unique) ensureUser(a);

      const heap = [];
      for (const author of unique) {
        const list = tweets.get(author) || [];
        if (list.length) {
          const last = list[list.length - 1];
          heap.push({ key: -last.time, id: last.id, author, index: list.length - 1 });
        }
      }
      maxCandidates = Math.max(maxCandidates, heap.length);

      const events = [];
      events.push({ kind: "seed", heap: twitterClone(heap), marks: [], feedLen: 0 });
      const heapify = twitterHeapifyStates(heap);
      for (const st of heapify) {
        events.push({ kind: "heapify", heap: st.heap, marks: st.marks, feedLen: 0 });
      }

      const feed = [];
      while (heap.length && feed.length < 10) {
        const popped = twitterPopStates(heap);
        popped.states.forEach((st, idx) => {
          events.push({
            kind: "popSift", heap: st.heap, marks: st.marks,
            feedLen: feed.length, popped: popped.value, first: idx === 0,
          });
        });
        feed.push(popped.value.id);
        events.push({
          kind: "pop", heap: twitterClone(heap), marks: [],
          feedLen: feed.length, popped: popped.value,
        });

        if (popped.value.index > 0) {
          const list = tweets.get(popped.value.author) || [];
          const prev = list[popped.value.index - 1];
          const entry = {
            key: -prev.time, id: prev.id,
            author: popped.value.author, index: popped.value.index - 1,
          };
          const pushed = twitterPushStates(heap, entry);
          pushed.forEach((st, idx) => {
            events.push({
              kind: "pushSift", heap: st.heap, marks: st.marks,
              feedLen: feed.length, pushed: entry, first: idx === 0,
            });
          });
          events.push({
            kind: "push", heap: twitterClone(heap), marks: [],
            feedLen: feed.length, pushed: entry,
          });
        }
      }
      events.push({ kind: "done", heap: twitterClone(heap), marks: [], feedLen: feed.length });

      steps.push({
        kind: "feed", user: op.user, users: unique, feed, events,
        following: snapshotFollowing(following),
        activeUsers: [...usersSet].sort((a, b) => a - b),
      });
      returns.push(feed);
    }
  }

  const tweetCounts = [];
  const finalTweets = new Map();
  for (const uid of [...usersSet].sort((a, b) => a - b)) {
    const list = tweets.get(uid) || [];
    tweetCounts.push(list.length);
    finalTweets.set(uid, list.slice());
  }

  return {
    steps, returns, allUsers: [...usersSet].sort((a, b) => a - b),
    finalTweets, tweetCounts, maxCandidates,
  };
}
