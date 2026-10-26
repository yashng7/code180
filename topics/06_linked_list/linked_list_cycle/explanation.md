# Linked List Cycle

**Topic:** Linked List · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/linked-list-cycle/) · [NeetCode](https://neetcode.io/problems/linked-list-cycle-detection)

## Problem

Given the head of a linked list, determine whether it contains a cycle. The
list is described by its values plus `pos`, the index the tail links back to
(`-1` means no cycle). Return `True`/`False`.

## Examples

| Values | `pos` | Output |
| --- | --- | --- |
| `[3, 2, 0, -4]` | `1` | `true` |
| `[1, 2]` | `0` | `true` |
| `[1]` | `-1` | `false` |

## Intuition

Floyd's tortoise-and-hare: move a slow pointer one step and a fast pointer two
steps. If there is a cycle, the fast pointer eventually laps the slow one and
they meet. If there is no cycle, the fast pointer falls off the end.

## Approach

1. Build the (possibly cyclic) list with `build_cyclic_linked_list(values, pos)`.
2. `slow = fast = head`.
3. While `fast` and `fast.next` exist: advance one/two steps; if they ever point
   at the same node, return `True`.
4. Reaching the end means no cycle → `False`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Floyd's (used) | `O(n)` | `O(1)` |
| Hash set of visited nodes | `O(n)` | `O(n)` |

## Edge cases

- **Empty list** → no cycle.
- **Single node with `pos = 0`** → self-loop → `True`.
- **Tail links to itself** (last index) → `True`.
- **No cycle** → `fast` reaches `None`, loop ends, `False`.

## Solution (`solution.py`)

```python
def has_cycle(head: List[int], pos: int) -> bool:
    node = build_cyclic_linked_list(head, pos)
    slow = fast = node
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False
```

## How to run the tests

```bash
python3 run.py linked_list_cycle
pytest topics/06_linked_list/linked_list_cycle -v
```
