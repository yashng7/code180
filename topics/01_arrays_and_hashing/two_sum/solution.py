"""Two Sum — Arrays & Hashing.

Given an array of integers ``nums`` and an integer ``target``, return the
indices of the two numbers that add up to ``target``.

Assumptions (from the problem statement):
  * exactly one valid solution exists;
  * the same element may not be used twice;
  * the answer may be returned in any order.

Example
-------
    Input : nums = [2, 7, 11, 15], target = 9
    Output: [0, 1]        # nums[0] + nums[1] == 2 + 7 == 9

Time  O(n)  — one pass, O(1) hash lookups.
Space O(n)  — the ``seen`` hash map holds up to n entries.
"""
from typing import List


def two_sum(nums: List[int], target: int) -> List[int]:
    """Return the two indices summing to ``target`` (single-pass hash map)."""
    # value -> index of an element we have already walked past
    seen: dict[int, int] = {}
    for index, value in enumerate(nums):
        complement = target - value
        if complement in seen:                # found its partner
            return [seen[complement], index]
        seen[value] = index                   # remember for later
    return []                                 # unreachable given the constraints


# NeetCode-style class wrapper. Both forms work with the runner; the loader
# prefers the top-level function above.
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        return two_sum(nums, target)


if __name__ == "__main__":
    print(two_sum([2, 7, 11, 15], 9))   # [0, 1]
    print(two_sum([3, 2, 4], 6))        # [1, 2]
    print(two_sum([3, 3], 6))           # [0, 1]
