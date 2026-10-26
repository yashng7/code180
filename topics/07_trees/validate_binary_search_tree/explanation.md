# Validate Binary Search Tree

**Topic:** Trees · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/validate-binary-search-tree/) · [NeetCode](https://neetcode.io/problems/valid-binary-search-tree)

## Problem

Return `true` if the given binary tree is a valid **binary search tree**: every
node's left subtree contains only strictly smaller values and its right subtree
only strictly larger values.

## Examples

| `root` | Output |
| --- | --- |
| `[2, 1, 3]` | `True` |
| `[5, 1, 4, None, None, 3, 6]` | `False` |
| `[5, 4, 6, None, None, 3, 7]` | `False` |
| `[1, None, 2]` | `True` |

## Intuition

The tempting "check each node against its children" approach is **wrong**: the
invariant is global. In `[5, 4, 6, None, None, 3, 7]` the pair `6 → 3` looks
locally fine, but `3` sits in the right subtree of `5`, so it must be greater
than `5`.

The fix is to hand each subtree an **open interval** `(low, high)` that all its
values must fall inside. Descending left shrinks the upper bound; descending
right raises the lower bound.

## Approach

1. Build the tree.
2. `valid(node, low, high)`:
   - `None` → `True`;
   - if `node.val <= low or node.val >= high` → `False` (strict bounds reject
     duplicates);
   - left child inherits `(low, node.val)`, right child inherits
     `(node.val, high)`.
3. Start with `(-inf, +inf)`. Using infinities (rather than `2**31`) avoids any
   overflow concern with extreme values.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Interval DFS (used) | `O(n)` | `O(h)` |
| In-order traversal, check increasing | `O(n)` | `O(h)` |

- **Time `O(n)`** — each node is checked once.
- **Space `O(h)`** — recursion depth.

## Edge cases

- **Empty tree** — valid.
- **Single node** — valid.
- **Duplicate values** — rejected by the strict `<=`/`>=` bounds.
- **Violation deep in a subtree** — caught by the inherited interval.
- **Extreme integer values** — handled by `±inf` bounds.

## Solution (`solution.py`)

```python
def is_valid_bst(root):
    def valid(node, low, high):
        if node is None:
            return True
        if node.val <= low or node.val >= high:
            return False
        return (valid(node.left, low, node.val)
                and valid(node.right, node.val, high))

    return valid(build_tree(root), float("-inf"), float("inf"))
```

## How to run the tests

```bash
python3 run.py validate_binary_search_tree
pytest topics/07_trees/validate_binary_search_tree -v
```
