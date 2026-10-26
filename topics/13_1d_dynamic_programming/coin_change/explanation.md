# Coin Change

**Topic:** 1-D Dynamic Programming · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/coin-change/) · [NeetCode](https://neetcode.io/problems/coin-change)

## Problem

You are given an array of coin denominations `coins` and an integer `amount`.
Return the **fewest** number of coins needed to make up `amount`, or `-1` when
it is impossible. You have an unlimited supply of each coin.

## Examples

| `coins` | `amount` | Output | Why |
| --- | --- | --- | --- |
| `[1, 2, 5]` | `11` | `3` | `5 + 5 + 1` |
| `[2]` | `3` | `-1` | no combination |
| `[1]` | `0` | `0` | nothing to make |

## Intuition

Think of the optimal solution for `amount` and look at **one** coin in it. If
that coin is `c`, the rest of the solution optimally makes `amount - c`. So the
answer for a value `a` is one more than the best answer for `a - c`, minimised
over all coins `c`. This is the **unbounded knapsack** recurrence, because the
same coin may be reused.

## Approach

1. Let `dp[a]` = minimum coins for value `a`, initialised to a large sentinel
   (`amount + 1`), with `dp[0] = 0`.
2. For each value `a` from `1` to `amount`, and each coin `c <= a`:

   ```
   dp[a] = min(dp[a], dp[a - c] + 1)
   ```

3. If `dp[amount]` is still the sentinel, return `-1`; otherwise return it.
4. **Rolling state:** only the single `dp` array is needed; a top-down memo on
   `(remaining)` is equivalent but uses `O(amount)` stack space.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Bottom-up DP (optimal) | `O(amount · n)` | `O(amount)` |
| Top-down memo | `O(amount · n)` | `O(amount)` |
| Brute force | exponential | — |

## Edge cases

- **`amount = 0`** — `0` coins.
- **Unreachable target** — return `-1` (e.g. `coins = [2], amount = 3`).
- **Greedy traps** — `coins = [2, 3, 7], amount = 12` needs `7 + 3 + 2`
  (`3` coins); a naive greedy that takes the biggest coin must still check all
  options. Larger example: `[186, 419, 83, 408], amount = 6249` needs `20`.
- **Coin larger than a value** — skipped by the `coin <= total` guard.

## Solution (`solution.py`)

```python
def coin_change(coins: List[int], amount: int) -> int:
    unreachable = amount + 1
    dp = [unreachable] * (amount + 1)
    dp[0] = 0
    for total in range(1, amount + 1):
        for coin in coins:
            if coin <= total:
                dp[total] = min(dp[total], dp[total - coin] + 1)
    return -1 if dp[amount] == unreachable else dp[amount]
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py coin_change

# whole topic
python3 run.py 1d_dynamic

# your own case
python3 run.py coin_change -c '[[1,2,5], 11]'
```
