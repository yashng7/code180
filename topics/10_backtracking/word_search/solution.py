"""Word Search — Backtracking.

Return whether ``word`` can be built from adjacent (4-directional) grid cells
without reusing any cell.

Time  O(m * n * 4^L)  — L = len(word); up to 4^L paths from each start cell
Space O(L)            — recursion depth (cells are marked in place)
"""
from typing import List


def exist(board: List[List[str]], word: str) -> bool:
    rows, cols = len(board), len(board[0])

    def backtrack(row: int, col: int, index: int) -> bool:
        if index == len(word):
            return True                     # matched every character
        if not (0 <= row < rows and 0 <= col < cols):
            return False
        if board[row][col] != word[index]:
            return False                    # wrong char or already visited

        board[row][col] = "#"               # choose: mark visited
        found = (
            backtrack(row + 1, col, index + 1)
            or backtrack(row - 1, col, index + 1)
            or backtrack(row, col + 1, index + 1)
            or backtrack(row, col - 1, index + 1)
        )
        board[row][col] = word[index]       # un-choose: restore
        return found

    for row in range(rows):
        for col in range(cols):
            if backtrack(row, col, 0):
                return True
    return False


if __name__ == "__main__":
    grid = [["A", "B", "C", "E"], ["S", "F", "C", "S"], ["A", "D", "E", "E"]]
    print(exist(grid, "ABCCED"))   # True
