# Gas Station

**Topic:** Greedy · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/gas-station/) · [NeetCode](https://neetcode.io/problems/gas-station)

## Problem

There are `n` stations on a circle. `gas[i]` is the fuel at station `i`, and
`cost[i]` is the fuel needed to travel from `i` to `i+1`. Return the starting
index from which you can complete the full clockwise tour with a non-negative
tank at every step, or `-1` if impossible. The answer is unique when it exists.

## Examples

| `gas` | `cost` | Output |
| --- | --- | --- |
| `[1,2,3,4,5]` | `[3,4,5,1,2]` | `3` |
| `[2,3,4]` | `[3,4,3]` | `-1` |
| `[5]` | `[4]` | `0` |
| `[5,1,2,3,4]` | `[4,4,1,5,1]` | `4` |

## Intuition

Two observations do all the work.

1. **Feasibility is a global fact.** If total gas `<` total cost, no start works;
   if total gas `>=` total cost, at least one start works. So we only need to
   *find* it.
2. **A failing prefix eliminates a whole block.** Suppose we start at `s` and the
   tank first goes negative arriving at station `j`. Then no station in
   `[s, j]` can be a valid start: each has already been "tested" as a later start
   within this same failed run. The earliest possible next candidate is `j + 1`.

## Approach

1. `total`, `tank`, `start = 0, 0, 0`.
2. For each station `i`: `net = gas[i] - cost[i]`; add it to `total` and `tank`.
3. If `tank < 0`, reset `start = i + 1` and `tank = 0`.
4. Return `start` if `total >= 0`, else `-1`.

## Why the greedy choice is safe

The claim is that when the run starting at `s` dies at `j`, every index in
`[s, j]` is also invalid as a start.

Consider any `k` with `s < k <= j`. When starting at `s`, the tank at every
step from `s` to `k-1` was non-negative, so the tank on reaching `k` was
`sum(gas[s..k-1]) - sum(cost[s..k-1]) >= 0`. Starting at `k` is never better: it
begins with zero instead of that same non-negative surplus, so it arrives at `j`
with a tank that is *no larger* than the run from `s` did — and that run went
negative by `j`. Hence starting at `k` also fails by `j`. So `j + 1` is the
earliest start worth testing, and skipping `[s, j]` loses nothing.

Since totals decide existence, one pass suffices.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Greedy one-pass (this) | `O(n)` | `O(1)` |
| Try every start | `O(n²)` | `O(1)` |

## Edge cases

- **Single station** — works iff `gas[0] >= cost[0]`.
- **Total gas < total cost** — return `-1` regardless of start.
- **Every station nets exactly zero** — start `0` works (tank never negative).
- **Only the last start works** — the reset logic walks `start` to the end.
- **Tank dips exactly to zero** — allowed; only `< 0` fails.

## Solution (`solution.py`)

```python
from typing import List


def can_complete_circuit(gas: List[int], cost: List[int]) -> int:
    total = 0
    tank = 0
    start = 0
    for index in range(len(gas)):
        net = gas[index] - cost[index]
        total += net
        tank += net
        if tank < 0:
            start = index + 1
            tank = 0
    return start if total >= 0 else -1
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py gas_station

# same tests through pytest
pytest topics/15_greedy/gas_station -v

# your own case
python3 run.py gas_station -c '[[1,2,3,4,5],[3,4,5,1,2]]'
```
