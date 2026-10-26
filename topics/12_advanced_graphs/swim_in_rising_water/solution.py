"""Swim in Rising Water — Advanced Graphs.

You are given an ``n x n`` grid of unique elevations. At time ``t`` the water
level is ``t``, so you may stand on any cell whose elevation is at most ``t``.
Starting at ``(0, 0)`` you may move up/down/left/right, and you may swim
instantly any distance. Return the **least time** at which you can reach
``(n - 1, n - 1)``.

Example
-------
    Input : grid = [[0,2],[1,3]]
    Output: 3

Time  O(n² log n)  — Dijkstra over grid cells.
Space O(n²)        — best-time matrix plus the heap.
"""
import heapq
from typing import List


def swim_in_water(grid: List[List[int]]) -> int:
    """Return the minimax-elevation time to swim from the top-left to bottom-right."""
    n = len(grid)
    INF = float("inf")
    best = [[INF] * n for _ in range(n)]
    best[0][0] = grid[0][0]

    heap = [(grid[0][0], 0, 0)]
    while heap:
        time, row, col = heapq.heappop(heap)
        if time > best[row][col]:        # stale entry
            continue
        if row == n - 1 and col == n - 1:
            return time
        for d_row, d_col in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n_row, n_col = row + d_row, col + d_col
            if 0 <= n_row < n and 0 <= n_col < n:
                # Reaching a neighbour never lowers the water level.
                n_time = max(time, grid[n_row][n_col])
                if n_time < best[n_row][n_col]:
                    best[n_row][n_col] = n_time
                    heapq.heappush(heap, (n_time, n_row, n_col))
    return best[n - 1][n - 1]


class Solution:
    def swimInWater(self, grid: List[List[int]]) -> int:
        return swim_in_water(grid)


if __name__ == "__main__":
    print(swim_in_water([[0, 2], [1, 3]]))                 # 3
    print(swim_in_water([[0, 1], [2, 3]]))                 # 3
    print(swim_in_water([[0, 1, 5], [3, 4, 6], [2, 9, 7]]))  # 7
