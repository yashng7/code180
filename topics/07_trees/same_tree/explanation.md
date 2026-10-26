# Same Tree

**Topic:** Trees · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/same-tree/) · [NeetCode](https://neetcode.io/problems/same-binary-tree)

## Problem

Given the roots of two binary trees `p` and `q`, return `true` if they are
structurally identical and every matching node has the same value.

## Examples

| `p` | `q` | Output |
| --- | --- | --- |
| `[1, 2, 3]` | `[1, 2, 3]` | `True` |
| `[1, 2]` | `[1, None, 2]` | `False` |
| `[1, 2, 1]` | `[1, 1, 2]` | `False` |
| `[]` | `[1]` | `False` |

## Intuition

Two trees are the same iff their roots match **and** their left subtrees are the
same **and** their right subtrees are the same. Both "structure" and "values"
fall out of the same recurrence — a `None` vs non-`None` pair is a structural
mismatch, a value difference is a value mismatch.

## Approach

1. Build both trees from their level-order lists.
2. `same(a, b)`:
   - both `None` → `True`;
   - exactly one `None` → `False`;
   - otherwise `a.val == b.val and same(a.left, b.left) and same(a.right, b.right)`.
3. Return the result.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Recursive DFS (used) | `O(min(n, m))` | `O(min(h_p, h_q))` |
| Level-order BFS | `O(min(n, m))` | `O(n)` |

- **Time** — the comparison stops at the first mismatch; in the worst case it
  visits every node of the smaller tree.
- **Space** — the recursion stack follows one path in each tree.

## Edge cases

- **Both empty** — `True`.
- **One empty, one not** — `False` immediately.
- **Same values, different shape** (`[1, 2]` vs `[1, None, 2]`) — caught by the
  `None`/non-`None` guard.
- **Extra deeper nodes** — the shorter tree hits `None` while the other does not.

## Solution (`solution.py`)

```python
def is_same_tree(p, q):
    def same(a, b):
        if a is None and b is None:
            return True
        if a is None or b is None:
            return False
        return (a.val == b.val and same(a.left, b.left) and same(a.right, b.right))

    return same(build_tree(p), build_tree(q))
```

## How to run the tests

```bash
python3 run.py same_tree
pytest topics/07_trees/same_tree -v
```
