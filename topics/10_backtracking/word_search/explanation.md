# Word Search

**Topic:** Backtracking · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/word-search/) · [NeetCode](https://neetcode.io/problems/search-for-word)

## Problem

Given an `m x n` grid of characters `board` and a string `word`, return `true`
if `word` exists in the grid as a path of **horizontally or vertically adjacent**
cells. The **same cell may not be used more than once**.

## Examples

| `board` | `word` | Output |
| --- | --- | --- |
| `[[A,B,C,E],[S,F,C,S],[A,D,E,E]]` | `"ABCCED"` | `true` |
| `[[A,B,C,E],[S,F,C,S],[A,D,E,E]]` | `"SEE"` | `true` |
| `[[A,B,C,E],[S,F,C,S],[A,D,E,E]]` | `"ABCB"` | `false` |

## Intuition

This is a grid version of the choose → recurse → un-choose template. From a
starting cell we try to match `word[0]`, then recursively try to match
`word[1]` from the four neighbours, and so on.

The "cannot reuse a cell" rule is the *un-choose* step: when we step onto a
cell we mark it (e.g. overwrite it with `"#"`), and we **restore it on the way
out**. Without the restore, one failed exploration would permanently block a
cell for later, different paths.

## Approach

1. Try every cell `(row, col)` as the start of the word.
2. `backtrack(row, col, index)`:
   - success if `index == len(word)`;
   - fail if out of bounds, or `board[row][col] != word[index]`
     (this also rejects cells already marked `"#"`);
   - otherwise mark the cell visited (choose);
   - recurse in all four directions with `index + 1` (recurse);
   - restore the cell's character (un-choose) and return whether any direction
     succeeded.
3. Return `True` as soon as any start cell succeeds, else `False`.

## Complexity

Let `m·n` be the number of cells and `L = len(word)`.

| | Time | Space |
| --- | --- | --- |
| Backtracking | `O(m · n · 4^L)` | `O(L)` |

Each start explores at most `4^L` paths of length `L`; the only extra memory is
the recursion stack (`O(L)`), because visited cells are marked in place.

## Edge cases

- **Single cell** grid: matches only if `word` is that one character.
- **Word longer than the grid** can never match (runs out of cells).
- **Repeated letters** (`[["a","a"]], "aaa"`) must fail — a cell cannot be reused.
- **Requires backtracking** (`"AAB"` on a grid full of `A`s): the first try may
  dead-end, and only restoring cells lets a later path succeed.

## Solution (`solution.py`)

```python
def exist(board, word):
    rows, cols = len(board), len(board[0])

    def backtrack(row, col, index):
        if index == len(word):
            return True
        if not (0 <= row < rows and 0 <= col < cols):
            return False
        if board[row][col] != word[index]:
            return False
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
```

## How to run the tests

```bash
python3 run.py word_search
pytest topics/10_backtracking/word_search -v
python3 run.py word_search -c '[[["A","B"],["C","D"]], "ABDC"]'
```
