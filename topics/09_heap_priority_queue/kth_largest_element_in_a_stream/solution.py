"""Kth Largest Element in a Stream — Heap / Priority Queue.

Design a class that returns the k-th largest element in a stream of integers.

Idea: keep a min-heap of the k largest values seen so far. Its root is exactly
the k-th largest element.

Time  O(log k) per ``add`` (plus O(n log k) to build).
Space O(k).
"""
import heapq
from typing import List


class KthLargest:
    """Reports the k-th largest value in a growing stream of integers."""

    def __init__(self, k: int, nums: List[int]) -> None:
        self._k = k
        self._heap = list(nums)          # min-heap of the k largest values
        heapq.heapify(self._heap)
        while len(self._heap) > k:
            heapq.heappop(self._heap)

    def add(self, val: int) -> int:
        heapq.heappush(self._heap, val)
        if len(self._heap) > self._k:    # drop the smallest so we keep k
            heapq.heappop(self._heap)
        return self._heap[0]


if __name__ == "__main__":
    kth = KthLargest(3, [4, 5, 8, 2])
    print(kth.add(3))    # 4
    print(kth.add(5))    # 5
    print(kth.add(10))   # 5
    print(kth.add(9))    # 8
    print(kth.add(4))    # 8
