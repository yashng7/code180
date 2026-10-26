# Construct Binary Tree from Preorder and Inorder Traversal

**Topic:** Trees · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/) · [NeetCode](https://neetcode.io/problems/binary-tree-from-preorder-and-inorder-traversal)

## Problem

Given `preorder` and `inorder` traversals of a binary tree with **unique**
values, reconstruct and return the tree (as a level-order list).

## Examples

| `preorder` | `inorder` | Output |
| --- | --- | --- |
| `[3, 9, 20, 15, 7]` | `[9, 3, 15, 20, 7]` | `[3, 9, 20, None, None, 15, 7]` |
| `[1, 2]` | `[2, 1]` | `[1, 2]` |
| `[1, 2]` | `[1, 2]` | `[1, None, 2]` |
| `[1, 2, 3]` | `[3, 2, 1]` | `[1, 2, None, 3]` |

## Intuition

Two facts make reconstruction possible:

- **preorder** visits the root first, so `preorder[i]` is the root of whatever
  subtree we are currently building;
- **inorder** visits left subtree, root, right subtree, so the root's position
  in `inorder` tells us exactly how many nodes are on its left and right.

Once we know the split, we recurse on the two halves.

## Approach

1. Hash each inorder value to its index: `position[value] = i` — this makes the
   split lookup `O(1)` instead of `O(n)`.
2. `helper(pre_lo, pre_hi, in_lo, in_hi)`:
   - empty range → `None`;
   - `root_value = preorder[pre_lo]`, `mid = position[root_value]`;
   - `left_size = mid - in_lo`;
   - left subtree uses the next `left_size` preorder values and the inorder
     range `[in_lo, mid-1]`;
   - right subtree uses the remaining preorder values and `[mid+1, in_hi]`.
3. Serialise with `tree_to_list`. An empty input returns `[]`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Hash map + divide and conquer (used) | `O(n)` | `O(n)` |
| `inorder.index(...)` scan per node | `O(n²)` | `O(n)` |

- **Time `O(n)`** — each node is created once and each split lookup is `O(1)`.
- **Space `O(n)`** — the index map plus the recursion stack.

## Edge cases

- **Single node** — both traversals length 1.
- **Left- or right-skewed** — the split size is `n-1` or `0` every time.
- **Empty input** — return `[]`.
- **Negative values** — the hash map does not care about sign.

## Solution (`solution.py`)

```python
def build_tree(preorder, inorder):
    position = {value: index for index, value in enumerate(inorder)}

    def helper(pre_lo, pre_hi, in_lo, in_hi):
        if pre_lo > pre_hi:
            return None
        root_value = preorder[pre_lo]
        mid = position[root_value]
        left_size = mid - in_lo
        node = TreeNode(root_value)
        node.left = helper(pre_lo + 1, pre_lo + left_size, in_lo, mid - 1)
        node.right = helper(pre_lo + left_size + 1, pre_hi, mid + 1, in_hi)
        return node

    if not preorder:
        return []
    return tree_to_list(helper(0, len(preorder) - 1, 0, len(inorder) - 1))
```

## How to run the tests

```bash
python3 run.py construct_binary_tree_from_preorder_and_inorder
pytest topics/07_trees/construct_binary_tree_from_preorder_and_inorder -v
```
