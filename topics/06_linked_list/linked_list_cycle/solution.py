"""Linked List Cycle — Linked List.

Return whether the list contains a cycle. ``pos`` is the index the tail links
back to, or -1 for no cycle.

Time O(n) · Space O(1)
"""
from typing import List

from framework.structures import build_cyclic_linked_list


def has_cycle(head: List[int], pos: int) -> bool:
    """Floyd's tortoise-and-hare cycle detection."""
    node = build_cyclic_linked_list(head, pos)
    slow = fast = node
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False


if __name__ == "__main__":
    print(has_cycle([3, 2, 0, -4], 1))  # True
    print(has_cycle([1], -1))           # False
