"""Spiral Matrix — Math & Geometry.

Return all elements of ``matrix`` in clockwise spiral order.

Shrink a rectangular window one ring at a time: walk its top row, right
column, bottom row and left column, then move the boundaries inward.

Time  O(m * n) · Space O(1) extra (output not counted).
"""
from typing import List


def spiral_order(matrix: List[List[int]]) -> List[int]:
    if not matrix or not matrix[0]:
        return []

    result: List[int] = []
    top, bottom = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1

    while top <= bottom and left <= right:
        # top row, left -> right
        for col in range(left, right + 1):
            result.append(matrix[top][col])
        top += 1

        # right column, top -> bottom
        for row in range(top, bottom + 1):
            result.append(matrix[row][right])
        right -= 1

        if top <= bottom:
            # bottom row, right -> left
            for col in range(right, left - 1, -1):
                result.append(matrix[bottom][col])
            bottom -= 1

        if left <= right:
            # left column, bottom -> top
            for row in range(bottom, top - 1, -1):
                result.append(matrix[row][left])
            left += 1

    return result


if __name__ == "__main__":
    print(spiral_order([[1, 2, 3], [4, 5, 6], [7, 8, 9]]))     # [1..9]
    print(spiral_order([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]))
