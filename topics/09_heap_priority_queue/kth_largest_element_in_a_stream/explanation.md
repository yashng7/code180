# Kth Largest Element in a Stream

**Topic:** Heap / Priority Queue · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/kth-largest-element-in-a-stream/) · [NeetCode](https://neetcode.io/problems/kth-largest-integer-in-a-stream)

## Problem

Design a class `KthLargest` that tracks the **k-th largest** value in a stream:

- `KthLargest(k, nums)` — initialise with `k` and the initial stream `nums`.
- `add(val) -> int` — insert `val` into the stream and return the k-th largest
  element among all values seen so far (initial plus added).

## Examples

| operations | result |
| --- | --- |
| `KthLargest(3, [4,5,8,2])` | `null` |
| `add(3)` | `4` |
| `add(5)` | `5` |
| `add(10)` | `5` |
| `add(9)` | `8` |
| `add(4)` | `8` |

`null` marks the constructor; every `add` returns an integer.

## Intuition

The k-th largest is the **smallest** among the k largest values. So if we keep
exactly the k largest values seen so far, the answer is simply the minimum of
that set.

A **min-heap** gives us that minimum at its root in `O(1)`, and lets us replace
it in `O(log k)` whenever a bigger value arrives. Because we only ever keep `k`
values, memory stays bounded even for an endless stream.

## Approach

1. In the constructor, heapify `nums` and pop until at most `k` values remain.
2. On `add(val)`: push `val`; if the heap now holds more than `k` values, pop
   the smallest one.
3. Return `heap[0]` — the smallest of the k largest, i.e. the k-th largest.

## Walkthrough

`KthLargest(3, [4, 5, 8, 2])` → drop `2`, so the heap holds the three largest,
`{4, 5, 8}`, with root `4`.

| call | heap contents after | returned |
| --- | --- | --- |
| `add(3)` | push `3`, pop `3` → `{4, 5, 8}` | `4` |
| `add(5)` | push `5`, pop `4` → `{5, 5, 8}` | `5` |
| `add(10)` | push `10`, pop `5` → `{5, 8, 10}` | `5` |
| `add(9)` | push `9`, pop `5` → `{8, 9, 10}` | `8` |
| `add(4)` | push `4`, pop `4` → `{8, 9, 10}` | `8` |

The root is always the smallest of the k largest values — the k-th largest.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Size-k min-heap (optimal) | `O(log k)` per add | `O(k)` |
| Sort the whole stream per query | `O(n log n)` per add | `O(n)` |

- **Time `O(log k)`** — one push and at most one pop, both `O(log k)`.
- **Space `O(k)`** — the heap never grows beyond `k` elements (plus the initial
  list, copied once).

## Edge cases

- **k == 1** — the heap is just the running maximum.
- **Empty initial stream** — handled by `heapify([])`.
- **Stream shorter than k** — the heap holds everything; the constraints
  guarantee enough elements for a defined answer.
- **Duplicates** — each copy is an independent element, so a second largest of
  `1` is reported even when a larger value arrives.
- **Negatives / zero** — plain integer comparisons work unchanged.

## Solution (`solution.py`)

```python
import heapq
from typing import List


class KthLargest:
    def __init__(self, k: int, nums: List[int]) -> None:
        self._k = k
        self._heap = list(nums)
        heapq.heapify(self._heap)
        while len(self._heap) > k:
            heapq.heappop(self._heap)

    def add(self, val: int) -> int:
        heapq.heappush(self._heap, val)
        if len(self._heap) > self._k:
            heapq.heappop(self._heap)
        return self._heap[0]
```

## How to run the tests

```bash
# built-in test cases (7 of them)
python3 run.py kth_largest_element_in_a_stream

# same tests through pytest
pytest topics/09_heap_priority_queue/kth_largest_element_in_a_stream -v
```
