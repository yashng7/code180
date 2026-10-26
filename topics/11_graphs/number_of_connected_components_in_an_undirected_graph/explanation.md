# Number of Connected Components in an Undirected Graph

**Topic:** Graphs · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/) · [NeetCode](https://neetcode.io/problems/count-connected-components)

## Problem

You have a graph of `n` nodes labelled `0 … n-1` and a list of undirected
`edges`. Return the number of **connected components** in the graph.

## Examples

| `n` | `edges` | Output |
| --- | --- | --- |
| `5` | `[[0,1],[1,2],[3,4]]` | `2` |
| `5` | `[[0,1],[1,2],[2,3],[3,4]]` | `1` |
| `5` | `[]` | `5` |

## Intuition

A connected component is a maximal set of nodes reachable from one another.
There are two classic ways to count them:

- **Traversal**: BFS/DFS from every unvisited node, incrementing a counter once
  per launch. Each launch swallows a whole component.
- **Union-find**: union the endpoints of every edge, then count the number of
  distinct roots. Every union merges two components into one; the roots left at
  the end correspond one-to-one with components.

We use union-find because it extends naturally to the related problems
(Redundant Connection, Graph Valid Tree).

## Approach

1. `parent[i] = i`, `rank[i] = 0` for every node.
2. For each edge `[u, v]`, `union(u, v)` (no-op if already connected).
3. Collect `find(node)` for all nodes into a set and return its size.

Path halving compresses the trees during `find`; union by rank keeps them
shallow, giving near-constant amortised operations.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Union-find | `O(n + E α(n))` | `O(n)` |
| BFS/DFS | `O(n + E)` | `O(n)` |

- **Time `O(n + E α(n))`** — essentially linear.
- **Space `O(n)`** — parent/rank arrays (or a `visited` set for traversal).

## Edge cases

- **No edges** → `n` components (each node alone).
- **Single node** → `1`.
- **All connected** → `1`.
- **Late merging edge** → handled because unions are processed in any order.
- **Isolated nodes among edges** → still counted via their own root.

## Solution (`solution.py`)

```python
from typing import List


def count_components(n: int, edges: List[List[int]]) -> int:
    parent = list(range(n))
    rank = [0] * n

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a: int, b: int) -> None:
        ra, rb = find(a), find(b)
        if ra == rb:
            return
        if rank[ra] < rank[rb]:
            ra, rb = rb, ra
        parent[rb] = ra
        if rank[ra] == rank[rb]:
            rank[ra] += 1

    for u, v in edges:
        union(u, v)

    return len({find(node) for node in range(n)})
```

## How to run the tests

```bash
python3 run.py number_of_connected_components_in_an_undirected_graph
pytest topics/11_graphs/number_of_connected_components_in_an_undirected_graph -v
```
