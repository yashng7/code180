# Number of 1 Bits

**Topic:** Bit Manipulation · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/number-of-1-bits/) · [NeetCode](https://neetcode.io/problems/number-of-1-bits)

## Problem

Given a positive integer `n`, return the number of **set bits** (also called the
Hamming weight) in its binary representation. In other words, count how many
positions hold a `1`.

## Examples

| `n` | Binary | Output |
| --- | --- | --- |
| `11` | `1011` | `3` |
| `128` | `10000000` | `1` |
| `2147483645` | `1111111111111111111111111111101` | `30` |

## Intuition

A naive loop checks each of the 32 bit positions with `(n >> i) & 1`, which is
`O(32)` — fine, but we can do better by only visiting the set bits.

The trick is `n & (n - 1)`. Subtracting one flips the lowest set bit to `0` and
turns every bit below it to `1`. AND-ing with the original therefore **clears
exactly that lowest set bit** and leaves everything else untouched. Repeating
until `n` is `0` performs exactly one iteration per set bit.

## Approach

1. Set `count = 0`.
2. While `n` is non-zero:
   - `n &= n - 1` deletes the lowest set bit;
   - increment `count`.
3. Return `count`.

## Walkthrough

`n = 11` (`0b1011`)

| `n` (binary) | `n - 1` (binary) | `n & (n - 1)` | `count` |
| --- | --- | --- | --- |
| `1011` | `1010` | `1010` | 1 |
| `1010` | `1001` | `1000` | 2 |
| `1000` | `0111` | `0000` | 3 |

Three iterations → three set bits.

## Complexity

| | Time | Space |
| --- | --- | --- |
| `n & (n - 1)` (optimal) | `O(k)`, k = set bits | `O(1)` |
| Shift-and-mask | `O(32)` | `O(1)` |

- **Time `O(k)`** — one iteration per set bit; bounded by 32 for the input range.
- **Space `O(1)`** — a single counter.

## Edge cases

- **`n = 0`** — the loop never runs and returns `0`.
- **Single set bit** (`128`, `1024`) — one iteration.
- **All bits set** (`4294967295`) — 32 iterations, answer `32`.
- **Powers of two** — always exactly one set bit, a good sanity check.

## Solution (`solution.py`)

```python
def hamming_weight(n: int) -> int:
    count = 0
    while n:
        n &= n - 1               # clear the lowest set bit
        count += 1
    return count
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py number_of_1_bits

# same tests through pytest
pytest topics/18_bit_manipulation/number_of_1_bits -v

# your own case, one-shot
python3 run.py number_of_1_bits -c '[11]'
```
