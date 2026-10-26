# Graph Valid Tree

**Topic:** Graphs · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/graph-valid-tree/) · [NeetCode](https://neetcode.io/problems/valid-tree)

## Problem

Given `n` nodes labelled `0 … n-1` and a list of undirected `edges`, return
`true` if these edges form a **valid tree**.

A graph is a tree when it is:

1. **fully connected** — every node is reachable from every other, and
2. **acyclic** — there are no cycles.

For `n` nodes that is equivalent to having **exactly `n - 1` edges** *and* no
cycle.

## Examples

| `n` | `edges` | Output |
| --- | --- | --- |
| `5` | `[[0,1],[0,2],[0,3],[1,4]]` | `true` |
| `5` | `[[0,1],[1,2],[2,3],[1,3],[1,4]]` | `false` |
| `2` | `[]` | `false` |

## Intuition

Two independent conditions must hold, and checking them separately is simplest:

- **Edge count**: a forest on `n` nodes with `c` components has `n - c` edges.
  A tree has `c = 1`, so it must have exactly `n - 1` edges. If `len(edges) !=
  n - 1`, we can bail out immediately (too few → disconnected; too many → a
  cycle must exist).
- **No cycle**: with the count already correct, a single cycle would have to
  disconnect some node, so detecting any cycle via union-find is enough.

Union-find gives both: each edge that joins two different components is a
tree edge; any edge whose endpoints share a root closes a cycle.

## Approach

1. If `len(edges) != n - 1`, return `False`.
2. Initialise `parent/rank`.
3. For each edge `[u, v]`:
   - if `find(u) == find(v)`, a cycle exists → return `False`;
   - otherwise union them.
4. If every edge merged two components, the graph is connected and acyclic →
   `True`.

An equivalent traversal: BFS/DFS once, verify all `n` nodes are visited and that
no edge leads to an already-visited node other than the parent.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Union-find | `O(n α(n))` | `O(n)` |
| BFS/DFS | `O(n + E)` | `O(n)` |

- **Time** — near-linear in the number of nodes/edges.
- **Space `O(n)`** — arrays sized by node count.

## Edge cases

- **`n = 1`, no edges** → a valid (trivial) tree → `true`.
- **Too few edges** → disconnected → `false` (caught by the count check).
- **Too many edges** → necessarily cyclic → `false` (caught by the count check).
- **Right count but cyclic** → caught by union-find.
- **Self-loop** → `find(u) == find(u)` → cycle → `false`.
- **Parallel edges** → the second one shares a root → cycle → `false`.

## Solution (`solution.py`)

```python
from typing import List


def valid_tree(n: int, edges: List[List[int]]) -> bool:
    if len(edges) != n - 1:
        return False

    parent = list(range(n))
    rank = [0] * n

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for u, v in edges:
        ru, rv = find(u), find(v)
        if ru == rv:
            return False
        if rank[ru] < rank[rv]:
            ru, rv = rv, ru
        parent[rv] = ru
        if rank[ru] == rank[rv]:
            rank[ru] += 1

    return True
```

## How to run the tests

```bash
python3 run.py graph_valid_tree
pytest topics/11_graphs/graph_valid_tree -v
```
