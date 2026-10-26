"""Reverse Nodes in K-Group — Linked List.

Reverse the nodes of the list k at a time; a trailing group shorter than k is
left unchanged.

Time O(n) · Space O(1)
"""
from typing import List

from framework.structures import (
    ListNode,
    build_linked_list,
    linked_list_to_list,
)


def reverse_k_group(head: List[int], k: int) -> List[int]:
    """Reverse every complete group of k nodes and return the value order."""
    dummy = ListNode(0, build_linked_list(head))
    group_prev = dummy

    while True:
        # Find the k-th node of the current group.
        kth = group_prev
        count = 0
        while kth is not None and count < k:
            kth = kth.next
            count += 1
        if kth is None:
            break  # fewer than k nodes remain

        group_next = kth.next
        # Reverse the k nodes, linking them to group_next at the end.
        prev, cur = group_next, group_prev.next
        for _ in range(k):
            cur.next, prev, cur = prev, cur, cur.next

        # Splice the reversed group back into the list.
        tail = group_prev.next
        group_prev.next = kth
        group_prev = tail

    return linked_list_to_list(dummy.next)


if __name__ == "__main__":
    print(reverse_k_group([1, 2, 3, 4, 5], 2))  # [2, 1, 4, 3, 5]
    print(reverse_k_group([1, 2, 3, 4, 5], 3))  # [3, 2, 1, 4, 5]
