"""Binary Tree Right Side View — Trees.

Return the rightmost value on each level, top to bottom.

Time O(n) · Space O(w) where w is the widest level
"""
from collections import deque
from typing import List, Optional

from framework.structures import build_tree


def right_side_view(root: List[Optional[int]]) -> List[int]:
    """BFS by level, keeping the last node of each level."""
    node = build_tree(root)
    view: List[int] = []
    if node is None:
        return view

    queue = deque([node])
    while queue:
        size = len(queue)
        for index in range(size):
            current = queue.popleft()
            if index == size - 1:       # last node of this level
                view.append(current.val)
            if current.left is not None:
                queue.append(current.left)
            if current.right is not None:
                queue.append(current.right)

    return view


if __name__ == "__main__":
    print(right_side_view([1, 2, 3, None, 5, None, 4]))  # [1, 3, 4]
    print(right_side_view([1, 2, 3, 4]))                 # [1, 3, 4]
    print(right_side_view([]))                           # []
