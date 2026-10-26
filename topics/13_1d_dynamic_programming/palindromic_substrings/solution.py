"""Palindromic Substrings — 1-D Dynamic Programming.

Return the number of palindromic substrings of ``s``. Substrings with different
start/end indices are counted separately even if their content is identical.

Expand around each of the ``2n - 1`` centres, counting each successful step.

Time  O(n^2) · Space O(1).
"""


def count_substrings(s: str) -> int:
    """Return how many substrings of ``s`` are palindromes."""
    total = 0

    def expand(left: int, right: int) -> int:
        count = 0
        while left >= 0 and right < len(s) and s[left] == s[right]:
            count += 1       # s[left..right] is a palindrome
            left -= 1
            right += 1
        return count

    for centre in range(len(s)):
        total += expand(centre, centre)      # odd-length palindromes
        total += expand(centre, centre + 1)  # even-length palindromes
    return total


class Solution:
    def countSubstrings(self, s: str) -> int:
        return count_substrings(s)


if __name__ == "__main__":
    print(count_substrings("abc"))   # 3
    print(count_substrings("aaa"))   # 6
