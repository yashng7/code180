"""Valid Parentheses — Stack.

Given a string ``s`` containing only the characters ``()[]{}``, decide whether
the brackets are correctly opened and closed in the right order.

Example
-------
    Input : s = "()[]{}"
    Output: True

Time  O(n)  — every character is pushed or popped at most once.
Space O(n)  — an all-opening string leaves n chars on the stack.
"""
from typing import Dict


def is_valid(s: str) -> bool:
    """Return True when every bracket in ``s`` is properly matched."""
    # closing bracket -> matching opening bracket
    pairs: Dict[str, str] = {")": "(", "]": "[", "}": "{"}
    stack: list[str] = []
    for char in s:
        if char in pairs:                     # a closing bracket
            if not stack or stack.pop() != pairs[char]:
                return False
        else:                                 # an opening bracket
            stack.append(char)
    return not stack                          # all openers were closed


# NeetCode-style class wrapper. The loader prefers the top-level function.
class Solution:
    def isValid(self, s: str) -> bool:
        return is_valid(s)


if __name__ == "__main__":
    print(is_valid("()[]{}"))   # True
    print(is_valid("(]"))       # False
    print(is_valid("([)]"))     # False
