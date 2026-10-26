"""K Closest Points to Origin — Heap / Priority Queue.

Return the ``k`` points closest to the origin (Euclidean distance).

Idea: keep a size-k max-heap keyed by squared distance. Squared distance
preserves ordering, so no square root is needed.

Time  O(n log k) · Space O(k)
"""
import heapq
from typing import List


def k_closest(points: List[List[int]], k: int) -> List[List[int]]:
    """Return any ``k`` points with the smallest distance to ``(0, 0)``."""
    # Max-heap of the k smallest distances: store negated distance so the
    # root is the *farthest* point kept so far and can be evicted.
    heap = [(-(x * x + y * y), x, y) for x, y in points]
    heapq.heapify(heap)
    while len(heap) > k:
        heapq.heappop(heap)
    return [[x, y] for _, x, y in heap]


if __name__ == "__main__":
    print(k_closest([[1, 3], [-2, 2]], 1))          # [[-2, 2]]
    print(k_closest([[3, 3], [5, -1], [-2, 4]], 2))  # [[3, 3], [-2, 4]]
