"""Assemble self-contained ``<problem>/visualize.html`` pages and root ``index.html``.

The page stays a single file with **no external requests** (per
``docs/CONVENTIONS.md`` §9): this inlines ``engine.css``, ``engine.js`` and the
problem's ``visualize.scene.js`` into ``shell.html``, and generates a root
``index.html`` catalog grouped by topic so clicking any problem opens its
relative ``visualize.html`` animation.

Usage::

    python3 -m framework.viz.build topics/01_arrays_and_hashing/contains_duplicate
    python3 -m framework.viz.build --all      # every problem with a scene + index.html
    python3 -m framework.viz.build --index    # regenerate root index.html only
"""
from __future__ import annotations

import html as html_mod
import json
import re
import sys
from pathlib import Path

VIZ_DIR = Path(__file__).resolve().parent
ROOT = VIZ_DIR.parent.parent
TOPICS = ROOT / "topics"

# The shell sits these inside <style>/<script>, so JS-comment syntax keeps the
# page valid before (and harmless during) substitution.
CSS_TOKEN = "/*__ENGINE_CSS__*/"
JS_TOKEN = "/*__ENGINE_JS__*/"
SCENE_TOKEN = "/*__SCENE_JS__*/"


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _extract_subtitle(scene_file: Path) -> str:
    if not scene_file.exists():
        return ""
    text = _read(scene_file)
    m = re.search(r'subtitle\s*:\s*"([^"]+)"', text)
    return m.group(1) if m else ""


def _pretty_topic(folder_name: str) -> tuple[str, str]:
    m = re.match(r"^(\d+)_(.+)$", folder_name)
    if not m:
        return ("", folder_name.replace("_", " ").title())
    num, slug = m.group(1), m.group(2)
    words = slug.replace("_", " ").title()
    words = (
        words.replace("And", "&")
        .replace("1d", "1-D")
        .replace("2d", "2-D")
        .replace("Ii", "II")
    )
    return (num, words)


def build(problem_dir: Path | str) -> Path:
    """Inline the engine + scene into ``<problem_dir>/visualize.html``."""
    problem_dir = Path(problem_dir)
    scene_file = problem_dir / "visualize.scene.js"
    if not scene_file.exists():
        raise FileNotFoundError(f"no visualize.scene.js in {problem_dir}")

    html = _read(VIZ_DIR / "shell.html")
    html = html.replace(CSS_TOKEN, _read(VIZ_DIR / "engine.css"))
    html = html.replace(JS_TOKEN, _read(VIZ_DIR / "engine.js"))
    html = html.replace(SCENE_TOKEN, _read(scene_file))

    out = problem_dir / "visualize.html"
    out.write_text(html, encoding="utf-8")
    return out


def build_index() -> Path:
    """Generate the root ``index.html`` catalog grouped by topic."""
    topic_dirs = sorted(d for d in TOPICS.iterdir() if d.is_dir()) if TOPICS.exists() else []
    topics_data = []
    total_problems = 0
    total_animated = 0

    for tdir in topic_dirs:
        num, topic_title = _pretty_topic(tdir.name)
        problems_list = []
        for pdir in sorted(d for d in tdir.iterdir() if d.is_dir()):
            prob_file = pdir / "problem.json"
            viz_html = pdir / "visualize.html"
            if not prob_file.exists() and not viz_html.exists() and not (pdir / "solution.py").exists():
                continue
            try:
                meta = json.loads(_read(prob_file)) if prob_file.exists() else {}
            except Exception:
                meta = {}
            title = meta.get("title") or pdir.name.replace("_", " ").title()
            difficulty = meta.get("difficulty") or "Medium"
            leetcode = meta.get("leetcode") or meta.get("number")
            scene_js = pdir / "visualize.scene.js"
            has_html = viz_html.exists()
            subtitle = _extract_subtitle(scene_js) if scene_js.exists() else ""
            rel_href = f"topics/{tdir.name}/{pdir.name}/visualize.html"

            total_problems += 1
            if has_html:
                total_animated += 1

            problems_list.append({
                "id": pdir.name,
                "title": title,
                "difficulty": difficulty,
                "leetcode": leetcode,
                "has_html": has_html,
                "subtitle": subtitle,
                "href": rel_href,
            })

        if problems_list:
            anim_count = sum(1 for p in problems_list if p["has_html"])
            topics_data.append({
                "slug": tdir.name,
                "num": num,
                "title": topic_title,
                "problems": problems_list,
                "anim_count": anim_count,
                "total_count": len(problems_list),
            })

    # Build topic jump pills
    nav_pills_html = []
    for t in topics_data:
        badge_cls = "complete" if t["anim_count"] == t["total_count"] and t["total_count"] > 0 else (
            "partial" if t["anim_count"] > 0 else "empty"
        )
        label = f"{t['num']} · {html_mod.escape(t['title'])}" if t["num"] else html_mod.escape(t["title"])
        nav_pills_html.append(
            f'<a class="topic-pill {badge_cls}" href="#topic-{html_mod.escape(t["slug"])}">'
            f'<span>{label}</span>'
            f'<span class="pill-count">{t["anim_count"]}/{t["total_count"]}</span>'
            f'</a>'
        )

    # Build topic sections
    sections_html = []
    for t in topics_data:
        cards_html = []
        for p in t["problems"]:
            diff = p["difficulty"]
            diff_cls = diff.lower()
            lc = p["leetcode"]
            lc_badge = (
                f'<span class="lc-num">#{lc}</span>'
                if isinstance(lc, int) or (isinstance(lc, str) and lc.isdigit())
                else ""
            )
            sub_html = (
                f'<p class="card-sub">{html_mod.escape(p["subtitle"])}</p>'
                if p["subtitle"]
                else '<p class="card-sub muted-sub">Interactive 3Blue1Brown walkthrough</p>'
            )
            search_blob = f"{t['title']} {p['title']} {p['id']} {p['subtitle']} {diff}".lower()

            if p["has_html"]:
                cards_html.append(
                    f'<a class="problem-card ready" href="{html_mod.escape(p["href"])}" '
                    f'data-search="{html_mod.escape(search_blob)}" '
                    f'data-diff="{html_mod.escape(diff_cls)}" data-ready="1">'
                    f'  <div class="card-top">'
                    f'    <div class="card-title-group">'
                    f'      {lc_badge}'
                    f'      <h3 class="card-title">{html_mod.escape(p["title"])}</h3>'
                    f'    </div>'
                    f'    <span class="diff-badge {html_mod.escape(diff_cls)}">{html_mod.escape(diff)}</span>'
                    f'  </div>'
                    f'  {sub_html}'
                    f'  <div class="card-foot">'
                    f'    <span class="code-slug">{html_mod.escape(p["id"])}</span>'
                    f'    <span class="play-chip"><span class="play-dot">▶</span> Open Animation</span>'
                    f'  </div>'
                    f'</a>'
                )
            else:
                cards_html.append(
                    f'<div class="problem-card pending" '
                    f'data-search="{html_mod.escape(search_blob)}" '
                    f'data-diff="{html_mod.escape(diff_cls)}" data-ready="0">'
                    f'  <div class="card-top">'
                    f'    <div class="card-title-group">'
                    f'      {lc_badge}'
                    f'      <h3 class="card-title">{html_mod.escape(p["title"])}</h3>'
                    f'    </div>'
                    f'    <span class="diff-badge {html_mod.escape(diff_cls)}">{html_mod.escape(diff)}</span>'
                    f'  </div>'
                    f'  <p class="card-sub muted-sub">Animation coming soon · solution &amp; tests available</p>'
                    f'  <div class="card-foot">'
                    f'    <span class="code-slug">{html_mod.escape(p["id"])}</span>'
                    f'    <span class="pending-chip">Pending viz</span>'
                    f'  </div>'
                    f'</div>'
                )

        status_cls = "done" if t["anim_count"] == t["total_count"] else ("active" if t["anim_count"] > 0 else "todo")
        num_badge = f'<span class="topic-num">{html_mod.escape(t["num"])}</span>' if t["num"] else ""
        sections_html.append(
            f'<section class="topic-section" id="topic-{html_mod.escape(t["slug"])}" data-topic="{html_mod.escape(t["slug"])}">'
            f'  <div class="topic-header">'
            f'    <div class="topic-title-wrap">'
            f'      {num_badge}'
            f'      <h2 class="topic-title">{html_mod.escape(t["title"])}</h2>'
            f'    </div>'
            f'    <span class="topic-counter {status_cls}">{t["anim_count"]} / {t["total_count"]} animated</span>'
            f'  </div>'
            f'  <div class="problem-grid">'
            f'    {"".join(cards_html)}'
            f'  </div>'
            f'</section>'
        )

    index_html = f"""<!doctype html>
<html lang="en" class="dark">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>code180 — 3Blue1Brown Algorithm Visualizations</title>
<style>
:root {{
  --background: #020617;       /* slate-950 */
  --foreground: #f8fafc;       /* slate-50 */
  --card: #0f172a;             /* slate-900 */
  --card-hover: #131c31;
  --muted: #1e293b;            /* slate-800 */
  --muted-foreground: #94a3b8; /* slate-400 */
  --border: #1e293b;           /* slate-800 */
  --ring: #38bdf8;             /* sky-400 */
  --green: #4ade80;
  --amber: #fbbf24;
  --red: #f87171;
  --sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --mono: ui-monospace, "Cascadia Mono", "JetBrains Mono", Consolas, monospace;
}}
* {{ box-sizing: border-box; }}
html {{ scroll-behavior: smooth; }}
body {{
  margin: 0;
  min-height: 100vh;
  background: var(--background);
  color: var(--foreground);
  font-family: var(--sans);
  -webkit-font-smoothing: antialiased;
}}
.top-nav {{
  position: sticky;
  top: 0;
  z-index: 30;
  background: rgba(2, 6, 23, 0.88);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}}
.nav-inner {{
  max-width: 1320px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}}
.home-icon-btn {{
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--foreground);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}}
.home-icon-btn:hover {{
  background: var(--muted);
  border-color: var(--ring);
  color: var(--ring);
}}
.controls-wrap {{
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}}
.search-box {{
  position: relative;
  display: flex;
  align-items: center;
}}
.search-box input {{
  width: 260px;
  height: 36px;
  padding: 0 34px 0 12px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--foreground);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}}
.search-box input:focus {{
  border-color: var(--ring);
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.18);
}}
.search-kbd {{
  position: absolute;
  right: 8px;
  padding: 1px 6px;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted-foreground);
  background: var(--muted);
  border-radius: 4px;
  pointer-events: none;
}}
.filter-group {{
  display: inline-flex;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}}
.filter-btn {{
  height: 30px;
  padding: 0 10px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--muted-foreground);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}}
.filter-btn:hover {{
  color: var(--foreground);
}}
.filter-btn.active {{
  background: var(--muted);
  color: var(--foreground);
}}
.stats-pill {{
  height: 34px;
  padding: 0 12px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--card);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--muted-foreground);
}}
.stats-pill strong {{
  color: var(--ring);
  font-family: var(--mono);
}}
.container {{
  max-width: 1320px;
  margin: 0 auto;
  padding: 24px 24px 72px;
}}
.topic-pills {{
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 28px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border);
}}
.topic-pill {{
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--card);
  color: var(--muted-foreground);
  text-decoration: none;
  font-size: 12.5px;
  font-weight: 500;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}}
.topic-pill:hover {{
  border-color: #334155;
  color: var(--foreground);
  background: var(--card-hover);
}}
.topic-pill.complete {{
  border-color: rgba(56, 189, 248, 0.35);
  color: var(--foreground);
}}
.pill-count {{
  font-family: var(--mono);
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--muted);
  color: var(--muted-foreground);
}}
.topic-pill.complete .pill-count {{
  background: rgba(56, 189, 248, 0.15);
  color: var(--ring);
}}
.topic-section {{
  margin-bottom: 40px;
  scroll-margin-top: 84px;
}}
.topic-header {{
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}}
.topic-title-wrap {{
  display: flex;
  align-items: center;
  gap: 10px;
}}
.topic-num {{
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 5px;
  background: var(--muted);
  color: var(--ring);
}}
.topic-title {{
  margin: 0;
  font-size: 19px;
  font-weight: 600;
  letter-spacing: -0.01em;
}}
.topic-counter {{
  font-family: var(--mono);
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--card);
  border: 1px solid var(--border);
  color: var(--muted-foreground);
}}
.topic-counter.done {{
  border-color: rgba(74, 222, 128, 0.35);
  color: var(--green);
  background: rgba(74, 222, 128, 0.08);
}}
.problem-grid {{
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
  gap: 14px;
}}
.problem-card {{
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px 18px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--card);
  text-decoration: none;
  color: var(--foreground);
  transition: transform 0.14s ease, border-color 0.14s ease, background 0.14s ease, box-shadow 0.14s ease;
}}
.problem-card.ready:hover {{
  transform: translateY(-2px);
  border-color: var(--ring);
  background: var(--card-hover);
  box-shadow: 0 8px 24px -8px rgba(14, 165, 233, 0.22);
}}
.problem-card.pending {{
  opacity: 0.55;
}}
.card-top {{
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}}
.card-title-group {{
  display: flex;
  align-items: baseline;
  gap: 7px;
  min-width: 0;
}}
.lc-num {{
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted-foreground);
  flex-shrink: 0;
}}
.card-title {{
  margin: 0;
  font-size: 15.5px;
  font-weight: 600;
  line-height: 1.3;
}}
.diff-badge {{
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
  flex-shrink: 0;
  border: 1px solid transparent;
}}
.diff-badge.easy {{
  color: var(--green);
  background: rgba(74, 222, 128, 0.1);
  border-color: rgba(74, 222, 128, 0.25);
}}
.diff-badge.medium {{
  color: var(--amber);
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.25);
}}
.diff-badge.hard {{
  color: var(--red);
  background: rgba(248, 113, 113, 0.1);
  border-color: rgba(248, 113, 113, 0.25);
}}
.card-sub {{
  margin: 10px 0 14px;
  font-size: 12.5px;
  line-height: 1.45;
  color: #cbd5e1;
  font-family: var(--mono);
}}
.card-sub.muted-sub {{
  font-family: var(--sans);
  color: var(--muted-foreground);
}}
.card-foot {{
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid rgba(30, 41, 59, 0.7);
  font-size: 12px;
}}
.code-slug {{
  font-family: var(--mono);
  color: var(--muted-foreground);
  font-size: 11.5px;
}}
.play-chip {{
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
  color: var(--ring);
}}
.play-dot {{
  font-size: 10px;
}}
.pending-chip {{
  color: var(--muted-foreground);
  font-size: 11.5px;
}}
.empty-state {{
  display: none;
  text-align: center;
  padding: 48px 20px;
  color: var(--muted-foreground);
  border: 1px dashed var(--border);
  border-radius: 12px;
}}
</style>
</head>
<body>
  <header class="top-nav">
    <div class="nav-inner">
      <a class="home-icon-btn" href="index.html" title="Home" aria-label="Home">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9" />
          <path d="M9 20v-6h6v6" />
        </svg>
      </a>

      <div class="controls-wrap">
        <div class="search-box">
          <input id="search-input" type="search" placeholder="Search problem or topic..." autocomplete="off" />
          <span class="search-kbd">/</span>
        </div>

        <div class="filter-group" id="filter-group">
          <button class="filter-btn active" data-filter="all">All ({total_problems})</button>
          <button class="filter-btn" data-filter="ready">Animated ({total_animated})</button>
          <button class="filter-btn" data-filter="easy">Easy</button>
          <button class="filter-btn" data-filter="medium">Medium</button>
          <button class="filter-btn" data-filter="hard">Hard</button>
        </div>

        <div class="stats-pill">
          <span>Animated</span>
          <strong>{total_animated} / {total_problems}</strong>
        </div>
      </div>
    </div>
  </header>

  <main class="container">
    <nav class="topic-pills" aria-label="Topics">
      {"".join(nav_pills_html)}
    </nav>

    <div id="sections-root">
      {"".join(sections_html)}
    </div>

    <div class="empty-state" id="empty-state">
      No problems match your current search / filter.
    </div>
  </main>

<script>
(function() {{
  const searchInput = document.getElementById("search-input");
  const filterBtns = Array.from(document.querySelectorAll(".filter-btn"));
  const sections = Array.from(document.querySelectorAll(".topic-section"));
  const emptyState = document.getElementById("empty-state");
  let activeFilter = "all";

  function applyFilters() {{
    const q = (searchInput.value || "").trim().toLowerCase();
    let visibleTotal = 0;

    sections.forEach(sec => {{
      const cards = Array.from(sec.querySelectorAll(".problem-card"));
      let visibleInSec = 0;
      cards.forEach(card => {{
        const text = card.getAttribute("data-search") || "";
        const diff = card.getAttribute("data-diff") || "";
        const ready = card.getAttribute("data-ready") === "1";

        let matchFilter = true;
        if (activeFilter === "ready") matchFilter = ready;
        else if (activeFilter === "easy" || activeFilter === "medium" || activeFilter === "hard") {{
          matchFilter = (diff === activeFilter);
        }}

        const matchQuery = !q || text.includes(q);
        const show = matchFilter && matchQuery;
        card.style.display = show ? "" : "none";
        if (show) visibleInSec++;
      }});

      sec.style.display = visibleInSec > 0 ? "" : "none";
      visibleTotal += visibleInSec;
    }});

    emptyState.style.display = visibleTotal === 0 ? "block" : "none";
  }}

  searchInput.addEventListener("input", applyFilters);

  filterBtns.forEach(btn => {{
    btn.addEventListener("click", () => {{
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.getAttribute("data-filter") || "all";
      applyFilters();
    }});
  }});

  window.addEventListener("keydown", e => {{
    if (e.key === "/" && document.activeElement !== searchInput) {{
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }} else if (e.key === "Escape" && document.activeElement === searchInput) {{
      searchInput.value = "";
      searchInput.blur();
      applyFilters();
    }}
  }});
}})();
</script>
</body>
</html>
"""
    out = ROOT / "index.html"
    out.write_text(index_html, encoding="utf-8")
    return out


def build_all() -> list[Path]:
    built = []
    for scene_file in sorted(TOPICS.glob("*/*/visualize.scene.js")):
        built.append(build(scene_file.parent))
    built.append(build_index())
    return built


def main(argv: list[str] | None = None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return 0
    if argv[0] == "--index":
        out = build_index()
        print("built", out.resolve().relative_to(ROOT))
        return 0
    if argv[0] == "--all":
        for path in build_all():
            print("built", path.resolve().relative_to(ROOT))
        return 0
    for target in argv:
        try:
            print("built", build(Path(target)).resolve().relative_to(ROOT))
        except FileNotFoundError as exc:
            print(f"skip: {exc}")
            return 1
    out = build_index()
    print("built", out.resolve().relative_to(ROOT))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
