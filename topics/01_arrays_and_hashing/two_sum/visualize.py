"""Animated terminal visualization for Two Sum.

The runner picks this file up automatically::

    python3 run.py two_sum --animate
    python3 run.py two_sum --animate -c '[[3, 2, 4], 6]'
    python3 run.py two_sum --animate --case 3 --speed 0.4

``frames(nums, target, palette=...)`` yields one complete frame per algorithm
step -- the array with the current index highlighted, the complement being
looked up, and the growing ``seen`` hash map. ``framework.animate.play``
repaints the frames in place. The box art is intended for small inputs.
"""
from __future__ import annotations

from typing import Dict, Iterator, List, Optional

from framework.runner import Palette

MARGIN = "  "          # left margin shared by every art row
BAR = "▲"


def frames(
    nums: List[int], target: int, *, palette: Optional[Palette] = None
) -> Iterator[str]:
    """Yield the step-by-step frames for one Two Sum call."""
    p = palette or Palette(enabled=True)

    if not nums:
        yield f"{MARGIN}{p.dim('nums is empty → no pair exists')}  →  return []\n"
        return

    width = max(len(str(value)) for value in nums) + 2   # inner box width
    seen: Dict[int, int] = {}

    for index, value in enumerate(nums):
        complement = target - value
        mate = seen.get(complement)

        # 1. Arrive at nums[index] and compute its complement.
        yield _frame(
            nums, target, width, seen, p,
            current=index, mate=None, stage="probe",
            check=f"is {complement} in seen?  …",
        )

        if mate is not None:
            # 2. The complement is already in the map: pair found.
            yield _frame(
                nums, target, width, seen, p,
                current=index, mate=mate, stage="found",
                check=f"yes → seen[{complement}] = {mate}",
                result=(
                    f"pair found: nums[{mate}] + nums[{index}] "
                    f"= {nums[mate]} + {value} = {target}"
                ),
                highlight=complement, highlight_role="green",
            )
            yield _frame(
                nums, target, width, seen, p,
                current=index, mate=mate, stage="done",
                check=f"yes → seen[{complement}] = {mate}",
                result=f"return [{mate}, {index}]",
                highlight=complement, highlight_role="green",
            )
            return

        # 3. Not seen yet: remember this value for later elements.
        seen[value] = index
        yield _frame(
            nums, target, width, seen, p,
            current=index, mate=None, stage="insert",
            check=f"no → seen[{value}] = {index}",
            highlight=value, highlight_role="cyan",
        )

    # 4. The loop ran out without ever finding a complement.
    yield _frame(
        nums, target, width, seen, p,
        current=None, mate=None, stage="empty",
        check="no complement was ever in seen",
        result="return []",
    )


# -- frame rendering -------------------------------------------------------

def _frame(nums, target, width, seen, p, *, current, mate, stage, check,
           result="", highlight=None, highlight_role="plain") -> str:
    """Render one full frame; every frame has the same number of rows."""
    indices = []
    for i in range(len(nums)):
        role = _role(i, current, mate, stage)
        tint = "dim" if role == "plain" else role
        indices.append(_tint(_cell(str(i), width), tint, p))

    bars = [
        _cell(BAR, width) if i in (current, mate) else _cell("", width)
        for i in range(len(nums))
    ]
    bars = [_tint(cell, _role(i, current, mate, stage), p)
            for i, cell in enumerate(bars)]

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
        value = nums[current]
        lines.append(
            f"{MARGIN}i = {current}  ·  value = {value}  ·  "
            f"complement = target - value = {target} - {value} = {target - value}"
        )
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
    if index == current:
        return "green" if stage == "done" else "yellow"
    if index == mate:
        return "green"
    return "plain"


def _tint(text: str, role: str, p: Palette) -> str:
    if role == "yellow":
        return p.bold(p.yellow(text))
    if role == "green":
        return p.bold(p.green(text))
    if role == "cyan":
        return p.bold(p.cyan(text))
    if role == "dim":
        return p.dim(text)
    return text


def _seen_text(seen, p, highlight, highlight_role) -> str:
    if not seen:
        return "{ }"
    parts = []
    for key, index in seen.items():
        item = f"{key} → {index}"
        if highlight is not None and key == highlight:
            item = _tint(item, highlight_role, p)
        parts.append(item)
    return "{ " + ",  ".join(parts) + " }"
