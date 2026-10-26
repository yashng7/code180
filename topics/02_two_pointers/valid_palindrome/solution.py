"""Valid Palindrome — Two Pointers.

A phrase is a palindrome if, after converting every uppercase letter to
lowercase and removing all non-alphanumeric characters, it reads the same
forward and backward. Return ``True`` if ``s`` is such a palindrome.

Time  O(n)  — each character is visited at most once by the two pointers.
Space O(1)  — only the two index pointers are stored.
"""


def is_palindrome(s: str) -> bool:
    """Return whether ``s`` is a palindrome ignoring case and punctuation."""
    left, right = 0, len(s) - 1
    while left < right:
        # Skip characters that are not letters or digits.
        while left < right and not s[left].isalnum():
            left += 1
        while left < right and not s[right].isalnum():
            right -= 1
        if s[left].lower() != s[right].lower():
            return False
        left += 1
        right -= 1
    return True


# NeetCode-style class wrapper; the loader prefers the top-level function.
class Solution:
    def isPalindrome(self, s: str) -> bool:
        return is_palindrome(s)


if __name__ == "__main__":
    print(is_palindrome("A man, a plan, a canal: Panama"))  # True
    print(is_palindrome("race a car"))                      # False
    print(is_palindrome(" "))                                # True
