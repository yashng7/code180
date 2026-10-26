"""Single Number — Bit Manipulation.

Every element in ``nums`` appears exactly twice except for one element, which
appears only once. Return that unique element.

Time  O(n)  — one pass over the array.
Space O(1)  — a single accumulator.
"""
from typing import List


def single_number(nums: List[int]) -> int:
    """Return the element that appears only once (XOR of all elements)."""
    result = 0
    for value in nums:
        result ^= value          # pairs cancel: x ^ x == 0
    return result


if __name__ == "__main__":
    print(single_number([2, 2, 1]))          # 1
    print(single_number([4, 1, 2, 1, 2]))    # 4
    print(single_number([1]))                # 1
