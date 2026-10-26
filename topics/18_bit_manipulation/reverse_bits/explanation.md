# Reverse Bits

**Topic:** Bit Manipulation · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/reverse-bits/) · [NeetCode](https://neetcode.io/problems/reverse-bits)

## Problem

Reverse the bits of a given **32-bit unsigned integer** `n` and return the
resulting integer. Note that in some languages (e.g. Java) there is no unsigned
integer type — the input is still a 32-bit quantity, so the answer can exceed
`2^31 - 1` (for example `1` reverses to `2^31`).

## Examples

| `n` | Binary (32 bits) | Output |
| --- | --- | --- |
| `43261596` | `00000010100101000001111010011100` | `964176192` |
| `1` | `00000000000000000000000000000001` | `2147483648` |
| `0` | `00000000000000000000000000000000` | `0` |

## Intuition

Reversing a sequence of bits is the same pattern as reversing a decimal number
digit by digit: **peel off the last bit of the input and push it onto the end of
the output**.

- To read the last bit: `n & 1`.
- To make room on the output: `result << 1`.
- To append the bit: `result |= bit`.
- To drop the consumed bit from the input: `n >>= 1`.

Because the input is exactly 32 bits wide, repeating this **32 times** (even
after `n` becomes `0`) reproduces the leading zeros as trailing zeros.

## Approach

1. Mask the input to 32 bits: `n &= 0xFFFFFFFF`.
2. Repeat 32 times:
   - `result = (result << 1) | (n & 1)`;
   - `n >>= 1`.
3. Return `result`.

## Walkthrough

`n = 0b101` (shown as 3 bits for brevity; the real run uses 32)

| step | `n & 1` | `result` (binary) | `n` after shift |
| --- | --- | --- | --- |
| start | — | `0` | `101` |
| 1 | `1` | `1` | `10` |
| 2 | `0` | `10` | `1` |
| 3 | `1` | `101` | `0` |
| … | `0` | `101000…` | `0` |

After 32 steps the leading zeros have been appended, giving `101` followed by
29 zeros — the mirror image of the original.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Loop 32 times (optimal) | `O(1)` | `O(1)` |
| Divide-and-conquer masks | `O(1)` | `O(1)` |

- **Time `O(1)`** — the number of iterations is fixed at 32 regardless of `n`.
- **Space `O(1)`** — a single accumulator.

## Edge cases

- **`n = 0`** — every bit read is `0`, so the result stays `0`.
- **Single low bit** (`1`) — becomes the most significant bit, `2^31`.
- **Single high bit** (`2147483648`) — becomes `1`.
- **All bits set** (`4294967295`) — the value is its own reverse.
- **Negative inputs** — masked to 32 bits so the bit pattern is well defined.

## Solution (`solution.py`)

```python
def reverse_bits(n: int) -> int:
    n &= 0xFFFFFFFF
    result = 0
    for _ in range(32):
        result = (result << 1) | (n & 1)
        n >>= 1
    return result
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py reverse_bits

# same tests through pytest
pytest topics/18_bit_manipulation/reverse_bits -v

# your own case, one-shot
python3 run.py reverse_bits -c '[43261596]'
```
