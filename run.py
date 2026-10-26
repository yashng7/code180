#!/usr/bin/env python3
"""code180 — practice runner for the NeetCode 180 roadmap.

Examples
--------
    python3 run.py two_sum                          # run one problem's tests
    python3 run.py two_sum -c                       # interactive custom test
    python3 run.py two_sum -c '[[2,7,11,15], 9]'    # one-shot custom test
    python3 run.py two_sum --animate                # terminal animation
    python3 run.py two_sum --animate --speed 0.4    # faster frames
    python3 run.py two_sum --html                   # 3b1b-style HTML page
    python3 run.py arrays                           # every problem in a topic
    python3 run.py --all                            # everything
    python3 run.py --list                           # show the catalog
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import List, Sequence, Tuple

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from framework import animate, custom, htmlviz, runner  # noqa: E402
from framework.loader import Problem, discover  # noqa: E402

TOPICS_DIR = ROOT / "topics"


def norm(text: str) -> str:
    return re.sub(r"[^a-z0-9]", "", text.lower())


def resolve(query: str, problems: List[Problem]) -> Tuple[List[Problem], str]:
    """Resolve a user query to a list of problems.

    Priority: ``topic/problem`` path -> exact topic slug -> exact problem id ->
    topic folder -> fuzzy problem match.
    """
    nq = norm(query)

    topic_dirs = sorted(d for d in TOPICS_DIR.iterdir() if d.is_dir()) \
        if TOPICS_DIR.exists() else []

    # ``run.py 05_binary_search/binary_search`` disambiguates a topic whose slug
    # equals a problem id.
    if "/" in query:
        topic_part, _, problem_part = query.rpartition("/")
        tp, pp = norm(topic_part), norm(problem_part)
        matches = [
            p for p in problems
            if pp and pp in norm(p.id) and tp in norm(p.directory.parent.name)
        ]
        if matches:
            return matches, "problem"

    # An exact topic slug wins over a same-named problem so that, e.g.,
    # ``run.py binary_search`` runs the whole Binary Search topic rather than
    # the single problem that shares its name.
    for topic_dir in topic_dirs:
        slug = norm(re.sub(r"^\d+_", "", topic_dir.name))
        if nq and nq == slug:
            selected = [p for p in problems if p.directory.parent == topic_dir]
            if selected:
                return selected, "topic"

    exact = [p for p in problems if norm(p.id) == nq]
    if exact:
        return exact, "problem"

    for topic_dir in topic_dirs:
        if nq and nq in norm(topic_dir.name):
            selected = [p for p in problems if p.directory.parent == topic_dir]
            if selected:
                return selected, "topic"

    fuzzy = [p for p in problems if nq in norm(p.id) or nq in norm(p.title)]
    return fuzzy, "problem" if fuzzy else "none"


def print_catalog(problems: List[Problem]) -> None:
    if not problems:
        print("No problems found yet. Add one under topics/<topic>/<problem>/.")
        return
    current_topic = None
    for problem in problems:
        topic_dir = problem.directory.parent.name
        if topic_dir != current_topic:
            current_topic = topic_dir
            print(f"\n{current_topic}")
        difficulty = problem.meta.get("difficulty", "?")
        print(f"  • {problem.title}  ({problem.id})  [{difficulty}]")
    print()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="run.py",
        description="Practice runner for the NeetCode 180 roadmap.",
    )
    parser.add_argument("target", nargs="?", help="problem id or topic name")
    parser.add_argument(
        "-c",
        "--custom",
        nargs="?",
        const=True,
        default=None,
        metavar="ARGS",
        help="run a custom test case; ARGS is a JSON list of arguments "
        "(omit it for interactive mode)",
    )
    parser.add_argument("-l", "--list", action="store_true", help="list the catalog")
    parser.add_argument("-a", "--all", action="store_true", help="run every problem")
    parser.add_argument(
        "--animate",
        action="store_true",
        help="play the problem's terminal animation (requires visualize.py)",
    )
    parser.add_argument(
        "--html",
        action="store_true",
        help="serve + open the animated HTML page (requires visualize.html); "
        "Ctrl+C stops the server",
    )
    parser.add_argument(
        "--speed",
        type=float,
        default=None,
        metavar="SEC",
        help="seconds between animation frames (default 0.8; 0 prints only "
        "the final frame)",
    )
    parser.add_argument(
        "--case",
        type=int,
        default=None,
        metavar="N",
        help="1-based built-in case to visualize (default: the first case)",
    )
    parser.add_argument(
        "-v", "--verbose", action="store_true", help="show passing cases too"
    )
    parser.add_argument("--no-color", action="store_true", help="disable colored output")
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    problems = discover()
    palette = runner.Palette(enabled=not args.no_color and sys.stdout.isatty())

    if args.list:
        print_catalog(problems)
        return 0

    if args.html and not args.target and not args.all:
        return htmlviz.run_home(palette=palette)

    if args.all:
        selected = problems
        _kind = "all"
    elif args.target:
        selected, _kind = resolve(args.target, problems)
    else:
        parser.print_help()
        print_catalog(problems)
        return 0

    if not selected:
        print(f"No problem or topic matches {args.target!r}.\n")
        print_catalog(problems)
        return 2

    if args.html:
        if len(selected) != 1:
            topic_slug = selected[0].directory.parent.name if _kind == "topic" else None
            anchor = f"topic-{topic_slug}" if topic_slug else None
            return htmlviz.run_home(anchor=anchor, palette=palette)
        raw = args.custom if isinstance(args.custom, str) else None
        return htmlviz.run(
            selected[0], raw=raw, case_index=args.case, palette=palette
        )

    if args.animate:
        if len(selected) != 1:
            print("--animate needs a single problem; refine your target.")
            return 2
        raw = args.custom if isinstance(args.custom, str) else None
        speed = animate.DEFAULT_SPEED if args.speed is None else args.speed
        return animate.run(
            selected[0], raw=raw, case_index=args.case, speed=speed, palette=palette
        )

    if args.custom is not None:
        if len(selected) != 1:
            print("--custom needs a single problem; refine your target.")
            return 2
        raw = None if args.custom is True else args.custom
        return custom.run(selected[0], raw)

    failed = 0
    fully_passed = 0
    for problem in selected:
        result = runner.run_problem(problem)
        runner.print_result(result, verbose=args.verbose, palette=palette)
        failed += result.failed
        if result.ok:
            fully_passed += 1

    summary = f"{fully_passed}/{len(selected)} problem(s) fully passed"
    color = palette.green if failed == 0 else palette.red
    print(color(palette.bold(summary)))
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
