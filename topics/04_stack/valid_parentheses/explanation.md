# Valid Parentheses

**Topic:** Stack · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/valid-parentheses/) · [NeetCode](https://neetcode.io/problems/validate-parentheses)

## Problem

Given a string `s` containing only the characters `'('`, `')'`, `'{'`, `'}'`,
`'['` and `']'`, return `True` if the input string is valid.

A string is valid when:

- every opening bracket is closed by the **same type** of bracket,
- brackets are closed in the **correct order** (properly nested),
- every closing bracket has a matching opening bracket before it.

## Examples

| `s` | Output | Why |
| --- | --- | --- |
| `"()"` | `True` | one matched pair |
| `"()[]{}"` | `True` | three independent pairs |
| `"(]"` | `False` | `(` is closed by `]` |
| `"([])"` | `True` | nested and matched |
| `"([)]"` | `False` | `[` is closed before `(` |

## Intuition

The most recent opening bracket is always the one that must be closed next —
that is exactly **last-in-first-out** behaviour, so a stack is the natural fit.

When we see an opener we push it. When we see a closer we check it against the
bracket on top of the stack: if they match we pop, otherwise the string is
invalid. At the end the stack must be empty (no leftover openers).

## Approach

1. Build a map from each **closing** bracket to its matching **opening**
   bracket: `{')': '(', ']': '[', '}': '{'}`.
2. Keep an empty `stack`.
3. Walk over each character:
   - if it is a closing bracket: the stack must be non-empty and its top must
     equal the matching opener — otherwise return `False`; then pop.
   - otherwise (an opening bracket) push it.
4. After the loop, return `stack == []`. A non-empty stack means some opener was
   never closed.

## Walkthrough

`s = "([])"`

| char | stack before | action | stack after |
| --- | --- | --- | --- |
| `(` | `[]` | push | `['(']` |
| `[` | `['(']` | push | `['(', '[']` |
| `]` | `['(', '[']` | top `[` matches → pop | `['(']` |
| `)` | `['(']` | top `(` matches → pop | `[]` |

Stack empty at the end → `True`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Stack (optimal) | `O(n)` | `O(n)` |

- **Time `O(n)`** — each character is pushed and popped at most once.
- **Space `O(n)`** — a string of all openers, e.g. `"((((("`, fills the stack.

## Edge cases

- **Empty string** — valid; the stack stays empty and we return `True`.
- **Single opener `"("`** — stack is non-empty at the end → `False`.
- **Single closer `")"`** — stack is empty when we try to pop → `False`.
- **Interleaved `"([)]"`** — the types are all present but the nesting order is
  wrong; the top-of-stack check catches it.
- **Mismatched types `"(]"`** — top of stack differs from the required opener.

## Solution (`solution.py`)

```python
def is_valid(s: str) -> bool:
    pairs: Dict[str, str] = {")": "(", "]": "[", "}": "{"}
    stack: list[str] = []
    for char in s:
        if char in pairs:
            if not stack or stack.pop() != pairs[char]:
                return False
        else:
            stack.append(char)
    return not stack
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py valid_parentheses

# same tests through pytest
pytest topics/04_stack/valid_parentheses -v

# your own case, one-shot
python3 run.py valid_parentheses -c '"()[]{}"'
```
