# Combination Sum II

**Topic:** Backtracking · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/combination-sum-ii/) · [NeetCode](https://neetcode.io/problems/combination-target-sum-ii)

## Problem

Given a collection of numbers `candidates` (which may contain duplicates) and a
`target`, return all **unique** combinations that sum to `target`. Each number
may be used **at most once**. Order of the combinations is free.

## Examples

| `candidates` | `target` | Output |
| --- | --- | --- |
| `[10,1,2,7,6,1,5]` | `8` | `[[1,1,6],[1,2,5],[1,7],[2,6]]` |
| `[2,5,2,1,2]` | `5` | `[[1,2,2],[5]]` |
| `[2]` | `1` | `[]` |

## Intuition

This is the same shape as *Combination Sum*, with two twists:

1. each candidate may be used only once → recurse with `index + 1`;
2. `candidates` contains duplicates, so we must not emit the same combination
   twice.

Both are handled by **sort + skip duplicates at the same level**, using the same
choose → recurse → un-choose template:

> if `index > start` and `candidates[index] == candidates[index - 1]`, `continue`.

The guard `index > start` is the key: it skips a value only when it is offered as
a *sibling* choice at this level. When the same value is already deeper in the
branch (a genuine reuse of a second copy), it is still allowed — that is what
produces `[1,1,6]`.

## Approach

1. Sort `candidates`.
2. `backtrack(start, remaining)`:
   - if `remaining == 0`, record a copy of `path`;
   - loop `index` from `start`:
     - skip duplicate siblings (`index > start` and equal to previous);
     - `break` if `candidates[index] > remaining`;
     - append (choose), recurse with `index + 1` (recurse), pop (un-choose).

## Complexity

Let `n = len(candidates)`.

| | Time | Space |
| --- | --- | --- |
| Backtracking | `O(2^n)` | `O(n)` |

Each candidate is either taken or not, so the recursion tree has at most `2^n`
leaves; sorting adds `O(n log n)`, deduplication prunes the repeated branches.

## Edge cases

- **No combination** → `[]`.
- **Duplicate candidates** → de-duplicated by the sort + skip trick.
- **Repeated target count** (`[1,1,1], 2` → `[1,1]`): two *different* copies are
  used, which is legal.
- Compared with `unordered_inner` (free at both levels).

## Solution (`solution.py`)

```python
def combination_sum2(candidates, target):
    candidates.sort()
    result, path = [], []

    def backtrack(start, remaining):
        if remaining == 0:
            result.append(path[:])
            return
        for index in range(start, len(candidates)):
            if index > start and candidates[index] == candidates[index - 1]:
                continue                        # skip duplicate siblings
            value = candidates[index]
            if value > remaining:
                break
            path.append(value)                  # choose
            backtrack(index + 1, remaining - value)  # recurse, no reuse
            path.pop()                          # un-choose

    backtrack(0, target)
    return result
```

## How to run the tests

```bash
python3 run.py combination_sum_ii
pytest topics/10_backtracking/combination_sum_ii -v
python3 run.py combination_sum_ii -c '[[10,1,2,7,6,1,5], 8]'
```
