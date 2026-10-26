"""Binary Tree Level Order Traversal — Trees.

Return node values grouped by depth, left to right.

Time O(n) · Space O(w) where w is the widest level
"""
from collections import deque
from typing import List, Optional

from framework.structures import build_tree


def level_order(root: List[Optional[int]]) -> List[List[int]]:
    """BFS, draining exactly one level per outer loop iteration."""
    node = build_tree(root)
    levels: List[List[int]] = []
    if node is None:
        return levels

    queue = deque([node])
    while queue:
        level: List[int] = []
        for _ in range(len(queue)):     # width of the current level
            current = queue.popleft()
            level.append(current.val)
            if current.left is not None:
                queue.append(current.left)
            if current.right is not None:
                queue.append(current.right)
        levels.append(level)

    return levels


if __name__ == "__main__":
    print(level_order([3, 9, 20, None, None, 15, 7]))  # [[3], [9, 20], [15, 7]]
    print(level_order([1]))                            # [[1]]
    print(level_order([]))                             # []
