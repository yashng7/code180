# Valid Palindrome

**Topic:** Two Pointers · **Difficulty:** Easy
**Links:** [LeetCode](https://leetcode.com/problems/valid-palindrome/) · [NeetCode](https://neetcode.io/problems/is-palindrome)

## Problem

A phrase is a palindrome if, after converting every uppercase letter to
lowercase and removing every non-alphanumeric character, it reads the same
forward and backward. Given a string `s`, return `True` if it is a palindrome,
otherwise `False`.

## Examples

| `s` | Output | Why |
| --- | --- | --- |
| `"A man, a plan, a canal: Panama"` | `true` | normalised → `"amanaplanacanalpanama"` |
| `"race a car"` | `false` | normalised → `"raceacar"` |
| `" "` | `true` | normalises to `""`, a palindrome |

## Intuition

A palindrome is symmetric: the first character must match the last, the second
must match the second-to-last, and so on. That symmetry suggests walking inward
from **both ends at once** — two pointers — instead of building a new cleaned
string.

We simply skip over any character that is not a letter or digit, compare the
remaining characters case-insensitively, and step both pointers toward the
middle.

## Approach

1. Put `left` at the start and `right` at the end of `s`.
2. While `left < right`:
   - advance `left` while it points at a non-alphanumeric character;
   - retreat `right` while it points at a non-alphanumeric character;
   - compare `s[left].lower()` with `s[right].lower()`; if they differ, return
     `False`;
   - otherwise move both pointers inward.
3. If the pointers meet or cross without a mismatch, return `True`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Two pointers (optimal) | `O(n)` | `O(1)` |
| Clean-then-compare | `O(n)` | `O(n)` |

- **Time `O(n)`** — every index is examined at most once across the whole scan.
- **Space `O(1)`** — we never allocate a cleaned copy; only two integers.

## Edge cases

- **Empty / all-punctuation string** (`""`, `".;,"`) — the pointers meet
  immediately and we return `True`.
- **Digits mixed with letters** (`"0P"`) — `'0'` and `'p'` differ, so `False`.
- **Case differences** (`"Aa"`) — handled by `.lower()`.
- **Single character** — `left == right`, the loop never runs, return `True`.

## Solution (`solution.py`)

```python
def is_palindrome(s: str) -> bool:
    left, right = 0, len(s) - 1
    while left < right:
        while left < right and not s[left].isalnum():
            left += 1
        while left < right and not s[right].isalnum():
            right -= 1
        if s[left].lower() != s[right].lower():
            return False
        left += 1
        right -= 1
    return True
```

## How to run the tests

```bash
# built-in test cases (8 of them)
python3 run.py valid_palindrome

# same tests through pytest
pytest topics/02_two_pointers/valid_palindrome -v

# your own case, one-shot
python3 run.py valid_palindrome -c '["A man, a plan, a canal: Panama"]'
```
