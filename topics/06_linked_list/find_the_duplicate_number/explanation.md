# Find the Duplicate Number

**Topic:** Linked List · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/find-the-duplicate-number/) · [NeetCode](https://neetcode.io/problems/find-duplicate-integer)

## Problem

An array `nums` of length `n + 1` contains integers in `[1, n]` with **exactly
one** value repeated (possibly many times). Return that repeated value **without
modifying the array** and using `O(1)` extra space.

## Examples

| Input | Output |
| --- | --- |
| `[1, 3, 4, 2, 2]` | `2` |
| `[3, 1, 3, 4, 2]` | `3` |
| `[3, 3, 3, 3, 3]` | `3` |

## Intuition

Treat each value as a "next pointer": index `i` points to index `nums[i]`. Since
one value repeats and every value is in `[1, n]`, following these pointers from
index `0` must eventually enter a cycle, and the **entry point** of that cycle is
exactly the duplicated value. This turns the problem into linked-list cycle
detection.

## Approach

1. **Phase 1** — slow moves one step (`nums[slow]`), fast moves two
   (`nums[nums[fast]]`) until they meet inside the cycle.
2. **Phase 2** — reset `slow = 0`; advance both one step at a time until they
   meet again. That meeting index is the cycle entrance = the duplicate.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Floyd's (used) | `O(n)` | `O(1)` |
| Sort / hash set | `O(n log n)` / `O(n)` | `O(1)` / `O(n)` |

## Edge cases

- **`n = 1`** (`[1, 1]`) → returns `1`.
- **Duplicate value appears many times** (`[3,3,3,3,3]`) → still `3`.
- **Duplicate at an arbitrary index** — the pointer graph is value-based, so
  position does not affect the algorithm.

## Solution (`solution.py`)

```python
def find_duplicate(nums: List[int]) -> int:
    slow = fast = 0
    while True:
        slow = nums[slow]
        fast = nums[nums[fast]]
        if slow == fast:
            break
    slow = 0
    while slow != fast:
        slow = nums[slow]
        fast = nums[fast]
    return slow
```

## How to run the tests

```bash
python3 run.py find_the_duplicate_number
pytest topics/06_linked_list/find_the_duplicate_number -v
```
