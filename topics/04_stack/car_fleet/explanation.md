# Car Fleet

**Topic:** Stack · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/car-fleet/) · [NeetCode](https://neetcode.io/problems/car-fleet)

## Problem

There are `n` cars on a one-lane road heading to a `target` position. Car `i`
starts at `position[i]` and moves at `speed[i]` (constant). A car can never pass
another car, but it may **catch up** to a slower car ahead and travel bumper to
bumper — that group is a **fleet**. If a car catches a fleet just as it reaches
the target, it still counts as part of that fleet. Return the number of fleets
that arrive at the target.

## Examples

| `target` | `position` | `speed` | Output |
| --- | --- | --- | --- |
| `12` | `[10,8,0,5,3]` | `[2,4,1,1,3]` | `3` |
| `10` | `[3]` | `[3]` | `1` |
| `100` | `[0,2,4]` | `[4,2,1]` | `1` |

## Intuition

Each car has an independent **arrival time** `(target - pos) / speed`. Two cars
end up in the same fleet exactly when the car **behind** would arrive no later
than the car ahead — it catches up before the finish line.

Sort the cars from **nearest the target to farthest**. Walking in that order, a
car forms a **new fleet** only if its arrival time is **strictly greater** than
the arrival time of the fleet immediately ahead; otherwise it merges into that
fleet. Because every merging car has a longer (or equal) remaining distance,
"fleet ahead" is always the relevant one to compare against — the running
maximum arrival time acts as a **monotonic stack** of fleet arrival times.

## Approach

1. Pair each car's `position` with its `speed` and sort by position
   **descending** (closest to the target first).
2. Track `fleet_time`, the arrival time of the fleet currently in front
   (initially `0`, i.e. nothing ahead).
3. For each car, compute `time = (target - pos) / speed`:
   - if `time > fleet_time`, this car cannot catch the fleet ahead → start a new
     fleet, increment the count, and update `fleet_time = time`;
   - otherwise it merges into the fleet ahead and we keep `fleet_time`.
4. Return the number of fleets started.

> **Why compare against a running maximum?** The fleet ahead of a given car is
> the **slowest** group encountered so far among cars nearer the target — which
> is exactly the largest arrival time seen. Keeping that maximum is the stack
> discipline in disguise.

## Walkthrough

`target = 12`, `position = [10,8,0,5,3]`, `speed = [2,4,1,1,3]`.
Sorted by position: `(10,2)`, `(8,4)`, `(5,1)`, `(3,3)`, `(0,1)`.

| car | time | `fleet_time` before | new fleet? | fleets |
| --- | --- | --- | --- | --- |
| `(10,2)` | `1.0` | `0.0` | yes (`1 > 0`) | 1 |
| `(8,4)` | `1.0` | `1.0` | no (`1 > 1` false) | 1 |
| `(5,1)` | `7.0` | `1.0` | yes (`7 > 1`) | 2 |
| `(3,3)` | `3.0` | `7.0` | no | 2 |
| `(0,1)` | `12.0` | `7.0` | yes (`12 > 7`) | 3 |

Answer `3`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Sort + one pass (optimal) | `O(n log n)` | `O(n)` |
| Pairwise simulation | `O(n²)` | `O(1)` |

- **Time `O(n log n)`** — sorting dominates; the sweep is a single `O(n)` pass.
- **Space `O(n)`** — the sorted list of `(position, speed)` tuples.

## Edge cases

- **Single car** — one fleet, regardless of speed.
- **Equal speeds** — times are ordered by position, so no car ever merges;
  every car is its own fleet.
- **Trailing car slower than the leader** — e.g. `position=[6,8]`,
  `speed=[3,2]`: the car at `6` arrives later and never catches the leader, so
  there are two fleets.
- **Catch-up at the target** — using `time > fleet_time` (strict) means a car
  arriving exactly with the fleet ahead merges into it.
- **All merge into one** — e.g. the third official example yields `1`.

## Solution (`solution.py`)

```python
def car_fleet(target: int, position: List[int], speed: List[int]) -> int:
    cars = sorted(zip(position, speed), reverse=True)
    fleets = 0
    fleet_time = 0.0
    for pos, spd in cars:
        time = (target - pos) / spd
        if time > fleet_time:
            fleets += 1
            fleet_time = time
    return fleets
```

## How to run the tests

```bash
# built-in test cases (7 of them)
python3 run.py car_fleet

# same tests through pytest
pytest topics/04_stack/car_fleet -v

# your own case, one-shot
python3 run.py car_fleet -c '[12, [10,8,0,5,3], [2,4,1,1,3]]'
```
