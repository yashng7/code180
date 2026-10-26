"""Multiply Strings — Math & Geometry.

Multiply two non-negative integers given as strings and return the product as
a string. Neither input may be converted to a big integer (or multiplied as
one) — only per-digit arithmetic is allowed.

Grade-school long multiplication: the digit at ``num1[i]`` times the digit at
``num2[j]`` affects positions ``i + j`` (carry) and ``i + j + 1`` (units) of an
``m + n`` wide accumulator.

Time  O(m * n) · Space O(m + n)
"""


def multiply(num1: str, num2: str) -> str:
    if num1 == "0" or num2 == "0":
        return "0"

    m, n = len(num1), len(num2)
    result = [0] * (m + n)

    for i in range(m - 1, -1, -1):
        d1 = ord(num1[i]) - ord("0")
        for j in range(n - 1, -1, -1):
            d2 = ord(num2[j]) - ord("0")
            total = d1 * d2 + result[i + j + 1]
            result[i + j + 1] = total % 10     # units digit
            result[i + j] += total // 10       # carry

    # Drop leading zeros (e.g. "9" * "9" occupies positions 2 and 3 of a
    # 2-digit product).
    start = 0
    while start < len(result) - 1 and result[start] == 0:
        start += 1
    return "".join(str(digit) for digit in result[start:])


if __name__ == "__main__":
    print(multiply("2", "3"))              # "6"
    print(multiply("123", "456"))          # "56088"
    print(multiply("0", "0"))              # "0"
