"""Reverse Linked List — Linked List.

Reverse a singly linked list and return the new head.

Time O(n) · Space O(1)
"""
from typing import List

from framework.structures import build_linked_list, linked_list_to_list


def reverse_list(head: List[int]) -> List[int]:
    """Reverse the list given as a plain Python list of node values."""
    node = build_linked_list(head)
    prev = None
    while node is not None:
        node.next, prev, node = prev, node, node.next
    return linked_list_to_list(prev)


if __name__ == "__main__":
    print(reverse_list([1, 2, 3, 4, 5]))  # [5, 4, 3, 2, 1]
    print(reverse_list([]))               # []
