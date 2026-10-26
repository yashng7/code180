"""Kth Smallest Element in a BST — Trees.

In-order traversal visits BST values in ascending order.

Time O(h + k) · Space O(h) recursion depth
"""
from typing import List, Optional

from framework.structures import build_tree


def kth_smallest(root: List[Optional[int]], k: int) -> int:
    """Walk in-order and stop as soon as the k-th value is seen."""
    stack: List = []
    node = build_tree(root)
    while stack or node is not None:
        while node is not None:     # go as far left as possible
            stack.append(node)
            node = node.left
        node = stack.pop()
        k -= 1
        if k == 0:
            return node.val
        node = node.right
    return -1


if __name__ == "__main__":
    print(kth_smallest([3, 1, 4, None, 2], 1))                     # 1
    print(kth_smallest([5, 3, 6, 2, 4, None, None, 1], 3))         # 3
    print(kth_smallest([1], 1))                                    # 1
