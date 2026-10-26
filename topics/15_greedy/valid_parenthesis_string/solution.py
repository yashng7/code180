"""Valid Parenthesis String — Greedy.

Given a string of ``'('``, ``')'`` and ``'*'`` (where ``'*'`` may be an open, a
close, or empty), return whether it can be a valid parenthesis string.

Example
-------
    Input : s = "(*))"
    Output: True

Time  O(n)  — one pass.
Space O(1)  — two balance bounds.
"""


def check_valid_string(s: str) -> bool:
    """Return whether ``s`` can be balanced (tracking a range of balances)."""
    lo = 0      # smallest possible open count (treat '*' as ')' when helpful)
    hi = 0      # largest possible open count (treat '*' as '(')
    for char in s:
        if char == "(":
            lo += 1
            hi += 1
        elif char == ")":
            lo = max(lo - 1, 0)
            hi -= 1
        else:                       # '*'
            lo = max(lo - 1, 0)
            hi += 1
        if hi < 0:                  # too many ')' — impossible to recover
            return False
    # Feasible iff zero is within the achievable balance range.
    return lo == 0


if __name__ == "__main__":
    print(check_valid_string("()"))    # True
    print(check_valid_string("(*))"))  # True
    print(check_valid_string("((*)"))  # True
    print(check_valid_string("(((*)")) # False
