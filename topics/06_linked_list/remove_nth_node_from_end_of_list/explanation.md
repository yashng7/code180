# Remove Nth Node From End of List

**Topic:** Linked List · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/remove-nth-node-from-end-of-list/) · [NeetCode](https://neetcode.io/problems/remove-node-from-end-of-linked-list)

## Problem

Given the head of a linked list, remove the `n`-th node counted from the end and
return the head. The list is given and returned as a plain `List[int]`.

## Examples

| Input | `n` | Output |
| --- | --- | --- |
| `[1, 2, 3, 4, 5]` | `2` | `[1, 2, 3, 5]` |
| `[1]` | `1` | `[]` |
| `[1, 2]` | `1` | `[1]` |

## Intuition

A single forward pass cannot know the length in advance, but two pointers with a
fixed gap can. Put `fast` `n` steps ahead of `slow`; when `fast` reaches the last
node, `slow` sits immediately **before** the node to delete. A **dummy node**
before the head handles removing the head itself (`n` equal to the length).

## Approach

1. Wrap the list in a `dummy` node so the head can be deleted uniformly.
2. Advance `fast` `n` steps.
3. Move both pointers until `fast.next` is `None` (fast on the last node).
4. `slow` now precedes the target: do `slow.next = slow.next.next`.
5. Return from `dummy.next`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| One pass, two pointers (used) | `O(n)` | `O(1)` |
| Two passes (count, then walk) | `O(n)` | `O(1)` |

## Edge cases

- **Remove the head** (`[1,2], n=2`) — the dummy node makes it a normal deletion.
- **Remove the only node** (`[1], n=1`) — result is `[]`.
- **Remove the tail** (`n=1`) — `slow` lands on the second-to-last node.
- **`n` equals length** — same as removing the head.

## Solution (`solution.py`)

```python
def remove_nth_from_end(head: List[int], n: int) -> List[int]:
    dummy = ListNode(0, build_linked_list(head))
    slow = fast = dummy
    for _ in range(n):
        fast = fast.next
    while fast.next is not None:
        fast = fast.next
        slow = slow.next
    slow.next = slow.next.next
    return linked_list_to_list(dummy.next)
```

## How to run the tests

```bash
python3 run.py remove_nth_node_from_end_of_list
pytest topics/06_linked_list/remove_nth_node_from_end_of_list -v
```
