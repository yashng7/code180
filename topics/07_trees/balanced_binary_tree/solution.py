"""Balanced Binary Tree — Trees.

Every subtree must have left/right heights differing by at most one.

Time O(n) · Space O(h) recursion depth
"""
from typing import List, Optional

from framework.structures import build_tree


def is_balanced(root: List[Optional[int]]) -> bool:
    """Post-order DFS; a height of -1 flags an unbalanced subtree."""
    def check(node):
        if node is None:
            return 0
        left = check(node.left)
        if left == -1:
            return -1
        right = check(node.right)
        if right == -1:
            return -1
        if abs(left - right) > 1:
            return -1
        return 1 + max(left, right)

    return check(build_tree(root)) != -1


if __name__ == "__main__":
    print(is_balanced([3, 9, 20, None, None, 15, 7]))          # True
    print(is_balanced([1, 2, 2, 3, 3, None, None, 4, 4]))      # False
    print(is_balanced([]))                                     # True
