"""Missing Number — Bit Manipulation.

Given an array ``nums`` containing ``n`` distinct numbers in the range
``[0, n]``, return the only number in that range that is missing.

Time  O(n)  — one pass, constant work per element.
Space O(1)  — a single accumulator.
"""
from typing import List


def missing_number(nums: List[int]) -> int:
    """Return the missing value using XOR (indices and values cancel)."""
    result = len(nums)               # include the top of the range, n
    for index, value in enumerate(nums):
        result ^= index ^ value      # pairs cancel: x ^ x == 0
    return result


if __name__ == "__main__":
    print(missing_number([3, 0, 1]))                  # 2
    print(missing_number([0, 1]))                     # 2
    print(missing_number([9, 6, 4, 2, 3, 5, 7, 0, 1]))  # 8
