"""Best Time to Buy and Sell Stock — Sliding Window.

Given an array ``prices`` where ``prices[i]`` is the price of a stock on day
``i``, return the maximum profit from one buy followed by one later sell.
Return 0 if no profit is possible.

Example
-------
    Input : prices = [7, 1, 5, 3, 6, 4]
    Output: 5                 # buy at 1, sell at 6

Time  O(n)  — one pass over the prices.
Space O(1)  — only the running buy day and best profit.
"""
from typing import List


def max_profit(prices: List[int]) -> int:
    """Return the best profit from a single buy-then-sell transaction."""
    left = 0            # cheapest buy day seen so far (window's left edge)
    best = 0
    for right in range(1, len(prices)):
        if prices[right] < prices[left]:
            left = right                       # found a cheaper buy day
        else:
            best = max(best, prices[right] - prices[left])
    return best


# NeetCode-style class wrapper. Both forms work with the runner; the loader
# prefers the top-level function above.
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        return max_profit(prices)


if __name__ == "__main__":
    print(max_profit([7, 1, 5, 3, 6, 4]))   # 5
    print(max_profit([7, 6, 4, 3, 1]))      # 0
    print(max_profit([1, 2, 3, 4, 5]))      # 4
