"""Permutation in String — Sliding Window.

Given two strings ``s1`` and ``s2``, return ``True`` if some permutation of
``s1`` is a substring of ``s2``.

Example
-------
    Input : s1 = "ab", s2 = "eidbaooo"
    Output: True               # "ba" is a permutation of "ab"

Time  O(n)  — one pass over s2 with O(1) window comparisons.
Space O(1)  — two fixed 26-slot counters.
"""


def check_inclusion(s1: str, s2: str) -> bool:
    """True when a permutation of s1 appears as a contiguous substring of s2."""
    if len(s1) > len(s2):
        return False
    if not s1:
        return True

    need = [0] * 26
    window = [0] * 26
    for ch in s1:
        need[ord(ch) - ord("a")] += 1

    size = len(s1)
    for right, ch in enumerate(s2):
        window[ord(ch) - ord("a")] += 1
        if right >= size:                      # drop the character leaving the window
            window[ord(s2[right - size]) - ord("a")] -= 1
        if window == need:
            return True
    return False


# NeetCode-style class wrapper. Both forms work with the runner; the loader
# prefers the top-level function above.
class Solution:
    def checkInclusion(self, s1: str, s2: str) -> bool:
        return check_inclusion(s1, s2)


if __name__ == "__main__":
    print(check_inclusion("ab", "eidbaooo"))   # True
    print(check_inclusion("ab", "eidboaoo"))   # False
    print(check_inclusion("adc", "dcda"))      # True
