"""Find the Duplicate Number — Linked List.

The array holds n + 1 integers, each in [1, n], with exactly one repeated
value. Find it without modifying the array and using O(1) extra space.

Time O(n) · Space O(1)
"""
from typing import List


def find_duplicate(nums: List[int]) -> int:
    """Treat values as next-pointers and use Floyd's cycle detection."""
    slow = fast = 0
    # Phase 1: find an intersection point inside the cycle.
    while True:
        slow = nums[slow]
        fast = nums[nums[fast]]
        if slow == fast:
            break
    # Phase 2: locate the entrance to the cycle = the duplicate value.
    slow = 0
    while slow != fast:
        slow = nums[slow]
        fast = nums[fast]
    return slow


if __name__ == "__main__":
    print(find_duplicate([1, 3, 4, 2, 2]))  # 2
    print(find_duplicate([3, 1, 3, 4, 2]))  # 3
