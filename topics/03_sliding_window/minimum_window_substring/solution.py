"""Minimum Window Substring — Sliding Window.

Given strings ``s`` and ``t``, return the shortest substring of ``s`` that
contains every character of ``t`` (including multiplicities). Return ``""`` if
no such window exists. The answer is guaranteed to be unique.

Example
-------
    Input : s = "ADOBECODEBANC", t = "ABC"
    Output: "BANC"

Time  O(n + m)  — each character of s enters and leaves the window once.
Space O(n + m)  — the two character-count maps.
"""
from typing import Dict


def min_window(s: str, t: str) -> str:
    """Shortest substring of s covering all characters of t (with counts)."""
    if not t or not s or len(t) > len(s):
        return ""

    need: Dict[str, int] = {}
    for ch in t:
        need[ch] = need.get(ch, 0) + 1
    required = len(need)            # distinct characters that must be satisfied

    window: Dict[str, int] = {}
    formed = 0                      # distinct characters currently satisfied
    left = 0
    best: tuple[int, int] | None = None   # (start, length)

    for right, ch in enumerate(s):
        window[ch] = window.get(ch, 0) + 1
        if ch in need and window[ch] == need[ch]:
            formed += 1

        # Contract from the left while the window still covers t.
        while formed == required:
            if best is None or right - left + 1 < best[1]:
                best = (left, right - left + 1)
            outgoing = s[left]
            window[outgoing] -= 1
            if outgoing in need and window[outgoing] < need[outgoing]:
                formed -= 1
            left += 1

    if best is None:
        return ""
    start, length = best
    return s[start:start + length]


# NeetCode-style class wrapper. Both forms work with the runner; the loader
# prefers the top-level function above.
class Solution:
    def minWindow(self, s: str, t: str) -> str:
        return min_window(s, t)


if __name__ == "__main__":
    print(min_window("ADOBECODEBANC", "ABC"))   # BANC
    print(min_window("a", "a"))                 # a
    print(min_window("a", "aa"))                # ""
