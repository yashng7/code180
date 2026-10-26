# Reorder List

**Topic:** Linked List · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/reorder-list/) · [NeetCode](https://neetcode.io/problems/reorder-linked-list)

## Problem

Reorder a singly linked list from `L0 → L1 → … → Ln` into
`L0 → Ln → L1 → Ln-1 → …` **in place** (O(1) extra space). The list arrives and
leaves as a plain `List[int]`.

## Examples

| Input | Output |
| --- | --- |
| `[1, 2, 3, 4]` | `[1, 4, 2, 3]` |
| `[1, 2, 3, 4, 5]` | `[1, 5, 2, 4, 3]` |
| `[1, 2]` | `[1, 2]` |

## Intuition

The target order alternates between the front half (in order) and the back half
**reversed**. So: split the list in the middle, reverse the second half, then
weave the two halves together one node at a time.

## Approach

1. **Find the middle** with slow/fast pointers; `slow` ends on the last node of
   the first half. Split: `second = slow.next; slow.next = None`.
2. **Reverse the second half** in place with the standard three-pointer loop.
3. **Interleave**: walk the first half with `first` and the reversed half with
   `second`, inserting `second` after `first` each time, until the second half
   is exhausted (it is never longer than the first).

## Complexity

| | Time | Space |
| --- | --- | --- |
| Split + reverse + weave (used) | `O(n)` | `O(1)` |
| Copy into an array | `O(n)` | `O(n)` |

## Edge cases

- **Empty / single node** — nothing to reorder; returned unchanged.
- **Odd length** — the middle node stays in place (e.g. `[1,2,3] → [1,3,2]`).
- **Two nodes** — already in the correct order.

## Solution (`solution.py`)

```python
def reorder_list(head: List[int]) -> List[int]:
    root = build_linked_list(head)
    if root is None or root.next is None:
        return linked_list_to_list(root)

    slow, fast = root, root.next
    while fast and fast.next:
        slow, fast = slow.next, fast.next.next

    second = slow.next
    slow.next = None
    prev = None
    while second:
        second.next, prev, second = prev, second, second.next
    second = prev

    first = root
    while second:
        first_next, second_next = first.next, second.next
        first.next, second.next = second, first_next
        first, second = first_next, second_next
    return linked_list_to_list(root)
```

## How to run the tests

```bash
python3 run.py reorder_list
pytest topics/06_linked_list/reorder_list -v
```
