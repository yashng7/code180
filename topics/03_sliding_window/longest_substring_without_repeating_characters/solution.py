"""Longest Substring Without Repeating Characters — Sliding Window.

Given a string ``s``, return the length of the longest substring that contains
no repeating characters.

Example
-------
    Input : s = "abcabcbb"
    Output: 3                  # "abc"

Time  O(n)  — each character enters and leaves the window once.
Space O(min(n, σ))  — the last-seen map holds at most the distinct characters.
"""
from typing import Dict


def length_of_longest_substring(s: str) -> int:
    """Return the length of the longest substring without duplicate characters."""
    last: Dict[str, int] = {}   # character -> index where it was last seen
    left = 0                    # left edge of the current window
    best = 0
    for right, ch in enumerate(s):
        # Only shrink if the duplicate sits inside the current window.
        if ch in last and last[ch] >= left:
            left = last[ch] + 1
        last[ch] = right
        best = max(best, right - left + 1)
    return best


# NeetCode-style class wrapper. Both forms work with the runner; the loader
# prefers the top-level function above.
class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        return length_of_longest_substring(s)


if __name__ == "__main__":
    print(length_of_longest_substring("abcabcbb"))   # 3
    print(length_of_longest_substring("bbbbb"))      # 1
    print(length_of_longest_substring("pwwkew"))     # 3
