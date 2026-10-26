"""Word Break — 1-D Dynamic Programming.

Return whether ``s`` can be segmented into words from ``word_dict``.

``dp[i]`` is True when ``s[:i]`` is segmentable:
``dp[i] = any(dp[j] and s[j:i] in dict for j < i)``.

Time  O(n^2) (hash lookups are O(1) average) · Space O(n).
"""
from typing import List


def word_break(s: str, word_dict: List[str]) -> bool:
    """Return True if ``s`` is a concatenation of dictionary words."""
    words = set(word_dict)
    n = len(s)
    dp = [False] * (n + 1)
    dp[0] = True  # the empty prefix is always segmentable
    for end in range(1, n + 1):
        for start in range(end):
            if dp[start] and s[start:end] in words:
                dp[end] = True
                break
    return dp[n]


class Solution:
    def wordBreak(self, s: str, wordDict: List[str]) -> bool:
        return word_break(s, wordDict)


if __name__ == "__main__":
    print(word_break("leetcode", ["leet", "code"]))          # True
    print(word_break("catsandog", ["cats", "dog", "sand", "and", "cat"]))  # False
