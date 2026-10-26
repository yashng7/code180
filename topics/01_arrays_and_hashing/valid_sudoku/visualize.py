"""Animated terminal visualization for Valid Sudoku.

The runner picks this file up automatically::

    python3 run.py valid_sudoku --animate
    python3 run.py valid_sudoku --animate --case 2 --speed 0.4
    python3 run.py valid_sudoku --animate -c '<the 9x9 grid>'

``frames(board, palette=...)`` draws the bordered 9x9 board (with its 3x3
box separators), moves a scan cursor cell by cell and, for every filled cell,
shows the three keys it contributes to the row / column / box hash sets. On a
collision it glows the offending cell together with the earlier same digit and
returns ``False``; a clean scan returns ``True``. Every frame has exactly the
same number of rows so ``framework.animate.play`` can repaint in place.
"""
from __future__ import annotations

from typing import Iterator, List, Optional, Sequence, Tuple

from framework.runner import Palette

MARGIN = "  "            # left margin shared by every art row
CELL_W = 3               # inner width of one board cell ( " 5 " )
BOX_W = 3 * CELL_W + 2   # inner width of a 3x3 box incl. its two light rules
LIGHT = "│"
HEAVY = "┃"


def frames(
    board: List[List[str]], *, palette: Optional[Palette] = None
) -> Iterator[str]:
    """Yield the step-by-step frames for one Valid Sudoku call."""
    p = palette or Palette(enabled=True)
    grid = _normalize(board)

    if all(ch == "." for row in grid for ch in row):
        yield _render(
            grid, None, None, "true", p,
            scan="no filled cells to check — empty board",
            keys="keys   every row, column and box is (trivially) clean",
            counts="seen   rows 0 · cols 0 · boxes 0   (0 keys)",
            result="return True",
        )
        return

    rows: List[dict] = [{} for _ in range(9)]   # digit -> (r, c)
    cols: List[dict] = [{} for _ in range(9)]
    boxes: List[dict] = [{} for _ in range(9)]

    for r in range(9):
        for c in range(9):
            value = grid[r][c]
            box = (r // 3) * 3 + (c // 3)

            if value == ".":
                yield _render(
                    grid, (r, c), None, "skip", p,
                    scan=f"(r{r},c{c}) is empty — skipped",
                    keys="keys   (nothing added)",
                    counts=_counts(rows, cols, boxes),
                    result="→      keep scanning",
                )
                continue

            dupe, kind = _find_dupe(rows, cols, boxes, r, c, box, value)
            scan = f"(r{r},c{c}) = {value}   box {box}"

            if dupe is not None:
                dr, dc = dupe
                yield _render(
                    grid, (r, c), dupe, "clash", p,
                    scan=scan,
                    keys=f'clash  "{value}" already in {kind} (r{dr},c{dc})',
                    counts=_counts(rows, cols, boxes),
                    result="→      duplicate found — stop",
                )
                yield _render(
                    grid, (r, c), dupe, "false", p,
                    scan=scan,
                    keys=f'clash  "{value}" already in {kind} (r{dr},c{dc})',
                    counts=_counts(rows, cols, boxes),
                    result="return False",
                )
                return

            rows[r][value] = (r, c)
            cols[c][value] = (r, c)
            boxes[box][value] = (r, c)
            yield _render(
                grid, (r, c), None, "add", p,
                scan=scan,
                keys=f"keys   r{r}:{value}   c{c}:{value}   b{box}:{value}",
                counts=_counts(rows, cols, boxes),
                result="→      keep scanning",
            )

    yield _render(
        grid, None, None, "true", p,
        scan="scan complete — every digit is unique in its row, column and box",
        keys="keys   every row, column and box is clean",
        counts=_counts(rows, cols, boxes),
        result="return True",
    )


# -- algorithm helpers -----------------------------------------------------

def _normalize(board: Sequence[Sequence[str]]) -> List[str]:
    """Coerce any input into 9 rows of 9 one-char strings (missing -> ".")."""
    grid: List[str] = []
    for r in range(9):
        row = board[r] if isinstance(board, (list, tuple)) and r < len(board) else None
        chars: List[str] = []
        for c in range(9):
            ch = "."
            if isinstance(row, str):
                if c < len(row):
                    ch = row[c]
            elif isinstance(row, (list, tuple)) and c < len(row):
                candidate = row[c]
                if isinstance(candidate, str) and len(candidate) == 1:
                    ch = candidate
            chars.append(ch)
        grid.append("".join(chars))
    return grid


def _find_dupe(rows, cols, boxes, r, c, box, value) -> Tuple[Optional[tuple], str]:
    if value in rows[r]:
        return rows[r][value], "row"
    if value in cols[c]:
        return cols[c][value], "column"
    if value in boxes[box]:
        return boxes[box][value], "box"
    return None, ""


def _counts(rows, cols, boxes) -> str:
    a = sum(len(s) for s in rows)
    b = sum(len(s) for s in cols)
    d = sum(len(s) for s in boxes)
    return f"seen   rows {a} · cols {b} · boxes {d}   ({a + b + d} keys)"


# -- frame rendering -------------------------------------------------------

def _render(grid, cursor, dupe, stage, p, *, scan, keys, counts, result) -> str:
    """Render one full frame; every frame has the same number of rows."""
    lines = _grid_lines(grid, cursor, dupe, stage, p)
    lines.append("")
    lines.append(f"{MARGIN}scan   {scan}")
    lines.append(f"{MARGIN}{_key_line(keys, stage, p)}")
    lines.append(f"{MARGIN}{p.dim(counts)}")
    lines.append(f"{MARGIN}{_result_line(result, stage, p)}")
    return "\n".join(lines) + "\n"


def _grid_lines(grid, cursor, dupe, stage, p) -> List[str]:
    lines = [_hrule("┌", "┬", "┐", p)]
    for r in range(9):
        row = MARGIN + p.dim(LIGHT)
        for c in range(9):
            row += _tint_cell(" " + grid[r][c] + " ", _role(grid, r, c, cursor, dupe, stage), p)
            if c == 8:
                row += p.dim(LIGHT)
            else:
                row += p.dim(HEAVY if c in (2, 5) else LIGHT)
        lines.append(row)
        if r in (2, 5):
            lines.append(_hrule("├", "┼", "┤", p))
    lines.append(_hrule("└", "┴", "┘", p))
    return lines


def _hrule(left: str, mid: str, right: str, p: Palette) -> str:
    seg = "─" * BOX_W
    return MARGIN + p.dim(left + mid.join([seg, seg, seg]) + right)


def _role(grid, r, c, cursor, dupe, stage) -> str:
    if dupe is not None and (r, c) == dupe:
        return "dupe"
    if cursor is not None and (r, c) == cursor:
        return "bad" if stage in ("clash", "false") else "cur"
    if grid[r][c] == ".":
        return "empty"
    return "plain"


def _tint_cell(text: str, role: str, p: Palette) -> str:
    if role == "cur":
        return p.bold(p.yellow(text))
    if role in ("dupe", "bad"):
        return p.bold(p.red(text))
    if role == "empty":
        return p.dim(text)
    return text


def _key_line(text: str, stage: str, p: Palette) -> str:
    if stage in ("clash", "false"):
        return p.bold(p.red(text))
    if stage == "add":
        return p.cyan(text)
    if stage == "true":
        return p.green(text)
    return p.dim(text)


def _result_line(text: str, stage: str, p: Palette) -> str:
    if stage == "true":
        return p.bold(p.green(text))
    if stage in ("clash", "false"):
        return p.bold(p.red(text))
    return p.dim(text)
