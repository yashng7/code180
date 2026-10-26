"""Valid Sudoku — Arrays & Hashing.

Determine whether a partially filled 9x9 board is valid. A board is valid when
no row, column, or 3x3 sub-box contains a repeated digit (1-9). Empty cells are
``"."`` and are ignored.

Time O(81) = O(1) · Space O(81) = O(1)
"""
from typing import List


def is_valid_sudoku(board: List[List[str]]) -> bool:
    rows = [set() for _ in range(9)]
    cols = [set() for _ in range(9)]
    boxes = [set() for _ in range(9)]

    for r in range(9):
        for c in range(9):
            value = board[r][c]
            if value == ".":
                continue
            box = (r // 3) * 3 + (c // 3)   # index the 3x3 sub-box 0..8
            if value in rows[r] or value in cols[c] or value in boxes[box]:
                return False
            rows[r].add(value)
            cols[c].add(value)
            boxes[box].add(value)
    return True


if __name__ == "__main__":
    print(is_valid_sudoku([[".", ".", "."], [".", ".", "."], [".", ".", "."]]))  # True
