"""Number of Connected Components in an Undirected Graph — Graphs.

Count the connected components of an undirected graph with nodes `0 … n-1`.

Time O(n + E α(n)) · Space O(n)
"""
from typing import List


def count_components(n: int, edges: List[List[int]]) -> int:
    """Union every edge, then count distinct roots."""
    parent = list(range(n))
    rank = [0] * n

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]      # path halving
            x = parent[x]
        return x

    def union(a: int, b: int) -> None:
        ra, rb = find(a), find(b)
        if ra == rb:
            return
        if rank[ra] < rank[rb]:
            ra, rb = rb, ra
        parent[rb] = ra
        if rank[ra] == rank[rb]:
            rank[ra] += 1

    for u, v in edges:
        union(u, v)

    return len({find(node) for node in range(n)})


# NeetCode-style class wrapper; the loader prefers the top-level function.
class Solution:
    def countComponents(self, n: int, edges: List[List[int]]) -> int:
        return count_components(n, edges)


if __name__ == "__main__":
    print(count_components(5, [[0, 1], [1, 2], [3, 4]]))  # 2
    print(count_components(5, []))                         # 5
