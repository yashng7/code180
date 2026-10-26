# Minimum Interval to Include Each Query

**Topic:** Intervals · **Difficulty:** Hard
**Links:** [LeetCode](https://leetcode.com/problems/minimum-interval-to-include-each-query/) · [NeetCode](https://neetcode.io/problems/minimum-interval-including-query)

## Problem

Given an array `intervals` and an array `queries`, for each query `q` return the
**length of the smallest interval** `[l, r]` with `l ≤ q ≤ r`. If no interval
contains `q`, return `-1`.

## Examples

| `intervals` | `queries` | Output |
| --- | --- | --- |
| `[[1,4],[2,4],[3,6],[4,4]]` | `[2,3,4,5]` | `[3,3,1,4]` |
| `[[2,3],[2,5],[1,8],[20,25]]` | `[2,19,5,22]` | `[2,-1,4,6]` |

## Intuition

For a single query, the answer is "the shortest interval whose `l ≤ q ≤ r`". If
we answered each query independently that would be `O(n)` per query, i.e.
`O(nq)` overall — too slow.

The trick is **offline processing**: sort the *queries* by value, then sweep
through time (query values) in increasing order. As the sweep moves right:

- every interval whose `start ≤ q` becomes a **candidate** and is pushed onto a
  heap keyed by its **length**;
- any interval whose `end < q` is no longer a candidate (the sweep has passed
  it) and is popped;
- the heap's top is then the shortest interval covering `q`.

Because the sweep is monotonic in `q` and each interval enters and leaves the
heap at most once, everything is efficient.

## Approach

1. Sort `intervals` by start.
2. Build `order = sorted(range(len(queries)), key=queries.__getitem__)` so we
   visit queries from smallest to largest, while remembering their original
   index.
3. Maintain a min-heap of `(length, end)` for candidate intervals, and a pointer
   `j` into the sorted intervals.
4. For each query `q` (in sorted order):
   - while `j < n` and `intervals[j][0] <= q`, push
     `(end - start + 1, end)` and advance `j`;
   - while the heap top has `end < q`, pop it;
   - if the heap is non-empty, `answer[original_index] = heap[0][0]`.
5. Return `answer` (uncovered queries stay `-1`).

### Why "offline sorting"?

The heap's "shortest length" ordering is what we want, but intervals can only be
retired when the sweep passes their `end` — and that requires visiting queries
in increasing order. Sorting the queries (and restoring the original order at
the end) is what makes the single forward sweep valid. This is the classic
*offline* / sweep-line technique: reorder the work so a monotone scan can answer
everything at once.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Offline sort + heap (optimal) | `O((n + q) log n)` | `O(n + q)` |
| Brute force per query | `O(nq)` | `O(1)` |

## Edge cases

- **No covering interval** — answer `-1`.
- **Point interval** `[1,1]` — length `1`, only covers `q = 1`.
- **Queries beyond all endpoints** — retired from the heap.
- **Equal starts, different lengths** — the heap picks the shortest.
- **Duplicate queries** — each is answered independently from the same state.

## Solution (`solution.py`)

```python
def min_interval(intervals: List[List[int]], queries: List[int]) -> List[int]:
    intervals.sort(key=lambda pair: pair[0])
    order = sorted(range(len(queries)), key=lambda i: queries[i])
    answer = [-1] * len(queries)

    heap: List[tuple[int, int]] = []
    j = 0
    for i in order:
        q = queries[i]
        while j < len(intervals) and intervals[j][0] <= q:
            start, end = intervals[j]
            heapq.heappush(heap, (end - start + 1, end))
            j += 1
        while heap and heap[0][1] < q:
            heapq.heappop(heap)
        if heap:
            answer[i] = heap[0][0]
    return answer
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py minimum_interval_to_include_each_query

# same tests through pytest
pytest topics/16_intervals/minimum_interval_to_include_each_query -v

# your own case, one-shot
python3 run.py minimum_interval_to_include_each_query -c '[[[1,4],[2,4],[3,6],[4,4]], [2,3,4,5]]'
```
