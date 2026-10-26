# Maximum Subarray

**Topic:** Greedy · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/maximum-subarray/) · [NeetCode](https://neetcode.io/problems/maximum-subarray)

## Problem

Given an integer array `nums`, find the contiguous subarray with the largest sum
and return that sum. The subarray must be non-empty.

## Examples

| `nums` | Output | Why |
| --- | --- | --- |
| `[-2,1,-3,4,-1,2,1,-5,4]` | `6` | `[4,-1,2,1]` sums to `6` |
| `[1]` | `1` | the only element |
| `[5,4,-1,7,8]` | `23` | the whole array |
| `[-3,-1,-2]` | `-1` | best is the single element `-1` |

## Intuition

Ask a simpler question: *what is the best subarray that ends exactly at index
`i`?* Call it `current`. When index `i` arrives you have only two choices:

- **extend** the best run ending at `i-1`, giving `current + nums[i]`, or
- **restart** a brand-new run at `i`, giving `nums[i]`.

Keep whichever is larger. This is the aha: a run is only worth extending while
its accumulated prefix is a help rather than a burden. If the running sum goes
negative it can never improve anything that follows, so dropping it is free.

## Approach

1. Initialise `best = current = nums[0]` (the subarray must be non-empty, so we
   may not use `0` as the seed — that is why all-negative input still works).
2. For each later value `v`: set `current = max(v, current + v)`.
3. Track `best = max(best, current)`.
4. Return `best`.

## Why the greedy choice is safe

Consider the optimal subarray ending at index `i`.

- If it extends the optimal subarray ending at `i-1`, then `current = current + v`
  reproduces it.
- If it starts fresh at `i`, then the subarray ending at `i-1` was a net drag
  (`current + v <= v`), so discarding it cannot hurt any future answer — the
  fresh start dominates.

Either way `current` equals the true best ending at `i`, so taking the local
`max` never loses the global optimum. By induction over `i`, `best` is the
global maximum. This is Kadane's algorithm; it is a greedy/dynamic-programming
hybrid whose decision depends only on the previous index.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Kadane (this) | `O(n)` | `O(1)` |
| Divide & conquer | `O(n log n)` | `O(log n)` |
| Brute force | `O(n²)` | `O(1)` |

## Edge cases

- **All negatives** — the answer is the single largest element; seeding with `0`
  would wrongly return `0`.
- **A single element** — the loop body never runs, `best` is that element.
- **Zeros** — a run can extend through `0` freely (`current + 0 == current`).
- **A deep negative in the middle** — the run restarts afterwards.
- **Whole array positive** — the run is never dropped.

## Solution (`solution.py`)

```python
from typing import List


def max_subarray(nums: List[int]) -> int:
    best = nums[0]
    current = nums[0]
    for value in nums[1:]:
        current = max(value, current + value)
        best = max(best, current)
    return best
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py maximum_subarray

# same tests through pytest
pytest topics/15_greedy/maximum_subarray -v

# your own case
python3 run.py maximum_subarray -c '[[-2,1,-3,4,-1,2,1,-5,4]]'
```
