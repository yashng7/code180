"""Shared data structures and (de)serialization helpers.

Linked-list and tree problems use plain Python lists in their test cases so
everything stays JSON-serializable. These helpers convert between the compact
list form and real node objects.

Conventions
-----------
* Linked list  : ``[1, 2, 3]``  (head first)
* Binary tree  : LeetCode level order, ``None`` for a missing child, e.g.
                 ``[1, 2, 3, None, 4]``
"""
from __future__ import annotations

from collections import deque
from typing import List, Optional


class ListNode:
    def __init__(self, val: int = 0, next: "Optional[ListNode]" = None) -> None:
        self.val = val
        self.next = next


class TreeNode:
    def __init__(
        self,
        val: int = 0,
        left: "Optional[TreeNode]" = None,
        right: "Optional[TreeNode]" = None,
    ) -> None:
        self.val = val
        self.left = left
        self.right = right


def build_linked_list(values: List[int]) -> Optional[ListNode]:
    head: Optional[ListNode] = None
    for value in reversed(values):
        head = ListNode(value, head)
    return head


def linked_list_to_list(head: Optional[ListNode]) -> List[int]:
    out: List[int] = []
    steps = 0
    while head is not None:
        out.append(head.val)
        head = head.next
        steps += 1
        if steps > 100_000:  # guard against accidental cycles
            break
    return out


def build_cyclic_linked_list(values: List[int], pos: int) -> Optional[ListNode]:
    """Build a list; if ``pos >= 0`` link the tail back to index ``pos``."""
    head = build_linked_list(values)
    if head is None or pos < 0:
        return head
    nodes = []
    node: Optional[ListNode] = head
    while node is not None:
        nodes.append(node)
        node = node.next
    nodes[-1].next = nodes[pos]
    return head


def build_tree(values: List[Optional[int]]) -> Optional[TreeNode]:
    if not values or values[0] is None:
        return None
    root = TreeNode(values[0])
    queue = deque([root])
    i = 1
    while queue and i < len(values):
        node = queue.popleft()
        if i < len(values):
            value = values[i]
            i += 1
            if value is not None:
                node.left = TreeNode(value)
                queue.append(node.left)
        if i < len(values):
            value = values[i]
            i += 1
            if value is not None:
                node.right = TreeNode(value)
                queue.append(node.right)
    return root


def tree_to_list(root: Optional[TreeNode]) -> List[Optional[int]]:
    if root is None:
        return []
    out: List[Optional[int]] = []
    queue = deque([root])
    while queue:
        node = queue.popleft()
        if node is None:
            out.append(None)
            continue
        out.append(node.val)
        queue.append(node.left)
        queue.append(node.right)
    while out and out[-1] is None:
        out.pop()
    return out
