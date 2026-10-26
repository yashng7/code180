# Find Minimum in Rotated Sorted Array

**Topic:** Binary Search · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/) · [NeetCode](https://neetcode.io/problems/find-minimum-in-rotated-sorted-array)

## Problem

Suppose an ascending array of **distinct** integers was rotated between `1` and
`n` times, i.e. `[0,1,2,4,5,6,7]` may become `[4,5,6,7,0,1,2]`. Return the
minimum element. You must run in `O(log n)` time.

## Examples

| `nums` | Output |
| --- | --- |
| `[3,4,5,1,2]` | `1` |
| `[4,5,6,7,0,1,2]` | `0` |
| `[11,12,13,14,15]` | `11` |

## Intuition

A rotated ascending array is made of two sorted runs: the larger tail of the
original array, then the smaller head. The **minimum** is the first element of
the second run — the rotation pivot.

Comparing `nums[mid]` with `nums[hi]` (the right end) tells us which run `mid`
is in:

- if `nums[mid] > nums[hi]`, the drop has not happened yet at `mid`, so the
  minimum lies strictly to the **right**;
- otherwise `mid` is already inside the lower run (or the array is sorted), so
  the minimum is at `mid` or to its **left**.

Comparing against `nums[lo]` would be ambiguous because the left end can be in
either run.

## Approach

1. Set `lo = 0`, `hi = len(nums) - 1`.
2. While `lo < hi`:
   - `mid = (lo + hi) // 2`;
   - if `nums[mid] > nums[hi]`: `lo = mid + 1`;
   - else: `hi = mid`.
3. When `lo == hi`, that index holds the minimum → return `nums[lo]`.

Note `hi = mid` (not `mid - 1`) because `mid` may itself be the minimum. The
window always keeps at least one candidate, so no separate empty check is
needed.

## Walkthrough

`nums = [4, 5, 6, 7, 0, 1, 2]`

| `lo` | `hi` | `mid` | `nums[mid]` vs `nums[hi]` | action |
| --- | --- | --- | --- | --- |
| 0 | 6 | 3 | `7 > 2` | `lo = 4` |
| 4 | 6 | 5 | `1 ≤ 2` | `hi = 5` |
| 4 | 5 | 4 | `0 ≤ 1` | `hi = 4` |
| 4 | 4 | — | — | **answer = `nums[4] = 0`** |

## Complexity

| | Time | Space |
| --- | --- | --- |
| Binary search (optimal) | `O(log n)` | `O(1)` |
| Linear scan `min(nums)` | `O(n)` | `O(1)` |

- **Time `O(log n)`** — the window halves each step.
- **Space `O(1)`** — constant extra state.

## Edge cases

- **Not rotated** — `nums[mid] ≤ nums[hi]` always, so `hi` walks left to index 0.
- **Two elements** — `mid = 0`, compare `nums[0] > nums[1]` picks correctly.
- **Singleton** — loop never runs, returns the only element.
- **Minimum at the last index** — the `nums[mid] > nums[hi]` branch pushes `lo`
  right onto it.
- **Distinct values** — required; with duplicates the `nums[mid] == nums[hi]`
  case becomes ambiguous (the harder variant of this problem).

## Solution (`solution.py`)

```python
def find_min(nums: List[int]) -> int:
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]:
            lo = mid + 1
        else:
            hi = mid
    return nums[lo]
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py find_minimum_in_rotated_sorted_array

# same tests through pytest
pytest topics/05_binary_search/find_minimum_in_rotated_sorted_array -v

# your own case, one-shot
python3 run.py find_minimum_in_rotated_sorted_array -c '[[3,4,5,1,2]]'
```
