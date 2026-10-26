# Rotting Oranges

**Topic:** Graphs · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/rotting-oranges/) · [NeetCode](https://neetcode.io/problems/rotting-fruit)

## Problem

You are given an `m × n` grid where each cell is `0` (empty), `1` (fresh orange)
or `2` (rotten orange). Every minute, any fresh orange **4-directionally**
adjacent to a rotten orange becomes rotten. Return the minimum number of minutes
until no cell has a fresh orange, or `-1` if that is impossible.

## Examples

| `grid` | Output | Why |
| --- | --- | --- |
| `[[2,1,1],[1,1,0],[0,1,1]]` | `4` | rot spreads outward, last orange at minute 4 |
| `[[2,1,1],[0,1,1],[1,0,1]]` | `-1` | the bottom-left orange is walled off |
| `[[0,2]]` | `0` | no fresh oranges from the start |

## Intuition

This is a **multi-source BFS**. Because *all* rotten oranges spread
simultaneously, we start the BFS with **every** initially rotten cell in the
queue at once — not just one. BFS explores the grid in layers of equal distance,
and each layer is exactly one minute of spread. The answer is the number of
layers processed, unless some fresh orange is never reached.

Seeding all sources up front is the whole trick: a single-source BFS from one
orange would underestimate/overcount because it would ignore parallel spread
from the other rotten oranges.

## Approach

1. Scan the grid once:
   - enqueue every `2`,
   - count every `1` into `fresh`.
2. `minutes = 0`. While the queue is non-empty **and** `fresh > 0`:
   - record the current queue length (this is one minute's frontier);
   - for each of those cells, rot any adjacent `1`, decrement `fresh`, and
     enqueue it;
   - `minutes += 1`.
3. After the loop, return `minutes` if `fresh == 0`, else `-1`.

Stopping when `fresh == 0` matters: otherwise the final, empty BFS level would
add a spurious extra minute.

## Walkthrough

`grid = [[2,1,1],[1,1,0],[0,1,1]]`

| minute | new frontier | remaining fresh |
| --- | --- | --- |
| 0 | `(0,0)` | 6 |
| 1 | `(0,1),(1,0)` | 4 |
| 2 | `(0,2),(1,1)` | 2 |
| 3 | `(2,1)` | 1 |
| 4 | `(2,2)` | 0 → answer `4` |

## Complexity

| | Time | Space |
| --- | --- | --- |
| Multi-source BFS | `O(m·n)` | `O(m·n)` |

- **Time `O(m·n)`** — every cell is enqueued at most once.
- **Space `O(m·n)`** — the queue can hold many rotten cells at the same level.

## Edge cases

- **No fresh oranges** → `0` immediately, even if the grid has no rotten cells.
- **Fresh orange sealed off by `0`s** → `-1`.
- **No rotten orange at all** with fresh present → `-1`.
- **All rotten** → `0`.
- **Several rotten sources** → seeded together, distances are handled correctly.

## Solution (`solution.py`)

```python
from collections import deque
from typing import List


def oranges_rotting(grid: List[List[int]]) -> int:
    if not grid or not grid[0]:
        return 0

    rows, cols = len(grid), len(grid[0])
    queue = deque()
    fresh = 0

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 2:
                queue.append((r, c))
            elif grid[r][c] == 1:
                fresh += 1

    minutes = 0
    while queue and fresh:
        for _ in range(len(queue)):
            r, c = queue.popleft()
            for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    fresh -= 1
                    queue.append((nr, nc))
        minutes += 1

    return minutes if fresh == 0 else -1
```

## How to run the tests

```bash
python3 run.py rotting_oranges
pytest topics/11_graphs/rotting_oranges -v
```
