# Swim in Rising Water

**Topic:** Advanced Graphs · **Difficulty:** Hard
**Links:** [LeetCode](https://leetcode.com/problems/swim-in-rising-water/) · [NeetCode](https://neetcode.io/problems/swim-in-rising-water)

## Problem

You are given an `n x n` integer matrix `grid` where `grid[i][j]` is the
elevation of that cell. At time `t` the water level is `t`, so you can stand on a
cell only if `grid[i][j] <= t`. You start at `(0, 0)` and want to reach
`(n - 1, n - 1)`, moving one cell at a time up/down/left/right (you may swim any
distance instantly, but only through flooded cells). Return the **least time** at
which it is possible.

## Examples

| `grid` | Output |
| --- | --- |
| `[[0,2],[1,3]]` | `3` |
| `[[0,1,2,3,4],[24,23,22,21,5],[12,13,14,15,16],[11,17,18,19,20],[10,9,8,7,6]]` | `16` |
| `[[0,1],[2,3]]` | `3` |

## Intuition

For a fixed path `P`, the earliest time you can travel it is the **maximum**
elevation along `P` — you must wait for the highest cell to submerge. So the
answer is

```
min over paths P from (0,0) to (n-1,n-1) of  max grid[cell]
```

This is a **minimax (bottleneck) shortest path**. Plain BFS by "water level `t`
and flood" also works, but the elegant solution is **Dijkstra with a twist**: a
path's cost is the **maximum** cell seen so far rather than a sum. Relaxation
becomes

```
best[nbr] = min(best[nbr], max(best[cur], grid[nbr]))
```

Because `max` is monotone (extending a path never lowers its cost) and all
weights are non-negative, the greedy "always pop the smallest current cost"
argument still holds, so a priority queue yields the optimum.

An equally valid approach is **binary search on `t`** plus a BFS that only walks
cells with `grid <= t`.

## Approach (minimax Dijkstra)

1. `best[r][c]` = lowest time to reach `(r, c)`; initialise `best[0][0] =
   grid[0][0]` and the rest to infinity.
2. Push `(grid[0][0], 0, 0)` onto a min-heap keyed by time.
3. Pop the smallest `(time, r, c)`; skip it if `time > best[r][c]` (stale).
4. If `(r, c)` is the target, return `time`.
5. For each in-bounds neighbour, `n_time = max(time, grid[nr][nc])`; if it
   improves `best`, record it and push.
6. Return `best[n-1][n-1]`.

### Binary-search alternative

```python
lo, hi = grid[0][0], max(max(row) for row in grid)
while lo < hi:
    mid = (lo + hi) // 2
    if reachable(mid):   # BFS over cells with grid <= mid
        hi = mid
    else:
        lo = mid + 1
```

## Walkthrough

`grid = [[0,1,5],[3,4,6],[2,9,7]]`. The bottom-left route through `9` is bad;
the top route `0 -> 1 -> 5 -> 6 -> 7` peaks at `7`.

| popped `(time,r,c)` | pushed neighbours (time) |
| --- | --- |
| `(0,0,0)` | `(1,0,1)`, `(3,1,0)` |
| `(1,0,1)` | `(5,0,2)`, `(4,1,1)` |
| `(3,1,0)` | `(4,1,1)`, `(3,2,0)` |
| `(4,1,1)` | `(6,1,2)` |
| `(5,0,2)` | — |
| `(6,1,2)` | `(7,2,2)` |
| `(7,2,2)` | target → return `7` |

The `9` cell is never chosen. ✅

## Complexity

| | Time | Space |
| --- | --- | --- |
| Minimax Dijkstra (optimal) | `O(n² log n)` | `O(n²)` |
| Binary search + BFS | `O(n² log n)` | `O(n²)` |
| Exhaustive DFS | exponential | `O(n²)` |

- **Time `O(n² log n)`** — there are `n²` cells; each can be pushed once and each
  heap operation is `O(log n²)`.
- **Space `O(n²)`** — the `best` matrix and the heap.

## Edge cases

- **Single cell** (`n = 1`) — already there, answer `grid[0][0]`.
- **Start elevation is the maximum** — the answer is just the start value.
- **Target elevation is the maximum** — the answer is the target value.
- **Naive lowest-neighbour greedy** — fails when the greedy step enters a pit
  (see the `9` case); Dijkstra's global ordering fixes it.
- **Unique elevations** — guaranteed by the statement, but duplicates would not
  break the algorithm.

## Solution (`solution.py`)

```python
def swim_in_water(grid: List[List[int]]) -> int:
    n = len(grid)
    INF = float("inf")
    best = [[INF] * n for _ in range(n)]
    best[0][0] = grid[0][0]

    heap = [(grid[0][0], 0, 0)]
    while heap:
        time, row, col = heapq.heappop(heap)
        if time > best[row][col]:
            continue
        if row == n - 1 and col == n - 1:
            return time
        for d_row, d_col in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n_row, n_col = row + d_row, col + d_col
            if 0 <= n_row < n and 0 <= n_col < n:
                n_time = max(time, grid[n_row][n_col])
                if n_time < best[n_row][n_col]:
                    best[n_row][n_col] = n_time
                    heapq.heappush(heap, (n_time, n_row, n_col))
    return best[n - 1][n - 1]
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py swim_in_rising_water

# same tests through pytest
pytest topics/12_advanced_graphs/swim_in_rising_water -v

# your own case, one-shot
python3 run.py swim_in_rising_water -c '[[[0,2],[1,3]]]'
```
