"""Burst Balloons — 2-D Dynamic Programming (interval DP).

Bursting every balloon in some order pays ``left * k * right`` coins, where
``left`` and ``right`` are the balloons adjacent to ``k`` at that moment.
Return the maximum total coins.

Pad both ends with a virtual balloon of value ``1``. For an interval
``(left, right)``, choose which balloon ``k`` is burst **last** inside it:

    dp[left][right] = max over k of
        nums[left] * nums[k] * nums[right] + dp[left][k] + dp[k][right]

Choosing the last balloon makes the two sides independent sub-problems.

Time  O(n^3) · Space O(n^2).
"""
from typing import List


def max_coins(nums: List[int]) -> int:
    """Return the maximum coins obtainable by bursting all balloons."""
    arr = [1] + nums + [1]
    n = len(arr)
    dp = [[0] * n for _ in range(n)]
    for length in range(2, n):              # interval width (open boundaries)
        for left in range(0, n - length):
            right = left + length
            for k in range(left + 1, right):  # k is the last balloon burst
                coins = (
                    arr[left] * arr[k] * arr[right]
                    + dp[left][k]
                    + dp[k][right]
                )
                if coins > dp[left][right]:
                    dp[left][right] = coins
    return dp[0][n - 1]


class Solution:
    def maxCoins(self, nums: List[int]) -> int:
        return max_coins(nums)


if __name__ == "__main__":
    print(max_coins([3, 1, 5, 8]))  # 167
    print(max_coins([1, 5]))        # 10
    print(max_coins([5]))           # 5
