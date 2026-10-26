"""N-Queens — Backtracking.

Place ``n`` queens on an ``n x n`` board so that no two attack each other, and
return every distinct board configuration.

Time  O(n!)  — one placement decision per row, heavily pruned
Space O(n)   — column / diagonal sets and the recursion stack
"""
from typing import List


def solve_n_queens(n: int) -> List[List[str]]:
    result: List[List[str]] = []
    cols: set[int] = set()          # occupied columns
    diag: set[int] = set()          # occupied r + c diagonals
    anti: set[int] = set()          # occupied r - c diagonals
    queens: List[int] = []          # queens[row] = column of the queen in that row

    def backtrack(row: int) -> None:
        if row == n:
            result.append(
                ["." * col + "Q" + "." * (n - 1 - col) for col in queens]
            )
            return
        for col in range(n):
            if col in cols or (row + col) in diag or (row - col) in anti:
                continue                # attacked -> prune this branch
            cols.add(col)               # choose
            diag.add(row + col)
            anti.add(row - col)
            queens.append(col)
            backtrack(row + 1)          # recurse
            queens.pop()                # un-choose
            cols.remove(col)
            diag.remove(row + col)
            anti.remove(row - col)

    backtrack(0)
    return result


if __name__ == "__main__":
    for board in solve_n_queens(4):
        print(board)
