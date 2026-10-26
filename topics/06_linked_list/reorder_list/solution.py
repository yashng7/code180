"""Reorder List — Linked List.

Reorder the list L0 -> L1 -> ... -> Ln as L0 -> Ln -> L1 -> Ln-1 -> ...

Time O(n) · Space O(1)
"""
from typing import List

from framework.structures import build_linked_list, linked_list_to_list


def reorder_list(head: List[int]) -> List[int]:
    """Reorder the list in place and return its new value order."""
    root = build_linked_list(head)
    if root is None or root.next is None:
        return linked_list_to_list(root)

    # 1. Find the middle using slow/fast pointers (slow ends at first half end).
    slow, fast = root, root.next
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next

    # 2. Split after the middle and reverse the second half.
    second = slow.next
    slow.next = None
    prev = None
    while second is not None:
        second.next, prev, second = prev, second, second.next
    second = prev

    # 3. Interleave: first, second, first, second, ...
    first = root
    while second is not None:
        first_next, second_next = first.next, second.next
        first.next = second
        second.next = first_next
        first, second = first_next, second_next

    return linked_list_to_list(root)


if __name__ == "__main__":
    print(reorder_list([1, 2, 3, 4]))     # [1, 4, 2, 3]
    print(reorder_list([1, 2, 3, 4, 5]))  # [1, 5, 2, 4, 3]
