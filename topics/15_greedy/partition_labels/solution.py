"""Partition Labels — Greedy.

Partition ``s`` into as many parts as possible so each letter appears in at
most one part; return the sizes of the parts in order.

Example
-------
    Input : s = "ababcbacadefegdehijhklij"
    Output: [9, 7, 8]

Time  O(n)  — two passes over the string.
Space O(1)  — at most 26 last-occurrence entries.
"""
from typing import List


def partition_labels(s: str) -> List[int]:
    """Return the greedy partition sizes (extend to each letter's last index)."""
    last = {char: index for index, char in enumerate(s)}
    sizes: List[int] = []
    start = 0
    end = 0
    for index, char in enumerate(s):
        # The current part must reach at least the last occurrence of ``char``.
        end = max(end, last[char])
        if index == end:
            # No letter seen so far appears again after ``end``, so cutting
            # here is both valid and maximal — and therefore greedy-safe.
            sizes.append(end - start + 1)
            start = index + 1
    return sizes


if __name__ == "__main__":
    print(partition_labels("ababcbacadefegdehijhklij"))  # [9, 7, 8]
    print(partition_labels("eccbbbbdec"))                # [10]
