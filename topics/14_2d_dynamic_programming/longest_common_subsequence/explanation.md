# Longest Common Subsequence

**Topic:** 2-D Dynamic Programming · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/longest-common-subsequence/) · [NeetCode](https://neetcode.io/problems/longest-common-subsequence)

## Problem

Given two strings `text1` and `text2`, return the length of their longest common
**subsequence** (characters keep their relative order but need not be
contiguous). Return `0` if there is no common subsequence.

## Examples

| `text1` | `text2` | Output | Why |
| --- | --- | --- | --- |
| `"abcde"` | `"ace"` | `3` | `ace` |
| `"abc"` | `"abc"` | `3` | whole string |
| `"abc"` | `"def"` | `0` | nothing shared |
| `""` | `"abc"` | `0` | empty string |

## Intuition

Compare the **last** characters of the two prefixes. If they match, they must
belong to the LCS, so we add `1` to the LCS of the prefixes *without* them. If
they differ, at least one of the last characters is irrelevant, so take the
better of dropping one from either side.

## Approach

1. Let `dp[i][j]` = LCS length of `text1[:i]` and `text2[:j]`.
2. Base case: if either prefix is empty, `dp = 0`.
3. Transition:

   ```
   dp[i][j] = dp[i-1][j-1] + 1                 if text1[i-1] == text2[j-1]
            = max(dp[i-1][j], dp[i][j-1])      otherwise
   ```

4. Answer is `dp[m][n]`.
5. **Space optimisation:** row `i` depends only on row `i-1`, so keep one array
   and iterate `j` left to right. `prev` caches `dp[i-1][j-1]` (the diagonal)
   before it is overwritten, while `dp[j]` still holds `dp[i-1][j]`. Keeping the
   **shorter** string on the row shrinks memory to `O(min(m, n))`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Full 2-D table | `O(m · n)` | `O(m · n)` |
| Rolling row | `O(m · n)` | `O(min(m, n))` |

## Edge cases

- **Either string empty** — the answer is `0`.
- **Identical strings** — the LCS is the whole string.
- **No shared characters** — `0`.
- **Repeated characters** — e.g. `"aaa"` / `"aaa"` gives `3`; the recurrence
  naturally counts positions, not distinct letters.

## Solution (`solution.py`)

```python
def longest_common_subsequence(text1: str, text2: str) -> int:
    if len(text2) > len(text1):
        text1, text2 = text2, text1
    dp = [0] * (len(text2) + 1)
    for c1 in text1:
        prev = 0
        for j, c2 in enumerate(text2, start=1):
            saved = dp[j]
            if c1 == c2:
                dp[j] = prev + 1
            else:
                dp[j] = max(dp[j], dp[j - 1])
            prev = saved
    return dp[len(text2)]
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py longest_common_subsequence

# whole topic
python3 run.py 2d_dynamic

# your own case
python3 run.py longest_common_subsequence -c '["abcde", "ace"]'
```
