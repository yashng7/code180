# Palindromic Substrings

**Topic:** 1-D Dynamic Programming · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/palindromic-substrings/) · [NeetCode](https://neetcode.io/problems/palindromic-substrings)

## Problem

Given a string `s`, return the number of **palindromic substrings** in it.
Substrings are identified by their start and end indices, so equal-content
substrings count separately.

## Examples

| `s` | Output | Why |
| --- | --- | --- |
| `"abc"` | `3` | `a`, `b`, `c` |
| `"aaa"` | `6` | `a`, `a`, `a`, `aa`, `aa`, `aaa` |
| `"aba"` | `4` | `a`, `b`, `a`, `aba` |

## Intuition

Same centre idea as Longest Palindromic Substring, but we **count**. A
substring `s[i..j]` is a palindrome iff `s[i] == s[j]` and `s[i+1..j-1]` is a
palindrome. Expanding from each of the `2n - 1` centres, every successful
outward step is one more palindromic substring.

## Approach

1. For each centre `(i, i)` (odd) and `(i, i+1)` (even), expand while the ends
   match.
2. Each successful comparison increments the count by one, since it certifies
   one more palindrome.
3. Return the total.
4. **Rolling state:** the `O(n^2)` boolean table `dp[i][j]` is unnecessary —
   the expansion carries only `left`/`right`, giving `O(1)` extra space.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Expand around centre (optimal) | `O(n^2)` | `O(1)` |
| Bottom-up DP table | `O(n^2)` | `O(n^2)` |
| Brute force | `O(n^3)` | `O(1)` |

## Edge cases

- **Empty string** — `0` palindromic substrings.
- **Single character** — `1`.
- **All identical** (`"aaaa"`) — the count is `n(n+1)/2 = 10`.
- **Counting by index** — `"aaa"` counts three `"a"`s and two `"aa"`s, not
  de-duplicated content.

## Solution (`solution.py`)

```python
def count_substrings(s: str) -> int:
    total = 0

    def expand(left: int, right: int) -> int:
        count = 0
        while left >= 0 and right < len(s) and s[left] == s[right]:
            count += 1
            left -= 1
            right += 1
        return count

    for centre in range(len(s)):
        total += expand(centre, centre)
        total += expand(centre, centre + 1)
    return total
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py palindromic_substrings

# whole topic
python3 run.py 1d_dynamic

# your own case
python3 run.py palindromic_substrings -c '["aaa"]'
```
