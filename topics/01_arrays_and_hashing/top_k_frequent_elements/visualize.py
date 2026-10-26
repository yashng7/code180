"""Animated terminal visualization for Top K Frequent Elements.

The runner picks this file up automatically::

    python3 run.py top_k_frequent_elements --animate
    python3 run.py top_k_frequent_elements --animate -c '[[4,4,4,5,5,6], 2]'
    python3 run.py top_k_frequent_elements --animate --case 2 --speed 0.4

``frames(nums, k, palette=...)`` yields one complete frame per algorithm step:
the array boxes, a growing count strip (one bar per distinct value), the
frequency buckets built from high to low, and the k values collected to form
the answer. ``framework.animate.play`` repaints the frames in place. The box
art is intended for small inputs (``n`` up to a dozen).
"""
from __future__ import annotations

from typing import Dict, Iterator, List, Optional, Set

from framework.runner import Palette

MARGIN = "  "          # left margin shared by every art row
BLOCK = "█"            # one unit of a growing frequency bar


def frames(nums: List[int], k: int, *, palette: Optional[Palette] = None) -> Iterator[str]:
    """Yield the step-by-step frames for one Top K Frequent Elements call."""
    p = palette or Palette(enabled=True)
    nums = list(nums)

    # --- trivial inputs: nothing to rank ------------------------------
    if not nums or k <= 0:
        yield _empty_frame(nums, k, p)
        return

    # --- algorithm model: counts, buckets, the chosen top-k -----------
    distinct: List[int] = []
    final: Dict[int, int] = {}
    for value in nums:
        if value not in final:
            final[value] = 0
            distinct.append(value)
        final[value] += 1

    maxfreq = max(final.values())
    buckets: Dict[int, List[int]] = {freq: [] for freq in range(1, maxfreq + 1)}
    for value in distinct:
        buckets[final[value]].append(value)

    vw = max(len(str(value)) for value in nums)
    fw = len(str(maxfreq))
    cell_w = max(len(str(value)) for value in nums) + 2

    counts_seen: Dict[int, int] = {}

    # 1. Intro: the array sits there, no frequencies yet.
    yield _render(
        nums=nums, k=k, distinct=distinct, counts_seen=counts_seen,
        cell_w=cell_w, vw=vw, cw=fw, fw=fw, maxfreq=maxfreq,
        buckets=buckets, shown=set(), active_freq=None,
        current=None, active_value=None, collected=set(),
        status="count frequencies, then bucket by frequency", result="", p=p,
    )

    # 2. Tally: walk the array, growing the count of the current value.
    for index, value in enumerate(nums):
        counts_seen[value] = counts_seen.get(value, 0) + 1
        yield _render(
            nums=nums, k=k, distinct=distinct, counts_seen=counts_seen,
            cell_w=cell_w, vw=vw, cw=fw, fw=fw, maxfreq=maxfreq,
            buckets=buckets, shown=set(), active_freq=None,
            current=index, active_value=value, collected=set(),
            status=f"nums[{index}] = {value}   →   count[{value}] = {counts_seen[value]}",
            result="", p=p,
        )

    # 3. Buckets: fill frequency buckets from the highest count downwards.
    shown: Set[int] = set()
    for freq in range(maxfreq, 0, -1):
        if not buckets[freq]:
            continue
        shown.add(freq)
        members = ", ".join(str(value) for value in buckets[freq])
        yield _render(
            nums=nums, k=k, distinct=distinct, counts_seen=counts_seen,
            cell_w=cell_w, vw=vw, cw=fw, fw=fw, maxfreq=maxfreq,
            buckets=buckets, shown=set(shown), active_freq=freq,
            current=None, active_value=None, collected=set(),
            status=f"bucket[{freq}] ← values seen {freq}×  :  [{members}]",
            result="", p=p,
        )

    # 4. Collect: sweep buckets high → low until we hold k values.
    collected: Set[int] = set()
    result: List[int] = []
    for freq in range(maxfreq, 0, -1):
        for value in buckets[freq]:
            if len(result) >= k:
                break
            result.append(value)
            collected.add(value)
            yield _render(
                nums=nums, k=k, distinct=distinct, counts_seen=counts_seen,
                cell_w=cell_w, vw=vw, cw=fw, fw=fw, maxfreq=maxfreq,
                buckets=buckets, shown=set(shown), active_freq=freq,
                current=None, active_value=None, collected=set(collected),
                status=f"take {value}  ({freq}×)   →   {len(result)} of {k}",
                result="", p=p,
            )
        if len(result) >= k:
            break

    # 5. Reveal: the k most frequent values are locked in.
    yield _render(
        nums=nums, k=k, distinct=distinct, counts_seen=counts_seen,
        cell_w=cell_w, vw=vw, cw=fw, fw=fw, maxfreq=maxfreq,
        buckets=buckets, shown=set(shown), active_freq=None,
        current=None, active_value=None, collected=set(collected),
        status="the k most frequent values are chosen",
        result=f"return {result}", p=p,
    )


# -- frame rendering -------------------------------------------------------

def _render(*, nums, k, distinct, counts_seen, cell_w, vw, cw, fw, maxfreq,
            buckets, shown, active_freq, current, active_value, collected,
            status, result, p) -> str:
    """Render one full frame; every frame has the same number of rows."""
    lines: List[str] = []

    header = "[" + ", ".join(str(value) for value in nums) + "]"
    lines.append(
        f"{MARGIN}{p.dim('nums')} {p.dim('=')} {header}   "
        f"{p.dim('k')} {p.dim('=')} {p.bold(str(k))}"
    )
    lines.append("")

    # index row, aligned over the value boxes
    index_cells = [
        _tint(_cell(str(i), cell_w), "yellow" if i == current else "dim", p)
        for i in range(len(nums))
    ]
    lines.append((MARGIN + " " + " ".join(index_cells) + " ").rstrip())

    # value boxes
    top = MARGIN + "┌" + "┬".join("─" * cell_w for _ in nums) + "┐"
    bottom = MARGIN + "└" + "┴".join("─" * cell_w for _ in nums) + "┘"
    cells = [
        _tint(_cell(str(value), cell_w), "yellow" if i == current else "plain", p)
        for i, value in enumerate(nums)
    ]
    lines.append(top)
    lines.append(MARGIN + "│" + "│".join(cells) + "│")
    lines.append(bottom)
    lines.append("")

    # count strip: one row per distinct value, bar length == frequency
    lines.append(f"{MARGIN}{p.dim('counts')}")
    for value in distinct:
        count = counts_seen.get(value, 0)
        label = _pad(str(value), vw)
        number = _pad(str(count), cw)
        bar = BLOCK * count
        if active_value is not None and value == active_value:
            vtext = p.bold(p.yellow(label))
            ntext = p.bold(p.yellow(number))
            btext = p.bold(p.yellow(bar)) if bar else p.dim("·")
        elif count > 0:
            vtext = p.bold(p.cyan(label))
            ntext = number
            btext = p.cyan(bar)
        else:
            vtext = p.dim(label)
            ntext = p.dim(number)
            btext = p.dim("·")
        lines.append(f"{MARGIN}  {vtext} ─▶ {ntext}  {btext}")
    lines.append("")

    # frequency buckets, highest count first (a fixed set of rows)
    lines.append(f"{MARGIN}{p.dim('buckets (freq → values)')}")
    for freq in range(maxfreq, 0, -1):
        flabel = _pad(str(freq), fw)
        members = buckets.get(freq, [])
        if freq in shown and members:
            parts = []
            for value in members:
                text = str(value)
                if value in collected:
                    parts.append(p.bold(p.green(text)))
                elif active_freq == freq:
                    parts.append(p.bold(p.cyan(text)))
                else:
                    parts.append(text)
            body = "[ " + ", ".join(parts) + " ]"
            flabel = p.bold(p.cyan(flabel)) if active_freq == freq else p.bold(flabel)
        else:
            body = p.dim("·")
        lines.append(f"{MARGIN}  {p.dim('freq')} {flabel} │ {body}")
    lines.append("")

    lines.append(f"{MARGIN}{status}")
    # The result slot always exists (a lone space when there is no result yet)
    # so every frame -- answer frame included -- has the same number of rows.
    lines.append(f"{MARGIN}{p.bold(p.green(result))}" if result else MARGIN + " ")
    return "\n".join(lines) + "\n"


def _empty_frame(nums, k, p: Palette) -> str:
    message = (
        "nums is empty  →  no frequencies to rank"
        if not nums
        else f"k = {k}  →  nothing to return"
    )
    lines = [
        f"{MARGIN}{p.dim(message)}",
        "",
        f"{MARGIN}{p.bold(p.green('return []'))}",
    ]
    return "\n".join(lines) + "\n"


def _cell(content: str, width: int) -> str:
    """One value/index box, right-aligned like the numbers it sits over."""
    return " " + f"{content:>{width - 2}} "


def _pad(text: str, width: int) -> str:
    return text + " " * max(0, width - len(text))


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
