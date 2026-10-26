"""Palindrome Partitioning — Backtracking.

Return every way to split ``s`` so that each piece is a palindrome.

Time  O(n * 2^n)  — up to 2^(n-1) partitions, each copied in O(n)
Space O(n)        — recursion depth plus the current path
"""
from typing import List


def partition(s: str) -> List[List[str]]:
    result: List[List[str]] = []
    path: List[str] = []

    def is_palindrome(left: int, right: int) -> bool:
        while left < right:
            if s[left] != s[right]:
                return False
            left += 1
            right -= 1
        return True

    def backtrack(start: int) -> None:
        if start == len(s):
            result.append(path[:])          # a complete partition
            return
        for end in range(start, len(s)):
            if not is_palindrome(start, end):
                continue                    # prune: non-palindromic prefix
            path.append(s[start:end + 1])   # choose
            backtrack(end + 1)              # recurse
            path.pop()                      # un-choose

    backtrack(0)
    return result


if __name__ == "__main__":
    print(partition("aab"))   # [['a', 'a', 'b'], ['aa', 'b']]
