# Lowest Common Ancestor of a BST

**Topic:** Trees · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/) · [NeetCode](https://neetcode.io/problems/lowest-common-ancestor-in-binary-search-tree)

## Problem

Given a **binary search tree** and two node values `p` and `q`, return the
value of their lowest common ancestor — the deepest node that has both `p` and
`q` in its subtree (a node may be a descendant of itself).

## Examples

| `root` | `p` | `q` | Output |
| --- | --- | --- | --- |
| `[6,2,8,0,4,7,9,None,None,3,5]` | `2` | `8` | `6` |
| `[6,2,8,0,4,7,9,None,None,3,5]` | `2` | `4` | `2` |
| `[2, 1]` | `2` | `1` | `2` |
| `[2, 1, 3]` | `1` | `3` | `2` |

## Intuition

The BST ordering tells us where to go without exploring both branches. Starting
at the root:

- if **both** values are smaller than the current node, the LCA is in the left
  subtree;
- if **both** are larger, it is in the right subtree;
- otherwise the values lie on opposite sides (or one equals the current node) —
  the current node is the **split point**, i.e. the lowest common ancestor.

## Approach

1. Build the tree from its level-order list.
2. Walk down iteratively:
   - `p < node.val and q < node.val` → move left;
   - `p > node.val and q > node.val` → move right;
   - else return `node.val`.
3. The first node where the two values stop pointing the same way is the answer.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Iterative BST walk (used) | `O(h)` | `O(1)` |
| General binary tree DFS | `O(n)` | `O(h)` |

- **Time `O(h)`** — we descend at most one root-to-leaf path.
- **Space `O(1)`** — no recursion, no extra storage.

## Edge cases

- **`p` or `q` equals the current node** — that node is the LCA (a node is its
  own ancestor).
- **One is an ancestor of the other** — the ancestor is the answer.
- **Both on the same side but far down** — the walk keeps descending until the
  split.
- **`p == q`** — the first comparison sends us toward the value; we stop at it.

## Solution (`solution.py`)

```python
def lowest_common_ancestor(root, p, q):
    node = build_tree(root)
    while node is not None:
        if p < node.val and q < node.val:
            node = node.left
        elif p > node.val and q > node.val:
            node = node.right
        else:
            return node.val
    return -1
```

## How to run the tests

```bash
python3 run.py lowest_common_ancestor_of_a_bst
pytest topics/07_trees/lowest_common_ancestor_of_a_bst -v
```
