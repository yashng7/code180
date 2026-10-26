"""Merge K Sorted Lists — Linked List.

Merge k sorted linked lists into one sorted list.

Time O(N log k) · Space O(k)
"""
import heapq
from typing import List

from framework.structures import (
    ListNode,
    build_linked_list,
    linked_list_to_list,
)


def merge_k_lists(lists: List[List[int]]) -> List[int]:
    """Merge k sorted lists using a min-heap of current heads."""
    heap: List[tuple] = []
    for index, values in enumerate(lists):
        node = build_linked_list(values)
        if node is not None:
            # index breaks ties so ListNode objects are never compared.
            heap.append((node.val, index, node))
    heapq.heapify(heap)

    dummy = tail = ListNode()
    while heap:
        _, index, node = heapq.heappop(heap)
        tail.next = node
        tail = node
        if node.next is not None:
            heapq.heappush(heap, (node.next.val, index, node.next))
    tail.next = None

    return linked_list_to_list(dummy.next)


if __name__ == "__main__":
    print(merge_k_lists([[1, 4, 5], [1, 3, 4], [2, 6]]))  # [1,1,2,3,4,4,5,6]
    print(merge_k_lists([]))                              # []
