# Balanced Binary Tree

**Topic:** Trees · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/balanced-binary-tree/) · [NeetCode](https://neetcode.io/problems/balanced-binary-tree)

## Problem

A binary tree is **height-balanced** if, for *every* node, the heights of its
two subtrees differ by at most one. Return whether the given tree is balanced.

## Examples

| `root` | Output |
| --- | --- |
| `[3, 9, 20, None, None, 15, 7]` | `True` |
| `[1, 2, 2, 3, 3, None, None, 4, 4]` | `False` |
| `[]` | `True` |
| `[1, 2, None, 3]` | `False` |

## Intuition

Balance is defined over **all** subtrees, so we have to visit every node anyway.
The trick is to do it in one pass: a post-order DFS returns the subtree height,
and we let a sentinel `-1` mean "this subtree is already unbalanced". As soon as
one child reports `-1`, the parent can short-circuit.

This is the "post-order DFS that returns a value" pattern: the returned value is
the height, and the global decision is folded into it.

## Approach

1. Convert the list with `build_tree`.
2. `check(node)`:
   - `None` → `0`;
   - `left = check(node.left)`; if `left == -1` return `-1`;
   - `right = check(node.right)`; if `right == -1` return `-1`;
   - if `abs(left - right) > 1` return `-1`;
   - otherwise return `1 + max(left, right)`.
3. The tree is balanced iff `check(root) != -1`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| One post-order DFS (used) | `O(n)` | `O(h)` |
| Height recomputed per node | `O(n²)` | `O(h)` |

- **Time `O(n)`** — each node contributes one height computation.
- **Space `O(h)`** — recusion depth.

## Edge cases

- **Empty tree** — vacuously balanced (`True`).
- **Single node** — both heights are `0`.
- **Skewed chain** — the first node with a height gap of 2 returns `-1`.
- **Deep imbalance far from the root** — caught because every node is checked.

## Solution (`solution.py`)

```python
def is_balanced(root: List[Optional[int]]) -> bool:
    def check(node):
        if node is None:
            return 0
        left = check(node.left)
        if left == -1:
            return -1
        right = check(node.right)
        if right == -1:
            return -1
        if abs(left - right) > 1:
            return -1
        return 1 + max(left, right)

    return check(build_tree(root)) != -1
```

## How to run the tests

```bash
python3 run.py balanced_binary_tree
pytest topics/07_trees/balanced_binary_tree -v
```
