"""Serialize and Deserialize Binary Tree — Trees.

Round-trip a tree through a string encoding.

Time O(n) · Space O(n)
"""
from typing import List, Optional

from framework.structures import TreeNode, build_tree, tree_to_list


def _serialize(node) -> str:
    """Preorder with a sentinel for empty children."""
    if node is None:
        return "N"
    return f"{node.val},{_serialize(node.left)},{_serialize(node.right)}"


def _deserialize(data: str):
    tokens = iter(data.split(","))

    def helper():
        token = next(tokens)
        if token == "N":
            return None
        node = TreeNode(int(token))
        node.left = helper()
        node.right = helper()
        return node

    return helper()


def serialize_and_deserialize(
    root: List[Optional[int]]
) -> List[Optional[int]]:
    """Serialize then deserialize; the returned tree must match the input."""
    tree = build_tree(root)
    return tree_to_list(_deserialize(_serialize(tree)))


if __name__ == "__main__":
    print(serialize_and_deserialize([1, 2, 3, None, None, 4, 5]))
    # [1, 2, 3, None, None, 4, 5]
    print(serialize_and_deserialize([]))       # []
    print(serialize_and_deserialize([1]))      # [1]
