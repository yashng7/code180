"""Coin Change — 1-D Dynamic Programming.

Given coin denominations ``coins`` and a target ``amount``, return the fewest
coins that sum to ``amount``, or ``-1`` if it is impossible.

Unbounded knapsack: ``dp[a] = 1 + min(dp[a - c])`` over all usable coins ``c``.

Time  O(amount * len(coins)) · Space O(amount).
"""
from typing import List


def coin_change(coins: List[int], amount: int) -> int:
    """Return the minimum number of coins summing to ``amount`` (or ``-1``)."""
    unreachable = amount + 1
    dp = [unreachable] * (amount + 1)
    dp[0] = 0
    for total in range(1, amount + 1):
        for coin in coins:
            if coin <= total:
                dp[total] = min(dp[total], dp[total - coin] + 1)
    return -1 if dp[amount] == unreachable else dp[amount]


class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        return coin_change(coins, amount)


if __name__ == "__main__":
    print(coin_change([1, 2, 5], 11))   # 3
    print(coin_change([2], 3))          # -1
    print(coin_change([1], 0))          # 0
