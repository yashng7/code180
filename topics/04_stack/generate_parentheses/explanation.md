# Generate Parentheses

**Topic:** Stack · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/generate-parentheses/) · [NeetCode](https://neetcode.io/problems/generate-parentheses)

## Problem

Given `n` pairs of parentheses, generate all combinations of **well-formed**
parentheses. Return the answer in any order.

## Examples

| `n` | Output |
| --- | --- |
| `1` | `["()"]` |
| `2` | `["(())", "()()"]` |
| `3` | `["((()))", "(()())", "(())()", "()(())", "()()()"]` |

The number of results for `n` pairs is the **Catalan number**
`C(n) = (2n)! / ((n+1)! n!)` — `1, 2, 5, 14, 42, …`.

## Intuition

Rather than generate all `2^(2n)` strings and filter the invalid ones, we only
ever build strings that are **already valid prefixes**. Two counts are enough to
decide what may come next:

- we may add `'('` as long as we have opened fewer than `n` so far;
- we may add `')'` only when it would not outnumber the `'('` seen so far, i.e.
  `closed < opened`.

This is the same bracketing rule the stack solution to *Valid Parentheses*
enforces — here we use two counters instead of a stack, which is equivalent for
a single bracket type.

## Approach

1. Start with the empty prefix and counters `opened = closed = 0`.
2. At each step, if the prefix already has `2n` characters, record it.
3. Otherwise try both legal extensions:
   - if `opened < n`, append `'('`;
   - if `closed < opened`, append `')'`.
4. Recursion explores a tree whose leaves are exactly the valid strings; there
   is no pruning of dead branches because we never create one.

## Walkthrough

`n = 2` — the recursion tree:

```
        ""
       /
     "("
    /   \
 "(("   "()"
   |      |
"(())"  "()("
          |
        "()()"
```

Both leaves, `"(())"` and `"()()"`, are returned.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Backtracking | `O(4^n / sqrt(n))` | `O(n)` |
| Generate-all + filter | `O(2^(2n) * n)` | `O(n)` |

- **Time** — proportional to the number of valid strings (the Catalan number,
  which grows as `O(4^n / n^{1.5})`), times the `O(n)` cost of copying a string.
- **Space** — the recursion stack is at most `2n` deep; the output itself is
  not counted.

## Edge cases

- **`n = 0`** — the only well-formed combination is the empty string, so the
  result is `[""]`.
- **`n = 1`** — only `"()"`; the `')'` branch is unavailable until an `'('`
  has been placed.
- **Prefix validity** — requiring `closed < opened` before placing `')'` is what
  guarantees the output never contains an invalid string.
- **Ordering** — the problem accepts any order; `compare` is `unordered`.

## Solution (`solution.py`)

```python
def generate_parenthesis(n: int) -> List[str]:
    result: List[str] = []

    def backtrack(current: str, opened: int, closed: int) -> None:
        if len(current) == 2 * n:
            result.append(current)
            return
        if opened < n:
            backtrack(current + "(", opened + 1, closed)
        if closed < opened:
            backtrack(current + ")", opened, closed + 1)

    backtrack("", 0, 0)
    return result
```

## How to run the tests

```bash
# built-in test cases (5 of them)
python3 run.py generate_parentheses

# same tests through pytest
pytest topics/04_stack/generate_parentheses -v

# your own case, one-shot
python3 run.py generate_parentheses -c '[3]'
```
