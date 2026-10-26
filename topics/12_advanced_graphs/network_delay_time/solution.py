"""Network Delay Time — Advanced Graphs.

A network of ``n`` nodes is described by directed edges ``times[i] =
[u, v, w]``: a signal takes ``w`` time to travel from ``u`` to ``v``. Send a
signal from node ``k``. Return how long it takes for *every* node to receive the
signal, or ``-1`` if some node never receives it.

Example
-------
    Input : times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2
    Output: 2

Time  O(E log V)  — Dijkstra with a binary heap.
Space O(V + E)    — adjacency list, distance array, heap.
"""
import heapq
from collections import defaultdict
from typing import Dict, List, Tuple


def network_delay_time(times: List[List[int]], n: int, k: int) -> int:
    """Return the time for all nodes to receive the signal from ``k``."""
    graph: Dict[int, List[Tuple[int, int]]] = defaultdict(list)
    for src, dst, weight in times:
        graph[src].append((dst, weight))

    INF = float("inf")
    dist = [INF] * (n + 1)          # 1-indexed node ids
    dist[k] = 0

    heap: List[Tuple[int, int]] = [(0, k)]
    while heap:
        d, node = heapq.heappop(heap)
        if d > dist[node]:           # stale entry, skip
            continue
        for nxt, weight in graph[node]:
            if d + weight < dist[nxt]:
                dist[nxt] = d + weight
                heapq.heappush(heap, (dist[nxt], nxt))

    answer = max(dist[1:])
    return -1 if answer == INF else int(answer)


class Solution:
    def networkDelayTime(self, times: List[List[int]], n: int, k: int) -> int:
        return network_delay_time(times, n, k)


if __name__ == "__main__":
    print(network_delay_time([[2, 1, 1], [2, 3, 1], [3, 4, 1]], 4, 2))  # 2
    print(network_delay_time([[1, 2, 1]], 2, 1))                         # 1
    print(network_delay_time([[1, 2, 1]], 2, 2))                         # -1
