"""Surrounded Regions — Graphs.

Flip every `"O"` region that is fully enclosed by `"X"` into `"X"`. Regions that
touch the border stay `"O"`. The board is mutated **and returned**.

Time O(m · n) · Space O(m · n)
"""
from collections import deque
from typing import List


def solve(board: List[List[str]]) -> List[List[str]]:
    """Mark border-connected `O`s, then flip the rest."""
    if not board or not board[0]:
        return board

    rows, cols = len(board), len(board[0])
    queue = deque()

    # Seed every "O" on the border; those regions can never be surrounded.
    for r in range(rows):
        for c in range(cols):
            on_border = r == 0 or r == rows - 1 or c == 0 or c == cols - 1
            if on_border and board[r][c] == "O":
                board[r][c] = "T"          # temporary safe marker
                queue.append((r, c))

    while queue:
        r, c = queue.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] == "O":
                board[nr][nc] = "T"
                queue.append((nr, nc))

    # Anything still "O" was unreachable from the border -> flip it.
    for r in range(rows):
        for c in range(cols):
            if board[r][c] == "O":
                board[r][c] = "X"
            elif board[r][c] == "T":
                board[r][c] = "O"

    return board


# NeetCode-style class wrapper; the loader prefers the top-level function.
class Solution:
    def solve(self, board: List[List[str]]) -> None:
        solve(board)


if __name__ == "__main__":
    print(solve([["X"]]))  # [['X']]
