# Insert Interval

**Topic:** Intervals · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/insert-interval/) · [NeetCode](https://neetcode.io/problems/insert-new-interval)

## Problem

You are given an array of non-overlapping intervals `intervals` where
`intervals[i] = [start_i, end_i]`, sorted in ascending order by `start_i`, and
an interval `new_interval`. Insert `new_interval` into `intervals` so that the
result is still sorted and non-overlapping, merging where necessary, and return
the result.

## Examples

| `intervals` | `new_interval` | Output | Why |
| --- | --- | --- | --- |
| `[[1,3],[6,9]]` | `[2,5]` | `[[1,5],[6,9]]` | `[2,5]` merges with `[1,3]` |
| `[[1,2],[3,5],[6,7],[8,10],[12,16]]` | `[4,8]` | `[[1,2],[3,10],[12,16]]` | bridges `[3,5],[6,7],[8,10]` |
| `[]` | `[5,7]` | `[[5,7]]` | empty input |
| `[[1,5]]` | `[2,3]` | `[[1,5]]` | fully contained |

## Intuition

The input is **already sorted by start**, so we do not need to sort anything —
we only need to find where `new_interval` "fits" and which neighbours it
overlaps. Overlap between `[a,b]` and `[c,d]` (with `a ≤ c`) happens exactly
when `c ≤ b`, i.e. the next start is not beyond the current end.

That splits the input into three consecutive blocks:

1. intervals entirely **before** `new_interval` (they end before it starts),
2. intervals that **overlap** `new_interval` (they start at or before its end),
3. intervals entirely **after** it.

## Approach

1. Copy every interval whose `end < new.start` straight to the output.
2. While the current interval's `start ≤ new.end`, absorb it by widening the
   pending interval: `start = min(start, cur.start)`, `end = max(end, cur.end)`.
3. Append the widened `[start, end]`.
4. Append the remaining untouched intervals.

Because `end` only grows and the intervals are sorted, each interval is visited
once.

### Sort by start vs. sort by end

We rely on the input being sorted by **start**: that is what lets a single pass
decide "before / overlapping / after" without re-sorting. If the input were
unsorted we would first sort by start (`O(n log n)`) and then merge. Sorting by
**end** is the useful order for greedy overlap *removal* (see
[Non-overlapping Intervals](../non_overlapping_intervals/explanation.md)) but is
not needed here.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Linear sweep (optimal) | `O(n)` | `O(n)` |
| Sort-then-merge | `O(n log n)` | `O(n)` |

## Edge cases

- **Empty input** — the merged interval is simply returned.
- **Fully contained** new interval (`[1,5]` + `[2,3]`) — the widened range is
  unchanged, and the surrounding intervals still pass through.
- **Touching endpoints** (`[1,5]` + `[5,8]`) — touching counts as overlap, so
  they merge into `[1,8]`.
- **Insert at the front/back** with no overlap.
- **New interval swallowing everything** (`[0,10]`).

## Solution (`solution.py`)

```python
def insert(intervals: List[List[int]], new_interval: List[int]) -> List[List[int]]:
    result: List[List[int]] = []
    i, n = 0, len(intervals)
    start, end = new_interval

    while i < n and intervals[i][1] < start:
        result.append(intervals[i])
        i += 1

    while i < n and intervals[i][0] <= end:
        start = min(start, intervals[i][0])
        end = max(end, intervals[i][1])
        i += 1
    result.append([start, end])

    while i < n:
        result.append(intervals[i])
        i += 1

    return result
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py insert_interval

# same tests through pytest
pytest topics/16_intervals/insert_interval -v

# your own case, one-shot
python3 run.py insert_interval -c '[[[1,3],[6,9]], [2,5]]'
```
