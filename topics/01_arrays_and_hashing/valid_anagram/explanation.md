# Valid Anagram

**Topic:** Arrays & Hashing · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/valid-anagram/) · [NeetCode](https://neetcode.io/problems/is-anagram)

## Problem

Given two strings `s` and `t`, return `True` if `t` is an **anagram** of `s` —
i.e. it uses exactly the same characters with the same multiplicities.

## Examples

| `s` | `t` | Output |
| --- | --- | --- |
| `"anagram"` | `"nagaram"` | `True` |
| `"rat"` | `"car"` | `False` |

## Intuition

An anagram is purely about **letter counts**, not order. So build a frequency
map of one string and check that the other matches.

## Approach

1. If the lengths differ, they cannot be anagrams → `False`.
2. Count characters of `s` (e.g. `Counter(s)`).
3. Count characters of `t` and compare the two maps.

A common alternative uses a 26-length array for the lowercase alphabet, which
gives `O(1)` extra space and avoids hashing overhead.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Counter | `O(n)` | `O(k)`, `k` = distinct chars (≤ 26) |

## Edge cases

- Different lengths → immediate `False`.
- Both empty strings → `True`.
- Same multiset but different order → `True`.
- Same letters with wrong multiplicities (`"aacc"` vs `"ccac"`) → `False`.

## Solution

```python
def is_anagram(s: str, t: str) -> bool:
    if len(s) != len(t):
        return False
    return Counter(s) == Counter(t)
```

## How to run

```bash
python3 run.py valid_anagram
python3 run.py valid_anagram -c '["anagram", "nagaram"]'
```
