# Interleaving String

**Topic:** 2-D Dynamic Programming · **Difficulty:** Medium
**Links:** [LeetCode](https://leetcode.com/problems/interleaving-string/) · [NeetCode](https://neetcode.io/problems/interleaving-string)

## Problem

Given strings `s1`, `s2` and `s3`, return whether `s3` can be formed by
interleaving `s1` and `s2` so that the relative order of characters within each
of `s1` and `s2` is preserved.

## Examples

| `s1` | `s2` | `s3` | Output |
| --- | --- | --- | --- |
| `"aabcc"` | `"dbbca"` | `"aadbbcbcac"` | `true` |
| `"aabcc"` | `"dbbca"` | `"aadbbbaccc"` | `false` |
| `""` | `""` | `""` | `true` |
| `"a"` | `"b"` | `"ba"` | `true` |

## Intuition

Think of building `s3` left to right. Once `i` characters of `s1` and `j`
characters of `s2` have been consumed, exactly `i + j` characters of `s3` are
placed. So the state is the pair `(i, j)`, and the last placed character must
have come from `s1[i-1]` or `s2[j-1]`.

## Approach

1. Quick check: if `len(s1) + len(s2) != len(s3)`, return `false`.
2. Let `dp[i][j]` = can `s1[:i]` and `s2[:j]` interleave into `s3[:i+j]`?
3. Transition:

   ```
   dp[i][j] = (dp[i-1][j] and s1[i-1] == s3[i+j-1])     # take from s1
           or (dp[i][j-1] and s2[j-1] == s3[i+j-1])     # take from s2
   ```

4. Answer is `dp[m][n]`.
5. **Space optimisation:** row `i` uses only row `i-1` and the current row's
   left neighbour, so collapse to a single 1-D array of size `n + 1`.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Full 2-D table | `O(m · n)` | `O(m · n)` |
| Rolling row | `O(m · n)` | `O(n)` |
| Naive backtracking | exponential | — |

## Edge cases

- **Length mismatch** — impossible, `false` (checked first).
- **One source empty** — reduces to a plain equality test with the other.
- **Both empty** — `s3` must be empty too.
- **Ambiguous splits** — matching characters can come from either string; the
  `or` explores both without double-counting.

## Solution (`solution.py`)

```python
def is_interleave(s1: str, s2: str, s3: str) -> bool:
    m, n = len(s1), len(s2)
    if m + n != len(s3):
        return False
    dp = [False] * (n + 1)
    dp[0] = True
    for j in range(1, n + 1):
        dp[j] = dp[j - 1] and s2[j - 1] == s3[j - 1]
    for i in range(1, m + 1):
        dp[0] = dp[0] and s1[i - 1] == s3[i - 1]
        for j in range(1, n + 1):
            from_s1 = dp[j] and s1[i - 1] == s3[i + j - 1]
            from_s2 = dp[j - 1] and s2[j - 1] == s3[i + j - 1]
            dp[j] = from_s1 or from_s2
    return dp[n]
```

## How to run the tests

```bash
# built-in test cases (9 of them)
python3 run.py interleaving_string

# whole topic
python3 run.py 2d_dynamic

# your own case
python3 run.py interleaving_string -c '["aabcc", "dbbca", "aadbbcbcac"]'
```
