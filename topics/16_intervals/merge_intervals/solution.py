"""Merge Intervals — Intervals.

Merge all overlapping intervals and return a list of disjoint intervals.

Time  O(n log n)  — dominated by the sort by start.
Space O(n)        — the output list.
"""
from typing import List


def merge(intervals: List[List[int]]) -> List[List[int]]:
    """Sort by start and coalesce every interval that overlaps the last one."""
    result: List[List[int]] = []
    for start, end in sorted(intervals):
        # sorted() on [start, end] pairs orders by start, then by end.
        if result and start <= result[-1][1]:
            result[-1][1] = max(result[-1][1], end)   # extend, never shrink
        else:
            result.append([start, end])
    return result


class Solution:
    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
        return merge(intervals)


if __name__ == "__main__":
    print(merge([[1, 3], [2, 6], [8, 10], [15, 18]]))  # [[1,6],[8,10],[15,18]]
    print(merge([[1, 4], [4, 5]]))                     # [[1, 5]]
    print(merge([[1, 4], [0, 4]]))                     # [[0, 4]]
