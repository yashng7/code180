# Coin Change II

**Topic:** 2-D Dynamic Programming · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/coin-change-ii/) · [NeetCode](https://neetcode.io/problems/coin-change-ii)

## Problem

Given coin denominations `coins` and an integer `amount`, count the number of
**combinations** that sum to `amount`. Each coin has an unlimited supply. Two
combinations are the same when they use the same multiset of coins (order does
not matter), so `1+2` and `2+1` count once.

> Note the argument order used here: `change(amount, coins)` — **amount first**.

## Examples

| `amount` | `coins` | Output | Why |
| --- | --- | --- | --- |
| `5` | `[1, 2, 5]` | `4` | `5`, `2+2+1`, `2+1+1+1`, `1+1+1+1+1` |
| `3` | `[2]` | `0` | cannot make an odd amount |
| `10` | `[10]` | `1` | the single coin |
| `0` | `[1, 2, 5]` | `1` | the empty combination |

## Intuition

This is **unbounded knapsack**: each coin may be used repeatedly. Define
`dp[a]` = number of ways to make amount `a`. Adding one more coin `c` to a valid
way of making `a - c` produces a way of making `a`, so `dp[a] += dp[a - c]`.

The subtlety is **counting combinations, not permutations**. Processing coins in
the *outer* loop makes the coins appear in a fixed order, so each multiset is
counted exactly once. (Swapping the loops would count `1+2` and `2+1`
separately.)

## Approach

1. `dp[a]` = combinations summing to `a`; `dp[0] = 1` (the empty combination).
2. For each coin `c`, sweep the amounts **ascending** so `c` can be reused:

   ```
   for total in range(c, amount + 1):
       dp[total] += dp[total - c]
   ```

3. Answer is `dp[amount]`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| 1-D unbounded knapsack | `O(amount · n)` | `O(amount)` |
| 2-D `dp[coin][amount]` table | `O(amount · n)` | `O(amount · n)` |
| Brute-force backtracking | exponential | — |

## Edge cases

- **`amount = 0`** — exactly one combination: use nothing.
- **Impossible amount** (e.g. `7` from `[2]`) — answer `0`.
- **Coin larger than `amount`** — the range is empty and it is skipped.
- **Duplicate coins** — the problem guarantees distinct denominations, but even
  so each is processed once.

## Solution (`solution.py`)

```python
def change(amount: int, coins: List[int]) -> int:
    dp = [0] * (amount + 1)
    dp[0] = 1
    for coin in coins:
        for total in range(coin, amount + 1):
            dp[total] += dp[total - coin]
    return dp[amount]
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py coin_change_ii

# whole topic
python3 run.py 2d_dynamic

# your own case
python3 run.py coin_change_ii -c '[5, [1,2,5]]'
```
