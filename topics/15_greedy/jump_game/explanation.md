# Jump Game

**Topic:** Greedy · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/jump-game/) · [NeetCode](https://neetcode.io/problems/jump-game)

## Problem

You are given an integer array `nums` where `nums[i]` is the maximum jump length
from index `i`. Starting at index `0`, return `True` if you can reach the last
index, otherwise `False`.

## Examples

| `nums` | Output | Why |
| --- | --- | --- |
| `[2,3,1,1,4]` | `True` | jump `0 → 1 → 4` |
| `[3,2,1,0,4]` | `False` | index `3` is a dead end; `4` unreachable |
| `[0]` | `True` | already at the last index |
| `[2,0,0]` | `True` | jump straight from `0` to `2` |

## Intuition

We don't need to choose exact jumps — we only need to know *how far* we can
possibly get. Maintain a single frontier `reach`: the farthest index we could
ever stand on. As we sweep left to right, every index we can actually enter
(`index <= reach`) extends the frontier to `index + nums[index]`.

If the sweep ever reaches an index beyond `reach`, there is a gap we can never
cross — return `False`.

## Approach

1. `reach = 0`, `last = len(nums) - 1`.
2. For each `(index, step)`:
   - if `index > reach`, return `False` (unreachable island);
   - `reach = max(reach, index + step)`;
   - if `reach >= last`, return `True`.
3. Return `True`.

## Why the greedy choice is safe

The key claim: after processing indices `0..i`, `reach` equals the maximum index
that is reachable from the start using only indices `0..i`.

- Only indices `<= reach` are enterable, so scanning a reachable index is
  permitted; scanning an unreachable one (`index > reach`) proves the gap is
  permanent, because no earlier index could reach further.
- Extending to `max(reach, index + step)` is optimal: from any reachable set,
  the union of all landing ranges is exactly `[0, reach]`, so pushing the
  frontier as far as possible dominates every alternative plan.

Because we store only the farthest point rather than a specific path, the greedy
choice loses no information — any concrete route is subsumed by the frontier.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Greedy frontier (this) | `O(n)` | `O(1)` |
| DP over reachable indices | `O(n²)` | `O(n)` |

## Edge cases

- **Single element** (`[0]`) — already at the last index → `True`.
- **Zero at index 0 of a longer array** (`[0,1]`) — can't move → `False`.
- **Consecutive zeros crossed by one big jump** (`[2,0,0]`) — `True`.
- **One-step moves into a zero** (`[1,0,1]`) — `False`.
- **Big jump in the middle** — the frontier leaps over the zeros.

## Solution (`solution.py`)

```python
from typing import List


def can_jump(nums: List[int]) -> bool:
    reach = 0
    last = len(nums) - 1
    for index, step in enumerate(nums):
        if index > reach:
            return False
        reach = max(reach, index + step)
        if reach >= last:
            return True
    return True
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py jump_game

# same tests through pytest
pytest topics/15_greedy/jump_game -v

# your own case
python3 run.py jump_game -c '[[2,3,1,1,4]]'
```
