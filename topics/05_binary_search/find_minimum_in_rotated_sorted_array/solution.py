"""Find Minimum in Rotated Sorted Array — Binary Search.

Return the minimum value of a rotated ascending array of distinct integers.

Time O(log n) · Space O(1)
"""
from typing import List


def find_min(nums: List[int]) -> int:
    """Binary search the rotation point by comparing against ``nums[hi]``."""
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]:
            lo = mid + 1          # min is strictly to the right of mid
        else:
            hi = mid              # min is at mid or to its left
    return nums[lo]


if __name__ == "__main__":
    print(find_min([3, 4, 5, 1, 2]))          # 1
    print(find_min([4, 5, 6, 7, 0, 1, 2]))    # 0
    print(find_min([11, 12, 13, 14, 15]))     # 11
