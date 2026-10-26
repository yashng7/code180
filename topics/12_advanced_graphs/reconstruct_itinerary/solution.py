"""Reconstruct Itinerary — Advanced Graphs.

Given a list of airline ``tickets`` ``[from, to]``, rebuild the itinerary that
starts at ``"JFK"`` and uses *every* ticket exactly once. When several
itineraries are possible, return the lexicographically smallest one.

Example
-------
    Input : tickets = [["MUC","LHR"],["JFK","MUC"],
                       ["SFO","SJC"],["LHR","SFO"]]
    Output: ["JFK","MUC","LHR","SFO","SJC"]

Time  O(E log E)  — sort the adjacency lists, then Hierholzer's one pass over edges.
Space O(E)        — adjacency lists plus the stack/route.
"""
from collections import defaultdict
from typing import Dict, List


def find_itinerary(tickets: List[List[str]]) -> List[str]:
    """Return the lexicographically smallest Eulerian path from ``JFK``."""
    # Destinations are kept in reverse-sorted order so that ``pop()`` yields the
    # lexicographically smallest unused neighbour first.
    graph: Dict[str, List[str]] = defaultdict(list)
    for src, dst in tickets:
        graph[src].append(dst)
    for src in graph:
        graph[src].sort(reverse=True)

    route: List[str] = []
    stack: List[str] = ["JFK"]
    # Hierholzer: only append to the route when a node has no unused edges left.
    # Recording nodes in *post-order* and reversing gives a valid Eulerian path
    # even when a dead end is hit early.
    while stack:
        node = stack[-1]
        if graph[node]:
            stack.append(graph[node].pop())
        else:
            route.append(stack.pop())
    route.reverse()
    return route


class Solution:
    def findItinerary(self, tickets: List[List[str]]) -> List[str]:
        return find_itinerary(tickets)


if __name__ == "__main__":
    print(find_itinerary([["MUC", "LHR"], ["JFK", "MUC"],
                          ["SFO", "SJC"], ["LHR", "SFO"]]))
    print(find_itinerary([["JFK", "SFO"], ["JFK", "ATL"], ["SFO", "ATL"],
                          ["ATL", "JFK"], ["ATL", "SFO"]]))
