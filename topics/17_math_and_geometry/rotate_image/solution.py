"""Rotate Image — Math & Geometry.

Rotate an ``n x n`` matrix by 90 degrees clockwise, in place (and also return
the same matrix).

Do it in two passes: transpose across the main diagonal, then reverse every
row. Both passes touch each cell O(1) times, so no extra matrix is needed.

Time  O(n^2) · Space O(1)
"""
from typing import List


def rotate(matrix: List[List[int]]) -> List[List[int]]:
    n = len(matrix)

    # 1) Transpose: swap matrix[i][j] with matrix[j][i] for j > i.
    for i in range(n):
        for j in range(i + 1, n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]

    # 2) Reverse each row: transposing alone gives a 90° counter-clockwise
    #    rotation, so mirroring the rows finishes the clockwise turn.
    for row in matrix:
        row.reverse()

    return matrix


if __name__ == "__main__":
    print(rotate([[1, 2, 3], [4, 5, 6], [7, 8, 9]]))
    # [[7, 4, 1], [8, 5, 2], [9, 6, 3]]
