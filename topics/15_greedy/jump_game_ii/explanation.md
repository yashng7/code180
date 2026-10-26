# Jump Game II

**Topic:** Greedy · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/jump-game-ii/) · [NeetCode](https://neetcode.io/problems/jump-game-ii)

## Problem

Given `nums` where `nums[i]` is the maximum jump length from index `i`, return
the **minimum number of jumps** to reach the last index. Reaching it is always
possible.

## Examples

| `nums` | Output | Why |
| --- | --- | --- |
| `[2,3,1,1,4]` | `2` | `0 → 1 → 4` |
| `[2,3,0,1,4]` | `2` | `0 → 1 → 4` |
| `[0]` | `0` | already at the last index |
| `[1,1,1,1]` | `3` | must step every index |

## Intuition

Think of the array as a graph where index `i` connects to every index up to
`i + nums[i]`. Minimum jumps is a BFS shortest path — but we don't need a queue.
The reachable set after `k` jumps is always a *contiguous prefix* `[0, end_k]`.
So BFS collapses into: maintain the current layer's right edge `current_end`,
and while scanning inside the layer track the farthest index the *next* layer
could reach.

## Approach

1. `jumps = 0`, `current_end = 0`, `farthest = 0`.
2. Scan `index` from `0` to `len(nums) - 2`:
   - `farthest = max(farthest, index + nums[index])`;
   - when `index == current_end`, the current layer is exhausted: increment
     `jumps` and commit `current_end = farthest`.
3. Return `jumps`.

## Why the greedy choice is safe

Two facts make the layer greedy optimal:

- **Layers are prefixes.** From a reachable prefix `[0, e]`, the union of all
  landing positions is `[0, max_i(i + nums[i])]` — again a prefix. So the set of
  indices reachable in `j` jumps is well described by a single right edge.
- **BFS breadth is monotone.** Taking *every* index in the current layer into the
  next (rather than some subset) maximises the next edge. Any index reachable in
  `j` jumps by some clever route is inside the prefix, so extending greedily
  never skips a shorter route.

Therefore committing one jump per completed layer counts the true BFS distance —
the minimum number of jumps.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Greedy BFS layers (this) | `O(n)` | `O(1)` |
| Explicit BFS | `O(n²)` worst | `O(n)` |

## Edge cases

- **Single element** — zero jumps (the loop range is empty).
- **First jump reaches the end** (`[3,2,1]`) — one jump.
- **All ones** — the forced staircase needs `n-1` jumps.
- **Zeros inside a layer** — they add nothing to `farthest` but cost nothing.
- **Last index** — we never jump *from* it, hence the `len(nums) - 1` bound.

## Solution (`solution.py`)

```python
from typing import List


def jump(nums: List[int]) -> int:
    jumps = 0
    current_end = 0
    farthest = 0
    for index in range(len(nums) - 1):
        farthest = max(farthest, index + nums[index])
        if index == current_end:
            jumps += 1
            current_end = farthest
            if current_end >= len(nums) - 1:
                break
    return jumps
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py jump_game_ii

# same tests through pytest
pytest topics/15_greedy/jump_game_ii -v

# your own case
python3 run.py jump_game_ii -c '[[2,3,1,1,4]]'
```
