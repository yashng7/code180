"""Sliding Window Maximum — Sliding Window.

Given an array ``nums`` and a window size ``k``, return the maximum of every
contiguous window of size ``k`` as the window slides left to right.

Example
-------
    Input : nums = [1, 3, -1, -3, 5, 3, 6, 7], k = 3
    Output: [3, 3, 5, 5, 6, 7]

Time  O(n)  — each index is pushed to and popped from the deque at most once.
Space O(k)  — the deque holds at most ``k`` indices.
"""
from collections import deque
from typing import List


def max_sliding_window(nums: List[int], k: int) -> List[int]:
    """Maximum of each length-k window using a monotonic (decreasing) deque."""
    dq: deque[int] = deque()   # indices with decreasing values, front is the max
    result: List[int] = []

    for right, value in enumerate(nums):
        # Pop smaller values: they can never be the max while `value` is here.
        while dq and nums[dq[-1]] <= value:
            dq.pop()
        dq.append(right)

        # Pop the front if it has slid out of the window [right-k+1, right].
        if dq[0] <= right - k:
            dq.popleft()

        # The window is full once we have processed k elements.
        if right >= k - 1:
            result.append(nums[dq[0]])

    return result


# NeetCode-style class wrapper. Both forms work with the runner; the loader
# prefers the top-level function above.
class Solution:
    def maxSlidingWindow(self, nums: List[int], k: int) -> List[int]:
        return max_sliding_window(nums, k)


if __name__ == "__main__":
    print(max_sliding_window([1, 3, -1, -3, 5, 3, 6, 7], 3))  # [3,3,5,5,6,7]
    print(max_sliding_window([1], 1))                          # [1]
    print(max_sliding_window([9, 11], 2))                      # [11]
