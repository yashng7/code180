"""Longest Common Subsequence — 2-D Dynamic Programming.

Return the length of the longest subsequence common to ``text1`` and ``text2``.

``dp[i][j]`` = LCS of ``text1[:i]`` and ``text2[:j]``:

    dp[i][j] = dp[i-1][j-1] + 1                 if text1[i-1] == text2[j-1]
             = max(dp[i-1][j], dp[i][j-1])      otherwise

Rolling one row over the shorter string keeps ``O(min(m, n))`` memory.

Time  O(m * n) · Space O(min(m, n)).
"""


def longest_common_subsequence(text1: str, text2: str) -> int:
    """Return the length of the longest common subsequence."""
    if len(text2) > len(text1):
        text1, text2 = text2, text1  # keep the shorter string on the dp row
    dp = [0] * (len(text2) + 1)
    for c1 in text1:
        prev = 0  # dp[i-1][j-1] from the previous row
        for j, c2 in enumerate(text2, start=1):
            saved = dp[j]  # dp[i-1][j] before overwriting
            if c1 == c2:
                dp[j] = prev + 1
            else:
                dp[j] = max(dp[j], dp[j - 1])
            prev = saved
    return dp[len(text2)]


class Solution:
    def longestCommonSubsequence(self, text1: str, text2: str) -> int:
        return longest_common_subsequence(text1, text2)


if __name__ == "__main__":
    print(longest_common_subsequence("abcde", "ace"))  # 3
    print(longest_common_subsequence("abc", "abc"))    # 3
    print(longest_common_subsequence("abc", "def"))    # 0
