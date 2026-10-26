"""Maximum Product Subarray — 1-D Dynamic Programming.

Return the largest product of a contiguous subarray of ``nums``. Negatives can
flip sign, so track **both** the maximum and minimum product ending at each
position.

Time  O(n) · Space O(1).
"""
from typing import List


def max_product(nums: List[int]) -> int:
    """Return the maximum product of any contiguous subarray."""
    best = current_max = current_min = nums[0]
    for value in nums[1:]:
        if value < 0:  # a negative flips the roles of max and min
            current_max, current_min = current_min, current_max
        current_max = max(value, current_max * value)
        current_min = min(value, current_min * value)
        best = max(best, current_max)
    return best


class Solution:
    def maxProduct(self, nums: List[int]) -> int:
        return max_product(nums)


if __name__ == "__main__":
    print(max_product([2, 3, -2, 4]))   # 6
    print(max_product([-2, 0, -1]))     # 0
