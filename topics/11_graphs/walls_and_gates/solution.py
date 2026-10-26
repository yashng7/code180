"""Walls and Gates — Graphs.

Fill every empty room (`INF = 2147483647`) with the distance to its nearest
gate (`0`). Walls are `-1` and are impassable. Rooms unreachable from any gate
stay `INF`. The grid is mutated **and returned**.

Time O(m · n) · Space O(m · n)
"""
from collections import deque
from typing import List

INF = 2147483647


def walls_and_gates(rooms: List[List[int]]) -> List[List[int]]:
    """Multi-source BFS outward from every gate at once."""
    if not rooms or not rooms[0]:
        return rooms

    rows, cols = len(rooms), len(rooms[0])
    queue = deque()

    for r in range(rows):
        for c in range(cols):
            if rooms[r][c] == 0:
                queue.append((r, c))

    while queue:
        r, c = queue.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and rooms[nr][nc] == INF:
                rooms[nr][nc] = rooms[r][c] + 1   # first visit == shortest distance
                queue.append((nr, nc))

    return rooms


# NeetCode-style class wrapper; the loader prefers the top-level function.
class Solution:
    def wallsAndGates(self, rooms: List[List[int]]) -> None:
        walls_and_gates(rooms)


if __name__ == "__main__":
    print(walls_and_gates([[INF, 0, INF]]))  # [[1, 0, 1]]
