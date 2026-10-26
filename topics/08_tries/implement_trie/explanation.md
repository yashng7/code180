# Implement Trie (Prefix Tree)

**Topic:** Tries · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/implement-trie-prefix-tree/) · [NeetCode](https://neetcode.io/problems/implement-prefix-tree)

## Problem

A **trie** (prefix tree) is a rooted tree where each node stores a character,
a word is spelled by the path from the root, and a flag marks nodes that end a
valid word. Implement the `Trie` class:

- `Trie()` — initialise an empty trie,
- `insert(word)` — insert the string `word`,
- `search(word)` — return `True` iff the exact string `word` is in the trie,
- `startsWith(prefix)` — return `True` iff some inserted word starts with `prefix`.

## Examples

| operations | results |
| --- | --- |
| `insert("apple")` | — |
| `search("apple")` | `True` |
| `search("app")` | `False` |
| `startsWith("app")` | `True` |
| `insert("app")`, `search("app")` | —, `True` |

The driver runs a list of `ops` against the object and collects the outputs;
`null` marks the constructor and every void method.

## Intuition

Storing words in a list makes `startsWith` require scanning every word — slow.
A trie shares prefixes: all words starting with `app` walk down the **same**
`a → p → p` nodes. The only extra thing we need is the `is_end` flag, because
`"app"` being a *prefix* of `"apple"` does **not** mean `"app"` was inserted.

Walking a word of length `L` never depends on how many words are stored, so
every operation is `O(L)`.

## Approach

1. Each node has a `children` dict (character → child node) and `is_end`.
2. **insert(word):** from the root, follow/create one child per character; mark
   the final node's `is_end = True`.
3. **walk(prefix):** follow the characters from the root; return the node, or
   `None` if a character is missing.
4. **search(word):** `walk(word)` must succeed **and** the node's `is_end` is
   `True`.
5. **startsWith(prefix):** `walk(prefix)` simply must succeed.

Both `search` and `startsWith` share the same `walk` helper — the only
difference is whether `is_end` matters.

## Walkthrough

After `insert("apple")` and `insert("app")`:

```
(root)
  └─ a ─ p ─ p(is_end) ─ l ─ e(is_end)
```

- `search("app")` → node has `is_end` → `True`.
- `search("appl")` → node exists but no `is_end` → `False`.
- `startsWith("appl")` → node exists → `True`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Trie (optimal) | `O(L)` per op | `O(N · L)` worst case |
| List of words | `O(N · L)` per prefix op | `O(N · L)` |

- **Time `O(L)`** — one step per character of the argument.
- **Space `O(N · L)`** — the number of nodes is bounded by the total length of
  all inserted words (fewer when they share prefixes).

## Edge cases

- **Prefix ≠ word** — `"app"` is a prefix of `"apple"` but `search("app")` is
  `False` until `"app"` itself is inserted; the `is_end` flag handles this.
- **Empty trie** — every `search`/`startsWith` returns `False`.
- **Duplicate inserts** — setting `is_end` twice is idempotent.
- **Word that is a prefix of another word** — both can be present; each keeps
  its own `is_end`.

## Solution (`solution.py`)

```python
class Trie:
    def __init__(self) -> None:
        self.children: dict[str, "Trie"] = {}
        self.is_end = False

    def insert(self, word: str) -> None:
        node = self
        for ch in word:
            if ch not in node.children:
                node.children[ch] = Trie()
            node = node.children[ch]
        node.is_end = True

    def _walk(self, prefix: str) -> "Trie | None":
        node = self
        for ch in prefix:
            if ch not in node.children:
                return None
            node = node.children[ch]
        return node

    def search(self, word: str) -> bool:
        node = self._walk(word)
        return node is not None and node.is_end

    def startsWith(self, prefix: str) -> bool:
        return self._walk(prefix) is not None
```

## How to run the tests

```bash
# built-in test cases (7 of them)
python3 run.py implement_trie

# same tests through pytest
pytest topics/08_tries/implement_trie -v
```
