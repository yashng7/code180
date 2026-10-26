# Merge Intervals

**Topic:** Intervals · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/merge-intervals/) · [NeetCode](https://neetcode.io/problems/merge-intervals)

## Problem

Given an array of `intervals` where `intervals[i] = [start_i, end_i]`, merge all
overlapping intervals and return an array of the non-overlapping intervals that
cover all the intervals in the input.

## Examples

| `intervals` | Output | Why |
| --- | --- | --- |
| `[[1,3],[2,6],[8,10],[15,18]]` | `[[1,6],[8,10],[15,18]]` | `[1,3]` and `[2,6]` overlap |
| `[[1,4],[4,5]]` | `[[1,5]]` | touching endpoints merge |
| `[[1,4],[0,4]]` | `[[0,4]]` | same end, smaller start |

## Intuition

Two intervals overlap if the later one starts **at or before** the earlier one
ends. The problem with scanning in the given order is that overlaps can be
"hidden" — `[1,4]` and `[0,4]` overlap, but the second starts before the first.

Sorting by **start** removes that ambiguity: once intervals are ordered by their
left endpoint, a single left-to-right pass suffices. If the next interval's
`start` is `≤` the current merged interval's `end`, they overlap and we extend;
otherwise we start a new merged interval.

## Approach

1. Sort the intervals by `start` (`sorted()` on `[start, end]` pairs does this).
2. Walk through them, keeping a `result` list of merged intervals:
   - if `result` is non-empty and `start <= result[-1][1]`, the interval
     overlaps the last merged one — widen it with
     `result[-1][1] = max(result[-1][1], end)`;
   - otherwise append `[start, end]` as a new merged interval.
3. Return `result`.

### Sort by start vs. sort by end

- **Sort by start** is the natural choice here: it guarantees that every
  interval that could extend the current run appears contiguously, so a single
  pass is enough.
- **Sort by end** is used by greedy problems that *remove* overlaps (keep the
  interval that finishes earliest). For merging, sorting by end would not keep
  overlapping runs contiguous in the same way, so we use start.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Sort + sweep (optimal) | `O(n log n)` | `O(n)` |
| Compare every pair | `O(n²)` | `O(n)` |

## Edge cases

- **Touching endpoints** (`[1,4]`, `[4,5]`) — `4 <= 4`, so they merge.
- **Contained interval** (`[1,4]`, `[2,3]`) — `max` keeps the end at `4`.
- **Unsorted input** — sorting handles it.
- **Single interval** / **disjoint intervals** — returned unchanged.
- **One interval covering all others** — everything collapses to one.

## Solution (`solution.py`)

```python
def merge(intervals: List[List[int]]) -> List[List[int]]:
    result: List[List[int]] = []
    for start, end in sorted(intervals):
        if result and start <= result[-1][1]:
            result[-1][1] = max(result[-1][1], end)
        else:
            result.append([start, end])
    return result
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py merge_intervals

# same tests through pytest
pytest topics/16_intervals/merge_intervals -v

# your own case, one-shot
python3 run.py merge_intervals -c '[[[1,3],[2,6],[8,10],[15,18]]]'
```
