"""Jump Game II — Greedy.

Return the minimum number of jumps needed to reach the last index. Reaching
the last index is always possible.

Example
-------
    Input : nums = [2, 3, 1, 1, 4]
    Output: 2          # 0 -> 1 -> 4

Time  O(n)  — one pass using an implicit BFS over jump layers.
Space O(1)  — a few boundary integers.
"""
from typing import List


def jump(nums: List[int]) -> int:
    """Return the minimum number of jumps (level-by-level greedy frontier)."""
    jumps = 0
    current_end = 0     # right edge of the current jump layer
    farthest = 0        # farthest index reachable within one more jump
    for index in range(len(nums) - 1):          # last index needs no jump
        farthest = max(farthest, index + nums[index])
        if index == current_end:                # exhausted this layer
            jumps += 1
            current_end = farthest              # commit to the best layer
            if current_end >= len(nums) - 1:
                break
    return jumps


if __name__ == "__main__":
    print(jump([2, 3, 1, 1, 4]))  # 2
    print(jump([2, 3, 0, 1, 4]))  # 2
    print(jump([0]))              # 0
