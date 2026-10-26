"""Target Sum — 2-D Dynamic Programming.

Assign ``+`` or ``-`` to every number in ``nums`` and count the expressions
that evaluate to ``target``.

Splitting the numbers into those with ``+`` and those with ``-`` gives

    (sum of plus) - (sum of minus) = target
    (sum of plus) = (sum(nums) + target) / 2

so the task becomes a **subset-sum count** with ``dp[s]`` = ways to pick a
subset summing to ``s``. Zero-valued numbers double the count each time.

Time  O(n * sum(nums)) · Space O(sum(nums)).
"""
from typing import List


def find_target_sum_ways(nums: List[int], target: int) -> int:
    """Return the number of +/- assignments whose sum equals ``target``."""
    total = sum(nums)
    if abs(target) > total or (total + target) % 2:
        return 0
    goal = (total + target) // 2
    dp = [0] * (goal + 1)
    dp[0] = 1
    for num in nums:
        for subtotal in range(goal, num - 1, -1):
            dp[subtotal] += dp[subtotal - num]
    return dp[goal]


class Solution:
    def findTargetSumWays(self, nums: List[int], target: int) -> int:
        return find_target_sum_ways(nums, target)


if __name__ == "__main__":
    print(find_target_sum_ways([1, 1, 1, 1, 1], 3))  # 5
    print(find_target_sum_ways([1], 1))              # 1
    print(find_target_sum_ways([1, 0], 1))           # 2
