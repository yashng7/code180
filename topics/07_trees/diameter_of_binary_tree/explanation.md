# Diameter of Binary Tree

**Topic:** Trees · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/diameter-of-binary-tree/) · [NeetCode](https://neetcode.io/problems/binary-tree-diameter)

## Problem

Return the diameter of a binary tree: the number of **edges** on the longest
path between any two nodes in the tree. The path does not have to pass through
the root.

## Examples

| `root` | Output | Longest path |
| --- | --- | --- |
| `[1, 2, 3, 4, 5]` | `3` | `4 → 2 → 1 → 3` |
| `[1, 2, 3, 4, 5, None, 6]` | `4` | `4 → 2 → 1 → 3 → 6` |
| `[1, 2]` | `1` | `1 → 2` |
| `[1]` / `[]` | `0` | — |

## Intuition

Any path in a tree has a **highest node** where it bends. If that node is `u`,
the longest path through `u` is `(height of left subtree) + (height of right
subtree)` edges. So the diameter is the maximum of that quantity over all
nodes — and the heights themselves come from a normal depth computation.

This is the canonical **post-order DFS that returns a value**: each call returns
its subtree's height while updating a shared answer with the span that bends
at the current node.

## Approach

1. Convert the list with `build_tree`.
2. Keep `best = 0` in the enclosing scope.
3. `height(node)`:
   - `None` → `0`;
   - `left = height(node.left)`, `right = height(node.right)`;
   - `best = max(best, left + right)` — the path bending here;
   - return `1 + max(left, right)` — the height the parent needs.
4. Answer is `best`.

A path that bends at a node contributes `left + right` edge counts because the
two downward chains join with no extra edge in between.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Single post-order DFS (used) | `O(n)` | `O(h)` |
| Height per node (naive) | `O(n²)` | `O(h)` |

- **Time `O(n)`** — height and diameter are computed in the same pass.
- **Space `O(h)`** — the recursion stack.

## Edge cases

- **Empty / single node** — no edges, so `0`.
- **Diameter not through the root** — handled because `best` is updated at
  *every* node, not only the root.
- **Skewed chain** — diameter is the chain length, `n - 1`.
- **Balanced tree** — diameter hugs the two deepest leaves.

## Solution (`solution.py`)

```python
def diameter_of_binary_tree(root: List[Optional[int]]) -> int:
    best = 0

    def height(node):
        nonlocal best
        if node is None:
            return 0
        left = height(node.left)
        right = height(node.right)
        best = max(best, left + right)
        return 1 + max(left, right)

    height(build_tree(root))
    return best
```

## How to run the tests

```bash
python3 run.py diameter_of_binary_tree
pytest topics/07_trees/diameter_of_binary_tree -v
```
