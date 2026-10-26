"""Max Area of Island — Graphs.

Return the area of the largest 4-directionally connected group of `1`s in a
binary matrix, or `0` when there is no land.

Time O(m · n) · Space O(m · n)
"""
from collections import deque
from typing import List


def max_area_of_island(grid: List[List[int]]) -> int:
    """Flood-fill each island, keeping the biggest area seen."""
    if not grid or not grid[0]:
        return 0

    rows, cols = len(grid), len(grid[0])
    best = 0

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != 1:
                continue

            # New island: sink it while measuring its area.
            grid[r][c] = 0
            queue = deque([(r, c)])
            area = 0
            while queue:
                cr, cc = queue.popleft()
                area += 1
                for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nr, nc = cr + dr, cc + dc
                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                        grid[nr][nc] = 0
                        queue.append((nr, nc))
            best = max(best, area)

    return best


# NeetCode-style class wrapper; the loader prefers the top-level function.
class Solution:
    def maxAreaOfIsland(self, grid: List[List[int]]) -> int:
        return max_area_of_island(grid)


if __name__ == "__main__":
    print(max_area_of_island([[0, 0, 0, 0, 0, 0, 0, 0]]))          # 0
    print(max_area_of_island([[0, 0, 1, 0, 0], [0, 1, 1, 0, 1]]))  # 3
