# Permutations

**Topic:** Backtracking · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/permutations/) · [NeetCode](https://neetcode.io/problems/permutations)

## Problem

Given an array `nums` of **distinct** integers, return all possible
permutations, in any order.

## Examples

| `nums` | Output |
| --- | --- |
| `[1,2,3]` | `[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]` |
| `[0,1]` | `[[0,1],[1,0]]` |
| `[1]` | `[[1]]` |

## Intuition

A permutation places one element in each position. This is the backtracking
template **choose → recurse → un-choose**, but at every level we may pick *any*
element that has not been used yet — not just elements to the right of the
previous pick (that would give subsets, not permutations).

So alongside the `path` we keep a `used` boolean array, and a permutation is
complete once `len(path) == len(nums)`.

## Approach

1. `used[i]` records whether `nums[i]` is already in the current `path`.
2. `backtrack()`:
   - if the path is full, record a copy and return;
   - otherwise try every index `i`:
     - skip it if `used[i]`;
     - mark `used[i]`, append `nums[i]` (choose);
     - recurse (recurse);
     - pop and clear `used[i]` (un-choose).
3. Every element is chosen exactly once, so each leaf is a distinct ordering.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Backtracking | `O(n! · n)` | `O(n)` |

There are `n!` permutations; copying each is `O(n)`. The recursion stack, the
`path` and the `used` array all take `O(n)`.

## Edge cases

- **Singleton** → `[[1]]`.
- **Larger sets** (`[1,2,3,4]`) → `4! = 24` orderings; the `used` array keeps
  every ordering and repeats none.
- Values are **distinct** per the constraints. A duplicate-valued variant
  (`[1,1]` should still yield `[[1,1]]`) needs extra de-duplication logic and is
  a separate problem (Permutations II).
- **Order of the permutations is free** but the order *inside* each permutation
  matters, so the harness compares with `unordered` (only the top-level list is
  order-insensitive) — not `unordered_inner`.

## Solution (`solution.py`)

```python
def permute(nums):
    result, path = [], []
    used = [False] * len(nums)

    def backtrack():
        if len(path) == len(nums):
            result.append(path[:])
            return
        for i in range(len(nums)):
            if used[i]:
                continue
            used[i] = True              # choose
            path.append(nums[i])
            backtrack()                 # recurse
            path.pop()                  # un-choose
            used[i] = False

    backtrack()
    return result
```

## How to run the tests

```bash
python3 run.py permutations
pytest topics/10_backtracking/permutations -v
python3 run.py permutations -c '[[1,2,3]]'
```
