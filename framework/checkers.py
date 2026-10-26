"""Problem-specific validators for answers that have several valid outputs.

Registered checkers are referenced from ``problem.json`` via::

    {"compare": "custom", "checker": "topo_order"}

A checker has the signature ``checker(actual, expected, case, meta) -> bool``
and receives the whole test case, so it can re-derive the constraints from the
inputs.
"""
from __future__ import annotations

from collections import defaultdict, deque
from typing import Any, Dict, List, Optional, Tuple


def _kahn_order(num_courses: int, prerequisites: List[List[int]]) -> Optional[List[int]]:
    graph: Dict[int, List[int]] = defaultdict(list)
    indegree = [0] * num_courses
    for course, prereq in prerequisites:
        graph[prereq].append(course)
        indegree[course] += 1

    queue = deque(c for c in range(num_courses) if indegree[c] == 0)
    order: List[int] = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for nxt in graph[node]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)
    return order if len(order) == num_courses else None


def topo_order(actual: Any, expected: Any, case: Dict[str, Any], meta: Dict[str, Any]) -> bool:
    """Accept any valid topological order (Course Schedule II)."""
    num_courses, prerequisites = case["args"][0], case["args"][1]
    if _kahn_order(num_courses, prerequisites) is None:
        return actual == []
    if not isinstance(actual, list) or len(actual) != num_courses:
        return False
    if sorted(actual) != list(range(num_courses)):
        return False
    position = {course: index for index, course in enumerate(actual)}
    return all(position[prereq] < position[course] for course, prereq in prerequisites)


def _alien_edges(words: List[str]) -> Tuple[set, set, bool]:
    letters = set("".join(words))
    edges = set()
    valid = True
    for first, second in zip(words, words[1:]):
        for a, b in zip(first, second):
            if a != b:
                edges.add((a, b))
                break
        else:
            if len(first) > len(second):
                valid = False        # prefix rule violated -> no valid order
    return letters, edges, valid


def alien_order(actual: Any, expected: Any, case: Dict[str, Any], meta: Dict[str, Any]) -> bool:
    """Accept any valid Alien Dictionary ordering ("" when impossible)."""
    words = case["args"][0]
    letters, edges, valid = _alien_edges(words)
    if not valid:
        return actual == ""
    if not letters:
        return actual == ""

    graph: Dict[str, set] = defaultdict(set)
    indegree = {ch: 0 for ch in letters}
    for a, b in edges:
        if b not in graph[a]:
            graph[a].add(b)
            indegree[b] += 1

    queue = deque(sorted(ch for ch in letters if indegree[ch] == 0))
    seen = 0
    while queue:
        node = queue.popleft()
        seen += 1
        for nxt in sorted(graph[node]):
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)
    if seen != len(letters):
        return actual == ""          # cycle

    if not isinstance(actual, str) or sorted(actual) != sorted(letters):
        return False
    position = {ch: index for index, ch in enumerate(actual)}
    return all(position[a] < position[b] for a, b in edges)


def _longest_palindrome_length(s: str) -> int:
    if not s:
        return 0
    length = len(s)
    best = 1
    for center in range(length):
        left = right = center            # odd-length centres
        while left >= 0 and right < length and s[left] == s[right]:
            best = max(best, right - left + 1)
            left -= 1
            right += 1
        left, right = center, center + 1  # even-length centres
        while left >= 0 and right < length and s[left] == s[right]:
            best = max(best, right - left + 1)
            left -= 1
            right += 1
    return best


def longest_palindrome(actual: Any, expected: Any, case: Dict[str, Any], meta: Dict[str, Any]) -> bool:
    """Accept any longest palindromic substring (ties allowed)."""
    s = case["args"][0]
    if not isinstance(actual, str) or actual != actual[::-1]:
        return False
    if not s:
        return actual == ""
    if actual not in s:
        return False
    return len(actual) == _longest_palindrome_length(s)


CHECKERS = {
    "topo_order": topo_order,
    "alien_order": alien_order,
    "longest_palindrome": longest_palindrome,
}
