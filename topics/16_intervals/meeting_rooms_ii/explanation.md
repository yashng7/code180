# Meeting Rooms II

**Topic:** Intervals · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/meeting-rooms-ii/) · [NeetCode](https://neetcode.io/problems/meeting-schedule-ii)

## Problem

Given an array of meeting time intervals, return the **minimum number of
conference rooms** required so that all meetings can be held. This equals the
maximum number of meetings that overlap at any single point in time.

## Examples

| `intervals` | Output | Why |
| --- | --- | --- |
| `[[0,30],[5,10],[15,20]]` | `2` | `[5,10]` and `[15,20]` both sit inside `[0,30]` |
| `[[7,10],[2,4]]` | `1` | disjoint |
| `[[1,5],[5,10]]` | `1` | touching endpoints share a room |

## Intuition

The answer is the **peak concurrency**: the largest number of meetings running
at the same instant. Imagine a "sweep line" moving left to right through time.

A clean way to compute the peak is to process meetings in **start order** while
maintaining a min-heap of the **end times** of meetings currently in progress:

- when a new meeting starts, first discard (free) any in-progress meeting whose
  end time is `≤` the new start — it can reuse that room;
- then push the new meeting's end time.

At the end, the heap holds exactly the meetings that are still "occupying" a
room at the peak; its size is the number of rooms needed.

## Approach

1. If there are no meetings, return `0`.
2. Sort the intervals by start time.
3. Initialise an empty min-heap `active_ends`.
4. For each `[start, end]`:
   - if `active_ends` is non-empty and `active_ends[0] <= start`, pop it (the
     earliest-ending room is free, so reuse it);
   - push `end`.
5. Return `len(active_ends)`.

### Why "sweep line + heap"?

The **sweep line** idea is to convert intervals into a sequence of events and
track how many are simultaneously active. The heap makes the "earliest-ending
active meeting" query `O(log n)`, so the whole sweep is `O(n log n)`. An
equivalent implementation sorts all starts and ends and walks them with two
pointers, incrementing/decrementing a counter — same complexity, no heap needed.
Touching endpoints must free the room *before* the next meeting starts, which is
why the comparison uses `<=` on the end time.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Sort + heap (optimal) | `O(n log n)` | `O(n)` |
| Two-pointer start/end sweep | `O(n log n)` | `O(n)` |

## Edge cases

- **No meetings** — `0` rooms.
- **Single meeting** — `1` room.
- **Touching endpoints** — the later meeting reuses the room.
- **Fully nested meetings** — the outer interval keeps its room occupied.
- **Deep concurrency** — a peak of several meetings at one instant.

## Solution (`solution.py`)

```python
def min_meeting_rooms(intervals: List[List[int]]) -> int:
    if not intervals:
        return 0
    intervals = sorted(intervals)
    active_ends: List[int] = []
    for start, end in intervals:
        if active_ends and active_ends[0] <= start:
            heapq.heappop(active_ends)
        heapq.heappush(active_ends, end)
    return len(active_ends)
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py meeting_rooms_ii

# same tests through pytest
pytest topics/16_intervals/meeting_rooms_ii -v

# your own case, one-shot
python3 run.py meeting_rooms_ii -c '[[[0,30],[5,10],[15,20]]]'
```
