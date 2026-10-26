"""Graph Valid Tree — Graphs.

Return `true` if the given `n`-node undirected graph is a valid tree: fully
connected and acyclic (equivalently, exactly `n - 1` edges and no cycle).

Time O(n α(n)) · Space O(n)
"""
from typing import List


def valid_tree(n: int, edges: List[List[int]]) -> bool:
    """A tree has exactly n-1 edges and no cycle (union-find check)."""
    if len(edges) != n - 1:
        return False

    parent = list(range(n))
    rank = [0] * n

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]      # path halving
            x = parent[x]
        return x

    for u, v in edges:
        ru, rv = find(u), find(v)
        if ru == rv:
            return False                        # cycle -> not a tree
        if rank[ru] < rank[rv]:
            ru, rv = rv, ru
        parent[rv] = ru
        if rank[ru] == rank[rv]:
            rank[ru] += 1

    return True


# NeetCode-style class wrapper; the loader prefers the top-level function.
class Solution:
    def validTree(self, n: int, edges: List[List[int]]) -> bool:
        return valid_tree(n, edges)


if __name__ == "__main__":
    print(valid_tree(5, [[0, 1], [0, 2], [0, 3], [1, 4]]))                    # True
    print(valid_tree(5, [[0, 1], [1, 2], [2, 3], [1, 3], [1, 4]]))            # False
