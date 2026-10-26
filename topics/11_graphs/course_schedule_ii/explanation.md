# Course Schedule II

**Topic:** Graphs · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/course-schedule-ii/) · [NeetCode](https://neetcode.io/problems/course-schedule-ii)

## Problem

There are `numCourses` courses labelled `0 … numCourses-1`. Each pair
`[a, b]` means course `b` must be taken **before** course `a`. Return **any**
order in which all courses can be finished, or `[]` if it is impossible.

Because many orders can be valid, this problem uses `"compare": "custom"` with
the built-in `"checker": "topo_order"`, which re-derives the constraints and
accepts any genuine topological order (and requires `[]` exactly when the graph
has a cycle).

## Examples

| `numCourses` | `prerequisites` | Valid output |
| --- | --- | --- |
| `2` | `[[1,0]]` | `[0,1]` |
| `4` | `[[1,0],[2,0],[3,1],[3,2]]` | `[0,1,2,3]` (or `[0,2,1,3]`, …) |
| `3` | `[[0,1],[1,2],[2,0]]` | `[]` |

## Intuition

Same graph as **Course Schedule**, but now we must *produce* the order rather
than just say whether one exists. **Kahn's algorithm** emits courses the moment
their in-degree hits zero, which is exactly a valid take-order. If fewer than
`numCourses` are emitted, the rest form a cycle, so we return `[]`.

## Approach

1. Build `prereq → [courses]` and an `indegree` array.
2. Seed a queue with every in-degree-0 course.
3. Pop a course, append it to `order`, decrement dependents' in-degrees, and
   enqueue those reaching zero.
4. If `order` has all `numCourses` courses, return it; otherwise return `[]`.

The order inside the queue does not matter — any interleaving of ready courses
is a valid answer, which is why the checker is order-agnostic.

## Walkthrough

`numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]`

| pop | order | queue after |
| --- | --- | --- |
| 0 | `[0]` | `[1,2]` |
| 1 | `[0,1]` | `[2]` |
| 2 | `[0,1,2]` | `[3]` |
| 3 | `[0,1,2,3]` | `[]` → valid |

## Complexity

| | Time | Space |
| --- | --- | --- |
| Kahn's algorithm | `O(V + E)` | `O(V + E)` |
| DFS + reverse | `O(V + E)` | `O(V + E)` |

- **Time `O(V + E)`** — each vertex and edge is processed once.
- **Space `O(V + E)`** — adjacency list, in-degree array, queue and output.

## Edge cases

- **No prerequisites** → any permutation works, e.g. `0,1,…,n-1`.
- **Empty course load** (`numCourses = 0`) → `[]` is both correct and valid.
- **Cycle** → must return exactly `[]`.
- **Self-loop** → cycle → `[]`.
- **Multiple valid orders** → all accepted by the `topo_order` checker.
- **Duplicate prerequisites** — still correct; in-degree handles them.

## Solution (`solution.py`)

```python
from collections import deque
from typing import List


def find_order(num_courses: int, prerequisites: List[List[int]]) -> List[int]:
    graph: List[List[int]] = [[] for _ in range(num_courses)]
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

    return order if len(order) == num_courses else []
```

## How to run the tests

```bash
python3 run.py course_schedule_ii
pytest topics/11_graphs/course_schedule_ii -v
```
