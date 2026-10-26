"""Permutations — Backtracking.

Return all permutations of a list of distinct integers.

Time  O(n! * n)  — n! permutations, each copied in O(n)
Space O(n)       — recursion depth, ``used`` flags and current path
"""
from typing import List


def permute(nums: List[int]) -> List[List[int]]:
    result: List[List[int]] = []
    path: List[int] = []
    used = [False] * len(nums)

    def backtrack() -> None:
        if len(path) == len(nums):
            result.append(path[:])          # a full permutation
            return
        for index in range(len(nums)):
            if used[index]:
                continue
            used[index] = True              # choose
            path.append(nums[index])
            backtrack()                     # recurse
            path.pop()                      # un-choose
            used[index] = False

    backtrack()
    return result


if __name__ == "__main__":
    print(permute([1, 2, 3]))
