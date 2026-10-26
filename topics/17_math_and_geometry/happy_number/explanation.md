# Happy Number

**Topic:** Math & Geometry · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/happy-number/) · [NeetCode](https://neetcode.io/problems/happy-number)

## Problem

A number is called **happy** if repeatedly replacing it with the sum of the
squares of its digits eventually reaches `1`. If the process loops forever in a
cycle that excludes `1`, the number is unhappy. Return `true` if `n` is happy.

## Examples

| `n` | Output | Sequence |
| --- | --- | --- |
| `19` | `true` | `19 → 82 → 68 → 100 → 1` |
| `2` | `false` | `2 → 4 → 16 → 37 → 58 → 89 → 145 → 42 → 20 → 4 …` |
| `1` | `true` | already `1` |

## Intuition

The digit-square-sum map turns `n` into a deterministic sequence. Happy numbers
reach `1`; unhappy numbers eventually repeat a value, forming a **cycle**. So
the question reduces to: *does this sequence hit `1`, or does it cycle?*

A hash set of seen values solves it with `O(log n)` space, but the sequence is
just a functional graph, so **Floyd's tortoise-and-hare** detects a cycle with
`O(1)` space: advance a slow pointer one step and a fast pointer two steps; if
they meet, there is a cycle (and it is not `1`).

## Approach

1. Define `square_sum(x)` = sum of squares of `x`'s digits.
2. `slow = n`, `fast = square_sum(n)`.
3. While `fast != 1` and `slow != fast`:
   - `slow = square_sum(slow)`;
   - `fast = square_sum(square_sum(fast))`.
4. Return `fast == 1`.

## Walkthrough

`n = 19`

| step | slow | fast |
| --- | --- | --- |
| init | 19 | 82 |
| 1 | 82 | 68 |
| 2 | 68 | 100 |
| 3 | 100 | 1 → stop |

`fast` reached `1`, so `19` is happy.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Floyd cycle detection | `O(log n)` | `O(1)` |
| Hash set of seen values | `O(log n)` | `O(log n)` |

- **Time `O(log n)`** — each `square_sum` costs `O(number of digits)`, and the
  sequence length before `1` or a cycle is small and bounded.
- **Space `O(1)`** — only two integer pointers.

## Edge cases

- **`n = 1`** — answers `true` immediately (loop condition already fails).
- **Single-digit unhappy** (`4`) — enters the well-known 8-number cycle.
- **Trailing zeros** (`100`) — contribute `0` to the sum, still happy.
- **Large repeated digits** (`1111111`) — proves digit handling beyond one digit.

## Solution (`solution.py`)

```python
def is_happy(n: int) -> bool:
    def square_sum(x: int) -> int:
        total = 0
        while x:
            x, digit = divmod(x, 10)
            total += digit * digit
        return total

    slow, fast = n, square_sum(n)
    while fast != 1 and slow != fast:
        slow = square_sum(slow)
        fast = square_sum(square_sum(fast))
    return fast == 1
```

## How to run the tests

```bash
# built-in test cases (7 of them)
python3 run.py happy_number

# same tests through pytest
pytest topics/17_math_and_geometry/happy_number -v

# your own case, one-shot
python3 run.py happy_number -c '[19]'
```
