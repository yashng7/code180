"""Invert Binary Tree — Trees.

Mirror a binary tree: swap the left and right child of every node.

Time O(n) · Space O(h) recursion depth
"""
from typing import List, Optional

from framework.structures import build_tree, tree_to_list


def invert_tree(root: List[Optional[int]]) -> List[Optional[int]]:
    """Return the level-order list of the mirrored tree."""
    def dfs(node):
        if node is None:
            return None
        node.left, node.right = dfs(node.right), dfs(node.left)
        return node

    return tree_to_list(dfs(build_tree(root)))


if __name__ == "__main__":
    print(invert_tree([4, 2, 7, 1, 3, 6, 9]))  # [4, 7, 2, 9, 6, 3, 1]
    print(invert_tree([2, 1, 3]))               # [2, 3, 1]
    print(invert_tree([]))                      # []
