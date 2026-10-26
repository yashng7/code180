"""Decode Ways — 1-D Dynamic Programming.

A message of digits is decoded with ``'1' -> 'A' … '26' -> 'Z'``. Return the
number of ways to decode the string ``s``.

Let ``dp[i]`` be the number of ways to decode the prefix ``s[:i]``:
``dp[i] = (dp[i-1] if s[i-1] in '1'..'9') + (dp[i-2] if s[i-2:i] in 10..26)``.

Time  O(n) · Space O(1)  (two rolling variables).
"""


def num_decodings(s: str) -> int:
    """Return the number of ways to decode ``s``."""
    if not s:
        return 0

    # prev2 = dp[i-2], prev1 = dp[i-1]; dp[0] = 1 (the empty prefix).
    prev2 = 1
    prev1 = 0 if s[0] == "0" else 1
    for i in range(2, len(s) + 1):
        single = 1 <= int(s[i - 1]) <= 9
        pair = 10 <= int(s[i - 2 : i]) <= 26
        current = (prev1 if single else 0) + (prev2 if pair else 0)
        prev2, prev1 = prev1, current
    return prev1


class Solution:
    def numDecodings(self, s: str) -> int:
        return num_decodings(s)


if __name__ == "__main__":
    print(num_decodings("12"))    # 2
    print(num_decodings("226"))   # 3
    print(num_decodings("06"))    # 0
