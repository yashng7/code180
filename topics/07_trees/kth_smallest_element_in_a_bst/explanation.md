# Kth Smallest Element in a BST

**Topic:** Trees · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/kth-smallest-element-in-a-bst/) · [NeetCode](https://neetcode.io/problems/kth-smallest-integer-in-bst)

## Problem

Given the root of a BST and an integer `k`, return the `k`-th smallest value in
the tree (`1`-indexed).

## Examples

| `root` | `k` | Output | In-order |
| --- | --- | --- | --- |
| `[3, 1, 4, None, 2]` | `1` | `1` | `1, 2, 3, 4` |
| `[5,3,6,2,4,None,None,1]` | `3` | `3` | `1, 2, 3, 4, 5, 6` |
| `[2, 1, 3]` | `2` | `2` | `1, 2, 3` |
| `[1]` | `1` | `1` | `1` |

## Intuition

An **in-order traversal** of a BST visits the values in ascending order. So the
`k`-th smallest is simply the `k`-th value emitted by an in-order walk.

We do not need to materialise the whole traversal: an explicit stack lets us
pause after `k` emits and return immediately.

## Approach

1. Start at the root with an empty stack.
2. Descend left, pushing every node, until `node` is `None`.
3. Pop the top node (the current smallest unvisited) and decrement `k`.
4. If `k == 0`, return that value; otherwise move to its right child and repeat.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Iterative in-order, early exit (used) | `O(h + k)` | `O(h)` |
| Full in-order into a list | `O(n)` | `O(n)` |

- **Time `O(h + k)`** — descend to the leftmost node (`h` steps), then emit `k`
  values.
- **Space `O(h)`** — the stack holds one root-to-node path.

## Edge cases

- **`k = 1`** — returns the minimum, i.e. the leftmost node.
- **`k = n`** — returns the maximum, i.e. the rightmost node.
- **Single node** — trivially the answer.
- **Skewed tree** — in-order is a sorted chain; the stack handling keeps it
  correct even at depth `n`.

## Solution (`solution.py`)

```python
def kth_smallest(root, k):
    stack = []
    node = build_tree(root)
    while stack or node is not None:
        while node is not None:
            stack.append(node)
            node = node.left
        node = stack.pop()
        k -= 1
        if k == 0:
            return node.val
        node = node.right
    return -1
```

## How to run the tests

```bash
python3 run.py kth_smallest_element_in_a_bst
pytest topics/07_trees/kth_smallest_element_in_a_bst -v
```
