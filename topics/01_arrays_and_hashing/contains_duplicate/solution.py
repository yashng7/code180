"""Contains Duplicate — Arrays & Hashing.

Return ``True`` if any value appears at least twice in ``nums``.

Time  O(n) · Space O(n)
"""
from typing import List


def contains_duplicate(nums: List[int]) -> bool:
    seen: set[int] = set()
    for value in nums:
        if value in seen:
            return True
        seen.add(value)
    return False


# One-liner alternative: return len(nums) != len(set(nums))


if __name__ == "__main__":
    print(contains_duplicate([1, 2, 3, 1]))  # True
    print(contains_duplicate([1, 2, 3, 4]))  # False


# just create set add value into set and return true if seen set twice