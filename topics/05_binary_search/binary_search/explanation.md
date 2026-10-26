# Binary Search

**Topic:** Binary Search · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/binary-search/) · [NeetCode](https://neetcode.io/problems/binary-search)

## Problem

Given a sorted (ascending) array `nums` of distinct integers and an integer
`target`, return the index of `target` if it exists, otherwise return `-1`.

You must write an algorithm with `O(log n)` runtime complexity.

## Examples

| `nums` | `target` | Output | Why |
| --- | --- | --- | --- |
| `[-1, 0, 3, 5, 9, 12]` | `9` | `4` | `nums[4] == 9` |
| `[-1, 0, 3, 5, 9, 12]` | `2` | `-1` | `2` is not present |
| `[5]` | `5` | `0` | the only element matches |

## Intuition

Because the array is **sorted**, comparing `target` with the element in the
middle tells us which half can be discarded:

- if `nums[mid] < target`, every element at or before `mid` is too small, so the
  answer (if any) lies in the **right** half;
- if `nums[mid] > target`, the answer lies in the **left** half.

Each comparison throws away half of the remaining candidates, so a search space
of `n` shrinks to `1` after `log₂ n` steps.

## Approach

1. Set the search window `lo = 0`, `hi = len(nums) - 1`.
2. While `lo <= hi`:
   - `mid = (lo + hi) // 2`;
   - if `nums[mid] == target`, return `mid`;
   - if `nums[mid] < target` move `lo = mid + 1`, otherwise `hi = mid - 1`.
3. If the window empties, the target is absent — return `-1`.

The `lo <= hi` (closed interval) form keeps the invariant that any remaining
candidate is inside `[lo, hi]`.

## Walkthrough

`nums = [-1, 0, 3, 5, 9, 12]`, `target = 9`

| `lo` | `hi` | `mid` | `nums[mid]` | action |
| --- | --- | --- | --- | --- |
| 0 | 5 | 2 | 3 | `3 < 9` → `lo = 3` |
| 3 | 5 | 4 | 9 | **match → return 4** |

## Complexity

| | Time | Space |
| --- | --- | --- |
| Binary search (optimal) | `O(log n)` | `O(1)` |
| Linear scan | `O(n)` | `O(1)` |

- **Time `O(log n)`** — the window halves every iteration.
- **Space `O(1)`** — only a few integer indices are stored.

## Edge cases

- **Empty array** — `lo = 0`, `hi = -1`, the loop never runs, returns `-1`.
- **Single element** — one comparison decides found/absent.
- **Target at an end** — first or last index falls out of the halving naturally.
- **Target absent** — the window collapses and the loop exits with `-1`.
- **Distinct values** — required by the problem; duplicates would make the index
  ambiguous.

## Solution (`solution.py`)

```python
def search(nums: List[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py binary_search

# same tests through pytest
pytest topics/05_binary_search/binary_search -v

# your own case, one-shot
python3 run.py binary_search -c '[[-1,0,3,5,9,12], 9]'
```
