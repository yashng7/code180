"""Search in Rotated Sorted Array — Binary Search.

Return the index of ``target`` in a rotated ascending array of distinct values.

Time O(log n) · Space O(1)
"""
from typing import List


def search(nums: List[int], target: int) -> int:
    """Binary search, first deciding which half is the sorted one."""
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[lo] <= nums[mid]:
            # left half [lo, mid] is sorted
            if nums[lo] <= target < nums[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:
            # right half [mid, hi] is sorted
            if nums[mid] < target <= nums[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1


if __name__ == "__main__":
    print(search([4, 5, 6, 7, 0, 1, 2], 0))   # 4
    print(search([4, 5, 6, 7, 0, 1, 2], 3))   # -1
    print(search([1], 0))                     # -1
