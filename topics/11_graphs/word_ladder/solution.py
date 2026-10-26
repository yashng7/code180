"""Word Ladder — Graphs.

Return the length of the shortest transformation sequence from `begin_word` to
`end_word`, changing one letter at a time with every intermediate word present
in `word_list`, or `0` if no sequence exists.

Time O(N · L · 26) · Space O(N · L)
"""
from collections import deque
from typing import List


def ladder_length(begin_word: str, end_word: str, word_list: List[str]) -> int:
    """BFS over the implicit word graph; each level is one extra word."""
    words = set(word_list)
    if end_word not in words:
        return 0

    alphabet = "abcdefghijklmnopqrstuvwxyz"
    queue = deque([begin_word])
    visited = {begin_word}
    steps = 1

    while queue:
        for _ in range(len(queue)):          # process one BFS level
            word = queue.popleft()
            if word == end_word:
                return steps
            for i in range(len(word)):
                for ch in alphabet:
                    if ch == word[i]:
                        continue
                    nxt = word[:i] + ch + word[i + 1:]
                    if nxt in words and nxt not in visited:
                        visited.add(nxt)
                        queue.append(nxt)
        steps += 1

    return 0


# NeetCode-style class wrapper; the loader prefers the top-level function.
class Solution:
    def ladderLength(self, beginWord: str, endWord: str, wordList: List[str]) -> int:
        return ladder_length(beginWord, endWord, wordList)


if __name__ == "__main__":
    print(ladder_length("hit", "cog", ["hot", "dot", "dog", "lot", "log", "cog"]))  # 5
    print(ladder_length("hit", "cog", ["hot", "dot", "dog", "lot", "log"]))         # 0
