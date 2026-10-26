# Climbing Stairs

**Topic:** 1-D Dynamic Programming · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/climbing-stairs/) · [NeetCode](https://neetcode.io/problems/climbing-stairs)

## Problem

You are climbing a staircase with `n` steps. Each time you can climb either
**1 or 2** steps. In how many distinct ways can you reach the top?

## Examples

| `n` | Output | Why |
| --- | --- | --- |
| `2` | `2` | `1+1`, `2` |
| `3` | `3` | `1+1+1`, `1+2`, `2+1` |
| `4` | `5` | `1+1+1+1`, `1+1+2`, `1+2+1`, `2+1+1`, `2+2` |

## Intuition

To stand on step `i`, your **last move** was either a 1-step from `i-1` or a
2-step from `i-2`. Those are disjoint sets of paths, so the number of ways to
reach `i` is the sum of the ways to reach the previous two steps. That is the
Fibonacci recurrence.

## Approach

1. Base cases: `dp[1] = 1` (only `1`) and `dp[2] = 2` (`1+1`, `2`).
2. Recurrence for `i >= 3`:

   ```
   dp[i] = dp[i-1] + dp[i-2]
   ```

3. The answer is `dp[n]`.
4. **Rolling-variable optimisation:** only `dp[i-1]` and `dp[i-2]` are ever
   needed, so keep two integers (`prev2`, `prev1`) instead of the whole array.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Iterative (optimal) | `O(n)` | `O(1)` |
| Array DP | `O(n)` | `O(n)` |
| Naive recursion | `O(2^n)` | `O(n)` |

## Edge cases

- **`n = 1`** — one way (`1`); the loop is skipped.
- **`n = 2`** — two ways; handled by the base case.
- **Large `n`** — the value grows like `φ^n`; naive recursion times out, but
  the iterative version is linear and the Python integers are exact.

## Solution (`solution.py`)

```python
def climb_stairs(n: int) -> int:
    if n <= 2:
        return n
    prev2, prev1 = 1, 2
    for _ in range(3, n + 1):
        prev2, prev1 = prev1, prev2 + prev1
    return prev1
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py climbing_stairs

# whole topic
python3 run.py 1d_dynamic

# your own case
python3 run.py climbing_stairs -c '[5]'
```
