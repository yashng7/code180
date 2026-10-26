"""Remove Nth Node From End of List — Linked List.

Remove the n-th node counted from the end of the list.

Time O(n) · Space O(1)
"""
from typing import List

from framework.structures import (
    ListNode,
    build_linked_list,
    linked_list_to_list,
)


def remove_nth_from_end(head: List[int], n: int) -> List[int]:
    """Remove the n-th node from the end and return the remaining values."""
    dummy = ListNode(0, build_linked_list(head))
    slow = fast = dummy

    # Advance fast so that a gap of n nodes separates fast and slow.
    for _ in range(n):
        fast = fast.next

    # Move both until fast reaches the last node; slow sits just before target.
    while fast.next is not None:
        fast = fast.next
        slow = slow.next

    slow.next = slow.next.next
    return linked_list_to_list(dummy.next)


if __name__ == "__main__":
    print(remove_nth_from_end([1, 2, 3, 4, 5], 2))  # [1, 2, 3, 5]
    print(remove_nth_from_end([1], 1))               # []
