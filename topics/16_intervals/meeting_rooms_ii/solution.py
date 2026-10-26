"""Meeting Rooms II — Intervals.

Return the minimum number of conference rooms required to hold all meetings.

Time  O(n log n)  — sort by start plus a heap of size ≤ n.
Space O(n)        — the heap of active meeting end times.
"""
import heapq
from typing import List


def min_meeting_rooms(intervals: List[List[int]]) -> int:
    """Sweep meetings in start order, reusing the room that frees up first."""
    if not intervals:
        return 0
    intervals = sorted(intervals)          # process by start time
    # Min-heap of end times of meetings currently in progress.
    active_ends: List[int] = []
    for start, end in intervals:
        # If the earliest-finishing active meeting is done by `start`, reuse it.
        if active_ends and active_ends[0] <= start:
            heapq.heappop(active_ends)
        heapq.heappush(active_ends, end)
    # Every heap entry is a meeting that overlaps some other concurrently.
    return len(active_ends)


class Solution:
    def minMeetingRooms(self, intervals: List[List[int]]) -> int:
        return min_meeting_rooms(intervals)


if __name__ == "__main__":
    print(min_meeting_rooms([[0, 30], [5, 10], [15, 20]]))  # 2
    print(min_meeting_rooms([[7, 10], [2, 4]]))             # 1
    print(min_meeting_rooms([]))                            # 0
