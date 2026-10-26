"""Maximum Subarray — Greedy.

Return the largest sum of any non-empty contiguous subarray of ``nums``.

Example
-------
    Input : nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
    Output: 6          # the subarray [4, -1, 2, 1]

Time  O(n)  — one pass over the array (Kadane's algorithm).
Space O(1)  — only two running scalars are kept.
"""
from typing import List


def max_subarray(nums: List[int]) -> int:
    """Return the maximum non-empty subarray sum (Kadane's algorithm)."""
    best = nums[0]          # best sum of an entire subarray seen so far
    current = nums[0]       # best sum of a subarray ending at the previous index
    for value in nums[1:]:
        # Either extend the previous run, or start a fresh run at ``value``.
        current = max(value, current + value)
        best = max(best, current)
    return best


if __name__ == "__main__":
    print(max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]))  # 6
    print(max_subarray([1]))                                # 1
    print(max_subarray([-3, -1, -2]))                       # -1
