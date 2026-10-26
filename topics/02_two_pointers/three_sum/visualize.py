"""Animated terminal visualization for 3Sum.

The runner picks this file up automatically::

    python3 run.py three_sum --animate
    python3 run.py three_sum --animate -c '[[-1, 0, 1, 2, -1, -4]]'
    python3 run.py three_sum --animate --case 6 --speed 0.4

``frames(nums, palette=...)`` yields one complete frame per algorithm step: the
array being sorted, the fixed anchor ``i``, the closing ``l`` / ``r`` bracket,
the running sum, and the growing tray of zero-sum triplets.
``framework.animate.play`` repaints the frames in place. Keep ``n`` small.
"""
from __future__ import annotations

from typing import Dict, Iterator, List, Optional

from framework.runner import Palette

MARGIN = "  "          # left margin shared by every art row


def frames(nums: List[int], *, palette: Optional[Palette] = None) -> Iterator[str]:
    """Yield the step-by-step frames for one 3Sum call."""
    p = palette or Palette(enabled=True)
    values = [int(value) for value in nums]
    width = max((len(str(value)) for value in values), default=1) + 2
    for state in _states(values):
        yield _frame(state, width, p)


# -- algorithm model -------------------------------------------------------

def _states(nums: List[int]) -> List[Dict]:
    """Replay sort + two-pointer scan as a list of renderable states."""
    work = list(nums)
    n = len(work)
    states: List[Dict] = []
    result: List[tuple] = []

    def add(action: str, i=None, l=None, r=None, total=None, found=None,
            result_line: str = "", arr=None) -> None:
        states.append({
            "values": list(arr) if arr is not None else list(work),
            "i": i, "l": l, "r": r, "total": total, "found": found,
            "action": action,
            "triplets": [tuple(t) for t in result],
            "result": result_line,
        })

    add("start · nums = [" + ", ".join(str(v) for v in work) + "]")

    if n < 3:
        add("fewer than 3 numbers → no triplet is possible")
        add("scan complete", result_line="return []")
        return states

    # 1. animate the sort (insertion sort, one frame per placed key)
    anim = list(work)
    for k in range(1, n):
        key = anim[k]
        j = k - 1
        while j >= 0 and anim[j] > key:
            anim[j + 1] = anim[j]
            j -= 1
        anim[j + 1] = key
        add(f"sort · place {key} at index {j + 1}", arr=anim)
    work = anim
    add("sorted ascending → begin two pointers", arr=work)

    # 2. fix an anchor, sweep l / r inward
    for i in range(n - 2):
        if i > 0 and work[i] == work[i - 1]:
            add(f"skip duplicate anchor i = {i}  (nums[{i}] = {work[i]})", i=i)
            continue
        if work[i] > 0:
            add(f"nums[{i}] = {work[i]} > 0 → no later triplet can reach 0, break", i=i)
            break

        left, right = i + 1, n - 1
        add(f"anchor i = {i}  (nums[{i}] = {work[i]})", i=i, l=left, r=right)
        while left < right:
            total = work[i] + work[left] + work[right]
            if total < 0:
                add(f"{work[i]} + {work[left]} + {work[right]} = {total} < 0 → l += 1",
                    i=i, l=left, r=right, total=total)
                left += 1
            elif total > 0:
                add(f"{work[i]} + {work[left]} + {work[right]} = {total} > 0 → r -= 1",
                    i=i, l=left, r=right, total=total)
                right -= 1
            else:
                result.append((work[i], work[left], work[right]))
                add(f"{work[i]} + {work[left]} + {work[right]} = 0 → triplet!",
                    i=i, l=left, r=right, total=total, found=(i, left, right))
                left += 1
                right -= 1
                while left < right and work[left] == work[left - 1]:
                    add(f"skip duplicate left value {work[left]}", i=i, l=left, r=right)
                    left += 1
                while left < right and work[right] == work[right + 1]:
                    add(f"skip duplicate right value {work[right]}", i=i, l=left, r=right)
                    right -= 1

    if result:
        shown = "[" + ", ".join("[" + ", ".join(map(str, t)) + "]" for t in result) + "]"
        add("scan complete → all anchors checked", result_line="return " + shown)
    else:
        add("scan complete → no zero-sum triplet", result_line="return []")
    return states


# -- frame rendering -------------------------------------------------------

def _frame(state: Dict, width: int, p: Palette) -> str:
    """Render one full frame; every frame has the same number of rows."""
    values = state["values"]
    n = len(values)
    i, l, r = state["i"], state["l"], state["r"]
    found = state["found"]

    def role(k: int) -> str:
        if found and k in found:
            return "found"
        if i is not None and k == i:
            return "anchor"
        if l is not None and k == l:
            return "left"
        if r is not None and k == r:
            return "right"
        return "plain"

    if n == 0:
        idx_line = MARGIN + " " + _tint(_cell("", width), "plain", p)
        top = MARGIN + "┌" + "─" * width + "┐"
        middle = MARGIN + "│" + _tint(_cell("∅", width), "plain", p) + "│"
        bottom = MARGIN + "└" + "─" * width + "┘"
        i_row = l_row = r_row = idx_line
    else:
        idx_line = (MARGIN + " " + " ".join(
            _tint(_cell(str(k), width), role(k), p) for k in range(n)) + " ").rstrip()
        top = MARGIN + "┌" + "┬".join("─" * width for _ in range(n)) + "┐"
        middle = MARGIN + "│" + "│".join(
            _tint(_cell(str(values[k]), width), role(k), p) for k in range(n)) + "│"
        bottom = MARGIN + "└" + "┴".join("─" * width for _ in range(n)) + "┘"
        i_row = (MARGIN + " " + " ".join(
            _tint(_cell("i" if k == i else "", width), "anchor" if k == i else "plain", p)
            for k in range(n))).rstrip()
        l_row = (MARGIN + " " + " ".join(
            _tint(_cell("l" if k == l else "", width), "left" if k == l else "plain", p)
            for k in range(n))).rstrip()
        r_row = (MARGIN + " " + " ".join(
            _tint(_cell("r" if k == r else "", width), "right" if k == r else "plain", p)
            for k in range(n))).rstrip()

    pointer_line = MARGIN + p.dim("pointer : ") + _pointer_text(state, p)
    sum_line = MARGIN + p.dim("sum     : ") + _sum_text(state, values, p)
    action_line = MARGIN + p.dim("action  : ") + state["action"]
    triplet_line = MARGIN + p.dim("triplets: ") + _triplet_text(state, p)

    result = state["result"]
    if result:
        shown = p.bold(p.green(result)) if state["triplets"] else p.dim(result)
        result_line = MARGIN + shown
    else:
        result_line = ""

    lines = [
        idx_line, top, middle, bottom,
        i_row, l_row, r_row,
        "",
        pointer_line, sum_line, action_line,
        "",
        triplet_line, result_line,
    ]
    return "\n".join(lines) + "\n"


def _pointer_text(state: Dict, p: Palette) -> str:
    parts = []
    if state["i"] is not None:
        parts.append("i = " + p.bold(p.yellow(str(state["i"]))))
    if state["l"] is not None:
        parts.append("l = " + p.bold(p.cyan(str(state["l"]))))
    if state["r"] is not None:
        parts.append("r = " + p.bold(p.green(str(state["r"]))))
    return "   ".join(parts) if parts else p.dim("—")


def _sum_text(state: Dict, values: List[int], p: Palette) -> str:
    if state["total"] is None or state["i"] is None or state["l"] is None or state["r"] is None:
        return p.dim("—")
    a, b, c = values[state["i"]], values[state["l"]], values[state["r"]]
    total = state["total"]
    if total == 0:
        sign = p.green("= 0")
    elif total < 0:
        sign = p.cyan(f"= {total}")
    else:
        sign = p.yellow(f"= {total}")
    return f"{p.yellow(str(a))} + {p.cyan(str(b))} + {p.green(str(c))}  {sign}"


def _triplet_text(state: Dict, p: Palette) -> str:
    trips = state["triplets"]
    if not trips:
        return p.dim("(none yet)")
    out = []
    for k, triple in enumerate(trips):
        text = "(" + ", ".join(str(x) for x in triple) + ")"
        if state["found"] and k == len(trips) - 1:
            out.append(p.bold(p.green(text)))
        else:
            out.append(p.green(text))
    return ", ".join(out)


def _cell(content: str, width: int) -> str:
    """One value/index box, right-aligned like the numbers it sits over."""
    return " " + f"{content:>{width - 2}} "


def _tint(text: str, role: str, p: Palette) -> str:
    if role == "anchor":
        return p.bold(p.yellow(text))
    if role == "left":
        return p.bold(p.cyan(text))
    if role in ("right", "found"):
        return p.bold(p.green(text))
    if role == "dim":
        return p.dim(text)
    return text
