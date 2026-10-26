"""Hand of Straights — Greedy.

Given an integer ``hand`` and ``group_size``, return whether the hand can be
rearranged into groups of ``group_size`` consecutive cards.

Example
-------
    Input : hand = [1, 2, 3, 6, 2, 3, 4, 7, 8], group_size = 3
    Output: True       # [1,2,3], [2,3,4], [6,7,8]

Time  O(n log n)  — sort plus ordered counter.
Space O(n)        — the counter of distinct cards.
"""
from collections import Counter
from typing import List


def is_n_straight_hand(hand: List[int], group_size: int) -> bool:
    """Return whether ``hand`` splits into runs of ``group_size`` consecutive."""
    if len(hand) % group_size:
        return False

    counts = Counter(hand)
    for card in sorted(counts):
        if counts[card] == 0:
            continue
        run = counts[card]
        # This smallest remaining card MUST begin ``run`` groups now; no later
        # card can stand in for it, so the choice is forced (and therefore safe).
        for offset in range(group_size):
            nxt = card + offset
            if counts[nxt] < run:
                return False
            counts[nxt] -= run
    return True


if __name__ == "__main__":
    print(is_n_straight_hand([1, 2, 3, 6, 2, 3, 4, 7, 8], 3))  # True
    print(is_n_straight_hand([1, 2, 3, 4, 5], 4))              # False
