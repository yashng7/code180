"""Edit Distance — 2-D Dynamic Programming.

Return the minimum number of insertions, deletions and replacements needed to
turn ``word1`` into ``word2``.

``dp[i][j]`` = edit distance between ``word1[:i]`` and ``word2[:j]``:

    dp[i][0] = i,  dp[0][j] = j
    dp[i][j] = dp[i-1][j-1]                    if word1[i-1] == word2[j-1]
             = 1 + min(dp[i-1][j],      # delete
                       dp[i][j-1],      # insert
                       dp[i-1][j-1])    # replace

Rolling one row keeps ``O(n)`` memory.

Time  O(m * n) · Space O(n).
"""


def min_distance(word1: str, word2: str) -> int:
    """Return the Levenshtein distance between ``word1`` and ``word2``."""
    n = len(word2)
    dp = list(range(n + 1))  # row 0: distance from "" to word2[:j]
    for i in range(1, len(word1) + 1):
        prev = dp[0]      # dp[i-1][j-1]
        dp[0] = i         # dp[i][0]
        for j in range(1, n + 1):
            saved = dp[j]  # dp[i-1][j]
            if word1[i - 1] == word2[j - 1]:
                dp[j] = prev
            else:
                dp[j] = 1 + min(prev, saved, dp[j - 1])
            prev = saved
    return dp[n]


class Solution:
    def minDistance(self, word1: str, word2: str) -> int:
        return min_distance(word1, word2)


if __name__ == "__main__":
    print(min_distance("horse", "ros"))              # 3
    print(min_distance("intention", "execution"))   # 5
    print(min_distance("", ""))                      # 0
