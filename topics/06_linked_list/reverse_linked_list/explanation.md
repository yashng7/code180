# Reverse Linked List

**Topic:** Linked List · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/reverse-linked-list/) · [NeetCode](https://neetcode.io/problems/reverse-a-linked-list)

## Problem

Given the head of a singly linked list, reverse the list and return its new
head. In this repo the list is passed in and returned as a plain `List[int]`
(head first).

## Examples

| Input | Output |
| --- | --- |
| `[1, 2, 3, 4, 5]` | `[5, 4, 3, 2, 1]` |
| `[1, 2]` | `[2, 1]` |
| `[]` | `[]` |

## Intuition

Each node only knows its successor, so reversal means flipping every `next`
pointer. If we walk forward and redirect `next` to the previous node, we lose
the rest of the list — so we must save `next` **before** overwriting it. Three
pointers (`prev`, `curr`, `next`) are enough.

## Approach

1. Convert the value list into real nodes with `build_linked_list`.
2. Initialise `prev = None`.
3. While `curr` is not `None`:
   - remember `nxt = curr.next`;
   - point `curr.next = prev`;
   - advance `prev = curr`, `curr = nxt`.
4. `prev` now points at the new head; convert back with `linked_list_to_list`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Iterative (used) | `O(n)` | `O(1)` |
| Recursive | `O(n)` | `O(n)` call stack |

## Edge cases

- **Empty list** — the loop never runs and `None` is returned; serialises to `[]`.
- **Single node** — its `next` becomes `None`; output is unchanged.
- **Duplicates / negatives** — values are irrelevant to pointer rewiring.

## Solution (`solution.py`)

```python
def reverse_list(head: List[int]) -> List[int]:
    node = build_linked_list(head)
    prev = None
    while node is not None:
        node.next, prev, node = prev, node, node.next
    return linked_list_to_list(prev)
```

## How to run the tests

```bash
python3 run.py reverse_linked_list
pytest topics/06_linked_list/reverse_linked_list -v
```
