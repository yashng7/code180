"""Rotting Oranges — Graphs.

In a grid, `0` is empty, `1` is a fresh orange and `2` a rotten one. Each minute
every fresh orange adjacent (4-directionally) to a rotten one becomes rotten.
Return the minutes until none are fresh, or `-1` if that never happens.

Time O(m · n) · Space O(m · n)
"""
from collections import deque
from typing import List


def oranges_rotting(grid: List[List[int]]) -> int:
    """Multi-source BFS seeded with *every* initially rotten orange."""
    if not grid or not grid[0]:
        return 0

    rows, cols = len(grid), len(grid[0])
    queue = deque()
    fresh = 0

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2:
                queue.append((r, c))
            elif grid[r][c] == 1:
                fresh += 1

    minutes = 0
    # One BFS "level" == one minute; stop early once nothing is fresh.
    while queue and fresh:
        for _ in range(len(queue)):
            r, c = queue.popleft()
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    fresh -= 1
                    queue.append((nr, nc))
        minutes += 1

    return minutes if fresh == 0 else -1


# NeetCode-style class wrapper; the loader prefers the top-level function.
class Solution:
    def orangesRotting(self, grid: List[List[int]]) -> int:
        return oranges_rotting(grid)


if __name__ == "__main__":
    print(oranges_rotting([[2, 1, 1], [1, 1, 0], [0, 1, 1]]))  # 4
    print(oranges_rotting([[2, 1, 1], [0, 1, 1], [1, 0, 1]]))  # -1
    print(oranges_rotting([[0, 2]]))                           # 0
