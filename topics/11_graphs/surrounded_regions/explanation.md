# Surrounded Regions

**Topic:** Graphs · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/surrounded-regions/) · [NeetCode](https://neetcode.io/problems/surrounded-regions)

## Problem

Given an `m × n` board of `"X"` and `"O"`, capture every region of `"O"` that is
**completely surrounded** by `"X"` by flipping it to `"X"`. A region is *not*
surrounded if it touches any edge of the board (4-directional connectivity).

The board is mutated **and returned** so the runner can compare the result.

## Examples

| Input | Output |
| --- | --- |
| the 4×4 official example | all internal `O`s become `X`, the bottom-edge `O` survives |
| `[[X]]` | `[[X]]` |
| `[[O]]` | `[[O]]` — it sits on the border |

## Intuition

Trying to decide, region by region, whether it is enclosed is awkward: a region
might weave far from the border before finally escaping. It is far easier to
find everything that is **definitely safe** and flip the remainder.

An `"O"` is safe iff it is connected (4-directionally) to an `O` on the border.
So we seed a **multi-source BFS/DFS** from every border `"O"` and mark all the
`"O"` cells we can reach with a temporary marker `"T"`. After the flood:

- `"O"` cells never reached → enclosed → flip to `"X"`;
- `"T"` cells → restore to `"O"`.

## Approach

1. For every border cell `(r, c)` holding `"O"`, set it to `"T"` and enqueue it.
2. BFS: pop a cell, and for each 4-neighbour that is `"O"`, set it to `"T"` and
   enqueue it.
3. Sweep the whole board once more:
   - `"O"` → `"X"` (surrounded),
   - `"T"` → `"O"` (safe, restore).
4. Return the (mutated) board.

The three-state trick (`O` / `X` / `T`) avoids a separate `visited` array and
prevents the boundary flood from re-visiting cells.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Border flood + sweep | `O(m·n)` | `O(m·n)` |
| Union-find variant | `O(m·n α)` | `O(m·n)` |

- **Time `O(m·n)`** — each cell is inspected a constant number of times.
- **Space `O(m·n)`** — the BFS queue in the worst case (all border `O`s).

## Edge cases

- **Single cell** → always on the border; `"O"` survives.
- **No `"O"` at all** → board unchanged.
- **All `"O"`** → every cell touches the border (via the flood) → unchanged.
- **Fully enclosed region** → flipped, including large rings with holes.
- **Region touching the border indirectly** → survives, because the flood
  follows the connected chain all the way in.

## Solution (`solution.py`)

```python
from collections import deque
from typing import List


def solve(board: List[List[str]]) -> List[List[str]]:
    if not board or not board[0]:
        return board

    rows, cols = len(board), len(board[0])
    queue = deque()

    for r in range(rows):
        for c in range(cols):
            on_border = r == 0 or r == rows - 1 or c == 0 or c == cols - 1
            if on_border and board[r][c] == "O":
                board[r][c] = "T"
                queue.append((r, c))

    while queue:
        r, c = queue.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] == "O":
                board[nr][nc] = "T"
                queue.append((nr, nc))

    for r in range(rows):
        for c in range(cols):
            if board[r][c] == "O":
                board[r][c] = "X"
            elif board[r][c] == "T":
                board[r][c] = "O"

    return board
```

## How to run the tests

```bash
python3 run.py surrounded_regions
pytest topics/11_graphs/surrounded_regions -v
```
