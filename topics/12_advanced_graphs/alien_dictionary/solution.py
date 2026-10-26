"""Alien Dictionary — Advanced Graphs.

A list of words is sorted according to the rules of an alien language. Derive a
valid ordering of all distinct letters used, or return ``""`` if no such
ordering exists (a cycle, or a prefix violation).

Example
-------
    Input : words = ["wrt","wrf","er","ett","rftt"]
    Output: "wertf"        # any valid ordering is accepted

Time  O(C + V + E)  — C total characters, V distinct letters, E derived edges.
Space O(V + E)      — the graph and indegree table.
"""
from collections import defaultdict, deque
from typing import DefaultDict, Dict, List, Set


def alien_order(words: List[str]) -> str:
    """Return any valid alien alphabet ordering, or ``""`` if impossible."""
    letters: Set[str] = set("".join(words))
    graph: DefaultDict[str, Set[str]] = defaultdict(set)
    indegree: Dict[str, int] = {ch: 0 for ch in letters}

    # Derive one ordering constraint per adjacent pair of words.
    for first, second in zip(words, words[1:]):
        for a, b in zip(first, second):
            if a != b:
                if b not in graph[a]:
                    graph[a].add(b)
                    indegree[b] += 1
                break
        else:
            # All shared characters matched: a longer word before a shorter one
            # is impossible (the shorter is a prefix of the longer).
            if len(first) > len(second):
                return ""

    if not letters:
        return ""

    # Kahn's algorithm; a lexicographic queue keeps the output deterministic.
    queue = deque(sorted(ch for ch in letters if indegree[ch] == 0))
    order: List[str] = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for nxt in sorted(graph[node]):
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)

    if len(order) != len(letters):       # a cycle remains -> impossible
        return ""
    return "".join(order)


class Solution:
    def alienOrder(self, words: List[str]) -> str:
        return alien_order(words)


if __name__ == "__main__":
    print(alien_order(["wrt", "wrf", "er", "ett", "rftt"]))  # wertf
    print(alien_order(["z", "x"]))                           # zx
    print(alien_order(["z", "x", "z"]))                      # ""
