# Cheapest Flights Within K Stops

**Topic:** Advanced Graphs · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/cheapest-flights-within-k-stops/) · [NeetCode](https://neetcode.io/problems/cheapest-flight-path)

## Problem

There are `n` cities connected by directed, weighted flights,
`flights[i] = [from, to, price]`. Find the cheapest price from `src` to `dst`
using **at most `k` stops**. A stop is an intermediate city, so a route with `k`
stops uses at most `k + 1` flights. Return `-1` if no such route exists.

## Examples

| `n` | `flights` | `src` | `dst` | `k` | Output |
| --- | --- | --- | --- | --- | --- |
| `4` | `[[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]]` | `0` | `3` | `1` | `700` |
| `3` | `[[0,1,100],[1,2,100],[0,2,500]]` | `0` | `2` | `1` | `200` |
| `3` | `[[0,1,100],[1,2,100],[0,2,500]]` | `0` | `2` | `0` | `500` |

## Intuition

The hop limit is what makes this problem interesting. Without it, plain
**Dijkstra** would happily return `0 -> 1 -> 2 -> 3 = 400` in the first example —
but that route has **two** stops, one too many. The stop budget is a *hard
constraint*, not a soft cost, so we cannot treat this as an ordinary weighted
shortest path.

Two standard fixes:

1. **Bellman-Ford, layered by hop count.** Relax every edge `k + 1` times, where
   round `r` uses only distances derived from at most `r` edges. Copying the
   distance array between rounds is essential: it prevents a node updated *this*
   round from chaining into further updates within the same round (which would
   silently allow more hops).
2. **BFS/Dijkstra over states `(city, stops_used)`.** Correct but needs a
   `V x (k+2)` visited table, so it is heavier to write.

We use the Bellman-Ford variant: simple, `O(k·E)`, and its round structure
mirrors the "at most `r` flights" recurrence directly.

## Approach (Bellman-Ford over `k + 1` rounds)

1. `dist[src] = 0`, all other distances infinity.
2. Repeat `k + 1` times:
   - copy `dist` into `nxt` (this is the layered DP step);
   - for every flight `(u, v, price)`, relax `nxt[v] = min(nxt[v], dist[u] +
     price)`;
   - set `dist = nxt`.
3. After the loop, `dist[dst]` is the cheapest fare using **at most `k + 1`
   flights**, i.e. at most `k` stops. Return `-1` if it is still infinity.

### State-space alternative

```python
best = {}                      # (city, stops) -> cheapest price
heap = [(0, src, 0)]           # (price, city, stops_used)
while heap:
    price, city, stops = heappop(heap)
    if city == dst:
        return price
    if stops > k:
        continue
    for nxt, fare in graph[city]:
        heappush(heap, (price + fare, nxt, stops + 1))
return -1
```

## Walkthrough

`n = 4`, `flights = [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]]`,
`src = 0`, `dst = 3`, `k = 1` (so 2 rounds).

| round (max flights) | `dist` after the round |
| --- | --- |
| start (`0` flights) | `[0, inf, inf, inf]` |
| `1` (≤1 flight) | `[0, 100, inf, inf]` |
| `2` (≤2 flights) | `[0, 100, 200, 700]` |

`dist[3] = 700` (`0 -> 1 -> 3`). The 2-stop route `0 -> 1 -> 2 -> 3 = 400` needs
**3** flights and only appears after the `k`-limited rounds have stopped. ✅

## Complexity

| | Time | Space |
| --- | --- | --- |
| Bellman-Ford layered (`O(k·E)`) | `O(k·E)` | `O(V)` |
| State Dijkstra `(city, stops)` | `O(V·k·log(V·k))` | `O(V·k)` |

- **Time `O(k · E)`** — `k + 1` rounds, each scanning every flight once.
- **Space `O(V)`** — the current and next distance arrays.

## Edge cases

- **`k = 0`** — only a single direct flight is allowed.
- **No route** — `dist[dst]` stays infinity → `-1`.
- **`src == dst`** — the cost is `0` (you are already there).
- **Cheaper longer route within budget** — Bellman-Ford finds it; the hop limit
  is respected.
- **Cheaper shorter route outside budget** — correctly *rejected*, as in the
  classic example.
- **Cycles** — no negative weights, and the fixed number of rounds prevents
  looping.

## Solution (`solution.py`)

```python
def find_cheapest_price(n, flights, src, dst, k):
    INF = float("inf")
    dist = [INF] * n
    dist[src] = 0

    for _ in range(k + 1):
        nxt = dist[:]
        for u, v, price in flights:
            if dist[u] != INF and dist[u] + price < nxt[v]:
                nxt[v] = dist[u] + price
        dist = nxt

    return -1 if dist[dst] == INF else int(dist[dst])
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py cheapest_flights_within_k_stops

# same tests through pytest
pytest topics/12_advanced_graphs/cheapest_flights_within_k_stops -v

# your own case, one-shot
python3 run.py cheapest_flights_within_k_stops -c '[4, [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]], 0, 3, 1]'
```
