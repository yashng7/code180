"""Lowest Common Ancestor of a BST — Trees.

Return the value of the lowest node having both ``p`` and ``q`` as descendants.

Time O(h) · Space O(1)
"""
from typing import List, Optional

from framework.structures import build_tree


def lowest_common_ancestor(
    root: List[Optional[int]], p: int, q: int
) -> int:
    """Walk down using the BST ordering to find the split point."""
    node = build_tree(root)
    while node is not None:
        if p < node.val and q < node.val:
            node = node.left
        elif p > node.val and q > node.val:
            node = node.right
        else:
            return node.val
    return -1


if __name__ == "__main__":
    print(lowest_common_ancestor([6, 2, 8, 0, 4, 7, 9, None, None, 3, 5], 2, 8))  # 6
    print(lowest_common_ancestor([6, 2, 8, 0, 4, 7, 9, None, None, 3, 5], 2, 4))  # 2
    print(lowest_common_ancestor([2, 1], 2, 1))                                   # 2
