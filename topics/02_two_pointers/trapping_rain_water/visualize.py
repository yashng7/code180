"""Animated terminal visualization for Trapping Rain Water.

The runner picks this file up automatically::

    python3 run.py trapping_rain_water --animate
    python3 run.py trapping_rain_water --animate --case 2 --speed 0.4
    python3 run.py trapping_rain_water --animate -c '[[0,1,0,2,1,0,1,3,2,1,2,1]]'

``frames(height, palette=...)`` yields one complete frame per algorithm step:
the elevation profile as block art under a fixed number of sky rows, the two
pointers closing in from the ends, the running ``left_max`` / ``right_max``
water levels, and the trapped water growing column by column. The box art is
meant for small inputs (<= ~14 bars, modest heights).
"""
from __future__ import annotations

from typing import Dict, Iterator, List, Optional

from framework.runner import Palette

MARGIN = "  "          # left margin shared by every art row
BAR = "█"
WATER = "▒"
SKY_ROWS = 6


def frames(height: List[int], *, palette: Optional[Palette] = None) -> Iterator[str]:
    """Yield the step-by-step frames for one Trapping Rain Water call."""
    p = palette or Palette(enabled=True)
    bars = [int(value) for value in (height or [])]

    if not bars:
        yield (
            f"{MARGIN}{p.dim('height is empty → no basin')}\n"
            f"{MARGIN}{p.bold(p.green('return 0'))}\n"
        )
        return

    states = _states(bars)
    width = max(len(str(max(bars))), 1) + 2      # inner box width
    top = max(max(bars), 1)
    rows = min(top, SKY_ROWS)

    for state in states:
        yield _frame(bars, width, rows, top, state, p)


# -- algorithm model -------------------------------------------------------

def _states(bars: List[int]) -> List[Dict]:
    """Replay the two-pointer scan as a list of renderable states."""
    n = len(bars)
    left, right = 0, n - 1
    left_max = right_max = 0
    water = 0
    filled = [0] * n
    states: List[Dict] = []

    def add(bar, new_max: bool, added: int, message: str) -> None:
        states.append({
            "lo": left, "hi": right,
            "left_max": left_max, "right_max": right_max,
            "water": water, "filled": list(filled),
            "bar": bar, "new_max": new_max, "added": added,
            "message": message, "result": "",
        })

    add(None, False, 0, f"start with lo = 0, hi = {n - 1}, water = 0")

    while left < right:
        if bars[left] < bars[right]:
            bar = left
            if bars[left] >= left_max:
                left_max = bars[left]
                add(bar, True, 0,
                    f"height[{bar}] = {bars[bar]} is a new left wall → left_max = {left_max}")
            else:
                added = left_max - bars[left]
                water += added
                filled[bar] = added
                add(bar, False, added,
                    f"trap {added} above height[{bar}] = {bars[bar]} → water = {water}")
            left += 1
        else:
            bar = right
            if bars[right] >= right_max:
                right_max = bars[right]
                add(bar, True, 0,
                    f"height[{bar}] = {bars[bar]} is a new right wall → right_max = {right_max}")
            else:
                added = right_max - bars[right]
                water += added
                filled[bar] = added
                add(bar, False, added,
                    f"trap {added} above height[{bar}] = {bars[bar]} → water = {water}")
            right -= 1

    states.append({
        "lo": left, "hi": right,
        "left_max": left_max, "right_max": right_max,
        "water": water, "filled": list(filled),
        "bar": None, "new_max": False, "added": 0,
        "message": "pointers meet → every column settled",
        "result": f"return {water}",
    })
    return states


# -- frame rendering -------------------------------------------------------

def _frame(bars: List[int], width: int, rows: int, top: int,
           state: Dict, p: Palette) -> str:
    """Render one full frame; every frame has the same number of rows."""
    n = len(bars)
    bar_h = [_display_height(v, rows, top) for v in bars]
    level_h = [_display_height(v + state["filled"][i], rows, top)
               for i, v in enumerate(bars)]

    sky = []
    for r in range(rows - 1, -1, -1):
        cells = []
        for i in range(n):
            role = _role(i, state)
            if r < bar_h[i]:
                cells.append(_tint(BAR.center(width), role, p))
            elif r < level_h[i]:
                cells.append(_tint(WATER.center(width), "water", p))
            else:
                cells.append(" " * width)
        sky.append((MARGIN + " " + " ".join(cells)).rstrip())

    top_row = MARGIN + "┌" + "┬".join("─" * width for _ in range(n)) + "┐"
    value_row = MARGIN + "│" + "│".join(
        _tint(_cell(str(v), width), _role(i, state), p) for i, v in enumerate(bars)
    ) + "│"
    bottom_row = MARGIN + "└" + "┴".join("─" * width for _ in range(n)) + "┘"

    lines = [
        MARGIN + "height = [" + ", ".join(str(v) for v in bars) + "]",
        _status(state, p),
        "",
        *sky,
        top_row,
        value_row,
        bottom_row,
        _marker_row(n, width, state, p),
        "",
        MARGIN + p.dim("action : ") + state["message"],
        "",
        _result(state, p),
    ]
    return "\n".join(lines) + "\n"


def _display_height(value: int, rows: int, top: int) -> int:
    """Scale a height into the fixed number of sky rows (identity when small)."""
    return int(round(value * rows / top))


def _status(state: Dict, p: Palette) -> str:
    lo = p.bold(p.yellow(str(state["lo"])))
    hi = p.bold(p.yellow(str(state["hi"])))
    lm = p.bold(p.green(str(state["left_max"])))
    rm = p.bold(p.green(str(state["right_max"])))
    total = p.bold(p.cyan(str(state["water"])))
    return (
        f"{MARGIN}lo = {lo}   hi = {hi}"
        f"      left_max = {lm}   right_max = {rm}"
        f"      water = {total}"
    )


def _marker_row(n: int, width: int, state: Dict, p: Palette) -> str:
    lo, hi = state["lo"], state["hi"]
    cells = [
        _tint("↑".center(width), "pointer", p) if i in (lo, hi) else " " * width
        for i in range(n)
    ]
    return (MARGIN + " " + " ".join(cells)).rstrip()


def _result(state: Dict, p: Palette) -> str:
    if state["result"]:
        return MARGIN + p.bold(p.green(state["result"]))
    return ""


def _cell(content: str, width: int) -> str:
    """One value/index box, right-aligned like the numbers it sits under."""
    return " " + f"{content:>{width - 2}} "


def _role(index: int, state: Dict) -> str:
    if index == state["bar"]:
        return "wall" if state["new_max"] else "fill"
    if index == state["lo"] or index == state["hi"]:
        return "pointer"
    return "plain"


def _tint(text: str, role: str, p: Palette) -> str:
    if role == "wall":
        return p.bold(p.green(text))
    if role == "fill":
        return p.bold(p.cyan(text))
    if role == "pointer":
        return p.bold(p.yellow(text))
    if role == "water":
        return p.cyan(text)
    return text
