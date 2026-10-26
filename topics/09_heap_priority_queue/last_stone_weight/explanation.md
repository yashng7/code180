# Last Stone Weight

**Topic:** Heap / Priority Queue · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/last-stone-weight/) · [NeetCode](https://neetcode.io/problems/last-stone-weight)

## Problem

You are given an array of integers `stones` where `stones[i]` is the weight of
the i-th stone. Repeatedly pick the **two heaviest** stones and smash them:

- if their weights are equal, both are destroyed;
- otherwise the lighter is destroyed and the heavier becomes the difference.

Return the weight of the last remaining stone, or `0` if none remain.

## Examples

| `stones` | Output | Why |
| --- | --- | --- |
| `[2, 7, 4, 1, 8, 1]` | `1` | `8-7=1`, `4-2=2`, `2-1=1`, `1-1=0`, left `1` |
| `[1]` | `1` | nothing to smash |
| `[2, 2]` | `0` | equal stones annihilate |

## Intuition

Every step needs the two **largest** values. A sorted list would work but costs
`O(n log n)` per extraction. A **max-heap** gives the maximum at its root in
`O(1)` and restores order in `O(log n)`, so the whole simulation costs
`O(n log n)`.

Python's `heapq` is a min-heap, so we store **negated** weights and flip the
sign on the way out.

## Approach

1. Build `heap = [-s for s in stones]` and `heapify` it.
2. While at least two stones remain:
   - pop twice to get the two heaviest, `y` and `x` (`y >= x`);
   - if `y != x`, push `-(y - x)` back.
3. Return the single remaining value (negated), or `0` if the heap is empty.

## Walkthrough

`stones = [2, 7, 4, 1, 8, 1]`

| heaviest pair | result | remaining |
| --- | --- | --- |
| `8, 7` | `1` | `[4, 2, 1, 1, 1]` |
| `4, 2` | `2` | `[2, 1, 1, 1]` |
| `2, 1` | `1` | `[1, 1, 1]` |
| `1, 1` | `0` (destroyed) | `[1]` |

Answer: `1`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Max-heap (optimal) | `O(n log n)` | `O(n)` |
| Sort then re-sort each step | `O(n² log n)` | `O(n)` |

- **Time `O(n log n)`** — each smash does a constant number of `O(log n)` heap
  operations, and there are `O(n)` smashes.
- **Space `O(n)`** — the heap holds at most `n` stones.

## Edge cases

- **Single stone** — the loop never runs; return it directly.
- **Equal heaviest stones** — remove both, push nothing.
- **All stones annihilate** — the heap ends empty; return `0`.
- **One stone left of a matched pair** — e.g. `[10, 10, 10]` leaves `10`.
- **Ties in the second position** — any choice of the two heaviest yields the
  same multiset going forward, so the answer is well defined.

## Solution (`solution.py`)

```python
import heapq
from typing import List


def last_stone_weight(stones: List[int]) -> int:
    heap = [-s for s in stones]
    heapq.heapify(heap)
    while len(heap) > 1:
        y = -heapq.heappop(heap)
        x = -heapq.heappop(heap)
        if y != x:
            heapq.heappush(heap, -(y - x))
    return -heap[0] if heap else 0
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py last_stone_weight

# same tests through pytest
pytest topics/09_heap_priority_queue/last_stone_weight -v
```
