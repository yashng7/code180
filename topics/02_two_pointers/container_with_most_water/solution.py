"""Container With Most Water — Two Pointers.

Given an array ``height`` where ``height[i]`` is the height of a vertical line
at ``x = i``, find two lines that together with the x-axis form a container
holding the most water, and return that maximum area.

Time  O(n)  — each step moves one pointer inward, at most n steps total.
Space O(1)  — only the two index pointers and the running maximum.
"""
from typing import List


def max_area(height: List[int]) -> int:
    """Return the largest water area any pair of lines can hold."""
    left, right = 0, len(height) - 1
    best = 0
    while left < right:
        width = right - left
        area = width * min(height[left], height[right])
        best = max(best, area)
        # Move the shorter wall inward: keeping it can never improve the area,
        # because the width only shrinks and the height is bounded by it.
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    return best


# NeetCode-style class wrapper; the loader prefers the top-level function.
class Solution:
    def maxArea(self, height: List[int]) -> int:
        return max_area(height)


if __name__ == "__main__":
    print(max_area([1, 8, 6, 2, 5, 4, 8, 3, 7]))  # 49
    print(max_area([1, 1]))                         # 1
    print(max_area([4, 3, 2, 1, 4]))                # 16
