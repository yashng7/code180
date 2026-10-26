# N-Queens

**Topic:** Backtracking · **Difficulty:** Hard
**Links:** [LeetCode](https://leetcode.com/problems/n-queens/) · [NeetCode](https://neetcode.io/problems/n-queens)

## Problem

Place `n` queens on an `n x n` chessboard so that no two queens attack each
other (same row, column or diagonal). Return every distinct solution as a list
of strings; the order of the solutions is free.

## Examples

| `n` | Output |
| --- | --- |
| `1` | `[["Q"]]` |
| `4` | `[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]` |
| `2` | `[]` |

## Intuition

Attack detection is the whole game, and there is a neat trick for it. Place
**exactly one queen per row** while scanning rows top to bottom, so row conflicts
are impossible. Then a queen at `(row, col)` conflicts with a previously placed
queen only if:

- the same **column** is used → track a `cols` set;
- the same **`row + col`** diagonal is used → `diag` set;
- the same **`row - col`** anti-diagonal is used → `anti` set.

Because every cell on a `↘` diagonal shares `row - col`, and every cell on a `↗`
diagonal shares `row + col`, those two sets capture all diagonal attacks in
`O(1)` per check.

## Approach

1. Maintain three sets (`cols`, `diag`, `anti`) and a `queens` list mapping row →
   column.
2. `backtrack(row)`:
   - if `row == n`, render the board and record it;
   - for each `col`, skip it if it is attacked;
   - otherwise add it to the three sets (choose), recurse to `row + 1` (recurse),
     then remove it and pop `queens` (un-choose).
3. Rendering a row is `"." * col + "Q" + "." * (n - 1 - col)`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Backtracking with sets | `O(n!)` | `O(n)` |
| Naive O(n²) validity check | `O(n! · n)` | `O(n)²` |

The sets prune branches to `O(1)` per candidate, leaving roughly `n!` work in
the worst case. The sets and recursion stack are `O(n)`; the returned boards
themselves are `O(n²)` each.

## Edge cases

- **`n = 1`** → one trivial solution `[["Q"]]`.
- **`n = 2` and `n = 3`** → no solution, so `[]`.
- **Duplicated boards**: because we place one queen per row left-to-right, each
  solution is generated exactly once.
- The order of the **solutions** is free, but each board's **row order is
  meaningful**, so the harness compares with `unordered` (not
  `unordered_inner`).

## Solution (`solution.py`)

```python
def solve_n_queens(n):
    result = []
    cols, diag, anti = set(), set(), set()
    queens = []

    def backtrack(row):
        if row == n:
            result.append(["." * c + "Q" + "." * (n - 1 - c) for c in queens])
            return
        for col in range(n):
            if col in cols or (row + col) in diag or (row - col) in anti:
                continue
            cols.add(col)               # choose
            diag.add(row + col)
            anti.add(row - col)
            queens.append(col)
            backtrack(row + 1)          # recurse
            queens.pop()                # un-choose
            cols.remove(col)
            diag.remove(row + col)
            anti.remove(row - col)

    backtrack(0)
    return result
```

## How to run the tests

```bash
python3 run.py n_queens
pytest topics/10_backtracking/n_queens -v
python3 run.py n_queens -c '[4]'
```
