# Largest Rectangle in Histogram

**Topic:** Stack · **Difficulty:** Hard
**Links:** [LeetCode](https://leetcode.com/problems/largest-rectangle-in-histogram/) · [NeetCode](https://neetcode.io/problems/largest-rectangle-in-histogram)

## Problem

Given an array `heights` of non-negative integers where `heights[i]` is the
height of a bar of width `1`, return the area of the **largest rectangle** that
can be formed inside the histogram.

## Examples

| `heights` | Output | Rectangle |
| --- | --- | --- |
| `[2,1,5,6,2,3]` | `10` | height `5` across bars `5,6` |
| `[2,4]` | `4` | height `4` across one bar, or height `2` across both |
| `[2,1,2]` | `3` | height `1` across all three bars |
| `[1,2,3,4,5]` | `9` | height `3` across bars `3,4,5` |

## Intuition

Every maximal rectangle is **limited by some shortest bar**: fixing bar `i` as
that limiting bar, the widest rectangle with height `heights[i]` extends left
and right until a **shorter** bar blocks it. So the answer is

```
max over i of  heights[i] * (right_smaller_index[i] - left_smaller_index[i] - 1)
```

Instead of computing the nearest-smaller element on each side with two passes,
a single **monotonic increasing stack** finds them on the fly. The stack holds
indices whose heights are non-decreasing; the moment a **shorter** bar appears,
that shorter bar is the right boundary for every taller bar still on the stack,
so we can pop them and settle their rectangle immediately.

## Approach

1. Append a sentinel height `0` at the end so every bar is eventually popped.
2. Keep a `stack` of indices with **non-decreasing** heights.
3. For each index `i` with height `h`:
   - while the stack is non-empty and `heights[stack[-1]] > h`, pop the top
     index `bar`. Its height is fixed at `heights[bar]`; its right boundary is
     `i`, and its left boundary is the index now below it on the stack (or just
     before the start). The width is `i - stack[-1] - 1` (or `i` when the stack
     is empty). Update `best`.
   - push `i`.
4. Return `best`.

The width formula combines both boundaries in one step: after popping, the new
top is the **nearest shorter bar to the left**, and `i` is the nearest shorter
bar to the right.

## Walkthrough

`heights = [2, 1, 5, 6, 2, 3]` (with sentinel `0` → `[2,1,5,6,2,3,0]`)

| `i` | `h` | pops: bar(height)×width | `best` | stack after |
| --- | --- | --- | --- | --- |
| 0 | 2 | — | 0 | `[0]` |
| 1 | 1 | bar0: `2×1` | 2 | `[1]` |
| 2 | 5 | — | 2 | `[1,2]` |
| 3 | 6 | — | 2 | `[1,2,3]` |
| 4 | 2 | bar3: `6×1` | 6 | `[1,2]` |
| 4 | 2 | bar2: `5×2` | **10** | `[1]` |
| 4 | 2 | (bar1 height 1 not > 2) | 10 | `[1,4]` |
| 5 | 3 | — | 10 | `[1,4,5]` |
| 6 | 0 | bar5: `3×1`, bar4: `2×3`, bar1: `1×6` | 10 | `[6]` |

Answer `10`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Monotonic stack (optimal) | `O(n)` | `O(n)` |
| Brute force (try every pair of bounds) | `O(n²)` | `O(1)` |

- **Time `O(n)`** — each index is pushed once and popped at most once, so the
  total cost of the inner `while` loop is `O(n)`.
- **Space `O(n)`** — for a strictly increasing histogram the stack holds every
  index until the sentinel is reached.

## Edge cases

- **All zeros** — the sentinel triggers pops but zero-height bars give area `0`;
  the answer is `0`.
- **Singleton `[5]`** — the rectangle is the bar itself, area `5`.
- **Flat `[1,1]`** — the full-width rectangle at height `1` gives `2`.
- **Strictly increasing / decreasing** — handled uniformly; e.g. both
  `[1,2,3,4,5]` and `[5,4,3,2,1]` give `9`.
- **Equal heights** — using a strict `>` keeps equal bars on the stack, so they
  merge into one wider rectangle instead of splitting.

## Solution (`solution.py`)

```python
def largest_rectangle_area(heights: List[int]) -> int:
    best = 0
    stack: list[int] = []
    for i, height in enumerate(heights + [0]):
        while stack and heights[stack[-1]] > height:
            bar = stack.pop()
            width = i if not stack else i - stack[-1] - 1
            best = max(best, heights[bar] * width)
        stack.append(i)
    return best
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py largest_rectangle_in_histogram

# same tests through pytest
pytest topics/04_stack/largest_rectangle_in_histogram -v

# your own case, one-shot
python3 run.py largest_rectangle_in_histogram -c '[[2,1,5,6,2,3]]'
```
