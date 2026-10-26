"""Longest Palindromic Substring — 1-D Dynamic Programming.

Return the longest substring of ``s`` that is a palindrome. Ties may be broken
arbitrarily (the shared ``longest_palindrome`` checker accepts any of them).

Expand around each of the ``2n - 1`` centres.

Time  O(n^2) · Space O(1).
"""


def longest_palindrome(s: str) -> str:
    """Return any longest palindromic substring of ``s``."""
    if len(s) < 2:
        return s

    best_start, best_len = 0, 1

    def expand(left: int, right: int) -> None:
        nonlocal best_start, best_len
        while left >= 0 and right < len(s) and s[left] == s[right]:
            if right - left + 1 > best_len:
                best_start, best_len = left, right - left + 1
            left -= 1
            right += 1

    for centre in range(len(s)):
        expand(centre, centre)      # odd-length palindrome
        expand(centre, centre + 1)  # even-length palindrome
    return s[best_start : best_start + best_len]


class Solution:
    def longestPalindrome(self, s: str) -> str:
        return longest_palindrome(s)


if __name__ == "__main__":
    print(longest_palindrome("babad"))   # "bab" (or "aba")
    print(longest_palindrome("cbbd"))    # "bb"
