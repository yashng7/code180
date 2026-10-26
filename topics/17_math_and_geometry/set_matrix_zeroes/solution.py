"""Set Matrix Zeroes — Math & Geometry.

If an element of ``matrix`` is 0, set its whole row and column to 0, in place
(and also return the matrix).

Use the first row and first column themselves as markers so no extra O(m+n)
storage is needed. Two booleans remember whether those marker lines should be
zeroed at the end.

Time  O(m * n) · Space O(1)
"""
from typing import List


def set_zeroes(matrix: List[List[int]]) -> List[List[int]]:
    rows, cols = len(matrix), len(matrix[0])
    first_row_zero = any(matrix[0][c] == 0 for c in range(cols))
    first_col_zero = any(matrix[r][0] == 0 for r in range(rows))

    # Pass 1: mark zeros on the first row / first column of each interior zero.
    for r in range(1, rows):
        for c in range(1, cols):
            if matrix[r][c] == 0:
                matrix[r][0] = 0
                matrix[0][c] = 0

    # Pass 2: zero each interior cell whose row or column marker is set.
    for r in range(1, rows):
        for c in range(1, cols):
            if matrix[r][0] == 0 or matrix[0][c] == 0:
                matrix[r][c] = 0

    # Finally handle the two marker lines, using the saved flags.
    if first_row_zero:
        for c in range(cols):
            matrix[0][c] = 0
    if first_col_zero:
        for r in range(rows):
            matrix[r][0] = 0

    return matrix


if __name__ == "__main__":
    print(set_zeroes([[1, 1, 1], [1, 0, 1], [1, 1, 1]]))
    # [[1, 0, 1], [0, 0, 0], [1, 0, 1]]
