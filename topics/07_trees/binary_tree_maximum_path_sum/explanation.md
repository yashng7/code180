# Binary Tree Maximum Path Sum

**Topic:** Trees · **Difficulty:** Hard
**Links:** [LeetCode](https://leetcode.com/problems/binary-tree-maximum-path-sum/) · [NeetCode](https://neetcode.io/problems/binary-tree-maximum-path-sum)

## Problem

A path is any sequence of nodes where consecutive nodes are connected by an
edge, and a node appears at most once. Given the root, return the **maximum**
sum of values along any **non-empty** path. Paths do not need to pass through
the root and may bend once.

## Examples

| `root` | Output | Best path |
| --- | --- | --- |
| `[1, 2, 3]` | `6` | `2 → 1 → 3` |
| `[-10, 9, 20, None, None, 15, 7]` | `42` | `15 → 20 → 7` |
| `[2, -1]` | `2` | `2` |
| `[-3]` | `-3` | `-3` |
| `[5,4,8,11,None,13,4,7,2,None,None,None,1]` | `48` | `7 → 11 → 4 → 5 → 8 → 13` |

## Intuition

Every path has a unique highest node where it bends (or ends). At a node `u`, the
best path that bends at `u` is:

```
u.val + (best downward gain from the left) + (best downward gain from the right)
```

A **downward gain** is the best sum you can collect starting at a node and
walking only downwards. If a branch's gain is negative, we simply do not include
it — hence `max(0, gain(...))`. This is the "post-order DFS that returns a
value" pattern: the returned value is the downward gain the parent may extend,
while a shared `best` records the best bent path found anywhere.

## Approach

1. Convert the tree with `build_tree`; an empty tree returns `0`.
2. Keep `best = -inf` so that even an all-negative tree is handled.
3. `gain(node)`:
   - `None` → `0`;
   - `left = max(0, gain(node.left))`, `right = max(0, gain(node.right))`;
   - `best = max(best, node.val + left + right)` — the bent path here;
   - return `node.val + max(left, right)` — the best one-sided path upward.
4. The answer is `best`; cast to `int` to keep the JSON output clean.

## Complexity

| | Time | Space |
| --- | --- | --- |
| One post-order DFS (used) | `O(n)` | `O(h)` |

- **Time `O(n)`** — each node is visited once; gains combine in constant time.
- **Space `O(h)`** — the recursion stack follows one root-to-leaf path.

## Edge cases

- **All negative values** — every `gain` is clamped to `0` at the children, so
  the answer is the least-negative single node.
- **Single node** — the answer is that node's value, even if negative.
- **Root negative but bridging two positive subtrees** — the bent path through
  the root wins, as in `[-1, 2, 3] → 4`.
- **Zero-valued nodes** — fine; `max(0, ...)` treats them like positives.
- **Deep unbalanced tree** — still linear; recursion depth is `O(h)`.

## Solution (`solution.py`)

```python
def max_path_sum(root):
    best = float("-inf")

    def gain(node):
        nonlocal best
        if node is None:
            return 0
        left = max(0, gain(node.left))
        right = max(0, gain(node.right))
        best = max(best, node.val + left + right)
        return node.val + max(left, right)

    if not root:
        return 0
    gain(build_tree(root))
    return int(best)
```

## How to run the tests

```bash
python3 run.py binary_tree_maximum_path_sum
pytest topics/07_trees/binary_tree_maximum_path_sum -v
```
