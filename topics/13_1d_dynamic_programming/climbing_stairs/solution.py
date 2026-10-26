"""Climbing Stairs — 1-D Dynamic Programming.

You are climbing a staircase with ``n`` steps. Each time you can climb either
1 or 2 steps. Return the number of distinct ways to reach the top.

This is the Fibonacci recurrence: ``dp[i] = dp[i-1] + dp[i-2]``.

Time  O(n)  — one pass over the steps.
Space O(1)  — only the last two states are kept.
"""


def climb_stairs(n: int) -> int:
    """Return the number of distinct ways to climb ``n`` steps (Fibonacci)."""
    if n <= 2:
        return n
    # prev2 = dp[i-2], prev1 = dp[i-1]; rolling variables keep space O(1).
    prev2, prev1 = 1, 2
    for _ in range(3, n + 1):
        prev2, prev1 = prev1, prev2 + prev1
    return prev1


# NeetCode-style class wrapper. Both forms work with the runner; the loader
# prefers the top-level function above.
class Solution:
    def climbStairs(self, n: int) -> int:
        return climb_stairs(n)


if __name__ == "__main__":
    print(climb_stairs(2))    # 2
    print(climb_stairs(3))    # 3
    print(climb_stairs(10))   # 89
