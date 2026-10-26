"""Unique Paths — 2-D Dynamic Programming.

A robot starts at the top-left of an ``m x n`` grid and can only move right or
down. Return the number of distinct paths to the bottom-right corner.

``dp[i][j] = dp[i-1][j] + dp[i][j-1]`` — the ways into a cell come from above
and from the left. The first row and column are all ``1`` (a single straight
path). Rolling one row keeps only ``O(n)`` memory.

Time  O(m * n) · Space O(n).
"""


def unique_paths(m: int, n: int) -> int:
    """Return the number of right/down paths across an ``m x n`` grid."""
    dp = [1] * n  # dp[j] = ways to reach column j of the current row
    for _ in range(1, m):
        for j in range(1, n):
            dp[j] += dp[j - 1]  # above (old dp[j]) + left (new dp[j-1])
    return dp[n - 1]


class Solution:
    def uniquePaths(self, m: int, n: int) -> int:
        return unique_paths(m, n)


if __name__ == "__main__":
    print(unique_paths(3, 7))   # 28
    print(unique_paths(3, 2))   # 3
    print(unique_paths(1, 1))   # 1
