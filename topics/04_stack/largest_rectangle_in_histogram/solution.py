"""Largest Rectangle in Histogram — Monotonic Stack.

Given bar heights (each of width 1) forming a histogram, return the area of the
largest axis-aligned rectangle that fits entirely inside it.

Example
-------
    Input : heights = [2, 1, 5, 6, 2, 3]
    Output: 10             # bars 5 and 6: height 5, width 2

Time  O(n)  — each index is pushed and popped at most once.
Space O(n)  — the stack of indices.
"""
from typing import List


def largest_rectangle_area(heights: List[int]) -> int:
    """Area of the largest rectangle contained in the histogram."""
    best = 0
    stack: list[int] = []                 # indices of bars, heights non-decreasing
    # A trailing 0 is a sentinel that forces every remaining bar to be popped.
    for i, height in enumerate(heights + [0]):
        while stack and heights[stack[-1]] > height:
            bar = stack.pop()
            # left boundary is the new top (or the start); right boundary is i
            width = i if not stack else i - stack[-1] - 1
            best = max(best, heights[bar] * width)
        stack.append(i)
    return best


# NeetCode-style class wrapper. The loader prefers the top-level function.
class Solution:
    def largestRectangleArea(self, heights: List[int]) -> int:
        return largest_rectangle_area(heights)


if __name__ == "__main__":
    print(largest_rectangle_area([2, 1, 5, 6, 2, 3]))  # 10
    print(largest_rectangle_area([2, 4]))              # 4
    print(largest_rectangle_area([5, 4, 3, 2, 1]))     # 9
