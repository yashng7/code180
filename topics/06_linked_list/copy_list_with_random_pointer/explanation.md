# Copy List With Random Pointer

**Topic:** Linked List · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/copy-list-with-random-pointer/) · [NeetCode](https://neetcode.io/problems/copy-linked-list-with-random-pointer)

## Problem

A linked list has an extra `random` pointer that may point at **any** node or be
`null`. Produce a **deep copy** of the list.

Here each node is represented as `[value, random_index_or_null]`, where
`random_index` is the position of the random target (or `null`). Input and output
are lists of these pairs, so the answer must match the input exactly.

## Examples

| Input | Output |
| --- | --- |
| `[[7,null],[13,0],[11,4],[10,2],[1,0]]` | same |
| `[[1,1],[2,1]]` | same |
| `[[3,null],[3,0],[3,null]]` | same |

## Intuition

We cannot copy a node and immediately set its `random` pointer, because the
random target may not have been created yet (it could point forward). We need a
way to map **original node → copy node**. With that map, a second pass can set
both `next` and `random` for every copy. A hash map gives `O(1)` lookups.

## Approach

1. Create one original node per pair and link `next` sequentially.
2. Set each original's `random` to the referenced original (or `None`).
3. First pass over originals: build `old_to_new` — a fresh copy node per
   original.
4. Second pass: for each original, set `copy.next` and `copy.random` through the
   map.
5. Walk the copied chain, building an index map, and serialise each node back to
   `[value, random_index_or_null]`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Hash map (used) | `O(n)` | `O(n)` |
| Interleaved copy (no map) | `O(n)` | `O(1)` extra |

## Edge cases

- **Empty list** → `[]`.
- **`random` is `null`** for every node → serialises `null`s unchanged.
- **Self / backward references** — the map resolves them regardless of order.
- **Duplicate values** — identity, not value, is what matters, so the map keys
  on the node object.

## Solution (`solution.py`)

```python
def copy_random_list(nodes):
    if not nodes:
        return []
    originals = [ListNode(v) for v, _ in nodes]
    for i in range(len(originals) - 1):
        originals[i].next = originals[i + 1]
    for i, (_, r) in enumerate(nodes):
        originals[i].random = originals[r] if r is not None else None

    old_to_new = {node: ListNode(node.val) for node in originals}
    for node in originals:
        new = old_to_new[node]
        new.next = old_to_new.get(node.next)
        new.random = old_to_new.get(node.random)

    index_of, out = {}, []
    node = old_to_new[originals[0]]
    while node:
        index_of[node] = len(index_of)
        node = node.next
    node = old_to_new[originals[0]]
    while node:
        out.append([node.val, index_of[node.random] if node.random else None])
        node = node.next
    return out
```

## How to run the tests

```bash
python3 run.py copy_list_with_random_pointer
pytest topics/06_linked_list/copy_list_with_random_pointer -v
```
