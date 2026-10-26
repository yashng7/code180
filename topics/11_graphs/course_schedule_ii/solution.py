"""Course Schedule II — Graphs.

Return **any** valid order to take `num_courses` courses given prerequisite
pairs `[course, prereq]`, or `[]` if no such order exists (a cycle).

Time O(V + E) · Space O(V + E)
"""
from collections import deque
from typing import List


def find_order(num_courses: int, prerequisites: List[List[int]]) -> List[int]:
    """Kahn's algorithm, emitting courses in topological order."""
    graph: List[List[int]] = [[] for _ in range(num_courses)]
    indegree = [0] * num_courses

    for course, prereq in prerequisites:
        graph[prereq].append(course)   # prereq -> course
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

    return order if len(order) == num_courses else []


# NeetCode-style class wrapper; the loader prefers the top-level function.
class Solution:
    def findOrder(self, numCourses: int, prerequisites: List[List[int]]) -> List[int]:
        return find_order(numCourses, prerequisites)


if __name__ == "__main__":
    print(find_order(2, [[1, 0]]))                        # [0, 1]
    print(find_order(4, [[1, 0], [2, 0], [3, 1], [3, 2]]))
    print(find_order(3, [[0, 1], [1, 2], [2, 0]]))       # []
