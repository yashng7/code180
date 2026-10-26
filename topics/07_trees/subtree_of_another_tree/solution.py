"""Subtree of Another Tree — Trees.

Does ``sub_root`` appear anywhere inside ``root`` as a subtree?

Time O(n * m) · Space O(h) recursion depth
"""
from typing import List, Optional

from framework.structures import build_tree


def is_subtree(root: List[Optional[int]], sub_root: List[Optional[int]]) -> bool:
    """Scan ``root`` and reuse an exact-equality test at each node."""
    def same(a, b):
        if a is None and b is None:
            return True
        if a is None or b is None:
            return False
        return (
            a.val == b.val
            and same(a.left, b.left)
            and same(a.right, b.right)
        )

    target = build_tree(sub_root)

    def dfs(node):
        if node is None:
            return False
        if same(node, target):
            return True
        return dfs(node.left) or dfs(node.right)

    if target is None:          # an empty subtree is trivially contained
        return True
    return dfs(build_tree(root))


if __name__ == "__main__":
    print(is_subtree([3, 4, 5, 1, 2], [4, 1, 2]))            # True
    print(is_subtree([3, 4, 5, 1, 2, None, None, None, None, 0], [4, 1, 2]))  # False
    print(is_subtree([1, 1], [1]))                           # True
