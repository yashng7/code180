"""Validate Binary Search Tree — Trees.

Check the strict BST invariant everywhere, not just parent/child pairs.

Time O(n) · Space O(h) recursion depth
"""
from typing import List, Optional

from framework.structures import build_tree


def is_valid_bst(root: List[Optional[int]]) -> bool:
    """DFS with an open (low, high) interval per subtree."""
    def valid(node, low, high):
        if node is None:
            return True
        if node.val <= low or node.val >= high:
            return False
        return (
            valid(node.left, low, node.val)
            and valid(node.right, node.val, high)
        )

    return valid(build_tree(root), float("-inf"), float("inf"))


if __name__ == "__main__":
    print(is_valid_bst([2, 1, 3]))                          # True
    print(is_valid_bst([5, 1, 4, None, None, 3, 6]))        # False
    print(is_valid_bst([]))                                 # True
