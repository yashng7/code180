# Binary Tree Right Side View

**Topic:** Trees · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/binary-tree-right-side-view/) · [NeetCode](https://neetcode.io/problems/binary-tree-right-side-view)

## Problem

Imagine standing to the right of the tree. Return the values you can see, one
per level, from top to bottom — i.e. the **rightmost** node of each level.

## Examples

| `root` | Output |
| --- | --- |
| `[1, 2, 3, None, 5, None, 4]` | `[1, 3, 4]` |
| `[1, 2, 3, 4]` | `[1, 3, 4]` |
| `[1, 2, None, 3]` | `[1, 2, 3]` |
| `[]` | `[]` |

## Intuition

This is the level-order traversal pattern with one twist: instead of collecting
every node, keep only the **last** node processed on each level. BFS by level
gives the levels in order, and the last node of a level is exactly the node
visible from the right.

## Approach

1. Build the tree; empty → `[]`.
2. BFS with a `deque`, and record `size = len(queue)` at the start of each level.
3. Iterate `index` from `0` to `size - 1`:
   - pop the node;
   - if `index == size - 1`, append its value to the view;
   - enqueue any existing children.
4. Return the collected values.

## Complexity

| | Time | Space |
| --- | --- | --- |
| BFS by level (used) | `O(n)` | `O(w)` |
| DFS right-first | `O(n)` | `O(h)` |

`w` is the widest level, `h` the height.

- **Time `O(n)`** — every node is visited once.
- **Space `O(w)`** — the queue holds one level at a time.

## Edge cases

- **Empty tree** — `[]`.
- **Left-only deep node** — it becomes the visible node of its level.
- **Chain** — every level has a single node, so the view is the chain itself.
- **Wide level** — only the last node is appended.

## Solution (`solution.py`)

```python
def right_side_view(root):
    node = build_tree(root)
    view = []
    if node is None:
        return view

    queue = deque([node])
    while queue:
        size = len(queue)
        for index in range(size):
            current = queue.popleft()
            if index == size - 1:
                view.append(current.val)
            if current.left is not None:
                queue.append(current.left)
            if current.right is not None:
                queue.append(current.right)

    return view
```

## How to run the tests

```bash
python3 run.py binary_tree_right_side_view
pytest topics/07_trees/binary_tree_right_side_view -v
```
