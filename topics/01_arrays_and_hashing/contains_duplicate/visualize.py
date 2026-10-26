"""Animated terminal visualization for Contains Duplicate.

The runner picks this file up automatically::

    python3 run.py contains_duplicate --animate
    python3 run.py contains_duplicate --animate -c '[[1, 2, 3, 1]]'
    python3 run.py contains_duplicate --animate --case 2 --speed 0.4

``frames(nums, palette=...)`` yields one complete frame per algorithm step --
the array with the current index highlighted and the growing ``seen`` hash
set. ``framework.animate.play`` repaints the frames in place. The box art is
intended for small inputs.
"""
from __future__ import annotations

from typing import Dict, Iterator, List, Optional

from framework.runner import Palette

MARGIN = "  "          # left margin shared by every art row
BAR = "▲"


def frames(nums: List[int], *, palette: Optional[Palette] = None) -> Iterator[str]:
    """Yield the step-by-step frames for one Contains Duplicate call."""
    p = palette or Palette(enabled=True)

    if not nums:
        yield f"{MARGIN}{p.dim('nums is empty → nothing to compare')}  →  return False\n"
        return

    width = max(len(str(value)) for value in nums) + 2   # inner box width
    seen: Dict[int, int] = {}

    for index, value in enumerate(nums):
        mate = seen.get(value)

        # 1. Arrive at nums[index] and ask whether we have seen it.
        yield _frame(
            nums, width, seen, p,
            current=index, mate=None, stage="probe",
            check=f"is {value} in seen?  …",
        )

        if mate is not None:
            # 2. Seen before: this is the duplicate.
            yield _frame(
                nums, width, seen, p,
                current=index, mate=mate, stage="found",
                check=f"yes → matched seen[{value}] (index {mate})",
                result=f"duplicate: nums[{mate}] = nums[{index}] = {value}",
            )
            yield _frame(
                nums, width, seen, p,
                current=index, mate=mate, stage="done",
                check=f"yes → matched seen[{value}] (index {mate})",
                result="return True",
            )
            return

        # 3. New value: remember it and move on.
        seen[value] = index
        yield _frame(
            nums, width, seen, p,
            current=index, mate=None, stage="insert",
            check=f"no → seen.add({value})",
            highlight=value, highlight_role="cyan",
        )

    # 4. The scan finished without a repeat.
    yield _frame(
        nums, width, seen, p,
        current=None, mate=None, stage="empty",
        check="no value was seen twice",
        result="return False",
    )


# -- frame rendering -------------------------------------------------------

def _frame(nums, width, seen, p, *, current, mate, stage, check,
           result="", highlight=None, highlight_role="plain") -> str:
    """Render one full frame; every frame has the same number of rows."""
    indices = [
        _tint(_cell(str(i), width), _role(i, current, mate, stage), p)
        for i in range(len(nums))
    ]
    bars = [
        _tint(_cell(BAR if i in (current, mate) else "", width),
              _role(i, current, mate, stage), p)
        for i in range(len(nums))
    ]

    top, middle, bottom = _box_rows(nums, width, current, mate, stage, p)
    lines = [
        (MARGIN + " " + " ".join(indices) + " ").rstrip(),
        top,
        middle,
        bottom,
        (MARGIN + " " + " ".join(bars)).rstrip(),
        "",
    ]

    if current is None:
        lines.append(f"{MARGIN}scan complete")
    else:
        lines.append(f"{MARGIN}i = {current}  ·  value = {nums[current]}")
    lines.append(f"{MARGIN}lookup : {check}")
    lines.append("")
    lines.append(f"{MARGIN}seen   {_seen_text(seen, p, highlight, highlight_role)}")

    if result:
        if stage in ("found", "done"):
            shown = p.bold(p.green(result))
        elif stage == "empty":
            shown = p.dim(result)
        else:
            shown = result
        lines.append(f"{MARGIN}{shown}")
    else:
        lines.append("")
    return "\n".join(lines) + "\n"


def _box_rows(nums, width, current, mate, stage, p):
    top = MARGIN + "┌" + "┬".join("─" * width for _ in nums) + "┐"
    bottom = MARGIN + "└" + "┴".join("─" * width for _ in nums) + "┘"
    cells = [
        _tint(_cell(str(value), width), _role(i, current, mate, stage), p)
        for i, value in enumerate(nums)
    ]
    middle = MARGIN + "│" + "│".join(cells) + "│"
    return top, middle, bottom


def _cell(content: str, width: int) -> str:
    """One value/index box, right-aligned like the numbers it sits over."""
    return " " + f"{content:>{width - 2}} "


def _role(index: int, current, mate, stage: str) -> str:
    if index == mate:
        return "red"
    if index == current:
        return "green" if stage == "done" else "yellow"
    return "plain"


def _tint(text: str, role: str, p: Palette) -> str:
    if role == "yellow":
        return p.bold(p.yellow(text))
    if role == "green":
        return p.bold(p.green(text))
    if role == "red":
        return p.bold(p.red(text))
    if role == "cyan":
        return p.bold(p.cyan(text))
    if role == "dim":
        return p.dim(text)
    return text


def _seen_text(seen, p, highlight, highlight_role) -> str:
    if not seen:
        return "{ }"
    parts = []
    for key in seen:
        item = str(key)
        if highlight is not None and key == highlight:
            item = _tint(item, highlight_role, p)
        parts.append(item)
    return "{ " + ",  ".join(parts) + " }"
