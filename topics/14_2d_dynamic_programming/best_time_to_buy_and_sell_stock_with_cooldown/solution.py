"""Best Time to Buy and Sell Stock with Cooldown — 2-D Dynamic Programming.

Return the maximum profit from any number of transactions (buy before sell)
where after a sale the next day must be skipped (cooldown).

Three states after each day:
  * ``hold`` — holding a stock;
  * ``sold`` — sold *today* (so tomorrow is a cooldown);
  * ``rest`` — no stock and free to buy.

    hold = max(hold, rest - price)
    sold = hold + price            (hold from the previous day)
    rest = max(rest, sold)

Time  O(n) · Space O(1).
"""
from typing import List


def max_profit_with_cooldown(prices: List[int]) -> int:
    """Return the best profit with a one-day cooldown after each sale."""
    if not prices:
        return 0
    neg_inf = float("-inf")
    hold = -prices[0]  # bought on day 0
    sold = neg_inf      # cannot have sold before the first day
    rest = 0            # never traded
    for price in prices[1:]:
        prev_hold, prev_sold, prev_rest = hold, sold, rest
        hold = max(prev_hold, prev_rest - price)
        sold = prev_hold + price
        rest = max(prev_rest, prev_sold)
    return max(sold, rest)


class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        return max_profit_with_cooldown(prices)


if __name__ == "__main__":
    print(max_profit_with_cooldown([1, 2, 3, 0, 2]))  # 3
    print(max_profit_with_cooldown([1]))              # 0
    print(max_profit_with_cooldown([1, 2]))           # 1
