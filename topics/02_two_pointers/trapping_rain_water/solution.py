"""Trapping Rain Water — Two Pointers.

Given an array ``height`` where ``height[i]`` is the elevation of a bar of
width 1, compute how much water is trapped after raining.

Time  O(n)  — each bar is visited once as a pointer sweeps inward.
Space O(1)  — only the two pointers and the two running maxima.
"""
from typing import List


def trap(height: List[int]) -> int:
    """Return the total trapped water using two pointers with running maxima."""
    if not height:
        return 0

    left, right = 0, len(height) - 1
    left_max = right_max = 0
    water = 0

    while left < right:
        # The shorter side determines the water level at the current bar, so we
        # can settle that bar without knowing the exact far-side maximum.
        if height[left] < height[right]:
            if height[left] >= left_max:
                left_max = height[left]      # new highest left wall: no water
            else:
                water += left_max - height[left]
            left += 1
        else:
            if height[right] >= right_max:
                right_max = height[right]    # new highest right wall: no water
            else:
                water += right_max - height[right]
            right -= 1

    return water


# NeetCode-style class wrapper; the loader prefers the top-level function.
class Solution:
    def trap(self, height: List[int]) -> int:
        return trap(height)


if __name__ == "__main__":
    print(trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]))  # 6
    print(trap([4, 2, 0, 3, 2, 5]))                     # 9
    print(trap([]))                                     # 0
