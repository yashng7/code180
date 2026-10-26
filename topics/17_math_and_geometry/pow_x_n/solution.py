"""Pow(x, n) — Math & Geometry.

Compute ``x`` raised to the integer power ``n`` using binary (fast)
exponentiation: square the base while halving the exponent, multiplying the
running result whenever the current exponent is odd.

A negative exponent is handled by inverting the base first.

Time  O(log |n|) · Space O(1)
"""


def my_pow(x: float, n: int) -> float:
    if n < 0:
        x = 1 / x
        n = -n

    result = 1.0
    while n:
        if n & 1:            # exponent is odd: fold one factor of x in
            result *= x
        x *= x               # x -> x^2
        n >>= 1              # n -> n // 2
    return result


if __name__ == "__main__":
    print(my_pow(2.0, 10))   # 1024.0
    print(my_pow(2.1, 3))    # 9.261
    print(my_pow(2.0, -2))   # 0.25
