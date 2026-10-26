"""Meeting Rooms — Intervals.

Determine whether a person can attend every meeting, i.e. no two overlap.

Time  O(n log n)  — sort by start, then check adjacent pairs.
Space O(1)        — beyond the sorted copy.
"""
from typing import List


def can_attend_meetings(intervals: List[List[int]]) -> bool:
    """Return True iff no two intervals overlap (touching is allowed)."""
    intervals = sorted(intervals)
    for i in range(1, len(intervals)):
        # Sorted by start, so an overlap shows up as the next start
        # falling before the previous end.
        if intervals[i][0] < intervals[i - 1][1]:
            return False
    return True


class Solution:
    def canAttendMeetings(self, intervals: List[List[int]]) -> bool:
        return can_attend_meetings(intervals)


if __name__ == "__main__":
    print(can_attend_meetings([[0, 30], [5, 10], [15, 20]]))  # False
    print(can_attend_meetings([[7, 10], [2, 4]]))             # True
    print(can_attend_meetings([]))                            # True
