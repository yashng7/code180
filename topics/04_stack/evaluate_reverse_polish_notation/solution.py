"""Evaluate Reverse Polish Notation — Stack.

Evaluate an arithmetic expression given in Reverse Polish (postfix) notation.
Valid operators are ``+``, ``-``, ``*`` and ``/``; every operand is an integer
and division truncates toward zero.

Example
-------
    Input : tokens = ["2", "1", "+", "3", "*"]
    Output: 9              # (2 + 1) * 3

Time  O(n)  — each token is processed exactly once.
Space O(n)  — the stack holds the operands still awaiting an operator.
"""
from typing import List


def eval_rpn(tokens: List[str]) -> int:
    """Evaluate the postfix expression ``tokens`` and return the integer result."""
    stack: list[int] = []
    for token in tokens:
        if token == "+":
            b, a = stack.pop(), stack.pop()
            stack.append(a + b)
        elif token == "-":
            b, a = stack.pop(), stack.pop()
            stack.append(a - b)
        elif token == "*":
            b, a = stack.pop(), stack.pop()
            stack.append(a * b)
        elif token == "/":
            b, a = stack.pop(), stack.pop()
            stack.append(int(a / b))          # truncate toward zero, not floor
        else:
            stack.append(int(token))
    return stack[-1]


# NeetCode-style class wrapper. The loader prefers the top-level function.
class Solution:
    def evalRPN(self, tokens: List[str]) -> int:
        return eval_rpn(tokens)


if __name__ == "__main__":
    print(eval_rpn(["2", "1", "+", "3", "*"]))       # 9
    print(eval_rpn(["4", "13", "5", "/", "+"]))      # 6
    print(eval_rpn(["7", "-3", "/"]))                # -2
