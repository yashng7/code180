"""Merge Two Sorted Lists — Linked List.

Merge two sorted linked lists into one sorted list.

Time O(n + m) · Space O(1)
"""
from typing import List

from framework.structures import (
    ListNode,
    build_linked_list,
    linked_list_to_list,
)


def merge_two_lists(l1: List[int], l2: List[int]) -> List[int]:
    """Merge two sorted lists given as plain lists of values."""
    a = build_linked_list(l1)
    b = build_linked_list(l2)

    dummy = ListNode()
    tail = dummy
    while a is not None and b is not None:
        if a.val <= b.val:
            tail.next, a = a, a.next
        else:
            tail.next, b = b, b.next
        tail = tail.next
    tail.next = a if a is not None else b
    return linked_list_to_list(dummy.next)


if __name__ == "__main__":
    print(merge_two_lists([1, 2, 4], [1, 3, 4]))  # [1, 1, 2, 3, 4, 4]
    print(merge_two_lists([], []))                # []
