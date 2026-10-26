"""Insert Interval — Intervals.

Given a list of non-overlapping intervals sorted by start, insert
``new_interval`` (merging when necessary) and return the resulting list.

Time  O(n)  — one linear sweep over the already-sorted intervals.
Space O(n)  — the output list.
"""
from typing import List


def insert(intervals: List[List[int]], new_interval: List[int]) -> List[List[int]]:
    """Insert ``new_interval`` into ``intervals`` and merge any overlaps."""
    result: List[List[int]] = []
    i, n = 0, len(intervals)
    start, end = new_interval

    # 1. Intervals that end strictly before the new one starts: keep as-is.
    while i < n and intervals[i][1] < start:
        result.append(intervals[i])
        i += 1

    # 2. Intervals that overlap the new one: absorb them by widening [start, end].
    while i < n and intervals[i][0] <= end:
        start = min(start, intervals[i][0])
        end = max(end, intervals[i][1])
        i += 1
    result.append([start, end])

    # 3. Everything else comes after the merged interval.
    while i < n:
        result.append(intervals[i])
        i += 1

    return result


class Solution:
    def insert(
        self, intervals: List[List[int]], newInterval: List[int]
    ) -> List[List[int]]:
        return insert(intervals, newInterval)


if __name__ == "__main__":
    print(insert([[1, 3], [6, 9]], [2, 5]))            # [[1, 5], [6, 9]]
    print(insert([[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8]))
    # [[1, 2], [3, 10], [12, 16]]
    print(insert([], [5, 7]))                          # [[5, 7]]
