"""Course Schedule — Graphs.

Decide whether all `num_courses` courses can be finished given prerequisite
pairs `[course, prereq]`. This is exactly "does the directed graph have a
cycle?".

Time O(V + E) · Space O(V + E)
"""
from collections import deque
from typing import List


def can_finish(num_courses: int, prerequisites: List[List[int]]) -> bool:
    """Kahn's algorithm: a topological order exists iff nothing is left over."""
    graph: List[List[int]] = [[] for _ in range(num_courses)]
    indegree = [0] * num_courses

    for course, prereq in prerequisites:
        graph[prereq].append(course)   # prereq -> course
        indegree[course] += 1

    queue = deque(c for c in range(num_courses) if indegree[c] == 0)
    taken = 0

    while queue:
        node = queue.popleft()
        taken += 1
        for nxt in graph[node]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)

    return taken == num_courses


# NeetCode-style class wrapper; the loader prefers the top-level function.
class Solution:
    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:
        return can_finish(numCourses, prerequisites)


if __name__ == "__main__":
    print(can_finish(2, [[1, 0]]))            # True
    print(can_finish(2, [[1, 0], [0, 1]]))    # False
