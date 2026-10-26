"""Merge Triplets to Form Target Triplet — Greedy.

Merging two triplets keeps the element-wise maximum. Return whether repeated
merges of ``triplets`` can produce ``target``.

Example
-------
    Input : triplets = [[2, 5, 3], [1, 8, 4], [1, 7, 5]], target = [2, 7, 5]
    Output: True

Time  O(n)  — one scan over the triplets.
Space O(1)  — three running maxima.
"""
from typing import List


def merge_triplets(triplets: List[List[int]], target: List[int]) -> bool:
    """Return whether element-wise max merges can reach ``target``."""
    best = [0, 0, 0]
    for triplet in triplets:
        # A triplet with any coordinate above target can NEVER be merged in,
        # because the maximum would then overshoot target permanently.
        if any(triplet[i] > target[i] for i in range(3)):
            continue
        # Otherwise it is safe to fold in: it only helps match target.
        best = [max(best[i], triplet[i]) for i in range(3)]
    return best == target


if __name__ == "__main__":
    print(merge_triplets([[2, 5, 3], [1, 8, 4], [1, 7, 5]], [2, 7, 5]))  # True
    print(merge_triplets([[3, 4, 5], [4, 5, 6]], [3, 5, 6]))            # False
