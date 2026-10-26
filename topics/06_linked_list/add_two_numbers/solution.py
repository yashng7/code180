"""Add Two Numbers — Linked List.

Digits are stored in reverse order; add the two numbers and return the sum in
the same reversed-digit form.

Time O(max(n, m)) · Space O(max(n, m))
"""
from typing import List

from framework.structures import (
    ListNode,
    build_linked_list,
    linked_list_to_list,
)


def add_two_numbers(l1: List[int], l2: List[int]) -> List[int]:
    """Add two reversed-digit numbers and return the reversed-digit sum."""
    a = build_linked_list(l1)
    b = build_linked_list(l2)

    dummy = tail = ListNode()
    carry = 0
    while a is not None or b is not None or carry:
        total = carry
        if a is not None:
            total += a.val
            a = a.next
        if b is not None:
            total += b.val
            b = b.next
        carry, digit = divmod(total, 10)
        tail.next = ListNode(digit)
        tail = tail.next

    return linked_list_to_list(dummy.next)


if __name__ == "__main__":
    print(add_two_numbers([2, 4, 3], [5, 6, 4]))  # [7, 0, 8]
    print(add_two_numbers([9, 9, 9], [1]))        # [0, 0, 0, 1]
