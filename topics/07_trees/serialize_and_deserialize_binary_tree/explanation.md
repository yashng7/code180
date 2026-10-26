# Serialize and Deserialize Binary Tree

**Topic:** Trees · **Difficulty:** Hard
**Links:** [LeetCode](https://leetcode.com/problems/serialize-and-deserialize-binary-tree/) · [NeetCode](https://neetcode.io/problems/serialize-and-deserialize-binary-tree)

## Problem

Design an algorithm that turns a binary tree into a string and rebuilds an
identical tree from that string. Following this repo's round-trip convention,
one wrapper function `serialize_and_deserialize(root)` serialises and then
deserialises, returning the reparsed tree as a level-order list. The output must
equal the input.

## Examples

| `root` | Output |
| --- | --- |
| `[1, 2, 3, None, None, 4, 5]` | `[1, 2, 3, None, None, 4, 5]` |
| `[1, 2]` | `[1, 2]` |
| `[1, None, 2]` | `[1, None, 2]` |
| `[]` | `[]` |

## Intuition

The tricky part of any encoding is representing **missing children** — otherwise
the level-order form is ambiguous (`[1, 2]` and `[1, None, 2]` both have two
values but different shapes). We solve this by emitting an explicit sentinel
`N` for every `None`.

A **preorder** walk (node, left, right) with sentinels is unambiguous: the first
token is the root, and the reconstruction consumes tokens in exactly the same
order. Because the stream always contains a token per child slot, recursion
knows precisely when a subtree is empty.

## Approach

1. `_serialize(node)`:
   - `None` → the literal `"N"`;
   - otherwise `"{val},{left},{right}"`.
2. `_deserialize(data)`:
   - split on commas and wrap in an iterator;
   - `helper()` pulls the next token; `"N"` → `None`; otherwise create a node
     and recursively build its left then right subtree.
3. `serialize_and_deserialize(root)` builds the tree, serialises, deserialises,
   and converts back to a list with `tree_to_list`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Preorder + sentinel (used) | `O(n)` | `O(n)` |
| Level-order with index encoding | `O(n)` | `O(n)` |

- **Time `O(n)`** — every node (and every empty slot) is written and read once.
- **Space `O(n)`** — the encoded string plus the recursion stack.

## Edge cases

- **Empty tree** — serialises to `"N"`, deserialises back to `None`, so `[]`.
- **Single node** — `"1,N,N"`.
- **Left-only vs right-only child** — distinguished by *where* the `N` sits in
  the token stream.
- **Negative values** — parsed with `int`, so the `-` sign is handled.
- **Deep chains** — recursion depth is `O(n)`; an explicit stack would remove
  that limit if needed.

## Solution (`solution.py`)

```python
def _serialize(node):
    if node is None:
        return "N"
    return f"{node.val},{_serialize(node.left)},{_serialize(node.right)}"


def _deserialize(data):
    tokens = iter(data.split(","))

    def helper():
        token = next(tokens)
        if token == "N":
            return None
        node = TreeNode(int(token))
        node.left = helper()
        node.right = helper()
        return node

    return helper()


def serialize_and_deserialize(root):
    tree = build_tree(root)
    return tree_to_list(_deserialize(_serialize(tree)))
```

## How to run the tests

```bash
python3 run.py serialize_and_deserialize_binary_tree
pytest topics/07_trees/serialize_and_deserialize_binary_tree -v
```
