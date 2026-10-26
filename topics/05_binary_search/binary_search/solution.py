"""Binary Search — Binary Search.

Return the index of ``target`` in a sorted array, or ``-1`` when absent.

Time O(log n) · Space O(1)
"""
from typing import List


def search(nums: List[int], target: int) -> int:
    """Classic binary search over a sorted ``nums``."""
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1          # target must be to the right
        else:
            hi = mid - 1          # target must be to the left
    return -1


if __name__ == "__main__":
    print(search([-1, 0, 3, 5, 9, 12], 9))   # 4
    print(search([-1, 0, 3, 5, 9, 12], 2))   # -1
    print(search([5], 5))                    # 0
