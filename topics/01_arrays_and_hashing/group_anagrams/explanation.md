# Group Anagrams

**Topic:** Arrays & Hashing · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/group-anagrams/) · [NeetCode](https://neetcode.io/problems/anagram-groups)

## Problem

Given an array of strings `strs`, group the anagrams together. The groups and
the strings inside each group may be returned in **any order**.

## Example

```
Input : ["eat","tea","tan","ate","nat","bat"]
Output: [["bat"],["nat","tan"],["ate","eat","tea"]]
```

## Intuition

Anagrams are the same string "up to reordering". If we can map every anagram to
one **canonical key**, we can simply bucket the words by that key in a hash map.

Two natural keys:

- the **sorted** word (`"eat"` → `"aet"`) — simple, `O(k log k)` per word;
- the **letter-count tuple** — `O(k)` per word, slightly more code.

## Approach (sorted key)

1. Create a map from key → list of words.
2. For each word, compute `key = "".join(sorted(word))` and append the word.
3. Return the map's values.

## Complexity

Let `n` = number of strings and `k` = longest string length.

| Key type | Time | Space |
| --- | --- | --- |
| Sorted string | `O(n · k log k)` | `O(n · k)` |
| Count tuple | `O(n · k)` | `O(n · k)` |

## Edge cases

- Empty input → empty list.
- `[""]` → `[[""]]`.
- `["", ""]` → both empty strings share a key and land in the same group.
- Because order is free, the harness compares with `unordered_inner`
  (order ignored at both the outer and inner levels).

## Solution

```python
def group_anagrams(strs: List[str]) -> List[List[str]]:
    groups = defaultdict(list)
    for word in strs:
        groups["".join(sorted(word))].append(word)
    return list(groups.values())
```

## How to run

```bash
python3 run.py group_anagrams
python3 run.py group_anagrams -c '[["eat","tea","tan","ate","nat","bat"]]'
```
