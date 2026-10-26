# Word Ladder

**Topic:** Graphs · **Difficulty:** Hard
**Links:** [LeetCode](https://leetcode.com/problems/word-ladder/) · [NeetCode](https://neetcode.io/problems/word-ladder)

## Problem

Given `begin_word`, `end_word` and a `word_list`, return the **number of words**
in the shortest transformation sequence from `begin_word` to `end_word`, where:

- every adjacent pair of words differs by exactly **one letter**,
- every word in the sequence (except `begin_word`) comes from `word_list`.

Return `0` if no such sequence exists. The length counts the words, e.g.
`hit → hot → dot → dog → cog` has length `5`.

## Examples

| Input | Output |
| --- | --- |
| `hit`, `cog`, `["hot","dot","dog","lot","log","cog"]` | `5` |
| `hit`, `cog`, `["hot","dot","dog","lot","log"]` | `0` |
| `a`, `c`, `["a","b","c"]` | `2` |

## Intuition

Model each word as a **node** and connect two words when they differ by one
letter. The answer is then the **shortest path** from `begin_word` to
`end_word`, counted in nodes — so a plain **BFS** returns the minimum.

The graph is *implicit*: we never build the `O(N²)` edges. From a word we
generate candidate neighbours by trying all `26` letters in each position and
keeping the ones that exist in the dictionary set. BFS explores by levels, so
the first time we reach `end_word`, its level is the shortest sequence length.

## Approach

1. Put `word_list` in a set for `O(1)` lookups. If `end_word` is absent, return
   `0` immediately.
2. Start BFS from `begin_word`, `visited = {begin_word}`, `steps = 1`.
3. For each BFS level, process every queued word:
   - if it equals `end_word`, return `steps`;
   - otherwise, for each position and each of the 26 letters, form the mutated
     word; if it is in the dictionary and unvisited, mark and enqueue it.
4. After the level, `steps += 1`. If the queue drains, return `0`.

An alternative speed-up is to bucket words by a wildcard pattern such as
`h*t`, turning neighbour generation into a direct hash lookup.

## Complexity

| | Time | Space |
| --- | --- | --- |
| BFS + per-word mutations | `O(N · L · 26)` | `O(N · L)` |
| Precomputed pattern buckets | `O(N · L · 26)` build, `O(N)` BFS | `O(N · L)` |

- **Time** — each of the `N` words is dequeued once; per word we try `L·26`
  mutations. Here `L` is the word length.
- **Space** — the visited set and queue hold at most `N` words of length `L`.

## Edge cases

- **`end_word` not in `word_list`** → `0` (checked first).
- **No one-letter bridge** (e.g. `abc → xyz`) → `0`.
- **`begin_word == end_word`** → the sequence is a single word → `1`.
- **`begin_word` already in `word_list`** → harmless; BFS dedupes via `visited`.
- **Words of different lengths** cannot occur (LeetCode guarantees equal
  lengths); otherwise one-letter differences are impossible.
- **Disconnected components** → BFS exhausts and returns `0`.

## Solution (`solution.py`)

```python
from collections import deque
from typing import List


def ladder_length(begin_word: str, end_word: str, word_list: List[str]) -> int:
    words = set(word_list)
    if end_word not in words:
        return 0

    alphabet = "abcdefghijklmnopqrstuvwxyz"
    queue = deque([begin_word])
    visited = {begin_word}
    steps = 1

    while queue:
        for _ in range(len(queue)):
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
```

## How to run the tests

```bash
python3 run.py word_ladder
pytest topics/11_graphs/word_ladder -v
```
