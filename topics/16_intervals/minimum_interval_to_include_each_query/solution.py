"""Minimum Interval to Include Each Query — Intervals.

For each query, return the length of the smallest interval that contains it,
or -1 if none does.

Time  O((n + q) log n)  — sort intervals and queries, then one sweep with a heap.
Space O(n + q)         — heap plus the answer/index arrays.
"""
import heapq
from typing import List


def min_interval(intervals: List[List[int]], queries: List[int]) -> List[int]:
    """Answer every query offline, sweeping intervals by start in query order."""
    intervals.sort(key=lambda pair: pair[0])

    # Process queries from smallest to largest so the sweep only moves forward.
    order = sorted(range(len(queries)), key=lambda i: queries[i])
    answer = [-1] * len(queries)

    heap: List[tuple[int, int]] = []   # (length, end) of candidate intervals
    j = 0
    for i in order:
        q = queries[i]
        # Admit every interval whose start is <= q.
        while j < len(intervals) and intervals[j][0] <= q:
            start, end = intervals[j]
            heapq.heappush(heap, (end - start + 1, end))
            j += 1
        # Discard intervals that end before q — they can't cover it.
        while heap and heap[0][1] < q:
            heapq.heappop(heap)
        if heap:
            answer[i] = heap[0][0]      # smallest length still covering q
    return answer


class Solution:
    def minInterval(self, intervals: List[List[int]], queries: List[int]) -> List[int]:
        return min_interval(intervals, queries)


if __name__ == "__main__":
    print(min_interval([[1, 4], [2, 4], [3, 6], [4, 4]], [2, 3, 4, 5]))
    # [3, 3, 1, 4]
    print(min_interval([[2, 3], [2, 5], [1, 8], [20, 25]], [2, 19, 5, 22]))
    # [2, -1, 4, 6]
