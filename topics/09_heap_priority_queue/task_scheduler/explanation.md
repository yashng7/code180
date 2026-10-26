# Task Scheduler

**Topic:** Heap / Priority Queue · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/task-scheduler/) · [NeetCode](https://neetcode.io/problems/task-scheduling)

## Problem

You are given an array of CPU `tasks`, each labelled with a capital letter, and
a non-negative integer `n` that represents a **cooldown** period: between two
runs of the **same** task there must be at least `n` intervals in which the CPU
runs a different task (or idles).

Return the **minimum number of intervals** the CPU needs to finish all tasks
(idle intervals count toward the total).

## Examples

| `tasks` | `n` | Output |
| --- | --- | --- |
| `["A","A","A","B","B","B"]` | `2` | `8` |
| `["A","C","A","B","A","B"]` | `1` | `6` |
| `["A","A","A","B","B","B"]` | `0` | `6` |

## Intuition

The task that occurs **most often** is the bottleneck. Say it appears `f` times.
To run it `f` times we need `f - 1` gaps of length `n + 1` (the task plus its
cooldown), plus one final run at the end:

```
A _ _ A _ _ A          # f = 3, n = 2  →  (f-1)*(n+1) + 1 slots
```

Other tasks fill those gaps. If the max frequency is shared by `m` tasks, the
final block has `m` tasks instead of `1`. So a lower bound is

```
(f - 1) * (n + 1) + m
```

Sometimes there are **more tasks than gaps** — then every task simply runs,
with no room for idle. So the answer is the **maximum** of that bound and
`len(tasks)`.

## Approach

1. Count each label with `Counter`.
2. `f = max(counts.values())` — the highest frequency.
3. `m =` the number of labels whose frequency equals `f`.
4. Return `max((f - 1) * (n + 1) + m, len(tasks))`.

## Walkthrough

`tasks = ["A","A","A","B","B","B"]`, `n = 2`: frequencies `A=3, B=3`, so
`f = 3`, `m = 2`.

```
(A B _) (A B _) (A B)   →   3 + 3 + 2 = 8
```

Bound: `(3 - 1) * 3 + 2 = 8`; `len(tasks) = 6`; answer `8`.

For `n = 0` the bound becomes `(3 - 1) * 1 + 2 = 4`, but
`max(4, 6) = 6` — the tasks just run back-to-back.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Count + formula (optimal) | `O(t)` | `O(1)` |
| Heap simulation | `O(t log 26)` | `O(26)` |

- **Time `O(t)`** — one pass to count, `t = len(tasks)`.
- **Space `O(1)`** — at most 26 distinct labels.

## Edge cases

- **`n == 0`** — no cooldown; the answer is `len(tasks)`.
- **A single task** — one interval.
- **Ties for the maximum frequency** — counted by `m` (the final block is
  wider), e.g. `A=3, B=3` needs `(3-1)*3 + 2`.
- **Plenty of distinct tasks** — e.g. six distinct-ish labels with `n = 2`:
  the gaps are all filled and `len(tasks)` wins.
- **Large `n`** — the schedule is dominated by idle slots, and the formula
  grows with `n`.

## Solution (`solution.py`)

```python
from collections import Counter
from typing import List


def least_interval(tasks: List[str], n: int) -> int:
    counts = Counter(tasks)
    max_freq = max(counts.values())
    max_freq_tasks = sum(1 for freq in counts.values() if freq == max_freq)
    return max((max_freq - 1) * (n + 1) + max_freq_tasks, len(tasks))
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py task_scheduler

# same tests through pytest
pytest topics/09_heap_priority_queue/task_scheduler -v
```
