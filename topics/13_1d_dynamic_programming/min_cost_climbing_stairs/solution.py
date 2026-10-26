"""Min Cost Climbing Stairs — 1-D Dynamic Programming.

Given ``cost[i]``, the fee to stand on step ``i``, return the minimum cost to
reach the top (index ``n``). From a step you may climb one or two steps, and
you may start at step 0 or step 1.

``dp[i]`` = cheapest cost to reach step ``i``:
``dp[i] = min(dp[i-1] + cost[i-1], dp[i-2] + cost[i-2])`` with
``dp[0] = dp[1] = 0``.

Time  O(n) · Space O(1)  (two rolling variables).
"""
from typing import List


def min_cost_climbing_stairs(cost: List[int]) -> int:
    """Return the minimum cost to reach the top of the staircase."""
    # dp[i] is the cost to *reach* step i; reaching 0 or 1 is free.
    prev2, prev1 = 0, 0  # dp[i-2], dp[i-1]
    for i in range(2, len(cost) + 1):
        prev2, prev1 = prev1, min(prev1 + cost[i - 1], prev2 + cost[i - 2])
    return prev1


class Solution:
    def minCostClimbingStairs(self, cost: List[int]) -> int:
        return min_cost_climbing_stairs(cost)


if __name__ == "__main__":
    print(min_cost_climbing_stairs([10, 15, 20]))                       # 15
    print(min_cost_climbing_stairs([1, 100, 1, 1, 1, 100, 1, 1, 100, 1]))  # 6
