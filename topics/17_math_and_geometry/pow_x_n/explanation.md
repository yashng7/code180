# Pow(x, n)

**Topic:** Math & Geometry · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/powx-n/) · [NeetCode](https://neetcode.io/problems/pow-x-n)

## Problem

Implement `pow(x, n)`, which computes `x` raised to the integer power `n`
(`-2³¹ ≤ n ≤ 2³¹ - 1`).

## Examples

| `x` | `n` | Output |
| --- | --- | --- |
| `2.0` | `10` | `1024.0` |
| `2.1` | `3` | `9.261` |
| `2.0` | `-2` | `0.25` |

## Intuition

Multiplying `x` by itself `n` times is `O(n)`. But exponents can be squared
away: `xⁿ = (x²)^(n/2)` when `n` is even, and `xⁿ = x · (x²)^⌊n/2⌋` when `n`
is odd. Each step **halves** the exponent, so only `O(log n)` multiplications
are needed.

A negative exponent is just the reciprocal: `x⁻ⁿ = (1/x)ⁿ`. Flipping `n` first
also keeps the loop purely on non-negative powers.

## Approach

1. If `n < 0`, set `x = 1 / x` and `n = -n`.
2. `result = 1.0`.
3. While `n > 0`:
   - if the lowest bit of `n` is set (odd), `result *= x`;
   - square the base: `x *= x`;
   - shift the exponent: `n >>= 1`.
4. Return `result`.

This is exactly binary exponentiation — reading the bits of `n` from low to
high, each bit selects the corresponding square of `x`.

## Walkthrough

`x = 2.0, n = 10` (`n = 1010₂`)

| `n` | bit | action | `result` | `x` |
| --- | --- | --- | --- | --- |
| 10 | 0 | skip | 1.0 | 4.0 |
| 5 | 1 | `result *= 4` | 4.0 | 16.0 |
| 2 | 0 | skip | 4.0 | 256.0 |
| 1 | 1 | `result *= 256` | 1024.0 | — |

## Complexity

| | Time | Space |
| --- | --- | --- |
| Binary exponentiation (optimal) | `O(log |n|)` | `O(1)` |
| Naive repeated multiplication | `O(n)` | `O(1)` |

- **Time `O(log |n|)`** — the exponent is halved every iteration.
- **Space `O(1)`** — the iterative form keeps only a few floats.

## Edge cases

- **`n = 0`** — loop never runs, returns `1.0` (including `x = 0`).
- **Negative `n`** — base is inverted first; `2.0⁻² = 0.25`.
- **Negative base** — sign is naturally preserved by repeated multiplication.
- **Very large `|n|`** — still only ~31 iterations for `n = 2³¹ - 1`; the
  result may overflow or underflow to `0.0`/`inf`, matching IEEE-754.

## Solution (`solution.py`)

```python
def my_pow(x: float, n: int) -> float:
    if n < 0:
        x = 1 / x
        n = -n
    result = 1.0
    while n:
        if n & 1:
            result *= x
        x *= x
        n >>= 1
    return result
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py pow_x_n

# same tests through pytest
pytest topics/17_math_and_geometry/pow_x_n -v

# your own case, one-shot
python3 run.py pow_x_n -c '[2.0, -2]'
```
