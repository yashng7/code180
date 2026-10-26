"""Generate Parentheses — Backtracking with a stack-like prefix.

Given ``n`` pairs of parentheses, generate every combination of well-formed
parentheses.

Example
-------
    Input : n = 3
    Output: ["((()))", "(()())", "(())()", "()(())", "()()()"]

Time  O(4^n / sqrt(n))  — the number of results is the n-th Catalan number.
Space O(n)              — recursion depth plus the prefix under construction.
"""
from typing import List


def generate_parenthesis(n: int) -> List[str]:
    """Return all well-formed strings using exactly ``n`` pairs of parentheses."""
    result: List[str] = []

    def backtrack(current: str, opened: int, closed: int) -> None:
        if len(current) == 2 * n:                 # used all n pairs
            result.append(current)
            return
        if opened < n:                            # may still open one
            backtrack(current + "(", opened + 1, closed)
        if closed < opened:                       # a close keeps it well-formed
            backtrack(current + ")", opened, closed + 1)

    backtrack("", 0, 0)
    return result


# NeetCode-style class wrapper. The loader prefers the top-level function.
class Solution:
    def generateParenthesis(self, n: int) -> List[str]:
        return generate_parenthesis(n)


if __name__ == "__main__":
    print(generate_parenthesis(1))   # ["()"]
    print(generate_parenthesis(3))   # 5 strings
