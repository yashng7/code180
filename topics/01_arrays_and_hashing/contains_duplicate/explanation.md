# Contains Duplicate

**Topic:** Arrays & Hashing · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/contains-duplicate/) · [NeetCode](https://neetcode.io/problems/duplicate-integer)

## Problem

Given an integer array `nums`, return `True` if any value appears **at least
twice**, and `False` if every element is distinct.

## Examples

| `nums` | Output |
| --- | --- |
| `[1, 2, 3, 1]` | `True` |
| `[1, 2, 3, 4]` | `False` |
| `[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]` | `True` |

## Intuition

We only need to answer "have I seen this value before?". A **hash set** answers
that in `O(1)` average time, so a single pass suffices — as soon as a value is
already in the set, we can stop early.

## Approach

1. Keep an empty set `seen`.
2. For each value: if it is already in `seen`, return `True`; otherwise add it.
3. If the loop finishes, every value was unique → `False`.

Alternative after sorting: adjacent equal elements reveal a duplicate in
`O(n log n)` time and `O(1)` extra space.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Hash set (optimal) | `O(n)` | `O(n)` |
| Sort + scan | `O(n log n)` | `O(1)` |

## Edge cases

- Empty array → `False`.
- Single element → `False`.
- Negatives and zeros are handled like any other value.
- Early exit means a duplicate near the front is found fast.

## Solution

```python
def contains_duplicate(nums: List[int]) -> bool:
    seen: set[int] = set()
    for value in nums:
        if value in seen:
            return True
        seen.add(value)
    return False
```

## How to run

```bash
python3 run.py contains_duplicate
python3 run.py contains_duplicate -c '[[1,2,3,1]]'
```
