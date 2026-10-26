"""Regular Expression Matching — 2-D Dynamic Programming.

Implement ``is_match(s, p)`` supporting ``.`` (any single character) and ``*``
(zero or more of the **preceding** element). The match must cover the whole
string.

``dp[i][j]`` = does ``p[:j]`` match ``s[:i]``?

    dp[0][j] = dp[0][j-2]                    if p[j-1] == '*'
    if p[j-1] == '*':
        dp[i][j] = dp[i][j-2]                (zero copies of p[j-2])
                 or (dp[i-1][j] and (p[j-2] == s[i-1] or p[j-2] == '.'))
    else:
        dp[i][j] = dp[i-1][j-1] and (p[j-1] == '.' or p[j-1] == s[i-1])

Time  O(m * n) · Space O(m * n) (reducible to O(n) with a rolling row).
"""


def is_match(s: str, p: str) -> bool:
    """Return True if pattern ``p`` fully matches ``s``."""
    m, n = len(s), len(p)
    dp = [[False] * (n + 1) for _ in range(m + 1)]
    dp[0][0] = True
    for j in range(2, n + 1):  # "a*" can match the empty string
        if p[j - 1] == "*":
            dp[0][j] = dp[0][j - 2]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if p[j - 1] == "*":
                dp[i][j] = dp[i][j - 2] or (
                    dp[i - 1][j] and (p[j - 2] == s[i - 1] or p[j - 2] == ".")
                )
            elif p[j - 1] == "." or p[j - 1] == s[i - 1]:
                dp[i][j] = dp[i - 1][j - 1]
    return dp[m][n]


class Solution:
    def isMatch(self, s: str, p: str) -> bool:
        return is_match(s, p)


if __name__ == "__main__":
    print(is_match("aa", "a"))              # False
    print(is_match("aa", "a*"))             # True
    print(is_match("aab", "c*a*b"))         # True
