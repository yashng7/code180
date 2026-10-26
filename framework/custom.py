"""Ad-hoc and interactive test cases for a single problem.

Usage from the CLI::

    python3 run.py two_sum -c                      # interactive prompt
    python3 run.py two_sum -c '[[2,7,11,15], 9]'   # one-shot

For regular problems the arguments are always a JSON list -- one element per
function argument. For design problems pass a JSON object with the operation
sequence: ``{"ops": ["MinStack","push",...], "vals": [[],[-2],...]}``.
"""
from __future__ import annotations

import inspect
import json
from typing import Any, List

from .loader import Problem

HELP = (
    "Enter the arguments as a JSON list.\n"
    "  two arguments (Two Sum) : [[2,7,11,15], 9]\n"
    "  single list argument    : [[1,2,3,4]]\n"
    "Commands: q = quit, h = help, m = show metadata/signature."
)

DESIGN_HELP = (
    "This is a design problem. Send a JSON object with the operation sequence:\n"
    '  {"ops": ["MinStack","push","push","getMin","pop","top"],\n'
    '   "vals": [[],[-2],[0],[],[],[]]}\n'
    "Commands: q = quit, h = help, m = show metadata."
)


def _parse_args(raw: str) -> List[Any]:
    raw = raw.strip()
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        value = json.loads(f"[{raw}]")
    return value if isinstance(value, list) else [value]


def _signature(problem: Problem) -> str:
    try:
        if problem.is_design:
            cls = getattr(problem.module(), problem.meta.get("class", ""))
            methods = [n for n, _ in inspect.getmembers(cls, inspect.isfunction)]
            return f"class {cls.__name__} ({', '.join(methods)})"
        return f"{problem.meta.get('function', problem.id)}{inspect.signature(problem.function())}"
    except Exception as exc:  # noqa: BLE001
        return f"<unavailable: {exc}>"


def run(problem: Problem, raw: str | None = None) -> int:
    print(f"Custom test — {problem.title} ({problem.id})")
    print(f"  call    : {_signature(problem)}")
    print(f"  compare : {problem.meta.get('compare', 'exact')}")
    if problem.is_design:
        print("  type    : design (operation sequence)")
    print()

    if raw is not None:
        return _run_once(problem, raw)

    print(DESIGN_HELP if problem.is_design else HELP)
    print()
    while True:
        try:
            line = input("args> ")
        except (EOFError, KeyboardInterrupt):
            print()
            break
        line = line.strip()
        if line in {"q", "quit", "exit"}:
            break
        if line in {"h", "help", "?"}:
            print(DESIGN_HELP if problem.is_design else HELP)
            continue
        if line in {"m", "meta"}:
            print(json.dumps(problem.meta, indent=2))
            continue
        if not line:
            continue
        _run_once(problem, line)
    return 0


def _run_once(problem: Problem, raw: str) -> int:
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        print(f"  ! could not parse arguments: {exc}")
        return 1

    try:
        if problem.is_design:
            if not isinstance(payload, dict) or "ops" not in payload:
                print('  ! design problems need {"ops": [...], "vals": [[...], ...]}')
                return 1
            result = problem.run_case({"args": payload})
            print(f"  -> {result!r}")
        else:
            args = payload if isinstance(payload, list) else [payload]
            result = problem.run(*args)
            name = problem.meta.get("function", problem.id)
            shown = ", ".join(repr(arg) for arg in args)
            print(f"  {name}({shown}) -> {result!r}")
    except Exception as exc:  # noqa: BLE001
        print(f"  ! {type(exc).__name__}: {exc}")
        return 1
    return 0
