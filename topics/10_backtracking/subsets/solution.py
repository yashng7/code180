"""Subsets — Backtracking.

Return every subset (the power set) of a list of distinct integers.

Time  O(n * 2^n)  — 2^n subsets, each copied in O(n)
Space O(n)        — recursion depth plus the current path
"""
from typing import List


def subsets(nums: List[int]) -> List[List[int]]:
    result: List[List[int]] = []
    path: List[int] = []

    def backtrack(start: int) -> None:
        result.append(path[:])              # every node of the tree is a subset
        for index in range(start, len(nums)):
            path.append(nums[index])        # choose
            backtrack(index + 1)            # recurse
            path.pop()                      # un-choose

    backtrack(0)
    return result


if __name__ == "__main__":
    print(subsets([1, 2, 3]))
