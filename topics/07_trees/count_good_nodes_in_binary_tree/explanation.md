# Count Good Nodes in Binary Tree

**Topic:** Trees · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/count-good-nodes-in-binary-tree/) · [NeetCode](https://neetcode.io/problems/count-good-nodes-in-binary-tree)

## Problem

A node `x` is **good** if there is no node with a value **greater than** `x` on
the path from the root to `x`. Return the number of good nodes.

## Examples

| `root` | Output | Good nodes |
| --- | --- | --- |
| `[3, 1, 4, 3, None, 1, 5]` | `4` | `3`(root), `4`, `3`, `5` |
| `[3, 3, None, 4, 2]` | `3` | `3`(root), `3`, `4` |
| `[2, 1, 3]` | `2` | `2`(root), `3` |
| `[1, 2, None, 3, None, 4]` | `4` | every node |

## Intuition

"Good" only depends on the **path** from the root, not on the node's subtree.
So a top-down DFS that carries the running maximum is the natural fit: a node is
good iff its value is `>=` the maximum seen so far. Equal values count as good —
the statement forbids only *greater* values.

## Approach

1. Build the tree.
2. `dfs(node, path_max)` — pre-order, passing the max down:
   - `None` → `0`;
   - `good = 1 if node.val >= path_max else 0`;
   - `next_max = max(path_max, node.val)`;
   - return `good + dfs(node.left, next_max) + dfs(node.right, next_max)`.
3. Start with `path_max = -inf` so the root is always good.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Top-down DFS (used) | `O(n)` | `O(h)` |
| BFS storing `(node, max)` tuples | `O(n)` | `O(w)` |

- **Time `O(n)`** — one visit per node.
- **Space `O(h)`** — recursion depth (the queue version uses `O(w)`).

## Edge cases

- **Empty tree** — `0`.
- **Single node** — always good, so `1`.
- **Equal values on a path** — still good (`>=`, not `>`).
- **Strictly decreasing path** — only the root is good.
- **Strictly increasing path** — every node is good.

## Solution (`solution.py`)

```python
def good_nodes(root):
    def dfs(node, path_max):
        if node is None:
            return 0
        good = 1 if node.val >= path_max else 0
        next_max = max(path_max, node.val)
        return good + dfs(node.left, next_max) + dfs(node.right, next_max)

    return dfs(build_tree(root), float("-inf"))
```

## How to run the tests

```bash
python3 run.py count_good_nodes_in_binary_tree
pytest topics/07_trees/count_good_nodes_in_binary_tree -v
```
