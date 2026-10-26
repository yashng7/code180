"""Cheapest Flights Within K Stops — Advanced Graphs.

There are ``n`` cities connected by directed flights ``flights[i] =
[from, to, price]``. Find the cheapest price from ``src`` to ``dst`` using **at
most** ``k`` stops (a stop is any intermediate city, so at most ``k + 1``
flights). Return ``-1`` if there is no such route.

Example
-------
    Input : n = 4, flights = [[0,1,100],[1,2,100],[2,0,100],[1,3,600],[2,3,200]],
            src = 0, dst = 3, k = 1
    Output: 700        # 0 -> 1 -> 3, while 0 -> 1 -> 2 -> 3 is 2 stops (too many)

Time  O(k · E)  — Bellman-Ford relaxed for ``k + 1`` rounds.
Space O(V)      — two distance arrays.
"""
from typing import List


def find_cheapest_price(
    n: int, flights: List[List[int]], src: int, dst: int, k: int
) -> int:
    """Return the cheapest price from ``src`` to ``dst`` with at most ``k`` stops."""
    INF = float("inf")
    dist = [INF] * n
    dist[src] = 0

    # ``k + 1`` rounds == paths that use at most ``k + 1`` edges == k stops.
    # Copying ``dist`` each round keeps the hop count exact: a node updated in
    # this round cannot be re-used to extend a path again in the same round.
    for _ in range(k + 1):
        nxt = dist[:]
        for u, v, price in flights:
            if dist[u] != INF and dist[u] + price < nxt[v]:
                nxt[v] = dist[u] + price
        dist = nxt

    return -1 if dist[dst] == INF else int(dist[dst])


class Solution:
    def findCheapestPrice(
        self, n: int, flights: List[List[int]], src: int, dst: int, k: int
    ) -> int:
        return find_cheapest_price(n, flights, src, dst, k)


if __name__ == "__main__":
    flights = [[0, 1, 100], [1, 2, 100], [2, 0, 100], [1, 3, 600], [2, 3, 200]]
    print(find_cheapest_price(4, flights, 0, 3, 1))                       # 700
    print(find_cheapest_price(3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 1))  # 200
    print(find_cheapest_price(3, [[0, 1, 100], [1, 2, 100], [0, 2, 500]], 0, 2, 0))  # 500
