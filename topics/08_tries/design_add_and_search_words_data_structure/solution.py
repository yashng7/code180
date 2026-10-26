"""Design Add and Search Words Data Structure — Tries.

Like a trie for ``addWord``, but ``search`` accepts ``'.'`` as a wildcard that
matches any single character.  On a wildcard we branch into **every** child and
take the first branch that reaches the end of the pattern.

* ``addWord(word)``     — store ``word``.
* ``search(word)``      — True iff ``word`` is stored, where ``'.'`` matches any
  one letter.

Time  O(L)  for addWord; O(L · 26^L) worst case for search (all wildcards).
Space O(N · L)  for N stored words of length L.
"""


class WordDictionary:
    """Trie with single-character ``'.'`` wildcard support in ``search``."""

    def __init__(self) -> None:
        self.children: dict[str, "WordDictionary"] = {}
        self.is_end: bool = False

    def addWord(self, word: str) -> None:
        node = self
        for ch in word:
            if ch not in node.children:
                node.children[ch] = WordDictionary()
            node = node.children[ch]
        node.is_end = True

    def search(self, word: str) -> bool:
        def dfs(node: "WordDictionary", index: int) -> bool:
            if index == len(word):
                return node.is_end
            ch = word[index]
            if ch == ".":
                return any(dfs(child, index + 1) for child in node.children.values())
            child = node.children.get(ch)
            return child is not None and dfs(child, index + 1)

        return dfs(self, 0)


if __name__ == "__main__":
    wd = WordDictionary()
    for w in ("bad", "dad", "mad"):
        wd.addWord(w)
    print(wd.search("pad"))   # False
    print(wd.search("bad"))   # True
    print(wd.search(".ad"))   # True
    print(wd.search("b.."))   # True
