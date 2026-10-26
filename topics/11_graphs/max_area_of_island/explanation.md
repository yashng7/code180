# Max Area of Island

**Topic:** Graphs · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/max-area-of-island/) · [NeetCode](https://neetcode.io/problems/max-area-of-island)

## Problem

Given an `m × n` binary matrix `grid`, return the **maximum area** of an island.
An island is a group of `1`s connected 4-directionally; the area is the number
of cells in the group. Return `0` if there is no island.

## Examples

| `grid` | Output | Why |
| --- | --- | --- |
| 8×13 example above | `6` | the largest connected blob has 6 cells |
| `[[0,0,0,0,0,0,0,0]]` | `0` | no land |
| `[[1,1],[1,1]]` | `4` | the whole 2×2 block |

## Intuition

This is **Number of Islands** with a scoreboard. Each time the scan finds an
unvisited `1`, we flood-fill its whole island, counting cells as we go, and
update a running maximum. Sinking visited cells (writing `0`) prevents the
outer scan from ever re-entering the same island.

The traversal is the same DFS/BFS flood fill used for counting islands; only the
per-island measurement is new.

## Approach

1. Scan every cell row-major.
2. When `grid[r][c] == 1`, start a new island: set the cell to `0`, seed a BFS
   queue, and set `area = 0`.
3. BFS: pop a cell, `area += 1`, and enqueue each neighbour still equal to `1`
   (marking it `0` on enqueue).
4. When the queue drains, `best = max(best, area)`.
5. Return `best` (which stays `0` for an all-water grid).

## Walkthrough

`grid = [[1,1,1],[0,0,1]]` (top row and bottom-right)

| scan finds | BFS visits | area | best |
| --- | --- | --- | --- |
| `(0,0)` | `(0,0),(0,1),(0,2),(1,2)` | 4 | 4 |

## Complexity

| | Time | Space |
| --- | --- | --- |
| BFS/DFS flood fill | `O(m·n)` | `O(m·n)` |

- **Time `O(m·n)`** — each cell is visited and sunk at most once.
- **Space `O(m·n)`** — the queue can hold an entire island in the worst case
  (e.g. all ones). The `visited` bookkeeping is in-place.

## Edge cases

- **No land** → `0` (initialise `best = 0`, never assume an island exists).
- **All land** → `m·n`.
- **Single cell** → `0` or `1`.
- **Diagonals** (`[[1,0],[0,1]]`) → two islands of area `1`.
- **Touching at a corner only** → still separate components.

## Solution (`solution.py`)

```python
from collections import deque
from typing import List


def max_area_of_island(grid: List[List[int]]) -> int:
    if not grid or not grid[0]:
        return 0

    rows, cols = len(grid), len(grid[0])
    best = 0

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != 1:
                continue

            grid[r][c] = 0
            queue = deque([(r, c)])
            area = 0
            while queue:
                cr, cc = queue.popleft()
                area += 1
                for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nr, nc = cr + dr, cc + dc
                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 1:
                        grid[nr][nc] = 0
                        queue.append((nr, nc))
            best = max(best, area)

    return best
```

## How to run the tests

```bash
python3 run.py max_area_of_island
pytest topics/11_graphs/max_area_of_island -v
```
