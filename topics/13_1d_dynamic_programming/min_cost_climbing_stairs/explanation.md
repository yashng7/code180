# Min Cost Climbing Stairs

**Topic:** 1-D Dynamic Programming · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/min-cost-climbing-stairs/) · [NeetCode](https://neetcode.io/problems/min-cost-climbing-stairs)

## Problem

You are given an integer array `cost` where `cost[i]` is the fee to stand on
step `i`. Once you pay the fee you may climb **one or two** steps. You may
start at step `0` or step `1`. Return the minimum cost to reach the top, which
is just past the last step.

## Examples

| `cost` | Output | Why |
| --- | --- | --- |
| `[10, 15, 20]` | `15` | start at step 1, pay 15, jump 2 to the top |
| `[1, 100, 1, 1, 1, 100, 1, 1, 100, 1]` | `6` | hop only the cheap steps |
| `[1, 2, 3]` | `2` | start at step 1, pay 2, jump to the top |

## Intuition

Define `dp[i]` as the **minimum cost to reach step `i`**. Reaching step `i`
means arriving from `i-1` or `i-2`; the last action was paying the fee of the
step you left. So each state only depends on the previous two.

## Approach

1. `dp[0] = 0` and `dp[1] = 0`: you may begin on either of the first two steps
   for free.
2. Recurrence for `i >= 2`:

   ```
   dp[i] = min(dp[i-1] + cost[i-1], dp[i-2] + cost[i-2])
   ```

3. The answer is `dp[n]` where `n = len(cost)` (the top is one past the end).
4. **Rolling-variable optimisation:** keep only `dp[i-1]` and `dp[i-2]` in two
   variables, so the extra space drops from `O(n)` to `O(1)`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Iterative (optimal) | `O(n)` | `O(1)` |
| Array DP | `O(n)` | `O(n)` |

## Edge cases

- **Two steps** — answer is `min(cost[0], cost[1])` because you start on the
  cheaper one and jump straight to the top.
- **Zero-cost steps** — valid; the minimum can be `0`.
- **Large steps** — the answer may be far from the greedy "take the cheapest
  next step" choice, so a full DP (not greedy) is required.

## Solution (`solution.py`)

```python
def min_cost_climbing_stairs(cost: List[int]) -> int:
    prev2, prev1 = 0, 0
    for i in range(2, len(cost) + 1):
        prev2, prev1 = prev1, min(prev1 + cost[i - 1], prev2 + cost[i - 2])
    return prev1
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py min_cost_climbing_stairs

# whole topic
python3 run.py 1d_dynamic

# your own case
python3 run.py min_cost_climbing_stairs -c '[[10,15,20]]'
```
