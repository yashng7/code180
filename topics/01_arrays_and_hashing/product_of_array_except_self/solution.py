"""Product of Array Except Self — Arrays & Hashing.

Return an array ``out`` where ``out[i]`` is the product of every element of
``nums`` except ``nums[i]``. Must run in O(n) and without using division.

Time O(n) · Space O(1) extra (output array not counted).
"""
from typing import List


def product_except_self(nums: List[int]) -> List[int]:
    n = len(nums)
    result = [1] * n

    # Pass 1: result[i] = product of everything to the LEFT of i.
    prefix = 1
    for i in range(n):
        result[i] = prefix
        prefix *= nums[i]

    # Pass 2: multiply in the product of everything to the RIGHT of i.
    suffix = 1
    for i in range(n - 1, -1, -1):
        result[i] *= suffix
        suffix *= nums[i]

    return result


if __name__ == "__main__":
    print(product_except_self([1, 2, 3, 4]))       # [24, 12, 8, 6]
    print(product_except_self([-1, 1, 0, -3, 3]))  # [0, 0, 9, 0, 0]
