# Plus One

**Topic:** Math & Geometry · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/plus-one/) · [NeetCode](https://neetcode.io/problems/plus-one)

## Problem

You are given a large integer represented as an array of digits `digits`,
most significant digit first, where each `digits[i]` is in `0..9`. Increment
the integer by one and return the resulting array of digits.

## Examples

| Input | Output |
| --- | --- |
| `[1,2,3]` | `[1,2,4]` |
| `[4,3,2,1]` | `[4,3,2,2]` |
| `[9]` | `[1,0]` |

## Intuition

Adding one only affects the **trailing run of 9s**. Any digit below `9` can be
incremented in place with no carry; each `9` that is incremented becomes `0`
and passes a carry to the digit on its left. If the whole array is 9s, a new
leading `1` is prepended.

## Approach

1. Iterate `i` from the last index down to `0`.
2. If `digits[i] < 9`: increment it and return — no further carry.
3. Otherwise set `digits[i] = 0` and continue left.
4. If the loop ends, every digit was 9: return `[1] + digits`.

## Walkthrough

`digits = [1, 9, 9]`

| index | digit | action |
| --- | --- | --- |
| 2 | 9 | set to 0, carry |
| 1 | 9 | set to 0, carry |
| 0 | 1 | increment to 2, return |

Result: `[2, 0, 0]`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Carry scan (optimal) | `O(n)` | `O(1)` extra |

- **Time `O(n)`** — worst case scans every digit once (all 9s).
- **Space `O(1)`** extra — mutation is in place; only the all-9s case allocates
  a new list.

## Edge cases

- **Single `9`** — grows to `[1, 0]`.
- **All nines** (`[9, 9]` → `[1, 0, 0]`) — extra leading digit.
- **Zero** (`[0]` → `[1]`) — represents the number 0.
- **No trailing 9** — returns immediately after one increment.

## Solution (`solution.py`)

```python
def plus_one(digits: List[int]) -> List[int]:
    for i in range(len(digits) - 1, -1, -1):
        if digits[i] < 9:
            digits[i] += 1
            return digits
        digits[i] = 0
    return [1] + digits
```

## How to run the tests

```bash
# built-in test cases (7 of them)
python3 run.py plus_one

# same tests through pytest
pytest topics/17_math_and_geometry/plus_one -v

# your own case, one-shot
python3 run.py plus_one -c '[[9,9,9]]'
```
