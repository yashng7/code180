# Set Matrix Zeroes

**Topic:** Math & Geometry · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/set-matrix-zeroes/) · [NeetCode](https://neetcode.io/problems/set-zeroes-in-matrix)

## Problem

Given an `m x n` matrix, if an element is `0`, set its **entire row and
column** to `0`. Do it **in place** (the function also returns the matrix).

## Examples

| Input | Output |
| --- | --- |
| `[[1,1,1],[1,0,1],[1,1,1]]` | `[[1,0,1],[0,0,0],[1,0,1]]` |
| `[[0,1,2,0],[3,4,5,2],[1,3,1,5]]` | `[[0,0,0,0],[0,4,5,0],[0,3,1,0]]` |
| `[[1,2],[3,4]]` | `[[1,2],[3,4]]` |

## Intuition

The naive way records every zero position in a set, then zeroes each recorded
row and column. That costs `O(m + n)` extra space. We can avoid it by reusing
the matrix itself: the **first column** can flag which rows must be zeroed and
the **first row** which columns must be zeroed.

The only information that can't be stored this way is whether the first row or
first column *originally* contained a zero — a single no-longer-needed marker
would be ambiguous, so keep two booleans for that.

## Approach

1. Record `first_row_zero` and `first_col_zero` before touching anything.
2. For every interior cell `(r, c)` with `r, c >= 1`: if it is `0`, set
   `matrix[r][0] = 0` and `matrix[0][c] = 0`.
3. For every interior cell, if `matrix[r][0] == 0` or `matrix[0][c] == 0`, set
   it to `0`.
4. If `first_row_zero`, zero the whole first row; if `first_col_zero`, zero the
   whole first column.

The interior passes run before step 4 so the markers are read before the marker
lines are overwritten.

## Complexity

| | Time | Space |
| --- | --- | --- |
| First row/col as markers (optimal) | `O(m·n)` | `O(1)` |
| Hash set of zero positions | `O(m·n)` | `O(m + n)` |

- **Time `O(m·n)`** — two full scans of the matrix.
- **Space `O(1)`** — only two booleans plus indices; the matrix stores its own
  markers.

## Edge cases

- **No zeros** — nothing is marked and the matrix is returned unchanged.
- **Single element** — the `1x1` flags cover it directly.
- **Zeros already on the border** — handled by `first_row_zero` /
  `first_col_zero`, not by the interior loop.
- **All zeros** — every marker is set from the start; output stays all zeros.
- **Zero in the last column** — `matrix[0][cols-1] = 0` marks that column.

## Solution (`solution.py`)

```python
def set_zeroes(matrix: List[List[int]]) -> List[List[int]]:
    rows, cols = len(matrix), len(matrix[0])
    first_row_zero = any(matrix[0][c] == 0 for c in range(cols))
    first_col_zero = any(matrix[r][0] == 0 for r in range(rows))

    for r in range(1, rows):
        for c in range(1, cols):
            if matrix[r][c] == 0:
                matrix[r][0] = 0
                matrix[0][c] = 0

    for r in range(1, rows):
        for c in range(1, cols):
            if matrix[r][0] == 0 or matrix[0][c] == 0:
                matrix[r][c] = 0

    if first_row_zero:
        for c in range(cols):
            matrix[0][c] = 0
    if first_col_zero:
        for r in range(rows):
            matrix[r][0] = 0
    return matrix
```

## How to run the tests

```bash
# built-in test cases (7 of them)
python3 run.py set_matrix_zeroes

# same tests through pytest
pytest topics/17_math_and_geometry/set_matrix_zeroes -v

# your own case, one-shot
python3 run.py set_matrix_zeroes -c '[[[0]]]'
```
