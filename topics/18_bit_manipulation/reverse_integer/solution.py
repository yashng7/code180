"""Reverse Integer — Bit Manipulation.

Given a signed 32-bit integer ``x``, return ``x`` with its digits reversed.
If reversing the digits causes the value to fall outside the signed 32-bit
range ``[-2^31, 2^31 - 1]``, return ``0`` instead.

Time  O(log10 |x|)  — one digit per iteration.
Space O(1)         — a single accumulator.
"""

INT_MIN = -2147483648
INT_MAX = 2147483647


def reverse(x: int) -> int:
    """Reverse the decimal digits of ``x``; return ``0`` on 32-bit overflow."""
    sign = -1 if x < 0 else 1
    x = abs(x)
    result = 0
    while x:
        result = result * 10 + x % 10    # append the last digit
        x //= 10                         # drop it from the input
    result *= sign
    if result < INT_MIN or result > INT_MAX:
        return 0
    return result


if __name__ == "__main__":
    print(reverse(123))          # 321
    print(reverse(-123))         # -321
    print(reverse(1534236469))   # 0 (overflow)
