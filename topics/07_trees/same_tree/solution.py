"""Same Tree — Trees.

Do two binary trees have identical structure and node values?

Time O(n) · Space O(h) recursion depth
"""
from typing import List, Optional

from framework.structures import build_tree


def is_same_tree(p: List[Optional[int]], q: List[Optional[int]]) -> bool:
    """Recursively compare two trees node by node."""
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

    return same(build_tree(p), build_tree(q))


if __name__ == "__main__":
    print(is_same_tree([1, 2, 3], [1, 2, 3]))            # True
    print(is_same_tree([1, 2], [1, None, 2]))            # False
    print(is_same_tree([], []))                          # True
