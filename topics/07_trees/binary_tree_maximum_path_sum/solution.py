"""Binary Tree Maximum Path Sum — Trees.

Maximise the sum along any non-empty simple path (paths may bend once).

Time O(n) · Space O(h) recursion depth
"""
from typing import List, Optional

from framework.structures import build_tree


def max_path_sum(root: List[Optional[int]]) -> int:
    """Post-order DFS returning the best downward gain from each node."""
    best = float("-inf")

    def gain(node):
        nonlocal best
        if node is None:
            return 0
        # A negative branch would only hurt, so clamp it at zero.
        left = max(0, gain(node.left))
        right = max(0, gain(node.right))
        # Best path that bends at this node.
        best = max(best, node.val + left + right)
        # Best path that continues upward through this node.
        return node.val + max(left, right)

    if not root:
        return 0
    gain(build_tree(root))
    return int(best)


if __name__ == "__main__":
    print(max_path_sum([1, 2, 3]))                        # 6
    print(max_path_sum([-10, 9, 20, None, None, 15, 7])) # 42
    print(max_path_sum([2, -1]))                         # 2
