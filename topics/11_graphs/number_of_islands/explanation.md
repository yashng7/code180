# Number of Islands

**Topic:** Graphs · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/number-of-islands/) · [NeetCode](https://neetcode.io/problems/count-number-of-islands)

## Problem

Given an `m × n` 2D grid of `"1"` (land) and `"0"` (water), return the number
of **islands**. An island is a group of land cells connected
**4-directionally** (horizontal or vertical only — diagonals do **not** count).
You may assume all four edges of the grid are surrounded by water.

## Examples

| `grid` | Output | Why |
| --- | --- | --- |
| the 4×5 example above | `1` | every `1` belongs to one blob |
| the two-blobs-plus-pair example | `3` | top-left blob, middle `1`, bottom-right pair |

## Intuition

This is the canonical **flood fill** / connected-components problem. Scan every
cell; each time we meet an *unvisited* land cell we have discovered a brand new
island, so we increment the count and then "sink" the entire island so we never
count it again.

Sinking is just a graph traversal: a BFS or DFS from the land cell visits every
reachable land cell, marking each as `"0"` (or into a `visited` set). After the
traversal returns, the whole island is gone and the outer scan will skip it.

## Approach

1. Guard against an empty grid.
2. For each cell `(r, c)` in row-major order:
   - if `grid[r][c] != "1"`, skip it;
   - otherwise this is a new island: `islands += 1`, set the cell to `"0"`,
     and push it onto a queue.
3. While the queue is non-empty, pop a cell and look at its four neighbours;
   every neighbour that is still `"1"` is marked `"0"` and enqueued.
4. Return `islands`.

Marking on **enqueue** (rather than on dequeue) is what keeps the queue from
holding duplicates and keeps the algorithm linear.

## Walkthrough

`grid = [["1","1","0"],["1","1","0"],["0","0","1"]]`

| outer scan finds | action | count |
| --- | --- | --- |
| `(0,0)` | BFS sinks `(0,0),(1,0),(0,1),(1,1)` | 1 |
| `(2,2)` | BFS sinks `(2,2)` | 2 |

## Complexity

| | Time | Space |
| --- | --- | --- |
| BFS/DFS flood fill | `O(m·n)` | `O(m·n)` |
| Union-find | `O(m·n α)` | `O(m·n)` |

- **Time `O(m·n)`** — each cell enters the queue and is visited at most once.
- **Space `O(m·n)`** — worst case (all land) the BFS queue / DFS stack holds a
  large frontier. The in-place sink uses no extra grid.

## Edge cases

- **All water** → `0`.
- **All land** → `1` (one giant island).
- **Single cell** → `1` or `0` depending on its value.
- **Diagonal touch** (`["1","0"],["0","1"]`) → they are *not* connected → `2`.
- **Single row/column** → still just 4-directional neighbours.

## Solution (`solution.py`)

```python
from collections import deque
from typing import List


def num_islands(grid: List[List[str]]) -> int:
    if not grid or not grid[0]:
        return 0

    rows, cols = len(grid), len(grid[0])
    islands = 0

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != "1":
                continue

            islands += 1
            grid[r][c] = "0"
            queue = deque([(r, c)])
            while queue:
                cr, cc = queue.popleft()
                for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nr, nc = cr + dr, cc + dc
                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == "1":
                        grid[nr][nc] = "0"
                        queue.append((nr, nc))

    return islands
```

## How to run the tests

```bash
python3 run.py number_of_islands
pytest topics/11_graphs/number_of_islands -v
```
