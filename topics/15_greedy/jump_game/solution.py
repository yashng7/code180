"""Jump Game — Greedy.

Given ``nums`` where ``nums[i]`` is the maximum jump length from index ``i``,
return whether the last index is reachable from index ``0``.

Example
-------
    Input : nums = [2, 3, 1, 1, 4]
    Output: True       # 0 -> 1 -> 4

Time  O(n)  — one left-to-right pass tracking the farthest reach.
Space O(1)  — a single frontier integer.
"""
from typing import List


def can_jump(nums: List[int]) -> bool:
    """Return whether the last index is reachable (farthest-reach greedy)."""
    reach = 0                       # farthest index reachable so far
    last = len(nums) - 1
    for index, step in enumerate(nums):
        if index > reach:           # a gap: this index can never be entered
            return False
        reach = max(reach, index + step)
        if reach >= last:           # we can already touch the end
            return True
    return True


if __name__ == "__main__":
    print(can_jump([2, 3, 1, 1, 4]))  # True
    print(can_jump([3, 2, 1, 0, 4]))  # False
    print(can_jump([0]))              # True
