"""Counting Bits — Bit Manipulation.

Given an integer ``n``, return an array ``ans`` of length ``n + 1`` where
``ans[i]`` is the number of set bits in ``i`` (for ``0 <= i <= n``).

Time  O(n)  — one constant-work step per index.
Space O(n)  — the answer array.
"""
from typing import List


def count_bits(n: int) -> List[int]:
    """Count set bits for every value in ``[0, n]`` via DP on the low bit."""
    ans = [0] * (n + 1)
    for i in range(1, n + 1):
        # dropping the lowest bit halves the value; add back the dropped bit
        ans[i] = ans[i >> 1] + (i & 1)
    return ans


if __name__ == "__main__":
    print(count_bits(2))   # [0, 1, 1]
    print(count_bits(5))   # [0, 1, 1, 2, 1, 2]
    print(count_bits(0))   # [0]
