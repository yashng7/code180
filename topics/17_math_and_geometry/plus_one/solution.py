"""Plus One — Math & Geometry.

Increment the non-negative integer represented by the digit list ``digits``
(most significant digit first) by one and return the resulting digit list.

Walk from the least significant digit: any digit below 9 just increments and
propagates no carry. If every digit is 9 the number grows by one digit.

Time  O(n) · Space O(1) extra
"""
from typing import List


def plus_one(digits: List[int]) -> List[int]:
    for i in range(len(digits) - 1, -1, -1):
        if digits[i] < 9:
            digits[i] += 1
            return digits
        digits[i] = 0            # 9 becomes 0 and carries left
    return [1] + digits          # all nines: e.g. [9,9] -> [1,0,0]


if __name__ == "__main__":
    print(plus_one([1, 2, 3]))   # [1, 2, 4]
    print(plus_one([9]))         # [1, 0]
