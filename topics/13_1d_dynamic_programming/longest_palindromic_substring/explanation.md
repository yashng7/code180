# Longest Palindromic Substring

**Topic:** 1-D Dynamic Programming · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/longest-palindromic-substring/) · [NeetCode](https://neetcode.io/problems/longest-palindromic-substring)

## Problem

Given a string `s`, return the **longest substring** of `s` that is a
palindrome. When several longest palindromes exist, any of them is accepted.

## Examples

| `s` | Output | Why |
| --- | --- | --- |
| `"babad"` | `"bab"` | `"aba"` is equally valid (tie) |
| `"cbbd"` | `"bb"` | even-length palindrome |
| `"aacabdkacaa"` | `"aca"` | inner palindrome |

## Intuition

Every palindrome has a **centre**: a character (odd length) or a gap between
two characters (even length). There are `2n - 1` such centres. If we start at a
centre and expand outward while the two ends match, we enumerate every
palindrome exactly by its centre. This is the expand-around-centre view of the
DP: a substring `s[i..j]` is a palindrome iff `s[i] == s[j]` **and**
`s[i+1..j-1]` is a palindrome.

## Approach

1. For each index `i`, expand from centre `(i, i)` for odd palindromes and from
   `(i, i+1)` for even palindromes.
2. Extend while `left >= 0`, `right < n` and `s[left] == s[right]`, tracking the
   longest span seen.
3. Return the best window `s[best_start : best_start + best_len]`.
4. **Rolling state:** instead of an `O(n^2)` boolean table `dp[i][j]`, the
   expansion carries only two indices, so no table is stored.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Expand around centre (optimal) | `O(n^2)` | `O(1)` |
| Bottom-up DP table | `O(n^2)` | `O(n^2)` |
| Brute force | `O(n^3)` | `O(1)` |
| Manacher | `O(n)` | `O(n)` |

## Edge cases

- **Degenerate strings** (`""`, `"a"`, `"ac"`) — return the whole string; a
  single character is always a palindrome.
- **Ties** (`"babad"`) — `"bab"` and `"aba"` are both valid; the shared
  `longest_palindrome` checker only requires a maximal-length palindrome.
- **All identical** (`"ccc"`) — the whole string is the answer.

## Solution (`solution.py`)

```python
def longest_palindrome(s: str) -> str:
    if len(s) < 2:
        return s
    best_start, best_len = 0, 1

    def expand(left: int, right: int) -> None:
        nonlocal best_start, best_len
        while left >= 0 and right < len(s) and s[left] == s[right]:
            if right - left + 1 > best_len:
                best_start, best_len = left, right - left + 1
            left -= 1
            right += 1

    for centre in range(len(s)):
        expand(centre, centre)
        expand(centre, centre + 1)
    return s[best_start : best_start + best_len]
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py longest_palindromic_substring

# whole topic
python3 run.py 1d_dynamic

# your own case
python3 run.py longest_palindromic_substring -c '["babad"]'
```

> Note: `compare` is `custom` with the `longest_palindrome` checker, so any
> maximal-length palindromic substring is accepted (the `expected` value is
> shown only for readability).
