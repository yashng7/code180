# Single Number

**Topic:** Bit Manipulation · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/single-number/) · [NeetCode](https://neetcode.io/problems/single-number)

## Problem

Given a non-empty array of integers `nums`, every element appears **twice**
except for one element which appears **exactly once**. Return that single one.

You must implement a solution with **linear runtime** and use only **constant
extra space**.

## Examples

| `nums` | Output | Why |
| --- | --- | --- |
| `[2, 2, 1]` | `1` | `2` cancels, `1` is alone |
| `[4, 1, 2, 1, 2]` | `4` | `1` and `2` cancel |
| `[1]` | `1` | only element |

## Intuition

The XOR operator has two properties that are tailor-made for this problem:

- `x ^ x = 0` — a value XOR-ed with itself vanishes.
- `x ^ 0 = x` — `0` is the identity.

Combined with the fact that XOR is commutative and associative, if we XOR
**every** element together, every pair annihilates itself and only the unique
value survives. No hash set needed — and not a single bit of extra memory.

## Approach

1. Start with `result = 0`.
2. For each `value` in `nums`: `result ^= value`.
3. Return `result`.

Because the pairs cancel regardless of their position, the order of the array
does not matter.

## Walkthrough

`nums = [4, 1, 2, 1, 2]`

| step | value | `result` after XOR |
| --- | --- | --- |
| start | — | `0` |
| 1 | `4` | `0 ^ 4 = 4` |
| 2 | `1` | `4 ^ 1 = 5` |
| 3 | `2` | `5 ^ 2 = 7` |
| 4 | `1` | `7 ^ 1 = 6` |
| 5 | `2` | `6 ^ 2 = 4` |

The two `1`s and the two `2`s cancel, leaving `4`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| XOR (optimal) | `O(n)` | `O(1)` |
| Hash set | `O(n)` | `O(n)` |

- **Time `O(n)`** — a single pass, one XOR per element.
- **Space `O(1)`** — one integer accumulator, no matter the input size.

## Edge cases

- **Singleton array** (`[1]`) — the loop runs once and returns `1`.
- **Unique value is `0`** (`[0, 1, 1]`) — `0` is the XOR identity, so it works
  naturally.
- **Negative numbers** — Python integers are two's complement conceptually; XOR
  on negatives is well defined and pairs still cancel.
- **Unique value anywhere** — position is irrelevant because XOR is commutative.

## Solution (`solution.py`)

```python
def single_number(nums: List[int]) -> int:
    result = 0
    for value in nums:
        result ^= value          # pairs cancel: x ^ x == 0
    return result
```

## How to run the tests

```bash
# built-in test cases (7 of them)
python3 run.py single_number

# same tests through pytest
pytest topics/18_bit_manipulation/single_number -v

# your own case, one-shot
python3 run.py single_number -c '[[2,2,1]]'
```
