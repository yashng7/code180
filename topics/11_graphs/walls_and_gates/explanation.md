# Walls and Gates

**Topic:** Graphs · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/walls-and-gates/) · [NeetCode](https://neetcode.io/problems/islands-and-treasure)

## Problem

You are given an `m × n` grid `rooms` with three kinds of cell:

- `-1` — a **wall** (impassable),
- `0` — a **gate**,
- `INF = 2147483647` — an empty room.

Fill each empty room with the distance to its **nearest gate**. If a room
cannot reach any gate it stays `INF`. The grid is mutated **and returned**.

## Examples

| `rooms` | Output |
| --- | --- |
| the 4×4 official example | distances `1..4`, walls and gates unchanged |
| `[[INF, 0, INF]]` | `[[1, 0, 1]]` |
| `[[INF]]` | `[[INF]]` — no gate at all |

## Intuition

Run BFS **from the gates**, not from the rooms. The first time BFS reaches a
room is necessarily via the shortest path, so we can write the distance then and
never revisit it. Because there can be many gates, we seed the queue with **all**
of them — a **multi-source BFS**. Their wavefronts expand together and collide,
and whichever reaches a room first is the closest gate.

Doing it per-room would repeat large parts of the grid; seeding all gates is
`O(m·n)` overall.

## Approach

1. Scan the grid, pushing every gate (`0`) into a queue.
2. While the queue is non-empty:
   - pop `(r, c)`;
   - for each 4-neighbour that is in-bounds and exactly `INF` (unvisited empty
     room — `-1` and gates are skipped automatically), set it to
     `rooms[r][c] + 1` and enqueue it.
3. Return the mutated `rooms`.

Using `== INF` as the "unvisited" test is safe: a filled room no longer equals
`INF`, so it is never revisited.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Multi-source BFS | `O(m·n)` | `O(m·n)` |
| Per-room BFS | `O((m·n)²)` | `O(m·n)` |

- **Time `O(m·n)`** — each room is enqueued at most once.
- **Space `O(m·n)`** — the queue holds a wavefront of rooms.

## Edge cases

- **No gates** → every room stays `INF`.
- **No empty rooms** → grid is unchanged.
- **Rooms cut off by walls** → stay `INF`.
- **A single gate** → behaves like ordinary BFS.
- **Multiple gates** → the closest one wins; BFS ordering guarantees it.
- **Sentinel value** → compare against the literal `2147483647` (`INF`).

## Solution (`solution.py`)

```python
from collections import deque
from typing import List

INF = 2147483647


def walls_and_gates(rooms: List[List[int]]) -> List[List[int]]:
    if not rooms or not rooms[0]:
        return rooms

    rows, cols = len(rooms), len(rooms[0])
    queue = deque()

    for r in range(rows):
        for c in range(cols):
            if rooms[r][c] == 0:
                queue.append((r, c))

    while queue:
        r, c = queue.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and rooms[nr][nc] == INF:
                rooms[nr][nc] = rooms[r][c] + 1
                queue.append((nr, nc))

    return rooms
```

## How to run the tests

```bash
python3 run.py walls_and_gates
pytest topics/11_graphs/walls_and_gates -v
```
