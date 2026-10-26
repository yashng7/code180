# Maximum Depth of Binary Tree

**Topic:** Trees · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/maximum-depth-of-binary-tree/) · [NeetCode](https://neetcode.io/problems/depth-of-binary-tree)

## Problem

Given the root of a binary tree, return its maximum depth — the number of nodes
along the longest path from the root down to a leaf.

## Examples

| `root` | Output | Longest path |
| --- | --- | --- |
| `[3, 9, 20, None, None, 15, 7]` | `3` | `3 → 20 → 15` |
| `[1, None, 2]` | `2` | `1 → 2` |
| `[1, 2, None, 3, None, 4]` | `4` | `1 → 2 → 3 → 4` |
| `[]` | `0` | — |

## Intuition

The depth of a tree is one more than the depth of its deeper subtree, and an
empty tree has depth `0`. That is the whole recurrence — a textbook
**post-order DFS that returns a value** (the subtree height) all the way up.

## Approach

1. Convert the list with `build_tree`.
2. `dfs(node)`:
   - `None` → `0`;
   - otherwise `1 + max(dfs(node.left), dfs(node.right))`.
3. Return the value from the root call.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Recursive DFS (used) | `O(n)` | `O(h)` |
| Iterative level BFS | `O(n)` | `O(n)` |

- **Time `O(n)`** — each node's height is computed once.
- **Space `O(h)`** — the call stack holds one root-to-leaf path.

## Edge cases

- **Empty tree** — returns `0` (the height of an empty tree).
- **Single node** — both children are `None`, so the answer is `1`.
- **Degenerate chain** — height equals the node count; recursion depth is `O(n)`.
- **Perfect tree** — `n = 2^h - 1` nodes give depth `h`.

## Solution (`solution.py`)

```python
def max_depth(root: List[Optional[int]]) -> int:
    def dfs(node):
        if node is None:
            return 0
        return 1 + max(dfs(node.left), dfs(node.right))

    return dfs(build_tree(root))
```

## How to run the tests

```bash
python3 run.py maximum_depth_of_binary_tree
pytest topics/07_trees/maximum_depth_of_binary_tree -v
```
