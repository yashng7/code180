# Unique Paths

**Topic:** 2-D Dynamic Programming · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/unique-paths/) · [NeetCode](https://neetcode.io/problems/unique-paths)

## Problem

A robot starts at the top-left corner of an `m x n` grid and wants to reach the
bottom-right corner. It may only move **right** or **down**. Return the number
of distinct paths.

## Examples

| `m` | `n` | Output | Why |
| --- | --- | --- | --- |
| `3` | `7` | `28` | C(8, 2) |
| `3` | `2` | `3` | RRD, RDR, DRR |
| `1` | `1` | `1` | already there |
| `3` | `3` | `6` | C(4, 2) |

## Intuition

The only way into a cell `(i, j)` is **from above** `(i-1, j)` or **from the
left** `(i, j-1)`. So the number of paths to a cell is the sum of the paths to
those two neighbours. This is the "grid DP" pattern.

## Approach

1. Let `dp[i][j]` = number of paths from `(0, 0)` to `(i, j)`.
2. Base cases: the whole first row and first column are `1`, because a single
   straight line of moves reaches every one of those cells exactly once.
3. Transition for `i > 0`, `j > 0`:

   ```
   dp[i][j] = dp[i-1][j] + dp[i][j-1]
   ```

4. The answer is `dp[m-1][n-1]`.
5. **Space optimisation:** row `i` depends only on row `i-1` and the cell to the
   left, so keep a single 1-D array. Before updating, `dp[j]` is the value from
   the row above (the "up" term) and `dp[j-1]` is the just-updated "left" term:

   ```
   dp[j] = dp[j] + dp[j-1]
   ```

## Complexity

| | Time | Space |
| --- | --- | --- |
| 2-D table | `O(m · n)` | `O(m · n)` |
| 1-D rolling row | `O(m · n)` | `O(n)` |
| Binomial | `O(m + n)` | `O(1)` |

## Edge cases

- **Single row or column** (`1 x n`, `m x 1`) — exactly `1` path.
- **`1 x 1` grid** — the robot is already at the finish, so `1`.
- **Large grids** — the count is `C(m+n-2, m-1)`, a binomial coefficient, not a
  greedy shortest-path count.

## Solution (`solution.py`)

```python
def unique_paths(m: int, n: int) -> int:
    dp = [1] * n
    for _ in range(1, m):
        for j in range(1, n):
            dp[j] += dp[j - 1]
    return dp[n - 1]
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py unique_paths

# whole topic
python3 run.py 2d_dynamic

# your own case
python3 run.py unique_paths -c '[3, 7]'
```
