"""Two Sum II - Input Array Is Sorted — Two Pointers.

Given a 1-indexed array ``numbers`` sorted in non-decreasing order, return the
1-indexed indices ``[i, j]`` of the two numbers that add up to ``target``.
Exactly one solution exists and the same element may not be used twice.

Time  O(n)  — each step moves one pointer inward, at most n steps total.
Space O(1)  — only the two index pointers are stored.
"""
from typing import List


def two_sum(numbers: List[int], target: int) -> List[int]:
    """Return the 1-indexed indices of the pair summing to ``target``."""
    left, right = 0, len(numbers) - 1
    while left < right:
        total = numbers[left] + numbers[right]
        if total == target:
            return [left + 1, right + 1]   # convert to 1-indexed
        if total < target:
            left += 1                      # need a larger sum
        else:
            right -= 1                     # need a smaller sum
    return []                              # unreachable given the constraints


# NeetCode-style class wrapper; the loader prefers the top-level function.
class Solution:
    def twoSum(self, numbers: List[int], target: int) -> List[int]:
        return two_sum(numbers, target)


if __name__ == "__main__":
    print(two_sum([2, 7, 11, 15], 9))        # [1, 2]
    print(two_sum([2, 3, 4], 6))             # [1, 3]
    print(two_sum([-1, 0], -1))              # [1, 2]
