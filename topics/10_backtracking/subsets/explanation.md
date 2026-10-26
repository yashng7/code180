# Subsets

**Topic:** Backtracking · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/subsets/) · [NeetCode](https://neetcode.io/problems/subsets)

## Problem

Given an array `nums` of **distinct** integers, return all possible subsets (the
power set). The answer must not contain duplicate subsets, and may be in any
order.

## Examples

| `nums` | Output |
| --- | --- |
| `[1,2,3]` | `[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]` |
| `[0]` | `[[],[0]]` |
| `[]` | `[[]]` |

## Intuition

Every subset corresponds to an independent **include / exclude** decision for
each element — a binary decision tree with `2^n` nodes-as-subset-states. Instead
of enumerating bitmasks we walk that tree depth-first and record the current
decision path at every node.

The template that powers essentially every backtracking problem is:

**choose → recurse → un-choose**

- *choose*: add an element to the current `path`;
- *recurse*: explore everything reachable after that choice;
- *un-choose*: remove the element so the next sibling starts from a clean state.

## Approach

1. Keep `result` and a mutable `path` (the current partial subset).
2. `backtrack(start)` first records a **copy** of `path`: every node of the tree
   is itself a valid subset, including the empty one.
3. For each `index` from `start` to `n-1`:
   - append `nums[index]` (choose),
   - recurse with `index + 1` so each element is used at most once (recurse),
   - pop it back off (un-choose).
4. Passing `start = index + 1` keeps choices increasing, so `[1,2]` is produced
   once rather than also as `[2,1]`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Backtracking | `O(n · 2^n)` | `O(n)` |
| Bitmask enumeration | `O(n · 2^n)` | `O(n)` |

There are `2^n` subsets and copying each into the answer costs `O(n)`; the
recursion stack and `path` hold at most `n` values at a time.

## Edge cases

- **Empty input** → the only subset is the empty one: `[[]]`.
- **Singleton** → `[[], [value]]`.
- Values are guaranteed **distinct**, so no de-duplication is needed (contrast
  with *Subsets II*).
- The order of the subsets does not matter, so the harness compares with
  `unordered_inner` (free at every nesting level).

## Solution (`solution.py`)

```python
def subsets(nums):
    result, path = [], []

    def backtrack(start):
        result.append(path[:])          # record the current subset
        for index in range(start, len(nums)):
            path.append(nums[index])    # choose
            backtrack(index + 1)        # recurse
            path.pop()                  # un-choose

    backtrack(0)
    return result
```

## How to run the tests

```bash
# built-in test cases (6 of them)
python3 run.py subsets

# same tests through pytest
pytest topics/10_backtracking/subsets -v

# your own case
python3 run.py subsets -c '[[1,2,3]]'
```
