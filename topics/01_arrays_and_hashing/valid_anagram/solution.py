"""Valid Anagram — Arrays & Hashing.

Return ``True`` if ``t`` is an anagram of ``s`` (same letters, same counts).

Time O(n) · Space O(1) for a fixed alphabet (O(k) in general).
"""
from collections import Counter


def is_anagram(s: str, t: str) -> bool:
    if len(s) != len(t):
        return False
    return Counter(s) == Counter(t)


# Manual variant without collections:
#
#     count: dict[str, int] = {}
#     for ch in s:
#         count[ch] = count.get(ch, 0) + 1
#     for ch in t:
#         if count.get(ch, 0) == 0:
#             return False
#         count[ch] -= 1
#     return True


if __name__ == "__main__":
    print(is_anagram("anagram", "nagaram"))  # True
    print(is_anagram("rat", "car"))          # False
