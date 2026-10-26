"""Subsets II — Backtracking.

Return all subsets of ``nums`` (which may contain duplicates) without repeating
any subset.

Time  O(n * 2^n)  — at most 2^n subsets, each copied in O(n)
Space O(n)        — recursion depth plus the current path
"""
from typing import List


def subsets_with_dup(nums: List[int]) -> List[List[int]]:
    nums.sort()                             # equal values become adjacent
    result: List[List[int]] = []
    path: List[int] = []

    def backtrack(start: int) -> None:
        result.append(path[:])              # every node is a subset
        for index in range(start, len(nums)):
            if index > start and nums[index] == nums[index - 1]:
                continue                    # skip duplicate siblings
            path.append(nums[index])        # choose
            backtrack(index + 1)            # recurse
            path.pop()                      # un-choose

    backtrack(0)
    return result


if __name__ == "__main__":
    print(subsets_with_dup([1, 2, 2]))   # [[], [1], [1, 2], [1, 2, 2], [2], [2, 2]]
