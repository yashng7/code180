"""Number of Islands — Graphs.

Count the connected components of land ("1") in a 2D grid, where cells are
connected 4-directionally (up/down/left/right) and water is "0".

Time O(m · n) · Space O(m · n)
"""
from collections import deque
from typing import List


def num_islands(grid: List[List[str]]) -> int:
    """Flood-fill every unvisited land cell and count the components."""
    if not grid or not grid[0]:
        return 0

    rows, cols = len(grid), len(grid[0])
    islands = 0

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != "1":
                continue

            islands += 1
            grid[r][c] = "0"                 # mark visited by sinking the land
            queue = deque([(r, c)])
            while queue:
                cr, cc = queue.popleft()
                for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nr, nc = cr + dr, cc + dc
                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "1":
                        grid[nr][nc] = "0"
                        queue.append((nr, nc))

    return islands


# NeetCode-style class wrapper; the loader prefers the top-level function.
class Solution:
    def numIslands(self, grid: List[List[str]]) -> int:
        return num_islands(grid)


if __name__ == "__main__":
    print(num_islands([
        ["1", "1", "1", "1", "0"],
        ["1", "1", "0", "1", "0"],
        ["1", "1", "0", "0", "0"],
        ["0", "0", "0", "0", "0"],
    ]))  # 1
    print(num_islands([
        ["1", "1", "0", "0", "0"],
        ["1", "1", "0", "0", "0"],
        ["0", "0", "1", "0", "0"],
        ["0", "0", "0", "1", "1"],
    ]))  # 3
