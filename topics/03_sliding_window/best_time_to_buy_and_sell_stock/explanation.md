# Best Time to Buy and Sell Stock

**Topic:** Sliding Window · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/best-time-to-buy-and-sell-stock/) · [NeetCode](https://neetcode.io/problems/buy-and-sell-crypto)

## Problem

You are given an array `prices` where `prices[i]` is the price of a given stock
on the `i`-th day.

You want to maximise your profit by choosing a **single day** to buy one share
and a **different future day** to sell it. Return the maximum profit you can
achieve. If no profit is possible, return `0`.

## Examples

| `prices` | Output | Why |
| --- | --- | --- |
| `[7, 1, 5, 3, 6, 4]` | `5` | buy at `1`, sell at `6` |
| `[7, 6, 4, 3, 1]` | `0` | prices only fall, so don't trade |
| `[1, 2, 3, 4, 5]` | `4` | buy at `1`, sell at `5` |

## Intuition

The buying day must come **before** the selling day, so the pair of days forms a
window: a left edge (the buy day) and a right edge (the sell day). As the sell
day moves forward one step at a time, the best buy day is simply the **cheapest
price seen so far**.

That means we never need to look backwards over every earlier day — we keep one
running minimum (`left`) and test each new day against it. Whenever we find a
price cheaper than the current minimum, that becomes our new buy day.

## Approach

1. Start with `left = 0` (the first day is the initial buy day) and `best = 0`.
2. Walk `right` from day `1` to the end:
   - if `prices[right]` is **cheaper** than `prices[left]`, move the buy day
     forward: `left = right`;
   - otherwise the trade `prices[right] - prices[left]` is a candidate — update
     `best`.
3. Return `best`.

This is the sliding-window template in its simplest form: the right edge
**expands** every iteration, and the left edge **shrinks forward** only when a
lower buying price appears.

## Walkthrough

`prices = [7, 1, 5, 3, 6, 4]`

| day | price | buy `left` | profit if sold now | `best` |
| --- | --- | --- | --- | --- |
| 0 | 7 | 0 | — | 0 |
| 1 | 1 | **1** (cheaper) | — | 0 |
| 2 | 5 | 1 | 4 | 4 |
| 3 | 3 | 1 | 2 | 4 |
| 4 | 6 | 1 | **5** | 5 |
| 5 | 4 | 1 | 3 | 5 |

## Complexity

| | Time | Space |
| --- | --- | --- |
| One pass (optimal) | `O(n)` | `O(1)` |
| Brute force (try every pair) | `O(n²)` | `O(1)` |

- **Time `O(n)`** — each day is visited once.
- **Space `O(1)`** — only two integers are kept.

## Edge cases

- **Strictly decreasing prices** — the buy day keeps moving forward and `best`
  stays `0`, which is the required answer.
- **Single element** — no future day exists, so the loop body never runs and we
  return `0`.
- **Flat prices** (`[3, 3, 3]`) — every trade has profit `0`.
- **Cheapest price in the middle** — the running minimum handles it; we simply
  reset `left` and keep comparing later days.
- **Best trade at the very end** — the last iteration is still checked.

## Solution (`solution.py`)

```python
def max_profit(prices: List[int]) -> int:
    left = 0
    best = 0
    for right in range(1, len(prices)):
        if prices[right] < prices[left]:
            left = right
        else:
            best = max(best, prices[right] - prices[left])
    return best
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py best_time_to_buy_and_sell_stock

# same tests through pytest
pytest topics/03_sliding_window/best_time_to_buy_and_sell_stock -v

# your own case, one-shot
python3 run.py best_time_to_buy_and_sell_stock -c '[[7,1,5,3,6,4]]'
```
