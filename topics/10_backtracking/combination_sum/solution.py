"""Combination Sum — Backtracking.

Return all unique combinations of ``candidates`` (each reused without limit)
that sum to ``target``.

Time  O(n^(target / min(candidates)))  worst case
Space O(target / min(candidates))      recursion depth
"""
from typing import List


def combination_sum(candidates: List[int], target: int) -> List[List[int]]:
    candidates.sort()                       # enables the pruning break below
    result: List[List[int]] = []
    path: List[int] = []

    def backtrack(start: int, remaining: int) -> None:
        if remaining == 0:
            result.append(path[:])          # exact hit
            return
        for index in range(start, len(candidates)):
            value = candidates[index]
            if value > remaining:           # sorted -> nothing later fits
                break
            path.append(value)              # choose
            backtrack(index, remaining - value)   # recurse, reuse allowed
            path.pop()                      # un-choose

    backtrack(0, target)
    return result


if __name__ == "__main__":
    print(combination_sum([2, 3, 6, 7], 7))   # [[2, 2, 3], [7]]
