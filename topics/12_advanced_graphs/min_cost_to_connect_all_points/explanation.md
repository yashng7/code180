# Min Cost to Connect All Points

**Topic:** Advanced Graphs · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/min-cost-to-connect-all-points/) · [NeetCode](https://neetcode.io/problems/min-cost-to-connect-points)

## Problem

You are given an array `points` of integer coordinates. Connecting two points
`[x1, y1]` and `[x2, y2]` costs their **Manhattan distance**
`|x1 - x2| + |y1 - y2|`. Return the **minimum total cost** of connecting all
points such that any two points are connected by exactly one path.

That is exactly the weight of a **minimum spanning tree (MST)** of the complete
graph whose edge weights are Manhattan distances.

## Examples

| `points` | Output |
| --- | --- |
| `[[0,0],[2,2],[3,10],[5,2],[7,0]]` | `20` |
| `[[3,12],[-2,5],[-4,1]]` | `18` |
| `[[0,0],[1,0],[0,1],[1,1]]` | `3` |

## Intuition

The complete graph has up to `n(n-1)/2` edges, and we need the cheapest `n-1`
of them that keep everything connected. Two classic MST algorithms apply:

- **Kruskal** — sort *all* edges by weight and union the endpoints, skipping any
  edge that would create a cycle (needs union-find). Cost `O(E log E) =
  O(n² log n)` because building/sorting `E ≈ n²` edges is the bottleneck.
- **Prim** — grow a single tree, repeatedly attaching the closest outside point.
  With a dense graph it is usually written as `O(n²)`: no edge list is ever
  materialised, just an `O(n)` scan per added node.

Since the graph is dense (`E = Θ(n²)`), Prim's `O(n²)` beats Kruskal's
`O(n² log n)`, so we use Prim. Both produce the same optimal total.

## Approach (Prim, `O(n²)`)

1. Handle `n <= 1` up front — no edges are needed, cost `0`.
2. Keep `best[i]` = the cheapest edge weight from the current tree to node `i`
   (`INF` if node `i` is not yet reachable) and `used[i]`.
3. Seed the tree with node `0` (`best[0] = 0`) so the first pick is free.
4. Repeat `n` times:
   - choose the unused node with the **smallest** `best` value;
   - mark it used, add `best[node]` to the running total;
   - relax every still-unused node: `best[i] = min(best[i], dist(node, i))`.
5. Return the total.

### Kruskal alternative

```python
edges = sorted(
    (dist(a, b), i, j)
    for i in range(n) for j in range(i + 1, n)
    for a, b in [(points[i], points[j])]
)
dsu = list(range(n))
def find(x):
    while dsu[x] != x:
        dsu[x] = dsu[dsu[x]]
        x = dsu[x]
    return x
total = 0
for w, i, j in edges:
    ri, rj = find(i), find(j)
    if ri != rj:
        dsu[ri] = rj
        total += w
```

## Walkthrough

`points = [[0,0],[2,2],[3,10],[5,2],[7,0]]` (indices `0..4`).

| add | cheapest edge | weight | tree edges so far |
| --- | --- | --- | --- |
| `0` | seed | `0` | `{0}` |
| `1` | `0-1` | `4` | `{0,1}` |
| `3` | `1-3` | `3` | `{0,1,3}` |
| `4` | `3-4` | `4` | `{0,1,3,4}` |
| `2` | `1-2` | `9` | `{0,1,2,3,4}` |

Total `0 + 4 + 3 + 4 + 9 = 20`. ✅

## Complexity

| | Time | Space |
| --- | --- | --- |
| Prim, dense (`O(n²)`) | `O(n²)` | `O(n)` |
| Kruskal (sort all edges) | `O(n² log n)` | `O(n²)` |

- **Time `O(n²)`** — `n` rounds, each scanning `n` candidates.
- **Space `O(n)`** — only the `best` and `used` arrays.

## Edge cases

- **Single point** — cost `0`.
- **Two points** — cost is just their Manhattan distance.
- **Duplicate points** — distance `0` edges let them join for free.
- **Negative coordinates** — `abs` differences handle them unchanged.
- **Collinear points** — the MST skips the long spanning edge in favour of the
  two short hops.
- **Ties in weight** — either edge is optimal, so the total is unique.

## Solution (`solution.py`)

```python
def min_cost_connect_points(points: List[List[int]]) -> int:
    n = len(points)
    if n <= 1:
        return 0
    INF = float("inf")
    best = [INF] * n
    best[0] = 0
    used = [False] * n
    total = 0
    for _ in range(n):
        node = -1
        for i in range(n):
            if not used[i] and (node == -1 or best[i] < best[node]):
                node = i
        used[node] = True
        total += best[node]
        x1, y1 = points[node]
        for i in range(n):
            if not used[i]:
                x2, y2 = points[i]
                dist = abs(x1 - x2) + abs(y1 - y2)
                if dist < best[i]:
                    best[i] = dist
    return total
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py min_cost_to_connect_all_points

# same tests through pytest
pytest topics/12_advanced_graphs/min_cost_to_connect_all_points -v

# your own case, one-shot
python3 run.py min_cost_to_connect_all_points -c '[[[0,0],[2,2],[3,10],[5,2],[7,0]]]'
```
