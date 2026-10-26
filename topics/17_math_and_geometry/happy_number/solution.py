"""Happy Number — Math & Geometry.

A number is *happy* if repeatedly replacing it by the sum of the squares of
its digits eventually reaches 1. Unhappy numbers fall into a cycle that never
contains 1.

Use Floyd's fast/slow pointers to detect the cycle without a visited set.

Time  O(log n) · Space O(1)
"""


def is_happy(n: int) -> bool:
    def square_sum(x: int) -> int:
        total = 0
        while x:
            x, digit = divmod(x, 10)
            total += digit * digit
        return total

    slow = n
    fast = square_sum(n)
    # Walk one step and two steps at a time until they meet or fast reaches 1.
    while fast != 1 and slow != fast:
        slow = square_sum(slow)
        fast = square_sum(square_sum(fast))
    return fast == 1


if __name__ == "__main__":
    print(is_happy(19))   # True
    print(is_happy(2))    # False
