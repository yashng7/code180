# Longest Consecutive Sequence

**Topic:** Arrays & Hashing · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/longest-consecutive-sequence/) · [NeetCode](https://neetcode.io/problems/longest-consecutive-sequence)

## Problem

Given an unsorted array of integers `nums`, return the length of the **longest
run of consecutive integers** (values `x, x+1, x+2, …`). The algorithm must run
in `O(n)` time — so sorting (`O(n log n)`) is not allowed.

## Examples

| `nums` | Output | Run |
| --- | --- | --- |
| `[100, 4, 200, 1, 3, 2]` | `4` | `1, 2, 3, 4` |
| `[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]` | `9` | `0 … 8` |

## Intuition

Put everything in a **hash set** for `O(1)` membership. The key insight is how
to avoid re-scanning: a value is the **start of a run** only if `value - 1` is
not in the set. For those starting points we walk upward while `value + 1, +2, …`
exist.

Each element belongs to exactly one run and is only walked once from its start,
so the total work stays linear.

## Approach

1. Build `num_set = set(nums)` (deduplicates automatically).
2. For each `value` in the set:
   - if `value - 1` is also present, skip — it is not a run start;
   - otherwise extend: `length = 1`, then while `value + length` in set, increment.
   - update the best length.
3. Return the best.

## Walkthrough

`nums = [100, 4, 200, 1, 3, 2]` → set `{1, 2, 3, 4, 100, 200}`

| value | start? | run found | length |
| --- | --- | --- | --- |
| 1 | yes (`0` absent) | 1, 2, 3, 4 | 4 |
| 2 | no (`1` present) | skip | — |
| 3 | no | skip | — |
| 4 | no | skip | — |
| 100 | yes (`99` absent) | 100 | 1 |
| 200 | yes | 200 | 1 |

Best = `4`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Hash set (optimal) | `O(n)` | `O(n)` |
| Sort then scan | `O(n log n)` | `O(n)` |

## Edge cases

- Empty array → `0`.
- Duplicates — the set removes them; duplicates do not lengthen a run.
- Already sorted or reverse-sorted input works unchanged.
- Negative values are handled the same way.

## Solution

```python
def longest_consecutive(nums: List[int]) -> int:
    num_set = set(nums)
    best = 0
    for value in num_set:
        if value - 1 in num_set:
            continue
        length = 1
        while value + length in num_set:
            length += 1
        best = max(best, length)
    return best
```

## How to run

```bash
python3 run.py longest_consecutive_sequence
python3 run.py longest_consecutive_sequence -c '[[100,4,200,1,3,2]]'
```
