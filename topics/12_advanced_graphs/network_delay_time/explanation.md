# Network Delay Time

**Topic:** Advanced Graphs · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/network-delay-time/) · [NeetCode](https://neetcode.io/problems/network-delay-time)

## Problem

You are given a network of `n` nodes labelled `1..n` and a list of directed,
weighted edges `times[i] = [u, v, w]`: a signal sent from `u` reaches `v` after
`w` time. A signal is sent from node `k`. Return the minimum time for **all**
nodes to receive the signal, or `-1` if some node cannot receive it.

This is exactly the **max over all single-source shortest paths** from `k`.

## Examples

| `times` | `n` | `k` | Output |
| --- | --- | --- | --- |
| `[[2,1,1],[2,3,1],[3,4,1]]` | `4` | `2` | `2` |
| `[[1,2,1]]` | `2` | `1` | `1` |
| `[[1,2,1]]` | `2` | `2` | `-1` |

## Intuition

Every node gets the signal at the time of the **cheapest path** from `k`
(`w >= 0`, so paths never benefit from detours that repeat a node). The answer is
the **largest** of those shortest arrival times — the moment the final node is
reached.

Because all weights are non-negative, **Dijkstra** gives every shortest path at
once: repeatedly finalise the not-yet-finalised node with the smallest tentative
distance, then relax its outgoing edges. A binary heap keeps the "smallest
tentative" extraction at `O(log V)`.

Why not plain BFS? BFS assumes every edge costs 1. Here `1 -> 2` might cost `5`
while `1 -> 3 -> 2` costs `1 + 1 = 2`, so we must respect weights — that is what
Dijkstra's priority queue guarantees.

## Approach

1. Build an adjacency list `graph[u] = [(v, w), ...]` (directed).
2. Set `dist[k] = 0` and every other `dist` to infinity. Push `(0, k)`.
3. While the heap is not empty:
   - pop the smallest `(d, node)`; if `d > dist[node]` it is a **stale** entry —
     skip it;
   - for each edge `(node -> nxt, w)`, if `d + w < dist[nxt]`, update `dist[nxt]`
     and push it.
4. If any of `dist[1..n]` is still infinity, some node is unreachable → `-1`.
   Otherwise return `max(dist[1..n])`.

## Walkthrough

`times = [[1,2,5],[1,3,1],[3,2,1],[2,4,1]]`, `n = 4`, `k = 1`

| pop | `dist[1..4]` after relaxing | heap |
| --- | --- | --- |
| `(0,1)` | `0,5,1,inf` | `(1,3),(5,2)` |
| `(1,3)` | `0,2,1,inf` | `(2,2),(5,2)` |
| `(2,2)` | `0,2,1,3` | `(3,4),(5,2)` |
| `(3,4)` | `0,2,1,3` | `(5,2)` |
| `(5,2)` | stale (`5 > 2`) → skip | — |

Max dist `= 3`. ✅ Node `2` was reached in `1 + 1 = 2`, cheaper than the direct
`5` — the key difference from a greedy walk.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Dijkstra + binary heap (optimal) | `O(E log V)` | `O(V + E)` |
| Bellman-Ford | `O(V E)` | `O(V)` |

- **Time `O(E log V)`** — each edge can trigger one heap push.
- **Space `O(V + E)`** — adjacency list, distance array, heap.

## Edge cases

- **Single node** (`n = 1`, no edges) — already signalled, answer `0`.
- **Unreachable node** — return `-1`.
- **Disconnected component** — same as unreachable.
- **Cheaper detour** — Dijkstra picks the 2-hop path over the direct edge.
- **Directed edges** — `u -> v` does **not** imply `v -> u`.
- **Stale heap entries** — skipped via the `d > dist[node]` guard, so each node
  may be pushed more than once but only processed once.

## Solution (`solution.py`)

```python
def network_delay_time(times: List[List[int]], n: int, k: int) -> int:
    graph = defaultdict(list)
    for src, dst, weight in times:
        graph[src].append((dst, weight))

    INF = float("inf")
    dist = [INF] * (n + 1)
    dist[k] = 0

    heap = [(0, k)]
    while heap:
        d, node = heapq.heappop(heap)
        if d > dist[node]:
            continue
        for nxt, weight in graph[node]:
            if d + weight < dist[nxt]:
                dist[nxt] = d + weight
                heapq.heappush(heap, (dist[nxt], nxt))

    answer = max(dist[1:])
    return -1 if answer == INF else int(answer)
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py network_delay_time

# same tests through pytest
pytest topics/12_advanced_graphs/network_delay_time -v

# your own case, one-shot
python3 run.py network_delay_time -c '[[[2,1,1],[2,3,1],[3,4,1]], 4, 2]'
```
