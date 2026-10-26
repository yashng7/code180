"""Kth Largest Element in an Array — Heap / Priority Queue.

Return the k-th largest element in ``nums`` (not the k-th distinct element).

Idea: keep a min-heap of the k largest values; its root is the answer.

Time  O(n log k) · Space O(k)
"""
import heapq
from typing import List


def find_kth_largest(nums: List[int], k: int) -> int:
    """Return the k-th largest element (1-indexed) in ``nums``."""
    heap = nums[:k]                  # min-heap of the k largest seen so far
    heapq.heapify(heap)
    for num in nums[k:]:
        if num > heap[0]:            # beats the current smallest of the top-k
            heapq.heapreplace(heap, num)
    return heap[0]


if __name__ == "__main__":
    print(find_kth_largest([3, 2, 1, 5, 6, 4], 2))              # 5
    print(find_kth_largest([3, 2, 3, 1, 2, 4, 5, 5, 6], 4))    # 4
