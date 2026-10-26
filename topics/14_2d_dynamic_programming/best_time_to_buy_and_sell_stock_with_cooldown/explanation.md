# Best Time to Buy and Sell Stock with Cooldown

**Topic:** 2-D Dynamic Programming · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/) · [NeetCode](https://neetcode.io/problems/buy-and-sell-crypto-with-cooldown)

## Problem

Given daily prices, maximise profit with any number of transactions. You must
sell before you buy again, and after selling you must **skip the next day**
(cooldown) before buying again.

## Examples

| `prices` | Output | Why |
| --- | --- | --- |
| `[1, 2, 3, 0, 2]` | `3` | buy 1 sell 2, buy 0 sell 2 |
| `[1]` | `0` | no trade possible |
| `[1, 2]` | `1` | one sale |
| `[2, 1]` | `0` | prices only fall |

## Intuition

At the end of each day the trader is in one of three states. Encoding the state
(not just the day) is what makes the cooldown expressible:

- `hold` — currently holding a stock;
- `sold` — sold **today**, so tomorrow is a cooldown;
- `rest` — no stock and free to buy tomorrow.

## Approach

1. After day `i`, store the best profit for each of the three states.
2. Transitions when day `i` has price `p`:

   ```
   hold = max(hold, rest - p)   # keep holding, or buy from a rest state
   sold = hold + p              # sell a previously held stock today
   rest = max(rest, sold)       # stay at rest, or let a sale cool down
   ```

   Crucially, `sold` and `rest` use the **previous** day's values, so a stock
   sold today cannot be re-bought today.
3. Base: `hold = -prices[0]`, `sold = -inf`, `rest = 0`.
4. Answer: `max(sold, rest)` — ending while still holding is never optimal.

## Complexity

| | Time | Space |
| --- | --- | --- |
| State machine (optimal) | `O(n)` | `O(1)` |
| 2-D `dp[i][state]` table | `O(n)` | `O(n)` |
| Brute force over transactions | exponential | — |

## Edge cases

- **One day** — no transaction is possible, answer `0`.
- **Monotonically falling prices** — never profitable, answer `0`.
- **Monotonically rising prices** — a single buy at the start / sell at the end
  beats many short trades once the cooldown is accounted for.
- **Cooldown between trades** — `[1, 2, 3, 0, 2, 3]` gives `4`: sell on day 1,
  cool down on day 2, buy the `0`, sell the final `3`.

## Solution (`solution.py`)

```python
def max_profit_with_cooldown(prices: List[int]) -> int:
    if not prices:
        return 0
    neg_inf = float("-inf")
    hold, sold, rest = -prices[0], neg_inf, 0
    for price in prices[1:]:
        prev_hold, prev_sold, prev_rest = hold, sold, rest
        hold = max(prev_hold, prev_rest - price)
        sold = prev_hold + price
        rest = max(prev_rest, prev_sold)
    return max(sold, rest)
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py best_time_to_buy_and_sell_stock_with_cooldown

# whole topic
python3 run.py 2d_dynamic

# your own case
python3 run.py best_time_to_buy_and_sell_stock_with_cooldown -c '[[1,2,3,0,2]]'
```
