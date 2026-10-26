"""Number of 1 Bits — Bit Manipulation.

Return the number of set bits (Hamming weight) in the binary representation of
the non-negative integer ``n``.

Time  O(k)  — k = number of set bits (each iteration clears one).
Space O(1)  — one accumulator.
"""


def hamming_weight(n: int) -> int:
    """Return the number of 1 bits in ``n`` using ``n & (n - 1)``."""
    count = 0
    while n:
        n &= n - 1               # clear the lowest set bit
        count += 1
    return count


if __name__ == "__main__":
    print(hamming_weight(11))          # 3
    print(hamming_weight(128))         # 1
    print(hamming_weight(2147483645))  # 30
