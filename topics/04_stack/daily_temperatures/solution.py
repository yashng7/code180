"""Daily Temperatures — Monotonic Stack.

For each day, return how many days you have to wait until a warmer temperature.
If no future day is warmer, return ``0`` for that day.

Example
-------
    Input : temperatures = [73, 74, 75, 71, 69, 72, 76, 73]
    Output: [1, 1, 4, 2, 1, 1, 0, 0]

Time  O(n)  — each index is pushed and popped at most once.
Space O(n)  — a strictly decreasing input leaves every index on the stack.
"""
from typing import List


def daily_temperatures(temperatures: List[int]) -> List[int]:
    """Number of days until a warmer temperature, per day (0 if never)."""
    n = len(temperatures)
    answer = [0] * n
    stack: list[int] = []                 # indices, temps strictly decreasing
    for day, temp in enumerate(temperatures):
        # resolve every earlier day whose temperature is below today's
        while stack and temperatures[stack[-1]] < temp:
            previous = stack.pop()
            answer[previous] = day - previous
        stack.append(day)
    return answer


# NeetCode-style class wrapper. The loader prefers the top-level function.
class Solution:
    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:
        return daily_temperatures(temperatures)


if __name__ == "__main__":
    print(daily_temperatures([73, 74, 75, 71, 69, 72, 76, 73]))
    print(daily_temperatures([30, 40, 50, 60]))
    print(daily_temperatures([30, 60, 90]))
