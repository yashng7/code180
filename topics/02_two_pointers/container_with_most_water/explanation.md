# Container With Most Water

**Topic:** Two Pointers · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/container-with-most-water/) · [NeetCode](https://neetcode.io/problems/max-water-container)

## Problem

You are given an integer array `height` of length `n`, where `height[i]` is the
height of a vertical line drawn at `x = i`. Two lines, together with the
x-axis, form a container. Return the **maximum amount of water** such a
container can store.

The area between indices `i` and `j` (`i < j`) is
`(j - i) * min(height[i], height[j])`.

## Examples

| `height` | Output | Best pair |
| --- | --- | --- |
| `[1, 8, 6, 2, 5, 4, 8, 3, 7]` | `49` | indices `1` and `8`: `7 * min(8, 7) = 49` |
| `[1, 1]` | `1` | the only pair: `1 * 1 = 1` |
| `[4, 3, 2, 1, 4]` | `16` | indices `0` and `4`: `4 * min(4, 4) = 16` |

## Intuition

The area is driven by two competing factors: **width** (`j - i`) and the
**shorter wall** (`min`). Start with the widest container possible — the two
ends — then try to improve it.

Moving the **taller** wall is pointless: the width shrinks by one, and the
min is still bounded by the shorter wall, so the area cannot grow. Moving the
**shorter** wall, however, might reveal a taller wall and increase the min
enough to outweigh the lost width.

So the greedy rule is: always advance the pointer at the shorter wall. This
visits every candidate that could possibly be optimal, in `O(n)` time — no
need to test all `O(n^2)` pairs.

## Approach

1. Set `left = 0`, `right = n - 1`, and `best = 0`.
2. While `left < right`:
   - compute `area = (right - left) * min(height[left], height[right])`;
   - update `best`;
   - advance the pointer at the shorter wall (`left` if
     `height[left] < height[right]`, otherwise `right`).
3. Return `best`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Two pointers (optimal) | `O(n)` | `O(1)` |
| Check all pairs | `O(n^2)` | `O(1)` |

- **Time `O(n)`** — every iteration moves one pointer inward, so at most `n - 1`
  iterations.
- **Space `O(1)`** — just two indices and the running maximum.

## Edge cases

- **Two lines** (`[1, 1]`) — the loop runs once and returns their area.
- **Equal-height ends** (`[4, 3, 2, 1, 4]`) — moving either wall is fine; the
  ties do not change the optimum.
- **Flat array** (`[1, 1, 1, 1, 1]`) — width dominates, so the answer is the
  full span `4`.
- **Tall interior walls** — the greedy scan still reaches the best interior
  pair because the taller wall is never discarded prematurely.

## Solution (`solution.py`)

```python
def max_area(height: List[int]) -> int:
    left, right = 0, len(height) - 1
    best = 0
    while left < right:
        width = right - left
        area = width * min(height[left], height[right])
        best = max(best, area)
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    return best
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py container_with_most_water

# same tests through pytest
pytest topics/02_two_pointers/container_with_most_water -v

# your own case, one-shot
python3 run.py container_with_most_water -c '[[1,8,6,2,5,4,8,3,7]]'
```
