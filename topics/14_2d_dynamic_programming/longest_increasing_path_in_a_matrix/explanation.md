# Longest Increasing Path in a Matrix

**Topic:** 2-D Dynamic Programming · **Difficulty:** Hard
**Links:** [LeetCode](https://leetcode.com/problems/longest-increasing-path-in-a-matrix/) · [NeetCode](https://neetcode.io/problems/longest-increasing-path-in-a-matrix)

## Problem

Given an `m x n` integer matrix, return the length of the longest path where
each step moves to a strictly larger value among the four orthogonally adjacent
cells.

## Examples

| `matrix` | Output | Why |
| --- | --- | --- |
| `[[9,9,4],[6,6,8],[2,1,1]]` | `4` | `1 -> 2 -> 6 -> 9` |
| `[[3,4,5],[3,2,6],[2,2,1]]` | `4` | `3 -> 4 -> 5 -> 6` |
| `[[1]]` | `1` | single cell |
| `[[7,7,7],[7,7,7],[7,7,7]]` | `1` | no strict increase |

## Intuition

Edges always point from a smaller value to a larger one, so the cells form a
**DAG**: there can be no cycles. The longest path ending at a cell is one plus
the best of its smaller neighbours — a memoised DFS. Processing cells in
**increasing value order** gives the same result without recursion, because by
the time a cell is reached all its predecessors are already final.

## Approach

1. `dp[cell]` = length of the longest increasing path *starting* at `cell`,
   initialised to `1`.
2. Sort all cells by value ascending.
3. For each cell in that order, relax each strictly larger neighbour:

   ```
   dp[neighbour] = max(dp[neighbour], dp[cell] + 1)
   ```

4. The answer is the maximum over all cells.

Sorting (instead of recursion) keeps the implementation iterative and avoids
Python's recursion limit on tall staircases.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Sort + relax (this solution) | `O(m · n · log(m · n))` | `O(m · n)` |
| Memoised DFS / topological DFS | `O(m · n)` | `O(m · n)` |
| Brute-force enumeration of paths | exponential | — |

## Edge cases

- **Single cell** — `1`.
- **All equal values** — no strictly increasing move exists, so `1`.
- **Strict increase required** — a plateau (`7, 7`) cannot be stepped across.
- **Non-square boards** — the row/column bounds must be checked independently.

## Solution (`solution.py`)

```python
def longest_increasing_path(matrix: List[List[int]]) -> int:
    if not matrix or not matrix[0]:
        return 0
    rows, cols = len(matrix), len(matrix[0])
    dp = [[1] * cols for _ in range(rows)]
    cells = sorted(
        (matrix[r][c], r, c) for r in range(rows) for c in range(cols)
    )
    best = 1
    for value, r, c in cells:
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and matrix[nr][nc] > value:
                if dp[r][c] + 1 > dp[nr][nc]:
                    dp[nr][nc] = dp[r][c] + 1
        best = max(best, dp[r][c])
    return best
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py longest_increasing_path_in_a_matrix

# whole topic
python3 run.py 2d_dynamic

# your own case
python3 run.py longest_increasing_path_in_a_matrix -c '[[[9,9,4],[6,6,8],[2,1,1]]]'
```
