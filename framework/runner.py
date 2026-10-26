"""Execute a problem's test cases and print a readable report."""
from __future__ import annotations

import os
import sys
from dataclasses import dataclass, field
from typing import Any, List, Optional

from .compare import compare
from .loader import Problem


def supports_color() -> bool:
    return sys.stdout.isatty() and not os.environ.get("NO_COLOR")


class Palette:
    """Minimal ANSI color helper that can be disabled."""

    def __init__(self, enabled: bool = True) -> None:
        self.enabled = enabled

    def _wrap(self, code: str, text: str) -> str:
        return f"\033[{code}m{text}\033[0m" if self.enabled else text

    def green(self, text: str) -> str:
        return self._wrap("92", text)

    def red(self, text: str) -> str:
        return self._wrap("91", text)

    def yellow(self, text: str) -> str:
        return self._wrap("93", text)

    def cyan(self, text: str) -> str:
        return self._wrap("96", text)

    def bold(self, text: str) -> str:
        return self._wrap("1", text)

    def dim(self, text: str) -> str:
        return self._wrap("2", text)


@dataclass
class CaseResult:
    index: int
    passed: bool
    args: Any
    expected: Any
    actual: Any = None
    note: str = ""
    error: Optional[str] = None


@dataclass
class ProblemResult:
    problem: Problem
    cases: List[CaseResult] = field(default_factory=list)

    @property
    def total(self) -> int:
        return len(self.cases)

    @property
    def passed(self) -> int:
        return sum(1 for case in self.cases if case.passed)

    @property
    def failed(self) -> int:
        return self.total - self.passed

    @property
    def ok(self) -> bool:
        return self.total > 0 and self.failed == 0


def run_problem(problem: Problem) -> ProblemResult:
    result = ProblemResult(problem=problem)
    for index, case in enumerate(problem.cases, start=1):
        args = case.get("args", [])
        expected = case.get("expected")
        note = case.get("note", "")
        try:
            actual = problem.run_case(case)
            passed = compare(actual, expected, problem.meta, case)
            result.cases.append(CaseResult(index, passed, args, expected, actual, note))
        except Exception as exc:  # noqa: BLE001 - surface any error to the user
            result.cases.append(
                CaseResult(
                    index,
                    False,
                    args,
                    expected,
                    None,
                    note,
                    f"{type(exc).__name__}: {exc}",
                )
            )
    return result


def print_result(
    result: ProblemResult,
    verbose: bool = False,
    palette: Optional[Palette] = None,
) -> None:
    p = palette or Palette(supports_color())
    problem = result.problem
    icon = "✓" if result.ok else "✗"
    color = p.green if result.ok else p.red
    print(color(p.bold(f"{icon} {problem.title}  ({problem.id})")))
    difficulty = problem.meta.get("difficulty", "?")
    print(p.dim(f"  {problem.topic} · {difficulty} · {result.passed}/{result.total} passed"))

    for case in result.cases:
        if case.passed and not verbose:
            continue
        mark = p.green("✓") if case.passed else p.red("✗")
        label = f"case {case.index}"
        if case.note:
            label += f" — {case.note}"
        print(f"  {mark} {label}")
        if not case.passed:
            print(f"      args     : {case.args}")
            if case.error:
                print(f"      {p.red('error')}    : {case.error}")
            else:
                print(f"      expected : {case.expected}")
                print(f"      actual   : {case.actual}")
    print()
