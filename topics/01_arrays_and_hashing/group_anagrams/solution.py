"""Group Anagrams — Arrays & Hashing.

Group strings that are anagrams of one another.

Time O(n * k log k)  (k = max string length, from sorting each word)
Space O(n * k)
"""
from collections import defaultdict
from typing import List


def group_anagrams(strs: List[str]) -> List[List[str]]:
    groups: dict[str, List[str]] = defaultdict(list)
    for word in strs:
        key = "".join(sorted(word))     # anagrams share this sorted key
        groups[key].append(word)
    return list(groups.values())


# O(n * k) alternative: use a 26-length count tuple as the key.
#
#     key = [0] * 26
#     for ch in word:
#         key[ord(ch) - ord("a")] += 1
#     groups[tuple(key)].append(word)


if __name__ == "__main__":
    print(group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"]))
