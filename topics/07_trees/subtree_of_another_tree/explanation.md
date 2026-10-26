# Subtree of Another Tree

**Topic:** Trees · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/subtree-of-another-tree/) · [NeetCode](https://neetcode.io/problems/subtree-of-a-binary-tree)

## Problem

Given roots `root` and `subRoot`, return `true` if there is a node in `root`
whose subtree is identical to `subRoot` (same structure and values).

## Examples

| `root` | `subRoot` | Output |
| --- | --- | --- |
| `[3, 4, 5, 1, 2]` | `[4, 1, 2]` | `True` |
| `[3, 4, 5, 1, 2, None, None, None, None, 0]` | `[4, 1, 2]` | `False` |
| `[1, 1]` | `[1]` | `True` |
| `[1, 2, 3]` | `[2, 3]` | `False` |

## Intuition

We already know how to test whether two trees are *exactly* the same (the
Same Tree problem). Subtree search is just: try that exact test at **every node**
of `root`, and return `True` at the first hit.

## Approach

1. Build `root` and `target = build_tree(sub_root)`.
2. `same(a, b)` — the recursive exact-equality test from Same Tree.
3. `dfs(node)`:
   - `None` → `False`;
   - `same(node, target)` → `True`;
   - otherwise recurse into the left, then the right child.
4. An empty `subRoot` is trivially contained, so handle it first.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Compare at every node (used) | `O(n · m)` | `O(h)` |
| Serialise + substring search | `O(n + m)` average | `O(n + m)` |

`n` is the node count of `root`, `m` of `subRoot`.

- **Time `O(n · m)`** — each of the `n` nodes may trigger an equality test that
  touches up to `m` nodes.
- **Space `O(h)`** — recursion stack.

## Edge cases

- **Empty `subRoot`** — treated as contained (`True`).
- **Empty `root` with non-empty `subRoot`** — `False`.
- **Matching values but wrong shape** — the exact-equality test rejects it.
- **Deep chain containing the pattern** — the search continues past a failed
  candidate rather than stopping.

## Solution (`solution.py`)

```python
def is_subtree(root, sub_root):
    def same(a, b):
        if a is None and b is None:
            return True
        if a is None or b is None:
            return False
        return (a.val == b.val and same(a.left, b.left) and same(a.right, b.right))

    target = build_tree(sub_root)

    def dfs(node):
        if node is None:
            return False
        if same(node, target):
            return True
        return dfs(node.left) or dfs(node.right)

    if target is None:
        return True
    return dfs(build_tree(root))
```

## How to run the tests

```bash
python3 run.py subtree_of_another_tree
pytest topics/07_trees/subtree_of_another_tree -v
```
