"""Animated terminal visualization for Product of Array Except Self.

The runner picks this file up automatically::

    python3 run.py product_of_array_except_self --animate
    python3 run.py product_of_array_except_self --animate -c '[[1, 2, 3, 4]]'
    python3 run.py product_of_array_except_self --animate --case 2 --speed 0.4

``frames(nums, palette=...)`` yields one complete frame per algorithm step: a
two-row table with the input ``nums`` on top and the output ``res`` below. The
first pass sweeps left → right carrying the running ``prefix`` product and
writes ``res[i]`` *before* folding ``nums[i]`` in; the second pass sweeps
right → left multiplying in the running ``suffix`` product, and the final array
is revealed. The box art is intended for small inputs.
"""
from __future__ import annotations

from typing import Iterator, List, Optional

from framework.runner import Palette

MARGIN = "  "          # left margin shared by every art row
LABEL_W = 5            # width of the "nums "/"res  " row labels
BAR = "▲"


def frames(nums: List[int], *, palette: Optional[Palette] = None) -> Iterator[str]:
    """Yield the step-by-step frames for one Product Except Self call."""
    p = palette or Palette(enabled=True)
    n = len(nums)

    if n == 0:
        yield f"{MARGIN}{p.bold('Product of Array Except Self')}\n"
        yield f"{MARGIN}{p.dim('nums = []  →  return []')}\n"
        return

    final = _solve(nums)
    width = max(
        max(len(str(value)) for value in nums),
        max(len(str(value)) for value in final),
        3,
    ) + 2                                            # inner box width

    res: List[Optional[int]] = [None] * n
    res_final = [False] * n

    # 1. Show the input row.
    yield _render(
        nums, res, res_final, width, p, current=None,
        title="input · nums",
        message=f"nums = [{', '.join(str(v) for v in nums)}]",
        note="plan: left products (prefix), then right products (suffix)",
    )

    # 2. Prefix pass, left → right: res[i] = product of everything left of i.
    prefix = 1
    for i in range(n):
        res[i] = prefix
        yield _render(
            nums, res, res_final, width, p, current=i,
            title="pass 1 · prefix (left → right)",
            message=f"res[{i}] ← prefix = {prefix}   (product of nums[0..{i - 1}])",
            note=f"then prefix = {prefix} × nums[{i}] = {prefix * nums[i]}",
        )
        prefix *= nums[i]

    # 3. Suffix pass, right → left: multiply in everything right of i.
    suffix = 1
    for i in range(n - 1, -1, -1):
        before = res[i]
        res[i] *= suffix
        res_final[i] = True
        yield _render(
            nums, res, res_final, width, p, current=i,
            title="pass 2 · suffix (right ← left)",
            message=f"res[{i}] = {before} × suffix({suffix}) = {res[i]}",
            note=f"then suffix = {suffix} × nums[{i}] = {suffix * nums[i]}",
        )
        suffix *= nums[i]

    # 4. Reveal the finished array.
    yield _render(
        nums, res, res_final, width, p, current=None,
        title="done · every product except self",
        message=f"return [{', '.join(str(v) for v in final)}]",
        note=p.dim("O(n) time · O(1) extra space · no division"),
    )


# -- algorithm model -------------------------------------------------------

def _solve(nums: List[int]) -> List[int]:
    """Reference run of the prefix/suffix algorithm (no division)."""
    n = len(nums)
    result = [1] * n
    prefix = 1
    for i in range(n):
        result[i] = prefix
        prefix *= nums[i]
    suffix = 1
    for i in range(n - 1, -1, -1):
        result[i] *= suffix
        suffix *= nums[i]
    return result


# -- frame rendering -------------------------------------------------------

def _render(nums, res, res_final, width, p, *, current, title, message, note="") -> str:
    """Render one full frame; every frame has the same number of rows."""
    n = len(nums)

    index_row = " ".join(
        _tint(_center(str(i), width), "yellow" if i == current else "dim", p)
        for i in range(n)
    )
    nums_row = "│" + "│".join(
        _tint(_cell(str(value), width), "yellow" if i == current else "plain", p)
        for i, value in enumerate(nums)
    ) + "│"
    res_row = "│" + "│".join(
        _res_cell(res[i], res_final[i], width, p, i == current)
        for i in range(n)
    ) + "│"
    bar_row = " ".join(
        _tint(_center(BAR if i == current else "", width), "yellow", p)
        for i in range(n)
    )
    top = "┌" + "┬".join("─" * width for _ in range(n)) + "┐"
    bottom = "└" + "┴".join("─" * width for _ in range(n)) + "┘"
    lab = " " * LABEL_W

    lines = [
        MARGIN + p.bold(title),
        MARGIN + lab + " " + index_row,
        MARGIN + "nums " + top,
        MARGIN + "nums " + nums_row,
        MARGIN + "     " + bottom,
        MARGIN + "res  " + top,
        MARGIN + "res  " + res_row,
        MARGIN + "     " + bottom,
        MARGIN + lab + " " + bar_row,
        "",
        MARGIN + (f"i = {current}" if current is not None else "pass complete"),
        MARGIN + message,
        MARGIN + note,
    ]
    return "\n".join(lines) + "\n"


def _cell(content: str, width: int) -> str:
    """One value box, right-aligned like the numbers it sits over."""
    return " " + f"{content:>{width - 2}} "


def _center(content: str, width: int) -> str:
    """One index/pointer box, centered under the value it labels."""
    return " " + f"{content:^{width - 2}} "


def _res_cell(value, is_final: bool, width: int, p: Palette, is_current: bool) -> str:
    if value is None:
        return _tint(_center("·", width), "dim", p)
    if is_current:
        role = "yellow"
    elif is_final:
        role = "green"
    else:
        role = "cyan"
    return _tint(_cell(str(value), width), role, p)


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
