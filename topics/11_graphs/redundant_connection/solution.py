"""Redundant Connection — Graphs.

A graph with nodes `1 … n` started as a tree and one extra edge was added.
Return the edge that can be removed to restore a tree; if several work, return
the one appearing **last** in `edges`.

Time O(n α(n)) · Space O(n)
"""
from typing import List


def find_redundant_connection(edges: List[List[int]]) -> List[int]:
    """Union-find: the first edge that closes a cycle is the answer."""
    n = len(edges)
    parent = list(range(n + 1))
    rank = [0] * (n + 1)

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]      # path halving
            x = parent[x]
        return x

    def union(a: int, b: int) -> bool:
        ra, rb = find(a), find(b)
        if ra == rb:
            return False                        # already connected -> cycle
        if rank[ra] < rank[rb]:
            ra, rb = rb, ra
        parent[rb] = ra
        if rank[ra] == rank[rb]:
            rank[ra] += 1
        return True

    for u, v in edges:
        if not union(u, v):
            return [u, v]

    return []                                   # unreachable for valid input


# NeetCode-style class wrapper; the loader prefers the top-level function.
class Solution:
    def findRedundantConnection(self, edges: List[List[int]]) -> List[int]:
        return find_redundant_connection(edges)


if __name__ == "__main__":
    print(find_redundant_connection([[1, 2], [1, 3], [2, 3]]))              # [2,3]
    print(find_redundant_connection([[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]]))  # [1,4]
