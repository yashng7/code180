"""Implement Trie (Prefix Tree) — Tries.

A trie is a tree where each edge is labelled with a character and every node
represents the prefix spelled by the path from the root to it.  ``is_end``
marks nodes that complete a word.

* ``insert(word)``          — add ``word``.
* ``search(word)``          — True iff the exact ``word`` was inserted.
* ``startsWith(prefix)``    — True iff some inserted word starts with ``prefix``.

Time  O(L)  per operation, where L is the length of the word/prefix.
Space O(N * L)  worst case for N inserted words of length L.
"""


class Trie:
    """Prefix tree supporting insert / search / startsWith."""

    def __init__(self) -> None:
        self.children: dict[str, "Trie"] = {}
        self.is_end: bool = False

    def insert(self, word: str) -> None:
        node = self
        for ch in word:
            if ch not in node.children:
                node.children[ch] = Trie()
            node = node.children[ch]
        node.is_end = True

    def _walk(self, prefix: str) -> "Trie | None":
        """Follow ``prefix`` from the root; return the node or None."""
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


if __name__ == "__main__":
    trie = Trie()
    trie.insert("apple")
    print(trie.search("apple"))     # True
    print(trie.search("app"))       # False
    print(trie.startsWith("app"))   # True
    trie.insert("app")
    print(trie.search("app"))       # True
