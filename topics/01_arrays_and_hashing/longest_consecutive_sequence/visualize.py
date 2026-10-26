"""Animated terminal visualization for Longest Consecutive Sequence.

The runner picks this file up automatically::

    python3 run.py longest_consecutive_sequence --animate
    python3 run.py longest_consecutive_sequence --animate -c '[[100, 4, 200, 1, 3, 2]]'
    python3 run.py longest_consecutive_sequence --animate --case 2 --speed 0.4

``frames(nums, palette=...)`` yields one complete frame per algorithm step --
the input chips, the deduplicated ``num_set`` strip, the run-start test
``value - 1 in set?`` and the growing run counter. ``framework.animate.play``
repaints the frames in place. The box art is intended for small inputs
(``n <= 12``).
"""
from __future__ import annotations

from typing import Iterator, List, Optional, Sequence, Set

from framework.runner import Palette

MARGIN = "  "          # left margin shared by every art row
BAR = "▲"


def frames(nums: List[int], *, palette: Optional[Palette] = None) -> Iterator[str]:
    """Yield the step-by-step frames for one Longest Consecutive call."""
    p = palette or Palette(enabled=True)

    if not nums:
        yield f"{MARGIN}{p.dim('nums is empty → nothing to scan')}  →  return 0\n"
        return

    num_set = set(nums)
    ordered = sorted(num_set)
    width = max(len(str(value)) for value in nums) + 2   # inner box width
    best = 0

    for value in ordered:
        probe = value - 1
        is_start = probe not in num_set

        # 1. Probe: ask the O(1) "is this a run start?" question.
        yield _frame(
            nums, ordered, width, best, p,
            candidate=value, active=set(), stage="probe",
            question=f"value = {value}   ·   start?  is {probe} in set?  …",
            walk="", result="",
        )

        if not is_start:
            # 2. Somebody before it exists: not a start, skip it.
            yield _frame(
                nums, ordered, width, best, p,
                candidate=value, active=set(), stage="skip",
                question=f"value = {value}   ·   start?  is {probe} in set?  yes → skip",
                walk=f"{probe} is in set → {value} is not a run start",
                result="",
            )
            continue

        # 3. True start: walk upward while value + length is present.
        active: Set[int] = {value}
        yield _frame(
            nums, ordered, width, best, p,
            candidate=value, active=set(active), stage="start",
            question=f"value = {value}   ·   start?  is {probe} in set?  no → run start!",
            walk=f"walk   :  {value}   (length 1)",
            result="",
        )

        length = 1
        while value + length in num_set:
            active.add(value + length)
            length += 1
            yield _frame(
                nums, ordered, width, best, p,
                candidate=value, active=set(active), stage="walk",
                question=f"value = {value}   ·   start?  is {probe} in set?  no → run start!",
                walk=f"walk   :  " + " → ".join(str(v) for v in sorted(active))
                     + f"   (length {length})",
                result="",
            )

        # 4. Keep the running best.
        best = max(best, length)
        yield _frame(
            nums, ordered, width, best, p,
            candidate=value, active=set(active), stage="done",
            question=f"value = {value}   ·   start?  is {probe} in set?  no → run start!",
            walk=f"walk   :  " + " → ".join(str(v) for v in sorted(active))
                 + f"   (length {length})",
            result=f"run of {length}  →  best = {best}",
        )

    # 5. Reveal the answer.
    yield _frame(
        nums, ordered, width, best, p,
        candidate=None, active=set(), stage="final",
        question="scan complete",
        walk="", result=f"return {best}",
    )


# -- frame rendering -------------------------------------------------------

def _frame(nums, ordered, width, best, p, *, candidate, active, stage,
           question, walk, result) -> str:
    """Render one full frame; every frame has the same number of rows."""
    indices = [
        _tint(_cell(str(i), width), _role(value, candidate, active), p)
        for i, value in enumerate(nums)
    ]
    top = MARGIN + "┌" + "┬".join("─" * width for _ in nums) + "┐"
    bottom = MARGIN + "└" + "┴".join("─" * width for _ in nums) + "┘"
    middle = MARGIN + "│" + "│".join(
        _tint(_cell(str(value), width), _role(value, candidate, active), p)
        for value in nums
    ) + "│"
    bars = [
        _tint(_cell(BAR if value == candidate else "", width),
              _role(value, candidate, active), p)
        for value in nums
    ]

    lines = [
        (MARGIN + " " + " ".join(indices) + " ").rstrip(),
        top,
        middle,
        bottom,
        (MARGIN + " " + " ".join(bars)).rstrip(),
        "",
        f"{MARGIN}{question}",
        f"{MARGIN}{walk}" if walk else "",
        f"{MARGIN}best   :  {best}",
        "",
        f"{MARGIN}set    {_set_text(ordered, candidate, active, p)}",
        "",
        _result_line(result, stage, p),
    ]
    return "\n".join(lines) + "\n"


def _cell(content: str, width: int) -> str:
    """One value/index box, right-aligned like the numbers it sits over."""
    return " " + f"{content:>{width - 2}} "


def _role(value: int, candidate, active: Set[int]) -> str:
    if candidate is not None and value == candidate:
        return "yellow"
    if value in active:
        return "cyan"
    return "plain"


def _tint(text: str, role: str, p: Palette) -> str:
    if role == "yellow":
        return p.bold(p.yellow(text))
    if role == "cyan":
        return p.bold(p.cyan(text))
    if role == "dim":
        return p.dim(text)
    return text


def _set_text(ordered: Sequence[int], candidate, active: Set[int], p: Palette) -> str:
    if not ordered:
        return "{ }"
    parts = []
    for value in ordered:
        if candidate is not None and value == candidate:
            parts.append(p.bold(p.yellow(str(value))))
        elif value in active:
            parts.append(p.bold(p.cyan(str(value))))
        else:
            parts.append(str(value))
    return "{ " + ",  ".join(parts) + " }"


def _result_line(result: str, stage: str, p: Palette) -> str:
    if not result:
        return ""
    if stage == "final":
        return p.bold(p.green("→ " + result))
    if stage == "done":
        return p.bold(p.cyan("→ " + result))
    return result
