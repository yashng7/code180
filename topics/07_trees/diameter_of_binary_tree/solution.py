"""Diameter of Binary Tree — Trees.

Return the length (in edges) of the longest path between any two nodes.

Time O(n) · Space O(h) recursion depth
"""
from typing import List, Optional

from framework.structures import build_tree


def diameter_of_binary_tree(root: List[Optional[int]]) -> int:
    """One post-order pass returns heights while tracking the best span."""
    best = 0

    def height(node):
        nonlocal best
        if node is None:
            return 0
        left = height(node.left)
        right = height(node.right)
        # Longest path that bends at this node.
        best = max(best, left + right)
        return 1 + max(left, right)

    height(build_tree(root))
    return best


if __name__ == "__main__":
    print(diameter_of_binary_tree([1, 2, 3, 4, 5]))  # 3
    print(diameter_of_binary_tree([1, 2]))            # 1
    print(diameter_of_binary_tree([1]))               # 0
