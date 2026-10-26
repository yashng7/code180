# House Robber II

**Topic:** 1-D Dynamic Programming · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/house-robber-ii/) · [NeetCode](https://neetcode.io/problems/house-robber-ii)

## Problem

This is House Robber again, but the houses are arranged in a **circle**: the
first and last houses are adjacent, so you cannot rob both. Return the maximum
amount you can rob.

## Examples

| `nums` | Output | Why |
| --- | --- | --- |
| `[2, 3, 2]` | `3` | take the middle house (ends are adjacent) |
| `[1, 2, 3, 1]` | `4` | rob houses 0 and 2 (`1 + 3`) |
| `[1, 2, 3]` | `3` | rob house 0 or house 2 (`3`), not both |

## Intuition

The circle constraint couples only the two ends. In any valid plan, **at least
one** of house `0` or house `n-1` is left out. So the problem splits into two
independent straight-row problems:

1. rob houses `1..n-1` (house `0` excluded), and
2. rob houses `0..n-2` (house `n-1` excluded).

Take the better of the two. Each sub-problem is plain House Robber.

## Approach

1. If `n == 1`, return `nums[0]` (a single house is not adjacent to itself).
2. Otherwise return `max(rob_linear(nums[1:]), rob_linear(nums[:-1]))`.
3. `rob_linear` uses the House Robber recurrence

   ```
   dp[i] = max(dp[i-1], dp[i-2] + nums[i])
   ```

   with two **rolling variables** so it uses `O(1)` extra space.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Two linear passes (optimal) | `O(n)` | `O(1)` |
| Reusing `nums` slices | `O(n)` | `O(n)` for the slices |

## Edge cases

- **`n == 1`** — the only house can be robbed; guard before slicing so
  `nums[1:]` is not empty-twice.
- **`n == 2`** — the two houses are adjacent (both ways round), so take the
  larger.
- **Both ends large** — cannot take both, e.g. `[5, 1, 1, 5] -> 6`.
- **Taking only one end's row** — the `max` of the two sub-problems covers it.

## Solution (`solution.py`)

```python
def rob2(nums: List[int]) -> int:
    if len(nums) == 1:
        return nums[0]
    return max(_rob_linear(nums[1:]), _rob_linear(nums[:-1]))
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py house_robber_ii

# whole topic
python3 run.py 1d_dynamic

# your own case
python3 run.py house_robber_ii -c '[[2,3,2]]'
```
