"""Car Fleet — Sorting + Monotonic Stack.

``n`` cars travel toward a target. Car ``i`` starts at ``position[i]`` moving at
``speed[i]``. A car never passes another, but if it catches up to a slower fleet
just ahead it joins it. Return the number of fleets that reach the target.

Example
-------
    Input : target = 12, position = [10, 8, 0, 5, 3], speed = [2, 4, 1, 1, 3]
    Output: 3

Time  O(n log n)  — dominated by sorting the cars by position.
Space O(n)        — the sorted (position, speed) pairs.
"""
from typing import List


def car_fleet(target: int, position: List[int], speed: List[int]) -> int:
    """Return the number of fleets that will arrive at ``target``."""
    # Nearest-to-target car first; its arrival time is what later cars may catch.
    cars = sorted(zip(position, speed), reverse=True)
    fleets = 0
    fleet_time = 0.0                 # arrival time of the fleet just ahead
    for pos, spd in cars:
        time = (target - pos) / spd
        if time > fleet_time:        # too slow to catch the fleet ahead
            fleets += 1
            fleet_time = time        # this car becomes the new leading fleet
    return fleets


# NeetCode-style class wrapper. The loader prefers the top-level function.
class Solution:
    def carFleet(self, target: int, position: List[int], speed: List[int]) -> int:
        return car_fleet(target, position, speed)


if __name__ == "__main__":
    print(car_fleet(12, [10, 8, 0, 5, 3], [2, 4, 1, 1, 3]))  # 3
    print(car_fleet(10, [3], [3]))                            # 1
    print(car_fleet(100, [0, 2, 4], [4, 2, 1]))               # 1
