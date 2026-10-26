# Min Stack

**Topic:** Stack · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/min-stack/) · [NeetCode](https://neetcode.io/problems/minimum-stack)

## Problem

Design a stack that supports the following operations, each in **O(1)** time:

- `push(val)` — push `val` onto the stack,
- `pop()` — remove the element on top of the stack,
- `top()` — return the element on top of the stack,
- `getMin()` — return the minimum element currently in the stack.

## Examples

| operations | result |
| --- | --- |
| `push(-2), push(0), push(-3), getMin()` | `-3` |
| `pop(), top(), getMin()` | `0`, then `-2` |

The driver runs a list of `ops` against the object and collects the outputs;
`null` marks the constructor and every void method.

## Intuition

If we only stored the values, `getMin` would need to scan the whole stack —
`O(n)`. The trick is that whenever we `push`, the minimum can only stay the same
or **drop** to the new value, and whenever we `pop`, the minimum can only stay
the same or **rise back** to some previous value.

So we keep a **parallel stack of running minimums**: entry `i` records the
minimum of the main stack's first `i + 1` elements. `getMin` is then the top of
that stack — `O(1)`.

## Approach

1. `_stack` holds the real values; `_mins` holds the running minimum.
2. **push(val):** append `val` to `_stack`; append `min(val, _mins[-1])`
   (or `val` when `_mins` is empty) to `_mins`.
3. **pop():** pop from both stacks — they always have the same height.
4. **top():** return `_stack[-1]`.
5. **getMin():** return `_mins[-1]`.

## Walkthrough

Applying `push(-2), push(0), push(-3), getMin(), pop(), top(), getMin()`:

| op | `_stack` | `_mins` | returned |
| --- | --- | --- | --- |
| `push(-2)` | `[-2]` | `[-2]` | |
| `push(0)` | `[-2, 0]` | `[-2, -2]` | |
| `push(-3)` | `[-2, 0, -3]` | `[-2, -2, -3]` | |
| `getMin()` | | | `-3` |
| `pop()` | `[-2, 0]` | `[-2, -2]` | |
| `top()` | | | `0` |
| `getMin()` | | | `-2` |

## Complexity

| | push | pop | top | getMin | Space |
| --- | --- | --- | --- | --- | --- |
| Two stacks (optimal) | `O(1)` | `O(1)` | `O(1)` | `O(1)` | `O(n)` |
| Single stack + scan | `O(1)` | `O(1)` | `O(1)` | `O(n)` | `O(n)` |

- **Time `O(1)`** — every operation touches only stack tops.
- **Space `O(n)`** — the second stack can grow as large as the first.

## Edge cases

- **Duplicate values** — `min(val, _mins[-1])` keeps a valid entry for each, so
  popping one copy does not lose the minimum.
- **Decreasing then increasing** — `[5, 2, 1]`, then popping `1` and `2` makes
  `getMin` climb back to `2`, then `5`.
- **Pop back to empty** — both stacks shrink together; LeetCode only calls
  `pop`/`top`/`getMin` on a non-empty stack.
- **Negatives and zero** — ordinary integer comparisons handle them.

## Solution (`solution.py`)

```python
class MinStack:
    def __init__(self) -> None:
        self._stack: list[int] = []
        self._mins: list[int] = []

    def push(self, val: int) -> None:
        self._stack.append(val)
        self._mins.append(min(val, self._mins[-1]) if self._mins else val)

    def pop(self) -> None:
        self._stack.pop()
        self._mins.pop()

    def top(self) -> int:
        return self._stack[-1]

    def getMin(self) -> int:
        return self._mins[-1]
```

## How to run the tests

```bash
# built-in test cases (7 of them)
python3 run.py min_stack

# same tests through pytest
pytest topics/04_stack/min_stack -v
```
