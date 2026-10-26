"""Detect Squares — Math & Geometry.

Design a structure that supports adding lattice points and, for a query point,
counting how many **axis-aligned squares** can be formed using three previously
added points plus the query point.

Store the multiplicity of every distinct point. For a query ``(px, py)`` any
square must have exactly one vertical edge on the line ``x == px``, so walk the
stored points sharing that x-coordinate and probe the two squares that edge can
complete (to the right and to the left).

add:   O(1)
count: O(P) where P is the number of distinct stored points.
"""
from typing import List


class DetectSquares:
    """Count axis-aligned squares against previously added points."""

    def __init__(self) -> None:
        self._counts: dict[tuple[int, int], int] = {}

    def add(self, point: List[int]) -> None:
        key = (point[0], point[1])
        self._counts[key] = self._counts.get(key, 0) + 1

    def count(self, point: List[int]) -> int:
        px, py = point
        total = 0
        for (x, y), freq in self._counts.items():
            # A usable vertical edge needs the same x but a different y.
            if x != px or y == py:
                continue
            side = abs(y - py)
            for nx in (px + side, px - side):
                total += (
                    freq
                    * self._counts.get((nx, py), 0)
                    * self._counts.get((nx, y), 0)
                )
        return total


if __name__ == "__main__":
    ds = DetectSquares()
    ds.add([3, 10])
    ds.add([11, 2])
    ds.add([3, 2])
    print(ds.count([11, 10]))   # 1
    print(ds.count([14, 8]))    # 0
    ds.add([11, 2])
    print(ds.count([11, 10]))   # 2
