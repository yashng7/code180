"""House Robber — 1-D Dynamic Programming.

Given ``nums[i]`` the money in house ``i``, return the maximum amount you can
rob without robbing two **adjacent** houses.

``dp[i] = max(dp[i-1], dp[i-2] + nums[i])``.

Time  O(n) · Space O(1)  (two rolling variables).
"""
from typing import List


def rob(nums: List[int]) -> int:
    """Return the maximum sum of non-adjacent elements."""
    # prev2 = dp[i-2], prev1 = dp[i-1] over the houses seen so far.
    prev2, prev1 = 0, 0
    for value in nums:
        prev2, prev1 = prev1, max(prev1, prev2 + value)
    return prev1


class Solution:
    def rob(self, nums: List[int]) -> int:
        return rob(nums)


if __name__ == "__main__":
    print(rob([1, 2, 3, 1]))       # 4
    print(rob([2, 7, 9, 3, 1]))    # 12
