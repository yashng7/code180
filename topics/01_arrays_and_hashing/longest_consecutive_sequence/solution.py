"""Longest Consecutive Sequence — Arrays & Hashing.

Return the length of the longest run of consecutive integers in ``nums``.
Must run in O(n) time.

Time O(n) · Space O(n)
"""
from typing import List


def longest_consecutive(nums: List[int]) -> int:
    num_set = set(nums)
    best = 0

    for value in num_set:
        # Only start counting from the first element of a run.
        if value - 1 in num_set:
            continue

        length = 1
        while value + length in num_set:
            length += 1
        best = max(best, length)

    return best


if __name__ == "__main__":
    print(longest_consecutive([100, 4, 200, 1, 3, 2]))  # 4
    print(longest_consecutive([0, 3, 7, 2, 5, 8, 4, 6, 0, 1]))  # 9
