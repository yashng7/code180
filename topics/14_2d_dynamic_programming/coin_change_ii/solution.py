"""Coin Change II — 2-D Dynamic Programming.

Return the number of **combinations** (order does not matter) of ``coins`` that
sum to ``amount``. Each coin may be used an unlimited number of times.

Unbounded knapsack: ``dp[a] += dp[a - coin]`` for each coin, amount ascending.
Iterating coins in the outer loop counts each combination once; iterating
amounts first would instead count permutations.

Time  O(amount * len(coins)) · Space O(amount).
"""
from typing import List


def change(amount: int, coins: List[int]) -> int:
    """Return the number of coin combinations summing to ``amount``."""
    dp = [0] * (amount + 1)
    dp[0] = 1  # one way to make 0: the empty combination
    for coin in coins:
        for total in range(coin, amount + 1):
            dp[total] += dp[total - coin]
    return dp[amount]


class Solution:
    def change(self, amount: int, coins: List[int]) -> int:
        return change(amount, coins)


if __name__ == "__main__":
    print(change(5, [1, 2, 5]))   # 4
    print(change(3, [2]))         # 0
    print(change(10, [10]))       # 1
