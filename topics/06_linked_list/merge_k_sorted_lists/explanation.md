# Merge K Sorted Lists

**Topic:** Linked List · **Difficulty:** Hard
**Links:** [LeetCode](https://leetcode.com/problems/merge-k-sorted-lists/) · [NeetCode](https://neetcode.io/problems/merge-k-sorted-linked-lists)

## Problem

Given an array of `k` sorted linked lists, merge them into one sorted linked
list and return it. Each list arrives and the result leaves as a plain
`List[int]`.

## Examples

| Input | Output |
| --- | --- |
| `[[1,4,5],[1,3,4],[2,6]]` | `[1,1,2,3,4,4,5,6]` |
| `[]` | `[]` |
| `[[]]` | `[]` |

## Intuition

The next smallest value is always at the head of one of the `k` lists. Put all
current heads in a **min-heap**; pop the smallest, append it, and push that
list's next node. A dummy head avoids special-casing the first node.

## Approach

1. Build each list; push `(node.val, index, node)` into a heap (`index` breaks
   ties so nodes are never compared).
2. Heapify.
3. Repeatedly pop the smallest node, attach it to the output tail, and push its
   successor.
4. Terminate the output list and return its values.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Min-heap (used) | `O(N log k)` | `O(k)` |
| Merge sequentially | `O(N · k)` | `O(1)` |
| Divide and conquer | `O(N log k)` | `O(1)` |

`N` is the total number of nodes across all lists.

## Edge cases

- **No lists** (`[]`) → `[]`.
- **One or more empty lists** — they contribute nothing to the heap.
- **Duplicate values across lists** — the tie-break index keeps the heap valid.
- **Single-node lists** — merged correctly by the same loop.

## Solution (`solution.py`)

```python
def merge_k_lists(lists: List[List[int]]) -> List[int]:
    heap = []
    for index, values in enumerate(lists):
        node = build_linked_list(values)
        if node is not None:
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
```

## How to run the tests

```bash
python3 run.py merge_k_sorted_lists
pytest topics/06_linked_list/merge_k_sorted_lists -v
```
