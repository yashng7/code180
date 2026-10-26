# Binary Tree Level Order Traversal

**Topic:** Trees · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/binary-tree-level-order-traversal/) · [NeetCode](https://neetcode.io/problems/level-order-traversal-of-binary-tree)

## Problem

Return the values of a binary tree grouped level by level, from the root
downwards and left to right: `[[level 0], [level 1], ...]`.

## Examples

| `root` | Output |
| --- | --- |
| `[3, 9, 20, None, None, 15, 7]` | `[[3], [9, 20], [15, 7]]` |
| `[1, 2, 3, 4, 5, 6, 7]` | `[[1], [2, 3], [4, 5, 6, 7]]` |
| `[1, None, 2]` | `[[1], [2]]` |
| `[]` | `[]` |

## Intuition

A plain BFS visits nodes in level order, but it does not tell us **where one
level ends**. The fix is to freeze the queue size at the start of each round:
everything currently in the queue belongs to one level, and the children pushed
during this round belong to the next.

## Approach

1. Build the tree; an empty tree returns `[]`.
2. Push the root into a `deque`.
3. While the queue is non-empty:
   - `size = len(queue)` — the number of nodes on this level;
   - repeat `size` times: pop a node, append its value to the current level,
     and enqueue its existing left/right children;
   - append the finished level to the result.

## Complexity

| | Time | Space |
| --- | --- | --- |
| BFS with level sizing (used) | `O(n)` | `O(w)` |
| DFS with a depth index | `O(n)` | `O(h)` |

`w` is the widest level, `h` the height.

- **Time `O(n)`** — each node is enqueued and dequeued once.
- **Space `O(w)`** — the queue holds at most one full level.

## Edge cases

- **Empty tree** — no levels, so `[]`.
- **Single node** — `[[1]]`.
- **Chain** — one node per level, `[[1], [2], [3]]`.
- **Missing children mid-level** — skipped, so a level can be narrower than the
  one above even though it is deeper.

## Solution (`solution.py`)

```python
def level_order(root):
    node = build_tree(root)
    levels = []
    if node is None:
        return levels

    queue = deque([node])
    while queue:
        level = []
        for _ in range(len(queue)):
            current = queue.popleft()
            level.append(current.val)
            if current.left is not None:
                queue.append(current.left)
            if current.right is not None:
                queue.append(current.right)
        levels.append(level)

    return levels
```

## How to run the tests

```bash
python3 run.py binary_tree_level_order_traversal
pytest topics/07_trees/binary_tree_level_order_traversal -v
```
