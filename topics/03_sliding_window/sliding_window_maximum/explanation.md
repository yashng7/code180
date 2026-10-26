# Sliding Window Maximum

**Topic:** Sliding Window · **Difficulty:** Hard
**Links:** [LeetCode](https://leetcode.com/problems/sliding-window-maximum/) · [NeetCode](https://neetcode.io/problems/sliding-window-maximum)

## Problem

You are given an array of integers `nums` and an integer `k`. A window of size
`k` moves from the very left of the array to the very right, one position at a
time. Return an array of the **maximum** value in each window.

## Examples

| `nums` | `k` | Output |
| --- | --- | --- |
| `[1, 3, -1, -3, 5, 3, 6, 7]` | `3` | `[3, 3, 5, 5, 6, 7]` |
| `[1]` | `1` | `[1]` |
| `[9, 11]` | `2` | `[11]` |

## Intuition

The window slides one step at a time, so the only interesting question is:
*when the window loses its current maximum, what is the next maximum?* A plain
sliding window would rescan all `k` elements each step, which is `O(n·k)`.

A **monotonic deque** answers that question in `O(1)` amortised time. We keep a
deque of **indices** whose values are in **decreasing order**. The front is
always the maximum of the current window. Two rules maintain this invariant:

1. **Before inserting** the new index, pop from the back every index whose value
   is `<=` the new value. Those values can never again be a maximum — the newer,
   larger value stays in the window at least as long.
2. **After inserting**, if the front index has fallen out of the window
   (`index <= right - k`), pop it from the front.

Because each index is pushed once and popped at most once, the deque work is
amortised `O(1)` per element.

## Approach

1. Create an empty deque `dq` (of indices) and a result list.
2. For each `right` and value:
   - pop from the **back** while the back's value is `<= value`;
   - push `right`;
   - if the front index is `<= right - k`, pop from the **front**;
   - once `right >= k - 1` the window is full — append `nums[dq[0]]`.
3. Return the result list.

The deque is the sliding-window template with an extra invariant: instead of
shrinking purely by position, we also discard dominated values.

## Walkthrough

`nums = [1, 3, -1, -3, 5, 3, 6, 7]`, `k = 3`

| `right` | value | deque after insert (indices) | front dropped? | window max |
| --- | --- | --- | --- | --- |
| 0 | 1 | `[0]` | no | — |
| 1 | 3 | `[1]` | no | — |
| 2 | -1 | `[1, 2]` | no | **3** |
| 3 | -3 | `[1, 2, 3]` | no | **3** |
| 4 | 5 | `[4]` | yes (1 out) | **5** |
| 5 | 3 | `[4, 5]` | no | **5** |
| 6 | 6 | `[6]` | no | **6** |
| 7 | 7 | `[7]` | no | **7** |

## Complexity

| | Time | Space |
| --- | --- | --- |
| Monotonic deque (optimal) | `O(n)` | `O(k)` |
| Rescan every window | `O(n·k)` | `O(1)` |
| Max-heap with lazy deletion | `O(n log n)` | `O(n)` |

- **Time `O(n)`** — every index enters the deque once and leaves at most once.
- **Space `O(k)`** — the deque holds at most one entry per window position.

## Edge cases

- **`k = 1`** — every element is its own window maximum.
- **`k = n`** — a single window; the deque ends with the global maximum.
- **Sorted ascending** — the window max is always the newest element.
- **Sorted descending** — the front never falls out early; the max just trails
  the shrinking front.
- **Negatives** — comparisons are numerical, so negative values work unchanged.
- **Duplicates** — the `<=` on the back pop only keeps the **newest** equal
  value, which is correct because it stays in the window longest.

## Solution (`solution.py`)

```python
from collections import deque


def max_sliding_window(nums: List[int], k: int) -> List[int]:
    dq: deque[int] = deque()
    result: List[int] = []

    for right, value in enumerate(nums):
        while dq and nums[dq[-1]] <= value:
            dq.pop()
        dq.append(right)

        if dq[0] <= right - k:
            dq.popleft()

        if right >= k - 1:
            result.append(nums[dq[0]])

    return result
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py sliding_window_maximum

# same tests through pytest
pytest topics/03_sliding_window/sliding_window_maximum -v

# your own case, one-shot
python3 run.py sliding_window_maximum -c '[[1,3,-1,-3,5,3,6,7], 3]'
```
