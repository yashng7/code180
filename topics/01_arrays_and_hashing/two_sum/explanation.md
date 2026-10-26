# Two Sum

**Topic:** Arrays & Hashing · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/two-sum/) · [NeetCode](https://neetcode.io/problems/two-sum)

## Problem

Given an array of integers `nums` and an integer `target`, return the **indices**
of the two numbers that add up to `target`.

You may assume:

- each input has **exactly one** valid solution,
- you may **not** use the same element twice,
- the answer may be returned in **any order**.

## Examples

| `nums` | `target` | Output | Why |
| --- | --- | --- | --- |
| `[2, 7, 11, 15]` | `9` | `[0, 1]` | `2 + 7 = 9` |
| `[3, 2, 4]` | `6` | `[1, 2]` | `2 + 4 = 6` |
| `[3, 3]` | `6` | `[0, 1]` | the two `3`s |

## Intuition

For each number `x`, we need to know whether its partner `target - x`
already exists in the array — and, if so, **where** it is.

That is exactly the job of a hash map: look up a value and get its index in
`O(1)` average time. So we can trade `O(n)` extra space for a single `O(n)` pass
instead of the brute-force `O(n²)` double loop.

## Approach

1. Create an empty map `seen` from **value → index**.
2. Walk through `nums` once with `enumerate`:
   - compute `complement = target - value`;
   - if `complement` is already in `seen`, we have found the pair —
     return `[seen[complement], index]`;
   - otherwise record `seen[value] = index` and continue.
3. Because we look **before** we insert, an element can never pair with itself.
   Duplicates still work: the second copy finds the first one in the map.

The single pass is what keeps it linear — we never need a nested loop.

## Walkthrough

`nums = [2, 7, 11, 15]`, `target = 9`

| index | value | complement `9 - value` | `seen` before | action |
| --- | --- | --- | --- | --- |
| 0 | 2 | 7 | `{}` | 7 not seen → store `{2: 0}` |
| 1 | 7 | 2 | `{2: 0}` | **2 seen → return `[0, 1]`** |

## Complexity

| | Time | Space |
| --- | --- | --- |
| Hash map (optimal) | `O(n)` | `O(n)` |
| Brute force | `O(n²)` | `O(1)` |

- **Time `O(n)`** — each element is visited once, and each hash lookup/insert is
  `O(1)` on average.
- **Space `O(n)`** — in the worst case the map stores every element before the
  pair is found.

## Edge cases

- **Duplicate values** (`[3, 3], 6`) — the second `3` finds the first in `seen`.
- **Negative numbers** — works unchanged; the map stores values, not positions.
- **Zeros** (`[0, 4, 3, 0], 0`) — the pair is the two zeros; the first `0` is
  stored before the second is checked.
- **Answer at the end** — the pass simply runs a little longer; still `O(n)`.
- **Element used twice** — prevented by checking before inserting.

## Solution (`solution.py`)

```python
def two_sum(nums: List[int], target: int) -> List[int]:
    seen: dict[int, int] = {}
    for index, value in enumerate(nums):
        complement = target - value
        if complement in seen:
            return [seen[complement], index]
        seen[value] = index
    return []
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py two_sum

# same tests through pytest
pytest topics/01_arrays_and_hashing/two_sum -v

# your own case, interactively
python3 run.py two_sum -c

# your own case, one-shot
python3 run.py two_sum -c '[[2,7,11,15], 9]'

# animated step-by-step walkthrough of the algorithm (terminal)
python3 run.py two_sum --animate
python3 run.py two_sum --animate -c '[[3, 2, 4], 6]' --speed 0.4

# 3blue1brown-style animated HTML page (served locally; Ctrl+C to stop)
python3 run.py two_sum --html
```

> Note: `compare` is set to `unordered` in `problem.json`, so `[1, 0]` is
> accepted wherever `[0, 1]` is.
