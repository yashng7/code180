"""Animated terminal visualization for Valid Anagram.

The runner picks this file up automatically::

    python3 run.py valid_anagram --animate
    python3 run.py valid_anagram --animate -c '["rat", "car"]'
    python3 run.py valid_anagram --animate --case 3 --speed 0.4

``frames(s, t, palette=...)`` yields one complete frame per algorithm step:
both strings as rows of letter chips, the length check, the shared 26-slot
(a-z) count strip that is built from ``s`` and then cancelled down by ``t``,
and the final verdict. ``framework.animate.play`` repaints the frames in
place. The box art is intended for short words (about ten characters each).
"""
from __future__ import annotations

from collections import Counter
from typing import Dict, Iterator, Optional

from framework.runner import Palette

MARGIN = "  "                       # left margin shared by every art row
BAR = "▲"
ALPHA = "abcdefghijklmnopqrstuvwxyz"
PER_ROW = 13                        # 26 slots -> two rows of thirteen


def frames(s: str, t: str, *, palette: Optional[Palette] = None) -> Iterator[str]:
    """Yield the step-by-step frames for one Valid Anagram call."""
    p = palette or Palette(enabled=True)
    counts: Dict[str, int] = {ch: 0 for ch in ALPHA}

    def render(*, active_s=None, s_role="plain", active_t=None, t_role="plain",
               active_letter=None, negative=None, stage="", detail="",
               result=None, result_kind=None) -> str:
        return _frame(
            s, t, counts, p,
            active_s=active_s, s_role=s_role,
            active_t=active_t, t_role=t_role,
            active_letter=active_letter, negative=negative,
            stage=stage, detail=detail,
            result=result, result_kind=result_kind,
        )

    # 0. Introduce both strings.
    yield render(
        stage="start",
        detail="t is an anagram of s iff their letter counts match",
    )

    # 1. Lengths must agree before we compare letters.
    if len(s) != len(t):
        yield render(
            stage=f"length check: len(s) = {len(s)}   len(t) = {len(t)}",
            detail="lengths differ → cannot be anagrams",
        )
        yield render(
            negative=None,
            stage=f"length check: len(s) = {len(s)}   len(t) = {len(t)}",
            detail="lengths differ → cannot be anagrams",
            result="return False", result_kind="false",
        )
        return

    yield render(
        stage=f"length check: len(s) = len(t) = {len(s)}",
        detail="lengths agree → compare letter counts",
    )

    # 2. Count the letters of s into the shared strip (count up).
    for index, ch in enumerate(s):
        key = ch if ch in counts else None
        if key is not None:
            counts[key] += 1
        yield render(
            active_s=index, s_role="yellow", active_letter=key,
            stage=f"count s[{index}] = {ch!r}",
            detail=(f"count[{ch!r}] = {counts[key]}" if key
                    else f"count[{ch!r}] (outside a-z)"),
        )

    # 3. Walk t, cancelling one slot per letter (count down). First slot to
    #    dip below zero means t has an extra letter → not an anagram.
    negative: Optional[str] = None
    for index, ch in enumerate(t):
        key = ch if ch in counts else None
        if key is not None:
            counts[key] -= 1
            if counts[key] < 0 and negative is None:
                negative = ch
        yield render(
            active_t=index, t_role="yellow", active_letter=key,
            negative=negative,
            stage=f"walk t[{index}] = {ch!r}",
            detail=(f"count[{ch!r}] -= 1  →  {counts[key]}" if key
                    else f"count[{ch!r}] (outside a-z)"),
        )
        if negative is not None:
            yield render(
                active_t=index, t_role="yellow", active_letter=key,
                negative=negative,
                stage=f"count[{negative!r}] < 0  →  t has an extra {negative!r}",
                detail="a slot went negative → not an anagram",
                result="return False", result_kind="false",
            )
            return

    # 4. Every slot is back to zero.
    ok = Counter(s) == Counter(t)
    yield render(
        stage="all counts returned to zero" if ok else "counts did not cancel out",
        detail="every letter of t cancelled a letter of s" if ok
        else "some letters do not line up",
        result="return True" if ok else "return False",
        result_kind="true" if ok else "false",
    )


# -- frame rendering -------------------------------------------------------

def _frame(s, t, counts, p, *, active_s, s_role, active_t, t_role,
           active_letter, negative, stage, detail, result, result_kind) -> str:
    """Render one full frame; every frame has exactly the same row count."""
    lines = []
    lines += _box_block(s, active_s, s_role, p)
    lines += _box_block(t, active_t, t_role, p)
    lines.append("")
    lines += _count_rows(counts, active_letter, negative, p)
    lines.append("")
    lines.append(f"{MARGIN}{stage}")
    lines.append(f"{MARGIN}{detail}")
    if result:
        if result_kind == "true":
            lines.append(MARGIN + p.bold(p.green(result)))
        elif result_kind == "false":
            lines.append(MARGIN + p.bold(p.red(result)))
        else:
            lines.append(f"{MARGIN}{result}")
    else:
        lines.append("")
    return "\n".join(lines) + "\n"


def _box_block(text, current, role, p):
    """Five rows for one string: index row, box (top/mid/bottom), bar row."""
    chars = list(text)
    if not chars:
        return [
            MARGIN + p.dim("∅ empty"),
            MARGIN + "┌┐",
            MARGIN + "││",
            MARGIN + "└┘",
            MARGIN + p.dim("∅"),
        ]
    n = len(chars)
    width = max(3, len(str(n - 1)) + 2)          # wide enough for 2-digit index
    indices = [
        _tint(_cell(str(i), width), role if i == current else "dim", p)
        for i in range(n)
    ]
    top = MARGIN + "┌" + "┬".join("─" * width for _ in chars) + "┐"
    bottom = MARGIN + "└" + "┴".join("─" * width for _ in chars) + "┘"
    cells = [
        _tint(_cell(ch, width), role if i == current else "plain", p)
        for i, ch in enumerate(chars)
    ]
    middle = MARGIN + "│" + "│".join(cells) + "│"
    bars = [
        _tint(_cell(BAR if i == current else "", width),
              role if i == current else "plain", p)
        for i in range(n)
    ]
    return [
        (MARGIN + " " + " ".join(indices) + " ").rstrip(),
        top,
        middle,
        bottom,
        (MARGIN + " " + " ".join(bars)).rstrip(),
    ]


def _count_rows(counts, active, negative, p):
    """The shared 26-slot a-z strip: 4 rows (letters/counts x 2)."""
    rows = []
    for start in range(0, len(ALPHA), PER_ROW):
        letters = ALPHA[start:start + PER_ROW]
        heads = []
        values = []
        for ch in letters:
            role = _count_role(ch, active, negative, counts)
            heads.append(_tint(f" {ch} ", role, p))
            value = counts[ch]
            shown = "·" if value == 0 else str(value)
            values.append(_tint(f" {shown} ", role, p))
        rows.append((MARGIN + " ".join(heads)).rstrip())
        rows.append((MARGIN + " ".join(values)).rstrip())
    return rows


def _count_role(ch, active, negative, counts) -> str:
    if negative is not None and ch == negative:
        return "red"
    if active is not None and ch == active:
        return "yellow"
    return "cyan" if counts[ch] > 0 else "dim"


def _cell(content: str, width: int) -> str:
    """One box cell, right-aligned like the numbers it sits over."""
    return " " + f"{content:>{width - 2}} "


def _tint(text: str, role: str, p: Palette) -> str:
    if role == "yellow":
        return p.bold(p.yellow(text))
    if role == "green":
        return p.bold(p.green(text))
    if role == "red":
        return p.bold(p.red(text))
    if role == "cyan":
        return p.cyan(text)
    if role == "dim":
        return p.dim(text)
    return text
