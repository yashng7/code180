# Redundant Connection

**Topic:** Graphs · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/redundant-connection/) · [NeetCode](https://neetcode.io/problems/redundant-connection)

## Problem

A graph with `n` nodes labelled `1 … n` started as a **tree** (connected, no
cycles) and exactly one extra edge was added, producing exactly one cycle.
Given the resulting `edges` list, return the edge that can be removed so the
graph becomes a tree again. If several edges would work, return the one that
appears **last** in `edges`.

## Examples

| `edges` | Output |
| --- | --- |
| `[[1,2],[1,3],[2,3]]` | `[2,3]` |
| `[[1,2],[2,3],[3,4],[1,4],[1,5]]` | `[1,4]` |
| `[[1,2],[1,3],[1,4],[3,4]]` | `[3,4]` |

## Intuition

Adding edges one at a time, the graph stays a forest until the first edge that
connects two nodes **already in the same component**. That edge is precisely the
one that closes a cycle — removing it restores a forest. Processing `edges` in
order and returning the first such edge automatically picks the **last**
applicable edge, matching the tie-break rule.

**Union-find (disjoint set union)** supports exactly this: `find` tells us which
component a node belongs to, and `union` merges two components. If `find(u) ==
find(v)`, the edge is redundant.

## Approach

1. Initialise `parent[i] = i` and `rank[i] = 0` for `1 … n`.
2. For each edge `[u, v]` in order:
   - `find` the roots of `u` and `v`;
   - if they are equal, this edge closes the cycle → return `[u, v]`;
   - otherwise `union` them (attach the smaller-rank root under the larger).
3. Use **path compression** (path halving on the way up) and **union by rank**
   for near-constant amortised time.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Union-find | `O(n α(n))` ≈ `O(n)` | `O(n)` |
| DFS per edge | `O(n²)` | `O(n)` |

- **Time `O(n α(n))`** — essentially linear; `α` is the inverse Ackermann
  function.
- **Space `O(n)`** — the parent and rank arrays.

## Edge cases

- **Tie-break rule** → returning the *first* edge that closes a cycle while
  scanning in order gives the *last* valid edge.
- **Cycle of length 2** is impossible (edges are distinct, simple graph).
- **Leaf nodes / extra future edges** → ignored once the answer is found.
- **Self-loop** → `find(u) == find(u)`, immediately redundant.
- **n = 1** with an added edge cannot occur under the problem's guarantees.

## Solution (`solution.py`)

```python
from typing import List


def find_redundant_connection(edges: List[List[int]]) -> List[int]:
    n = len(edges)
    parent = list(range(n + 1))
    rank = [0] * (n + 1)

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a: int, b: int) -> bool:
        ra, rb = find(a), find(b)
        if ra == rb:
            return False
        if rank[ra] < rank[rb]:
            ra, rb = rb, ra
        parent[rb] = ra
        if rank[ra] == rank[rb]:
            rank[ra] += 1
        return True

    for u, v in edges:
        if not union(u, v):
            return [u, v]

    return []
```

## How to run the tests

```bash
python3 run.py redundant_connection
pytest topics/11_graphs/redundant_connection -v
```
