/* Headless scene checker for framework/viz.
 *
 * Boots engine.js + a problem's visualize.scene.js under a minimal DOM shim,
 * seeds `?args=`, and renders the whole timeline (as the scrubber would), so
 * runtime errors and blank pages are caught without a browser.
 *
 *   node framework/viz/check.js topics/<topic>/<problem>/visualize.scene.js \
 *        '[[1,2,3,1]]' '[[1,2,3,4]]'
 *
 * Each extra argument is a JSON list passed as `?args=` (as run.py --html
 * does). Exits non-zero if any arg set fails to boot or render.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const scenePath = process.argv[2];
if (!scenePath) {
  console.error("usage: node framework/viz/check.js <visualize.scene.js> [argsJson ...]");
  process.exit(2);
}
const ENGINE = path.join(__dirname, "engine.js");
const argSets = process.argv.slice(3);

function makeEl(tag) {
  const el = {
    tagName: String(tag || "div").toUpperCase(),
    children: [],
    attrs: {},
    listeners: {},
    value: "",
    max: "",
    id: "",
    spellcheck: true,
    type: "",
    style: { opacity: 1, setProperty() {} },
    classList: { add() {}, remove() {}, contains() { return false; } },
    _text: "",
    set textContent(v) { this._text = String(v); },
    get textContent() {
      if (this._text) return this._text;
      return (this.children || []).map(c => c.textContent || "").join("");
    },
    set innerHTML(_v) { this.children.length = 0; },
    get innerHTML() { return ""; },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return this.attrs[k]; },
    appendChild(c) { this.children.push(c); return c; },
    removeChild(c) {
      const i = this.children.indexOf(c);
      if (i >= 0) this.children.splice(i, 1);
      return c;
    },
    get firstChild() { return this.children[0]; },
    getBBox() { return { x: 0, y: 0, width: 120, height: 24 }; },
    getTotalLength() { return 240; },
    addEventListener(type, fn) { (this.listeners[type] || (this.listeners[type] = [])).push(fn); },
    _fire(type, ev) { for (const fn of this.listeners[type] || []) fn(ev || {}); },
  };
  return el;
}

function makeDocument(readyState) {
  const cache = {};
  const listeners = {};
  return {
    readyState,
    title: "",
    documentElement: makeEl("html"),
    body: makeEl("body"),
    createElement: tag => makeEl(tag),
    createElementNS: (_ns, tag) => makeEl(tag),
    createTextNode: text => { const n = makeEl("#text"); n.textContent = text; return n; },
    getElementById: id => (cache[id] || (cache[id] = makeEl("div"))),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener(type, fn) { (listeners[type] || (listeners[type] = [])).push(fn); },
    _fire(type, ev) { for (const fn of listeners[type] || []) fn(ev || {}); },
  };
}

function clipWidthMap(stage) {
  const defs = (stage.children || []).find(c => c.tagName === "DEFS");
  const map = new Map();
  if (!defs) return map;
  for (const cp of defs.children || []) {
    if (cp.tagName === "CLIPPATH" && cp.attrs && cp.attrs.id) {
      const rect = (cp.children || [])[0];
      map.set("url(#" + cp.attrs.id + ")", rect ? Number(rect.attrs.width || 0) : 0);
    }
  }
  return map;
}

function visibleTexts(node, clips, parentOp, tx, ty, out) {
  const op = parentOp * (node.style && node.style.opacity !== undefined ? Number(node.style.opacity) : 1);
  if (op <= 0.55) return out;
  const cp = node.attrs && node.attrs["clip-path"];
  if (cp && clips.has(cp) && clips.get(cp) <= 0.5) return out;

  let curTx = tx, curTy = ty;
  const tr = node.attrs && node.attrs.transform;
  if (tr) {
    const m = /translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/.exec(tr);
    if (m) {
      curTx += Number(m[1]);
      curTy += Number(m[2]);
    }
  }

  if (node.tagName === "TEXT") {
    const txt = (node.textContent || "").trim();
    if (txt) {
      const x = curTx + Number((node.attrs && node.attrs.x) || 0);
      const y = curTy + Number((node.attrs && node.attrs.y) || 0);
      out.push({ node, txt, x: Math.round(x), y: Math.round(y), op });
    }
    return out;
  }
  for (const child of node.children || []) {
    visibleTexts(child, clips, op, curTx, curTy, out);
  }
  return out;
}
function writableNodes(node, out) {
  for (const child of node.children || []) {
    if (child.attrs && child.attrs["clip-path"]) out.push(child);
    writableNodes(child, out);
  }
  return out;
}

function runOne(argsJson) {
  const document = makeDocument("loading");
  const sandbox = {
    document,
    window: { location: { search: argsJson ? "?args=" + encodeURIComponent(argsJson) : "" } },
    console, setTimeout, clearTimeout,
    requestAnimationFrame() { return 0; },
    URLSearchParams, Math, JSON, Number, String, Array, Object, Set, Map, isFinite,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);

  const errors = [];
  const maxOpacity = new Map();
  const overlaps = new Map();
  const note = () => {
    const stage = document.getElementById("stage");
    for (const node of writableNodes(stage, [])) {
      const seen = Number(node.style.opacity) || 0;
      maxOpacity.set(node, Math.max(maxOpacity.get(node) || 0, seen));
    }
    const clips = clipWidthMap(stage);
    const vis = visibleTexts(stage, clips, 1, 0, 0, []);
    const byPos = new Map();
    for (const item of vis) {
      const key = item.x + "," + item.y;
      const prev = byPos.get(key);
      if (prev && prev.txt !== item.txt) {
        overlaps.set(key, [prev.txt, item.txt]);
      } else {
        byPos.set(key, item);
      }
    }
  };
  try {
    vm.runInContext(fs.readFileSync(ENGINE, "utf8"), sandbox, { filename: "engine.js" });
    vm.runInContext(fs.readFileSync(scenePath, "utf8"), sandbox, { filename: scenePath });
    document._fire("DOMContentLoaded");
    note();

    // Drive the timeline by poking the scrub slider, as the player would.
    // Sample at ~50 fps so even short-lived (write-on then faded) nodes are
    // caught by the visibility check below.
    const scrub = document.getElementById("scrub");
    const dur = Number(scrub.max) / 1000;
    if (!(dur > 0)) errors.push("timeline duration is zero");
    const step = Math.max(0.02, dur / 2000);
    for (let t = 0; t <= dur + 1e-9; t += step) {
      scrub.value = String(Math.round(t * 1000));
      scrub._fire("input");
      note();
    }
  } catch (err) {
    errors.push(String(err && err.stack ? err.stack : err));
  }
  for (const [pos, [a, b]] of overlaps.entries()) {
    errors.push("overlapping text at (" + pos + "): " + JSON.stringify(a) + " vs " + JSON.stringify(b));
  }
  const hiddenNodes = [...maxOpacity.entries()].filter(([, v]) => v <= 0).map(([node]) => node);
  const tList = document.getElementById("transcript-list");
  const tCount = tList && tList.children ? tList.children.length : 0;
  const dur = Math.round(Number(document.getElementById("scrub").max) / 1000);
  if (tCount === 0) errors.push("narration transcript stayed empty");
  return { document, errors, writables: maxOpacity.size, hidden: hiddenNodes.length, hiddenNodes, tCount, dur };
}

let failures = 0;
for (const argsJson of [null, ...argSets]) {
  const { document, errors, writables, hidden, hiddenNodes, tCount, dur } = runOne(argsJson);
  const stage = document.getElementById("stage");
  const label = argsJson ? "args=" + argsJson : "default";
  if (errors.length) {
    failures++;
    console.log("FAIL  " + label);
    for (const e of errors) console.log("      " + e.split("\n").join("\n      "));
  } else if (!/animated walkthrough/.test(document.title)) {
    failures++;
    console.log("FAIL  " + label + "  (title never set -> boot did not run)");
  } else if (stage.children.length === 0) {
    failures++;
    console.log("FAIL  " + label + "  (stage stayed empty)");
  } else if (hidden > 0) {
    failures++;
    console.log("FAIL  " + label + "  (" + hidden + "/" + writables + " write-on nodes never became visible)");
    for (const node of hiddenNodes) {
      const text = (node.textContent || "").slice(0, 48);
      console.log("        hidden <" + node.tagName.toLowerCase() + "> " +
                  JSON.stringify(text) + " " + JSON.stringify(node.attrs));
    }
  } else {
    console.log("ok    " + label + "  stageGroups=" + stage.children.length + "  writables=" + writables + "  transcript=" + tCount + "  dur=" + dur + "s");
  }
}
process.exit(failures ? 1 : 0);
