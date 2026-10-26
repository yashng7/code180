"""Letter Combinations of a Phone Number — Backtracking.

Return every letter combination a digit string could spell, using the classic
phone keypad mapping.

Time  O(4^n * n)  — at most 4 letters per digit, each result is length n
Space O(n)        — recursion depth plus the current path
"""
from typing import List

_DIGITS = {
    "2": "abc",
    "3": "def",
    "4": "ghi",
    "5": "jkl",
    "6": "mno",
    "7": "pqrs",
    "8": "tuv",
    "9": "wxyz",
}


def letter_combinations(digits: str) -> List[str]:
    if not digits:
        return []                           # official convention: no digits -> []
    result: List[str] = []
    path: List[str] = []

    def backtrack(index: int) -> None:
        if index == len(digits):
            result.append("".join(path))    # a complete combination
            return
        for ch in _DIGITS[digits[index]]:
            path.append(ch)                 # choose
            backtrack(index + 1)            # recurse
            path.pop()                      # un-choose

    backtrack(0)
    return result


if __name__ == "__main__":
    print(letter_combinations("23"))
