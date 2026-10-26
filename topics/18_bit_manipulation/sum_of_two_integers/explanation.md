# Sum of Two Integers

**Topic:** Bit Manipulation · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/sum-of-two-integers/) · [NeetCode](https://neetcode.io/problems/sum-of-two-integers)

## Problem

Given two integers `a` and `b`, return the sum of the two integers **without
using the `+` or `-` operators**.

## Examples

| `a` | `b` | Output |
| --- | --- | --- |
| `1` | `2` | `3` |
| `2` | `3` | `5` |
| `-1` | `1` | `0` |

## Intuition

Addition can be split into two independent bit operations, exactly like the
grade-school algorithm — but per column, with no carries crossing at the same
time:

- **Sum without carry** is `a ^ b`: in each bit column, `1 + 1 = 0` (carry) and
  `1 + 0 = 1`, which is precisely XOR.
- **The carries** are `(a & b) << 1`: a carry is generated where **both** bits
  are `1`, and it lands one column to the left.

So the total is `(a ^ b) + ((a & b) << 1)` — but that reuses `+`. Instead we
**loop**: XOR gives the partial sum, and the shifted AND becomes the new `b` to
add in. The carry must eventually become `0` (each round the operands creep left
and run out of room), which terminates the loop.

## Approach

1. Mask `a` and `b` to 32 bits so Python's unbounded integers behave like a
   fixed-width two's complement machine.
2. While `b` is non-zero:
   - `carry = ((a & b) << 1) & MASK`;
   - `a = (a ^ b) & MASK` — accumulate the carry-free sum;
   - `b = carry` — queue the carries as the next addition.
3. Convert the final 32-bit pattern back to a signed integer: if bit 31 is set,
   the value is negative, so return `~(a ^ MASK)`.

## Walkthrough

`a = 2 (010)`, `b = 3 (011)`

| round | `a` | `b` | `a & b` | `carry` | new `a = a ^ b` |
| --- | --- | --- | --- | --- | --- |
| 1 | `010` | `011` | `010` | `100` | `001` |
| 2 | `001` | `100` | `000` | `000` | `101` |

`b` is now `0`, so the answer is `101` = `5`.

For negatives the same machine is used; the masked pattern `0xFFFFFFFF` stands
for `-1`, and the final conversion turns a leading sign bit back into a negative
Python integer.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Bit loop (optimal here) | `O(1)` | `O(1)` |

- **Time `O(1)`** — the carry chain is at most 32 bits long for 32-bit inputs.
- **Space `O(1)`** — a fixed number of registers.

## Edge cases

- **`b = 0`** — the loop body never runs; `a` is returned directly.
- **Opposite signs** (`-1, 1`) — the carry chain walks up and cancels to `0`.
- **Both negative** (`-5, -3`) — masking gives the two's complement patterns and
  the result converts back to `-8`.
- **Large opposing values** (`1000, -1000`) — cancels cleanly to `0`.
- **Overflow of the sign bit** — handled by the final `~(a ^ MASK)` conversion.

## Solution (`solution.py`)

```python
MASK = 0xFFFFFFFF
SIGN = 0x80000000


def get_sum(a: int, b: int) -> int:
    a &= MASK
    b &= MASK
    while b:
        carry = ((a & b) << 1) & MASK
        a = (a ^ b) & MASK
        b = carry
    return a if a < SIGN else ~(a ^ MASK)
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py sum_of_two_integers

# same tests through pytest
pytest topics/18_bit_manipulation/sum_of_two_integers -v

# your own case, one-shot
python3 run.py sum_of_two_integers -c '[1, 2]'
```
