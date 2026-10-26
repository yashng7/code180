"""Distinct Subsequences — 2-D Dynamic Programming.

Return the number of distinct subsequences of ``s`` that equal ``t``.

``dp[i][j]`` = number of ways to form ``t[:j]`` from ``s[:i]``:

    dp[i][j] = dp[i-1][j]                                   (skip s[i-1])
             + dp[i-1][j-1]   if s[i-1] == t[j-1]           (use s[i-1])

``dp[i][0] = 1`` (the empty target). Rolling one row and walking ``j``
downwards keeps ``O(len(t))`` memory.

Time  O(m * n) · Space O(n).
"""


def num_distinct(s: str, t: str) -> int:
    """Return the number of distinct subsequences of ``s`` equal to ``t``."""
    n = len(t)
    dp = [0] * (n + 1)
    dp[0] = 1
    for i in range(1, len(s) + 1):
        ch = s[i - 1]
        for j in range(n, 0, -1):
            if ch == t[j - 1]:
                dp[j] += dp[j - 1]
    return dp[n]


class Solution:
    def numDistinct(self, s: str, t: str) -> int:
        return num_distinct(s, t)


if __name__ == "__main__":
    print(num_distinct("rabbbit", "rabbit"))  # 3
    print(num_distinct("babgbag", "bag"))     # 5
    print(num_distinct("abc", ""))            # 1
