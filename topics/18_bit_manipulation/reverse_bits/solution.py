"""Reverse Bits — Bit Manipulation.

Reverse the bits of a given 32-bit unsigned integer ``n``.

Time  O(1)  — exactly 32 iterations, independent of the input.
Space O(1)  — one accumulator.
"""

MASK32 = 0xFFFFFFFF


def reverse_bits(n: int) -> int:
    """Return ``n`` with its 32 bits reversed (MSB <-> LSB)."""
    n &= MASK32                  # treat the input as a 32-bit unsigned value
    result = 0
    for _ in range(32):
        result = (result << 1) | (n & 1)   # push the low bit of n onto result
        n >>= 1                            # and shift n down
    return result


if __name__ == "__main__":
    print(reverse_bits(43261596))   # 964176192
    print(reverse_bits(1))          # 2147483648
    print(reverse_bits(0))          # 0
