"""Search a 2D Matrix — Binary Search.

Search a row-sorted, column-sorted ``m x n`` matrix for ``target``.

Time O(log(m·n)) · Space O(1)
"""
from typing import List


def search_matrix(matrix: List[List[int]], target: int) -> bool:
    """Binary search the matrix treated as one flat sorted array."""
    if not matrix or not matrix[0]:
        return False
    rows, cols = len(matrix), len(matrix[0])
    lo, hi = 0, rows * cols - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        value = matrix[mid // cols][mid % cols]
        if value == target:
            return True
        if value < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return False


if __name__ == "__main__":
    m = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]]
    print(search_matrix(m, 3))    # True
    print(search_matrix(m, 13))   # False
