# Reconstruct Itinerary

**Topic:** Advanced Graphs · **Difficulty:** Hard
**Links:** [LeetCode](https://leetcode.com/problems/reconstruct-itinerary/) · [NeetCode](https://neetcode.io/problems/reconstruct-itinerary)

## Problem

You are given a list of airline `tickets`, where `tickets[i] = [from_i, to_i]`
represents a one-way flight. Reconstruct the itinerary in order that:

- starts at `"JFK"`,
- uses **every** ticket exactly once,
- is the **lexicographically smallest** such itinerary when several exist.

If several valid itineraries exist, return the one with the smallest lexical
order when read as a single string.

## Examples

| `tickets` | Output |
| --- | --- |
| `[["MUC","LHR"],["JFK","MUC"],["SFO","SJC"],["LHR","SFO"]]` | `["JFK","MUC","LHR","SFO","SJC"]` |
| `[["JFK","SFO"],["JFK","ATL"],["SFO","ATL"],["ATL","JFK"],["ATL","SFO"]]` | `["JFK","ATL","JFK","SFO","ATL","SFO"]` |
| `[["JFK","KUL"],["JFK","NRT"],["NRT","JFK"]]` | `["JFK","NRT","JFK","KUL"]` |

## Intuition

We must walk every directed edge exactly once starting from `"JFK"` — this is an
**Eulerian path** in a directed multigraph.

A naive DFS that always visits the smallest neighbour can get stuck: in the
third example it takes `JFK -> KUL` and then has nowhere to go, even though the
ticket `JFK -> NRT` is still unused. The fix is **Hierholzer's algorithm**, which
defers committing a city to the answer until it has *no unused outgoing edges
left*. Nodes are emitted in **post-order** and the list is reversed at the end.
That way a branch taken "too early" simply belongs at the tail of the final
route, behind everything reachable from the other branches.

Choosing the smallest neighbour first (by sorting adjacency lists) makes the
resulting Eulerian path lexicographically smallest.

## Approach (Hierholzer)

1. Build an adjacency list `graph[from] = [to, ...]` (a multigraph: duplicate
   tickets are kept).
2. Sort every adjacency list in **descending** order. We will `pop()` from the
   end, so `pop()` hands back the **smallest** unused destination.
3. Keep a `stack` seeded with `"JFK"` and an empty `route`.
4. While the stack is non-empty, look at the top node:
   - if it still has unused edges, push `graph[node].pop()`;
   - otherwise **append it to `route` and pop it** (it is a dead end).
5. Reverse `route` — it is now the itinerary.

The post-order emission is the key: a node is only recorded once all flights
*leaving* it have been used, so the recorded order never strands an unused edge.

## Walkthrough

`tickets = [["JFK","KUL"],["JFK","NRT"],["NRT","JFK"]]`

Adjacency (descending): `JFK: ["NRT","KUL"]`, `NRT: ["JFK"]`.

| stack top | unused edges? | action | route |
| --- | --- | --- | --- |
| `JFK` | yes | push `NRT` | `[]` |
| `NRT` | yes | push `JFK` | `[]` |
| `JFK` | yes (`KUL`) | push `KUL` | `[]` |
| `KUL` | no | pop → route | `[KUL]` |
| `JFK` | no | pop → route | `[KUL, JFK]` |
| `NRT` | no | pop → route | `[KUL, JFK, NRT]` |
| `JFK` | no | pop → route | `[KUL, JFK, NRT, JFK]` |

Reverse → `["JFK","NRT","JFK","KUL"]`. ✅

## Complexity

| | Time | Space |
| --- | --- | --- |
| Sort + Hierholzer (optimal) | `O(E log E)` | `O(E)` |
| Backtracking over all paths | exponential | `O(E)` |

- **Time `O(E log E)`** — sorting the adjacency lists dominates; the Eulerian
  walk touches every edge exactly once.
- **Space `O(E)`** — the graph, the stack and the route each hold at most `E`
  entries.

## Edge cases

- **Dead-end early** (`JFK -> KUL` before `JFK -> NRT`) — handled by post-order.
- **Cycles / revisits** (`JFK -> ATL -> JFK`) — a city may be recorded several
  times; only edges are used once.
- **Repeated tickets** (`["JFK","MUC"]` twice) — the multigraph keeps duplicates.
- **Single ticket** — returns the two-city itinerary.
- **Lexicographic choice** — descending sort + `pop()` prefers the smallest
  destination at every fork.
- **Start always exists** — the input is guaranteed to admit an itinerary from
  `"JFK"`.

## Solution (`solution.py`)

```python
def find_itinerary(tickets: List[List[str]]) -> List[str]:
    graph: Dict[str, List[str]] = defaultdict(list)
    for src, dst in tickets:
        graph[src].append(dst)
    for src in graph:
        graph[src].sort(reverse=True)

    route: List[str] = []
    stack: List[str] = ["JFK"]
    while stack:
        node = stack[-1]
        if graph[node]:
            stack.append(graph[node].pop())
        else:
            route.append(stack.pop())
    route.reverse()
    return route
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py reconstruct_itinerary

# same tests through pytest
pytest topics/12_advanced_graphs/reconstruct_itinerary -v

# your own case, one-shot
python3 run.py reconstruct_itinerary -c '[[["JFK","SFO"],["SFO","JFK"]]]'
```
