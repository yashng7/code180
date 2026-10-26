# Valid Sudoku

**Topic:** Arrays & Hashing · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/valid-sudoku/) · [NeetCode](https://neetcode.io/problems/valid-sudoku)

## Problem

Determine whether a partially filled `9×9` Sudoku board is **valid**. A board is
valid if **no row, column, or `3×3` sub-box** contains a repeated digit from
`1`–`9`. Filled cells are digits; empty cells are `"."`.

> Note: a valid board does **not** have to be completely filled — we only check
> that no rule is violated.

## Intuition

We must track "already seen" digits for three kinds of groups *simultaneously*:
each of the 9 rows, each of the 9 columns, and each of the 9 boxes. A hash set
per group makes each check `O(1)`.

The only small trick is mapping a cell `(r, c)` to its box index:

```
box = (r // 3) * 3 + (c // 3)     # 0..8
```

## Approach

1. Create nine sets for rows, nine for columns, nine for boxes.
2. Scan every cell:
   - skip `"."`;
   - compute the box index;
   - if the digit already appears in that row, column, or box → return `False`;
   - otherwise add it to all three sets.
3. If the scan completes, return `True`.

An alternative encodes each constraint as a composite string key (e.g.
`f"{value} in row {r}"`) in a single set.

## Complexity

There are always `9 × 9 = 81` cells, so both are effectively constant:

| | Time | Space |
| --- | --- | --- |
| Set per group | `O(81)` | `O(81)` |

## Edge cases

- A **duplicate inside a box** that is not in the same row or column.
- A duplicate in a **row** where the columns/boxes look fine.
- A duplicate in a **column**.
- Empty board → `True`.
- Digits of a completed valid board → `True`.

## Solution

```python
def is_valid_sudoku(board: List[List[str]]) -> bool:
    rows = [set() for _ in range(9)]
    cols = [set() for _ in range(9)]
    boxes = [set() for _ in range(9)]
    for r in range(9):
        for c in range(9):
            value = board[r][c]
            if value == ".":
                continue
            box = (r // 3) * 3 + (c // 3)
            if value in rows[r] or value in cols[c] or value in boxes[box]:
                return False
            rows[r].add(value)
            cols[c].add(value)
            boxes[box].add(value)
    return True
```

## How to run

```bash
python3 run.py valid_sudoku
# custom board (one arg = the 9x9 grid):
python3 run.py valid_sudoku -c '[[["5","3",".",".","7",".",".",".","."],
  ["6",".",".","1","9","5",".",".","."],
  [".","9","8",".",".",".",".","6","."],
  ["8",".",".",".","6",".",".",".","3"],
  ["4",".",".","8",".","3",".",".","1"],
  ["7",".",".",".","2",".",".",".","6"],
  [".","6",".",".",".",".","2","8","."],
  [".",".",".","4","1","9",".",".","5"],
  [".",".",".",".","8",".",".","7","9"]]]'
```
