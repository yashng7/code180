# Search in Rotated Sorted Array

**Topic:** Binary Search · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/search-in-rotated-sorted-array/) · [NeetCode](https://neetcode.io/problems/search-in-rotated-sorted-array)

## Problem

A sorted ascending array of **distinct** integers was rotated at some pivot.
Given the rotated array `nums` and an integer `target`, return the index of
`target`, or `-1` if it is absent. Required time: `O(log n)`.

## Examples

| `nums` | `target` | Output |
| --- | --- | --- |
| `[4,5,6,7,0,1,2]` | `0` | `4` |
| `[4,5,6,7,0,1,2]` | `3` | `-1` |
| `[1]` | `0` | `-1` |

## Intuition

Even after rotation, **at least one side of the midpoint is fully sorted**.
Looking at `nums[lo]` and `nums[mid]`:

- if `nums[lo] <= nums[mid]`, the range `[lo, mid]` is sorted;
- otherwise the range `[mid, hi]` is sorted.

Once we know which side is sorted, we can test in `O(1)` whether `target` falls
inside that sorted range:

- If it does, search there.
- If it does not, the target must lie on the **other** side.

This keeps the `O(log n)` halving while still handling the rotation.

## Approach

1. Set `lo = 0`, `hi = len(nums) - 1`.
2. While `lo <= hi`:
   - compute `mid`; return `mid` immediately on a match;
   - **left sorted** (`nums[lo] <= nums[mid]`): if `nums[lo] <= target <
     nums[mid]`, go left (`hi = mid - 1`); else go right (`lo = mid + 1`);
   - **right sorted** (else): if `nums[mid] < target <= nums[hi]`, go right
     (`lo = mid + 1`); else go left (`hi = mid - 1`).
3. Return `-1` if the window empties.

The strict/non-strict inequalities matter: `target < nums[mid]` and `target >
nums[mid]` are already handled by the equality check, so the ranges are exclusive
at `mid`.

## Walkthrough

`nums = [4, 5, 6, 7, 0, 1, 2]`, `target = 0`

| `lo` | `hi` | `mid` | sorted half | in range? | action |
| --- | --- | --- | --- | --- | --- |
| 0 | 6 | 3 | left (`4 ≤ 7`) | `4 ≤ 0 < 7`? no | `lo = 4` |
| 4 | 6 | 5 | right (`0 > 1` false → right sorted `1..2`) | `1 < 0 ≤ 2`? no | `hi = 4` |
| 4 | 4 | 4 | `nums[4] == 0` | — | **return 4** |

## Complexity

| | Time | Space |
| --- | --- | --- |
| Modified binary search (optimal) | `O(log n)` | `O(1)` |
| Linear scan | `O(n)` | `O(1)` |

- **Time `O(log n)`** — one comparison decides which half to keep.
- **Space `O(1)`** — constant state.

## Edge cases

- **Not rotated** — the left half is always sorted, degrading to plain binary
  search.
- **Rotation by one** — e.g. `[3, 1]`; the right-sorted branch handles it.
- **Singleton** — matches or the window closes on the first iteration.
- **Target at first/last index** — the range tests include the endpoints.
- **Distinct values** — required; duplicates break the `nums[lo] <= nums[mid]`
  test (see the follow-up with duplicates).

## Solution (`solution.py`)

```python
def search(nums: List[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[lo] <= nums[mid]:
            if nums[lo] <= target < nums[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:
            if nums[mid] < target <= nums[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py search_in_rotated_sorted_array

# same tests through pytest
pytest topics/05_binary_search/search_in_rotated_sorted_array -v

# your own case, one-shot
python3 run.py search_in_rotated_sorted_array -c '[[4,5,6,7,0,1,2], 0]'
```
