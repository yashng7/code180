"""Partition Equal Subset Sum — 1-D Dynamic Programming.

Return whether ``nums`` can be split into two subsets with equal sums.

This is 0/1 subset-sum to ``total // 2``:
``dp[t] = dp[t] or dp[t - num]`` for each number.

Time  O(n * total) · Space O(total).
"""
from typing import List


def can_partition(nums: List[int]) -> bool:
    """Return True if ``nums`` can be partitioned into two equal-sum subsets."""
    total = sum(nums)
    if total % 2 != 0:
        return False  # an odd total can never be split in half

    target = total // 2
    dp = [False] * (target + 1)
    dp[0] = True  # a sum of 0 is always reachable (take nothing)
    for num in nums:
        # Descending order keeps each number usable at most once (0/1 knapsack).
        for total_so_far in range(target, num - 1, -1):
            dp[total_so_far] = dp[total_so_far] or dp[total_so_far - num]
    return dp[target]


class Solution:
    def canPartition(self, nums: List[int]) -> bool:
        return can_partition(nums)


if __name__ == "__main__":
    print(can_partition([1, 5, 11, 5]))  # True
    print(can_partition([1, 2, 3, 5]))   # False
