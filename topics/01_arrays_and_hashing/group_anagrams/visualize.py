"""Animated terminal visualization for Group Anagrams.

The runner picks this file up automatically::

    python3 run.py group_anagrams --animate
    python3 run.py group_anagrams --animate -c '[["eat","tea","tan"]]'
    python3 run.py group_anagrams --animate --case 1 --speed 0.4

``frames(strs, palette=...)`` yields one complete frame per algorithm step:
the words as chips, the sorted key being built underneath each chip, and a
bucket row per distinct key. ``framework.animate.play`` repaints the frames in
place. The box art is intended for small inputs (a handful of short words).
"""
from __future__ import annotations

from typing import Dict, Iterator, List, Optional, Tuple

from framework.runner import Palette

MARGIN = "  "          # left margin shared by every art row


def frames(strs: List[str], *, palette: Optional[Palette] = None) -> Iterator[str]:
    """Yield the step-by-step frames for one Group Anagrams call."""
    p = palette or Palette(enabled=True)
    words = list(strs)

    if not words:
        yield _empty_frame(p)
        return

    # --- precompute the grouping (insertion order of first-seen key) ------
    order: List[str] = []
    groups: Dict[str, List[int]] = {}
    keys: List[str] = []
    for index, word in enumerate(words):
        key = "".join(sorted(word))
        keys.append(key)
        if key not in groups:
            groups[key] = []
            order.append(key)
        groups[key].append(index)

    n = len(words)
    inner = max(2, max(len(word) for word in words))   # inner content width
    cell_w = inner + 2

    sort_steps = [_sort_steps(word) for word in words]

    key_states: List[Optional[Tuple[List[str], int]]] = [None] * n
    fill: Dict[str, List[int]] = {key: [] for key in order}

    # 1. Intro: every word is a chip; no keys or buckets yet.
    yield _frame(
        words, cell_w, ["plain"] * n, key_states, order, fill, None,
        "key each word by its sorted letters, then bucket it", "", p,
    )

    for i, word in enumerate(words):
        roles = ["dim"] * i + ["yellow"] + ["plain"] * (n - i - 1)

        # 2. Sort this word's letters into its canonical key.
        for letters, upto, message in sort_steps[i]:
            key_states[i] = (letters, upto)
            yield _frame(
                words, cell_w, roles, key_states, order, fill, None, message, "", p,
            )

        # 3. The key is complete -- anagrams share it.
        key_states[i] = (list(keys[i]), len(keys[i]) - 1)
        yield _frame(
            words, cell_w, roles, key_states, order, fill, None,
            f'key = "{keys[i]}"', "", p,
        )

        # 4. Drop the chip into its bucket.
        fill[keys[i]].append(i)
        roles = ["dim"] * (i + 1) + ["plain"] * (n - i - 1)
        yield _frame(
            words, cell_w, roles, key_states, order, fill, (keys[i], i),
            f'drop "{word}" into bucket "{keys[i]}"', "", p,
        )

    # 5. Reveal the grouped result.
    groups_text = [
        "[" + ", ".join(f'"{words[index]}"' for index in groups[key]) + "]"
        for key in order
    ]
    yield _frame(
        words, cell_w, ["dim"] * n, key_states, order, fill, None,
        "every word now sits in its bucket", "return [" + ", ".join(groups_text) + "]", p,
    )


# -- algorithm model -------------------------------------------------------

def _sort_steps(word: str) -> List[Tuple[List[str], int, str]]:
    """Selection-sort trace: (letters, sorted-through index, message) per swap."""
    letters = list(word)
    steps: List[Tuple[List[str], int, str]] = [
        (list(letters), -1, f'sort "{word}"  →  read its letters'),
    ]
    for position in range(len(letters)):
        smallest = min(
            range(position, len(letters)), key=lambda k: letters[k]
        )
        if smallest != position:
            letters[position], letters[smallest] = letters[smallest], letters[position]
        steps.append((
            list(letters), position,
            f'sort "{word}"  →  put "{letters[position]}" at index {position}',
        ))
    return steps


# -- frame rendering -------------------------------------------------------

def _frame(words, cell_w, roles, key_states, order, fill, flash, status, result, p) -> str:
    """Render one full frame; every frame has the same number of rows."""
    lines: List[str] = []

    # header + word chips box
    header = "[" + ", ".join(f'"{word}"' for word in words) + "]"
    lines.append(f"{MARGIN}{p.dim('strs')} {p.dim('=')} {header}")
    lines.append("")

    top = MARGIN + "┌" + "┬".join("─" * cell_w for _ in words) + "┐"
    bottom = MARGIN + "└" + "┴".join("─" * cell_w for _ in words) + "┘"
    cells = [
        _tint(_cell(word, cell_w), roles[i], p)
        for i, word in enumerate(words)
    ]
    lines.append(top)
    lines.append(MARGIN + "│" + "│".join(cells) + "│")
    lines.append(bottom)

    # key row, aligned under each chip
    key_cells = []
    for i in range(len(words)):
        state = key_states[i]
        if state is None:
            key_cells.append(_pending_cell(cell_w, p))
        else:
            letters, upto = state
            key_cells.append(_paint_cell(letters, upto, cell_w, p))
    lines.append(MARGIN + " " + " ".join(key_cells) + " ")
    lines.append("")

    # bucket rows (one per distinct key -- a fixed count keeps rows constant)
    lines.append(f"{MARGIN}{p.dim('buckets (keyed by sorted letters)')}")
    key_w = max((len(key) for key in order), default=1) or 1
    for key in order:
        label = key if key else "∅"
        members = [words[index] for index in fill[key]]
        if members:
            parts = [
                p.bold(p.green(word)) if flash == (key, index) else word
                for index, word in zip(fill[key], members)
            ]
            body = ", ".join(parts)
        else:
            body = p.dim("(empty)")
        lines.append(f"{MARGIN}  {p.bold(p.cyan(_pad(label, key_w)))}  │  {body}")
    lines.append("")

    lines.append(f"{MARGIN}{status}")
    lines.append(f"{MARGIN}{p.bold(p.green(result))}" if result else "")
    return "\n".join(lines) + "\n"


def _empty_frame(p: Palette) -> str:
    lines = [
        f"{MARGIN}{p.dim('strs is empty  →  nothing to group')}",
        "",
        f"{MARGIN}{p.bold(p.green('return []'))}",
    ]
    return "\n".join(lines) + "\n"


def _cell(content: str, width: int) -> str:
    """One word box, centered inside ``width`` cells."""
    field = width - 2
    left = (field - len(content)) // 2
    right = field - len(content) - left
    return " " + " " * left + content + " " * right + " "


def _pending_cell(width: int, p: Palette) -> str:
    field = width - 2
    left = (field - 1) // 2
    right = field - 1 - left
    return " " + " " * left + p.dim("·") + " " * right + " "


def _paint_cell(letters: List[str], upto: int, width: int, p: Palette) -> str:
    """The key being built: sorted letters green, the rest yellow."""
    field = width - 2
    offset = max(0, (field - len(letters)) // 2)
    out = [" " * offset]
    out.extend(
        _tint(letter, "green" if index <= upto else "yellow", p)
        for index, letter in enumerate(letters)
    )
    out.append(" " * max(0, field - offset - len(letters)))
    return " " + "".join(out) + " "


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
