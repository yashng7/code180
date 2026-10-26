# K Closest Points to Origin

**Topic:** Heap / Priority Queue · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/k-closest-points-to-origin/) · [NeetCode](https://neetcode.io/problems/k-closest-points-to-origin)

## Problem

Given an array of `points` where `points[i] = [x_i, y_i]` and an integer `k`,
return the `k` points **closest** to the origin `(0, 0)`. The distance is the
usual Euclidean distance. The answer may be returned in any order.

## Examples

| `points` | `k` | Output |
| --- | --- | --- |
| `[[1,3],[-2,2]]` | `1` | `[[-2,2]]` |
| `[[3,3],[5,-1],[-2,4]]` | `2` | `[[3,3],[-2,4]]` |
| `[[1,0],[-1,0]]` | `2` | `[[1,0],[-1,0]]` (tie) |

## Intuition

Distance to the origin is `sqrt(x² + y²)`. Because the square root is monotonic,
comparing **squared** distances `x² + y²` gives the same ordering — and avoids
floating-point error entirely.

We only need the `k` smallest, so a **max-heap of size k** is ideal: it lets us
evict the farthest point whenever we exceed `k` in `O(log k)`. When we are done,
the heap holds exactly the `k` closest points.

## Approach

1. For each point build the tuple `(-(x² + y²), x, y)` — negated so that
   Python's min-heap behaves like a max-heap on distance.
2. `heapify` the list.
3. While more than `k` tuples remain, pop the root (the farthest kept point).
4. Return the surviving points as `[x, y]` lists.

## Walkthrough

`points = [[3,3],[5,-1],[-2,4]]`, `k = 2`

Squared distances: `18`, `26`, `20`.

- Heap: `(-18,3,3), (-26,5,-1), (-20,-2,4)`. The largest distance is `26`, so
  pop `(-26, 5, -1)`.
- Remaining: `(-20,-2,4)` and `(-18,3,3)` → `[[-2,4],[3,3]]`, i.e. the two
  closest points `[-2,4]` (20) and `[3,3]` (18).

## Complexity

| | Time | Space |
| --- | --- | --- |
| Size-k max-heap (uses `O(k)` space) | `O(n log k)` | `O(k)` |
| Sort all points | `O(n log n)` | `O(n)` |
| Quickselect (average) | `O(n)` | `O(1)` |

- **Time `O(n log n)`** to heapify plus `O(n log k)` for the pops; the
  `O(n log k)` form is strictly better when `k ≪ n`.
- **Space `O(k)`** — the heap never holds more than `k` points after trimming.

## Edge cases

- **Ties** — points at equal distance may be chosen in any order, so any valid
  subset is accepted (`compare: "unordered"` on the outer list only; each point
  keeps its `[x, y]` order).
- **The origin itself** — `(0,0)` has distance `0` and is always closest.
- **`k` equals the number of points** — the heap is returned unchanged.
- **Negative coordinates** — squaring removes the sign.
- **Large coordinates** — Python integers do not overflow.

## Solution (`solution.py`)

```python
import heapq
from typing import List


def k_closest(points: List[List[int]], k: int) -> List[List[int]]:
    heap = [(-(x * x + y * y), x, y) for x, y in points]
    heapq.heapify(heap)
    while len(heap) > k:
        heapq.heappop(heap)
    return [[x, y] for _, x, y in heap]
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py k_closest_points_to_origin

# same tests through pytest
pytest topics/09_heap_priority_queue/k_closest_points_to_origin -v
```
