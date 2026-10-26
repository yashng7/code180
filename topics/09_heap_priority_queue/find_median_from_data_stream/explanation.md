# Find Median from Data Stream

**Topic:** Heap / Priority Queue · **Difficulty:** Hard
**Links:** [LeetCode](https://leetcode.com/problems/find-median-from-data-stream/) · [NeetCode](https://neetcode.io/problems/find-median-in-a-data-stream)

## Problem

Design a data structure that supports two operations:

- `addNum(num)` — add an integer from the data stream.
- `findMedian() -> float` — return the median of all elements added so far.

The median is the middle value of the sorted data (for an even count, the mean
of the two middle values).

## Examples

| operations | returns |
| --- | --- |
| `addNum(1)`, `addNum(2)`, `findMedian()` | `1.5` |
| `addNum(3)`, `findMedian()` | `2.0` (data `1,2,3`) |

`null` marks the constructor and every `addNum` call.

## Intuition

The median splits the data into a **lower half** and an **upper half**. If we
keep each half in a heap, the two middle values are always available at the
tops:

- a **max-heap** for the lower half, so its largest element is on top;
- a **min-heap** for the upper half, so its smallest element is on top.

If the two halves are balanced (sizes differ by at most one), then:

- **odd count** — the lower (larger) half has one extra element; the median is
  its top;
- **even count** — the median is the average of the two tops.

## Approach

1. `addNum(num)`: push `num` onto the lower max-heap, then move its maximum to
   the upper min-heap. This guarantees `max(lower) <= min(upper)`.
2. If the upper heap grows larger than the lower, move its minimum back to the
   lower heap, restoring `len(lower) >= len(upper)`.
3. `findMedian()`: if the lower heap is bigger, return its top; otherwise
   return the average of both tops.

Python's `heapq` is a min-heap, so the lower half stores **negated** values.

## Walkthrough

Adding `1, 2, 3` in order:

| `addNum` | lower (max-heap) | upper (min-heap) | median |
| --- | --- | --- | --- |
| `1` | `{1}` | `{}` | `1.0` |
| `2` | `{1}` | `{2}` | `1.5` |
| `3` | `{2, 1}` | `{3}` | `2.0` |

## Complexity

| | `addNum` | `findMedian` | Space |
| --- | --- | --- | --- |
| Two heaps (optimal) | `O(log n)` | `O(1)` | `O(n)` |
| Keep a sorted list | `O(n)` | `O(1)` | `O(n)` |

- **Time `O(log n)`** per insert — a constant number of heap operations.
- **Space `O(n)`** — every value is stored exactly once across the two heaps.

## Edge cases

- **Single element** — the lower heap holds it; `findMedian` returns it as a
  float.
- **Even count** — returns the mean of the two middle values (`1.0`-style when
  both are equal).
- **Duplicates** — equal values sit on both sides without breaking the balance.
- **Negatives / unsorted inserts** — the balancing step keeps the invariants.
- **Return type** — an `int` median is promoted to `float`; the comparison uses
  a `1e-6` tolerance.

## Solution (`solution.py`)

```python
import heapq


class MedianFinder:
    def __init__(self) -> None:
        self._small: list[int] = []      # max-heap (negated), lower half
        self._large: list[int] = []      # min-heap, upper half

    def addNum(self, num: int) -> None:
        heapq.heappush(self._small, -num)
        heapq.heappush(self._large, -heapq.heappop(self._small))
        if len(self._large) > len(self._small):
            heapq.heappush(self._small, -heapq.heappop(self._large))

    def findMedian(self) -> float:
        if len(self._small) > len(self._large):
            return float(-self._small[0])
        return (-self._small[0] + self._large[0]) / 2.0
```

## How to run the tests

```bash
# built-in test cases (7 of them)
python3 run.py find_median_from_data_stream

# same tests through pytest
pytest topics/09_heap_priority_queue/find_median_from_data_stream -v
```
