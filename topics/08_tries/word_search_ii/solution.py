"""Word Search II — Tries.

Given an ``m x n`` board of letters and a list of ``words``, return every word
that can be formed by a path of **adjacent** (up/down/left/right) cells, where
each cell is used at most once per word.

Approach: build a **trie** of ``words`` and run a DFS from every cell, walking
the trie alongside the board.  A prefix that leaves the trie is pruned
immediately, and words are deleted from the trie once found so no branch is
explored twice.

Time  O(m · n · 4 · 3^(L-1))  worst case, in practice far less thanks to pruning.
Space O(S)  for the trie, where S is the total length of all words.
"""
from typing import List


class _TrieNode:
    __slots__ = ("children", "word")

    def __init__(self) -> None:
        self.children: dict[str, "_TrieNode"] = {}
        self.word: str | None = None


def find_words(board: List[List[str]], words: List[str]) -> List[str]:
    """Return all ``words`` present in ``board`` (trie + pruned DFS)."""
    root = _TrieNode()
    for word in words:
        node = root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = _TrieNode()
            node = node.children[ch]
        node.word = word                       # terminal marker

    rows = len(board)
    cols = len(board[0]) if rows else 0
    result: List[str] = []

    def dfs(r: int, c: int, parent: _TrieNode) -> None:
        ch = board[r][c]
        node = parent.children.get(ch)
        if node is None:                       # no word has this prefix
            return

        if node.word is not None:              # completed a word
            result.append(node.word)
            node.word = None                   # never report it twice

        board[r][c] = "#"                      # mark the cell as used
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] != "#":
                dfs(nr, nc, node)
        board[r][c] = ch                       # restore for other paths

        if not node.children:                  # prune exhausted branch
            del parent.children[ch]

    for r in range(rows):
        for c in range(cols):
            dfs(r, c, root)
    return result


if __name__ == "__main__":
    board = [
        ["o", "a", "a", "n"],
        ["e", "t", "a", "e"],
        ["i", "h", "k", "r"],
        ["i", "f", "l", "v"],
    ]
    print(find_words(board, ["oath", "pea", "eat", "rain"]))   # ['eat', 'oath']
