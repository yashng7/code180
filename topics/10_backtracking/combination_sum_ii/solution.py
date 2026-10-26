"""Combination Sum II — Backtracking.

Return all unique combinations (each candidate used at most once) that sum to
``target``. Duplicates in ``candidates`` are handled by sorting and skipping
equal values at the same recursion level.

Time  O(2^n)  — each candidate is used or not
Space O(n)    — recursion depth plus the current path
"""
from typing import List


def combination_sum2(candidates: List[int], target: int) -> List[List[int]]:
    candidates.sort()                       # equal values become adjacent
    result: List[List[int]] = []
    path: List[int] = []

    def backtrack(start: int, remaining: int) -> None:
        if remaining == 0:
            result.append(path[:])
            return
        for index in range(start, len(candidates)):
            if index > start and candidates[index] == candidates[index - 1]:
                continue                    # skip duplicate siblings
            value = candidates[index]
            if value > remaining:
                break                       # sorted -> nothing later fits
            path.append(value)              # choose
            backtrack(index + 1, remaining - value)   # recurse, no reuse
            path.pop()                      # un-choose

    backtrack(0, target)
    return result


if __name__ == "__main__":
    print(combination_sum2([10, 1, 2, 7, 6, 1, 5], 8))
