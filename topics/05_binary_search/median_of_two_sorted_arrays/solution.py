"""Median of Two Sorted Arrays — Binary Search.

Return the median of two sorted arrays in logarithmic time.

Time O(log(min(m, n))) · Space O(1)
"""
from typing import List


def find_median_sorted_arrays(nums1: List[int], nums2: List[int]) -> float:
    """Partition the two arrays so the left half holds the smaller values."""
    # Search the shorter array so ``j`` stays a valid index.
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    m, n = len(nums1), len(nums2)
    half = (m + n + 1) // 2          # size of the combined left half
    lo, hi = 0, m
    while lo <= hi:
        i = (lo + hi) // 2           # elements taken from nums1
        j = half - i                 # elements taken from nums2
        left1 = nums1[i - 1] if i > 0 else float("-inf")
        right1 = nums1[i] if i < m else float("inf")
        left2 = nums2[j - 1] if j > 0 else float("-inf")
        right2 = nums2[j] if j < n else float("inf")

        if left1 <= right2 and left2 <= right1:
            if (m + n) % 2 == 1:
                return float(max(left1, left2))
            return (max(left1, left2) + min(right1, right2)) / 2.0
        if left1 > right2:
            hi = i - 1               # took too many from nums1
        else:
            lo = i + 1               # took too few from nums1
    raise ValueError("Input arrays are not sorted")


if __name__ == "__main__":
    print(find_median_sorted_arrays([1, 3], [2]))       # 2.0
    print(find_median_sorted_arrays([1, 2], [3, 4]))    # 2.5
    print(find_median_sorted_arrays([], [1]))           # 1.0
