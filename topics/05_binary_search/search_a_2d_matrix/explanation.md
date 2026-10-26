# Search a 2D Matrix

**Topic:** Binary Search · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/search-a-2d-matrix/) · [NeetCode](https://neetcode.io/problems/search-2d-matrix)

## Problem

You are given an `m x n` integer matrix with two properties:

- each row is sorted in non-decreasing order;
- the first integer of each row is greater than the last integer of the
  previous row.

Given an integer `target`, return `true` if `target` is in the matrix, `false`
otherwise. Aim for `O(log(m·n))` time.

## Examples

| `matrix` | `target` | Output |
| --- | --- | --- |
| `[[1,3,5,7],[10,11,16,20],[23,30,34,60]]` | `3` | `true` |
| `[[1,3,5,7],[10,11,16,20],[23,30,34,60]]` | `13` | `false` |
| `[[1]]` | `1` | `true` |

## Intuition

The two guarantees together mean the matrix is one **fully sorted sequence** if
you read it row by row. So instead of searching rows and then columns, we can
binary search a virtual flat array of length `m·n`.

The only trick is mapping a flat index back to `(row, col)`:

```
row = index // cols
col = index % cols
```

## Approach

1. Guard against an empty matrix and return `False`.
2. Set `lo = 0`, `hi = rows * cols - 1` in the virtual flat array.
3. Loop while `lo <= hi`:
   - `mid = (lo + hi) // 2`;
   - read `value = matrix[mid // cols][mid % cols]`;
   - return `True` on a match, otherwise shrink the window as in ordinary
     binary search.
4. Return `False` when the window empties.

Alternatively you can binary search the rows to find the candidate row and then
binary search inside that row — same `O(log(m·n))` cost, two passes.

## Walkthrough

`matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]]`, `target = 3`, `cols = 4`

| `lo` | `hi` | `mid` | `(mid//4, mid%4)` | value | action |
| --- | --- | --- | --- | --- | --- |
| 0 | 11 | 5 | `(1, 1)` | 11 | `11 > 3` → `hi = 4` |
| 0 | 4 | 2 | `(0, 2)` | 5 | `5 > 3` → `hi = 1` |
| 0 | 1 | 0 | `(0, 0)` | 1 | `1 < 3` → `lo = 1` |
| 1 | 1 | 1 | `(0, 1)` | 3 | **match → return `True`** |

## Complexity

| | Time | Space |
| --- | --- | --- |
| Flattened binary search (optimal) | `O(log(m·n))` | `O(1)` |
| Row scan then column scan | `O(m + n)` | `O(1)` |

- **Time `O(log(m·n))`** — one binary search over all `m·n` cells.
- **Space `O(1)`** — no extra storage; the flat index is computed on the fly.

## Edge cases

- **Single cell** — the virtual array has length 1.
- **Single row or single column** — the row/column mapping still holds.
- **`target` smaller than every value or larger** — the window collapses to
  nothing and returns `False`.
- **Value in a gap between rows** — e.g. `13`; the flat search simply misses.
- **First/last element** — returned by the standard halving.

## Solution (`solution.py`)

```python
def search_matrix(matrix: List[List[int]], target: int) -> bool:
    if not matrix or not matrix[0]:
        return False
    rows, cols = len(matrix), len(matrix[0])
    lo, hi = 0, rows * cols - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        value = matrix[mid // cols][mid % cols]
        if value == target:
            return True
        if value < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return False
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py search_a_2d_matrix

# same tests through pytest
pytest topics/05_binary_search/search_a_2d_matrix -v

# your own case, one-shot
python3 run.py search_a_2d_matrix -c '[[[1,3,5,7],[10,11,16,20],[23,30,34,60]], 3]'
```
