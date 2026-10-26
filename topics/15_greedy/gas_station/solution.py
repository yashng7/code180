"""Gas Station — Greedy.

Return the starting station index from which a full clockwise tour is possible
given ``gas[i]`` fuel and ``cost[i]`` to reach the next station, or ``-1``. The
answer is guaranteed unique when it exists.

Example
-------
    Input : gas = [1, 2, 3, 4, 5], cost = [3, 4, 5, 1, 2]
    Output: 3

Time  O(n)  — one pass.
Space O(1)  — running tank plus totals.
"""
from typing import List


def can_complete_circuit(gas: List[int], cost: List[int]) -> int:
    """Return a valid start index, or -1 (one-pass greedy reset)."""
    total = 0       # net fuel over the whole circuit
    tank = 0        # net fuel since the current candidate start
    start = 0
    for index in range(len(gas)):
        net = gas[index] - cost[index]
        total += net
        tank += net
        if tank < 0:
            # No station up to and including ``index`` can be the start;
            # the next index is the earliest possible candidate.
            start = index + 1
            tank = 0
    return start if total >= 0 else -1


if __name__ == "__main__":
    print(can_complete_circuit([1, 2, 3, 4, 5], [3, 4, 5, 1, 2]))  # 3
    print(can_complete_circuit([2, 3, 4], [3, 4, 3]))              # -1
