"""Last Stone Weight — Heap / Priority Queue.

Repeatedly smash the two heaviest stones; a surviving stone gets their
difference. Return the weight of the final stone, or 0 if none remains.

Idea: a max-heap (implemented with negated weights) always hands us the two
heaviest stones in O(log n).

Time  O(n log n) · Space O(n)
"""
import heapq
from typing import List


def last_stone_weight(stones: List[int]) -> int:
    """Return the weight of the last remaining stone (0 if all destroyed)."""
    heap = [-s for s in stones]       # negate to fake a max-heap
    heapq.heapify(heap)
    while len(heap) > 1:
        y = -heapq.heappop(heap)      # heaviest
        x = -heapq.heappop(heap)      # second heaviest
        if y != x:
            heapq.heappush(heap, -(y - x))
    return -heap[0] if heap else 0


if __name__ == "__main__":
    print(last_stone_weight([2, 7, 4, 1, 8, 1]))   # 1
    print(last_stone_weight([1]))                  # 1
    print(last_stone_weight([2, 2]))               # 0
