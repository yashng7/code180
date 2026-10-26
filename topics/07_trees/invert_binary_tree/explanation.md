# Invert Binary Tree

**Topic:** Trees · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/invert-binary-tree/) · [NeetCode](https://neetcode.io/problems/invert-a-binary-tree)

## Problem

Given the root of a binary tree, invert it — swap the left and right child of
every node — and return the root. In this repo the tree is passed in and
returned as a LeetCode level-order list (`None` marks a missing child).

## Examples

| `root` | Output |
| --- | --- |
| `[4, 2, 7, 1, 3, 6, 9]` | `[4, 7, 2, 9, 6, 3, 1]` |
| `[2, 1, 3]` | `[2, 3, 1]` |
| `[1, 2]` | `[1, None, 2]` |
| `[]` | `[]` |

## Intuition

Inversion is self-similar. Swap the two children of the root, and then the same
swap has to happen inside each of those subtrees. There is no global state to
carry, so plain recursion is enough.

## Approach

1. Convert the value list into real nodes with `build_tree`.
2. Define `dfs(node)`:
   - if `node is None`, return `None` (a missing child stays missing);
   - otherwise recurse on `dfs(node.right)` and `dfs(node.left)` **first**, then
     assign `node.left, node.right` to those results;
   - return `node`.
3. Return `tree_to_list(dfs(root))`.

The tuple assignment reads both subtrees before either pointer is written, so
nothing is lost.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Recursive (used) | `O(n)` | `O(h)` call stack |
| Iterative BFS/queue | `O(n)` | `O(n)` |

- **Time `O(n)`** — every node is visited exactly once.
- **Space `O(h)`** — at most one root-to-leaf path is on the call stack, where
  `h` is the tree height (`O(n)` for a degenerate chain, `O(log n)` when balanced).

## Edge cases

- **Empty tree** — `build_tree([])` gives `None` and the result serialises to `[]`.
- **Single node** — a leaf is returned unchanged.
- **Left-only / right-only children** — the child switches side, which shows up
  as a leading `None` in the level-order output.
- **Sparse trees** — ignored `None` slots are preserved by `tree_to_list`.

## Solution (`solution.py`)

```python
def invert_tree(root: List[Optional[int]]) -> List[Optional[int]]:
    def dfs(node):
        if node is None:
            return None
        node.left, node.right = dfs(node.right), dfs(node.left)
        return node

    return tree_to_list(dfs(build_tree(root)))
```

## How to run the tests

```bash
python3 run.py invert_binary_tree
pytest topics/07_trees/invert_binary_tree -v
```
