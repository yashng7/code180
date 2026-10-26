# Non-overlapping Intervals

**Topic:** Intervals · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/non-overlapping-intervals/) · [NeetCode](https://neetcode.io/problems/non-overlapping-intervals)

## Problem

Given an array of intervals, return the **minimum number** of intervals you need
to remove to make the rest non-overlapping. Touching endpoints (e.g. `[1,2]` and
`[2,3]`) do **not** count as an overlap.

## Examples

| `intervals` | Output | Why |
| --- | --- | --- |
| `[[1,2],[2,3],[3,4],[1,3]]` | `1` | remove `[1,3]` |
| `[[1,2],[1,2],[1,2]]` | `2` | keep one copy |
| `[[1,2],[2,3]]` | `0` | already disjoint |

## Intuition

Instead of asking "which to remove", ask "which to **keep**". Maximising the
number kept minimises the number removed, and the classic greedy for the maximum
set of pairwise non-overlapping intervals is: **always keep the interval that
ends earliest** among those still available. Finishing early leaves the most
room for later intervals.

## Approach

1. Sort the intervals by their **end** value.
2. Keep the first interval; remember its end as `prev_end`.
3. For each subsequent `[start, end]`:
   - if `start < prev_end` it overlaps the last kept interval → count it as
     removed;
   - otherwise it is compatible → keep it and set `prev_end = end`.
4. Return the number of removals (i.e. `total - kept`).

### Sort by start vs. sort by end

This is the scenario where the choice of key really matters:

- **Sort by end** (used here) is correct for the greedy. Keeping the
  earliest-ending interval is exchange-argument optimal — you can always replace
  a kept interval with one that ends no later, freeing up room.
- **Sort by start** does *not* directly give the optimum for this greedy. For
  `[[1,3],[2,4],[3,5]]`, sorting by start and greedily dropping overlaps would
  reject `[2,4]` but might mis-handle cases depending on tie-breaks; sorting by
  end reliably yields one removal.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Sort by end + greedy (optimal) | `O(n log n)` | `O(n)` for the sort |
| Brute force subsets | exponential | `O(n)` |

## Edge cases

- **Empty / single interval** — nothing to remove.
- **Identical duplicates** — only one can be kept.
- **Touching endpoints** — allowed, so `[1,2],[2,3]` needs `0` removals.
- **Unsorted / descending input** — the sort normalises it.
- **One long interval swallowing others** — the greedy keeps the short ones.

## Solution (`solution.py`)

```python
def erase_overlap_intervals(intervals: List[List[int]]) -> int:
    if not intervals:
        return 0
    intervals = sorted(intervals, key=lambda pair: pair[1])
    removed = 0
    prev_end = intervals[0][1]
    for start, end in intervals[1:]:
        if start < prev_end:
            removed += 1
        else:
            prev_end = end
    return removed
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py non_overlapping_intervals

# same tests through pytest
pytest topics/16_intervals/non_overlapping_intervals -v

# your own case, one-shot
python3 run.py non_overlapping_intervals -c '[[[1,2],[2,3],[3,4],[1,3]]]'
```
