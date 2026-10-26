"""Maximum Depth of Binary Tree — Trees.

Return the number of nodes on the longest root-to-leaf path.

Time O(n) · Space O(h) recursion depth
"""
from typing import List, Optional

from framework.structures import build_tree


def max_depth(root: List[Optional[int]]) -> int:
    """Post-order DFS returning the height of each subtree."""
    def dfs(node):
        if node is None:
            return 0
        return 1 + max(dfs(node.left), dfs(node.right))

    return dfs(build_tree(root))


if __name__ == "__main__":
    print(max_depth([3, 9, 20, None, None, 15, 7]))  # 3
    print(max_depth([1, None, 2]))                   # 2
    print(max_depth([]))                             # 0
