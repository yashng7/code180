"""Sum of Two Integers — Bit Manipulation.

Compute the sum of two integers ``a`` and ``b`` **without** using the ``+`` or
``-`` operators.

Time  O(1)  — at most 32 carry rounds for 32-bit inputs.
Space O(1)  — a couple of registers.
"""

MASK = 0xFFFFFFFF            # 32-bit two's complement width
SIGN = 0x80000000            # the sign bit


def get_sum(a: int, b: int) -> int:
    """Add ``a`` and ``b`` with bitwise XOR (sum) and AND/shift (carry)."""
    a &= MASK                # work inside a fixed 32-bit two's complement window
    b &= MASK
    while b:
        carry = ((a & b) << 1) & MASK   # bits that overflow each column
        a = (a ^ b) & MASK              # sum without carry
        b = carry                       # carry in, repeat
    # convert the 32-bit pattern back to a signed Python integer
    return a if a < SIGN else ~(a ^ MASK)


if __name__ == "__main__":
    print(get_sum(1, 2))     # 3
    print(get_sum(2, 3))     # 5
    print(get_sum(-1, 1))    # 0
