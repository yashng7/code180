"""Interleaving String — 2-D Dynamic Programming.

Return whether ``s3`` can be formed by interleaving ``s1`` and ``s2`` while
preserving the order of each.

``dp[i][j]`` = can ``s1[:i]`` and ``s2[:j]`` interleave to form
``s3[:i+j]``? The last character of ``s3[:i+j]`` must come from the last
character of one of the prefixes:

    dp[i][j] = (dp[i-1][j] and s1[i-1] == s3[i+j-1])
            or (dp[i][j-1] and s2[j-1] == s3[i+j-1])

Rolling one row keeps ``O(len(s2))`` memory.

Time  O(m * n) · Space O(n).
"""


def is_interleave(s1: str, s2: str, s3: str) -> bool:
    """Return True if ``s3`` is an interleaving of ``s1`` and ``s2``."""
    m, n = len(s1), len(s2)
    if m + n != len(s3):
        return False
    dp = [False] * (n + 1)
    dp[0] = True
    for j in range(1, n + 1):  # first row: only s2 used
        dp[j] = dp[j - 1] and s2[j - 1] == s3[j - 1]
    for i in range(1, m + 1):
        dp[0] = dp[0] and s1[i - 1] == s3[i - 1]
        for j in range(1, n + 1):
            from_s1 = dp[j] and s1[i - 1] == s3[i + j - 1]
            from_s2 = dp[j - 1] and s2[j - 1] == s3[i + j - 1]
            dp[j] = from_s1 or from_s2
    return dp[n]


class Solution:
    def isInterleave(self, s1: str, s2: str, s3: str) -> bool:
        return is_interleave(s1, s2, s3)


if __name__ == "__main__":
    print(is_interleave("aabcc", "dbbca", "aadbbcbcac"))  # True
    print(is_interleave("aabcc", "dbbca", "aadbbbaccc"))  # False
    print(is_interleave("", "", ""))                      # True
