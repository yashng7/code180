"""Count Good Nodes in Binary Tree — Trees.

A node is "good" if no larger value appears on the root-to-node path.

Time O(n) · Space O(h) recursion depth
"""
from typing import List, Optional

from framework.structures import build_tree


def good_nodes(root: List[Optional[int]]) -> int:
    """Pre-order DFS carrying the maximum value seen so far."""
    def dfs(node, path_max):
        if node is None:
            return 0
        good = 1 if node.val >= path_max else 0
        next_max = max(path_max, node.val)
        return good + dfs(node.left, next_max) + dfs(node.right, next_max)

    return dfs(build_tree(root), float("-inf"))


if __name__ == "__main__":
    print(good_nodes([3, 1, 4, 3, None, 1, 5]))  # 4
    print(good_nodes([3, 3, None, 4, 2]))        # 3
    print(good_nodes([]))                         # 0
