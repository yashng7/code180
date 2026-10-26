# Combination Sum

**Topic:** Backtracking · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/combination-sum/) · [NeetCode](https://neetcode.io/problems/combination-target-sum)

## Problem

Given an array of **distinct** integers `candidates` and a `target`, return every
unique combination of candidates that sums to `target`. The **same number may be
chosen an unlimited number of times**. Order of the combinations is free.

## Examples

| `candidates` | `target` | Output |
| --- | --- | --- |
| `[2,3,6,7]` | `7` | `[[2,2,3],[7]]` |
| `[2,3,5]` | `8` | `[[2,2,2,2],[2,3,3],[3,5]]` |
| `[2]` | `1` | `[]` |

## Intuition

This is a decision tree over "how much do I still owe?". At each step we either
pick a candidate (subtract it from the remaining total) or move on. Because a
candidate can be reused, when we pick candidate `i` we recurse with **the same**
`i`, not `i + 1`.

The universal template is **choose → recurse → un-choose**:

- *choose*: append `candidates[i]` to `path` and subtract it from `remaining`;
- *recurse*: continue from `i` (still allowed to reuse it);
- *un-choose*: pop it back so the next sibling at this level starts clean.

Two base/guard conditions keep the tree finite:

- `remaining == 0` → record the combination;
- `candidates[i] > remaining` → stop, because the list is sorted ascending.

## Approach

1. Sort `candidates` so the `> remaining` check lets us `break` out of the loop.
2. `backtrack(start, remaining)`:
   - if `remaining == 0`, append a copy of `path` and return;
   - for `index` from `start` to the end:
     - `break` once `candidates[index] > remaining`;
     - append the value, then recurse with `(index, remaining - value)`.
3. Recursing with `index` (not `index + 1`) is what permits unlimited reuse, while
   still keeping combinations non-decreasing and therefore duplicate-free.

## Complexity

Let `n = len(candidates)` and `m = min(candidates)`.

| | Time | Space |
| --- | --- | --- |
| Backtracking | `O(n^(target/m))` worst case | `O(target/m)` |

The recursion depth is bounded by `target / m` (each pick removes at least `m`),
and each level branches over at most `n` candidates. Output size dominates in
practice.

## Edge cases

- **No combination** (`[2], 1`) → `[]`.
- **Target equals a single candidate** (`[7], 7`) → `[[7]]`.
- **Repeated values in the output** (`[2,2,3]`) are fine — they come from reusing
  one candidate, not from duplicate candidates.
- Combinations are compared with `unordered_inner`, so `[2,2,3]` and `[3,2,2]`
  are the same answer.

## Solution (`solution.py`)

```python
def combination_sum(candidates, target):
    candidates.sort()
    result, path = [], []

    def backtrack(start, remaining):
        if remaining == 0:
            result.append(path[:])
            return
        for index in range(start, len(candidates)):
            value = candidates[index]
            if value > remaining:
                break
            path.append(value)                  # choose
            backtrack(index, remaining - value)  # recurse (reuse)
            path.pop()                          # un-choose

    backtrack(0, target)
    return result
```

## How to run the tests

```bash
python3 run.py combination_sum
pytest topics/10_backtracking/combination_sum -v
python3 run.py combination_sum -c '[[2,3,6,7], 7]'
```
