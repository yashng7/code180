# Meeting Rooms

**Topic:** Intervals · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/meeting-rooms/) · [NeetCode](https://neetcode.io/problems/meeting-schedule)

## Problem

Given an array of meeting time intervals, determine whether a person can attend
all of them — i.e. whether **any two meetings overlap**. Touching endpoints
(one meeting ending exactly when another starts) is allowed.

## Examples

| `intervals` | Output | Why |
| --- | --- | --- |
| `[[0,30],[5,10],[15,20]]` | `false` | `[5,10]`/`[15,20]` fall inside `[0,30]` |
| `[[7,10],[2,4]]` | `true` | disjoint after sorting |
| `[[1,5],[5,10]]` | `true` | touching endpoints |

## Intuition

Two meetings conflict if one starts before the other ends. Sorting by **start**
turns "does any pair overlap?" into a check of only **adjacent** intervals: if
interval `i` starts before interval `i-1` ends, there is a conflict. Any
non-adjacent conflict would also show up between neighbours in a sorted list.

## Approach

1. Sort the intervals by start.
2. Scan `i = 1 .. n-1`; if `intervals[i][0] < intervals[i-1][1]`, return
   `False`.
3. If the loop finishes, return `True`.

### Sort by start vs. sort by end

Sorting by either endpoint would detect conflicts here, but **sort by start** is
the natural fit because the overlap test `next.start < prev.end` compares the
next start against the previous end. Sorting by start also matches the sibling
problems (merge, insert). Sorting by end is reserved for greedy *removal*
problems where finishing early matters.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Sort + adjacent check (optimal) | `O(n log n)` | `O(n)` for the sort |
| All-pairs check | `O(n²)` | `O(1)` |

## Edge cases

- **No meetings** — attend them all trivially (`True`).
- **Single meeting** — `True`.
- **Touching endpoints** — not a conflict (strict `<`).
- **Reverse order** input — handled by the sort.
- **Nested meeting** — e.g. `[1,10]` containing `[2,3]` is a conflict.

## Solution (`solution.py`)

```python
def can_attend_meetings(intervals: List[List[int]]) -> bool:
    intervals = sorted(intervals)
    for i in range(1, len(intervals)):
        if intervals[i][0] < intervals[i - 1][1]:
            return False
    return True
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py meeting_rooms

# same tests through pytest
pytest topics/16_intervals/meeting_rooms -v

# your own case, one-shot
python3 run.py meeting_rooms -c '[[[0,30],[5,10],[15,20]]]'
```
