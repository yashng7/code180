"""Encode and Decode Strings — Arrays & Hashing.

Design an algorithm to serialize a list of strings into a single string and
deserialize it back. The tricky part is that strings may contain *any*
characters, including whatever delimiter you pick.

This uses a length-prefixed format: ``<len>#<data>`` for each string. Because we
read the length first, the payload may safely contain ``#`` or any other byte.

The harness entry point ``encode_and_decode`` returns ``decode(encode(strs))``
so the built-in tests check a full round trip.
"""
from typing import List


def encode(strs: List[str]) -> str:
    return "".join(f"{len(s)}#{s}" for s in strs)


def decode(data: str) -> List[str]:
    result: List[str] = []
    i = 0
    while i < len(data):
        j = data.index("#", i)          # first '#' after the length digits
        length = int(data[i:j])
        result.append(data[j + 1: j + 1 + length])
        i = j + 1 + length
    return result


def encode_and_decode(strs: List[str]) -> List[str]:
    """Round-trip helper used as the harness entry point."""
    return decode(encode(strs))


if __name__ == "__main__":
    print(encode(["hello", "wor#ld"]))          # 5#hello6#wor#ld
    print(decode("5#hello6#wor#ld"))            # ['hello', 'wor#ld']
