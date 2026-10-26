# Evaluate Reverse Polish Notation

**Topic:** Stack · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/evaluate-reverse-polish-notation/) · [NeetCode](https://neetcode.io/problems/evaluate-reverse-polish-notation)

## Problem

You are given an array of strings `tokens` representing an arithmetic
expression in **Reverse Polish Notation** (postfix). Evaluate it and return the
integer result.

- Valid operators are `+`, `-`, `*`, `/`.
- Each operand may be an integer or another expression.
- **Division truncates toward zero.**
- The expression is always valid and never divides by zero.

## Examples

| `tokens` | Output | Why |
| --- | --- | --- |
| `["2","1","+","3","*"]` | `9` | `(2 + 1) * 3` |
| `["4","13","5","/","+"]` | `6` | `4 + (13 / 5) = 4 + 2` |
| `["7","-3","/"]` | `-2` | `7 / -3` truncated toward zero |

## Intuition

In postfix notation an operator applies to the **two most recent operands**.
That "most recent first" access pattern is a stack: push numbers as we read
them, and when we hit an operator, pop its two arguments, compute, and push the
result back.

## Approach

1. Create an empty `stack`.
2. For each `token`:
   - if it is an operand, convert to `int` and push;
   - if it is an operator, pop `b` (right operand) then `a` (left operand),
     compute `a op b`, and push the result.
3. When the tokens run out, the single remaining value is the answer.

> **Order matters.** Subtraction and division are not commutative, so we must
> pop the right operand **first**: `b, a = stack.pop(), stack.pop()`.

> **Division.** Python's `//` floors (`-7 // 2 == -4`), which is wrong here.
> Use `int(a / b)` (or `int(a / b)` via float) to truncate toward zero.

## Walkthrough

`tokens = ["4", "13", "5", "/", "+"]`

| token | action | stack |
| --- | --- | --- |
| `4` | push | `[4]` |
| `13` | push | `[4, 13]` |
| `5` | push | `[4, 13, 5]` |
| `/` | `13 / 5 = 2` | `[4, 2]` |
| `+` | `4 + 2 = 6` | `[6]` |

Result `6`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Stack (optimal) | `O(n)` | `O(n)` |

- **Time `O(n)`** — a single pass; each operator resolves two stack entries.
- **Space `O(n)`** — in the worst case (many operands) the stack holds `O(n)`.

## Edge cases

- **Single operand** `["18"]` — return it directly; there are no operators.
- **Negative literals** `["-3", "4", "*"]` — `int("-3")` parses the sign fine.
- **Truncation toward zero** `["7", "-3", "/"]` — `int(7 / -3) == -2`, whereas
  floor division would give `-3`.
- **Operand order** — always pop the **right** operand first, or `-` and `/`
  give wrong results.
- **Deeply nested** expressions still work because the stack grows with depth.

## Solution (`solution.py`)

```python
def eval_rpn(tokens: List[str]) -> int:
    stack: list[int] = []
    for token in tokens:
        if token in {"+", "-", "*", "/"}:
            b, a = stack.pop(), stack.pop()
            if token == "+":
                stack.append(a + b)
            elif token == "-":
                stack.append(a - b)
            elif token == "*":
                stack.append(a * b)
            else:
                stack.append(int(a / b))
        else:
            stack.append(int(token))
    return stack[-1]
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py evaluate_reverse_polish_notation

# same tests through pytest
pytest topics/04_stack/evaluate_reverse_polish_notation -v

# your own case, one-shot
python3 run.py evaluate_reverse_polish_notation -c '[["2","1","+","3","*"]]'
```
