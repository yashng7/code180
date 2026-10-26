"""Longest Repeating Character Replacement — Sliding Window.

Given a string ``s`` and an integer ``k``, return the length of the longest
substring that can be turned into a string of a single repeated character by
replacing at most ``k`` of its characters.

Example
-------
    Input : s = "AABABBA", k = 1
    Output: 4                  # replace the middle "B" -> "AAB[AA]BA"

Time  O(n)  — each character enters and leaves the window once.
Space O(1)  — a 26-slot letter count.
"""
from typing import Dict


def character_replacement(s: str, k: int) -> int:
    """Longest window replaceable into one repeated character with <= k changes."""
    count: Dict[str, int] = {}
    left = 0
    best = 0
    max_count = 0           # most frequent letter inside the window
    for right, ch in enumerate(s):
        count[ch] = count.get(ch, 0) + 1
        max_count = max(max_count, count[ch])
        # Replacements needed = window length - occurrences of the majority.
        while (right - left + 1) - max_count > k:
            count[s[left]] -= 1
            left += 1
        best = max(best, right - left + 1)
    return best


# NeetCode-style class wrapper. Both forms work with the runner; the loader
# prefers the top-level function above.
class Solution:
    def characterReplacement(self, s: str, k: int) -> int:
        return character_replacement(s, k)


if __name__ == "__main__":
    print(character_replacement("ABAB", 2))      # 4
    print(character_replacement("AABABBA", 1))   # 4
    print(character_replacement("BAAAB", 2))     # 5
