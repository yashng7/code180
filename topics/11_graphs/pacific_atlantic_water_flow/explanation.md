# Pacific Atlantic Water Flow

**Topic:** Graphs · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/pacific-atlantic-water-flow/) · [NeetCode](https://neetcode.io/problems/pacific-atlantic-water-flow)

## Problem

There is an `m × n` rectangular island. The **Pacific** ocean touches its left
and top edges; the **Atlantic** touches its right and bottom edges. Rain water
can flow from a cell to a 4-directional neighbour if that neighbour's height is
**less than or equal to** the current cell's height.

Return a list of grid coordinates `[r, c]` from which water can reach **both**
oceans. The order of the cells is free (this repo compares `unordered`), but
each coordinate is `[row, col]`.

## Examples

| `heights` | Output |
| --- | --- |
| the 5×5 official example | `[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]` |
| `[[1]]` | `[[0,0]]` |
| flat 3×3 of `1`s | all 9 cells |

## Intuition

Simulating water flowing **downhill** from every cell to the edge is expensive —
each of the `m·n` cells could explore much of the grid, giving `O((m·n)²)`.

Flip it around. Instead of asking "where can this cell escape?", ask **"which
cells can reach the Pacific?"** by starting *at* the Pacific edge and walking
**uphill** (to neighbours with height `>=` the current cell). A cell can reach
the ocean exactly when the reverse, uphill search from the ocean reaches it.
This is a **multi-source BFS/DFS**: seed the queue with every Pacific-border
cell, flood outward, and collect the visited set. Do the same for the Atlantic,
then take the **intersection**.

## Approach

1. Build the Pacific seeds: the whole top row plus the left column (minus the
   shared corner). Build the Atlantic seeds: the whole bottom row plus the
   right column.
2. `flood(starts)`:
   - put all seeds in a set and a queue;
   - repeatedly pop a cell and visit neighbours that are in-bounds, **unvisited**,
     and whose height is `>=` the popped cell's height;
   - return the reached set.
3. Run `flood` once per ocean.
4. Scan the grid and emit `[r, c]` for cells in both reached sets.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Reverse multi-source BFS | `O(m·n)` | `O(m·n)` |
| Naive per-cell DFS | `O((m·n)²)` | `O(m·n)` |

- **Time `O(m·n)`** — each cell is enqueued at most once per ocean.
- **Space `O(m·n)`** — two visited sets plus the queues.

## Edge cases

- **Single cell** → it touches both oceans → `[[0,0]]`.
- **Single row/column** → every cell touches both oceans directly.
- **Flat grid** → all cells qualify (equal height is allowed).
- **Strictly uphill toward one corner** → only the opposite border reaches the
  far ocean.
- **Equal heights** → movement is allowed because the rule is `>=`, not `>`.

## Solution (`solution.py`)

```python
from collections import deque
from typing import List


def pacific_atlantic(heights: List[List[int]]) -> List[List[int]]:
    if not heights or not heights[0]:
        return []

    rows, cols = len(heights), len(heights[0])
    directions = ((1, 0), (-1, 0), (0, 1), (0, -1))

    def flood(starts):
        reachable = set(starts)
        queue = deque(starts)
        while queue:
            r, c = queue.popleft()
            for dr, dc in directions:
                nr, nc = r + dr, c + dc
                if (0 <= nr < rows and 0 <= nc < cols
                        and (nr, nc) not in reachable
                        and heights[nr][nc] >= heights[r][c]):
                    reachable.add((nr, nc))
                    queue.append((nr, nc))
        return reachable

    pacific = [(0, c) for c in range(cols)] + [(r, 0) for r in range(1, rows)]
    atlantic = [(rows - 1, c) for c in range(cols)] + [
        (r, cols - 1) for r in range(rows - 1)
    ]

    from_pacific = flood(pacific)
    from_atlantic = flood(atlantic)

    return [
        [r, c]
        for r in range(rows)
        for c in range(cols)
        if (r, c) in from_pacific and (r, c) in from_atlantic
    ]
```

## How to run the tests

```bash
python3 run.py pacific_atlantic_water_flow
pytest topics/11_graphs/pacific_atlantic_water_flow -v
```
