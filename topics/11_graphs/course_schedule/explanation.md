# Course Schedule

**Topic:** Graphs · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/course-schedule/) · [NeetCode](https://neetcode.io/problems/course-schedule)

## Problem

There are `numCourses` courses labelled `0 … numCourses-1`. Each pair
`[a, b]` in `prerequisites` means you must take course `b` **before** course
`a`. Return `true` if it is possible to finish **all** courses, otherwise
`false`.

This is a feasibility question: all courses are finishable **iff the directed
prerequisite graph is acyclic**.

## Examples

| `numCourses` | `prerequisites` | Output |
| --- | --- | --- |
| `2` | `[[1,0]]` | `true` |
| `2` | `[[1,0],[0,1]]` | `false` |
| `1` | `[]` | `true` |

## Intuition

A prerequisite `[a, b]` is a directed edge `b → a` ("`b` unlocks `a`"). A cycle
of prerequisites is a deadlock: each course waits on the next forever. So the
answer is simply "does the graph contain a **cycle**?".

**Kahn's algorithm** answers this without explicit recursion. It repeatedly
removes a node with **in-degree 0** (a course with no unfinished prerequisites).
If it manages to remove all `V` nodes, the graph is acyclic; if some nodes are
left with positive in-degree, they form at least one cycle.

## Approach

1. Build the adjacency list `prereq → [courses]` and an `indegree` array.
2. Enqueue every course with `indegree == 0`.
3. Pop a course, count it as `taken`, and decrement the in-degree of each
   dependent; enqueue any that reach zero.
4. Return `taken == numCourses`.

An alternative is a DFS with a three-colour marking (white/grey/black) that
reports a back edge as a cycle.

## Walkthrough

`numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]`

| step | queue | taken |
| --- | --- | --- |
| initial | `[0]` | 0 |
| pop 0 | `[1,2]` | 1 |
| pop 1 | `[2]` | 2 |
| pop 2 | `[3]` | 3 |
| pop 3 | `[]` | 4 → `4 == 4` → `true` |

## Complexity

| | Time | Space |
| --- | --- | --- |
| Kahn's algorithm | `O(V + E)` | `O(V + E)` |
| DFS cycle detection | `O(V + E)` | `O(V + E)` |

- **Time `O(V + E)`** — each vertex enters the queue once and each edge relaxes
  once.
- **Space `O(V + E)`** — adjacency list, in-degree array and queue.

## Edge cases

- **No prerequisites** → always `true`.
- **Self-loop** `[[0,0]]` → `false`.
- **Two-/three-cycles** → `false`.
- **Disconnected components** → all are processed; only cycles matter.
- **Duplicate edges** — harmless; in-degree counts them but the algorithm still
  drains correctly.

## Solution (`solution.py`)

```python
from collections import deque
from typing import List


def can_finish(num_courses: int, prerequisites: List[List[int]]) -> bool:
    graph: List[List[int]] = [[] for _ in range(num_courses)]
    indegree = [0] * num_courses

    for course, prereq in prerequisites:
        graph[prereq].append(course)
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
```

## How to run the tests

```bash
python3 run.py course_schedule
pytest topics/11_graphs/course_schedule -v
```
