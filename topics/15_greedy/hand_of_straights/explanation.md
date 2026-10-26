# Hand of Straights

**Topic:** Greedy · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/hand-of-straights/) · [NeetCode](https://neetcode.io/problems/hand-of-straights)

## Problem

Given an integer `hand` and an integer `group_size`, return whether the cards can
be rearranged into groups of `group_size` **consecutive** cards.

## Examples

| `hand` | `group_size` | Output | Why |
| --- | --- | --- | --- |
| `[1,2,3,6,2,3,4,7,8]` | `3` | `True` | `[1,2,3],[2,3,4],[6,7,8]` |
| `[1,2,3,4,5]` | `4` | `False` | length not divisible by 4 |
| `[8,10,12]` | `3` | `False` | gaps at 9 and 11 |
| `[1,1,2,2,3,3]` | `3` | `True` | two copies of `[1,2,3]` |

## Intuition

Sort the distinct cards. Look at the **smallest** remaining card `c`. It cannot
belong to any group that starts below it (none exist), so it must be the first
card of some group — and that group is forced to be `c, c+1, …, c+group_size-1`.
Use up one copy of each. Repeat.

This is the "earliest deadline first"-flavoured greedy: the smallest card is the
most constrained item, so nothing is gained by delaying its placement.

## Approach

1. If `len(hand) % group_size != 0`, return `False`.
2. Count occurrences with a `Counter`.
3. For each card `c` in ascending order, if any copies remain, let
   `run = counts[c]`. Consume `run` copies of `c, c+1, …, c+group_size-1`.
   If any of those is short, return `False`.
4. Return `True`.

## Why the greedy choice is safe

**The smallest card has no alternative.** Let `c` be the smallest card with a
remaining copy. Any consecutive group containing `c` must have `c` as its
minimum (there is no smaller card left), hence the group is exactly
`c, c+1, …, c+group_size-1`. If `run` copies of `c` exist, *all* of them must
open `run` such groups simultaneously; no later decision can move them, because a
group is a set of distinct consecutive values and can absorb at most one copy of
`c`.

So at each step we make a forced move. If the required neighbours are missing,
no rearrangement could have helped (there was never a choice). By induction, the
greedy consumes the hand iff a valid partition exists.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Sort + counter (this) | `O(n log n)` | `O(n)` |
| Backtracking | exponential | `O(n)` |

## Edge cases

- **Length not divisible by `group_size`** — immediately impossible.
- **Duplicate smallest card** (`[1,1,2,3], 3`) — needs two runs starting at `1`,
  but only one `3` remains → `False`.
- **Equal cards only** (`[5,5,5,5], 4`) — equal is not consecutive.
- **Gapped values** (`[8,10,12], 3`) — the `9`/`11` are missing.
- **All distinct and consecutive** — becomes one big run.

## Solution (`solution.py`)

```python
from collections import Counter
from typing import List


def is_n_straight_hand(hand: List[int], group_size: int) -> bool:
    if len(hand) % group_size:
        return False
    counts = Counter(hand)
    for card in sorted(counts):
        if counts[card] == 0:
            continue
        run = counts[card]
        for offset in range(group_size):
            nxt = card + offset
            if counts[nxt] < run:
                return False
            counts[nxt] -= run
    return True
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py hand_of_straights

# same tests through pytest
pytest topics/15_greedy/hand_of_straights -v

# your own case
python3 run.py hand_of_straights -c '[[1,2,3,6,2,3,4,7,8], 3]'
```
