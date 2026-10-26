# Partition Labels

**Topic:** Greedy · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/partition-labels/) · [NeetCode](https://neetcode.io/problems/partition-labels)

## Problem

Partition a string `s` into as many parts as possible such that each letter
appears in **at most one** part. Return the sizes of the parts, in order.

## Examples

| `s` | Output |
| --- | --- |
| `"ababcbacadefegdehijhklij"` | `[9, 7, 8]` |
| `"eccbbbbdec"` | `[10]` |
| `"ab"` | `[1, 1]` |
| `"abac"` | `[3, 1]` |

## Intuition

If a part contains a letter, it must contain **every** occurrence of that letter.
So a part's right edge must extend at least to the last occurrence of every
letter inside it. Walk left to right, keep stretching the current part's end to
each letter's last occurrence; the moment the scan index catches up to the end,
the part is complete and no letter leaks into the next one.

To maximise the number of parts, cut as early as legally allowed.

## Approach

1. Record `last[char]` — the final index of each character.
2. `start = end = 0`, `sizes = []`.
3. For each `(index, char)`: `end = max(end, last[char])`.
4. If `index == end`, the part `[start, end]` is closed: append its length and set
   `start = index + 1`.
5. Return `sizes`.

## Why the greedy choice is safe

**Cutting at the first legal point is optimal.** Let `end` be the largest last
occurrence among all characters seen in `[start, index]`. A cut is legal only
when `index >= end`, i.e. every character seen so far has had all its occurrences
inside the part.

- Cutting *earlier* than `index == end` is impossible: some seen character
  reappears after `index`, which would violate the one-part rule.
- Cutting *later* can only make the current part larger, which cannot increase
  the total number of parts (splitting a valid solution later merges what could
  have been two parts).

Since the first legal cut is unique and any valid partition must respect it,
choosing it is forced — the greedy is exact. This is the classic interval
scheduling "finish as early as possible" argument applied to character extents.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Two passes (this) | `O(n)` | `O(1)` (≤ 26 letters) |
| Interval sorting | `O(n log n)` | `O(n)` |

## Edge cases

- **Single character** → `[1]`.
- **All distinct** (`"abc"`) → `[1, 1, 1]`.
- **All identical** (`"aa"`) → `[2]`.
- **A repeated early letter forces a long part** (`"abac"` → first part covers the
  last `a`, so `[3, 1]`).
- **Whole string one part** (`"eccbbbbdec"` → `[10]`).

## Solution (`solution.py`)

```python
from typing import List


def partition_labels(s: str) -> List[int]:
    last = {char: index for index, char in enumerate(s)}
    sizes: List[int] = []
    start = 0
    end = 0
    for index, char in enumerate(s):
        end = max(end, last[char])
        if index == end:
            sizes.append(end - start + 1)
            start = index + 1
    return sizes
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py partition_labels

# same tests through pytest
pytest topics/15_greedy/partition_labels -v

# your own case
python3 run.py partition_labels -c '["ababcbacadefegdehijhklij"]'
```
