"""Animated terminal visualization for Valid Palindrome.

The runner picks this file up automatically::

    python3 run.py valid_palindrome --animate
    python3 run.py valid_palindrome --animate -c '["race a car"]'
    python3 run.py valid_palindrome --animate --case 4 --speed 0.4

``frames(s, palette=...)`` yields one complete frame per algorithm step: the
characters as a row of boxes, the two pointers closing in from each end, and the
compared pair tinted green on a match / red on a mismatch. ``framework.animate``
repaints the frames in place. The box art is meant for medium strings
(<= ~40 characters).
"""
from __future__ import annotations

from typing import Dict, Iterator, List, Optional, Set, Tuple

from framework.runner import Palette

MARGIN = "  "                     # left margin shared by every art row
BAR = "▲"
_TWO_DIGIT_AT = 10                # indices become two digits past this


def frames(s: str, *, palette: Optional[Palette] = None) -> Iterator[str]:
    """Yield the step-by-step frames for one Valid Palindrome call."""
    p = palette or Palette(enabled=True)
    text = "" if s is None else str(s)

    if text == "":
        yield (
            f"{MARGIN}{p.dim('s is empty → the pointers already meet')}\n"
            f"{MARGIN}{p.bold(p.green('return True'))}\n"
        )
        return

    states, _ = _states(text)
    width = 4 if len(text) > _TWO_DIGIT_AT else 3   # inner box width
    for state in states:
        yield _frame(text, width, state, p)


# -- algorithm model -------------------------------------------------------

def _states(s: str) -> Tuple[List[Dict], bool]:
    """Replay the two-pointer scan as a list of renderable states."""
    n = len(s)
    matched: Set[int] = set()
    left, right = 0, n - 1
    states: List[Dict] = []

    def add(message: str, pair=None, pair_ok=None, result: str = "") -> None:
        states.append({
            "left": left, "right": right, "matched": set(matched),
            "pair": pair, "pair_ok": pair_ok, "message": message, "result": result,
        })

    add("skip non-alphanumerics, then compare inward")

    while left < right:
        if not s[left].isalnum():
            add(f"skip {s[left]!r} (not alphanumeric) → l += 1")
            left += 1
            continue
        if not s[right].isalnum():
            add(f"skip {s[right]!r} (not alphanumeric) → r -= 1")
            right -= 1
            continue

        a, b = s[left].lower(), s[right].lower()
        add(f"compare {a!r} vs {b!r}", pair=(left, right))
        if a != b:
            add(f"{a!r} ≠ {b!r} → not a palindrome",
                pair=(left, right), pair_ok=False, result="return False")
            return states, False

        matched.add(left)
        matched.add(right)
        add(f"{a!r} = {b!r} → match, step inward", pair=(left, right), pair_ok=True)
        left += 1
        right -= 1

    add("pointers met / crossed → palindrome", result="return True")
    return states, True


# -- frame rendering -------------------------------------------------------

def _frame(s: str, width: int, state: Dict, p: Palette) -> str:
    """Render one full frame; every frame has the same number of rows."""
    n = len(s)
    left, right = state["left"], state["right"]

    indices, cells, bars = [], [], []
    for i in range(n):
        role = _role(i, s, state)
        indices.append(_tint(_cell(str(i), width), role, p))
        cells.append(_tint(_cell(_display(s[i]), width), role, p))
        marker = BAR if i in (left, right) else ""
        bars.append(_tint(_cell(marker, width), role, p))

    top = MARGIN + "┌" + "┬".join("─" * width for _ in range(n)) + "┐"
    middle = MARGIN + "│" + "│".join(cells) + "│"
    bottom = MARGIN + "└" + "┴".join("─" * width for _ in range(n)) + "┘"

    pointer = (
        MARGIN
        + "l = " + p.bold(p.yellow(str(left))) + f" ({s[left]!r})"
        + "   "
        + "r = " + p.bold(p.yellow(str(right))) + f" ({s[right]!r})"
    )
    action = MARGIN + p.dim("action : ") + state["message"]

    result = state["result"]
    if result == "return True":
        result_line = MARGIN + p.bold(p.green(result))
    elif result == "return False":
        result_line = MARGIN + p.bold(p.red(result))
    else:
        result_line = ""

    lines = [
        (MARGIN + " " + " ".join(indices) + " ").rstrip(),
        top,
        middle,
        bottom,
        (MARGIN + " " + " ".join(bars)).rstrip(),
        "",
        pointer,
        action,
        "",
        result_line,
    ]
    return "\n".join(lines) + "\n"


def _role(index: int, s: str, state: Dict) -> str:
    pair = state["pair"]
    if pair and index in pair:
        ok = state["pair_ok"]
        if ok is True:
            return "green"
        if ok is False:
            return "red"
        return "cyan"
    if index in state["matched"]:
        return "green"
    if index == state["left"] or index == state["right"]:
        return "yellow"
    if not s[index].isalnum():
        return "dim"
    return "plain"


def _display(ch: str) -> str:
    """Make a space visible inside its box."""
    return "␣" if ch == " " else ch


def _cell(content: str, width: int) -> str:
    """One value/index box, right-aligned like the numbers it sits over."""
    return " " + f"{content:>{width - 2}} "


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
