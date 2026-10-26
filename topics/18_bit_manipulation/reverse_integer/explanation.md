# Reverse Integer

**Topic:** Bit Manipulation · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/reverse-integer/) · [NeetCode](https://neetcode.io/problems/reverse-integer)

## Problem

Given a signed 32-bit integer `x`, return `x` with its **digits reversed**. If
reversing the digits causes the value to go outside the signed 32-bit range
`[-2^31, 2^31 - 1] = [-2147483648, 2147483647]`, return `0` instead.

Assume the environment does not allow storing 64-bit integers.

## Examples

| `x` | Output | Why |
| --- | --- | --- |
| `123` | `321` | digits reversed |
| `-123` | `-321` | sign preserved |
| `120` | `21` | trailing zero disappears |
| `1534236469` | `0` | reversed as `9646324351`, overflows |

## Intuition

Reversing decimal digits mirrors reversing bits (see Reverse Bits): repeatedly
**take the last digit of the input and append it to the output**.

- Last digit: `x % 10`.
- Make room: `result * 10`.
- Append: `result * 10 + digit`.
- Drop the digit: `x //= 10`.

The twist is **overflow**. `1534236469` reversed is `9646324351`, far beyond
`2^31 - 1`, so the answer must be `0`. We can detect this by building the
reversed value in Python's arbitrary precision and checking the final magnitude
against the 32-bit bounds — no digit-by-digit pre-checking needed, which keeps
the code simple and obviously correct.

## Approach

1. Record the sign separately; work with `abs(x)`.
2. Repeatedly pop the units digit and push it onto `result`:
   - `result = result * 10 + x % 10`, then `x //= 10`.
3. Reapply the sign.
4. If `result` is outside `[-2147483648, 2147483647]`, return `0`; otherwise
   return `result`.

## Walkthrough

`x = 120`

| `x` | digit `x % 10` | `result` after append | `x` after `// 10` |
| --- | --- | --- | --- |
| `120` | `0` | `0` | `12` |
| `12` | `2` | `2` | `1` |
| `1` | `1` | `21` | `0` |

Result `21` — the trailing zero of the original tail is naturally dropped
because it contributes nothing to the leading position.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Digit loop (optimal) | `O(log10 \|x\|)` | `O(1)` |
| String reversal | `O(log10 \|x\|)` | `O(log10 \|x\|)` |

- **Time `O(log10 |x|)`** — one iteration per digit, at most 10 for a 32-bit
  value.
- **Space `O(1)`** — the accumulator only (the string approach allocates).

## Edge cases

- **`x = 0`** — the loop never runs and returns `0`.
- **Single digit** (`5`) — returns itself.
- **Trailing zeros** (`120`, `100`) — collapse away, giving `21` and `1`.
- **Overflow positive** (`1534236469` → `9646324351 > 2^31-1`) — returns `0`.
- **Overflow negative** (`-2147483648` → `8463847412 > 2^31-1`) — returns `0`.
- **Largest valid reverse** (`1463847412` → `2147483641`) — just under the limit,
  returned as-is. A useful boundary that a too-strict check would wrongly zero.

## Solution (`solution.py`)

```python
INT_MIN = -2147483648
INT_MAX = 2147483647


def reverse(x: int) -> int:
    sign = -1 if x < 0 else 1
    x = abs(x)
    result = 0
    while x:
        result = result * 10 + x % 10
        x //= 10
    result *= sign
    if result < INT_MIN or result > INT_MAX:
        return 0
    return result
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py reverse_integer

# same tests through pytest
pytest topics/18_bit_manipulation/reverse_integer -v

# your own case, one-shot
python3 run.py reverse_integer -c '[1534236469]'
```
