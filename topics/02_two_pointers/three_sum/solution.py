"""3Sum — Two Pointers.

Given an integer array ``nums``, return all unique triplets
``[nums[i], nums[j], nums[k]]`` such that ``i``, ``j``, ``k`` are distinct and
the triplet sums to zero. The solution set must not contain duplicate triplets.

Time  O(n^2)  — sorting is O(n log n); the outer loop plus inner two-pointer
                 scan is O(n^2).
Space O(1)    — ignoring the output (sorting uses O(log n) stack space).
"""
from typing import List


def three_sum(nums: List[int]) -> List[List[int]]:
    """Return all unique zero-sum triplets (sort + fix one + two pointers)."""
    nums.sort()
    result: List[List[int]] = []
    n = len(nums)

    for i in range(n - 2):
        # Skip duplicate anchors so the same triplet is not emitted twice.
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        # Once the anchor is positive, no later triplet can sum to zero.
        if nums[i] > 0:
            break

        left, right = i + 1, n - 1
        while left < right:
            total = nums[i] + nums[left] + nums[right]
            if total < 0:
                left += 1                        # too small: increase
            elif total > 0:
                right -= 1                       # too large: decrease
            else:
                result.append([nums[i], nums[left], nums[right]])
                left += 1
                right -= 1
                # Skip duplicate second/third values at this anchor.
                while left < right and nums[left] == nums[left - 1]:
                    left += 1
                while left < right and nums[right] == nums[right + 1]:
                    right -= 1

    return result


# NeetCode-style class wrapper; the loader prefers the top-level function.
class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        return three_sum(nums)


if __name__ == "__main__":
    print(three_sum([-1, 0, 1, 2, -1, -4]))  # [[-1, -1, 2], [-1, 0, 1]]
    print(three_sum([0, 1, 1]))              # []
    print(three_sum([0, 0, 0]))              # [[0, 0, 0]]
