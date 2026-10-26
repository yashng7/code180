# Merge Triplets to Form Target Triplet

**Topic:** Greedy · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/merge-triplets-to-form-target-triplet/) · [NeetCode](https://neetcode.io/problems/merge-triplets-to-form-target)

## Problem

Merging two triplets produces their element-wise maximum. Given `triplets` and
`target`, return whether repeated merges can produce exactly `target`.

## Examples

| `triplets` | `target` | Output |
| --- | --- | --- |
| `[[2,5,3],[1,8,4],[1,7,5]]` | `[2,7,5]` | `True` |
| `[[3,4,5],[4,5,6]]` | `[3,5,6]` | `False` |
| `[[2,5,3],[2,3,4],[1,2,5],[5,2,3]]` | `[5,5,5]` | `True` |
| `[[1,1,1]]` | `[2,1,1]` | `False` |

## Intuition

Because merging takes a maximum, values only ever **grow** and can never be
reduced. That hands us a clean filter:

- A triplet with **any** coordinate greater than the target can never participate
  — folding it in would overshoot that coordinate permanently.
- A triplet with every coordinate `<= target` is always safe to include; it can
  only help us climb toward the target.

So the question reduces to: among the "safe" triplets, does the element-wise
maximum reach every coordinate of `target` exactly?

## Approach

1. `best = [0, 0, 0]`.
2. For each triplet, skip it if any coordinate exceeds `target`.
3. Otherwise fold it in: `best = element-wise max(best, triplet)`.
4. Return `best == target`.

## Why the greedy choice is safe

Two facts make ignoring/skipping decisions optimal:

- **Overshooting is irreversible.** The maximum is monotone and can never shrink,
  so once a coordinate exceeds `target[k]`, no future merge can undo it. Excluding
  any such triplet is therefore mandatory, not merely convenient.
- **Including every safe triplet dominates.** For safe triplets, merging is
  commutative and idempotent (`max` is associative/commutative), and including
  more triplets can only raise coordinates. Hence the maximum over *all* safe
  triplets is the highest reachable coordinate vector; if that doesn't equal
  `target`, no subset could have.

Therefore the greedy "keep all safe triplets, take their max" both never
overshoots and never misses reachable target coordinates.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Single scan (this) | `O(n)` | `O(1)` |
| Trying all merge orders | exponential | `O(n)` |

## Edge cases

- **A triplet already equals `target`** — trivially `True`.
- **Target coordinate above every safe triplet** — `False`.
- **A triplet overshoots one coordinate** — it is discarded entirely (even if its
  other coordinates would help).
- **Coordinates that can only be supplied by different triplets** — merging them
  all still works because `max` is order-independent.

## Solution (`solution.py`)

```python
from typing import List


def merge_triplets(triplets: List[List[int]], target: List[int]) -> bool:
    best = [0, 0, 0]
    for triplet in triplets:
        if any(triplet[i] > target[i] for i in range(3)):
            continue
        best = [max(best[i], triplet[i]) for i in range(3)]
    return best == target
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py merge_triplets_to_form_target_triplet

# same tests through pytest
pytest topics/15_greedy/merge_triplets_to_form_target_triplet -v

# your own case
python3 run.py merge_triplets_to_form_target_triplet -c '[[[2,5,3],[1,8,4],[1,7,5]], [2,7,5]]'
```
