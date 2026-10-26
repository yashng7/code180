"""Longest Increasing Path in a Matrix — 2-D Dynamic Programming.

Return the length of the longest path in ``matrix`` where each step moves to a
strictly larger value among the 4 orthogonal neighbours.

Only larger values are reachable, so the "graph" of cells is a DAG. Processing
cells in increasing value order makes every predecessor final before it is
used: ``dp[cell] = 1 + max(dp[predecessor])``. Sorting avoids deep recursion.

Time  O(rows * cols * log(rows * cols)) · Space O(rows * cols).
"""
from typing import List


def longest_increasing_path(matrix: List[List[int]]) -> int:
    """Return the longest strictly increasing path length in ``matrix``."""
    if not matrix or not matrix[0]:
        return 0
    rows, cols = len(matrix), len(matrix[0])
    dp = [[1] * cols for _ in range(rows)]
    cells = sorted(
        (matrix[r][c], r, c) for r in range(rows) for c in range(cols)
    )
    best = 1
    for value, r, c in cells:
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and matrix[nr][nc] > value:
                if dp[r][c] + 1 > dp[nr][nc]:
                    dp[nr][nc] = dp[r][c] + 1
        best = max(best, dp[r][c])
    return best


class Solution:
    def longestIncreasingPath(self, matrix: List[List[int]]) -> int:
        return longest_increasing_path(matrix)


if __name__ == "__main__":
    print(longest_increasing_path([[9, 9, 4], [6, 6, 8], [2, 1, 1]]))  # 4
    print(longest_increasing_path([[3, 4, 5], [3, 2, 6], [2, 2, 1]]))  # 4
    print(longest_increasing_path([[1]]))                              # 1
