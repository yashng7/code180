# Merge Two Sorted Lists

**Topic:** Linked List · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/merge-two-sorted-lists/) · [NeetCode](https://neetcode.io/problems/merge-two-sorted-linked-lists)

## Problem

Merge two sorted singly linked lists into one sorted list by splicing their
nodes together, and return the new head. Here both lists arrive and leave as
plain `List[int]` values.

## Examples

| `l1` | `l2` | Output |
| --- | --- | --- |
| `[1, 2, 4]` | `[1, 3, 4]` | `[1, 1, 2, 3, 4, 4]` |
| `[]` | `[]` | `[]` |
| `[]` | `[0]` | `[0]` |

## Intuition

Both lists are already sorted, so the smallest remaining node is always at one
of the two current heads. Compare them, attach the smaller one, and advance only
that list. A **dummy head** removes the special case of choosing the very first
node (no more "is the result empty?" branching).

## Approach

1. Build both lists from their value arrays.
2. Create a `dummy` node and a `tail` pointing at it.
3. While both heads are non-null, attach the smaller head to `tail.next` and
   advance that list's head.
4. When one list runs out, attach the remainder of the other.
5. Return the list from `dummy.next` (dropping the placeholder).

## Complexity

| | Time | Space |
| --- | --- | --- |
| Iterative (used) | `O(n + m)` | `O(1)` |
| Recursive | `O(n + m)` | `O(n + m)` call stack |

## Edge cases

- **Both empty** → returns `[]`.
- **One empty** → the whole non-empty list is attached in one step.
- **Duplicate values** → `<=` keeps them stable; equal heads come from `l1`
  first, which is fine because output order only depends on value.
- **All values of one list smaller** → that list drains first, remainder attached.

## Solution (`solution.py`)

```python
def merge_two_lists(l1: List[int], l2: List[int]) -> List[int]:
    a, b = build_linked_list(l1), build_linked_list(l2)
    dummy = tail = ListNode()
    while a and b:
        if a.val <= b.val:
            tail.next, a = a, a.next
        else:
            tail.next, b = b, b.next
        tail = tail.next
    tail.next = a if a is not None else b
    return linked_list_to_list(dummy.next)
```

## How to run the tests

```bash
python3 run.py merge_two_sorted_lists
pytest topics/06_linked_list/merge_two_sorted_lists -v
```
