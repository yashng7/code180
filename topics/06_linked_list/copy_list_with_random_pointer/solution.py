"""Copy List With Random Pointer — Linked List.

Each node is ``[value, random_index_or_null]``. Return a deep copy of the list
in the same serialized form.

Time O(n) · Space O(n)
"""
from typing import List, Optional

from framework.structures import ListNode


def copy_random_list(nodes: List[List[Optional[int]]]) -> List[List[Optional[int]]]:
    """Deep-copy a random-pointer linked list represented as pair entries."""
    if not nodes:
        return []

    # 1. Build the original nodes and wire up next / random pointers.
    originals = [ListNode(val) for val, _ in nodes]
    for i in range(len(originals) - 1):
        originals[i].next = originals[i + 1]
    for i, (_, random_index) in enumerate(nodes):
        originals[i].random = originals[random_index] if random_index is not None else None

    # 2. First pass: create a matching copy node for every original.
    old_to_new = {node: ListNode(node.val) for node in originals}

    # 3. Second pass: replicate next / random links using the mapping.
    for node in originals:
        new_node = old_to_new[node]
        new_node.next = old_to_new.get(node.next)
        new_node.random = old_to_new.get(node.random)

    # 4. Serialize the copied list back to [value, random_index_or_null].
    index_of = {}
    node = old_to_new[originals[0]]
    position = 0
    while node is not None:
        index_of[node] = position
        node = node.next
        position += 1

    output: List[List[Optional[int]]] = []
    node = old_to_new[originals[0]]
    while node is not None:
        output.append(
            [node.val, index_of[node.random] if node.random is not None else None]
        )
        node = node.next
    return output


if __name__ == "__main__":
    print(copy_random_list([[7, None], [13, 0], [11, 4], [10, 2], [1, 0]]))
