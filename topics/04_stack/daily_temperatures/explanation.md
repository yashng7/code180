# Daily Temperatures

**Topic:** Stack · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/daily-temperatures/) · [NeetCode](https://neetcode.io/problems/daily-temperatures)

## Problem

Given an array `temperatures` where `temperatures[i]` is the temperature on day
`i`, return an array `answer` where `answer[i]` is the number of days you have
to wait after day `i` to get a **warmer** temperature. If there is no future day
with a warmer temperature, set `answer[i] = 0`.

## Examples

| `temperatures` | Output |
| --- | --- |
| `[73,74,75,71,69,72,76,73]` | `[1,1,4,2,1,1,0,0]` |
| `[30,40,50,60]` | `[1,1,1,0]` |
| `[30,60,90]` | `[1,1,0]` |
| `[90,80,70,60]` | `[0,0,0,0]` |

## Intuition

The brute-force answer scans forward from every day — `O(n²)`. Notice instead
that days which are "still waiting" for a warmer day form a **decreasing**
sequence: if a later day were warmer than an earlier waiting day, that earlier
day would already have been resolved.

So we keep a **monotonic decreasing stack** of indices. When a new temperature
arrives, it is the warmer day that every stack entry with a **strictly lower**
temperature has been waiting for — pop each of them and record the distance.

## Approach

1. Create `answer = [0] * n` and an empty `stack` of indices.
2. For each day `i` with temperature `t`:
   - while the stack is non-empty **and** `temperatures[stack[-1]] < t`:
     pop `previous` and set `answer[previous] = i - previous` (today is the
     warmer day it waited for);
   - push `i`.
3. Any indices still on the stack at the end never found a warmer day, so their
   `answer` stays `0`.

The stack always holds temperatures in non-increasing order — hence
**monotonic** stack.

## Walkthrough

`temperatures = [73, 74, 75, 71, 69, 72, 76, 73]`

| day | temp | pops (index → wait) | stack after |
| --- | --- | --- | --- |
| 0 | 73 | — | `[0]` |
| 1 | 74 | `0→1` | `[1]` |
| 2 | 75 | `1→1` | `[2]` |
| 3 | 71 | — | `[2,3]` |
| 4 | 69 | — | `[2,3,4]` |
| 5 | 72 | `4→1`, `3→2` | `[2,5]` |
| 6 | 76 | `5→1`, `2→4` | `[6]` |
| 7 | 73 | — | `[6,7]` |

`answer = [1,1,4,2,1,1,0,0]`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Monotonic stack (optimal) | `O(n)` | `O(n)` |
| Brute force | `O(n²)` | `O(1)` |

- **Time `O(n)`** — each index enters the stack once and leaves at most once, so
  the total work of the inner `while` loop is `O(n)`.
- **Space `O(n)`** — a strictly decreasing array (e.g. `[90,80,70,60]`) leaves
  every index on the stack.

## Edge cases

- **Strictly decreasing** — nothing is ever popped; all answers are `0`.
- **Equal temperatures** — the comparison is **strict** (`<`), so equal days do
  not count as warmer; `[70,70,70]` yields `[0,0,0]`.
- **Singleton** — return `[0]`.
- **Strictly increasing** — each day's answer is `1` except the last, which
  stays `0`.

## Solution (`solution.py`)

```python
def daily_temperatures(temperatures: List[int]) -> List[int]:
    n = len(temperatures)
    answer = [0] * n
    stack: list[int] = []
    for day, temp in enumerate(temperatures):
        while stack and temperatures[stack[-1]] < temp:
            previous = stack.pop()
            answer[previous] = day - previous
        stack.append(day)
    return answer
```

## How to run the tests

```bash
# built-in test cases (7 of them)
python3 run.py daily_temperatures

# same tests through pytest
pytest topics/04_stack/daily_temperatures -v

# your own case, one-shot
python3 run.py daily_temperatures -c '[[73,74,75,71,69,72,76,73]]'
```
