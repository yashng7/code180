# Design Add and Search Words Data Structure

**Topic:** Tries · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/design-add-and-search-words-data-structure/) · [NeetCode](https://neetcode.io/problems/design-word-search-data-structure)

## Problem

Design a data structure that supports adding words and searching for them where
`'.'` matches **any single letter**:

- `WordDictionary()` — initialise an empty structure,
- `addWord(word)` — add `word` to the structure,
- `search(word)` — return `True` iff `word` is in the structure, treating each
  `'.'` as a wildcard for one character.

## Examples

| operations | results |
| --- | --- |
| `addWord("bad")`, `addWord("dad")`, `addWord("mad")` | — |
| `search("pad")` | `False` |
| `search("bad")` | `True` |
| `search(".ad")` | `True` |
| `search("b..")` | `True` |

The driver runs a list of `ops` against the object and collects the outputs;
`null` marks the constructor and every void method.

## Intuition

Storing the words and trying every one on each `search` costs `O(N · L)`. A
**trie** turns the normal (non-wildcard) lookup into a single walk down the
tree. The new twist is the wildcard: when we hit `'.'` we cannot know which
character comes next, so we try **all** children and accept the search if any
of them leads to a complete word.

Because the pattern length fixes the depth, a trailing `'.'` can never "spill"
onto a longer word — the recursion only succeeds when `is_end` is set at exactly
`len(word)`.

## Approach

1. `addWord` builds a normal trie (child per character, `is_end` at the end).
2. `search` runs a recursive `dfs(node, index)`:
   - if `index == len(word)`, return `node.is_end`;
   - if `word[index] == '.'`, recurse into **every** child and return `True` if
     any branch succeeds (`any(...)`);
   - otherwise follow the single matching child, or return `False` if it is
     missing.

## Walkthrough

With `bad`, `dad`, `mad` inserted, the root has children `b`, `d`, `m`, each
followed by `a → d(is_end)`. Searching `".ad"`:

1. `'.'` at index 0 → try `b`, `d`, `m`;
2. each branch must then supply `a` and `d` and end there — the `b` branch
   yields `"bad"` → `True`.

Searching `".."` would try all length-2 paths, find no `is_end`, and return
`False`.

## Complexity

| | addWord | search (no `.`) | search (all `.`) | Space |
| --- | --- | --- | --- | --- |
| Trie | `O(L)` | `O(L)` | `O(L · 26^L)` | `O(N · L)` |
| Linear scan | `O(L)` | `O(N · L)` | `O(N · L)` | `O(N · L)` |

- **addWord `O(L)`** — one step per character.
- **search `O(L)`** with no wildcards; each `'.'` multiplies the work by the
  branching factor (bounded by 26), so the worst case is `O(L · 26^L)`.
- **Space `O(N · L)`** for the nodes of all stored words.

## Edge cases

- **Empty dictionary** — `search(".")` and `search("a")` are both `False`;
  there are no children to branch into.
- **Pattern length ≠ word length** — the `index == len(word)` base case means a
  wildcard cannot match a longer or shorter word (`search("b...")` is `False`
  when only `"bad"`/`"badly"` exist).
- **Prefix alone** — `search("app")` is `False` for `"apple"` unless `"app"` was
  added; only `is_end` counts.
- **Duplicate adds** — re-adding a word is idempotent.

## Solution (`solution.py`)

```python
class WordDictionary:
    def __init__(self) -> None:
        self.children: dict[str, "WordDictionary"] = {}
        self.is_end = False

    def addWord(self, word: str) -> None:
        node = self
        for ch in word:
            if ch not in node.children:
                node.children[ch] = WordDictionary()
            node = node.children[ch]
        node.is_end = True

    def search(self, word: str) -> bool:
        def dfs(node, index):
            if index == len(word):
                return node.is_end
            ch = word[index]
            if ch == ".":
                return any(dfs(child, index + 1) for child in node.children.values())
            child = node.children.get(ch)
            return child is not None and dfs(child, index + 1)

        return dfs(self, 0)
```

## How to run the tests

```bash
# built-in test cases (7 of them)
python3 run.py design_add_and_search_words_data_structure

# same tests through pytest
pytest topics/08_tries/design_add_and_search_words_data_structure -v
```
