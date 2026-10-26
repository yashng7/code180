"""House Robber II — 1-D Dynamic Programming.

The houses are arranged in a **circle**, so the first and last houses are
adjacent. Return the maximum sum of non-adjacent houses.

Answer = ``max(rob(nums[1:]), rob(nums[:-1]))`` (skip the first or the last),
with ``n == 1`` handled separately.

Time  O(n) · Space O(1).
"""
from typing import List


def _rob_linear(nums: List[int]) -> int:
    """House Robber on a straight row (rolling variables)."""
    prev2, prev1 = 0, 0
    for value in nums:
        prev2, prev1 = prev1, max(prev1, prev2 + value)
    return prev1


def rob2(nums: List[int]) -> int:
    """Return the maximum haul when the houses form a circle."""
    if len(nums) == 1:
        return nums[0]
    # Either the first house is excluded or the last house is excluded.
    return max(_rob_linear(nums[1:]), _rob_linear(nums[:-1]))


class Solution:
    def rob(self, nums: List[int]) -> int:
        return rob2(nums)


if __name__ == "__main__":
    print(rob2([2, 3, 2]))       # 3
    print(rob2([1, 2, 3, 1]))    # 4
    print(rob2([1, 2, 3]))       # 3
