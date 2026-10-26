# Word Search II

**Topic:** Tries · **Difficulty:** Hard
**Links:** [LeetCode](https://leetcode.com/problems/word-search-ii/) · [NeetCode](https://neetcode.io/problems/search-for-word-ii)

## Problem

Given an `m x n` board of characters and a list of strings `words`, return all
words that can be constructed from letters of **sequentially adjacent** cells,
where adjacency is horizontal or vertical and the same cell may not be used more
than once within a single word.

## Examples

| board | words | output |
| --- | --- | --- |
| `[["o","a","a","n"],["e","t","a","e"],["i","h","k","r"],["i","f","l","v"]]` | `["oath","pea","eat","rain"]` | `["eat","oath"]` |
| `[["a","b"],["c","d"]]` | `["abcb"]` | `[]` |
| `[["a"]]` | `["a"]` | `["a"]` |

## Intuition

A naive solution runs a full DFS on the board for **each** word — up to
`3 · 10⁴` searches, each exploring the whole grid. Instead, put all the words
into a **trie** and run a *single* DFS from every cell, walking the trie and the
board at the same time.

That gives two huge wins:

- **Shared prefixes** are explored once. If `"oath"` and `"oats"` are both in
  the list, the path `o → a → t` is walked a single time.
- **Pruning.** The moment the current cell's character is not a child of the
  current trie node, no word reaches that branch — we stop immediately. When a
  word is completed we record it and blank its terminal marker so it is never
  reported twice.

## Approach

1. **Build a trie** from `words`. Each terminal node stores the full word (or
   just `is_end`), so a completed path yields the answer directly.
2. For every cell `(r, c)`, run `dfs(r, c, parent)`:
   - look up the cell's character as a child of the current trie node; if it is
     missing, **return** (prune);
   - if the node marks a word, append it and clear the marker;
   - mark the cell as visited (temporarily overwrite it with `"#"`);
   - recurse into the four orthogonal neighbours that are on the board and not
     visited;
   - restore the cell;
   - if the node now has no children, delete it from its parent (prune the
     exhausted branch).
3. Return the collected words.

## Walkthrough

Trie of `["oath", "pea", "eat", "rain"]` starts with `o`, `p`, `e`, `r`.
From cell `(1,1) = 't'` no branch matches → pruned instantly. From `(0,0) = 'o'`
the DFS walks `o → a → t → h` and records `"oath"`; `"eat"` is found starting at
`(1,0)`. `"pea"` and `"rain"` never complete a valid non-repeating path, so the
output is `["eat", "oath"]`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Trie + pruned DFS | `O(m · n · 4 · 3^(L-1))` worst case | `O(S)` |
| DFS once per word | `O(W · m · n · 4 · 3^(L-1))` | `O(L)` per search |

- Let `L` be the longest word and `S` the total number of characters over all
  words. Each DFS step has at most 3 onward choices (it cannot revisit the cell
  it came from), hence the `4 · 3^(L-1)` bound per starting cell.
- Prefix pruning and removing found words make the typical running time much
  smaller than the worst case — a branch dies as soon as it leaves the trie.
- **Space `O(S)`** for the trie; the board is modified in place and restored.

## Edge cases

- **No word fits** — e.g. `board = [["a","b"],["c","d"]], words = ["abcb"]` →
  `[]`; the `b` at the end has no unused neighbour.
- **Single cell** — `board = [["a"]], words = ["a"]` → `["a"]`; longer words and
  absent letters are rejected.
- **A word is a prefix of another** (`"a"` and `"ab"`) — both are reported; the
  terminal marker handles the shorter one without stopping the walk.
- **Duplicate words in the input** — clearing `node.word` after the first hit
  guarantees each word appears once.
- **Long word list** — many absent/oversized words are pruned at the first or
  second character, so the trie keeps the search cheap.

## Solution (`solution.py`)

```python
class _TrieNode:
    __slots__ = ("children", "word")

    def __init__(self) -> None:
        self.children: dict[str, "_TrieNode"] = {}
        self.word: str | None = None


def find_words(board: List[List[str]], words: List[str]) -> List[str]:
    root = _TrieNode()
    for word in words:
        node = root
        for ch in word:
            node = node.children.setdefault(ch, _TrieNode())
        node.word = word

    rows, cols = len(board), len(board[0]) if board else 0
    result: List[str] = []

    def dfs(r: int, c: int, parent: _TrieNode) -> None:
        ch = board[r][c]
        node = parent.children.get(ch)
        if node is None:
            return
        if node.word is not None:
            result.append(node.word)
            node.word = None
        board[r][c] = "#"
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] != "#":
                dfs(nr, nc, node)
        board[r][c] = ch
        if not node.children:
            del parent.children[ch]

    for r in range(rows):
        for c in range(cols):
            dfs(r, c, root)
    return result
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py word_search_ii

# same tests through pytest
pytest topics/08_tries/word_search_ii -v
```
