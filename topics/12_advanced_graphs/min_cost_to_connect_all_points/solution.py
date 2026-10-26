"""Min Cost to Connect All Points — Advanced Graphs.

Given ``points`` on a plane, connect every point so that there is exactly one
path between any two points (a spanning tree). The cost of connecting two points
``[x1, y1]`` and ``[x2, y2]`` is the Manhattan distance
``|x1 - x2| + |y1 - y2|``. Return the minimum possible total cost.

Example
-------
    Input : points = [[0,0],[2,2],[3,10],[5,2],[7,0]]
    Output: 20

Time  O(n²)  — Prim's algorithm with a dense distance scan.
Space O(n)   — the ``best``/``used`` arrays.
"""
from typing import List


def min_cost_connect_points(points: List[List[int]]) -> int:
    """Return the MST cost under Manhattan distance (Prim, ``O(n²)``)."""
    n = len(points)
    if n <= 1:
        return 0

    INF = float("inf")
    best = [INF] * n          # cheapest edge from the tree to each node
    best[0] = 0
    used = [False] * n
    total = 0

    for _ in range(n):
        # Greedily take the unused node with the cheapest connecting edge.
        node = -1
        for i in range(n):
            if not used[i] and (node == -1 or best[i] < best[node]):
                node = i
        used[node] = True
        total += best[node]

        x1, y1 = points[node]
        for i in range(n):
            if not used[i]:
                x2, y2 = points[i]
                dist = abs(x1 - x2) + abs(y1 - y2)
                if dist < best[i]:
                    best[i] = dist
    return total


class Solution:
    def minCostConnectPoints(self, points: List[List[int]]) -> int:
        return min_cost_connect_points(points)


if __name__ == "__main__":
    print(min_cost_connect_points([[0, 0], [2, 2], [3, 10], [5, 2], [7, 0]]))
    print(min_cost_connect_points([[3, 12], [-2, 5], [-4, 1]]))
