"""Clone Graph — Graphs.

Deep-copy an undirected graph given as an adjacency list and return the copy
in the same adjacency-list form (a round trip).

`adj_list[i]` lists the 1-based labels of the neighbours of node `i + 1`.
`[]` denotes an empty graph; `[[]]` is a single isolated node.

Time O(V + E) · Space O(V + E)
"""
from typing import Dict, List


class _Node:
    """Minimal graph node; kept private to the module."""

    def __init__(self, val: int) -> None:
        self.val = val
        self.neighbors: List["_Node"] = []


def clone_graph(adj_list: List[List[int]]) -> List[List[int]]:
    """Build the graph, deep-copy it, and re-serialize the copy."""
    if not adj_list:
        return []

    # 1. Materialize the input adjacency list as real node objects.
    nodes = [_Node(index + 1) for index in range(len(adj_list))]
    for index, neighbors in enumerate(adj_list):
        nodes[index].neighbors = [nodes[label - 1] for label in neighbors]

    # 2. Copy each connected component with a DFS, memoising originals.
    copies: Dict[_Node, _Node] = {}

    def dfs(node: _Node) -> _Node:
        if node in copies:
            return copies[node]
        duplicate = _Node(node.val)
        copies[node] = duplicate
        for neighbor in node.neighbors:
            duplicate.neighbors.append(dfs(neighbor))
        return duplicate

    for node in nodes:
        dfs(node)

    # 3. Serialize the copies back into an adjacency list (1-based labels).
    return [[neighbor.val for neighbor in copies[node].neighbors] for node in nodes]


# NeetCode-style class wrapper; the loader prefers the top-level function.
class Solution:
    def cloneGraph(self, node):  # pragma: no cover - signature compatibility
        raise NotImplementedError("Use clone_graph(adj_list) from this module.")


if __name__ == "__main__":
    print(clone_graph([]))                          # []
    print(clone_graph([[]]))                        # [[]]
    print(clone_graph([[2, 4], [1, 3], [2, 4], [1, 3]]))
