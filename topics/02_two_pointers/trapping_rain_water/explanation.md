# Trapping Rain Water

**Topic:** Two Pointers · **Difficulty:** Hard
**Links:** [LeetCode](https://leetcode.com/problems/trapping-rain-water/) · [NeetCode](https://neetcode.io/problems/trapping-rain-water)

## Problem

Given `n` non-negative integers `height` representing an elevation map where
each bar has width `1`, compute how much water it can trap after raining.

The water above a bar at index `i` is
`min(max(height[:i+1]), max(height[i:])) - height[i]`, i.e. it depends on the
**tallest bar to the left** and the **tallest bar to the right**.

## Examples

| `height` | Output |
| --- | --- |
| `[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]` | `6` |
| `[4, 2, 0, 3, 2, 5]` | `9` |
| `[1, 0, 1]` | `1` |
| `[]` | `0` |

## Intuition

For each bar, the water it holds is capped by the **shorter** of the two tallest
walls around it. Computing both maxima for every bar needs two passes and
`O(n)` extra space — but we can avoid the storage with two pointers.

Notice: while `height[left] < height[right]`, the water at `left` is fully
determined by `left_max` alone. The right side has *some* wall at least as tall
as `height[right]`, which is already taller than `height[left]`, so a taller
right wall could never lower the cap below `left_max`. That means we can settle
the left bar immediately using only `left_max`:

- if `height[left] >= left_max`, this bar is a new left wall → no water;
- otherwise it traps `left_max - height[left]`.

Symmetric logic applies when `height[right] <= height[left]`. Sweeping inward
settles every bar in one pass with `O(1)` memory.

## Approach

1. If `height` is empty, return `0`.
2. Initialise `left = 0`, `right = n - 1`, `left_max = right_max = 0`, `water = 0`.
3. While `left < right`:
   - if `height[left] < height[right]`: update `left_max`, add
     `left_max - height[left]` when it is positive, then `left += 1`;
   - otherwise: update `right_max`, add `right_max - height[right]` when
     positive, then `right -= 1`.
4. Return `water`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Two pointers (optimal) | `O(n)` | `O(1)` |
| Prefix/suffix maxima arrays | `O(n)` | `O(n)` |
| Monotonic stack | `O(n)` | `O(n)` |

- **Time `O(n)`** — each pointer advances until the two meet; every bar is
  processed exactly once.
- **Space `O(1)`** — only the two pointers and the two running maxima are kept;
  no prefix/suffix arrays.

## Edge cases

- **Empty / flat array** (`[]`, `[0, 0, 0]`) — no basin, return `0`.
- **Single valley** (`[1, 0, 1]`) — one unit is trapped over the middle bar.
- **Tall narrow basin** (`[100, 0, 0, 0, 0, 100]`) — `4` gaps each hold `100`.
- **Monotonic slopes** (`[1, 2, 3]`, `[3, 2, 1]`) — every bar becomes a new
  maximum, so nothing is trapped.

## Solution (`solution.py`)

```python
def trap(height: List[int]) -> int:
    if not height:
        return 0

    left, right = 0, len(height) - 1
    left_max = right_max = 0
    water = 0

    while left < right:
        if height[left] < height[right]:
            if height[left] >= left_max:
                left_max = height[left]
            else:
                water += left_max - height[left]
            left += 1
        else:
            if height[right] >= right_max:
                right_max = height[right]
            else:
                water += right_max - height[right]
            right -= 1

    return water
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py trapping_rain_water

# same tests through pytest
pytest topics/02_two_pointers/trapping_rain_water -v

# your own case, one-shot
python3 run.py trapping_rain_water -c '[[0,1,0,2,1,0,1,3,2,1,2,1]]'
```
