# Missing Number

**Topic:** Bit Manipulation · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/missing-number/) · [NeetCode](https://neetcode.io/problems/missing-number)

## Problem

Given an array `nums` containing `n` **distinct** numbers drawn from the range
`[0, n]`, return the only number in that range that is missing from the array.

Follow-up: can you solve it in `O(n)` time and `O(1)` extra space?

## Examples

| `nums` | Output | Why |
| --- | --- | --- |
| `[3, 0, 1]` | `2` | range is `0..3`, `2` is absent |
| `[0, 1]` | `2` | range is `0..2`, `2` is absent |
| `[9, 6, 4, 2, 3, 5, 7, 0, 1]` | `8` | range is `0..9`, `8` is absent |

## Intuition

We have two collections of numbers:

- every index `0 … n-1` **plus** the value `n` at the top — the *complete* range;
- every value actually present in `nums` — the range **minus one number**.

If we XOR all of the first group and all of the second group together, every
value that appears in both cancels out via `x ^ x = 0`. The single value that
appears only once — the missing number — survives as the XOR of everything.

This is the same `x ^ x = 0` trick as Single Number, applied to a derived
"complete set vs. given set".

## Approach

1. Start `result = len(nums)` — this seeds the range value `n`, which has no
   index of its own.
2. For each `(index, value)` in `enumerate(nums)`:
   - `result ^= index ^ value` (contributes both the index and the value).
3. Return `result`.

Summing the arithmetic series and subtracting `sum(nums)` also works, but the
XOR version avoids any risk of integer overflow in fixed-width languages.

## Walkthrough

`nums = [3, 0, 1]`, so `n = 3`

| source | values folded in | running XOR |
| --- | --- | --- |
| seed | `3` (the top of the range) | `3` |
| index 0, value 3 | `0 ^ 3` | `3 ^ 0 ^ 3 = 0` |
| index 1, value 0 | `1 ^ 0` | `0 ^ 1 ^ 0 = 1` |
| index 2, value 1 | `2 ^ 1` | `1 ^ 2 ^ 1 = 2` |

The answer is `2`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| XOR (optimal) | `O(n)` | `O(1)` |
| Gauss sum | `O(n)` | `O(1)` |
| Hash set | `O(n)` | `O(n)` |

- **Time `O(n)`** — a single pass, two XORs per element.
- **Space `O(1)`** — one accumulator.

## Edge cases

- **Missing the last value** (`[0, 1, 2]`) — seeded by `len(nums)`, correctly
  returns `3`.
- **Missing the first value** (`[1, 2, 3]`) — returns `0`.
- **Singleton array** — `[0]` returns `1`, `[1]` returns `0`.
- **Values in any order** — XOR is commutative; ordering is irrelevant.

## Solution (`solution.py`)

```python
def missing_number(nums: List[int]) -> int:
    result = len(nums)               # include the top of the range, n
    for index, value in enumerate(nums):
        result ^= index ^ value      # pairs cancel: x ^ x == 0
    return result
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py missing_number

# same tests through pytest
pytest topics/18_bit_manipulation/missing_number -v

# your own case, one-shot
python3 run.py missing_number -c '[[3,0,1]]'
```
