"""Longest Increasing Subsequence — 1-D Dynamic Programming.

Return the length of the longest strictly increasing subsequence of ``nums``.

``dp[i] = 1 + max(dp[j] for j < i if nums[j] < nums[i])``.

Time  O(n^2) · Space O(n).  (Patience sorting does it in O(n log n).)
"""
from typing import List


def length_of_lis(nums: List[int]) -> int:
    """Return the length of the longest strictly increasing subsequence."""
    if not nums:
        return 0
    dp = [1] * len(nums)  # every element alone is an increasing subsequence
    best = 1
    for i in range(len(nums)):
        for j in range(i):
            if nums[j] < nums[i]:
                dp[i] = max(dp[i], dp[j] + 1)
        best = max(best, dp[i])
    return best


class Solution:
    def lengthOfLIS(self, nums: List[int]) -> int:
        return length_of_lis(nums)


if __name__ == "__main__":
    print(length_of_lis([10, 9, 2, 5, 3, 7, 101, 18]))  # 4
    print(length_of_lis([7, 7, 7, 7, 7]))               # 1
