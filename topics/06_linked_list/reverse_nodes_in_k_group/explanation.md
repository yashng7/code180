# Reverse Nodes in K-Group

**Topic:** Linked List · **Difficulty:** Hard
**Links:** [LeetCode](https://leetcode.com/problems/reverse-nodes-in-k-group/) · [NeetCode](https://neetcode.io/problems/reverse-nodes-in-k-group)

## Problem

Reverse the nodes of a linked list `k` at a time and return the modified list.
If the number of nodes left is not a multiple of `k`, the final leftover group
stays in its original order. The list is given and returned as a plain
`List[int]`.

## Examples

| Input | `k` | Output |
| --- | --- | --- |
| `[1, 2, 3, 4, 5]` | `2` | `[2, 1, 4, 3, 5]` |
| `[1, 2, 3, 4, 5]` | `3` | `[3, 2, 1, 4, 5]` |
| `[1, 2, 3, 4, 5]` | `1` | `[1, 2, 3, 4, 5]` |

## Intuition

Process the list in groups of exactly `k`. Before reversing a group we must know
it is **complete** — otherwise the leftover tail must not be touched. A dummy
node plus a `group_prev` pointer (the node just before the current group) lets us
splice each reversed group back in place.

## Approach

1. Prepend a `dummy` node; `group_prev = dummy`.
2. Peek ahead `k` nodes. If fewer than `k` remain, stop.
3. Reverse exactly those `k` nodes, with the pre-reversal `next` node as the
   reversal's initial `prev` so the group connects to the rest.
4. Reattach: `group_prev.next` becomes the new group head (`kth`); the old group
   head becomes the new `group_prev` (it is now the group's tail).
5. Repeat, then return from `dummy.next`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Iterative (used) | `O(n)` | `O(1)` |
| Recursive | `O(n)` | `O(n/k)` call stack |

## Edge cases

- **`k = 1`** → the list is unchanged.
- **Leftover group shorter than `k`** → left as-is.
- **Empty list / single node** → unchanged.
- **`k` equal to the length** → the whole list is reversed once.

## Solution (`solution.py`)

```python
def reverse_k_group(head: List[int], k: int) -> List[int]:
    dummy = ListNode(0, build_linked_list(head))
    group_prev = dummy
    while True:
        kth = group_prev
        count = 0
        while kth is not None and count < k:
            kth = kth.next
            count += 1
        if kth is None:
            break
        group_next = kth.next
        prev, cur = group_next, group_prev.next
        for _ in range(k):
            cur.next, prev, cur = prev, cur, cur.next
        tail = group_prev.next
        group_prev.next = kth
        group_prev = tail
    return linked_list_to_list(dummy.next)
```

## How to run the tests

```bash
python3 run.py reverse_nodes_in_k_group
pytest topics/06_linked_list/reverse_nodes_in_k_group -v
```
