"""Koko Eating Bananas — Binary Search.

Find the smallest integer eating speed that clears all piles within ``h`` hours.

Time O(n log m) · Space O(1)
"""
from typing import List


def min_eating_speed(piles: List[int], h: int) -> int:
    """Binary search on the *answer* (the speed), not on the array."""

    def hours_needed(speed: int) -> int:
        # ceil(pile / speed) hours for each pile
        return sum((pile + speed - 1) // speed for pile in piles)

    lo, hi = 1, max(piles)          # 1 is the slowest, max(piles) always works
    while lo < hi:
        mid = (lo + hi) // 2
        if hours_needed(mid) <= h:
            hi = mid                # feasible: try to go slower
        else:
            lo = mid + 1            # too slow: must speed up
    return lo


if __name__ == "__main__":
    print(min_eating_speed([3, 6, 7, 11], 8))        # 4
    print(min_eating_speed([30, 11, 23, 4, 20], 5))  # 30
    print(min_eating_speed([30, 11, 23, 4, 20], 6))  # 23
