# Counting Bits

**Topic:** Bit Manipulation · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/counting-bits/) · [NeetCode](https://neetcode.io/problems/counting-bits)

## Problem

Given an integer `n`, return an array `ans` of length `n + 1` such that
`ans[i]` is the number of `1` bits in the binary representation of `i`, for
every `0 <= i <= n`.

## Examples

| `n` | Output |
| --- | --- |
| `2` | `[0, 1, 1]` |
| `5` | `[0, 1, 1, 2, 1, 2]` |
| `0` | `[0]` |

## Intuition

Counting bits for each `i` independently with `i & (i - 1)` costs `O(n log n)`
overall. But the counts of neighbouring numbers are related:

- **Right-shift** `i` by one (`i >> 1`) you drop the lowest bit. That value is
  smaller than `i`, so its popcount is already known.
- The bit you dropped is exactly `i & 1`.

So the recurrence is simply:

```
ans[i] = ans[i >> 1] + (i & 1)
```

This is dynamic programming over the natural numbers — every answer reuses a
smaller, already-computed answer.

## Approach

1. Allocate `ans = [0] * (n + 1)` (index `0` is `0` set bits).
2. For `i` from `1` to `n`:
   - `ans[i] = ans[i >> 1] + (i & 1)`.
3. Return `ans`.

## Walkthrough

`n = 5`

| `i` | binary | `i >> 1` | `ans[i>>1]` | `i & 1` | `ans[i]` |
| --- | --- | --- | --- | --- | --- |
| 0 | `0` | — | — | — | `0` |
| 1 | `1` | 0 | 0 | 1 | `1` |
| 2 | `10` | 1 | 1 | 0 | `1` |
| 3 | `11` | 1 | 1 | 1 | `2` |
| 4 | `100` | 2 | 1 | 0 | `1` |
| 5 | `101` | 2 | 1 | 1 | `2` |

Result: `[0, 1, 1, 2, 1, 2]`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| DP recurrence (optimal) | `O(n)` | `O(n)` |
| Per-index popcount | `O(n log n)` | `O(n)` |

- **Time `O(n)`** — one shift, one AND and one add per index.
- **Space `O(n)`** — the returned array (not counted against extra space).

## Edge cases

- **`n = 0`** — returns `[0]`.
- **`n = 1`** — returns `[0, 1]`.
- **Powers of two** — `2^k` has exactly one set bit, so `ans[2^k] = 1`; the
  array is a good sanity check right after each power of two.
- **Large `n`** — the recurrence avoids recomputing popcounts, keeping it linear.

## Solution (`solution.py`)

```python
def count_bits(n: int) -> List[int]:
    ans = [0] * (n + 1)
    for i in range(1, n + 1):
        ans[i] = ans[i >> 1] + (i & 1)
    return ans
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py counting_bits

# same tests through pytest
pytest topics/18_bit_manipulation/counting_bits -v

# your own case, one-shot
python3 run.py counting_bits -c '[5]'
```
