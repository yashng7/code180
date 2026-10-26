"""Pytest wrapper for Contains Duplicate."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[3]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from framework.compare import compare  # noqa: E402
from framework.loader import load_problem  # noqa: E402

PROBLEM = load_problem(Path(__file__).resolve().parent)


def _ids():
    return [
        case.get("note") or f"case{index}"
        for index, case in enumerate(PROBLEM.cases, start=1)
    ]


@pytest.mark.parametrize("case", PROBLEM.cases, ids=_ids())
def test_case(case):
    actual = PROBLEM.run_case(case)
    assert compare(actual, case["expected"], PROBLEM.meta), (
        f"args={case['args']!r} expected={case['expected']!r} got={actual!r}"
    )
