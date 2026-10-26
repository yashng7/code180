"""Construct Binary Tree from Preorder and Inorder — Trees.

Rebuild the unique tree from its two traversals.

Time O(n) · Space O(n)
"""
from typing import List, Optional

from framework.structures import TreeNode, tree_to_list


def build_tree(preorder: List[int], inorder: List[int]) -> List[Optional[int]]:
    """Preorder gives the root; inorder splits left from right."""
    position = {value: index for index, value in enumerate(inorder)}

    def helper(pre_lo, pre_hi, in_lo, in_hi):
        if pre_lo > pre_hi:
            return None
        root_value = preorder[pre_lo]
        mid = position[root_value]
        left_size = mid - in_lo

        node = TreeNode(root_value)
        node.left = helper(pre_lo + 1, pre_lo + left_size, in_lo, mid - 1)
        node.right = helper(pre_lo + left_size + 1, pre_hi, mid + 1, in_hi)
        return node

    if not preorder:
        return []
    root = helper(0, len(preorder) - 1, 0, len(inorder) - 1)
    return tree_to_list(root)


if __name__ == "__main__":
    print(build_tree([3, 9, 20, 15, 7], [9, 3, 15, 20, 7]))
    # [3, 9, 20, None, None, 15, 7]
    print(build_tree([1, 2], [2, 1]))       # [1, 2]
    print(build_tree([1, 2], [1, 2]))       # [1, None, 2]
