# Kth Largest Element in an Array

**Topic:** Heap / Priority Queue · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/kth-largest-element-in-an-array/) · [NeetCode](https://neetcode.io/problems/kth-largest-element-in-an-array)

## Problem

Given an integer array `nums` and an integer `k`, return the **k-th largest**
element in the array. Note that it is the k-th largest in **sorted order**, not
the k-th distinct element.

## Examples

| `nums` | `k` | Output |
| --- | --- | --- |
| `[3,2,1,5,6,4]` | `2` | `5` |
| `[3,2,3,1,2,4,5,5,6]` | `4` | `4` |
| `[3,3,3]` | `2` | `3` |

## Intuition

A full sort (`O(n log n)`) answers the question directly, but we do not need the
whole ordering — only the `k` largest values. Keeping a **min-heap of size k**
does exactly that: the root is the smallest of those k values, which *is* the
k-th largest.

Each incoming value either loses to the current root (ignored) or replaces it,
so we do only `O(log k)` work per element.

## Approach

1. Put the first `k` elements into a min-heap.
2. For every remaining element `num`:
   - if `num > heap[0]` (the smallest of the top-k), replace the root with
     `num` via `heapreplace`.
3. Return `heap[0]`.

## Walkthrough

`nums = [3, 2, 1, 5, 6, 4]`, `k = 2`

| step | heap (size 2) | note |
| --- | --- | --- |
| init | `{3, 2}` → root `2` | two largest so far |
| `5` | `{5, 3}` → root `3` | `5 > 2` replaces `2` |
| `6` | `{6, 5}` → root `5` | `6 > 3` replaces `3` |
| `4` | `{6, 5}` | `4 < 5`, ignored |

Answer: `5`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Size-k min-heap (optimal here) | `O(n log k)` | `O(k)` |
| Full sort | `O(n log n)` | `O(n)` |
| Quickselect (average / worst) | `O(n)` / `O(n²)` | `O(1)` |

- **Time `O(n log k)`** — `O(n)` comparison plus at most `n` replacements at
  `O(log k)` each.
- **Space `O(k)`** — the heap holds at most `k` elements (copies the first `k`
  inputs).

## Edge cases

- **`k == 1`** — the heap tracks only the running maximum.
- **`k == n`** — the heap ends up holding every element; the root is the
  minimum.
- **Duplicates** — ties are ordinary elements; `[3,3,3]`, `k = 2` gives `3`.
- **All negative** — the comparison `num > heap[0]` works for negatives too.
- **Sorted input** — running time is unchanged; some replacements just never
  happen.

## Solution (`solution.py`)

```python
import heapq
from typing import List


def find_kth_largest(nums: List[int], k: int) -> int:
    heap = nums[:k]
    heapq.heapify(heap)
    for num in nums[k:]:
        if num > heap[0]:
            heapq.heapreplace(heap, num)
    return heap[0]
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py kth_largest_element_in_an_array

# same tests through pytest
pytest topics/09_heap_priority_queue/kth_largest_element_in_an_array -v
```
