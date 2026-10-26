"""Non-overlapping Intervals — Intervals.

Return the minimum number of intervals to remove so the rest do not overlap.

Time  O(n log n)  — sort by end, then one greedy pass.
Space O(1)        — beyond the sorted copy.
"""
from typing import List


def erase_overlap_intervals(intervals: List[List[int]]) -> int:
    """Greedily keep the interval that ends earliest, counting the rest."""
    if not intervals:
        return 0
    # Sort by END: keeping the earliest-ending compatible interval is optimal.
    intervals = sorted(intervals, key=lambda pair: pair[1])
    removed = 0
    prev_end = intervals[0][1]
    for start, end in intervals[1:]:
        if start < prev_end:      # overlaps the last kept interval
            removed += 1
        else:                     # compatible: keep it and advance
            prev_end = end
    return removed


class Solution:
    def eraseOverlapIntervals(self, intervals: List[List[int]]) -> int:
        return erase_overlap_intervals(intervals)


if __name__ == "__main__":
    print(erase_overlap_intervals([[1, 2], [2, 3], [3, 4], [1, 3]]))  # 1
    print(erase_overlap_intervals([[1, 2], [1, 2], [1, 2]]))          # 2
    print(erase_overlap_intervals([[1, 2], [2, 3]]))                  # 0
