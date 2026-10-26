"""Find Median from Data Stream — Heap / Priority Queue.

Support adding numbers from a stream and querying the running median.

Idea: keep two heaps — a max-heap for the lower half and a min-heap for the
upper half — balanced to within one element. The median is then read off the
tops in O(1).

Time  O(log n) per ``addNum``, O(1) per ``findMedian``.
Space O(n).
"""
import heapq


class MedianFinder:
    """Tracks the median of n added numbers."""

    def __init__(self) -> None:
        self._small: list[int] = []      # max-heap (negated) — lower half
        self._large: list[int] = []      # min-heap — upper half

    def addNum(self, num: int) -> None:
        # Push onto the lower half, then move its largest to the upper half,
        # so every value in _small is <= every value in _large.
        heapq.heappush(self._small, -num)
        heapq.heappush(self._large, -heapq.heappop(self._small))
        # Keep the sizes balanced: _small may hold at most one extra element.
        if len(self._large) > len(self._small):
            heapq.heappush(self._small, -heapq.heappop(self._large))

    def findMedian(self) -> float:
        if len(self._small) > len(self._large):
            return float(-self._small[0])
        return (-self._small[0] + self._large[0]) / 2.0


if __name__ == "__main__":
    mf = MedianFinder()
    mf.addNum(1)
    mf.addNum(2)
    print(mf.findMedian())   # 1.5
    mf.addNum(3)
    print(mf.findMedian())   # 2.0
