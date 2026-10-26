# Palindrome Partitioning

**Topic:** Backtracking · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/palindrome-partitioning/) · [NeetCode](https://neetcode.io/problems/palindrome-partitioning)

## Problem

Given a string `s`, partition it so that **every substring** of the partition is
a **palindrome**. Return all possible palindrome partitions, in any order.

## Examples

| `s` | Output |
| --- | --- |
| `"aab"` | `[["a","a","b"],["aa","b"]]` |
| `"aba"` | `[["a","b","a"],["aba"]]` |
| `"abba"` | `[["a","b","b","a"],["a","bb","a"],["abba"]]` |

## Intuition

A partition is a choice of where to cut. We decide the **first** piece
`s[start:end+1]`: if it is a palindrome we take it, then recursively partition
the remainder `s[end+1:]`. That is exactly choose → recurse → un-choose, with the
palindrome test acting as a *pruning* condition that cuts off whole subtrees.

## Approach

1. `backtrack(start)` cuts the string from position `start`.
2. If `start == len(s)` we have consumed the whole string — record `path[:]`.
3. Otherwise try every `end` from `start` to `len(s) - 1`:
   - skip the branch if `s[start:end+1]` is not a palindrome;
   - otherwise append the piece (choose), recurse on `end + 1` (recurse), pop
     (un-choose).
4. The palindrome check is a simple two-pointer scan of the candidate piece.

## Complexity

Let `n = len(s)`.

| | Time | Space |
| --- | --- | --- |
| Backtracking | `O(n · 2^n)` | `O(n)` |

There are at most `2^(n-1)` ways to cut; each accepted partition costs `O(n)` to
copy. The recursion stack and `path` hold at most `n` pieces.

## Edge cases

- **Single character** → `[["a"]]`.
- **No multi-character palindrome** (`"abc"`) → only the all-singletons split.
- **Whole string is a palindrome** → that one-piece partition is included.
- **Empty string** → the single (empty) partition `[[]]`.
- The order of partitions is free, but the order of pieces **within** a partition
  is meaningful, so the harness compares with `unordered` (not
  `unordered_inner`).

## Solution (`solution.py`)

```python
def partition(s):
    result, path = [], []

    def is_palindrome(left, right):
        while left < right:
            if s[left] != s[right]:
                return False
            left += 1
            right -= 1
        return True

    def backtrack(start):
        if start == len(s):
            result.append(path[:])
            return
        for end in range(start, len(s)):
            if not is_palindrome(start, end):
                continue                    # prune
            path.append(s[start:end + 1])   # choose
            backtrack(end + 1)              # recurse
            path.pop()                      # un-choose

    backtrack(0)
    return result
```

## How to run the tests

```bash
python3 run.py palindrome_partitioning
pytest topics/10_backtracking/palindrome_partitioning -v
python3 run.py palindrome_partitioning -c '["aab"]'
```
